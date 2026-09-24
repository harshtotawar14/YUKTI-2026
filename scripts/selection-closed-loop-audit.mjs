import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4182;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function waitServer(){for(let i=0;i<30;i++){try{if((await fetch(`http://127.0.0.1:${port}/`)).ok)return;}catch{}await sleep(200);}throw new Error('Audit server did not start.');}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.setDefaultTimeout(10000);
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(400);

  const result=await page.evaluate(async()=>{
    const api=async(path,{method='GET',body}={})=>{
      const response=await fetch(path,{method,cache:'no-store',credentials:'include',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
      const data=await response.json().catch(()=>({}));
      return{status:response.status,ok:response.ok,data};
    };
    const must=async(path,options)=>{const r=await api(path,options);if(!r.ok)throw new Error(`${path} failed ${r.status}: ${r.data.message||r.data.error||'unknown'}`);return r.data;};
    const login=async(identifier,role)=>must('/api/auth/login',{method:'POST',body:{identifier,password:'audit-pass',role,remember:false}});

    window.SanPaidSelectionDemo?.reset?.();
    await new Promise(r=>setTimeout(r,60));

    await login('customer','CUSTOMER');
    const booking=await must('/api/connected/bookings',{method:'POST',body:{service:'Electrician',zone:'Rajarampuri, Kolhapur',address:'Rajarampuri, Kolhapur',problem:'Switchboard sparking during the selection audit.',requestSource:'TEXT',requestLanguage:'en',scheduledAt:new Date(Date.now()+86400000).toISOString(),emergency:false}});
    const bookingId=Number(booking.id);
    let state=window.SanPaidSelectionDemo.state();
    if(state.offers.length!==1||state.offers[0].workerPersona!=='WORKER_A')throw new Error('Local-first offer must contain only the Kolhapur worker before capacity exchange.');
    if(state.booking.homeCooperative!=='YUKTI Kolhapur Services Cooperative')throw new Error('Booking home cooperative is not Kolhapur.');

    await login('worker-a','WORKER');
    const localOffers=await must('/api/connected/worker/offers');
    if(localOffers.length!==1)throw new Error('Worker A should receive exactly one local opportunity.');
    await must(`/api/connected/worker/offers/${localOffers[0].offerId}/respond`,{method:'POST',body:{action:'REJECT'}});
    state=window.SanPaidSelectionDemo.state();
    if(state.booking.status!=='NO_WORKER_AVAILABLE')throw new Error('Local decline did not produce the shortage state.');
    const request=state.capacityRequests.find(x=>Number(x.bookingId)===bookingId);
    if(!request)throw new Error('Shortage did not create a booking-linked capacity request.');
    if(state.selectionMeta.shortageSignals.length!==1)throw new Error('Shortage signal was not recorded exactly once.');

    await login('federation-admin','FEDERATION_ADMIN');
    const premature=await api(`/api/federation/capacity-requests/${request.id}/approve`,{method:'POST',body:{homeCooperativeSharePercent:50,servingCooperativeSharePercent:50}});
    if(premature.status!==409||premature.data.error!=='WORKER_CONSENT_REQUIRED')throw new Error('Federation authorization was not blocked before worker consent.');
    await must(`/api/federation/capacity-requests/${request.id}/offer-provider`,{method:'POST',body:{providingCooperativeId:2}});

    await login('worker-b','WORKER');
    const capacityOffers=await must('/api/connected/worker/capacity-offers');
    const cap=capacityOffers.find(x=>Number(x.requestId)===Number(request.id));
    if(!cap||cap.providingCooperative!=='YUKTI Panhala Worker Cooperative')throw new Error('Panhala capacity offer was not delivered to Worker B.');
    await must(`/api/connected/worker/capacity-offers/${cap.offerId}/respond`,{method:'POST',body:{action:'ACCEPT'}});

    await login('federation-admin','FEDERATION_ADMIN');
    await must(`/api/federation/capacity-requests/${request.id}/approve`,{method:'POST',body:{homeCooperativeSharePercent:50,servingCooperativeSharePercent:50}});
    state=window.SanPaidSelectionDemo.state();
    if(Number(state.booking.id)!==bookingId)throw new Error('Capacity exchange changed the original Booking ID.');
    if(!state.booking.crossCoop||state.booking.workerName!=='Ravi Kumar'||!state.booking.assignmentId)throw new Error('Authorized cross-cooperative assignment is incomplete.');
    if(!state.offers.some(x=>x.workerPersona==='WORKER_B'&&x.offerStatus==='ACCEPTED'&&x.assignmentId===state.booking.assignmentId))throw new Error('Cross-coop worker did not receive an accepted current-job record.');

    await login('worker-b','WORKER');
    await must(`/api/connected/worker/jobs/${bookingId}/estimate`,{method:'POST',body:{items:[{description:'Switchboard repair and testing',amount:650}],note:'Approved work scope'}});
    await login('customer','CUSTOMER');
    await must(`/api/connected/customer/bookings/${bookingId}/estimate/decision`,{method:'POST',body:{decision:'APPROVE'}});
    state=window.SanPaidSelectionDemo.state();
    if(Number(state.booking.total)!==650)throw new Error('Approved estimate did not update the payable booking amount.');

    const earlyPay=await api(`/api/connected/customer/bookings/${bookingId}/pay`,{method:'POST',body:{method:'SANDBOX'}});
    if(earlyPay.status!==409)throw new Error('Payment was not blocked before completion.');

    await login('worker-b','WORKER');
    await must(`/api/connected/jobs/${bookingId}/travel`,{method:'POST'});
    await must(`/api/connected/jobs/${bookingId}/arrive`,{method:'POST'});
    const identity=await must(`/api/connected/jobs/${bookingId}/identity`,{method:'POST'});
    if(!identity.token)throw new Error('Service-start verification token was not created.');

    await login('customer','CUSTOMER');
    await must(`/api/connected/service-start/${encodeURIComponent(identity.token)}/confirm`,{method:'POST'});
    await login('worker-b','WORKER');
    await must(`/api/connected/jobs/${bookingId}/start`,{method:'POST'});
    await must(`/api/connected/jobs/${bookingId}/completion-request`,{method:'POST'});
    await login('customer','CUSTOMER');
    await must(`/api/connected/customer/bookings/${bookingId}/complete`,{method:'POST'});
    const paid=await must(`/api/connected/customer/bookings/${bookingId}/pay`,{method:'POST',body:{method:'SANDBOX'}});
    if(Number(paid.payment?.amount)!==650||Number(paid.invoice?.amount)!==650)throw new Error('Payment/invoice amount does not match the approved estimate.');
    await must(`/api/connected/customer/bookings/${bookingId}/rating`,{method:'POST',body:{stars:5,feedback:'Professional and clearly explained service.'}});
    await must('/api/connected/customer/support',{method:'POST',body:{bookingId,category:'Service Quality',description:'Audit complaint to verify cooperative ownership and federation escalation visibility.'}});

    state=window.SanPaidSelectionDemo.state();
    const feedback=state.selectionMeta.workerFeedback.find(x=>Number(x.bookingId)===bookingId);
    const outcome=state.selectionMeta.serviceOutcomes.find(x=>Number(x.bookingId)===bookingId);
    const complaint=state.complaints.find(x=>Number(x.bookingId)===bookingId);
    if(!feedback||feedback.workerName!=='Ravi Kumar')throw new Error('Customer rating did not reach the assigned worker record.');
    if(!outcome||Number(outcome.amount)!==650)throw new Error('Completed service outcome was not recorded for planning.');
    if(!complaint||Number(complaint.escalationLevel)!==3||!String(complaint.owner).includes('Federation'))throw new Error('Cross-coop complaint governance is incomplete.');

    await login('cooperative-admin','COOPERATIVE_ADMIN');
    let workspace=await must('/api/cooperative-admin/workspace');
    if(workspace.workers.length!==2||workspace.metrics.totalWorkers!==2)throw new Error('Kolhapur Cooperative Admin scope is not limited to local workers.');
    if(Number(workspace.metrics.recordedPayments)!==650)throw new Error('Cooperative recorded payment KPI is not the rupee ledger amount.');
    if(!workspace.skills.length||workspace.skills.some(x=>typeof x.verifiedWorkers!=='number'))throw new Error('Cooperative skill/capacity rows are not aggregated consistently.');
    if(!workspace.complaints.some(x=>Number(x.bookingId)===bookingId))throw new Error('Customer complaint is missing from Cooperative Admin.');
    await must('/api/cooperative-admin/workers/13/verification',{method:'POST',body:{status:'VERIFIED',reason:'Audit verification note'}});
    workspace=await must('/api/cooperative-admin/workspace');
    if(workspace.metrics.verifiedWorkers!==2)throw new Error('Worker onboarding verification did not update local KPI.');

    await login('federation-admin','FEDERATION_ADMIN');
    const overview=await must('/api/connected/judge/overview');
    const planning=await must('/api/connected/judge/planning');
    const intelligence=await must('/api/connected/judge/workforce-intelligence');
    if(overview.cooperatives.length!==2||overview.metrics.connectedCooperatives!==2)throw new Error('Federation network totals do not match the controlled demo network.');
    if(overview.metrics.crossCoopAssignments!==1||overview.metrics.shortageSignals!==1)throw new Error('Federation KPI loop is not connected to the journey.');
    if(planning.evidence?.shortageSignals!==1||planning.evidence?.completedServiceOutcomes!==1)throw new Error('Demand-to-workforce planning does not use the completed journey evidence.');
    if(!String(planning.forecastMethod).includes('Human-reviewed forecasting (pilot)'))throw new Error('Planning truth label is missing.');
    if(!intelligence.capacity?.rows?.length)throw new Error('Federation workforce intelligence capacity row is missing.');

    return{bookingId,assignmentId:state.booking.assignmentId,invoiceAmount:paid.invoice.amount,localWorkers:workspace.metrics.totalWorkers,connectedCooperatives:overview.metrics.connectedCooperatives,shortageSignals:planning.evidence.shortageSignals,completedOutcomes:planning.evidence.completedServiceOutcomes};
  });

  assert(result.bookingId>0,'Booking ID missing.');
  assert(result.assignmentId,'Cross-coop assignment ID missing.');
  assert(Number(result.invoiceAmount)===650,'Invoice amount mismatch.');
  console.log('SanPaid closed-loop selection audit: PASS');
  console.log(JSON.stringify(result));
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
