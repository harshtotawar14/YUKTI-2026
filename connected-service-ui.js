(() => {
  'use strict';

  let timer=null;
  let busy=false;

  async function req(path,opt={}){
    const r=await fetch(path,{...opt,credentials:'include',headers:{'Content-Type':'application/json',...(opt.headers||{})},cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(d.message||d.error||`Request failed (${r.status})`);e.status=r.status;throw e;}
    return d;
  }
  const post=(path,body={})=>req(path,{method:'POST',body:JSON.stringify(body)});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const human=s=>String(s||'').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

  function shellOpen(){const s=document.getElementById('connectedShell');return s&&!s.classList.contains('hidden');}
  function content(){return document.getElementById('connectedContent');}
  function roleFromUi(){const c=content();if(!c)return '';if(c.textContent.includes('Customer Connected Demo'))return 'CUSTOMER';if(c.textContent.includes('Worker Connected Demo'))return 'WORKER';return '';}

  function ensureHost(id,afterSelector){
    let host=document.getElementById(id);
    if(host)return host;
    const anchor=content()?.querySelector(afterSelector);
    if(!anchor)return null;
    host=document.createElement('div');host.id=id;host.style.marginTop='14px';anchor.insertAdjacentElement('afterend',host);return host;
  }

  async function refresh(){
    if(!shellOpen()||busy)return;
    const role=roleFromUi();
    if(role==='WORKER')await renderWorkerLifecycle();
    if(role==='CUSTOMER')await renderCustomerVerification();
  }

  async function renderWorkerLifecycle(){
    const host=ensureHost('connectedLifecycleHost','.connected-card:last-child');
    if(!host)return;
    try{
      const offers=await req('/api/connected/worker/offers');
      const accepted=offers.find(o=>o.offerStatus==='ACCEPTED')||offers.find(o=>['ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED'].includes(o.status));
      if(!accepted){host.innerHTML='';return;}
      const id=Number(accepted.bookingId);
      const status=String(accepted.status||'');
      const storedToken=localStorage.getItem(`sanpaid_service_start_token_${id}`)||'';
      let action='';
      if(status==='ACCEPTED')action=`<button class="btn primary" data-life="travel" data-booking="${id}">Start Travel</button>`;
      else if(status==='ON_THE_WAY')action=`<button class="btn primary" data-life="arrive" data-booking="${id}">Mark Arrived</button>`;
      else if(status==='ARRIVED')action=`<button class="btn primary" data-life="identity" data-booking="${id}">Run Sandbox Identity Check</button>`;
      else if(status==='IDENTITY_VERIFIED')action=`<div class="connected-demo-note">Identity verified. Give the one-time booking token to the customer device for confirmation.</div>`;
      else if(status==='CUSTOMER_CONFIRMED')action=`<button class="btn primary" data-life="start" data-booking="${id}">Start Service</button>`;
      else if(status==='IN_PROGRESS')action=`<button class="btn primary" data-life="complete-request" data-booking="${id}">Request Completion</button>`;
      else if(status==='AWAITING_CUSTOMER_CONFIRMATION')action=`<div class="connected-demo-note">Waiting for customer completion confirmation on the other device.</div>`;
      else if(status==='COMPLETED')action=`<div class="connected-success">Service completion confirmed by customer.</div>`;

      host.innerHTML=`<div class="connected-card"><h3>3. Connected Service Lifecycle</h3><p>These controls update the shared booking, not browser-local demo state.</p><div class="connected-status"><span class="badge b-green">${esc(human(status))}</span><b>${esc(accepted.bookingCode||'')}</b></div><div class="connected-state-line"><b>Dual Start Rule</b><p style="margin:6px 0 0">Worker must arrive → sandbox identity verification → customer must confirm → only then can Start Service succeed.</p></div>${storedToken?`<div class="connected-voice"><b>One-time booking token / QR payload</b><div class="transcript" style="word-break:break-all"><code>${esc(storedToken)}</code></div><div class="connected-actions"><button class="btn secondary small" data-copy-token="${esc(storedToken)}">Copy Token</button></div></div>`:''}<div class="connected-actions">${action}</div><div id="connectedLifecycleMessage"></div></div>`;
      host.querySelectorAll('[data-life]').forEach(b=>b.onclick=()=>runWorkerAction(b.dataset.life,Number(b.dataset.booking)));
      host.querySelector('[data-copy-token]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(e.currentTarget.dataset.copyToken);message('Token copied. Open Customer device and paste it into Worker Confirmation.','success');}catch{message('Copy unavailable. Select the token text manually.','warn');}});
    }catch(e){host.innerHTML=`<div class="connected-error">Lifecycle status unavailable: ${esc(e.message)}</div>`;}
  }

  function message(text,type='success'){
    const el=document.getElementById('connectedLifecycleMessage')||document.getElementById('connectedCustomerVerificationMessage');
    if(el)el.innerHTML=`<div class="${type==='success'?'connected-success':type==='warn'?'connected-demo-note':'connected-error'}" style="margin-top:10px">${esc(text)}</div>`;
  }

  async function runWorkerAction(action,id){
    if(busy)return;busy=true;
    try{
      let result;
      if(action==='travel')result=await post(`/api/connected/jobs/${id}/travel`);
      if(action==='arrive')result=await post(`/api/connected/jobs/${id}/arrive`);
      if(action==='identity'){
        result=await post(`/api/connected/jobs/${id}/identity`);
        if(result.token)localStorage.setItem(`sanpaid_service_start_token_${id}`,result.token);
      }
      if(action==='start')result=await post(`/api/connected/jobs/${id}/start`);
      if(action==='complete-request')result=await post(`/api/connected/jobs/${id}/completion-request`);
      message(action==='identity'?'Sandbox identity verified. One-time customer confirmation token generated.':'Booking updated on shared backend.');
    }catch(e){message(e.message,'error');}
    finally{busy=false;setTimeout(refresh,150);}
  }

  async function renderCustomerVerification(){
    const host=ensureHost('connectedCustomerVerificationHost','.connected-grid');
    if(!host)return;
    const bookingId=Number(localStorage.getItem('sanpaid_connected_booking_id')||0);
    if(!bookingId){host.innerHTML='';return;}
    let booking=null;
    try{booking=await req(`/api/connected/customer/bookings/${bookingId}`);}catch{}
    if(!booking){host.innerHTML='';return;}
    const status=String(booking.status||'');
    const completion=status==='AWAITING_CUSTOMER_CONFIRMATION'?`<button class="btn primary" id="connectedConfirmCompletion">Confirm Service Completed</button>`:'';
    host.innerHTML=`<div class="connected-card"><h3>3. Worker Confirmation & Service Completion</h3><p>After the worker reaches your location and passes the sandbox identity check, enter the one-time booking token shown on the worker device.</p><div class="connected-status"><span class="badge b-green">${esc(human(status))}</span><b>${esc(booking.bookingCode||'')}</b></div><div class="connected-form"><div class="field"><label>One-time Booking Token / QR Payload</label><input id="connectedStartToken" autocomplete="off" placeholder="Paste token from Worker device"></div><div class="connected-actions"><button class="btn secondary" id="connectedVerifyToken">Check Worker</button><button class="btn primary" id="connectedConfirmWorker" disabled>Confirm Booked Worker</button>${completion}</div><div id="connectedWorkerIdentityPreview"></div><div id="connectedCustomerVerificationMessage"></div></div></div>`;
    const input=host.querySelector('#connectedStartToken');
    const saved=localStorage.getItem(`sanpaid_customer_start_token_${bookingId}`)||'';if(saved)input.value=saved;
    host.querySelector('#connectedVerifyToken').onclick=()=>verifyToken(input.value.trim(),bookingId);
    host.querySelector('#connectedConfirmWorker').onclick=()=>confirmToken(input.value.trim(),bookingId);
    host.querySelector('#connectedConfirmCompletion')?.addEventListener('click',()=>confirmCompletion(bookingId));
    if(saved)verifyToken(saved,bookingId,false);
  }

  async function verifyToken(token,bookingId,showErrors=true){
    const preview=document.getElementById('connectedWorkerIdentityPreview');const confirm=document.getElementById('connectedConfirmWorker');
    if(!token){if(showErrors)message('Paste the one-time token from the worker device.','warn');return;}
    try{
      const d=await req(`/api/connected/service-start/${encodeURIComponent(token)}`);
      if(Number(d.bookingId)!==Number(bookingId))throw new Error('This token belongs to another booking.');
      localStorage.setItem(`sanpaid_customer_start_token_${bookingId}`,token);
      preview.innerHTML=`<div class="connected-success" style="margin-top:10px"><b>Sandbox Identity Verified ✓</b><br>Worker: ${esc(d.workerName)}<br>Worker ID: ${esc(d.workerId)}<br>Verification: ${esc(d.workerVerification)}<br>Cooperative: ${esc(d.cooperative||'—')}<br>Service: ${esc(d.service)}<br>Booking: ${esc(d.bookingCode)}</div>`;
      confirm.disabled=false;
    }catch(e){confirm.disabled=true;preview.innerHTML=`<div class="connected-error" style="margin-top:10px">${esc(e.message)}</div>`;}
  }

  async function confirmToken(token,bookingId){
    if(!token)return message('Check the worker token first.','warn');
    try{await post(`/api/connected/service-start/${encodeURIComponent(token)}/confirm`);localStorage.removeItem(`sanpaid_customer_start_token_${bookingId}`);message('Worker confirmed. Start Service is now unlocked on the worker device.');}
    catch(e){message(e.message,'error');}
    setTimeout(refresh,200);
  }

  async function confirmCompletion(bookingId){
    try{await post(`/api/connected/customer/bookings/${bookingId}/complete`);message('Service completion confirmed on the shared backend.');}
    catch(e){message(e.message,'error');}
    setTimeout(refresh,200);
  }

  function start(){
    // Use a light interval instead of observing our own DOM writes. This avoids
    // self-triggered render loops on mobile while still keeping both devices fresh.
    setTimeout(refresh,250);
    timer=setInterval(refresh,2600);
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-open-connected],#connectedDemoBtn,[data-connected-persona],#connectedLogin'))setTimeout(refresh,350);
    },true);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
