(() => {
  'use strict';

  const BOOKING_KEY='sanpaid_connected_booking_id';
  let busy=false;
  let lastWorkerSignature='';
  let lastCustomerSignature='';

  const getSession=key=>{try{return sessionStorage.getItem(key)||''}catch{return''}};
  const setSession=(key,value)=>{try{value?sessionStorage.setItem(key,String(value)):sessionStorage.removeItem(key)}catch{}};
  const removeSession=key=>{try{sessionStorage.removeItem(key)}catch{}};
  const signal=source=>{try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source,at:Date.now()}}));}catch{}};

  async function req(path,opt={}){
    if(window.SanPaidApi?.request)return window.SanPaidApi.request(path,opt);
    const r=await fetch(path,{...opt,credentials:'include',headers:{...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})},cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(d.message||d.error||`Request failed (${r.status})`);e.status=r.status;throw e;}
    return d;
  }
  const post=(path,body={})=>window.SanPaidApi?.post?window.SanPaidApi.post(path,body):req(path,{method:'POST',body:JSON.stringify(body)});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const human=s=>({ACCEPTED:'Worker Assigned',ON_THE_WAY:'Worker On The Way',ARRIVED:'Worker Arrived',IDENTITY_VERIFIED:'Identity Verified',CUSTOMER_CONFIRMED:'Customer Confirmed',IN_PROGRESS:'Service In Progress',AWAITING_CUSTOMER_CONFIRMATION:'Waiting for Customer Completion',COMPLETED:'Service Completed',PAID:'Payment Completed'}[String(s||'')]||String(s||'').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()));

  function shellOpen(){const s=document.getElementById('connectedShell');return !!(s&&!s.classList.contains('hidden'));}
  function content(){return document.getElementById('connectedContent');}
  function roleFromUi(){return content()?.dataset.connectedRole||'';}
  function ensureHost(id,afterSelector){let host=document.getElementById(id);if(host)return host;const anchor=content()?.querySelector(afterSelector);if(!anchor)return null;host=document.createElement('div');host.id=id;host.style.marginTop='14px';anchor.insertAdjacentElement('afterend',host);return host;}
  function setMarkup(host,signature,html,type){const current=type==='worker'?lastWorkerSignature:lastCustomerSignature;if(signature===current)return false;if(type==='worker')lastWorkerSignature=signature;else lastCustomerSignature=signature;host.innerHTML=html;return true;}
  function friendly(e){const s=Number(e?.status||0);if(s===401){window.SanPaidAuth?.handleExpiredSession?.();return 'Your session expired. Please log in again.';}if(s===403)return 'This action is not available for this role.';if(s===404)return 'This booking or job is no longer available.';if(s===409)return e?.message||'This step is not available in the current service state.';if(s===410)return e?.message||'This verification code expired. Ask the worker to verify identity again.';if(s===422)return e?.message||'Please check the entered information.';if(s>=500)return 'Service temporarily unavailable. Please retry.';return e?.message||'This step could not be completed. Please retry.';}

  async function refresh(){if(!shellOpen()||document.hidden||busy)return;const role=roleFromUi();if(role==='WORKER')await renderWorkerLifecycle();if(role==='CUSTOMER')await renderCustomerVerification();}

  async function renderWorkerLifecycle(){
    const host=ensureHost('connectedLifecycleHost','.connected-card:last-child');if(!host)return;
    try{
      const offers=await req('/api/connected/worker/offers');
      const accepted=offers.find(o=>o.offerStatus==='ACCEPTED')||offers.find(o=>['ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'].includes(o.status));
      if(!accepted){if(lastWorkerSignature!=='EMPTY'){host.innerHTML='';lastWorkerSignature='EMPTY';}return;}
      const id=Number(accepted.bookingId),status=String(accepted.status||''),tokenKey=`sanpaid_service_start_token_${id}`,storedToken=getSession(tokenKey);
      let action='';
      if(status==='ACCEPTED')action=`<button class="btn primary" data-life="travel" data-booking="${id}">Start Travel</button>`;
      else if(status==='ON_THE_WAY')action=`<button class="btn primary" data-life="arrive" data-booking="${id}">Mark Arrived</button>`;
      else if(status==='ARRIVED')action=`<button class="btn primary" data-life="identity" data-booking="${id}">Verify Identity · Sandbox</button>`;
      else if(status==='IDENTITY_VERIFIED')action=`<div class="connected-demo-note">Identity verified. Share the one-time service verification code with the customer.</div>`;
      else if(status==='CUSTOMER_CONFIRMED')action=`<button class="btn primary" data-life="start" data-booking="${id}">Start Service</button>`;
      else if(status==='IN_PROGRESS')action=`<button class="btn primary" data-life="complete-request" data-booking="${id}">Request Completion</button>`;
      else if(status==='AWAITING_CUSTOMER_CONFIRMATION')action=`<div class="connected-demo-note">Waiting for the customer to confirm service completion.</div>`;
      else if(status==='COMPLETED')action=`<div class="connected-success">Service completion confirmed by the customer.</div>`;
      else if(status==='PAID')action=`<div class="connected-success">Service and sandbox payment are complete.</div>`;

      const identityDone=['IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'].includes(status);
      const customerDone=['CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'].includes(status);
      const signature=JSON.stringify([id,status,storedToken]);
      const html=`<div class="connected-card"><span class="connected-step-label">SERVICE START</span><h3>Service Start Verification</h3><p>Service can start only after both trust checks are complete.</p><div class="connected-status"><span class="badge b-green">${esc(human(status))}</span><b>${esc(accepted.bookingCode||'')}</b></div><div class="connected-trust-checks"><div class="connected-trust-row ${identityDone?'done':''}"><span>Worker Identity</span><b>${identityDone?'✅ Verified':'⏳ Pending'}</b></div><div class="connected-trust-row ${customerDone?'done':''}"><span>Customer Confirmation</span><b>${customerDone?'✅ Confirmed':'⏳ Pending'}</b></div></div>${storedToken?`<div class="connected-voice"><span class="connected-step-label">ONE-TIME VERIFICATION</span><b>One-Time Service Verification Code</b><div class="transcript" style="word-break:break-all"><code>${esc(storedToken)}</code></div><div class="connected-actions"><button class="btn secondary small" data-copy-token="${esc(storedToken)}">Copy Code</button></div></div>`:''}<div class="connected-actions">${action}</div><div id="connectedLifecycleMessage"></div></div>`;
      if(setMarkup(host,signature,html,'worker')){
        host.querySelectorAll('[data-life]').forEach(b=>b.onclick=()=>runWorkerAction(b.dataset.life,Number(b.dataset.booking),b));
        host.querySelector('[data-copy-token]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(e.currentTarget.dataset.copyToken);message('Verification code copied. Open the Customer device and confirm the booked worker.','success');}catch{message('Copy is unavailable. Select the verification code manually.','warn');}});
      }
    }catch(e){const signature='ERR:'+String(e.status||e.message);setMarkup(host,signature,`<div class="connected-error">${esc(friendly(e))}</div>`,'worker');}
  }

  function message(text,type='success'){const el=document.getElementById('connectedLifecycleMessage')||document.getElementById('connectedCustomerVerificationMessage');if(el)el.innerHTML=`<div class="${type==='success'?'connected-success':type==='warn'?'connected-demo-note':'connected-error'}" style="margin-top:10px">${esc(text)}</div>`;}
  async function runWorkerAction(action,id,button){
    if(busy)return;busy=true;const old=button?.textContent;
    if(button){button.disabled=true;button.textContent=action==='travel'?'Starting travel…':action==='arrive'?'Updating arrival…':action==='identity'?'Verifying…':action==='start'?'Starting service…':'Requesting completion…';}
    try{
      let result;
      if(action==='travel')result=await post(`/api/connected/jobs/${id}/travel`);
      if(action==='arrive')result=await post(`/api/connected/jobs/${id}/arrive`);
      if(action==='identity'){result=await post(`/api/connected/jobs/${id}/identity`);if(result.token)setSession(`sanpaid_service_start_token_${id}`,result.token);}
      if(action==='start')result=await post(`/api/connected/jobs/${id}/start`);
      if(action==='complete-request')result=await post(`/api/connected/jobs/${id}/completion-request`);
      message(action==='identity'?'Identity verified in sandbox. A one-time service verification code is ready.':'Service status updated across devices.');lastWorkerSignature='';signal(`service-${action}`);
    }catch(e){message(friendly(e),'error');if(button){button.disabled=false;button.textContent=old;}}
    finally{busy=false;setTimeout(refresh,160);}
  }

  async function bookingIdForCustomer(){
    const saved=Number(getSession(BOOKING_KEY)||0);if(saved)return saved;
    try{const snapshot=await req('/api/connected/snapshot'),latest=snapshot.bookings?.[0];if(latest?.id){setSession(BOOKING_KEY,latest.id);return Number(latest.id);}}catch{}
    return 0;
  }

  async function renderCustomerVerification(){
    const host=ensureHost('connectedCustomerVerificationHost','.connected-grid');if(!host)return;
    const bookingId=await bookingIdForCustomer();if(!bookingId){if(lastCustomerSignature!=='EMPTY'){host.innerHTML='';lastCustomerSignature='EMPTY';}return;}
    let booking=null;try{booking=await req(`/api/connected/customer/bookings/${bookingId}`);}catch(e){if(e.status===404)removeSession(BOOKING_KEY);}
    if(!booking){if(lastCustomerSignature!=='EMPTY'){host.innerHTML='';lastCustomerSignature='EMPTY';}return;}
    const status=String(booking.status||''),completion=status==='AWAITING_CUSTOMER_CONFIRMATION'?`<button class="btn primary" id="connectedConfirmCompletion">Confirm Service Completed</button>`:'',tokenKey=`sanpaid_customer_start_token_${bookingId}`,saved=getSession(tokenKey),signature=JSON.stringify([bookingId,status,saved]);
    const html=`<div class="connected-card"><span class="connected-step-label">TRUST CHECK</span><h3>Confirm Your Booked Worker</h3><p>After the worker arrives and passes the sandbox identity check, enter the one-time service verification code shown on the worker device.</p><div class="connected-status"><span class="badge b-green">${esc(human(status))}</span><b>${esc(booking.bookingCode||'')}</b></div><div class="connected-form"><div class="field"><label>One-Time Service Verification Code</label><input id="connectedStartToken" autocomplete="off" placeholder="Paste code from Worker device" value="${esc(saved)}"></div><div class="connected-actions"><button class="btn secondary" id="connectedVerifyToken">Check Worker</button><button class="btn primary" id="connectedConfirmWorker" disabled>Confirm Booked Worker</button>${completion}</div><div id="connectedWorkerIdentityPreview"></div><div id="connectedCustomerVerificationMessage"></div></div></div>`;
    if(setMarkup(host,signature,html,'customer')){const input=host.querySelector('#connectedStartToken');host.querySelector('#connectedVerifyToken').onclick=()=>verifyToken(input.value.trim(),bookingId);host.querySelector('#connectedConfirmWorker').onclick=()=>confirmToken(input.value.trim(),bookingId);host.querySelector('#connectedConfirmCompletion')?.addEventListener('click',e=>confirmCompletion(bookingId,e.currentTarget));if(saved)verifyToken(saved,bookingId,false);}
  }

  async function verifyToken(token,bookingId,showErrors=true){const preview=document.getElementById('connectedWorkerIdentityPreview'),confirm=document.getElementById('connectedConfirmWorker');if(!token){if(showErrors)message('Enter the one-time verification code from the worker device.','warn');return;}try{const d=await req(`/api/connected/service-start/${encodeURIComponent(token)}`);if(Number(d.bookingId)!==Number(bookingId))throw Object.assign(new Error('This code belongs to another booking.'),{status:409});setSession(`sanpaid_customer_start_token_${bookingId}`,token);preview.innerHTML=`<div class="connected-success" style="margin-top:10px"><b>Worker Identity Verified ✓</b><br>${esc(d.workerName)} · ${esc(d.workerVerification)}<br>${esc(d.cooperative||'Cooperative')}<br>${esc(d.service)} · ${esc(d.bookingCode)}</div>`;confirm.disabled=false;}catch(e){confirm.disabled=true;preview.innerHTML=`<div class="connected-error" style="margin-top:10px">${esc(friendly(e))}</div>`;}}
  async function confirmToken(token,bookingId){if(!token)return message('Check the worker verification code first.','warn');const button=document.getElementById('connectedConfirmWorker'),old=button?.textContent;if(button){button.disabled=true;button.textContent='Confirming worker…';}try{await post(`/api/connected/service-start/${encodeURIComponent(token)}/confirm`);removeSession(`sanpaid_customer_start_token_${bookingId}`);message('Booked worker confirmed. Start Service is now unlocked on the worker device.');lastCustomerSignature='';signal('customer-confirm-worker');}catch(e){message(friendly(e),'error');if(button){button.disabled=false;button.textContent=old;}}setTimeout(refresh,160);}
  async function confirmCompletion(bookingId,button){const old=button?.textContent;if(button){button.disabled=true;button.textContent='Confirming completion…';}try{await post(`/api/connected/customer/bookings/${bookingId}/complete`);message('Service completion confirmed.');lastCustomerSignature='';signal('customer-completion');}catch(e){message(friendly(e),'error');if(button){button.disabled=false;button.textContent=old;}}setTimeout(refresh,160);}

  function start(){
    setTimeout(refresh,350);
    window.addEventListener('sanpaid:connected-sync',()=>setTimeout(refresh,80));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
