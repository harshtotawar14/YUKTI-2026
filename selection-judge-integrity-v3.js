(() => {
  'use strict';

  if (!window.SanPaidReviewRuntime?.enabled || !window.SanPaidSelectionDemo?.enabled) return;

  const previousFetch=window.fetch.bind(window);
  const STATE_KEY='sanpaid_sih_review_state_v1';
  const SHARED_KEY='sanpaid_sih_selection_shared_state_v2';
  const SESSION_KEY='sanpaid_sih_review_sessions_v1';
  const ACTIVE_TOKEN_KEY='sanpaid_sih_review_active_token_v1';
  const KOLHAPUR='YUKTI Kolhapur Services Cooperative';
  const PANHALA='YUKTI Panhala Worker Cooperative';
  const MODEL_VERSION=3;

  const clone=v=>JSON.parse(JSON.stringify(v));
  const parse=(v,f=null)=>{try{return JSON.parse(v)??f;}catch{return f;}};
  const iso=()=>new Date().toISOString();
  const upper=v=>String(v||'').toUpperCase();

  function readState(){
    try{const env=parse(localStorage.getItem(SHARED_KEY),null);if(env?.state?.booking)return clone(env.state);}catch{}
    try{const s=parse(sessionStorage.getItem(STATE_KEY),null);if(s?.booking)return clone(s);}catch{}
    return null;
  }
  function meta(s){
    if(!s.selectionMeta||typeof s.selectionMeta!=='object')s.selectionMeta={};
    for(const k of ['shortageSignals','serviceOutcomes','workerFeedback','crossCoopAssignments'])if(!Array.isArray(s.selectionMeta[k]))s.selectionMeta[k]=[];
    for(const k of ['workers','offers','capacityRequests','capacityOffers','complaints','trainingRecommendations','notifications','timeline','history'])if(!Array.isArray(s[k]))s[k]=[];
    s.selectionMeta.modelVersion=MODEL_VERSION;
    return s.selectionMeta;
  }
  function writeState(s,source){
    if(!s?.booking)return;
    meta(s);s.revision=Number(s.revision||0)+1;
    try{sessionStorage.setItem(STATE_KEY,JSON.stringify(s));}catch{}
    try{localStorage.setItem(SHARED_KEY,JSON.stringify({version:2,mode:'SELECTION_DEMO_BACKEND',revision:s.revision,updatedAt:iso(),source,state:clone(s)}));}catch{}
    const detail={source,mode:'JUDGE_INTEGRITY_V3',revision:s.revision,at:Date.now()};
    try{window.dispatchEvent(new CustomEvent('sanpaid:selection-demo-sync',{detail}));}catch{}
    try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail}));}catch{}
    try{window.SanPaidCustomerWorkerDashboard?.requestRefresh?.({detail});}catch{}
  }
  function currentAccount(){
    try{const token=sessionStorage.getItem(ACTIVE_TOKEN_KEY)||'',all=parse(sessionStorage.getItem(SESSION_KEY)||'{}',{});return all[token]||null;}catch{return null;}
  }
  function homeCoop(zone){return /panhala/i.test(String(zone||''))?PANHALA:KOLHAPUR;}
  function coopForWorker(w){if(w?.persona==='WORKER_B'||/panhala/i.test(String(w?.zone||'')))return PANHALA;return KOLHAPUR;}
  function workerByPersona(s,p){return s.workers.find(w=>w.persona===p);}
  function syncHistory(s){const h=s.history.find(x=>Number(x.id)===Number(s.booking.id));if(h)Object.assign(h,clone(s.booking));else s.history.unshift(clone(s.booking));}
  function addTimeline(s,status,note){const at=iso();s.timeline.push({status,note,at});s.booking.updatedAt=at;syncHistory(s);}

  function normalizeWorkers(s){
    let changed=false;
    for(const w of s.workers){const c=coopForWorker(w);if(w.cooperative!==c){w.cooperative=c;changed=true;}}
    return changed;
  }
  function localEligible(s,service,coop){
    return s.workers.filter(w=>w.cooperative===coop&&w.verificationStatus==='VERIFIED'&&w.availability==='AVAILABLE'&&(w.skills||[]).some(k=>k.service===service&&k.verified));
  }
  function normalizeBookingOffers(s){
    if(!s.booking)return false;
    const coop=homeCoop(s.booking.zone);let changed=false;
    if(s.booking.homeCooperative!==coop){s.booking.homeCooperative=coop;changed=true;}
    if(!s.booking.crossCoop&&s.booking.cooperative!==coop){s.booking.cooperative=coop;changed=true;}
    if(['OFFERING','FINDING_REPLACEMENT'].includes(upper(s.booking.status))&&!s.booking.workerId){
      const eligible=localEligible(s,s.booking.service,coop);
      const existing=s.offers.slice();
      const next=[];
      eligible.forEach((w,i)=>{
        const old=existing.find(o=>o.workerPersona===w.persona)||{};
        next.push({offerId:Number(old.offerId||s.nextOfferId++),workerPersona:w.persona,offerStatus:i===0?'PENDING':'QUEUED',rank:i+1,distance:w.persona==='WORKER_A'?3.2:4.1,score:i===0?94.6:90.2});
      });
      if(JSON.stringify(next)!==JSON.stringify(s.offers)){s.offers=next;changed=true;}
      if(!next.length&&upper(s.booking.status)!=='NO_WORKER_AVAILABLE'){s.booking.status='NO_WORKER_AVAILABLE';changed=true;}
    }
    syncHistory(s);return changed;
  }
  function pristine(s){const m=meta(s);return Number(s.booking?.id)===17&&upper(s.booking?.status)==='OFFERING'&&!m.shortageSignals.length&&!m.serviceOutcomes.length&&!m.crossCoopAssignments.length;}
  function normalizeSeed(s){
    let changed=normalizeWorkers(s);meta(s);
    if(pristine(s)){
      if(s.capacityRequests.length||s.capacityOffers.length||s.complaints.length||s.trainingRecommendations.length){s.capacityRequests=[];s.capacityOffers=[];s.complaints=[];s.trainingRecommendations=[];s.nextCapacityId=1;changed=true;}
      changed=normalizeBookingOffers(s)||changed;
    }
    return changed;
  }

  function jsonError(status,code,message){return new Response(JSON.stringify({ok:false,error:code,message}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}
  function bodyOf(options={}){if(typeof options.body!=='string')return{};return parse(options.body,{})||{};}
  function roleAllowed(account,roles){return !!account&&roles.includes(upper(account.role));}
  function preflight(path,method,s,options){
    if(method!=='POST'||!s?.booking)return null;
    const account=currentAccount(),status=upper(s.booking.status),body=bodyOf(options);
    let m;
    if(/^\/api\/connected\/worker\/jobs\/\d+\/estimate$/.test(path)){
      if(!roleAllowed(account,['WORKER']))return jsonError(403,'ROLE_FORBIDDEN','This action is only available to the assigned worker.');
      if(Number(account?.persona==='WORKER_A'?11:account?.persona==='WORKER_B'?12:0)!==Number(s.booking.workerId))return jsonError(403,'ASSIGNMENT_REQUIRED','Only the assigned worker can prepare this estimate.');
      if(!['ACCEPTED','ON_THE_WAY','ARRIVED'].includes(status))return jsonError(409,'INVALID_SERVICE_STATE','Estimate can be prepared after the worker accepts the booking.');
    }
    if(/^\/api\/connected\/customer\/bookings\/\d+\/estimate\/decision$/.test(path)&&!roleAllowed(account,['CUSTOMER']))return jsonError(403,'ROLE_FORBIDDEN','Only the customer can approve or reject the estimate.');
    if(/^\/api\/connected\/jobs\/\d+\/travel$/.test(path)&&status!=='ACCEPTED')return jsonError(409,'INVALID_SERVICE_STATE','Travel can begin only after assignment acceptance.');
    if(/^\/api\/connected\/jobs\/\d+\/arrive$/.test(path)&&status!=='ON_THE_WAY')return jsonError(409,'INVALID_SERVICE_STATE','Arrival can be recorded only after travel begins.');
    if(/^\/api\/connected\/jobs\/\d+\/identity$/.test(path)&&(status!=='ARRIVED'||upper(s.estimate?.status)!=='APPROVED'))return jsonError(409,'ESTIMATE_REQUIRED','Arrival and customer-approved estimate are required before identity verification.');
    if(/^\/api\/connected\/service-start\/[^/]+\/confirm$/.test(path)&&status!=='IDENTITY_VERIFIED')return jsonError(409,'INVALID_SERVICE_STATE','Worker identity must be verified before customer confirmation.');
    if(/^\/api\/connected\/jobs\/\d+\/start$/.test(path)&&status!=='CUSTOMER_CONFIRMED')return jsonError(409,'INVALID_SERVICE_STATE','Customer confirmation is required before service starts.');
    if(/^\/api\/connected\/worker\/jobs\/\d+\/extra-charge$/.test(path)&&status!=='IN_PROGRESS')return jsonError(409,'INVALID_SERVICE_STATE','Additional work can be proposed only while service is in progress.');
    if(/^\/api\/connected\/jobs\/\d+\/completion-request$/.test(path)&&status!=='IN_PROGRESS')return jsonError(409,'INVALID_SERVICE_STATE','Completion can be requested only after service starts.');
    if(/^\/api\/connected\/customer\/bookings\/\d+\/complete$/.test(path)&&status!=='AWAITING_CUSTOMER_CONFIRMATION')return jsonError(409,'INVALID_SERVICE_STATE','Customer completion follows the worker completion request.');
    if(/^\/api\/connected\/customer\/bookings\/\d+\/pay$/.test(path)&&!['COMPLETED','PAYMENT_PENDING'].includes(status))return jsonError(409,'INVALID_SERVICE_STATE','Payment becomes available after service completion.');
    if(/^\/api\/connected\/customer\/bookings\/\d+\/rating$/.test(path)&&status!=='PAID')return jsonError(409,'PAYMENT_REQUIRED','Rating becomes available after payment is recorded.');
    m=path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/approve$/);
    if(m){const r=s.capacityRequests.find(x=>Number(x.id)===Number(m[1]));if(!r)return jsonError(404,'CAPACITY_NOT_FOUND','Capacity request not found.');if(Number(r.acceptedWorkers||0)<Number(r.workersRequired||1)||!['CONSENT_READY','APPROVED'].includes(upper(r.status)))return jsonError(409,'WORKER_CONSENT_REQUIRED','Required worker consent must be recorded before federation authorization.');}
    m=path.match(/^\/api\/connected\/worker\/capacity-offers\/(\d+)\/respond$/);
    if(m){const o=s.capacityOffers.find(x=>Number(x.offerId)===Number(m[1]));if(o&&o.offerStatus!=='OFFERED')return jsonError(409,'CAPACITY_OFFER_ALREADY_DECIDED','This capacity offer already has a recorded worker decision.');}
    m=path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/offer-provider$/);
    if(m){const r=s.capacityRequests.find(x=>Number(x.id)===Number(m[1]));if(r&&upper(r.status)!=='REQUESTED')return jsonError(409,'CAPACITY_ALREADY_COORDINATED','A providing cooperative is already being coordinated for this request.');const provider=Number(body.providingCooperativeId||0)===2?PANHALA:KOLHAPUR;if(r&&provider===r.requestingCooperative)return jsonError(409,'SAME_COOPERATIVE','Capacity exchange must use a different cooperative.');}
    return null;
  }

  function ensureCrossCoopJob(s){
    if(!s.booking?.crossCoop||upper(s.booking.status)!=='ACCEPTED'||!s.booking.workerId)return false;
    const worker=s.workers.find(w=>Number(w.id)===Number(s.booking.workerId));if(!worker)return false;
    const existing=s.offers.find(o=>o.workerPersona===worker.persona&&o.offerStatus==='ACCEPTED');
    if(existing){existing.crossCoop=true;existing.assignmentId=s.booking.assignmentId;return false;}
    s.offers=s.offers.filter(o=>o.offerStatus!=='ACCEPTED');
    s.offers.push({offerId:Number(s.nextOfferId++),workerPersona:worker.persona,offerStatus:'ACCEPTED',rank:1,distance:Number(s.booking.distance||6.4),score:92.4,crossCoop:true,assignmentId:s.booking.assignmentId});
    return true;
  }
  function afterMutation(path,s,options){
    let changed=normalizeWorkers(s);const body=bodyOf(options);
    if(path==='/api/connected/bookings')changed=normalizeBookingOffers(s)||changed;
    if(/^\/api\/connected\/customer\/bookings\/\d+\/estimate\/decision$/.test(path)&&upper(s.estimate?.status)==='APPROVED'){
      const amount=Number(s.estimate?.total||0);if(amount>0&&Number(s.booking.total)!==amount){s.booking.total=amount;addTimeline(s,'ESTIMATE_APPROVED',`Customer approved the estimate. Booking amount updated to ₹${amount.toLocaleString('en-IN')}.`);changed=true;}
    }
    let m=path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/offer-provider$/);
    if(m){const r=s.capacityRequests.find(x=>Number(x.id)===Number(m[1]));if(r){const p=Number(body.providingCooperativeId||0)===2?PANHALA:KOLHAPUR;r.providingCooperative=p;const persona=p===PANHALA?'WORKER_B':'WORKER_A';const o=[...s.capacityOffers].reverse().find(x=>Number(x.requestId)===Number(r.id));if(o&&o.workerPersona!==persona){o.workerPersona=persona;changed=true;}}}
    m=path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/approve$/);
    if(m){const r=s.capacityRequests.find(x=>Number(x.id)===Number(m[1]));if(r){r.homeResponsibilityPercent=Number(body.homeCooperativeSharePercent||0);r.servingResponsibilityPercent=Number(body.servingCooperativeSharePercent||0);changed=true;}changed=ensureCrossCoopJob(s)||changed;}
    if(/^\/api\/connected\/customer\/support$/.test(path)){const c=s.complaints[0];if(c&&Number(c.bookingId||0)===Number(s.booking.id)){c.service=s.booking.service;c.homeCooperative=s.booking.homeCooperative||KOLHAPUR;c.escalationLevel=s.booking.crossCoop?3:2;c.owner=s.booking.crossCoop?`${c.homeCooperative} · Federation escalation`:`${c.homeCooperative} · Cooperative resolution`;changed=true;}}
    syncHistory(s);return changed;
  }

  function coopSummary(s){
    const rows=[KOLHAPUR,PANHALA].map((name,id)=>{const workers=s.workers.filter(w=>w.cooperative===name);return{id:id+1,name,city:name===KOLHAPUR?'Kolhapur':'Panhala',workers:workers.length,available:workers.filter(w=>w.verificationStatus==='VERIFIED'&&w.availability==='AVAILABLE').length};});
    return rows;
  }
  function plan(s){
    const m=meta(s),latest=m.shortageSignals.at(-1)||m.serviceOutcomes.at(-1)||{},service=latest.service||s.booking.service||'Electrician';
    const outcomes=m.serviceOutcomes.filter(x=>x.service===service).length,shortages=m.shortageSignals.filter(x=>x.service===service).length;
    const base={Electrician:4,'AC Repair':3,Plumber:3,'House Cleaning':2}[service]||3;
    const home=s.booking.homeCooperative||homeCoop(s.booking.zone),local=localEligible(s,service,home).length;
    const approved=m.crossCoopAssignments.filter(x=>x.service===service).length;
    const historicalDemand30d=base+outcomes,expectedDemand=historicalDemand30d+1+shortages,eligibleCapacity=local+approved,capacityGap=Math.max(0,expectedDemand-eligibleCapacity);
    return{ok:true,service,historicalDemand30d,expectedDemand,eligibleCapacity,capacityGap,confidence:shortages?'MEDIUM':'LOW-MEDIUM',forecastMethod:'Human-reviewed forecasting (pilot) · controlled review baseline',recommendedActions:capacityGap?['CAPACITY_EXCHANGE','TRAINING_REVIEW','ONBOARDING_REVIEW']:['MONITOR_DEMAND'],evidence:{shortageSignals:shortages,completedServiceOutcomes:outcomes,verifiedLocalSkillWorkers:local,authorizedCrossCoopCapacity:approved,source:'Controlled 30-day review baseline + shared journey ledger'}};
  }
  function aggregatedSkills(s){
    const workers=s.workers.filter(w=>w.cooperative===KOLHAPUR),services=[...new Set(workers.flatMap(w=>(w.skills||[]).map(k=>k.service)).filter(Boolean))];
    return services.map(service=>{const verified=workers.filter(w=>(w.skills||[]).some(k=>k.service===service&&k.verified)&&w.verificationStatus==='VERIFIED');const p=plan({...s,booking:{...s.booking,service}});return{service,verifiedWorkers:verified.length,availableWorkers:verified.filter(w=>w.availability==='AVAILABLE').length,demand30d:p.historicalDemand30d};});
  }
  function transform(path,data,s){
    if(!data||!s?.booking)return data;normalizeWorkers(s);
    const m=meta(s),coops=coopSummary(s);
    if(path==='/api/connected/judge/planning')return plan(s);
    if(path==='/api/connected/judge/overview'){
      const verified=s.workers.filter(w=>w.verificationStatus==='VERIFIED').length,available=s.workers.filter(w=>w.verificationStatus==='VERIFIED'&&w.availability==='AVAILABLE').length;
      const assignments=s.capacityRequests.filter(r=>upper(r.status)==='APPROVED').reduce((n,r)=>n+Number(r.approvedAssignments||0),0),open=s.complaints.filter(c=>upper(c.status)!=='RESOLVED').length;
      return{...data,cooperatives:coops,capacityRequests:clone(s.capacityRequests),complaints:clone(s.complaints),metrics:{...(data.metrics||{}),totalWorkers:s.workers.length,verifiedWorkers:verified,availableWorkers:available,connectedCooperatives:coops.length,crossCoopAssignments:assignments,shortageSignals:m.shortageSignals.length,openComplaints:open,escalatedComplaints:s.complaints.filter(c=>upper(c.status)!=='RESOLVED'&&Number(c.escalationLevel||0)>=3).length,unfulfilledRequests:s.capacityRequests.filter(r=>upper(r.status)!=='APPROVED').length,recordedSettlements:s.payment&&s.booking.crossCoop?1:0}};
    }
    if(path==='/api/cooperative-admin/workspace'){
      const workers=s.workers.filter(w=>w.cooperative===KOLHAPUR),complaints=s.complaints.filter(c=>!c.homeCooperative||c.homeCooperative===KOLHAPUR),requests=s.capacityRequests.filter(r=>r.requestingCooperative===KOLHAPUR||r.providingCooperative===KOLHAPUR);
      const verified=workers.filter(w=>w.verificationStatus==='VERIFIED').length,available=workers.filter(w=>w.verificationStatus==='VERIFIED'&&w.availability==='AVAILABLE').length;
      const amount=Number(s.payment?.amount||0),outcomes=m.serviceOutcomes.length,ratings=m.workerFeedback.map(x=>Number(x.stars||0)).filter(Boolean);
      return{...data,cooperative:{id:1,name:KOLHAPUR,city:'Kolhapur',code:'YUKTI-KOP-01'},workers:clone(workers),complaints:clone(complaints),capacityRequests:clone(requests).map(r=>({...r,role:r.requestingCooperative===KOLHAPUR?'REQUESTING':'PROVIDING'})),skills:aggregatedSkills(s),services:s.booking?[{id:s.booking.id,bookingCode:s.booking.bookingCode,service:s.booking.service,status:s.booking.status,customer:'Shreya Patil',worker:s.booking.workerName||'Assignment pending',amount:s.booking.total,scheduledAt:s.booking.scheduledAt,zone:s.booking.zone,createdAt:s.booking.createdAt}]:[],payments:s.payment?[{bookingId:s.booking.id,bookingCode:s.booking.bookingCode,amount,status:'PAID',createdAt:s.payment.createdAt}]:[],quality:{completedServices:outcomes,averageRating:ratings.length?Number((ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1)):0,complaintsResolved:complaints.filter(c=>upper(c.status)==='RESOLVED').length},verificationQueue:workers.filter(w=>w.verificationStatus!=='VERIFIED'),metrics:{...(data.metrics||{}),totalWorkers:workers.length,verifiedWorkers:verified,availableWorkers:available,activeBookings:['PAID','CLOSED','CANCELLED'].includes(upper(s.booking.status))?0:1,openComplaints:complaints.filter(c=>upper(c.status)!=='RESOLVED').length,slaBreached:complaints.filter(c=>c.slaBreached).length,slaBreaches:complaints.filter(c=>c.slaBreached).length,pendingVerification:workers.filter(w=>w.verificationStatus!=='VERIFIED').length,documentIssues:workers.reduce((n,w)=>n+Number(w.pendingDocuments||0)+Number(w.expiredDocuments||0),0),recordedPayments:amount,capacityRequests:requests.filter(r=>upper(r.status)!=='APPROVED').length}};
    }
    if(path==='/api/connected/judge/workforce-intelligence'){
      const p=plan(s);return{...data,passports:(data.passports||[]).map(x=>({...x,cooperative:coopForWorker(s.workers.find(w=>w.id===x.id)||{} )})),capacity:{forecastLabel:'HUMAN-REVIEWED FORECASTING (PILOT)',rows:[{zone:s.booking.zone||'Kolhapur',service:p.service,expectedDemand:p.expectedDemand,eligibleCapacity:p.eligibleCapacity,gap:p.capacityGap,status:p.capacityGap>0?'CAPACITY_GAP':'BALANCED',recommendedAction:p.capacityGap?'Review training, onboarding or consent-based capacity exchange':'Monitor capacity'}]}};
    }
    if(path==='/api/public-proof/summary'){
      const p=plan(s);return{...data,workers:s.workers.length,cooperatives:coops.length,capacityMap:{forecastLabel:'HUMAN-REVIEWED FORECASTING (PILOT)',rows:[{zone:s.booking.zone||'Kolhapur',service:p.service,expectedDemand:p.expectedDemand,eligibleCapacity:p.eligibleCapacity,gap:p.capacityGap,status:p.capacityGap>0?'CAPACITY_GAP':'BALANCED',recommendedAction:'Cooperative review required'}]},workerTrust:{workers:(data.workerTrust?.workers||[]).map(x=>({...x,cooperative:coopForWorker(s.workers.find(w=>w.id===x.id)||{})}))}};
    }
    if(/^\/api\/connected\/judge\/match\/\d+$/.test(path)){
      const coop=s.booking.homeCooperative||homeCoop(s.booking.zone),eligible=localEligible(s,s.booking.service,coop).map((w,i)=>({rank:i+1,name:w.name,cooperative:w.cooperative,distance:w.persona==='WORKER_A'?3.2:4.1,score:i?90.2:94.6,checks:{identityVerified:true,skillVerified:true,available:true,withinRadius:true,documentsValid:true,noScheduleConflict:true}}));return{ok:true,booking:{id:s.booking.id,bookingCode:s.booking.bookingCode,service:s.booking.service},eligible};
    }
    if(path==='/api/connected/workforce/passport'&&data.passport){const w=s.workers.find(x=>Number(x.id)===Number(data.passport.id));return{...data,passport:{...data.passport,cooperative:coopForWorker(w)}};}
    return data;
  }

  function replaceCredibilityText(){
    const replacements=new Map([
      ['Human-reviewed AI','Human-reviewed forecasting (pilot)'],
      ['Digital Service Passport with welfare status','Digital Service Passport + welfare integration readiness'],
      ['Skills, ratings, incidents and welfare status stay traceable.','Skills, ratings, credentials and work outcomes stay traceable.'],
      ['Role-based access, PostgreSQL-backed operations and audit history keep service, payment, complaint and capacity decisions connected.','Role-based access, connected service records and audit history keep service, payment, complaint and capacity decisions connected.'],
      ['PostgreSQL + audit','Shared service record + audit'],
      ['Connected source and controlled sandbox functions are separated from future production integrations and pilot impact claims.','Working role flows are separated from future production integrations and pilot impact claims.'],
      ['Server-backed schedule','Recorded availability schedule'],
      ['AI-assisted advisory forecast. Shortage recommendations never transfer workers automatically; cooperative approval and worker choice remain required.','Human-reviewed forecasting (pilot). Recommendations never transfer workers automatically; cooperative approval and worker choice remain required.'],
      ['AI-ASSISTED ADVISORY','HUMAN-REVIEWED FORECASTING (PILOT)'],
      ['AI-ASSISTED ADVISORY FORECAST','HUMAN-REVIEWED FORECASTING (PILOT)']
    ]);
    for(const node of document.querySelectorAll('body *')){if(node.children.length)continue;const text=node.textContent?.trim();if(replacements.has(text))node.textContent=replacements.get(text);}
  }

  async function judgeFetch(input,options={}){
    let url;try{url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input?.url||'',location.href);}catch{return previousFetch(input,options);}
    if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return previousFetch(input,options);
    const method=upper(options.method||input?.method||'GET'),state=readState();
    if(state?.booking){const block=preflight(url.pathname,method,state,options);if(block)return block;}
    const response=await previousFetch(input,options);if(!response.ok)return response;
    if(method==='POST'){
      const latest=readState();if(latest?.booking){meta(latest);if(afterMutation(url.pathname,latest,options))writeState(latest,`judge-v3 ${method} ${url.pathname}`);}return response;
    }
    const targets=['/api/connected/judge/planning','/api/connected/judge/overview','/api/cooperative-admin/workspace','/api/connected/judge/workforce-intelligence','/api/public-proof/summary','/api/connected/workforce/passport'];
    if(!targets.includes(url.pathname)&&!/^\/api\/connected\/judge\/match\/\d+$/.test(url.pathname))return response;
    const data=await response.clone().json().catch(()=>null),latest=readState();if(!data||!latest?.booking)return response;
    const out=transform(url.pathname,data,latest),headers=new Headers(response.headers);headers.set('Content-Type','application/json; charset=utf-8');headers.set('Cache-Control','no-store');headers.set('X-SanPaid-Judge-Integrity','closed-loop-v3');return new Response(JSON.stringify(out),{status:response.status,statusText:response.statusText,headers});
  }

  const seed=readState();if(seed?.booking){meta(seed);if(normalizeSeed(seed))writeState(seed,'judge-v3-seed-normalized');}
  window.fetch=judgeFetch;
  let queued=false;const scheduleText=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;replaceCredibilityText();});};
  new MutationObserver(scheduleText).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('sanpaid:selection-demo-sync',()=>{const s=readState();if(s?.booking&&normalizeSeed(s))writeState(s,'judge-v3-sync-normalized');scheduleText();});
  document.addEventListener('DOMContentLoaded',scheduleText,{once:true});scheduleText();
  document.documentElement.dataset.judgeIntegrity='closed-loop-v3';
})();