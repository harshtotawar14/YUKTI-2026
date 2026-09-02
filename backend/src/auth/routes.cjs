'use strict';

const {query,transaction}=require('../../../api/_lib/db.cjs');
const {sha256,randomToken,verifyPassword,bearerToken,sessionCookie,clearSessionCookie}=require('../../../api/_lib/security.cjs');
const {normalizeRole,publicUser}=require('../../../api/_lib/policy.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');

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

async function login(req,res){
  method(req,'POST');const data=body(req),identifier=clean(data.identifier,200).toLowerCase(),requestedRole=normalizeRole(data.role),password=clean(data.password,200);
  if(!identifier||!password)throw httpError(422,'Email and password are required.','LOGIN_INPUT');
  const keyHash=throttleKey(req,identifier);await assertNotBlocked(keyHash);
  const result=await query('SELECT * FROM users WHERE email=$1 AND active=true',[identifier]),user=result.rows[0];
  if(!user||!(await verifyPassword(password,user.password_hash))){const failure=await registerFailure(keyHash);if(failure.blockedUntil){const error=httpError(429,'Too many login attempts. Wait before retrying.','LOGIN_RATE_LIMIT');error.retryAfter=BLOCK_MINUTES*60;throw error;}throw httpError(401,'Email or password is incorrect.','INVALID_CREDENTIALS');}
  if(requestedRole&&normalizeRole(user.role)!==requestedRole){await registerFailure(keyHash);throw httpError(403,'This account does not have the selected role.','ROLE_MISMATCH');}
  await clearFailures(keyHash);const session=await createSession(user.id,Boolean(data.remember));res.setHeader('Set-Cookie',sessionCookie(session.raw,session.maxAge));
  return send(res,200,{ok:true,user:publicUser(user),demoToken:session.raw,authentication:'EVENT_SCOPED_DEMO_SESSION'});
}

async function me(req,res){method(req,'GET');const user=await authenticate(req);return send(res,200,{ok:true,user:publicUser(user)});}
async function logout(req,res){
  method(req,'POST');const token=bearerToken(req);if(token)await query('DELETE FROM sessions WHERE token_hash=$1',[sha256(token)]);res.setHeader('Set-Cookie',clearSessionCookie());return send(res,200,{ok:true});
}
async function bridge(req,res){
  method(req,'POST');const user=await authenticate(req);allow(user,['COOPERATIVE_ADMIN','FEDERATION_ADMIN']);const session=await createSession(user.id,false);return send(res,200,{ok:true,demoToken:session.raw,user:publicUser(user)});
}

async function handle(req,res,path){
  const supported=['auth/login','auth/me','connected/auth/me','auth/logout','connected/auth/logout','auth/session-bridge'].includes(path);
  if(!supported)return false;
  if(path==='auth/login'){await login(req,res);return true;}
  if(path==='auth/me'||path==='connected/auth/me'){await me(req,res);return true;}
  if(path==='auth/logout'||path==='connected/auth/logout'){await logout(req,res);return true;}
  if(path==='auth/session-bridge'){await bridge(req,res);return true;}
  return false;
}

module.exports={handle,throttleKey,clientAddress,MAX_FAILURES,WINDOW_MINUTES,BLOCK_MINUTES};
