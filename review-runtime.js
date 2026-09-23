(() => {
  'use strict';

  const originalFetch=window.fetch.bind(window);
  const STATE_KEY='sanpaid_sih_review_state_v1';
  const SESSION_KEY='sanpaid_sih_review_sessions_v1';
  const ACTIVE_TOKEN_KEY='sanpaid_sih_review_active_token_v1';
  const MODE='SIH_REVIEW_RUNTIME';
  let sharedPassword='';

  const ACCOUNTS=Object.freeze({
    customer:{accessId:'customer',email:'customer.connected@sanpaid.demo',name:'Shreya Patil',role:'CUSTOMER',persona:'CUSTOMER'},
    'worker-a':{accessId:'worker-a',email:'worker1.connected@sanpaid.demo',name:'Asha Verma',role:'WORKER',persona:'WORKER_A'},
    'worker-b':{accessId:'worker-b',email:'worker2.connected@sanpaid.demo',name:'Ravi Kumar',role:'WORKER',persona:'WORKER_B'},
    'cooperative-admin':{accessId:'cooperative-admin',email:'admin.connected@sanpaid.demo',name:'Cooperative Admin',role:'COOPERATIVE_ADMIN',persona:null},
    'federation-admin':{accessId:'federation-admin',email:'federation.connected@sanpaid.demo',name:'Federation Admin',role:'FEDERATION_ADMIN',persona:null}
  });

  const SERVICES=Object.freeze([
    {id:1,name:'Electrician',slug:'electrician',icon:'⚡',basePrice:499},
    {id:2,name:'Plumber',slug:'plumber',icon:'🔧',basePrice:449},
    {id:3,name:'Carpenter',slug:'carpenter',icon:'🪚',basePrice:549},
    {id:4,name:'House Cleaning',slug:'house-cleaning',icon:'🧹',basePrice:399},
    {id:5,name:'AC Repair',slug:'ac-repair',icon:'❄️',basePrice:699},
    {id:6,name:'Appliance Repair',slug:'appliance-repair',icon:'🛠️',basePrice:599},
    {id:7,name:'Painter',slug:'painter',icon:'🎨',basePrice:649},
    {id:8,name:'Gardener',slug:'gardener',icon:'🌿',basePrice:349}
  ]);

  const iso=(offsetMinutes=0)=>new Date(Date.now()+offsetMinutes*60000).toISOString();
  const tomorrowAt=(hour=11)=>{const d=new Date();d.setDate(d.getDate()+1);d.setHours(hour,0,0,0);return d.toISOString();};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const safeParse=(value,fallback)=>{try{return JSON.parse(value)||fallback;}catch{return fallback;}};
  const readSession=(key,fallback)=>{try{return safeParse(sessionStorage.getItem(key)||'',fallback);}catch{return fallback;}};
  const writeSession=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}};
  const readText=key=>{try{return sessionStorage.getItem(key)||'';}catch{return '';}};
  const writeText=(key,value)=>{try{value?sessionStorage.setItem(key,String(value)):sessionStorage.removeItem(key);}catch{}};

  function initialBooking(){
    return {
      id:17,bookingCode:'SP-2026-000017',customerId:1,service:'Electrician',serviceIcon:'⚡',status:'OFFERING',
      zone:'Kolhapur',address:'Rajarampuri, Kolhapur',problem:'Switchboard sparking intermittently near the living room.',
      requestSource:'TEXT',requestLanguage:'en',voiceTranscript:null,scheduledAt:tomorrowAt(11),emergency:false,total:499,
      workerId:null,workerName:null,workerVerification:null,distance:null,cooperative:'YUKTI Kolhapur Services Cooperative',
      createdAt:iso(-35),updatedAt:iso(-35),problemPhoto:{available:false},voiceMessage:{available:false}
    };
  }

  function freshState(){
    const booking=initialBooking();
    return {
      revision:1,nextBookingId:18,nextOfferId:103,nextSupportId:2,nextChargeId:2,nextCapacityId:2,
      booking,history:[clone(booking)],
      timeline:[{status:'OFFERING',note:'Request created and eligibility checks completed. First suitable worker opportunity sent.',at:booking.createdAt}],
      offers:[
        {offerId:101,workerPersona:'WORKER_A',offerStatus:'PENDING',rank:1,distance:3.2,score:94.6},
        {offerId:102,workerPersona:'WORKER_B',offerStatus:'QUEUED',rank:2,distance:6.4,score:89.8}
      ],
      estimate:null,charges:[],payment:null,invoice:null,rating:null,serviceStartToken:'',
      support:[{id:1,referenceCode:'SP-SUP-001',bookingId:17,category:'Service Support',description:'Sample governed support record for workflow review.',status:'RESOLVED',createdAt:iso(-1440)}],
      notifications:[
        {id:1,title:'Request created',message:'Your Electrician request is being offered to eligible cooperative workers.',priority:'NORMAL',createdAt:iso(-34)},
        {id:2,title:'Worker choice protected',message:'The worker can accept or decline without an assignment penalty.',priority:'NORMAL',createdAt:iso(-33)}
      ],
      workerAvailability:{WORKER_A:true,WORKER_B:true},
      schedules:{},
      capacityRequests:[{id:1,requestCode:'CAP-2026-001',service:'AC Repair',zone:'Panhala',workersRequired:2,requestingCooperative:'YUKTI Panhala Worker Cooperative',providingCooperative:'YUKTI Kolhapur Services Cooperative',status:'AWAITING_WORKER_CONSENT',offeredWorkers:2,acceptedWorkers:1,approvedAssignments:0,requestedAt:iso(-180)}],
      capacityOffers:[{offerId:501,workerPersona:'WORKER_A',offerStatus:'OFFERED',requestId:1,requestCode:'CAP-2026-001',service:'AC Repair',zone:'Panhala',requestingCooperative:'YUKTI Panhala Worker Cooperative',providingCooperative:'YUKTI Kolhapur Services Cooperative'}],
      workers:[
        {id:11,persona:'WORKER_A',name:'Asha Verma',verificationStatus:'VERIFIED',availability:'AVAILABLE',rating:4.9,jobsCompleted:28,currentJobs:0,complaintCount:0,zone:'Kolhapur',pendingDocuments:0,expiredDocuments:0,skills:[{service:'Electrician',verified:true},{service:'AC Repair',verified:true},{service:'Appliance Repair',verified:true}]},
        {id:12,persona:'WORKER_B',name:'Ravi Kumar',verificationStatus:'VERIFIED',availability:'AVAILABLE',rating:4.7,jobsCompleted:21,currentJobs:0,complaintCount:1,zone:'Panhala',pendingDocuments:0,expiredDocuments:0,skills:[{service:'Electrician',verified:true},{service:'Plumber',verified:true}]},
        {id:13,persona:'WORKER_C',name:'Meera Patil',verificationStatus:'PENDING',availability:'UNAVAILABLE',rating:4.6,jobsCompleted:9,currentJobs:0,complaintCount:0,zone:'Kolhapur',pendingDocuments:1,expiredDocuments:0,skills:[{service:'House Cleaning',verified:true},{service:'Elder Care',verified:false}]}
      ],
      complaints:[{id:71,ticketNumber:'CMP-2026-071',bookingCode:'SP-2026-000012',category:'Late Arrival',status:'IN_REVIEW',escalationLevel:2,slaBreached:false,createdAt:iso(-520)}],
      trainingRecommendations:[{worker:'Ravi Kumar',service:'AC Repair',trainingName:'Advanced AC Diagnostics',reason:'Observed local demand with limited verified capacity.',status:'RECOMMENDED',createdAt:iso(-720)}]
    };
  }

  function state(){
    let current=readSession(STATE_KEY,null);
    if(!current||!current.booking){current=freshState();writeSession(STATE_KEY,current);}
    return current;
  }
  function save(next){next.revision=Number(next.revision||0)+1;writeSession(STATE_KEY,next);return next;}
  function sessions(){return readSession(SESSION_KEY,{});}
  function saveSessions(value){writeSession(SESSION_KEY,value);}
  function publicUser(account){return {id:account.role==='CUSTOMER'?1:account.persona==='WORKER_A'?11:account.persona==='WORKER_B'?12:account.role==='COOPERATIVE_ADMIN'?91:92,email:account.email,name:account.name,fullName:account.name,full_name:account.name,role:account.role,persona:account.persona};}
  function tokenFor(account){return `review-${account.role.toLowerCase()}-${String(account.persona||'admin').toLowerCase()}-${Date.now().toString(36)}`;}

  function headerValue(headers,name){
    if(!headers)return '';
    try{if(headers instanceof Headers)return headers.get(name)||'';}catch{}
    const key=Object.keys(headers).find(k=>k.toLowerCase()===name.toLowerCase());return key?String(headers[key]||''):'';
  }
  function tokenFrom(options={}){
    const auth=headerValue(options.headers,'Authorization');
    const bearer=/^Bearer\s+(.+)$/i.exec(auth)?.[1]||'';
    return bearer||readText(ACTIVE_TOKEN_KEY);
  }
  function accountFromToken(token){return sessions()[token]||null;}
  function activeAccount(options={}){const token=tokenFrom(options);return token?accountFromToken(token):null;}
  function requireAccount(options={}){const account=activeAccount(options);if(!account)throw apiError(401,'AUTH_REQUIRED','Please log in to continue.');return account;}
  function apiError(status,code,message){const error=new Error(message);error.status=status;error.code=code;return error;}
  function json(data,status=200,extraHeaders={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extraHeaders}});}
  function errorResponse(error){return json({ok:false,error:error.code||'REVIEW_RUNTIME_ERROR',message:error.message||'Review runtime request failed.'},Number(error.status)||500);}
  async function requestBody(options={}){if(!options.body)return{};if(typeof options.body==='string')return safeParse(options.body,{});try{return await new Response(options.body).json();}catch{return{};}}

  function touch(next,status,note){
    const b=next.booking;if(!b)return;
    b.status=status;b.updatedAt=new Date().toISOString();
    next.timeline.push({status,note,at:b.updatedAt});
    const h=next.history.find(x=>Number(x.id)===Number(b.id));if(h)Object.assign(h,clone(b));else next.history.unshift(clone(b));
  }
  function assignedAccount(next){return next.booking?.workerId===11?ACCOUNTS['worker-a']:next.booking?.workerId===12?ACCOUNTS['worker-b']:null;}
  function offerShape(next,offer){
    const account=offer.workerPersona==='WORKER_B'?ACCOUNTS['worker-b']:ACCOUNTS['worker-a'];const b=next.booking;
    return {offerId:offer.offerId,offerStatus:offer.offerStatus,bookingId:b.id,bookingCode:b.bookingCode,status:b.status,service:b.service,zone:b.zone,problem:b.problem,voiceTranscript:b.voiceTranscript,scheduledAt:b.scheduledAt,emergency:b.emergency,total:b.total,distance:offer.distance,cooperative:b.cooperative,rank:offer.rank,matching:{score:offer.score,reasonCodes:['IDENTITY_VERIFIED','SKILL_VERIFIED','AVAILABLE','WITHIN_RADIUS','SCHEDULE_AVAILABLE','DOCUMENTS_VALID']},voiceMessage:b.voiceMessage||{available:false},problemPhoto:b.problemPhoto||{available:false},workerName:account.name};
  }
  function bookingShape(next){return clone(next.booking);}
  function checkout(next){
    const approved=next.charges.filter(x=>x.status==='APPROVED').reduce((sum,x)=>sum+Number(x.amount||0),0);
    return {status:next.booking.status,total:Number(next.booking.total||0),approvedAdditional:approved,finalAmount:Number(next.booking.total||0)+approved,payment:next.payment,invoice:next.invoice};
  }
  function workerFor(account,next){return next.workers.find(x=>x.persona===account.persona)||next.workers[0];}
  function passportFor(account,next){const w=workerFor(account,next);return {id:w.id,name:w.name,cooperative:'YUKTI Kolhapur Services Cooperative',identityVerified:w.verificationStatus==='VERIFIED',currentEligibility:w.verificationStatus==='VERIFIED'&&w.availability==='AVAILABLE'?'ELIGIBLE':'REVIEW REQUIRED',completedJobs:w.jobsCompleted,rating:w.rating,skills:w.skills.map(x=>({name:x.service,verified:x.verified})),credentials:[{id:`identity-${w.id}`,name:'Cooperative Identity Review',status:w.verificationStatus==='VERIFIED'?'CURRENT':'REVIEW REQUIRED',daysUntilExpiry:120}],trainingRecommendations:1};}

  function scheduleFor(date,account,next){
    const key=`${account.persona}:${date}`;
    if(!next.schedules[key])next.schedules[key]=[
      {id:1,startTime:'09:00',endTime:'11:00',baseStatus:'AVAILABLE',status:'AVAILABLE',displayStatus:'AVAILABLE'},
      {id:2,startTime:'11:30',endTime:'13:30',baseStatus:'AVAILABLE',status:'AVAILABLE',displayStatus:'AVAILABLE'},
      {id:3,startTime:'15:00',endTime:'17:00',baseStatus:'AVAILABLE',status:'AVAILABLE',displayStatus:'AVAILABLE'}
    ];
    return next.schedules[key];
  }

  function overview(next){
    const active=['OFFERING','FINDING_REPLACEMENT','ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAYMENT_PENDING'].includes(String(next.booking?.status||''));
    return {
      ok:true,
      metrics:{totalWorkers:next.workers.length,verifiedWorkers:next.workers.filter(w=>w.verificationStatus==='VERIFIED').length,availableWorkers:next.workers.filter(w=>w.availability==='AVAILABLE').length,activeBookings:active?1:0,openComplaints:next.complaints.filter(x=>x.status!=='RESOLVED').length,slaBreached:next.complaints.filter(x=>x.slaBreached).length,pendingVerification:next.workers.filter(w=>w.verificationStatus!=='VERIFIED').length,recordedPayments:next.payment?Number(next.payment.amount||0):12480,capacityRequests:next.capacityRequests.filter(x=>x.status!=='APPROVED').length},
      cooperatives:[
        {id:1,name:'YUKTI Kolhapur Services Cooperative',city:'Kolhapur',workers:18,available:12},
        {id:2,name:'YUKTI Panhala Worker Cooperative',city:'Panhala',workers:11,available:5},
        {id:3,name:'Karveer Community Services Cooperative',city:'Karveer',workers:9,available:6}
      ],
      capacityRequests:clone(next.capacityRequests),complaints:clone(next.complaints),payments:next.payment?[{bookingId:next.booking.id,bookingCode:next.booking.bookingCode,amount:next.payment.amount,status:'PAID',createdAt:next.payment.createdAt}]:[]
    };
  }

  function planning(){return {ok:true,service:'Electrician',historicalDemand30d:32,expectedDemand:38,eligibleCapacity:31,capacityGap:7,confidence:'MEDIUM',forecastMethod:'Human-reviewed demand baseline',recommendedActions:['TRAINING_REVIEW','CAPACITY_EXCHANGE','ONBOARDING_REVIEW']};}
  function matching(next){return {ok:true,booking:{id:next.booking.id,bookingCode:next.booking.bookingCode,service:next.booking.service},eligible:[{rank:1,name:'Asha Verma',cooperative:'YUKTI Kolhapur Services Cooperative',distance:3.2,score:94.6,checks:{identityVerified:true,skillVerified:true,available:true,withinRadius:true,documentsValid:true,noScheduleConflict:true}},{rank:2,name:'Ravi Kumar',cooperative:'YUKTI Kolhapur Services Cooperative',distance:6.4,score:89.8,checks:{identityVerified:true,skillVerified:true,available:true,withinRadius:true,documentsValid:true,noScheduleConflict:true}}]};}

  function cooperativeWorkspace(next){
    const o=overview(next);const b=next.booking;
    return {ok:true,cooperative:{id:1,name:'YUKTI Kolhapur Services Cooperative',city:'Kolhapur',code:'YUKTI-01'},metrics:{...o.metrics,documentIssues:next.workers.reduce((sum,w)=>sum+Number(w.pendingDocuments||0)+Number(w.expiredDocuments||0),0),capacityRequests:next.capacityRequests.length},workers:clone(next.workers),services:[{id:b.id,bookingCode:b.bookingCode,service:b.service,status:b.status,customer:'Shreya Patil',worker:b.workerName||'Assignment pending',amount:b.total,createdAt:b.createdAt}],complaints:clone(next.complaints),capacityRequests:clone(next.capacityRequests).map(x=>({...x,role:'REQUESTING'})),payments:o.payments,trainingRecommendations:clone(next.trainingRecommendations),quality:{completedServices:29,averageRating:4.8,complaintsResolved:6},skills:next.workers.flatMap(w=>w.skills.map(s=>({worker:w.name,service:s.service,verified:s.verified}))),verificationQueue:next.workers.filter(w=>w.verificationStatus!=='VERIFIED')};
  }

  function workforceIntelligence(next){
    const passports=[passportFor(ACCOUNTS['worker-a'],next),passportFor(ACCOUNTS['worker-b'],next)];
    const opportunity={workers:next.workers.slice(0,2).map((w,i)=>({name:w.name,offersReceived:i?7:9,acceptedOffers:i?5:7,declinedOffers:2,recentOffers:i?3:4,eligibleForOpportunity:true}))};
    const capacity={forecastLabel:'HUMAN-REVIEWED ADVISORY',rows:[{zone:'Kolhapur',service:'Electrician',expectedDemand:38,eligibleCapacity:31,gap:7,status:'HIGH_SHORTAGE',recommendedAction:'Review training and cooperative capacity'},{zone:'Panhala',service:'AC Repair',expectedDemand:22,eligibleCapacity:18,gap:4,status:'MODERATE_GAP',recommendedAction:'Review consent-based capacity exchange'},{zone:'Karveer',service:'Plumber',expectedDemand:17,eligibleCapacity:19,gap:0,status:'BALANCED',recommendedAction:'Monitor capacity'}]};
    return {ok:true,passports,opportunity,capacity,pilot:{metrics:[{name:'Booking completion rate',why:'Measure completed connected bookings.'},{name:'Worker acceptance rate',why:'Measure worker choice without forced assignment.'},{name:'Replacement continuity',why:'Measure same-booking reassignment.'}]},audit:[]};
  }

  async function ensureSharedPassword(){
    if(sharedPassword)return sharedPassword;
    try{const response=await originalFetch('/api/auth/demo-access',{cache:'no-store',credentials:'omit'});const data=await response.clone().json().catch(()=>({}));if(response.ok&&data?.password)sharedPassword=String(data.password);return sharedPassword;}catch{return '';}
  }

  function installSession(account){
    const token=tokenFor(account),all=sessions();all[token]=account;saveSessions(all);writeText(ACTIVE_TOKEN_KEY,token);return token;
  }
  function clearSession(token=''){const all=sessions();if(token)delete all[token];else Object.keys(all).forEach(key=>delete all[key]);saveSessions(all);writeText(ACTIVE_TOKEN_KEY,'');}

  async function handle(path,method,options){
    const next=state();

    if(path==='/api/auth/login'&&method==='POST'){
      const body=await requestBody(options);const identifier=String(body.identifier||'').trim().toLowerCase(),account=ACCOUNTS[identifier];
      if(!account)throw apiError(401,'INVALID_CREDENTIALS','Access ID or password is incorrect.');
      if(body.role&&String(body.role).toUpperCase()!==account.role)throw apiError(403,'ROLE_MISMATCH','This account does not have the selected role.');
      const expected=await ensureSharedPassword();if(expected&&String(body.password||'')!==expected)throw apiError(401,'INVALID_CREDENTIALS','Access ID or password is incorrect.');
      if(!expected&&!String(body.password||'').trim())throw apiError(422,'LOGIN_INPUT','Access ID and password are required.');
      const token=installSession(account);return {ok:true,user:publicUser(account),demoToken:token,authentication:'SIH_REVIEW_SESSION'};
    }
    if((path==='/api/auth/me'||path==='/api/connected/auth/me')&&method==='GET')return {ok:true,user:publicUser(requireAccount(options))};
    if((path==='/api/auth/logout'||path==='/api/connected/auth/logout')&&method==='POST'){clearSession(tokenFrom(options));return {ok:true};}
    if(path==='/api/auth/session-bridge'&&method==='POST'){const account=requireAccount(options);if(!['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(account.role))throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');const token=installSession(account);return {ok:true,demoToken:token,user:publicUser(account)};}

    if(path==='/api/connected/health'&&method==='GET')return {ok:true,service:'sanpaid-review-runtime',version:'1.0.0',database:'SESSION_SANDBOX',source:MODE,services:SERVICES.length,time:new Date().toISOString()};
    if(path==='/api/public/services'&&method==='GET')return {ok:true,source:'SANDBOX_CONFIGURATION',services:clone(SERVICES)};
    if(path==='/api/public-proof/summary'&&method==='GET'){const wi=workforceIntelligence(next);return {ok:true,source:MODE,services:SERVICES.length,workers:next.workers.length,cooperatives:3,fairOpportunity:wi.opportunity,workerTrust:{workers:wi.passports.map(p=>({...p,credential:p.credentials[0]}))},capacityMap:wi.capacity,pilot:wi.pilot};}

    if(path==='/api/connected/snapshot'&&method==='GET'){
      const account=requireAccount(options);const offers=account.role==='WORKER'?next.offers.filter(o=>o.workerPersona===account.persona&&o.offerStatus!=='QUEUED').map(o=>offerShape(next,o)):[];
      return {ok:true,role:account.role,revision:String(next.revision),bookings:next.booking?[bookingShape(next)]:[],offers};
    }

    if(path==='/api/connected/customer/services'&&method==='GET'){requireAccount(options);return {ok:true,services:clone(SERVICES)};}
    if(path==='/api/connected/customer/notifications'&&method==='GET'){requireAccount(options);return {ok:true,notifications:clone(next.notifications)};}
    if(path==='/api/connected/customer/support'&&method==='GET'){requireAccount(options);return {ok:true,requests:clone(next.support)};}
    if(path==='/api/connected/customer/support'&&method==='POST'){requireAccount(options);const body=await requestBody(options);const request={id:next.nextSupportId++,referenceCode:`SP-SUP-${String(next.nextSupportId).padStart(3,'0')}`,bookingId:body.bookingId||null,category:body.category||'Service Support',description:String(body.description||''),status:'OPEN',createdAt:new Date().toISOString()};next.support.unshift(request);save(next);return {ok:true,request:clone(request)};}

    if(path==='/api/connected/bookings'&&method==='POST'){
      const account=requireAccount(options);if(account.role!=='CUSTOMER')throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');const body=await requestBody(options),service=SERVICES.find(s=>s.name===body.service)||SERVICES[0];
      const id=next.nextBookingId++;next.booking={id,bookingCode:`SP-2026-${String(id).padStart(6,'0')}`,customerId:1,service:service.name,serviceIcon:service.icon,status:'OFFERING',zone:String(body.zone||'Kolhapur'),address:String(body.address||'Kolhapur'),problem:String(body.problem||body.voiceTranscript||'Customer service request'),requestSource:body.requestSource||'TEXT',requestLanguage:body.requestLanguage||'en',voiceTranscript:body.voiceTranscript||null,scheduledAt:body.scheduledAt||tomorrowAt(11),emergency:Boolean(body.emergency),total:Number(service.basePrice),workerId:null,workerName:null,workerVerification:null,distance:null,cooperative:'YUKTI Kolhapur Services Cooperative',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),voiceMessage:{available:false},problemPhoto:{available:false}};
      next.history.unshift(clone(next.booking));next.timeline=[{status:'OFFERING',note:'Request created. Eligibility gate passed and the first worker opportunity was sent.',at:new Date().toISOString()}];next.offers=[{offerId:next.nextOfferId++,workerPersona:'WORKER_A',offerStatus:'PENDING',rank:1,distance:3.2,score:94.6},{offerId:next.nextOfferId++,workerPersona:'WORKER_B',offerStatus:'QUEUED',rank:2,distance:6.4,score:89.8}];next.estimate=null;next.charges=[];next.payment=null;next.invoice=null;next.rating=null;next.serviceStartToken='';save(next);return bookingShape(next);
    }

    let match=path.match(/^\/api\/connected\/customer\/bookings\/(\d+)$/);
    if(match&&method==='GET'){requireAccount(options);if(Number(match[1])!==Number(next.booking?.id))throw apiError(404,'BOOKING_NOT_FOUND','Booking not found.');return bookingShape(next);}
    match=path.match(/^\/api\/connected\/customer\/bookings\/(\d+)\/timeline$/);
    if(match&&method==='GET'){requireAccount(options);return {ok:true,timeline:clone(next.timeline)};}
    match=path.match(/^\/api\/connected\/customer\/bookings\/(\d+)\/checkout$/);
    if(match&&method==='GET'){requireAccount(options);return checkout(next);}
    match=path.match(/^\/api\/connected\/customer\/bookings\/(\d+)\/charges$/);
    if(match&&method==='GET'){requireAccount(options);return clone(next.charges);}
    match=path.match(/^\/api\/connected\/bookings\/(\d+)\/estimate$/);
    if(match&&method==='GET'){requireAccount(options);return {ok:true,estimate:clone(next.estimate)};}

    if(path==='/api/connected/worker/offers'&&method==='GET'){
      const account=requireAccount(options);if(account.role!=='WORKER')throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');return next.offers.filter(o=>o.workerPersona===account.persona&&o.offerStatus!=='QUEUED').map(o=>offerShape(next,o));
    }
    match=path.match(/^\/api\/connected\/worker\/offers\/(\d+)\/respond$/);
    if(match&&method==='POST'){
      const account=requireAccount(options),offer=next.offers.find(o=>Number(o.offerId)===Number(match[1])&&o.workerPersona===account.persona);if(!offer)throw apiError(404,'OFFER_NOT_FOUND','Worker opportunity not found.');const body=await requestBody(options),action=String(body.action||'').toUpperCase();
      if(action==='ACCEPT'){offer.offerStatus='ACCEPTED';next.offers.filter(o=>o.offerId!==offer.offerId).forEach(o=>{if(o.offerStatus==='PENDING')o.offerStatus='CANCELLED';});const w=workerFor(account,next);next.booking.workerId=w.id;next.booking.workerName=w.name;next.booking.workerVerification='VERIFIED';next.booking.distance=offer.distance;touch(next,'ACCEPTED','Worker accepted the opportunity. Customer notified.');save(next);return {ok:true,accepted:true,bookingId:next.booking.id,nextWorker:false};}
      offer.offerStatus='REJECTED';const queued=next.offers.find(o=>o.offerStatus==='QUEUED');if(queued){queued.offerStatus='PENDING';touch(next,'FINDING_REPLACEMENT','Worker declined by choice. The same booking moved to the next eligible worker.');save(next);return {ok:true,accepted:false,nextWorker:true,bookingId:next.booking.id};}
      touch(next,'NO_WORKER_AVAILABLE','No additional eligible worker is currently available.');save(next);return {ok:true,accepted:false,nextWorker:false,bookingId:next.booking.id};
    }

    if(path==='/api/connected/worker/dashboard'&&method==='GET'){
      const account=requireAccount(options),w=workerFor(account,next),accepted=next.offers.some(o=>o.workerPersona===account.persona&&o.offerStatus==='ACCEPTED'),payments=next.payment&&next.booking.workerId===w.id?[{service:next.booking.service,bookingCode:next.booking.bookingCode,amount:next.payment.amount,createdAt:next.payment.createdAt}]:[];
      return {ok:true,profile:{id:w.id,name:w.name,available:next.workerAvailability[account.persona]!==false,availabilityStatus:next.workerAvailability[account.persona]!==false?'AVAILABLE':'OFF_DUTY',rating:w.rating},jobs:{active:accepted&&!['PAID','CLOSED','CANCELLED'].includes(next.booking.status)?1:0},earnings:{today:payments.reduce((s,p)=>s+p.amount,0),week:payments.reduce((s,p)=>s+p.amount,0)+2450,total:payments.reduce((s,p)=>s+p.amount,0)+18750,payments}};
    }
    if(path==='/api/connected/workforce/passport'&&method==='GET'){const account=requireAccount(options);return {ok:true,passport:passportFor(account,next)};}
    if(path==='/api/connected/worker/notifications'&&method==='GET'){const account=requireAccount(options);return {ok:true,notifications:[{title:'Opportunity control',message:'Only eligible jobs appear here. Accept or decline remains your choice.',priority:'NORMAL',createdAt:iso(-20)},{title:'Trust passport active',message:`${account.name}, your cooperative verification record is available.`,priority:'NORMAL',createdAt:iso(-60)}]};}
    if(path.startsWith('/api/connected/worker/schedule')&&method==='GET'){
      const account=requireAccount(options),url=new URL(path,location.origin),date=url.searchParams.get('date')||new Date().toISOString().slice(0,10);return {ok:true,date,slots:clone(scheduleFor(date,account,next))};
    }
    if(path==='/api/connected/worker/availability'&&method==='POST'){const account=requireAccount(options),body=await requestBody(options);next.workerAvailability[account.persona]=Boolean(body.available);const w=workerFor(account,next);w.availability=body.available?'AVAILABLE':'UNAVAILABLE';save(next);return {ok:true,available:Boolean(body.available)};}
    if(path==='/api/connected/worker/schedule/voice-intent'&&method==='POST'){const body=await requestBody(options);return {ok:true,date:body.date||new Date().toISOString().slice(0,10),startTime:'13:00',endTime:'17:00',status:'UNAVAILABLE',summary:'Mark 1 PM to 5 PM as unavailable.'};}
    if(path==='/api/connected/worker/schedule'&&method==='POST'){const account=requireAccount(options),body=await requestBody(options),slots=scheduleFor(body.date,account,next),slot=slots.find(x=>x.startTime===body.startTime&&x.endTime===body.endTime);if(slot){slot.status=body.status;slot.baseStatus=body.status;slot.displayStatus=body.status;}save(next);return {ok:true};}

    match=path.match(/^\/api\/connected\/worker\/jobs\/(\d+)\/estimate$/);
    if(match&&method==='POST'){requireAccount(options);const body=await requestBody(options),items=(body.items||[]).map((x,i)=>({id:i+1,description:String(x.description||''),amount:Number(x.amount||0)})),total=items.reduce((s,x)=>s+x.amount,0);next.estimate={id:1,status:'PENDING',items,total,note:String(body.note||''),createdAt:new Date().toISOString()};save(next);return {ok:true,estimate:clone(next.estimate)};}
    match=path.match(/^\/api\/connected\/customer\/bookings\/(\d+)\/estimate\/decision$/);
    if(match&&method==='POST'){requireAccount(options);if(!next.estimate)throw apiError(404,'ESTIMATE_NOT_FOUND','Estimate not found.');const body=await requestBody(options);next.estimate.status=String(body.decision||'').toUpperCase()==='APPROVE'?'APPROVED':'REJECTED';save(next);return {ok:true,estimate:clone(next.estimate)};}

    const lifecycle=[['travel','ON_THE_WAY','Worker started travel to the customer.'],['arrive','ARRIVED','Worker marked arrival at the service location.'],['start','IN_PROGRESS','Service started after both trust checks.'],['completion-request','AWAITING_CUSTOMER_CONFIRMATION','Worker requested customer completion confirmation.']];
    for(const [action,status,note] of lifecycle){match=path.match(new RegExp(`^/api/connected/jobs/(\\d+)/${action}$`));if(match&&method==='POST'){requireAccount(options);touch(next,status,note);save(next);return {ok:true,status};}}
    match=path.match(/^\/api\/connected\/jobs\/(\d+)\/identity$/);
    if(match&&method==='POST'){requireAccount(options);if(next.estimate?.status!=='APPROVED')throw apiError(409,'ESTIMATE_REQUIRED','Customer estimate approval is required first.');touch(next,'IDENTITY_VERIFIED','Worker identity verified for service start.');next.serviceStartToken=`SPV-${next.booking.id}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;save(next);return {ok:true,status:'IDENTITY_VERIFIED',token:next.serviceStartToken};}

    match=path.match(/^\/api\/connected\/service-start\/([^/]+)$/);
    if(match&&method==='GET'){requireAccount(options);if(decodeURIComponent(match[1])!==next.serviceStartToken||!next.serviceStartToken)throw apiError(404,'TOKEN_NOT_FOUND','Verification code not found.');const w=assignedAccount(next);return {ok:true,bookingId:next.booking.id,bookingCode:next.booking.bookingCode,service:next.booking.service,workerName:w?.name||next.booking.workerName,workerVerification:'VERIFIED',cooperative:next.booking.cooperative};}
    match=path.match(/^\/api\/connected\/service-start\/([^/]+)\/confirm$/);
    if(match&&method==='POST'){requireAccount(options);if(decodeURIComponent(match[1])!==next.serviceStartToken)throw apiError(404,'TOKEN_NOT_FOUND','Verification code not found.');touch(next,'CUSTOMER_CONFIRMED','Customer confirmed the booked worker. Service start unlocked.');save(next);return {ok:true,status:'CUSTOMER_CONFIRMED'};}
    match=path.match(/^\/api\/connected\/customer\/bookings\/(\d+)\/complete$/);
    if(match&&method==='POST'){requireAccount(options);touch(next,'COMPLETED','Customer confirmed service completion.');save(next);return {ok:true,status:'COMPLETED'};}

    match=path.match(/^\/api\/connected\/worker\/jobs\/(\d+)\/extra-charge$/);
    if(match&&method==='POST'){requireAccount(options);const body=await requestBody(options),charge={id:next.nextChargeId++,workItem:String(body.workItem||'Additional work'),reason:String(body.reason||''),amount:Number(body.amount||0),status:'PENDING'};next.charges.push(charge);save(next);return {ok:true,charge:clone(charge)};}
    match=path.match(/^\/api\/connected\/customer\/charges\/(\d+)\/decision$/);
    if(match&&method==='POST'){requireAccount(options);const charge=next.charges.find(x=>Number(x.id)===Number(match[1]));if(!charge)throw apiError(404,'CHARGE_NOT_FOUND','Additional charge not found.');const body=await requestBody(options);charge.status=String(body.decision||'').toUpperCase()==='APPROVE'?'APPROVED':'REJECTED';save(next);return {ok:true,charge:clone(charge)};}
    match=path.match(/^\/api\/connected\/customer\/bookings\/(\d+)\/pay$/);
    if(match&&method==='POST'){requireAccount(options);const body=await requestBody(options),c=checkout(next);next.payment={amount:c.finalAmount,paymentMethod:String(body.method||'SANDBOX'),transactionReference:`SPTX-${Date.now().toString(36).toUpperCase()}`,createdAt:new Date().toISOString()};next.invoice={invoiceNumber:`SPI-2026-${String(next.booking.id).padStart(5,'0')}`,amount:c.finalAmount,createdAt:next.payment.createdAt};touch(next,'PAID','Sandbox payment and invoice recorded.');save(next);return {ok:true,payment:clone(next.payment),invoice:clone(next.invoice)};}
    match=path.match(/^\/api\/connected\/customer\/bookings\/(\d+)\/rating$/);
    if(match&&method==='POST'){requireAccount(options);const body=await requestBody(options);next.rating={stars:Number(body.stars||5),feedback:String(body.feedback||''),createdAt:new Date().toISOString()};save(next);return {ok:true,rating:clone(next.rating)};}

    if(path==='/api/connected/worker/capacity-offers'&&method==='GET'){const account=requireAccount(options);return clone(next.capacityOffers.filter(x=>x.workerPersona===account.persona));}
    match=path.match(/^\/api\/connected\/worker\/capacity-offers\/(\d+)\/respond$/);
    if(match&&method==='POST'){const account=requireAccount(options),offer=next.capacityOffers.find(x=>Number(x.offerId)===Number(match[1])&&x.workerPersona===account.persona);if(!offer)throw apiError(404,'CAPACITY_OFFER_NOT_FOUND','Capacity offer not found.');const body=await requestBody(options);offer.offerStatus=String(body.action||'').toUpperCase()==='ACCEPT'?'ACCEPTED':'REJECTED';const req=next.capacityRequests.find(x=>Number(x.id)===Number(offer.requestId));if(req&&offer.offerStatus==='ACCEPTED'){req.acceptedWorkers=Number(req.acceptedWorkers||0)+1;req.status=req.acceptedWorkers>=Number(req.workersRequired||1)?'CONSENT_READY':'CONSENT_PARTIAL';}save(next);return {ok:true,message:offer.offerStatus==='ACCEPTED'?'Consent recorded. Authorized approval is still required.':'Capacity offer declined.'};}

    if(path==='/api/connected/judge/readiness'&&method==='GET'){requireAccount(options);return {ok:true,checks:{customerActive:true,workerAReady:true,workerBReady:true,cooperativeAdminActive:true,federationAdminActive:true,unverifiedProofReady:true,noStalePendingOffers:true}};}
    if(path==='/api/connected/judge/overview'&&method==='GET'){requireAccount(options);return overview(next);}
    if(path==='/api/connected/judge/latest-demo-booking'&&method==='GET'){requireAccount(options);return {ok:true,booking:bookingShape(next)};}
    match=path.match(/^\/api\/connected\/judge\/match\/(\d+)$/);if(match&&method==='GET'){requireAccount(options);return matching(next);}
    if(path==='/api/connected/judge/planning'&&method==='GET'){requireAccount(options);return planning();}
    if(path==='/api/connected/judge/workforce-intelligence'&&method==='GET'){requireAccount(options);return workforceIntelligence(next);}

    if(path==='/api/cooperative-admin/workspace'&&method==='GET'){const account=requireAccount(options);if(account.role!=='COOPERATIVE_ADMIN')throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');return cooperativeWorkspace(next);}
    if(path==='/api/cooperative-admin/capacity-requests'&&method==='POST'){const account=requireAccount(options);if(account.role!=='COOPERATIVE_ADMIN')throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');const body=await requestBody(options),request={id:next.nextCapacityId++,requestCode:`CAP-2026-${String(next.nextCapacityId).padStart(3,'0')}`,service:String(body.service||'Electrician'),zone:String(body.zone||'Kolhapur'),workersRequired:Number(body.workersRequired||1),requestingCooperative:'YUKTI Kolhapur Services Cooperative',providingCooperative:null,status:'REQUESTED',offeredWorkers:0,acceptedWorkers:0,approvedAssignments:0,requestedAt:new Date().toISOString()};next.capacityRequests.unshift(request);save(next);return {ok:true,request:clone(request)};}
    match=path.match(/^\/api\/cooperative-admin\/workers\/(\d+)\/verification$/);if(match&&method==='POST'){const account=requireAccount(options);if(account.role!=='COOPERATIVE_ADMIN')throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');const worker=next.workers.find(w=>Number(w.id)===Number(match[1]));if(!worker)throw apiError(404,'WORKER_NOT_FOUND','Worker not found.');worker.verificationStatus='VERIFIED';worker.pendingDocuments=0;save(next);return {ok:true,worker:clone(worker)};}

    if(path==='/api/federation/capacity-requests'&&method==='GET'){const account=requireAccount(options);if(account.role!=='FEDERATION_ADMIN')throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');return {ok:true,requests:clone(next.capacityRequests)};}
    match=path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/offer-provider$/);if(match&&method==='POST'){const account=requireAccount(options);if(account.role!=='FEDERATION_ADMIN')throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');const body=await requestBody(options),req=next.capacityRequests.find(x=>Number(x.id)===Number(match[1]));if(!req)throw apiError(404,'CAPACITY_NOT_FOUND','Capacity request not found.');req.providingCooperative=Number(body.providingCooperativeId)===2?'YUKTI Panhala Worker Cooperative':'Karveer Community Services Cooperative';req.status='AWAITING_WORKER_CONSENT';req.offeredWorkers=Math.max(1,req.workersRequired);next.capacityOffers.push({offerId:600+req.id,workerPersona:'WORKER_A',offerStatus:'OFFERED',requestId:req.id,requestCode:req.requestCode,service:req.service,zone:req.zone,requestingCooperative:req.requestingCooperative,providingCooperative:req.providingCooperative});save(next);return {ok:true,workerOffersCreated:req.offeredWorkers};}
    match=path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/approve$/);if(match&&method==='POST'){const account=requireAccount(options);if(account.role!=='FEDERATION_ADMIN')throw apiError(403,'ROLE_FORBIDDEN','This action is not available for this role.');const req=next.capacityRequests.find(x=>Number(x.id)===Number(match[1]));if(!req)throw apiError(404,'CAPACITY_NOT_FOUND','Capacity request not found.');req.status='APPROVED';req.approvedAssignments=Math.max(1,req.acceptedWorkers||req.workersRequired||1);save(next);return {ok:true,approvedWorkers:req.approvedAssignments};}

    if(path==='/api/connected/judge/training/recommend-default'&&method==='POST'){requireAccount(options);return {ok:true,recommendation:{status:'RECOMMENDED'}};}

    if(/\/notifications$/.test(path)&&method==='GET')return {ok:true,notifications:[]};
    if(/\/offers$/.test(path)&&method==='GET')return [];
    if(/\/charges$/.test(path)&&method==='GET')return [];
    return {ok:true,source:MODE};
  }

  async function reviewFetch(input,options={}){
    const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';
    let url;try{url=new URL(raw,location.href);}catch{return originalFetch(input,options);}
    if(url.origin!==location.origin)return originalFetch(input,options);

    if(url.pathname==='/api/auth/demo-access'){
      try{const response=await originalFetch(input,{...options,cache:'no-store'});const data=await response.clone().json().catch(()=>({}));if(response.ok&&data?.password)sharedPassword=String(data.password);return response;}catch(error){return json({ok:true,mode:'SHARED_PLATFORM_ACCESS',accounts:Object.values(ACCOUNTS).map(({accessId,name,role,persona})=>({accessId,name,role,persona})),warning:'Review access is available in this browser session.'});}
    }
    if(!url.pathname.startsWith('/api/'))return originalFetch(input,options);
    const method=String(options.method||input?.method||'GET').toUpperCase();
    try{return json(await handle(`${url.pathname}${url.search}`,method,options));}
    catch(error){return errorResponse(error);}
  }

  window.fetch=reviewFetch;
  window.SanPaidReviewRuntime=Object.freeze({
    enabled:true,mode:MODE,
    reset:()=>{try{sessionStorage.removeItem(STATE_KEY);sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(ACTIVE_TOKEN_KEY);sessionStorage.removeItem('sanpaid_connected_booking_id');}catch{}return freshState();},
    state:()=>clone(state())
  });
  document.documentElement.dataset.sanpaidRuntime='review';
})();
