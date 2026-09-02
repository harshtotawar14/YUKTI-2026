const base=(process.env.SANPAID_PRODUCTION_URL||'https://yukti-2026-brown.vercel.app').replace(/\/$/,'');
const password=process.env.SANPAID_E2E_PASSWORD||'';

function assert(condition,message){if(!condition)throw new Error(message);}
async function request(path,{method='GET',token,body,expected}={}){
  const headers={'accept':'application/json'};
  if(token)headers.authorization=`Bearer ${token}`;
  if(body!==undefined)headers['content-type']='application/json';
  const response=await fetch(`${base}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'follow'});
  let payload={};
  const text=await response.text();
  try{payload=text?JSON.parse(text):{};}catch{payload={raw:text};}
  if(expected!==undefined){
    const allowed=Array.isArray(expected)?expected:[expected];
    assert(allowed.includes(response.status),`${method} ${path} expected ${allowed.join('/')} but got ${response.status}: ${JSON.stringify(payload)}`);
  }else assert(response.ok,`${method} ${path} failed ${response.status}: ${JSON.stringify(payload)}`);
  return {status:response.status,payload};
}

async function login(identifier,role){
  const {payload}=await request('/api/auth/login',{method:'POST',body:{identifier,password,role},expected:200});
  assert(payload.ok===true&&payload.demoToken,`Login failed for ${role}`);
  return payload.demoToken;
}

console.log(`SanPaid production E2E target: ${base}`);

const health=(await request('/api/connected/health',{expected:200})).payload;
assert(health.ok===true&&health.source==='DATABASE_CONFIGURATION'&&Number(health.services)>=10,'Health/database contract invalid.');
const catalog=(await request('/api/public/services',{expected:200})).payload;
assert(catalog.ok===true&&catalog.source==='DATABASE_CONFIGURATION'&&Array.isArray(catalog.services)&&catalog.services.length>=10,'Catalog contract invalid.');
const proof=(await request('/api/public-proof/summary',{expected:200})).payload;
assert(proof.ok===true&&Number(proof.workers)>=2&&Number(proof.cooperatives)>=1,'Public proof contract invalid.');
await request('/api/connected/snapshot',{expected:401});
console.log('Public contracts + auth guard: PASS');

if(!password){
  console.log('Authenticated E2E skipped: SANPAID_E2E_PASSWORD is not configured in this runner.');
  process.exit(0);
}

const customer=await login('customer.connected@sanpaid.demo','CUSTOMER');
const worker1=await login('worker1.connected@sanpaid.demo','WORKER');
const worker2=await login('worker2.connected@sanpaid.demo','WORKER');
const admin=await login('admin.connected@sanpaid.demo','COOPERATIVE_ADMIN');
const federation=await login('federation.connected@sanpaid.demo','FEDERATION_ADMIN');
console.log('All role logins: PASS');

await request('/api/connected/worker/availability',{method:'POST',token:worker1,body:{available:true},expected:200});
await request('/api/connected/worker/availability',{method:'POST',token:worker2,body:{available:true},expected:200});

const scheduledAt=new Date(Date.now()+10*60*1000).toISOString();
const created=(await request('/api/connected/bookings',{method:'POST',token:customer,body:{service:'Electrician',zone:'YUKTI E2E Zone',address:'SIH production E2E test address',problem:'Production E2E electrical service validation',scheduledAt,requestSource:'TEXT',requestLanguage:'en',emergency:false},expected:201})).payload;
const bookingId=Number(created.id);
assert(bookingId>0&&created.status==='OFFERING','Booking creation contract invalid.');
console.log(`Booking created: ${created.bookingCode}`);

const offers1=(await request('/api/connected/worker/offers',{token:worker1,expected:200})).payload;
const offers2=(await request('/api/connected/worker/offers',{token:worker2,expected:200})).payload;
const first1=Array.isArray(offers1)?offers1.find(x=>Number(x.bookingId)===bookingId&&x.offerStatus==='PENDING'):null;
const first2=Array.isArray(offers2)?offers2.find(x=>Number(x.bookingId)===bookingId&&x.offerStatus==='PENDING'):null;
assert(Boolean(first1)!==Boolean(first2),'Expected exactly one initial worker offer.');
const rejectingToken=first1?worker1:worker2;
const acceptingToken=first1?worker2:worker1;
const rejectingOffer=first1||first2;
await request(`/api/connected/worker/offers/${rejectingOffer.offerId}/respond`,{method:'POST',token:rejectingToken,body:{action:'REJECT',reason:'E2E fallback validation'},expected:200});

const fallbackOffers=(await request('/api/connected/worker/offers',{token:acceptingToken,expected:200})).payload;
const fallback=fallbackOffers.find(x=>Number(x.bookingId)===bookingId&&x.offerStatus==='PENDING');
assert(fallback,'Fallback worker offer was not created.');
await request(`/api/connected/worker/offers/${fallback.offerId}/respond`,{method:'POST',token:acceptingToken,body:{action:'ACCEPT'},expected:200});
console.log('Worker reject -> fallback -> accept: PASS');

await request(`/api/connected/jobs/${bookingId}/travel`,{method:'POST',token:acceptingToken,body:{},expected:200});
await request(`/api/connected/jobs/${bookingId}/arrive`,{method:'POST',token:acceptingToken,body:{},expected:200});
const identity=(await request(`/api/connected/jobs/${bookingId}/identity`,{method:'POST',token:acceptingToken,body:{},expected:200})).payload;
assert(identity.token,'Identity step did not return a one-time token.');
await request(`/api/connected/service-start/${encodeURIComponent(identity.token)}`,{token:customer,expected:200});
await request(`/api/connected/service-start/${encodeURIComponent(identity.token)}/confirm`,{method:'POST',token:customer,body:{},expected:200});
await request(`/api/connected/jobs/${bookingId}/start`,{method:'POST',token:acceptingToken,body:{},expected:200});
console.log('Travel -> arrival -> identity -> customer confirm -> start: PASS');

const charge=(await request(`/api/connected/worker/jobs/${bookingId}/extra-charge`,{method:'POST',token:acceptingToken,body:{workItem:'E2E replacement component',reason:'Production E2E additional charge approval',amount:50},expected:201})).payload;
assert(charge.charge?.id,'Extra charge was not created.');
const charges=(await request(`/api/connected/customer/bookings/${bookingId}/charges`,{token:customer,expected:200})).payload;
const pending=charges.find(x=>Number(x.id)===Number(charge.charge.id));
assert(pending&&pending.status==='PENDING','Customer did not receive pending extra charge.');
await request(`/api/connected/customer/charges/${pending.id}/decision`,{method:'POST',token:customer,body:{decision:'APPROVE'},expected:200});
console.log('Additional charge approval: PASS');

await request(`/api/connected/jobs/${bookingId}/completion-request`,{method:'POST',token:acceptingToken,body:{},expected:200});
await request(`/api/connected/customer/bookings/${bookingId}/complete`,{method:'POST',token:customer,body:{},expected:200});
const beforePay=(await request(`/api/connected/customer/bookings/${bookingId}/checkout`,{token:customer,expected:200})).payload;
assert(beforePay.status==='COMPLETED'&&Number(beforePay.approvedAdditional)===50,'Checkout before payment is invalid.');
const paid=(await request(`/api/connected/customer/bookings/${bookingId}/pay`,{method:'POST',token:customer,body:{method:'SANDBOX_E2E'},expected:200})).payload;
assert(paid.ok===true&&paid.payment?.sandbox===true&&paid.invoice?.invoiceNumber,'Payment/invoice contract invalid.');
const afterPay=(await request(`/api/connected/customer/bookings/${bookingId}/checkout`,{token:customer,expected:200})).payload;
assert(afterPay.status==='PAID'&&afterPay.payment&&afterPay.invoice,'Paid checkout did not persist.');
await request(`/api/connected/customer/bookings/${bookingId}/rating`,{method:'POST',token:customer,body:{stars:5,feedback:'Automated SIH production E2E validation'},expected:201});
console.log('Completion -> sandbox payment -> invoice -> rating: PASS');

const timeline=(await request(`/api/connected/customer/bookings/${bookingId}/timeline`,{token:customer,expected:200})).payload.timeline||[];
const states=timeline.map(x=>x.status);
for(const required of ['OFFERING','FINDING_REPLACEMENT','ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'])assert(states.includes(required),`Timeline missing ${required}`);
console.log('Persistent booking timeline: PASS');

const adminWorkspace=(await request('/api/cooperative-admin/workspace',{token:admin,expected:200})).payload;
assert(adminWorkspace.ok===true&&adminWorkspace.bookings.some(x=>Number(x.id)===bookingId),'Cooperative Admin cannot see E2E booking.');
const readiness=(await request('/api/connected/judge/readiness',{token:federation,expected:200})).payload;
assert(readiness.ok===true&&readiness.ready===true,'Federation/judge readiness failed.');
await request('/api/connected/judge/overview',{token:federation,expected:200});
await request('/api/connected/judge/planning',{token:federation,expected:200});
await request('/api/connected/judge/workforce-intelligence',{token:federation,expected:200});
console.log('Cooperative Admin + Federation/Judge views: PASS');

for(const token of [customer,worker1,worker2,admin,federation])await request('/api/auth/logout',{method:'POST',token,body:{},expected:200});
console.log('Logout/session cleanup: PASS');
console.log('FULL SANPAID PRODUCTION E2E: PASS');
