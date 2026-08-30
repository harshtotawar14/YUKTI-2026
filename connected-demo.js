(() => {
  'use strict';

  const PASSWORD='Demo@2026';
  const ACCOUNTS={
    CUSTOMER:{email:'customer.connected@sanpaid.demo',name:'Connected Demo Customer',label:'Customer Phone'},
    WORKER_A:{email:'worker1.connected@sanpaid.demo',name:'Amit Connected',label:'Worker A Phone'},
    WORKER_B:{email:'worker2.connected@sanpaid.demo',name:'Suresh Connected',label:'Worker B Phone'}
  };
  let currentUser=null;
  let currentPersona=null;
  let stream=null;
  let activeBookingId=null;
  let voiceMeta={source:'TEXT',language:'mr',transcript:''};

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function request(path,opt={}){
    const response=await fetch(path,{...opt,credentials:'include',headers:{'Content-Type':'application/json',...(opt.headers||{})},cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const e=new Error(data.message||data.error||`Request failed (${response.status})`);e.status=response.status;e.data=data;throw e;}
    return data;
  }
  const post=(path,body)=>request(path,{method:'POST',body:JSON.stringify(body||{})});

  function shell(){
    let root=document.getElementById('connectedShell');
    if(root)return root;
    root=document.createElement('section');
    root.id='connectedShell';
    root.className='connected-shell hidden';
    root.setAttribute('aria-label','SanPaid connected two-device demo');
    root.innerHTML=`<header class="connected-top"><div><div class="brand">San<span>Paid</span></div><div style="font-size:11px;color:#b8c6d8">Connected SIH Demo · Shared PostgreSQL</div></div><div class="actions"><span id="connectedTopStatus" class="connected-live">Checking backend…</span><button class="btn ghost small close-connected" id="connectedClose" aria-label="Close connected demo">✕</button></div></header><main class="connected-main" id="connectedContent"></main>`;
    document.body.appendChild(root);
    root.querySelector('#connectedClose').onclick=close;
    return root;
  }

  async function open(persona=null){
    const root=shell();
    root.classList.remove('hidden');
    document.body.style.overflow='hidden';
    currentPersona=persona;
    await checkHealth();
    try{const me=await request('/api/auth/me');currentUser=me.user||null;}catch{currentUser=null;}
    if(currentUser){renderApp();connectStream();}
    else renderChooser(persona);
  }

  function close(){
    shell().classList.add('hidden');
    document.body.style.overflow='';
    stopStream();
  }

  async function checkHealth(){
    const el=shell().querySelector('#connectedTopStatus');
    try{const h=await request('/api/connected/health');el.textContent=h.ok?'● Backend Connected':'Backend unavailable';el.style.color=h.ok?'#8ee2b5':'#ffb66e';}
    catch{el.textContent='● Backend not reachable';el.style.color='#ff9b9b';}
  }

  function renderChooser(preselect=null){
    const content=shell().querySelector('#connectedContent');
    content.innerHTML=`
      <div class="connected-status"><span class="connected-badge" style="color:#176b46;background:#eaf8f1;border-color:#c4e8d5">CONNECTED BACKEND</span><span class="connected-live">Two-device demo mode</span></div>
      <div class="connected-card" style="margin-bottom:14px"><h2>Choose this device's role</h2><p>Use Customer on one phone/browser and Worker A or Worker B on another. These sessions share the same backend database.</p><div class="connected-demo-note">For the SIH demo, all connected demo accounts use password <b>${PASSWORD}</b>. These are isolated demo identities, not real user credentials.</div></div>
      <div class="connected-grid">
        ${roleCard('CUSTOMER','👤','Customer Phone','Create a real backend booking with Marathi/Hindi/English voice context.',ACCOUNTS.CUSTOMER.email)}
        ${roleCard('WORKER_A','🛠','Worker A Phone','Receives the first eligible electrician offer. Reject to prove fallback.',ACCOUNTS.WORKER_A.email)}
        ${roleCard('WORKER_B','⚡','Worker B Phone','Receives the same booking after Worker A rejects.',ACCOUNTS.WORKER_B.email)}
      </div>`;
    content.querySelectorAll('[data-connected-persona]').forEach(btn=>btn.onclick=()=>renderLogin(btn.dataset.connectedPersona));
    if(preselect&&ACCOUNTS[preselect])setTimeout(()=>renderLogin(preselect),0);
  }

  function roleCard(id,icon,title,desc,email){return `<button class="connected-card connected-role" data-connected-persona="${id}"><h3>${icon} ${title}</h3><p>${desc}</p><div class="connected-account"><code>${email}</code></div><span class="btn primary small" style="margin-top:12px">Continue</span></button>`;}

  function renderLogin(persona){
    currentPersona=persona;
    const account=ACCOUNTS[persona];
    const role=persona==='CUSTOMER'?'CUSTOMER':'WORKER';
    const content=shell().querySelector('#connectedContent');
    content.innerHTML=`<div class="connected-card" style="max-width:560px;margin:0 auto"><button class="btn secondary small" id="connectedBack">← Roles</button><h2 style="margin-top:14px">${esc(account.label)}</h2><p>Login is handled by the shared SanPaid backend session, not localStorage.</p><form id="connectedLogin" class="connected-form"><div class="field"><label>Email</label><input id="connectedEmail" type="email" value="${esc(account.email)}" required></div><div class="field"><label>Password</label><input id="connectedPassword" type="password" value="${PASSWORD}" required></div><div id="connectedLoginError"></div><button class="btn primary" type="submit">Login to Connected Demo</button></form><div class="connected-account">Role: <b>${role}</b><br>Demo password: <code>${PASSWORD}</code></div></div>`;
    content.querySelector('#connectedBack').onclick=()=>renderChooser();
    content.querySelector('#connectedLogin').onsubmit=async e=>{
      e.preventDefault();
      const error=content.querySelector('#connectedLoginError');error.innerHTML='';
      try{
        const result=await post('/api/auth/login',{identifier:content.querySelector('#connectedEmail').value.trim(),password:content.querySelector('#connectedPassword').value,role,remember:true});
        currentUser=result.user;renderApp();connectStream();
      }catch(err){error.innerHTML=`<div class="connected-error">${esc(err.message)}</div>`;}
    };
  }

  function renderApp(){
    if(!currentUser)return renderChooser();
    if(currentUser.role==='CUSTOMER')renderCustomer();
    else if(currentUser.role==='WORKER')renderWorker();
    else renderChooser();
  }

  function appHeader(title,subtitle){return `<div class="connected-status"><span class="connected-badge" style="color:#176b46;background:#eaf8f1;border-color:#c4e8d5">SHARED BACKEND</span><span class="connected-live">${esc(currentUser.fullName||currentUser.email||'Connected User')}</span></div><div class="connected-card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="connected-actions" style="margin-top:0"><button class="btn secondary small" id="connectedSwitch">Switch Role</button><button class="btn danger small" id="connectedLogout">Logout</button></div></div></div>`;}

  function wireHeader(){
    document.getElementById('connectedSwitch').onclick=async()=>{await logout();renderChooser();};
    document.getElementById('connectedLogout').onclick=async()=>{await logout();renderChooser();};
  }

  async function logout(){stopStream();try{await post('/api/auth/logout',{});}catch{}currentUser=null;activeBookingId=null;voiceMeta={source:'TEXT',language:'mr',transcript:''};}

  function renderCustomer(){
    const content=shell().querySelector('#connectedContent');
    content.innerHTML=appHeader('Customer Connected Demo','Create an Electrician booking on this device; worker offers will appear on another logged-in worker device.')+`
      <div class="connected-grid" style="grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr)">
        <div class="connected-card"><h3>1. Create Service Request</h3><form id="connectedBookingForm" class="connected-form">
          <div class="field"><label>Service</label><select id="cdService"><option>Electrician</option></select></div>
          <div class="field"><label>Zone</label><input id="cdZone" value="Karad Zone 1" required></div>
          <div class="field"><label>Address</label><input id="cdAddress" value="Demo Address, Karad Zone 1" required></div>
          <div class="field"><label>Request Language</label><select id="cdLang"><option value="mr">Marathi</option><option value="hi">Hindi</option><option value="en">English</option></select></div>
          <div class="field"><label>Problem / Voice Transcript</label><textarea id="cdProblem" required placeholder="Describe the service request">Mala electrician pahije. Gharat switch board madhun spark yet aahe.</textarea></div>
          <div class="connected-actions"><button type="button" class="btn secondary" id="cdVoice">🎙 Start Voice</button><button class="btn primary" type="submit">Create Backend Booking</button></div>
          <div id="cdVoiceStatus" class="connected-demo-note">Voice is optional. Text fallback always remains available.</div><div id="cdBookingError"></div>
        </form></div>
        <div class="connected-card"><h3>2. Live Booking State</h3><div id="connectedCustomerState" class="connected-booking-state"><div class="connected-empty">Create a booking to begin the two-device flow.</div></div></div>
      </div>`;
    wireHeader();
    content.querySelector('#cdVoice').onclick=startCustomerVoice;
    content.querySelector('#connectedBookingForm').onsubmit=createConnectedBooking;
    loadLatestCustomerBooking();
  }

  function langCode(short){return short==='mr'?'mr-IN':short==='hi'?'hi-IN':'en-IN';}
  function startCustomerVoice(){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const status=document.getElementById('cdVoiceStatus');
    if(!Recognition){status.textContent='Voice recognition is unavailable in this browser. Type the request instead.';return;}
    const recognition=new Recognition();
    const lang=document.getElementById('cdLang').value;
    recognition.lang=langCode(lang);recognition.interimResults=false;recognition.maxAlternatives=1;
    status.textContent='Listening… speak the complete service request.';
    recognition.onresult=e=>{const transcript=String(e.results?.[0]?.[0]?.transcript||'').trim();if(transcript){document.getElementById('cdProblem').value=transcript;voiceMeta={source:'VOICE',language:lang,transcript};status.textContent=`Voice captured: “${transcript}”`;}};
    recognition.onerror=e=>{status.textContent=`Voice capture unavailable (${e.error||'error'}). Text input still works.`;};
    try{recognition.start();}catch{status.textContent='Microphone could not start. Type the request instead.';}
  }

  async function createConnectedBooking(e){
    e.preventDefault();
    const error=document.getElementById('cdBookingError');error.innerHTML='';
    const problem=document.getElementById('cdProblem').value.trim();
    const lang=document.getElementById('cdLang').value;
    const isVoice=voiceMeta.source==='VOICE'&&voiceMeta.transcript&&voiceMeta.transcript===problem;
    try{
      const booking=await post('/api/connected/bookings',{service:document.getElementById('cdService').value,zone:document.getElementById('cdZone').value.trim(),address:document.getElementById('cdAddress').value.trim(),problem,requestSource:isVoice?'VOICE':'TEXT',requestLanguage:lang,voiceTranscript:isVoice?problem:null,scheduledAt:new Date(Date.now()+60*60*1000).toISOString(),emergency:false});
      activeBookingId=booking.id;localStorage.setItem('sanpaid_connected_booking_id',String(booking.id));
      renderCustomerState(booking);refreshCustomerBooking();
    }catch(err){error.innerHTML=`<div class="connected-error">${esc(err.message)}</div>`;}
  }

  async function loadLatestCustomerBooking(){
    const saved=Number(localStorage.getItem('sanpaid_connected_booking_id')||0);if(saved){activeBookingId=saved;await refreshCustomerBooking();}
  }

  async function refreshCustomerBooking(){
    if(!activeBookingId)return;
    try{const b=await request(`/api/connected/customer/bookings/${activeBookingId}`);renderCustomerState(b);}catch(err){if(err.status===404)localStorage.removeItem('sanpaid_connected_booking_id');}
  }

  function renderCustomerState(b){
    const root=document.getElementById('connectedCustomerState');if(!root)return;
    const status=String(b.status||'').replaceAll('_',' ');
    root.innerHTML=`<div class="connected-success"><b>${esc(b.bookingCode||'Booking created')}</b><br>${esc(status)}</div>
      <div class="connected-state-line"><span class="badge b-green">BACKEND RECORD</span><p style="margin:8px 0 0">Service: <b>${esc(b.service||'Electrician')}</b><br>Request source: <b>${esc(b.requestSource||'TEXT')}</b></p></div>
      ${b.workerName?`<div class="connected-state-line"><b>Current Worker</b><p style="margin:6px 0 0">${esc(b.workerName)} · ${esc(b.workerVerification||'VERIFIED')}<br>${b.distance!=null?`${esc(b.distance)} KM · `:''}${esc(b.cooperative||'Cooperative')}</p></div>`:`<div class="connected-state-line">Matching / replacement in progress…</div>`}
      ${b.voiceTranscript?`<div class="connected-voice"><b>🎙 Stored Voice Request</b><div class="transcript">“${esc(b.voiceTranscript)}”</div></div>`:''}
      <div class="connected-demo-note">Open Worker A on another phone/browser. If Worker A rejects, Worker B should receive this same booking and voice context.</div>`;
  }

  function renderWorker(){
    const content=shell().querySelector('#connectedContent');
    content.innerHTML=appHeader('Worker Connected Demo','This inbox is queried from the shared backend. It does not depend on the customer device localStorage.')+`<div class="connected-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><h3>Job Offers</h3><p>Pending and accepted offers assigned to this worker.</p></div><button class="btn secondary small" id="connectedRefreshOffers">Refresh Offers</button></div><div id="connectedWorkerOffers" class="connected-list"><div class="connected-empty">Loading worker offers…</div></div></div>`;
    wireHeader();content.querySelector('#connectedRefreshOffers').onclick=loadWorkerOffers;loadWorkerOffers();
  }

  async function loadWorkerOffers(){
    const root=document.getElementById('connectedWorkerOffers');if(!root)return;
    try{const offers=await request('/api/connected/worker/offers');root.innerHTML=offers.length?offers.map(offerCard).join(''):'<div class="connected-empty">No active offer for this worker yet.</div>';wireOfferActions();}
    catch(err){root.innerHTML=`<div class="connected-error">${esc(err.message)}</div>`;}
  }

  function offerCard(o){
    const lang=o.workerLanguage||'hi';
    const summary=workerSummary(o,lang);
    return `<article class="connected-offer" data-offer="${o.offerId}"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><span class="badge b-green">${esc(o.offerStatus)}</span><h4 style="margin-top:8px">${esc(o.service)} · ${esc(o.bookingCode)}</h4></div><b>${o.distance!=null?`${esc(o.distance)} KM`:''}</b></div><div class="connected-meta"><div>Zone<b>${esc(o.zone||'—')}</b></div><div>Expected Amount<b>₹${Number(o.total||0).toLocaleString('en-IN')}</b></div><div>Schedule<b>${o.scheduledAt?new Date(o.scheduledAt).toLocaleString('en-IN'):'—'}</b></div><div>Cooperative<b>${esc(o.cooperative||'—')}</b></div></div>${o.voiceTranscript?`<div class="connected-voice"><b>🎙 Customer Voice Request</b><div class="transcript">${esc(summary)}</div><details style="margin-top:8px"><summary>Show original (${esc(o.requestLanguage||'mr')})</summary><div class="transcript">“${esc(o.voiceTranscript)}”</div></details><div class="connected-actions"><button class="btn secondary small" data-listen-offer="${o.offerId}">🔊 Listen Summary</button><button class="btn secondary small" data-listen-original="${o.offerId}">▶ Original</button></div></div>`:`<div class="connected-state-line"><b>Customer problem</b><p style="margin:6px 0 0">${esc(o.problem||'No description')}</p></div>`}${o.offerStatus==='PENDING'?`<div class="connected-actions"><button class="btn danger" data-reject-offer="${o.offerId}">Reject</button><button class="btn primary" data-accept-offer="${o.offerId}">Accept</button></div>`:'<div class="connected-success" style="margin-top:10px">Accepted · Active booking assigned to this worker.</div>'}</article>`;
  }

  function workerSummary(o,lang){const problem=o.voiceTranscript||o.problem||'service request';if(String(lang).startsWith('mr'))return `तुम्हाला ${o.service} साठी जॉब रिक्वेस्ट मिळाली आहे. परिसर: ${o.zone||'ग्राहक परिसर'}. ग्राहकाची विनंती: ${problem}`;if(String(lang).startsWith('hi'))return `आपको ${o.service} की जॉब रिक्वेस्ट मिली है। क्षेत्र: ${o.zone||'ग्राहक क्षेत्र'}। ग्राहक की रिक्वेस्ट: ${problem}`;return `You have a ${o.service} job request in ${o.zone||'the customer area'}. Customer request: ${problem}`;}

  function speak(text,lang){if(!('speechSynthesis'in window)||!window.SpeechSynthesisUtterance)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=langCode(String(lang||'hi').slice(0,2));u.rate=.95;window.speechSynthesis.speak(u);}

  function wireOfferActions(){
    document.querySelectorAll('[data-accept-offer]').forEach(b=>b.onclick=()=>respondOffer(b.dataset.acceptOffer,'ACCEPT'));
    document.querySelectorAll('[data-reject-offer]').forEach(b=>b.onclick=()=>{const reason=window.prompt('Reject reason (e.g. Schedule Conflict):','Schedule Conflict');if(reason!==null)respondOffer(b.dataset.rejectOffer,'REJECT',reason);});
    document.querySelectorAll('[data-listen-offer]').forEach(b=>b.onclick=()=>{const card=b.closest('[data-offer]');const transcript=card?.querySelector('.connected-voice .transcript')?.textContent||'';speak(transcript,currentUser?.preferredLanguage||'hi');});
    document.querySelectorAll('[data-listen-original]').forEach(b=>b.onclick=()=>{const card=b.closest('[data-offer]');const original=card?.querySelector('details .transcript')?.textContent?.replace(/[“”]/g,'')||'';speak(original,'mr');});
  }

  async function respondOffer(id,action,reason=''){
    try{const result=await post(`/api/connected/worker/offers/${id}/respond`,{action,reason});await loadWorkerOffers();if(action==='REJECT'&&result.nextWorker){alert(`Offer rejected. Same booking moved to next eligible worker: ${result.nextWorker.name}.`);}else if(action==='ACCEPT'){alert('Offer accepted. Customer device will update from the shared backend.');}}
    catch(err){alert(err.message);await loadWorkerOffers();}
  }

  function connectStream(){
    stopStream();
    if(!window.EventSource)return;
    stream=new EventSource('/api/connected/events',{withCredentials:true});
    stream.addEventListener('snapshot',event=>{try{const snapshot=JSON.parse(event.data);if(snapshot.role==='CUSTOMER'){const latest=snapshot.bookings?.[0];if(latest&&(!activeBookingId||Number(latest.id)===Number(activeBookingId))){activeBookingId=Number(latest.id);localStorage.setItem('sanpaid_connected_booking_id',String(activeBookingId));refreshCustomerBooking();}}else if(snapshot.role==='WORKER'){loadWorkerOffers();}}catch{}});
    stream.onerror=()=>{const top=document.getElementById('connectedTopStatus');if(top)top.textContent='● Reconnecting live stream…';};
    stream.onopen=()=>{const top=document.getElementById('connectedTopStatus');if(top){top.textContent='● Backend + Live Stream';top.style.color='#8ee2b5';}};
  }
  function stopStream(){if(stream){stream.close();stream=null;}}

  function installLandingButtons(){
    const ctas=document.querySelector('.hero-ctas');
    if(ctas&&!document.getElementById('connectedDemoBtn')){const btn=document.createElement('button');btn.className='btn secondary';btn.id='connectedDemoBtn';btn.type='button';btn.textContent='📱 Connected Two-Device Demo';btn.onclick=()=>open();ctas.appendChild(btn);}
    const match=document.getElementById('matching');
    if(match&&!document.getElementById('connectedDemoSection')){const sec=document.createElement('section');sec.id='connectedDemoSection';sec.className='section white';sec.innerHTML=`<div class="wrap"><div class="head"><span class="tag">Connected SIH Proof</span><h2>One booking. Two devices. Shared backend.</h2><p>Customer and worker sessions use the same PostgreSQL-backed workflow. Worker rejection carries the same booking and voice request to the next eligible worker.</p></div><div class="connected-grid"><div class="connected-card"><h3>1 · Customer Phone</h3><p>Create an Electrician booking with Marathi/Hindi/English voice or text.</p><button class="btn primary" data-open-connected="CUSTOMER">Open Customer Device</button></div><div class="connected-card"><h3>2 · Worker A</h3><p>Receive the first backend offer. Reject it to demonstrate fair fallback.</p><button class="btn secondary" data-open-connected="WORKER_A">Open Worker A</button></div><div class="connected-card"><h3>3 · Worker B</h3><p>After rejection, receive the same request and voice context on another session.</p><button class="btn secondary" data-open-connected="WORKER_B">Open Worker B</button></div></div></div>`;match.insertAdjacentElement('afterend',sec);sec.querySelectorAll('[data-open-connected]').forEach(b=>b.onclick=()=>open(b.dataset.openConnected));}
  }

  window.ConnectedSanPaid={open,close};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installLandingButtons,{once:true});else installLandingButtons();
})();
