import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const api=require('../api/index.js');
const {resetPool}=require('../api/_lib/db.cjs');
const {PUBLIC_DEMO_PASSWORD}=require('../api/_lib/demo-access.cjs');

function makeResponse(){
  const headers=new Map();
  let resolveDone;
  const done=new Promise(resolve=>{resolveDone=resolve;});
  return {
    statusCode:200,
    body:'',
    setHeader(name,value){headers.set(String(name).toLowerCase(),value);},
    getHeader(name){return headers.get(String(name).toLowerCase());},
    end(value=''){this.body=String(value??'');resolveDone();},
    headers,
    done
  };
}

function cookiePairs(setCookie){
  const values=Array.isArray(setCookie)?setCookie:setCookie?[setCookie]:[];
  return values.map(value=>String(value).split(';')[0]).filter(Boolean);
}

function applyCookies(jar,setCookie){
  for(const pair of cookiePairs(setCookie)){
    const index=pair.indexOf('=');
    const name=pair.slice(0,index),value=pair.slice(index+1);
    if(value)jar.set(name,value);else jar.delete(name);
  }
}

function cookieHeader(jar){return [...jar.entries()].map(([key,value])=>`${key}=${value}`).join('; ');}

async function call(path,{method='GET',jar=new Map(),token,body}={}){
  const headers={};
  const cookie=cookieHeader(jar);if(cookie)headers.cookie=cookie;
  if(token)headers.authorization=`Bearer ${token}`;
  const req={method,headers,url:`/api?path=${encodeURIComponent(path).replace(/%2F/g,'/')}`,body};
  const res=makeResponse();
  await api(req,res);await res.done;
  applyCookies(jar,res.getHeader('set-cookie'));
  let payload={};try{payload=res.body?JSON.parse(res.body):{};}catch{payload={raw:res.body};}
  return {status:res.statusCode,payload,headers:res.headers};
}

async function bootstrapVisitor(){
  const jar=new Map();
  const access=await call('auth/demo-access',{jar});
  assert.equal(access.status,200);
  assert.equal(access.payload.mode,'ISOLATED_VISITOR_WORKSPACE');
  assert.ok(jar.get('sanpaid_demo_workspace'));
  return jar;
}

async function login(jar,identifier,role){
  const response=await call('auth/login',{method:'POST',jar,body:{identifier,password:PUBLIC_DEMO_PASSWORD,role}});
  assert.equal(response.status,200,JSON.stringify(response.payload));
  assert.equal(response.payload.authentication,'ISOLATED_DEMO_WORKSPACE_SESSION');
  assert.ok(response.payload.demoToken);
  return response.payload.demoToken;
}

test('independent demo visitors cannot read or process each other bookings',async()=>{
  assert.ok(process.env.DATABASE_URL,'DATABASE_URL is required for the integration test.');
  const A=await bootstrapVisitor();
  const B=await bootstrapVisitor();
  assert.notEqual(A.get('sanpaid_demo_workspace'),B.get('sanpaid_demo_workspace'));

  const customerA=await login(A,'customer','CUSTOMER');
  const customerB=await login(B,'customer','CUSTOMER');

  const emptyA=await call('connected/snapshot',{jar:A,token:customerA});
  const emptyB=await call('connected/snapshot',{jar:B,token:customerB});
  assert.equal(emptyA.status,200);assert.equal(emptyB.status,200);
  assert.deepEqual(emptyA.payload.bookings,[]);
  assert.deepEqual(emptyB.payload.bookings,[]);

  const scheduledAt=new Date(Date.now()+30*60*1000).toISOString();
  const createdA=await call('connected/bookings',{method:'POST',jar:A,token:customerA,body:{service:'Electrician',zone:'Isolation A',address:'Visitor A address',problem:'Visitor A isolation test',scheduledAt,requestSource:'TEXT',requestLanguage:'en',emergency:false}});
  assert.equal(createdA.status,201,JSON.stringify(createdA.payload));
  const bookingA=Number(createdA.payload.id);assert.ok(bookingA>0);

  const afterA=await call('connected/snapshot',{jar:A,token:customerA});
  const stillEmptyB=await call('connected/snapshot',{jar:B,token:customerB});
  assert.equal(afterA.payload.bookings.length,1);
  assert.equal(Number(afterA.payload.bookings[0].id),bookingA);
  assert.deepEqual(stillEmptyB.payload.bookings,[]);

  const directRead=await call(`connected/customer/bookings/${bookingA}`,{jar:B,token:customerB});
  assert.equal(directRead.status,403);

  const workerA=await login(A,'worker-a','WORKER');
  const workerB=await login(B,'worker-a','WORKER');
  const offersA=await call('connected/worker/offers',{jar:A,token:workerA});
  const offersB=await call('connected/worker/offers',{jar:B,token:workerB});
  assert.equal(offersA.status,200);assert.equal(offersB.status,200);
  assert.ok(offersA.payload.some(item=>Number(item.bookingId)===bookingA));
  assert.ok(!offersB.payload.some(item=>Number(item.bookingId)===bookingA));

  const adminA=await login(A,'cooperative-admin','COOPERATIVE_ADMIN');
  const adminB=await login(B,'cooperative-admin','COOPERATIVE_ADMIN');
  const workspaceA=await call('cooperative-admin/workspace',{jar:A,token:adminA});
  const workspaceB=await call('cooperative-admin/workspace',{jar:B,token:adminB});
  assert.equal(workspaceA.status,200);assert.equal(workspaceB.status,200);
  assert.ok(workspaceA.payload.services.some(item=>Number(item.id)===bookingA));
  assert.ok(!workspaceB.payload.services.some(item=>Number(item.id)===bookingA));

  const createdB=await call('connected/bookings',{method:'POST',jar:B,token:customerB,body:{service:'Plumber',zone:'Isolation B',address:'Visitor B address',problem:'Visitor B isolation test',scheduledAt,requestSource:'TEXT',requestLanguage:'en',emergency:false}});
  assert.equal(createdB.status,201,JSON.stringify(createdB.payload));
  const bookingB=Number(createdB.payload.id);assert.ok(bookingB>0&&bookingB!==bookingA);
  const aCannotReadB=await call(`connected/customer/bookings/${bookingB}`,{jar:A,token:customerA});
  assert.equal(aCannotReadB.status,403);

  const C=await bootstrapVisitor();
  const customerC=await login(C,'customer','CUSTOMER');
  const emptyC=await call('connected/snapshot',{jar:C,token:customerC});
  assert.equal(emptyC.status,200);
  assert.deepEqual(emptyC.payload.bookings,[]);
});

test('logout clears the demo workspace so the same browser starts with an empty booking history',async()=>{
  assert.ok(process.env.DATABASE_URL,'DATABASE_URL is required for the integration test.');
  const jar=await bootstrapVisitor();
  const firstWorkspace=jar.get('sanpaid_demo_workspace');
  const token=await login(jar,'customer','CUSTOMER');
  const scheduledAt=new Date(Date.now()+30*60*1000).toISOString();
  const created=await call('connected/bookings',{method:'POST',jar,token,body:{service:'Electrician',zone:'Logout Reset',address:'Same browser address',problem:'Logout reset regression',scheduledAt,requestSource:'TEXT',requestLanguage:'en',emergency:false}});
  assert.equal(created.status,201,JSON.stringify(created.payload));
  const beforeLogout=await call('connected/snapshot',{jar,token});
  assert.equal(beforeLogout.payload.bookings.length,1);

  const logout=await call('connected/auth/logout',{method:'POST',jar,token});
  assert.equal(logout.status,200,JSON.stringify(logout.payload));
  assert.equal(jar.has('sanpaid_demo_workspace'),false,'Logout left the isolated demo workspace cookie behind.');

  const access=await call('auth/demo-access',{jar});
  assert.equal(access.status,200);
  const secondWorkspace=jar.get('sanpaid_demo_workspace');
  assert.ok(secondWorkspace);
  assert.notEqual(secondWorkspace,firstWorkspace,'Logout reused the previous isolated workspace.');

  const freshToken=await login(jar,'customer','CUSTOMER');
  const afterRelogin=await call('connected/snapshot',{jar,token:freshToken});
  assert.equal(afterRelogin.status,200);
  assert.deepEqual(afterRelogin.payload.bookings,[],'Old booking reappeared after logout and login in the same browser.');
});

test.after(async()=>{await resetPool();});
