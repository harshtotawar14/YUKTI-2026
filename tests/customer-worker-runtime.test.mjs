import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function storage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};}
function runtime(){
 const sessionStorage=storage(),localStorage=storage();
 const document={documentElement:{dataset:{}},hidden:false,addEventListener(){},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return [];}};
 const window={fetch:async()=>new Response('{}'),addEventListener(){},dispatchEvent(){},SanPaidCustomerWorkerDashboard:{requestRefresh(){}}};
 const context=vm.createContext({window,document,sessionStorage,localStorage,location:{origin:'https://sanpaid.test',href:'https://sanpaid.test/'},Headers,Response,URL,Request,Blob,Date,console,Math,Uint8Array,atob,btoa,CustomEvent:class{},MutationObserver:class{observe(){}},requestAnimationFrame(){},setTimeout(){},clearTimeout(){}});
 for(const file of ['review-runtime.js','selection-demo-runtime.js','selection-integrity-v2.js','selection-judge-integrity-v3.js'])vm.runInContext(readFileSync(new URL('../'+file,import.meta.url),'utf8'),context);
 function role(persona='CUSTOMER'){const account={role:persona==='CUSTOMER'?'CUSTOMER':'WORKER',persona,name:persona};sessionStorage.setItem('sanpaid_sih_review_sessions_v1',JSON.stringify({test:account}));sessionStorage.setItem('sanpaid_sih_review_active_token_v1','test');}
 async function request(path,body){const r=await window.fetch('/api/'+path,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
 return {window,sessionStorage,localStorage,role,request};
}
const booking={service:'Electrician',zone:'Kolhapur',address:'Test address',problem:'Test electrical work',scheduledAt:new Date(Date.now()+86400000).toISOString()};
test('new visitor has no seeded customer booking, support or worker earnings',async()=>{
 const r=runtime();r.role();assert.equal((await r.request('connected/snapshot')).data.bookings.length,0);assert.equal((await r.request('connected/customer/support')).data.requests.length,0);
 r.role('WORKER_A');assert.equal((await r.request('connected/worker/offers')).data.length,0);assert.equal((await r.request('connected/worker/dashboard')).data.earnings.total,0);
});
test('emergency schedules now, persists across reload and stays out of other visitors',async()=>{
 const a=runtime();a.role();const start=Date.now();const created=await a.request('connected/bookings',{...booking,emergency:true});assert.equal(created.status,200);assert.equal(created.data.emergency,true);assert.ok(Math.abs(new Date(created.data.scheduledAt)-start)<2000);
 const snap=await a.request('connected/snapshot');assert.equal(snap.data.bookings[0].id,created.data.id);
 const b=runtime();b.role();assert.equal((await b.request('connected/snapshot')).data.bookings.length,0);
});
test('invalid service and past schedule rejected without manufacturing success',async()=>{
 const r=runtime();r.role();assert.equal((await r.request('connected/bookings',{...booking,service:'invalid'})).status,422);assert.equal((await r.request('connected/bookings',{...booking,scheduledAt:'2020-01-01'})).status,422);
});
test('active booking cannot be silently replaced',async()=>{
 const r=runtime();r.role();const created=await r.request('connected/bookings',booking);assert.equal((await r.request('connected/bookings',booking)).status,409);assert.equal((await r.request('connected/snapshot')).data.bookings[0].id,created.data.id);
});
test('customer and worker endpoint guards apply to reads and writes',async()=>{
 const r=runtime();r.role();assert.equal((await r.request('connected/worker/dashboard')).status,403);assert.equal((await r.request('connected/worker/availability',{available:false})).status,403);
 r.role('WORKER_A');assert.equal((await r.request('connected/customer/support')).status,403);assert.equal((await r.request('connected/customer/support',{description:'forbidden'})).status,403);
});
test('worker consent is single use, wrong booking IDs and unassigned actions fail',async()=>{
 const r=runtime();r.role();const b=(await r.request('connected/bookings',booking)).data;r.role('WORKER_A');const offers=(await r.request('connected/worker/offers')).data;assert.equal(offers.length,1);const o=offers[0];
 assert.ok([403,409].includes((await r.request(`connected/jobs/${b.id}/travel`,{})).status));
 assert.equal((await r.request(`connected/worker/offers/${o.offerId}/respond`,{action:'ACCEPT'})).status,200);
 assert.equal((await r.request(`connected/worker/offers/${o.offerId}/respond`,{action:'ACCEPT'})).status,409);
 assert.equal((await r.request(`connected/jobs/999/travel`,{})).status,404);
});
test('schedule command uses entered times and persists overlap changes',async()=>{
 const r=runtime();r.role('WORKER_A');const date='2026-10-20';const plan=(await r.request('connected/worker/schedule/voice-intent',{text:'I am unavailable from 10 AM to 2 PM',date})).data;
 assert.equal(plan.startTime,'10:00');assert.equal(plan.endTime,'14:00');assert.equal(plan.date,date);assert.equal(plan.status,'UNAVAILABLE');
 assert.equal((await r.request('connected/worker/schedule',plan)).status,200);
 const schedule=(await r.request(`connected/worker/schedule?date=${date}`)).data;assert.ok(schedule.slots.some(s=>s.startTime==='10:00'&&s.endTime==='14:00'&&s.status==='UNAVAILABLE'));
 assert.equal((await r.request('connected/worker/schedule/voice-intent',{text:'hello',date})).status,422);
 assert.equal((await r.request('connected/worker/schedule',{date,startTime:'17:00',endTime:'13:00',status:'AVAILABLE'})).status,422);
});
