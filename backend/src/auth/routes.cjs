'use strict';

const {query,transaction}=require('../../../api/_lib/db.cjs');
const {sha256,randomToken,verifyPassword,bearerToken,sessionCookie,clearSessionCookie}=require('../../../api/_lib/security.cjs');
const {normalizeRole,publicUser}=require('../../../api/_lib/policy.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');
const {DEMO_ACCOUNTS,DEMO_EMAILS,resolveLoginIdentifier,isPublicDemoCredential,publicDemoPayload}=require('../../../api/_lib/demo-access.cjs');
const {ensureWorkspaceToken,workspaceKeyFromToken,scopedDemoEmail,canonicalDemoEmail,isScopedDemoEmail,appendSetCookie}=require('../../../api/_lib/demo-workspace.cjs');

const MAX_FAILURES=8;
const WINDOW_MINUTES=15;
const BLOCK_MINUTES=15;

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}
function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function clientAddress(req){return clean(String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0],120)||'unknown';}
function throttleKey(req,identifier){return sha256(`${clientAddress(req)}|${String(identifier).toLowerCase()}`);}

async function assertNotBlocked(keyHash){
  const row=(await query('SELECT failure_count,window_started_at,blocked_until FROM auth_login_throttle WHERE key_hash=$1',[keyHash])).rows[0];
  if(row?.blocked_until&&new Date(row.blocked_until)>new Date()){
    const retryAfter=Math.max(1,Math.ceil((new Date(row.blocked_until).getTime()-Date.now())/1000));
    const error=httpError(429,'Too many login attempts. Wait before retrying.','LOGIN_RATE_LIMIT');error.retryAfter=retryAfter;throw error;
  }
  return row||null;
}

async function registerFailure(keyHash){
  return transaction(async client=>{
    const row=(await client.query('SELECT * FROM auth_login_throttle WHERE key_hash=$1 FOR UPDATE',[keyHash])).rows[0],now=Date.now(),windowMs=WINDOW_MINUTES*60*1000;
    let count=1,windowStarted=new Date(now),blockedUntil=null;
    if(row&&now-new Date(row.window_started_at).getTime()<=windowMs){count=Number(row.failure_count)+1;windowStarted=new Date(row.window_started_at);}
    if(count>=MAX_FAILURES)blockedUntil=new Date(now+BLOCK_MINUTES*60*1000);
    await client.query(`INSERT INTO auth_login_throttle(key_hash,failure_count,window_started_at,blocked_until,updated_at)
      VALUES($1,$2,$3,$4,now()) ON CONFLICT(key_hash) DO UPDATE SET failure_count=EXCLUDED.failure_count,window_started_at=EXCLUDED.window_started_at,blocked_until=EXCLUDED.blocked_until,updated_at=now()`,[keyHash,count,windowStarted.toISOString(),blockedUntil?.toISOString()||null]);
    return {count,blockedUntil};
  });
}

async function clearFailures(keyHash){await query('DELETE FROM auth_login_throttle WHERE key_hash=$1',[keyHash]);}

async function createSession(userId,remember=false){
  const raw=randomToken(32),days=remember?7:1,maxAge=days*86400;
  await transaction(async client=>{
    await client.query('DELETE FROM sessions WHERE expires_at<=now()');
    await client.query("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+($3||' days')::interval)",[userId,sha256(raw),String(days)]);
  });
  return {raw,maxAge};
}

async function provisionDemoWorkspace(client,workspaceKey){
  const canonicalUsers=(await client.query('SELECT * FROM users WHERE email=ANY($1::text[]) AND active=true',[DEMO_EMAILS])).rows;
  if(canonicalUsers.length<DEMO_ACCOUNTS.length)throw httpError(503,'Public review accounts are not initialized.','DEMO_ACCOUNT_UNAVAILABLE');
  const sourceByEmail=Object.fromEntries(canonicalUsers.map(row=>[String(row.email).toLowerCase(),row]));
  const sourceCoop=(await client.query("SELECT id,region FROM cooperatives WHERE code='YUKTI-01' ORDER BY id LIMIT 1")).rows[0];
  if(!sourceCoop)throw httpError(503,'Demo cooperative is not initialized.','DEMO_COOPERATIVE_UNAVAILABLE');
  const workspaceCoop=(await client.query(`INSERT INTO cooperatives(name,code,region) VALUES($1,$2,$3)
    ON CONFLICT(code) DO UPDATE SET region=EXCLUDED.region RETURNING id`,[`YUKTI Kolhapur Services Cooperative · ${workspaceKey}`,`DWS-${workspaceKey}`,sourceCoop.region])).rows[0];
  const users=Object.create(null);
  for(const account of DEMO_ACCOUNTS){
    const source=sourceByEmail[account.email];
    const email=scopedDemoEmail(account.email,workspaceKey);
    const user=(await client.query(`INSERT INTO users(email,name,role,password_hash,cooperative_id,active) VALUES($1,$2,$3,$4,$5,true)
      ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,role=EXCLUDED.role,password_hash=EXCLUDED.password_hash,cooperative_id=EXCLUDED.cooperative_id,active=true
      RETURNING *`,[email,account.name,account.role,source.password_hash,workspaceCoop.id])).rows[0];
    users[account.email]=user;
    if(account.role==='WORKER'){
      const sourceWorker=(await client.query('SELECT w.* FROM workers w WHERE w.user_id=$1',[source.id])).rows[0];
      if(!sourceWorker)throw httpError(503,'Demo worker profile is not initialized.','DEMO_WORKER_UNAVAILABLE');
      const worker=(await client.query(`INSERT INTO workers(user_id,cooperative_id,identity_status,availability_status,rating,completed_jobs,demo_distance_km)
        VALUES($1,$2,$3,$4,$5,0,$6)
        ON CONFLICT(user_id) DO UPDATE SET cooperative_id=EXCLUDED.cooperative_id,identity_status=EXCLUDED.identity_status,availability_status=EXCLUDED.availability_status,rating=EXCLUDED.rating,demo_distance_km=EXCLUDED.demo_distance_km,updated_at=now()
        RETURNING id`,[user.id,workspaceCoop.id,sourceWorker.identity_status,sourceWorker.availability_status,sourceWorker.rating,sourceWorker.demo_distance_km])).rows[0];
      await client.query(`INSERT INTO worker_skills(worker_id,service_id,status)
        SELECT $1,ws.service_id,ws.status FROM worker_skills ws WHERE ws.worker_id=$2
        ON CONFLICT(worker_id,service_id) DO UPDATE SET status=EXCLUDED.status`,[worker.id,sourceWorker.id]);
    }
  }
  return users;
}

async function createPublicDemoSession(req,res,canonicalEmail,remember=false){
  const workspaceToken=ensureWorkspaceToken(req,res);
  const workspaceKey=workspaceKeyFromToken(workspaceToken);
  if(!workspaceKey)throw httpError(500,'Demo workspace could not be established.','DEMO_WORKSPACE_ERROR');
  const raw=randomToken(32),days=remember?7:1,maxAge=days*86400;
  const user=await transaction(async client=>{
    await client.query('DELETE FROM sessions WHERE expires_at<=now()');
    const users=await provisionDemoWorkspace(client,workspaceKey);
    const scoped=users[canonicalEmail];
    if(!scoped)throw httpError(503,'Public review account is unavailable in this workspace.','DEMO_ACCOUNT_UNAVAILABLE');
    await client.query("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+($3||' days')::interval)",[scoped.id,sha256(raw),String(days)]);
    return scoped;
  });
  return {raw,maxAge,user,workspaceKey};
}

function publicDemoUser(row){
  const out=publicUser(row);
  if(isScopedDemoEmail(row?.email))out.email=canonicalDemoEmail(row.email)||out.email;
  return out;
}

async function login(req,res){
  method(req,'POST');
  const data=body(req),submittedIdentifier=clean(data.identifier,200).toLowerCase(),identifier=resolveLoginIdentifier(submittedIdentifier),requestedRole=normalizeRole(data.role),password=clean(data.password,200);
  if(!submittedIdentifier||!password)throw httpError(422,'Access ID and password are required.','LOGIN_INPUT');

  const publicDemoAccess=isPublicDemoCredential(submittedIdentifier,password);
  if(publicDemoAccess){
    const account=DEMO_ACCOUNTS.find(item=>item.email===identifier);
    if(!account)throw httpError(401,'Access ID or password is incorrect.','INVALID_CREDENTIALS');
    if(requestedRole&&normalizeRole(account.role)!==requestedRole)throw httpError(403,'This account does not have the selected role.','ROLE_MISMATCH');
    const session=await createPublicDemoSession(req,res,identifier,Boolean(data.remember));
    appendSetCookie(res,sessionCookie(session.raw,session.maxAge));
    return send(res,200,{ok:true,user:publicDemoUser(session.user),demoToken:session.raw,authentication:'ISOLATED_DEMO_WORKSPACE_SESSION'});
  }

  const keyHash=throttleKey(req,identifier);
  await assertNotBlocked(keyHash);
  const result=await query('SELECT * FROM users WHERE email=$1 AND active=true',[identifier]),user=result.rows[0];
  if(!user||!(await verifyPassword(password,user.password_hash))){
    const failure=await registerFailure(keyHash);
    if(failure.blockedUntil){const error=httpError(429,'Too many login attempts. Wait before retrying.','LOGIN_RATE_LIMIT');error.retryAfter=BLOCK_MINUTES*60;throw error;}
    throw httpError(401,'Access ID or password is incorrect.','INVALID_CREDENTIALS');
  }
  if(requestedRole&&normalizeRole(user.role)!==requestedRole){await registerFailure(keyHash);throw httpError(403,'This account does not have the selected role.','ROLE_MISMATCH');}
  await clearFailures(keyHash);
  const session=await createSession(user.id,Boolean(data.remember));
  res.setHeader('Set-Cookie',sessionCookie(session.raw,session.maxAge));
  return send(res,200,{ok:true,user:publicUser(user),demoToken:session.raw,authentication:'EVENT_SCOPED_SESSION'});
}

async function me(req,res){method(req,'GET');const user=await authenticate(req);return send(res,200,{ok:true,user:isScopedDemoEmail(user.email)?publicDemoUser(user):publicUser(user)});}
async function logout(req,res){
  method(req,'POST');const token=bearerToken(req);if(token)await query('DELETE FROM sessions WHERE token_hash=$1',[sha256(token)]);res.setHeader('Set-Cookie',clearSessionCookie());return send(res,200,{ok:true});
}
async function bridge(req,res){
  method(req,'POST');const user=await authenticate(req);allow(user,['COOPERATIVE_ADMIN','FEDERATION_ADMIN']);const session=await createSession(user.id,false);return send(res,200,{ok:true,demoToken:session.raw,user:isScopedDemoEmail(user.email)?publicDemoUser(user):publicUser(user)});
}

async function handle(req,res,path){
  const supported=['auth/demo-access','auth/login','auth/me','connected/auth/me','auth/logout','connected/auth/logout','auth/session-bridge'].includes(path);
  if(!supported)return false;
  if(path==='auth/demo-access'){method(req,'GET');ensureWorkspaceToken(req,res);send(res,200,publicDemoPayload());return true;}
  if(path==='auth/login'){await login(req,res);return true;}
  if(path==='auth/me'||path==='connected/auth/me'){await me(req,res);return true;}
  if(path==='auth/logout'||path==='connected/auth/logout'){await logout(req,res);return true;}
  if(path==='auth/session-bridge'){await bridge(req,res);return true;}
  return false;
}

module.exports={handle,throttleKey,clientAddress,MAX_FAILURES,WINDOW_MINUTES,BLOCK_MINUTES,provisionDemoWorkspace};
