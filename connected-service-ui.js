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
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const human=s=>({ACCEPTED:'Worker Assigned',ON_THE_WAY:'Worker On The Way',ARRIVED:'Worker Arrived',IDENTITY_VERIFIED:'Identity Verified',CUSTOMER_CONFIRMED:'Customer Confirmed',IN_PROGRESS:'Service In Progress',AWAITING_CUSTOMER_CONFIRMATION:'Waiting for Customer Completion',COMPLETED:'Service Completed',PAID:'Payment Completed'}[String(s||'')]||String(s||'').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()));

  function shellOpen(){const s=document.getElementById('connectedShell');return !!(s&&!s.classList.contains('hidden'));}
  function content(){return document.getElementById('connectedContent');}
  function roleFromUi(){return content()?.dataset.connectedRole||'';}
  function ensureHost(id,afterSelector){let host=document.getElementById(id);if(host)return host;const anchor=content()?.querySelector(afterSelector);if(!anchor)return null;host=document.createElement('div');host.id=id;host.style.marginTop='14px';anchor.insertAdjacentElement('afterend',host);return host;}
  function setMarkup(host,signature,html,type){const current=type==='worker'?lastWorkerSignature:lastCustomerSignature;if(signature===current)return false;if(type==='worker')lastWorkerSignature=signature;else lastCustomerSignature=signature;host.innerHTML=html;return true;}
  function friendly(e){const s=Number(e?.status||0);if(s===401){window.SanPaidAuth?.handleExpiredSession?.();return 'Your session expired. Please log in again.';}if(s===403)return 'This action is not available for this role.';if(s===404)return 'This booking or job is no longer available.';if(s===409)return e?.message||'This step is not available in the current service state.';if(s===410)return e?.message||'This verification code expired. Ask the worker to verify identity again.';if(s===422)return e?.message||'Please check the entered information.';if(s>=500)return 'Service temporarily unavailable. Please retry.';return e?.message||'This step could not be completed. Please retry.';}

  async function refresh(){if(!shellOpen()||document.hidden||busy)return;const role=roleFromUi();if(role==='WORKER')await renderWorkerLifecycle();if(role==='CUSTOMER')await renderCustomerVerification();}

  function estimateItems(estimate){
    const items=Array.isArray(estimate?.items)?estimate.items:[];
    if(!items.length)return '';
    return `<div class="connected-list">${items.map(item=>`<div class="connected-state-line"><div class="connected-heading-row"><b>${esc(item.description)}</b><b>${money(item.amount)}</b></div></div>`).join('')}</div>`;
  }

  function workerEstimateBlock(id,estimate){
    const previousItems=Array.isArray(estimate?.items)?estimate.items:[],primary=previousItems[0]||{},secondary=previousItems[1]||{};
    if(estimate?.status==='PENDING')return `<div class="connected-demo-note"><b>ESTIMATE SENT · CUSTOMER APPROVAL PENDING</b><br>${estimateItems(estimate)}<div class="connected-heading-row" style="margin-top:8px"><span>Total</span><b>${money(estimate.total)}</b></div></div>`;
    if(estimate?.status==='APPROVED')return `<div class="connected-success"><b>ESTIMATE APPROVED ✓</b><br>Customer approved ${money(estimate.total)}. Identity / QR service-start verification is now unlocked.</div>`;
    const revision=estimate?.status==='REJECTED'?'<div class="connected-demo-note"><b>Customer rejected the previous estimate.</b> Revise the scope or amount and send a new estimate.</div>':'';
    return `${revision}<form id="connectedEstimateForm" class="connected-form" data-booking="${id}">
      <span class="connected-step-label">INSPECTION → ITEMIZED ESTIMATE</span>
      <h3>${estimate?.status==='REJECTED'?'Revise Estimate':'Create Estimate Before Service Start'}</h3>
      <p>After inspection, list the work and price. Service-start verification remains locked until the customer approves.</p>
      <div class="connected-form-row">
        <div class="field"><label>Work Item</label><input id="estimateItem1" value="${esc(primary.description||'')}" maxlength="180" placeholder="e.g. Electrical service labour" required></div>
        <div class="field"><label>Amount</label><input id="estimateAmount1" type="number" inputmode="decimal" min="1" max="200000" step="0.01" value="${primary.amount!=null?esc(primary.amount):''}" placeholder="Enter amount" required></div>
      </div>
      <div class="connected-form-row">
        <div class="field"><label>Optional Item</label><input id="estimateItem2" value="${esc(secondary.description||'')}" maxlength="180" placeholder="e.g. Replacement switch"></div>
        <div class="field"><label>Optional Amount</label><input id="estimateAmount2" type="number" inputmode="decimal" min="1" max="200000" step="0.01" value="${secondary.amount!=null?esc(secondary.amount):''}" placeholder="Enter amount"></div>
      </div>
      <div class="field"><label>Inspection Note</label><textarea id="estimateNote" maxlength="600" placeholder="What was inspected and what work is proposed?">${esc(estimate?.note||'')}</textarea></div>
      <button class="btn primary" type="submit" id="connectedEstimateSubmit">${estimate?.status==='REJECTED'?'SEND REVISED ESTIMATE':'SEND ESTIMATE FOR APPROVAL'}</button>
    </form>`;
  }

  async function renderWorkerLifecycle(){
    const host=ensureHost('connectedLifecycleHost','.connected-card:last-child');if(!host)return;
    try{
      const offers=await req('/api/connected/worker/offers');
      const accepted=offers.find(o=>o.offerStatus==='ACCEPTED')||offers.find(o=>['ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'].includes(o.status));
      if(!accepted){if(lastWorkerSignature!=='EMPTY'){host.innerHTML='';lastWorkerSignature='EMPTY';}return;}
      const id=Number(accepted.bookingId),status=String(accepted.status||''),tokenKey=`sanpaid_service_start_token_${id}`,storedToken=getSession(tokenKey);
      let estimate=null;
      if(status==='ARRIVED'){try{estimate=(await req(`/api/connected/bookings/${id}/estimate`)).estimate||null;}catch{}}
      let action='';
      if(status==='ACCEPTED')action=`<button class="btn primary" type="button" data-life="travel" data-booking="${id}">Start Travel</button>`;
      else if(status==='ON_THE_WAY')action=`<button class="btn primary" type="button" data-life="arrive" data-booking="${id}">Mark Arrived</button>`;
      else if(status==='ARRIVED'&&estimate?.status==='APPROVED')action=`<button class="btn primary" type="button" data-life="identity" data-booking="${id}">Verify Identity</button>`;
      else if(status==='IDENTITY_VERIFIED')action=`<div class="connected-demo-note">Identity verified after approved estimate. Share the one-time service verification code with the customer.</div>`;
      else if(status==='CUSTOMER_CONFIRMED')action=`<button class="btn primary" type="button" data-life="start" data-booking="${id}">Start Service</button>`;
      else if(status==='IN_PROGRESS')action=`<button class="btn primary" type="button" data-life="complete-request" data-booking="${id}">Request Completion</button>`;
      else if(status==='AWAITING_CUSTOMER_CONFIRMATION')action=`<div class="connected-demo-note">Waiting for the customer to confirm service completion.</div>`;
      else if(status==='COMPLETED')action=`<div class="connected-success">Service completion confirmed by the customer.</div>`;
      else if(status==='PAID')action=`<div class="connected-success">Service, payment record and invoice are complete.</div>`;

      const identityDone=['IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'].includes(status);
      const customerDone=['CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'].includes(status);
      const estimateApproved=status!=='ARRIVED'||estimate?.status==='APPROVED'||identityDone;
      const signature=JSON.stringify([id,status,storedToken,estimate?.status,estimate?.total,estimate?.items]);
      const estimateBlock=status==='ARRIVED'?workerEstimateBlock(id,estimate):'';
      const html=`<div class="connected-card"><span class="connected-step-label">SERVICE START</span><h3>Inspection, Approval & Service Start</h3><p>Service can start only after the customer approves the itemized estimate and both trust checks are complete.</p><div class="connected-status"><span class="badge b-green">${esc(human(status))}</span><b>${esc(accepted.bookingCode||'')}</b></div>${estimateBlock}<div class="connected-trust-checks"><div class="connected-trust-row ${estimateApproved?'done':''}"><span>Estimate Approval</span><b>${estimateApproved?'✅ Approved':'⏳ Required'}</b></div><div class="connected-trust-row ${identityDone?'done':''}"><span>Worker Identity</span><b>${identityDone?'✅ Verified':'⏳ Pending'}</b></div><div class="connected-trust-row ${customerDone?'done':''}"><span>Customer Worker Confirmation</span><b>${customerDone?'✅ Confirmed':'⏳ Pending'}</b></div></div>${storedToken?`<div class="connected-voice"><span class="connected-step-label">ONE-TIME VERIFICATION</span><b>One-Time Service Verification Code</b><div class="transcript" style="word-break:break-all"><code>${esc(storedToken)}</code></div><div class="connected-actions"><button class="btn secondary small" type="button" data-copy-token="${esc(storedToken)}">Copy Code</button></div></div>`:''}<div class="connected-actions">${action}</div><div id="connectedLifecycleMessage"></div></div>`;
      if(setMarkup(host,signature,html,'worker')){
        host.querySelectorAll('[data-life]').forEach(b=>b.onclick=()=>runWorkerAction(b.dataset.life,Number(b.dataset.booking),b));
        host.querySelector('#connectedEstimateForm')?.addEventListener('submit',e=>submitEstimate(e,id));
        host.querySelector('[data-copy-token]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(e.currentTarget.dataset.copyToken);message('Verification code copied. Open the Customer device and confirm the booked worker.','success');}catch{message('Copy is unavailable. Select the verification code manually.','warn');}});
      }
    }catch(e){const signature='ERR:'+String(e.status||e.message);setMarkup(host,signature,`<div class="connected-error">${esc(friendly(e))}</div>`,'worker');}
  }

  async function submitEstimate(event,id){
    event.preventDefault();if(busy)return;
    const form=event.currentTarget,button=form.querySelector('#connectedEstimateSubmit'),old=button?.textContent;
    const firstDescription=form.querySelector('#estimateItem1')?.value.trim()||'',firstAmount=Number(form.querySelector('#estimateAmount1')?.value||0);
    const secondDescription=form.querySelector('#estimateItem2')?.value.trim()||'',secondAmount=Number(form.querySelector('#estimateAmount2')?.value||0);
    const items=[{description:firstDescription,amount:firstAmount}];
    if(secondDescription||secondAmount)items.push({description:secondDescription,amount:secondAmount});
    if(!firstDescription||!Number.isFinite(firstAmount)||firstAmount<=0||(items.length>1&&(!secondDescription||!Number.isFinite(secondAmount)||secondAmount<=0))){message('Enter a description and positive amount for every estimate item.','error');return;}
    busy=true;if(button){button.disabled=true;button.textContent='Sending estimate…';}
    try{
      await post(`/api/connected/worker/jobs/${id}/estimate`,{items,note:form.querySelector('#estimateNote')?.value.trim()||''});
      message('Itemized estimate sent. Waiting for customer approval before service-start verification.');lastWorkerSignature='';signal('estimate-submitted');
    }catch(e){message(friendly(e),'error');if(button){button.disabled=false;button.textContent=old;}}
    finally{busy=false;setTimeout(refresh,160);}
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
      message(action==='identity'?'Identity verification recorded for this controlled environment. A one-time service verification code is ready.':'Service status updated across devices.');lastWorkerSignature='';signal(`service-${action}`);
    }catch(e){message(friendly(e),'error');if(button){button.disabled=false;button.textContent=old;}}
    finally{busy=false;setTimeout(refresh,160);}
  }

  async function bookingIdForCustomer(){
    const saved=Number(getSession(BOOKING_KEY)||0);if(saved)return saved;
    try{const snapshot=await req('/api/connected/snapshot'),latest=snapshot.bookings?.[0];if(latest?.id){setSession(BOOKING_KEY,latest.id);return Number(latest.id);}}catch{}
    return 0;
  }

  function customerEstimateBlock(bookingId,status,estimate){
    if(status!=='ARRIVED'&&!estimate)return '';
    if(!estimate)return '<div class="connected-demo-note"><b>WAITING FOR ITEMIZED ESTIMATE</b><br>The worker has arrived. Service-start verification remains locked until an estimate is submitted and approved.</div>';
    if(estimate.status==='REJECTED')return '<div class="connected-demo-note"><b>ESTIMATE REJECTED</b><br>Waiting for the worker to send a revised itemized estimate.</div>';
    if(estimate.status==='APPROVED')return `<div class="connected-success"><b>APPROVED ESTIMATE · ${money(estimate.total)}</b>${estimateItems(estimate)}<div style="margin-top:8px">Service-start verification is unlocked.</div></div>`;
    return `<div class="connected-card" style="margin-top:12px"><span class="connected-step-label">CUSTOMER PRICE CONTROL</span><h3>Approve Itemized Estimate</h3>${estimateItems(estimate)}<div class="connected-heading-row" style="margin-top:10px"><span>Total</span><b>${money(estimate.total)}</b></div>${estimate.note?`<p>${esc(estimate.note)}</p>`:''}<div class="connected-actions"><button class="btn danger" type="button" data-estimate-decision="REJECT" data-booking="${bookingId}">Reject / Ask Revision</button><button class="btn primary" type="button" data-estimate-decision="APPROVE" data-booking="${bookingId}">Approve Estimate</button></div></div>`;
  }

  async function renderCustomerVerification(){
    const host=ensureHost('connectedCustomerVerificationHost','.connected-grid');if(!host)return;
    const bookingId=await bookingIdForCustomer();if(!bookingId){if(lastCustomerSignature!=='EMPTY'){host.innerHTML='';lastCustomerSignature='EMPTY';}return;}
    let booking=null;try{booking=await req(`/api/connected/customer/bookings/${bookingId}`);}catch(e){if(e.status===404)removeSession(BOOKING_KEY);}
    if(!booking){if(lastCustomerSignature!=='EMPTY'){host.innerHTML='';lastCustomerSignature='EMPTY';}return;}
    const status=String(booking.status||'');
    let estimate=null;
    try{estimate=(await req(`/api/connected/bookings/${bookingId}/estimate`)).estimate||null;}catch{}
    const beyondEstimate=['IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'].includes(status),estimateApproved=estimate?.status==='APPROVED'||beyondEstimate;
    const completion=status==='AWAITING_CUSTOMER_CONFIRMATION'?`<button class="btn primary" type="button" id="connectedConfirmCompletion">Confirm Service Completed</button>`:'';
    const tokenKey=`sanpaid_customer_start_token_${bookingId}`,saved=getSession(tokenKey),signature=JSON.stringify([bookingId,status,saved,estimate?.status,estimate?.total,estimate?.items]);
    const estimateBlock=customerEstimateBlock(bookingId,status,estimate);
    const verificationControls=estimateApproved?`<div class="field"><label>One-Time Service Verification Code</label><input id="connectedStartToken" autocomplete="off" placeholder="Paste code from Worker device" value="${esc(saved)}"></div><div class="connected-actions"><button class="btn secondary" type="button" id="connectedVerifyToken">Verify Code</button><button class="btn primary" type="button" id="connectedConfirmWorker" disabled>Confirm Booked Worker</button>${completion}</div><div id="connectedWorkerIdentityPreview"></div>`:`${completion}<div class="connected-demo-note">Worker identity / QR verification is locked until the estimate is approved.</div>`;
    const html=`<div class="connected-card"><span class="connected-step-label">APPROVAL + TRUST CHECK</span><h3>Approve Scope, Then Confirm Your Booked Worker</h3><p>Price approval happens before service start. After approval, use the one-time verification code from the assigned worker.</p><div class="connected-status"><span class="badge b-green">${esc(human(status))}</span><b>${esc(booking.bookingCode||'')}</b></div>${estimateBlock}<div class="connected-form">${verificationControls}<div id="connectedCustomerVerificationMessage"></div></div></div>`;
    if(setMarkup(host,signature,html,'customer')){
      host.querySelectorAll('[data-estimate-decision]').forEach(b=>b.addEventListener('click',()=>decideEstimate(bookingId,b.dataset.estimateDecision,b)));
      const input=host.querySelector('#connectedStartToken');
      host.querySelector('#connectedVerifyToken')?.addEventListener('click',()=>verifyToken(input?.value.trim()||'',bookingId));
      host.querySelector('#connectedConfirmWorker')?.addEventListener('click',()=>confirmToken(input?.value.trim()||'',bookingId));
      host.querySelector('#connectedConfirmCompletion')?.addEventListener('click',e=>confirmCompletion(bookingId,e.currentTarget));
      if(saved&&input)verifyToken(saved,bookingId,false);
    }
  }

  async function decideEstimate(bookingId,decision,button){
    if(busy)return;busy=true;const old=button?.textContent;if(button){button.disabled=true;button.textContent=decision==='APPROVE'?'Approving estimate…':'Rejecting estimate…';}
    try{
      await post(`/api/connected/customer/bookings/${bookingId}/estimate/decision`,{decision});
      message(decision==='APPROVE'?'Estimate approved. Worker identity / QR service-start verification is now unlocked.':'Estimate rejected. The worker can revise and send it again.');lastCustomerSignature='';signal('estimate-decision');
    }catch(e){message(friendly(e),'error');if(button){button.disabled=false;button.textContent=old;}}
    finally{busy=false;setTimeout(refresh,160);}
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
