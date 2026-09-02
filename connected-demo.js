(() => {
  'use strict';

  const BOOKING_KEY='sanpaid_connected_booking_id';
  const STATUS_LABELS={
    REQUESTED:'Finding Verified Worker',VALIDATING:'Checking Eligibility',MATCHING:'Finding Verified Worker',OFFERING:'Waiting for Worker Response',PENDING_WORKER_ACCEPTANCE:'Waiting for Worker Response',FINDING_REPLACEMENT:'Finding Another Verified Worker',ASSIGNED:'Worker Assigned',ACCEPTED:'Worker Assigned',ON_THE_WAY:'Worker On The Way',TRAVELING:'Worker On The Way',ARRIVED:'Worker Arrived',IDENTITY_VERIFIED:'Worker Identity Verified',CUSTOMER_CONFIRMED:'Worker Confirmed',SERVICE_STARTED:'Service Started',IN_PROGRESS:'Service In Progress',AWAITING_CUSTOMER_CONFIRMATION:'Waiting for Completion Confirmation',COMPLETED:'Service Completed',PAYMENT_PENDING:'Payment Pending',PAID:'Payment Completed',CLOSED:'Closed',CANCELLED:'Cancelled',NO_WORKER_AVAILABLE:'No Eligible Worker Available'
  };
  let currentUser=null,currentPersona=null,unsubscribeSync=null,activeBookingId=null;
  let voiceMeta={source:'TEXT',language:'mr',transcript:''};
  let lastCustomerSignature='',lastWorkerSignature='';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const localDate=(offsetDays=0)=>{const d=new Date();d.setDate(d.getDate()+offsetDays);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const statusLabel=status=>STATUS_LABELS[String(status||'').toUpperCase()]||String(status||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const sessionGet=key=>{try{return sessionStorage.getItem(key)||'';}catch{return '';}};
  const sessionSet=(key,value)=>{try{value?sessionStorage.setItem(key,String(value)):sessionStorage.removeItem(key);}catch{}};

  function friendlyError(err,context='request'){
    const status=Number(err?.status||0),raw=String(err?.message||'').toLowerCase();
    if(status===401){window.SanPaidAuth?.handleExpiredSession?.();return 'Your session expired. Please log in again.';}
    if(status===403)return 'This action is not available for this role.';
    if(status===404)return context==='booking'?'This booking is no longer available.':'The requested item could not be found.';
    if(status===409)return context==='offer'?'This job is no longer available. Refreshing your offers…':err?.message||'This action was already completed on another device.';
    if(status===422)return err?.message||'Please check the entered details.';
    if(status===429)return 'Too many requests. Please wait a moment and retry.';
    if(status>=500||/timeout|connect|unavailable|failed/.test(raw))return 'Service temporarily unavailable. Please retry.';
    return context==='booking'?'Booking could not be created. Please retry.':err?.message||'Something went wrong. Please retry.';
  }
  async function request(path,opt={}){
    if(window.SanPaidApi?.request)return window.SanPaidApi.request(path,opt);
    const response=await fetch(path,{...opt,credentials:'include',headers:{...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})},cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(data.message||data.error||`Request failed (${response.status})`);error.status=response.status;error.data=data;throw error;}
    return data;
  }
  const post=(path,body={})=>window.SanPaidApi?.post?window.SanPaidApi.post(path,body):request(path,{method:'POST',body:JSON.stringify(body)});

  function shell(){
    let root=document.getElementById('connectedShell');
    if(root)return root;
    root=document.createElement('section');root.id='connectedShell';root.className='connected-shell hidden';root.setAttribute('aria-label','SanPaid customer and worker workspace');
    root.innerHTML=`<header class="connected-top"><div><div class="brand">San<span>Paid</span></div><div id="connectedHeaderSubtitle" class="connected-top-subtitle">Connected service network</div></div><div class="actions"><span id="connectedTopStatus" class="connected-live">Checking…</span><button class="btn ghost small close-connected" id="connectedClose" aria-label="Close dashboard">✕</button></div></header><main class="connected-main" id="connectedContent"></main><div id="connectedModalRoot"></div>`;
    document.body.appendChild(root);root.querySelector('#connectedClose').onclick=close;return root;
  }
  function setHeaderSubtitle(text){const el=shell().querySelector('#connectedHeaderSubtitle');if(el)el.textContent=text;}
  function setLiveState(state){const el=shell().querySelector('#connectedTopStatus');if(!el)return;const map={online:['● Live','#8ee2b5'],checking:['Checking…','#b8c6d8'],offline:['● Offline','#ff9b9b'],retry:['● Reconnecting…','#ffb66e']};const [text,color]=map[state]||map.checking;el.textContent=text;el.style.color=color;}
  async function checkHealth(){try{const h=await request('/api/connected/health',{bearer:false});setLiveState(h.ok?'online':'offline');}catch{setLiveState('offline');}}
  function requestedRole(persona){return persona==='CUSTOMER'?'CUSTOMER':persona==='WORKER_A'||persona==='WORKER_B'?'WORKER':null;}

  async function resolveUser(){
    try{return await window.SanPaidAuth?.restoreSession?.()||window.SanPaidAuth?.getCurrentUser?.()||null;}catch{}
    try{return (await request('/api/auth/me',{bearer:false})).user||null;}catch{return null;}
  }

  async function open(persona=null){
    currentPersona=persona||currentPersona;const want=requestedRole(currentPersona);
    const user=await resolveUser();const actual=String(user?.role||'').toUpperCase();
    if(!user||!['CUSTOMER','WORKER'].includes(actual)||(want&&actual!==want)){
      close({clearIntent:false});
      window.SanPaidAuth?.open?.(want||'CUSTOMER','login',currentPersona||null);
      return false;
    }
    currentUser=user;const root=shell();root.classList.remove('hidden');document.body.style.overflow='hidden';setLiveState('checking');await checkHealth();renderApp();connectStream();return true;
  }

  function close({clearIntent=true}={}){
    const root=document.getElementById('connectedShell');if(root)root.classList.add('hidden');document.body.style.overflow='';stopStream();closeDecisionModal();
    if(clearIntent)window.SanPaidAuth?.clearWorkspace?.();
  }

  function renderApp(){if(!currentUser)return;if(currentUser.role==='CUSTOMER')renderCustomer();else if(currentUser.role==='WORKER')renderWorker();}
  function appHeader(title,subtitle){return `<div class="connected-status"><span class="connected-badge">CONNECTED WORKSPACE</span><span class="connected-live">${esc(currentUser.fullName||currentUser.email||'SanPaid user')}</span></div><div class="connected-card connected-app-heading"><div class="connected-heading-row"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="connected-actions connected-header-actions"><button class="btn secondary small" id="connectedSwitch">Switch Role</button><button class="btn danger small" id="connectedLogout">Logout</button></div></div></div>`;}
  function wireHeader(){
    document.getElementById('connectedSwitch')?.addEventListener('click',async()=>{close();await window.SanPaidAuth?.logout?.({silent:true});window.SanPaidAuth?.open?.('CUSTOMER','login');});
    document.getElementById('connectedLogout')?.addEventListener('click',async()=>{close();await window.SanPaidAuth?.logout?.();});
  }

  async function loadServiceCatalog(){
    const select=document.getElementById('cdService');if(!select)return;
    try{
      const data=await request('/api/public/services',{bearer:false}),rows=data.services||[],prefill=sessionGet('sanpaid_prefill_service_v1'),current=prefill||select.value;
      select.innerHTML=rows.length?rows.map(service=>`<option value="${esc(service.name)}">${esc(service.name)} · configured base ₹${Number(service.basePrice||0).toLocaleString('en-IN')}</option>`).join(''):'<option value="" disabled>No active services configured</option>';
      if(rows.some(service=>service.name===current))select.value=current;
      if(prefill)sessionSet('sanpaid_prefill_service_v1','');
      window.dispatchEvent(new CustomEvent('sanpaid:services-loaded',{detail:{services:rows,source:data.source||'DATABASE_CONFIGURATION'}}));
    }catch{select.innerHTML='<option value="" disabled selected>Service catalog unavailable — retry</option>';}
  }

  function renderCustomer(){
    setHeaderSubtitle('Customer Dashboard');const content=shell().querySelector('#connectedContent');content.dataset.connectedRole='CUSTOMER';lastCustomerSignature='';
    const area=sessionGet('sanpaid_prefill_area_v1')||'Karad Zone 1';sessionSet('sanpaid_prefill_area_v1','');
    content.innerHTML=appHeader('Customer Dashboard','Book a verified local service and always see the next action clearly.')+`<div class="connected-grid connected-customer-grid"><div class="connected-card"><span class="connected-step-label">BOOK SERVICE</span><h3>Tell us what you need</h3><form id="connectedBookingForm" class="connected-form"><div class="field"><label>Service</label><select id="cdService" required><option value="">Loading services…</option></select></div><div class="connected-form-row"><div class="field"><label>Requested Date</label><input id="cdDate" type="date" value="${localDate(1)}" min="${localDate(0)}" required></div><div class="field"><label>Preferred Time</label><select id="cdTime"><option value="09:00">9 AM</option><option value="11:00">11 AM</option><option value="13:00">1 PM</option><option value="15:00">3 PM</option><option value="17:00">5 PM</option></select></div></div><div class="field"><label>Location / Area</label><input id="cdZone" value="${esc(area)}" required></div><div class="field"><label>Service Address</label><input id="cdAddress" value="Demo Address, ${esc(area)}" required></div><div class="field"><label>Language</label><select id="cdLang"><option value="mr">Marathi</option><option value="hi">Hindi</option><option value="en">English</option></select></div><div class="field"><label>Describe the problem</label><textarea id="cdProblem" required placeholder="Describe the service request"></textarea></div><label class="connected-check"><input id="cdEmergency" type="checkbox"><span><b>Urgent service</b><small>Uses the configured prototype urgent-service policy.</small></span></label><div class="connected-actions"><button type="button" class="btn secondary" id="cdVoice">🎙 Speak Request</button><button class="btn primary" type="submit" id="cdSubmit">Find Verified Worker</button></div><div id="cdVoiceStatus" class="connected-demo-note">Voice is optional. Review the captured text before sending.</div><div id="cdBookingProgress"></div><div id="cdBookingError"></div></form></div><div class="connected-card"><span class="connected-step-label">LIVE STATUS</span><h3>Your Service Request</h3><div id="connectedCustomerState" class="connected-booking-state"><div class="connected-empty"><b>No active booking</b><br>Book a verified local service to begin.</div></div></div></div>`;
    wireHeader();document.getElementById('cdVoice').onclick=startCustomerVoice;document.getElementById('connectedBookingForm').onsubmit=createConnectedBooking;loadServiceCatalog();loadLatestCustomerBooking();
  }

  function langCode(short){return short==='mr'?'mr-IN':short==='hi'?'hi-IN':'en-IN';}
  function startCustomerVoice(){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition,status=document.getElementById('cdVoiceStatus'),btn=document.getElementById('cdVoice');
    if(!Recognition){status.textContent='Microphone recognition is unavailable here. Type the request instead.';return;}
    const recognition=new Recognition(),lang=document.getElementById('cdLang').value;recognition.lang=langCode(lang);recognition.interimResults=false;recognition.maxAlternatives=1;btn.disabled=true;btn.textContent='Listening…';
    recognition.onresult=event=>{const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();if(transcript){document.getElementById('cdProblem').value=transcript;voiceMeta={source:'VOICE',language:lang,transcript};status.textContent='Voice captured. Review the text before sending.';}};
    recognition.onerror=()=>{status.textContent='Voice capture unavailable. Text input still works.';};recognition.onend=()=>{btn.disabled=false;btn.textContent='🎙 Speak Request';};
    try{recognition.start();}catch{btn.disabled=false;btn.textContent='🎙 Speak Request';status.textContent='Microphone could not start. Type the request instead.';}
  }

  async function createConnectedBooking(event){
    event.preventDefault();const error=document.getElementById('cdBookingError'),progress=document.getElementById('cdBookingProgress'),btn=document.getElementById('cdSubmit');error.innerHTML='';
    const service=document.getElementById('cdService').value,problem=document.getElementById('cdProblem').value.trim(),lang=document.getElementById('cdLang').value,date=document.getElementById('cdDate').value,time=document.getElementById('cdTime').value;
    if(!service){error.innerHTML='<div class="connected-error">Choose a service after the catalog loads.</div>';return;}
    if(problem.length<3){error.innerHTML='<div class="connected-error">Describe the service problem before continuing.</div>';return;}
    const scheduled=new Date(`${date}T${time}:00`);if(!date||!time||Number.isNaN(scheduled.getTime())||scheduled.getTime()<Date.now()-60000){error.innerHTML='<div class="connected-error">Choose a current or future service date and time.</div>';return;}
    const isVoice=voiceMeta.source==='VOICE'&&voiceMeta.transcript===problem;btn.disabled=true;btn.textContent='Finding verified workers…';progress.innerHTML='<div class="connected-progress-note"><b>Checking worker eligibility</b><span>Identity · Skill · Availability · Credentials · Schedule · Demo Radius</span></div>';
    try{
      const booking=await post('/api/connected/bookings',{service,zone:document.getElementById('cdZone').value.trim(),address:document.getElementById('cdAddress').value.trim(),problem,requestSource:isVoice?'VOICE':'TEXT',requestLanguage:lang,voiceTranscript:isVoice?problem:null,scheduledAt:scheduled.toISOString(),emergency:document.getElementById('cdEmergency').checked});
      activeBookingId=Number(booking.id);sessionSet(BOOKING_KEY,activeBookingId);progress.innerHTML='<div class="connected-success">Request created. Eligible workers are being offered this booking in canonical rank order.</div>';renderCustomerState(booking,true);await refreshCustomerBooking();signalSync('customer-booking');
    }catch(err){error.innerHTML=`<div class="connected-error">${esc(friendlyError(err,'booking'))}</div>`;progress.innerHTML='';}
    finally{btn.disabled=false;btn.textContent='Find Verified Worker';}
  }

  async function loadLatestCustomerBooking(){
    const saved=Number(sessionGet(BOOKING_KEY)||0);if(saved){activeBookingId=saved;await refreshCustomerBooking();return;}
    try{const snapshot=await request('/api/connected/snapshot'),latest=snapshot.bookings?.[0];if(latest?.id){activeBookingId=Number(latest.id);sessionSet(BOOKING_KEY,activeBookingId);await refreshCustomerBooking();}}catch{}
  }
  async function refreshCustomerBooking(){
    if(!activeBookingId)return;
    try{const booking=await request(`/api/connected/customer/bookings/${activeBookingId}`);renderCustomerState(booking);}
    catch(err){if(err.status===404){sessionSet(BOOKING_KEY,'');activeBookingId=null;lastCustomerSignature='';}else if(err.status===401)friendlyError(err);}
  }
  function bookingStep(status){const value=String(status||'').toUpperCase();if(['PAID','CLOSED'].includes(value))return 6;if(['COMPLETED','PAYMENT_PENDING','SERVICE_STARTED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION'].includes(value))return 5;if(['IDENTITY_VERIFIED','CUSTOMER_CONFIRMED'].includes(value))return 4;if(value==='ARRIVED')return 3;if(['ASSIGNED','ACCEPTED','ON_THE_WAY','TRAVELING'].includes(value))return 2;if(['OFFERING','PENDING_WORKER_ACCEPTANCE','FINDING_REPLACEMENT','NO_WORKER_AVAILABLE'].includes(value))return 1;return 0;}
  function stepper(status){const current=bookingStep(status),labels=['Request','Worker Match','Accepted','Arrival','Verification','Service','Payment'];return `<div class="connected-stepper">${labels.map((label,index)=>`<div class="connected-step ${index<current?'done':index===current?'active':''}"><span>${index<current?'✓':index+1}</span><small>${label}</small></div>`).join('')}</div>`;}
  function renderCustomerState(booking,force=false){
    const root=document.getElementById('connectedCustomerState');if(!root)return;const signature=JSON.stringify([booking.id,booking.status,booking.workerName,booking.workerVerification,booking.distance,booking.cooperative,booking.scheduledAt,booking.emergency,booking.updatedAt]);if(!force&&signature===lastCustomerSignature)return;lastCustomerSignature=signature;
    const status=String(booking.status||''),replacement=status==='FINDING_REPLACEMENT',assigned=!!booking.workerName;
    root.innerHTML=`${stepper(status)}<div class="connected-success connected-request-summary"><div><small>Booking ID</small><b>${esc(booking.bookingCode||`#${booking.id}`)}</b></div><span class="badge ${replacement?'b-orange':'b-green'}">${esc(statusLabel(status))}</span></div><div class="connected-state-line"><b>${replacement?'Finding another verified worker…':'Current status'}</b><p>${esc(statusLabel(status))}</p></div><div class="connected-state-line"><div class="connected-summary-grid"><div><small>Service</small><b>${esc(booking.service||'Service')}</b></div><div><small>Scheduled</small><b>${booking.scheduledAt?esc(new Date(booking.scheduledAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})):'—'}</b></div><div><small>Urgency</small><b>${booking.emergency?'Urgent':'Standard'}</b></div><div><small>Request</small><b>${esc(booking.requestSource==='VOICE'?'Voice':'Text')}</b></div></div></div>${assigned?`<div class="connected-state-line connected-worker-assigned"><span class="connected-step-label">ASSIGNED WORKER</span><h4>${esc(booking.workerName)}</h4><p>${esc(booking.workerVerification||'VERIFIED')} · ${booking.distance!=null?`DEMO DISTANCE ${esc(booking.distance)} km · `:''}${esc(booking.cooperative||'Cooperative')}</p></div>`:`<div class="connected-state-line"><b>${replacement?'Replacement search active':'Waiting for worker response'}</b><p>No worker appears assigned until that worker accepts.</p></div>`}`;
  }

  function renderWorker(){
    setHeaderSubtitle('Worker Dashboard');const content=shell().querySelector('#connectedContent');content.dataset.connectedRole='WORKER';lastWorkerSignature='';
    content.innerHTML=appHeader('Worker Dashboard','Review suitable opportunities, choose work and follow one trusted service workflow.')+`<div class="connected-card"><div class="connected-heading-row"><div><span class="connected-step-label">JOB REQUESTS</span><h3>Available Work</h3><p>Opportunities appear only after eligibility checks. Accept or Decline remains your choice.</p></div><button class="btn secondary small" id="connectedRefreshOffers">Refresh</button></div><div id="connectedWorkerMessage"></div><div id="connectedWorkerOffers" class="connected-list"><div class="connected-empty">Loading job offers…</div></div></div>`;
    wireHeader();document.getElementById('connectedRefreshOffers').onclick=()=>loadWorkerOffers(true);loadWorkerOffers(true);
  }
  async function loadWorkerOffers(force=false){
    const root=document.getElementById('connectedWorkerOffers');if(!root)return;
    try{const offers=await request('/api/connected/worker/offers'),signature=JSON.stringify((offers||[]).map(offer=>[offer.offerId,offer.offerStatus,offer.status,offer.bookingId,offer.distance,offer.total,offer.scheduledAt]));if(!force&&signature===lastWorkerSignature)return;lastWorkerSignature=signature;root.innerHTML=offers.length?offers.map(offerCard).join(''):'<div class="connected-empty"><b>No job requests right now</b><br>Stay available. Suitable opportunities will appear here.</div>';wireOfferActions();}
    catch(err){root.innerHTML=`<div class="connected-error">${esc(friendlyError(err,'offer'))}</div>`;}
  }
  function offerCard(offer){
    const accepted=offer.offerStatus==='ACCEPTED';return `<article class="connected-offer" data-offer="${Number(offer.offerId)}"><div class="connected-offer-head"><div><span class="badge ${accepted?'b-green':'b-orange'}">${accepted?'ACCEPTED':'NEW JOB REQUEST'}</span><h4>${esc(offer.service)}</h4><p>${esc(offer.zone||'Customer area')} ${offer.distance!=null?`· DEMO DISTANCE ${esc(offer.distance)} km`:''}</p></div><div class="connected-earnings"><small>Expected Amount</small><b>₹${Number(offer.total||0).toLocaleString('en-IN')}</b></div></div><div class="connected-meta"><div>Schedule<b>${offer.scheduledAt?new Date(offer.scheduledAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—'}</b></div><div>Cooperative<b>${esc(offer.cooperative||'—')}</b></div><div>Booking ID<b>${esc(offer.bookingCode||'—')}</b></div><div>Distance<b>${offer.distance!=null?`DEMO ${esc(offer.distance)} km`:'—'}</b></div></div><div class="connected-state-line"><b>Customer Request</b><p>${esc(offer.problem||offer.voiceTranscript||'No additional description')}</p></div>${offer.offerStatus==='PENDING'?`<div class="connected-actions connected-offer-actions"><button class="btn danger" data-reject-offer="${Number(offer.offerId)}">Decline</button><button class="btn primary" data-accept-offer="${Number(offer.offerId)}">Accept Job</button></div>`:'<div class="connected-success">Job accepted. This booking is assigned to you.</div>'}</article>`;
  }
  function wireOfferActions(){document.querySelectorAll('[data-accept-offer]').forEach(button=>button.onclick=()=>respondOffer(button,'ACCEPT'));document.querySelectorAll('[data-reject-offer]').forEach(button=>button.onclick=()=>openDecisionModal(button));}
  function openDecisionModal(button){const root=document.getElementById('connectedModalRoot');root.innerHTML=`<div class="connected-modal-backdrop"><div class="connected-modal" role="dialog" aria-modal="true" aria-labelledby="declineTitle"><h3 id="declineTitle">Why are you declining this job?</h3><p>The reason is recorded. The same customer booking continues to the next eligible worker where possible.</p><div class="connected-choice-list">${['Schedule Conflict','Too Far','Unavailable','Not My Skill','Personal Reason','Other'].map((reason,index)=>`<label><input type="radio" name="declineReason" value="${reason}" ${index===0?'checked':''}><span>${reason}</span></label>`).join('')}</div><div class="connected-actions"><button class="btn secondary" data-modal-cancel>Cancel</button><button class="btn danger" data-modal-confirm>Decline Job</button></div></div></div>`;root.querySelector('[data-modal-cancel]').onclick=closeDecisionModal;root.querySelector('[data-modal-confirm]').onclick=()=>{const reason=root.querySelector('input[name="declineReason"]:checked')?.value||'Other';closeDecisionModal();respondOffer(button,'REJECT',reason);};}
  function closeDecisionModal(){const root=document.getElementById('connectedModalRoot');if(root)root.innerHTML='';}
  function workerMessage(text,type='success'){const element=document.getElementById('connectedWorkerMessage');if(element)element.innerHTML=`<div class="${type==='error'?'connected-error':type==='warn'?'connected-demo-note':'connected-success'}">${esc(text)}</div>`;}
  async function respondOffer(button,action,reason=''){
    if(button.disabled)return;const id=button.dataset.acceptOffer||button.dataset.rejectOffer,old=button.textContent;button.disabled=true;button.textContent=action==='ACCEPT'?'Accepting Job…':'Declining Job…';
    try{const result=await post(`/api/connected/worker/offers/${id}/respond`,{action,reason});lastWorkerSignature='';await loadWorkerOffers(true);workerMessage(action==='REJECT'?(result.nextWorker?'Job declined. The same booking is moving to the next eligible worker.':'Job declined. No assignment penalty is applied.'):'Job accepted. The customer has been notified.',action==='REJECT'?'warn':'success');signalSync('worker-offer');}
    catch(err){workerMessage(friendlyError(err,'offer'),'error');button.disabled=false;button.textContent=old;lastWorkerSignature='';await loadWorkerOffers(true);}
  }

  function signalSync(source){
    try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source,at:Date.now()}}));}catch{}
    window.SanPaidSync?.refreshNow?.();
  }
  function applySnapshot(snapshot){
    if(snapshot?.role==='CUSTOMER'){
      const latest=snapshot.bookings?.[0];
      if(latest){activeBookingId=Number(latest.id);sessionSet(BOOKING_KEY,activeBookingId);refreshCustomerBooking();}
    }else if(snapshot?.role==='WORKER')loadWorkerOffers();
  }
  function connectStream(){
    stopStream();
    if(!window.SanPaidSync?.subscribe){setLiveState('retry');return;}
    unsubscribeSync=window.SanPaidSync.subscribe(snapshot=>{applySnapshot(snapshot);setLiveState('online');});
    window.SanPaidSync.refreshNow();
  }
  function stopStream(){if(unsubscribeSync){unsubscribeSync();unsubscribeSync=null;}}

  window.ConnectedSanPaid={open,close,refreshCustomerBooking,loadWorkerOffers,reloadServices:loadServiceCatalog};
})();
