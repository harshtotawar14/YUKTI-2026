# Claude Main Page Handoff — Part 3 of 3

Read Parts 1 and 2 before editing.

This part contains the remaining JavaScript loaded directly by the landing page. Treat these behaviors as regression constraints: redesign visual presentation without accidentally breaking platform access, connected service/commerce flows, capacity exchange, judge/admin role launches, selector tour, evaluator interactions or final polish behavior.

## Files in this part
- connected-service-ui.js
- connected-commerce-ui.js
- connected-runtime-fix.js
- capacity-worker-ui.js
- judge-demo.js
- selector-mode.js
- top1-polish.js
- evaluator-final.js

After reading all three parts, produce the redesign using the instructions in Part 1.


---

## FILE: `connected-service-ui.js`

```javascript
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

```


---

## FILE: `connected-commerce-ui.js`

```javascript
(() => {
  'use strict';

  const BOOKING_KEY='sanpaid_connected_booking_id';
  let busy=false;
  let lastWorkerSignature='';
  let lastCustomerSignature='';

  const getSession=key=>{try{return sessionStorage.getItem(key)||''}catch{return''}};
  const setSession=(key,value)=>{try{value?sessionStorage.setItem(key,String(value)):sessionStorage.removeItem(key)}catch{}};
  const signal=source=>{try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source,at:Date.now()}}));}catch{}};
  async function req(path,opt={}){if(window.SanPaidApi?.request)return window.SanPaidApi.request(path,opt);const r=await fetch(path,{...opt,credentials:'include',headers:{...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})},cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.message||d.error||`Request failed (${r.status})`);e.status=r.status;throw e;}return d;}
  const post=(p,b={})=>window.SanPaidApi?.post?window.SanPaidApi.post(p,b):req(p,{method:'POST',body:JSON.stringify(b)});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2});
  const human=s=>String(s||'').toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  function open(){const s=document.getElementById('connectedShell');return !!(s&&!s.classList.contains('hidden'));}
  function role(){return document.getElementById('connectedContent')?.dataset.connectedRole||'';}
  function host(id,anchorId){let h=document.getElementById(id);if(h)return h;const a=document.getElementById(anchorId);if(!a)return null;h=document.createElement('div');h.id=id;h.style.marginTop='14px';a.insertAdjacentElement('afterend',h);return h;}
  function friendly(e){const s=Number(e?.status||0);if(s===401){window.SanPaidAuth?.handleExpiredSession?.();return 'Your session expired. Please log in again.';}if(s===403)return 'This action is not available for this role.';if(s===404)return 'This booking or record is no longer available.';if(s===409)return e?.message||'This action is not available in the current service state.';if(s===422)return e?.message||'Please check the entered information.';if(s===429)return 'Too many requests. Please wait and retry.';if(s>=500)return 'Service temporarily unavailable. Please retry.';return e?.message||'This action could not be completed. Please retry.';}
  function setMarkup(h,signature,html,type){const current=type==='worker'?lastWorkerSignature:lastCustomerSignature;if(current===signature)return false;if(type==='worker')lastWorkerSignature=signature;else lastCustomerSignature=signature;h.innerHTML=html;return true;}
  async function refresh(){if(!open()||document.hidden||busy)return;const r=role();if(r==='WORKER')await worker();if(r==='CUSTOMER')await customer();}

  async function worker(){
    const h=host('connectedWorkerCommerce','connectedLifecycleHost');if(!h)return;
    try{
      const offers=await req('/api/connected/worker/offers');
      const o=offers.find(x=>x.offerStatus==='ACCEPTED'&&['IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAID'].includes(x.status));
      if(!o||o.status!=='IN_PROGRESS'){if(lastWorkerSignature!=='EMPTY'){h.innerHTML='';lastWorkerSignature='EMPTY';}return;}
      const signature=JSON.stringify([o.bookingId,o.status]);
      const html=`<div class="connected-card"><span class="connected-step-label">OPTIONAL EXTRA WORK</span><h3>Request Additional Work Approval</h3><p>Extra work changes the final bill only after the customer approves it.</p><form id="connectedExtraForm" class="connected-form"><div class="field"><label>Work Item</label><input id="extraWorkItem" placeholder="e.g. Replace damaged switch" required></div><div class="field"><label>Reason</label><input id="extraReason" placeholder="Why is additional work required?"></div><div class="field"><label>Amount</label><input id="extraAmount" type="number" min="1" max="10000" placeholder="Amount" required></div><button class="btn secondary" id="extraSubmit" type="submit">Request Customer Approval</button><div id="connectedCommerceMessage"></div></form></div>`;
      if(setMarkup(h,signature,html,'worker'))h.querySelector('#connectedExtraForm').onsubmit=async e=>{e.preventDefault();if(busy)return;const amount=Number(h.querySelector('#extraAmount').value),workItem=h.querySelector('#extraWorkItem').value.trim();if(!workItem||!Number.isFinite(amount)||amount<=0){msg('Enter a valid work item and amount.','error');return;}busy=true;const b=h.querySelector('#extraSubmit'),old=b.textContent;b.disabled=true;b.textContent='Sending request…';try{await post(`/api/connected/worker/jobs/${o.bookingId}/extra-charge`,{workItem,reason:h.querySelector('#extraReason').value.trim(),amount});msg('Additional work request sent to the customer for approval.');signal('extra-charge-requested');}catch(err){msg(friendly(err),'error');}finally{busy=false;b.disabled=false;b.textContent=old;}};
    }catch(e){if(lastWorkerSignature!=='ERR'){h.innerHTML=`<div class="connected-error">${esc(friendly(e))}</div>`;lastWorkerSignature='ERR';}}
  }

  async function customerBookingId(){
    const saved=Number(getSession(BOOKING_KEY)||0);if(saved)return saved;
    try{const snapshot=await req('/api/connected/snapshot'),latest=snapshot.bookings?.[0];if(latest?.id){setSession(BOOKING_KEY,latest.id);return Number(latest.id);}}catch{}
    return 0;
  }

  async function customer(){
    const h=host('connectedCustomerCommerce','connectedCustomerVerificationHost');if(!h)return;
    const id=await customerBookingId();if(!id){if(lastCustomerSignature!=='EMPTY'){h.innerHTML='';lastCustomerSignature='EMPTY';}return;}
    try{
      const [checkout,charges]=await Promise.all([req(`/api/connected/customer/bookings/${id}/checkout`),req(`/api/connected/customer/bookings/${id}/charges`)]);
      const signature=JSON.stringify([checkout.status,checkout.total,checkout.approvedAdditional,checkout.finalAmount,checkout.payment?.transactionReference,checkout.invoice?.invoiceNumber,(charges||[]).map(c=>[c.id,c.status,c.amount,c.workItem])]);
      const chargeHtml=charges.length?charges.map(c=>`<div class="connected-state-line"><div class="connected-heading-row"><b>${esc(c.workItem)}</b><b>${money(c.amount)}</b></div><p>${esc(c.reason||'Additional work')}</p><span class="badge ${c.status==='APPROVED'?'b-green':c.status==='REJECTED'?'b-gray':'b-orange'}">${esc(human(c.status))}</span>${c.status==='PENDING'?`<div class="connected-actions"><button type="button" class="btn danger small" data-charge="${c.id}" data-decision="REJECT">Reject</button><button type="button" class="btn primary small" data-charge="${c.id}" data-decision="APPROVE">Approve</button></div>`:''}</div>`).join(''):'<div class="connected-empty">No additional work charges.</div>';
      const payable=['COMPLETED','PAYMENT_PENDING','PAID'].includes(checkout.status),paid=!!checkout.payment;
      const html=`<div class="connected-card"><span class="connected-step-label">CHECKOUT</span><h3>Payment & Invoice</h3><p>Only customer-approved extra work is included in the final amount.</p><div class="connected-list">${chargeHtml}</div><div class="connected-divider"></div><div class="connected-meta"><div>Service Amount<b>${money(checkout.total)}</b></div><div>Approved Extra Work<b>${money(checkout.approvedAdditional)}</b></div><div>Final Amount<b>${money(checkout.finalAmount)}</b></div><div>Status<b>${esc(human(checkout.status))}</b></div></div>${payable&&!paid?`<div class="connected-demo-note"><b>SANDBOX PAYMENT</b> · No real money will move.</div><div class="connected-actions connected-payment-actions"><label class="connected-payment-method"><span>Payment Method</span><select id="connectedPayMethod" class="voice-lang-select"><option value="SANDBOX">Digital Payment</option><option value="UPI">UPI · Sandbox</option><option value="CARD">Card · Sandbox</option><option value="CASH">Cash Record</option></select></label><button type="button" class="btn primary" id="connectedPay">Complete Payment (Sandbox)</button></div>`:''}${paid?`<div class="connected-success connected-payment-success"><b>Payment Recorded — Sandbox ✓</b><br>Transaction ID: ${esc(checkout.payment.transactionReference)}<br>Method: ${esc(checkout.payment.paymentMethod)}<br>Amount: ${money(checkout.payment.amount)}${checkout.invoice?`<br>Invoice: <b>${esc(checkout.invoice.invoiceNumber)}</b>`:''}</div>${checkout.invoice?`<div class="connected-actions"><button class="btn secondary" type="button" id="connectedPrintInvoice">Print Invoice</button></div>`:''}<div class="connected-divider"></div><form id="connectedRatingForm" class="connected-form"><div class="field"><label>Rating</label><select id="connectedStars"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Needs Improvement</option><option value="1">1 — Poor</option></select></div><div class="field"><label>Feedback</label><textarea id="connectedFeedback" placeholder="Optional service feedback"></textarea></div><button class="btn primary" id="connectedRatingSubmit" type="submit">Submit Rating</button></form>`:''}<div id="connectedCommerceMessage"></div></div>`;
      if(setMarkup(h,signature,html,'customer')){h.querySelectorAll('[data-charge]').forEach(b=>b.onclick=()=>decide(Number(b.dataset.charge),b.dataset.decision,b));h.querySelector('#connectedPay')?.addEventListener('click',e=>pay(id,h.querySelector('#connectedPayMethod').value,e.currentTarget));h.querySelector('#connectedRatingForm')?.addEventListener('submit',e=>rate(e,id));h.querySelector('#connectedPrintInvoice')?.addEventListener('click',()=>window.print());}
    }catch(e){if(e.status===404)setSession(BOOKING_KEY,'');if(lastCustomerSignature!=='ERR'){h.innerHTML=`<div class="connected-error">${esc(friendly(e))}</div>`;lastCustomerSignature='ERR';}}
  }

  function msg(text,type='success'){const e=document.getElementById('connectedCommerceMessage');if(e)e.innerHTML=`<div class="${type==='error'?'connected-error':'connected-success'}" style="margin-top:10px">${esc(text)}</div>`;}
  async function decide(id,decision,button){if(busy)return;busy=true;const old=button.textContent;button.disabled=true;button.textContent=decision==='APPROVE'?'Approving…':'Rejecting…';try{await post(`/api/connected/customer/charges/${id}/decision`,{decision});msg(`Additional charge ${decision==='APPROVE'?'approved':'rejected'}.`);lastCustomerSignature='';signal('extra-charge-decision');}catch(e){msg(friendly(e),'error');button.disabled=false;button.textContent=old;}finally{busy=false;setTimeout(refresh,160);}}
  async function pay(id,method,button){if(busy)return;busy=true;const old=button.textContent;button.disabled=true;button.textContent='Processing Payment…';try{const r=await post(`/api/connected/customer/bookings/${id}/pay`,{method});msg(`Payment recorded in sandbox: ${r.payment?.transactionReference||'success'}.`);lastCustomerSignature='';signal('sandbox-payment');}catch(e){msg(friendly(e),'error');button.disabled=false;button.textContent=old;}finally{busy=false;setTimeout(refresh,160);}}
  async function rate(event,id){event.preventDefault();if(busy)return;busy=true;const b=document.getElementById('connectedRatingSubmit'),old=b?.textContent;if(b){b.disabled=true;b.textContent='Saving rating…';}try{await post(`/api/connected/customer/bookings/${id}/rating`,{stars:Number(document.getElementById('connectedStars').value),feedback:document.getElementById('connectedFeedback').value.trim()});msg('Rating saved to the worker service profile.');lastCustomerSignature='';signal('rating-submitted');}catch(e){msg(friendly(e),'error');if(b){b.disabled=false;b.textContent=old;}}finally{busy=false;}}

  function start(){
    setTimeout(refresh,600);
    window.addEventListener('sanpaid:connected-sync',()=>setTimeout(refresh,100));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

```


---

## FILE: `connected-runtime-fix.js`

```javascript
(() => {
  'use strict';

  const CONNECTED_TOKEN_KEY='sanpaid_connected_demo_token_v1';
  const ADMIN_TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const subscribers=new Set();
  let syncTimer=0;
  let syncInFlight=false;
  let lastSignature='';
  let lastSnapshot=null;
  const DEFAULT_TIMEOUT_MS=10000;

  function storageGet(key){try{return sessionStorage.getItem(key)||'';}catch{return '';}}
  function storageSet(key,value){try{value?sessionStorage.setItem(key,String(value)):sessionStorage.removeItem(key);}catch{}}
  function normalizePath(input){
    const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';
    try{
      const url=new URL(raw,location.href);
      if(url.pathname.startsWith('/api/'))return `${url.pathname}${url.search}`;
    }catch{}
    return raw;
  }
  function tokenFor(path){
    if(path.startsWith('/api/cooperative-admin/'))return storageGet(ADMIN_TOKEN_KEY);
    if(path.startsWith('/api/connected/'))return storageGet(CONNECTED_TOKEN_KEY)||storageGet(ADMIN_TOKEN_KEY);
    return '';
  }
  function clearRoleToken(path){
    if(path.startsWith('/api/cooperative-admin/'))storageSet(ADMIN_TOKEN_KEY,'');
    if(path.startsWith('/api/connected/')){storageSet(CONNECTED_TOKEN_KEY,'');storageSet(ADMIN_TOKEN_KEY,'');}
  }
  function makeError(response,data){
    const error=new Error(data?.message||data?.error||`Request failed (${response.status})`);
    error.status=response.status;error.data=data||{};return error;
  }

  async function raw(input,options={}){
    const path=normalizePath(input);
    const headers=new Headers(options.headers||{});
    if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    const bearer=options.bearer===false?'':(options.token||tokenFor(path));
    if(bearer&&!headers.has('Authorization'))headers.set('Authorization',`Bearer ${bearer}`);
    const controller=new AbortController();
    const timeoutMs=Number.isFinite(Number(options.timeoutMs))?Number(options.timeoutMs):DEFAULT_TIMEOUT_MS;
    const timeout=timeoutMs>0?setTimeout(()=>controller.abort(new DOMException('Request timed out','TimeoutError')),timeoutMs):0;
    const relayAbort=()=>controller.abort(options.signal?.reason);
    if(options.signal){
      if(options.signal.aborted)relayAbort();
      else options.signal.addEventListener('abort',relayAbort,{once:true});
    }
    try{
      const {timeoutMs:_timeoutMs,bearer:_bearer,token:_token,signal:_signal,retry:_retry,...fetchOptions}=options;
      const response=await fetch(path,{...fetchOptions,headers,signal:controller.signal,credentials:options.credentials||'include',cache:options.cache||'no-store'});
      if(response.status===401)clearRoleToken(path);
      return response;
    }finally{
      if(timeout)clearTimeout(timeout);
      options.signal?.removeEventListener?.('abort',relayAbort);
    }
  }

  async function request(input,options={}){
    const method=String(options.method||'GET').toUpperCase();
    const canRetry=method==='GET'&&options.retry!==false;
    for(let attempt=0;attempt<(canRetry?2:1);attempt++){
      try{
        const response=await raw(input,options);
        const data=await response.json().catch(()=>({}));
        if(response.ok)return data;
        if(canRetry&&attempt===0&&[502,503,504].includes(response.status))continue;
        if(response.status===401){
          try{window.dispatchEvent(new CustomEvent('sanpaid:session-expired'));}catch{}
        }
        throw makeError(response,data);
      }catch(error){
        if(canRetry&&attempt===0&&(error?.name==='AbortError'||error?.name==='TimeoutError'||error instanceof TypeError))continue;
        throw error;
      }
    }
  }
  const get=(path,options={})=>request(path,{...options,method:'GET'});
  const post=(path,body={},options={})=>request(path,{...options,method:'POST',body:JSON.stringify(body)});
  const patch=(path,body={},options={})=>request(path,{...options,method:'PATCH',body:JSON.stringify(body)});

  window.SanPaidApi=Object.freeze({
    request,get,post,patch,raw,
    connectedToken:()=>storageGet(CONNECTED_TOKEN_KEY),
    adminToken:()=>storageGet(ADMIN_TOKEN_KEY),
    clearConnectedToken:()=>storageSet(CONNECTED_TOKEN_KEY,''),
    clearAdminToken:()=>storageSet(ADMIN_TOKEN_KEY,''),
    mode:'EXPLICIT_SAME_ORIGIN_API_CLIENT'
  });

  const readinessState={running:null,prompt:null,last:null};
  const readinessChecks=[
    {
      id:'frontend',label:'Deployed frontend build',
      run:()=>get('/build-info.json',{bearer:false,timeoutMs:8000,retry:false}),
      validate:data=>data?.product==='SanPaid'&&data?.runtime==='v69'&&Boolean(data?.commitSha),
      detail:data=>`${String(data.commitSha).slice(0,7)} · ${data.runtime}`
    },
    {id:'backend',label:'Connected backend',run:()=>get('/api/connected/health',{bearer:false,timeoutMs:12000}),validate:data=>data?.ok===true},
    {
      id:'auth',label:'Authentication route',
      run:async()=>{const response=await raw('/api/auth/me',{bearer:false,timeoutMs:12000,retry:false});return {ok:[200,401].includes(response.status),status:response.status};},
      validate:data=>data?.ok===true,
      detail:data=>`HTTP ${data.status} · route available`
    },
    {
      id:'snapshot',label:'Connected snapshot route',
      run:async()=>{const response=await raw('/api/connected/snapshot',{bearer:false,timeoutMs:12000,retry:false});return {ok:[200,401,403].includes(response.status),status:response.status};},
      validate:data=>data?.ok===true,
      detail:data=>`HTTP ${data.status} · route available`
    },
    {
      id:'catalog',label:'Database service catalog',run:()=>get('/api/public/services',{bearer:false,timeoutMs:12000}),
      validate:data=>data?.ok===true&&data?.source==='DATABASE_CONFIGURATION'&&Array.isArray(data?.services)&&data.services.length>0,
      detail:data=>`${data.services.length} database-configured services`
    }
  ];
  function readinessRoot(){
    let root=document.getElementById('sanpaidReadiness');
    if(root)return root;
    root=document.createElement('div');root.id='sanpaidReadiness';root.className='readiness-backdrop';root.hidden=true;
    root.innerHTML='<section class="readiness-dialog" role="dialog" aria-modal="true" aria-labelledby="readinessTitle"><span class="connected-step-label">PLATFORM READINESS</span><h2 id="readinessTitle">Checking connected services</h2><p id="readinessSummary">The live workflow opens only after its critical dependencies respond.</p><div id="readinessChecks" class="readiness-checks" aria-live="polite"></div><div class="readiness-actions"><button type="button" class="btn secondary" data-readiness-close>Close</button><button type="button" class="btn secondary" data-readiness-retry hidden>Retry checks</button><button type="button" class="btn primary" data-readiness-continue hidden>Continue to role access</button></div></section>';
    document.body.appendChild(root);return root;
  }
  function renderReadiness(results=[]){
    const root=readinessRoot(),list=root.querySelector('#readinessChecks');
    list.innerHTML=readinessChecks.map(check=>{const result=results.find(item=>item.id===check.id);const state=!result?'checking':result.ok?'ready':'blocked';return `<div class="readiness-row ${state}"><span aria-hidden="true">${state==='ready'?'✓':state==='blocked'?'!':'…'}</span><div><b>${check.label}</b><small>${!result?'Checking…':result.ok?result.detail:result.detail||'Unavailable'}</small></div></div>`;}).join('');
  }
  async function runReadiness(){
    if(readinessState.running)return readinessState.running;
    renderReadiness();
    readinessState.running=Promise.all(readinessChecks.map(async check=>{
      const started=performance.now();
      try{
        const data=await check.run();
        const valid=check.validate?check.validate(data):data?.ok===true;
        const description=valid?(check.detail?.(data)||`${Math.round(performance.now()-started)} ms · ready`):'Unexpected response contract';
        return {id:check.id,ok:valid,detail:description};
      }catch(error){return {id:check.id,ok:false,detail:error?.message||'Connection failed'};}
    })).then(results=>{
      readinessState.last={ok:results.every(item=>item.ok),results,checkedAt:Date.now()};
      try{window.dispatchEvent(new CustomEvent('sanpaid:readiness-result',{detail:readinessState.last}));}catch{}
      return readinessState.last;
    }).finally(()=>{readinessState.running=null;});
    return readinessState.running;
  }
  function requireReadiness(){
    const recent=readinessState.last&&Date.now()-readinessState.last.checkedAt<30000;
    if(!recent&&!readinessState.running){
      runReadiness().catch(()=>{});
    }
    return Promise.resolve(true);
  }
  window.SanPaidReadiness=Object.freeze({run:runReadiness,require:requireReadiness,getLastResult:()=>readinessState.last});

  function connectedVisible(){
    const shell=document.getElementById('connectedShell');
    return !!(shell&&!shell.classList.contains('hidden'));
  }
  function signature(snapshot){
    return JSON.stringify({role:snapshot?.role||'',revision:snapshot?.revision||'0',bookings:snapshot?.bookings||[],offers:snapshot?.offers||[]});
  }
  function emit(snapshot,changed=true){
    lastSnapshot=snapshot;
    for(const listener of subscribers){try{listener(snapshot,{changed});}catch(error){console.error('[SanPaidSync subscriber]',error);}}
    try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'snapshot',snapshot,changed,at:Date.now()}}));}catch{}
  }
  function clearTimer(){clearTimeout(syncTimer);syncTimer=0;}
  function schedule(delay){clearTimer();if(!subscribers.size)return;syncTimer=setTimeout(tick,delay);}
  async function tick(force=false){
    if(syncInFlight||!subscribers.size)return;
    if(!connectedVisible()){schedule(document.hidden?45000:5000);return;}
    if(document.hidden&&!force){schedule(45000);return;}
    syncInFlight=true;
    try{
      const snapshot=await get('/api/connected/snapshot');
      const nextSignature=signature(snapshot),changed=nextSignature!==lastSignature;
      if(changed||force){lastSignature=nextSignature;emit(snapshot,changed);}
      setConnectionState('online');
    }catch(error){
      setConnectionState(error?.status===401?'offline':'retry');
      if(error?.status===401){try{window.SanPaidAuth?.handleExpiredSession?.();}catch{}}
    }finally{
      syncInFlight=false;
      schedule(document.hidden?45000:4000);
    }
  }
  function setConnectionState(state){
    const element=document.getElementById('connectedTopStatus');if(!element)return;
    const map={online:['● Live','#8ee2b5'],retry:['● Reconnecting…','#ffb66e'],offline:['● Offline','#ff9b9b']};
    const [text,color]=map[state]||map.retry;element.textContent=text;element.style.color=color;
  }
  function subscribe(listener){
    if(typeof listener!=='function')return()=>{};
    subscribers.add(listener);if(subscribers.size===1)schedule(80);
    if(lastSnapshot)queueMicrotask(()=>{try{listener(lastSnapshot,{changed:false,cached:true});}catch{}});
    return()=>{subscribers.delete(listener);if(!subscribers.size)clearTimer();};
  }
  function refreshNow(){if(!subscribers.size)return Promise.resolve();clearTimer();return tick(true);}
  function stop(){subscribers.clear();clearTimer();lastSignature='';lastSnapshot=null;}

  window.SanPaidSync=Object.freeze({subscribe,refreshNow,stop,getLastSnapshot:()=>lastSnapshot,mode:'ONE_ROLE_AWARE_SNAPSHOT_LOOP'});

  async function checkHealth(){
    if(document.hidden)return;
    try{const data=await get('/api/connected/health',{bearer:false});setConnectionState(data?.ok?'online':'offline');}
    catch{setConnectionState('offline');}
  }

  function start(){
    checkHealth();
    window.addEventListener('online',()=>{checkHealth();refreshNow();});
    window.addEventListener('offline',()=>setConnectionState('offline'));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkHealth();refreshNow();}});
    window.addEventListener('pageshow',()=>{checkHealth();refreshNow();});
    window.addEventListener('sanpaid:connected-sync',event=>{if(event.detail?.source!=='snapshot')refreshNow();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

```


---

## FILE: `capacity-worker-ui.js`

```javascript
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let busy=false;
  let timer=null;
  let lastSignature='';

  async function request(path,opt={}){const r=await fetch(path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})},cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(d.message||d.error||`Request failed (${r.status})`);e.status=r.status;throw e;}return d;}
  const post=(path,body)=>request(path,{method:'POST',body:JSON.stringify(body||{})});
  function workerScreen(){const content=document.getElementById('connectedContent');return content?.dataset.connectedRole==='WORKER'?content:null;}
  function shellOpen(){const shell=document.getElementById('connectedShell');return !!(shell&&!shell.classList.contains('hidden'));}
  function friendly(e){if(e?.status===401)return 'Your session expired. Please log in again.';if(e?.status>=500)return 'Capacity offers are temporarily unavailable. Please retry.';return e?.message||'Capacity offer could not be loaded.';}

  async function render(force=false){
    if(busy||document.hidden||!shellOpen())return;const content=workerScreen();if(!content)return;
    busy=true;let card=document.getElementById('connectedCapacityOffers');
    try{
      const offers=await request('/api/connected/worker/capacity-offers');const signature=JSON.stringify((offers||[]).map(o=>[o.offerId,o.offerStatus,o.requestCode,o.service,o.zone,o.requestingCooperative,o.providingCooperative]));if(!force&&signature===lastSignature)return;lastSignature=signature;
      if(!card){card=document.createElement('section');card.id='connectedCapacityOffers';card.className='connected-card';card.style.marginTop='14px';content.appendChild(card);}
      card.innerHTML=`<div class="connected-heading-row"><div><span class="connected-step-label">COOPERATIVE CAPACITY</span><h3>Cross-Cooperative Offers</h3><p>Workers are never transferred automatically. Every capacity offer requires your choice.</p></div><span class="badge b-purple">WORKER CONSENT</span></div>${offers.length?offers.map(o=>`<article class="connected-offer" data-capacity-offer="${o.offerId}"><div class="connected-heading-row"><div><b>${esc(o.service)} · ${esc(o.requestCode)}</b><p>${esc(o.requestingCooperative)} needs capacity in ${esc(o.zone)}.</p></div><span class="badge b-orange">${esc(String(o.offerStatus).replaceAll('_',' '))}</span></div><div class="connected-state-line"><b>Providing Cooperative</b><p>${esc(o.providingCooperative||'Your cooperative')}</p></div>${o.offerStatus==='OFFERED'?`<div class="connected-actions"><button type="button" class="btn danger" data-cap-reject="${o.offerId}">Decline</button><button type="button" class="btn primary" data-cap-accept="${o.offerId}">Accept Capacity Offer</button></div>`:'<div class="connected-success"><b>Consent recorded.</b><br>Authorized approval is still required before any cross-cooperative assignment becomes active.</div>'}</article>`).join(''):'<div class="connected-empty">No cross-cooperative capacity offers right now.</div>'}<div id="connectedCapacityMessage"></div>`;
      card.querySelectorAll('[data-cap-accept]').forEach(b=>b.onclick=()=>respond(b,'ACCEPT'));card.querySelectorAll('[data-cap-reject]').forEach(b=>b.onclick=()=>respond(b,'REJECT'));
    }catch(e){if(e.status===401||e.status===403){card?.remove();lastSignature='';}else{if(!card){card=document.createElement('section');card.id='connectedCapacityOffers';card.className='connected-card';card.style.marginTop='14px';content.appendChild(card);}card.innerHTML=`<div class="connected-error">${esc(friendly(e))}</div>`;lastSignature='ERR';}}
    finally{busy=false;}
  }
  function message(text,type='success'){const el=document.getElementById('connectedCapacityMessage');if(el)el.innerHTML=`<div class="${type==='error'?'connected-error':'connected-success'}">${esc(text)}</div>`;}
  async function respond(button,action){if(busy)return;busy=true;const id=button.dataset.capAccept||button.dataset.capReject;const old=button.textContent;button.disabled=true;button.textContent=action==='ACCEPT'?'Accepting…':'Declining…';try{const r=await post(`/api/connected/worker/capacity-offers/${id}/respond`,{action});message(r.message||(action==='ACCEPT'?'Consent recorded. Authorized approval is still required.':'Capacity offer declined.'));lastSignature='';}catch(e){message(friendly(e),'error');button.disabled=false;button.textContent=old;}finally{busy=false;setTimeout(()=>render(true),250);}}
  function schedule(delay=7200){clearTimeout(timer);timer=setTimeout(async()=>{await render();schedule(document.hidden?12000:7200);},delay);}
  function start(){setTimeout(()=>render(true),900);schedule();document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});document.addEventListener('click',e=>{if(e.target.closest('[data-connected-persona],#connectedLogin,[data-open-connected]'))setTimeout(()=>render(true),800);},true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
```


---

## FILE: `judge-demo.js`

```javascript
(() => {
  'use strict';

  const TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const TABS=[
    ['golden','System Verification'],
    ['matching','Assignment Policy'],
    ['trust','Trust & Verification'],
    ['overview','Operations Overview'],
    ['capacity','Capacity Exchange'],
    ['complaint','Complaints & SLA'],
    ['planning','Demand & Capacity Planning'],
    ['research','Architecture & Research'],
    ['security','Security & Privacy'],
    ['welfare','Workforce Development'],
    ['control','System Controls']
  ];

  let token='';
  let user=null;

  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const human=s=>String(s||'—').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());
  const getToken=()=>{try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return ''}};
  const clearToken=()=>{token='';try{sessionStorage.removeItem(TOKEN_KEY)}catch{}};
  const isAdminRole=role=>['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(String(role||'').toUpperCase());

  function friendlyError(status){
    if(status===401)return 'Your administration session has expired. Sign in again.';
    if(status===403)return 'This action is not authorized for the current role.';
    if(status===404)return 'The requested record is not available.';
    if(status===409)return 'The record changed. Refresh and retry.';
    if(status===429)return 'Too many requests. Please wait and retry.';
    if(status>=500)return 'The connected service is temporarily unavailable. Please retry.';
    return 'The request could not be completed. Please retry.';
  }

  async function api(path,opt={}){
    if(window.SanPaidApi?.request){
      const activeToken=token||getToken();
      return window.SanPaidApi.request(path,{...opt,token:activeToken||undefined});
    }
    const headers=new Headers(opt.headers||{});
    const activeToken=token||getToken();
    if(activeToken)headers.set('Authorization',`Bearer ${activeToken}`);
    if(opt.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    const response=await fetch(path,{...opt,headers,credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const error=new Error(data.message||data.error||friendlyError(response.status));
      error.status=response.status;
      throw error;
    }
    return data;
  }

  function shell(){
    let root=$('#sihJudgeShell');
    if(root)return root;
    root=document.createElement('section');
    root.id='sihJudgeShell';
    root.className='judge-hidden';
    root.innerHTML=`<header class="judge-top">
      <div><div class="brand">San<span>Paid</span></div><small>Authorized Administration Workspace</small></div>
      <div class="judge-top-actions">
        <span id="judgeHealth" class="judge-live">Checking service…</span>
        <button class="btn ghost small" id="judgeClose" type="button" aria-label="Close administration workspace">✕</button>
      </div>
    </header><main class="judge-main" id="judgeContent"></main>`;
    document.body.appendChild(root);
    $('#judgeClose',root).addEventListener('click',close);
    return root;
  }

  async function health(){
    const el=$('#judgeHealth',shell());
    try{
      const result=await api('/api/connected/health');
      el.textContent=result.ok?'● Service Online':'● Service Unavailable';
      el.classList.toggle('ok',!!result.ok);
    }catch{
      el.textContent='● Service Offline';
      el.classList.remove('ok');
    }
  }

  async function verifyAdminSession(){
    token=getToken();
    try{
      const result=await api('/api/connected/auth/me');
      if(!isAdminRole(result?.user?.role))return null;
      user=result.user;
      return user;
    }catch(error){
      if([401,403].includes(Number(error?.status)))clearToken();
      return null;
    }
  }

  function renderAccessRequired(){
    const c=$('#judgeContent',shell());
    c.innerHTML=`<section class="judge-login judge-card" aria-labelledby="adminAccessTitle">
      <span class="judge-badge">AUTHORIZED ACCESS REQUIRED</span>
      <h2 id="adminAccessTitle" style="margin-top:12px">Administration session required</h2>
      <p>Cooperative and Federation workspaces open only through the unified role-based sign-in flow. No embedded or automatic administrative credentials are used.</p>
      <div class="judge-actions">
        <button type="button" class="btn primary" id="adminAccessLogin">Open Role Access</button>
        <button type="button" class="btn secondary" id="adminAccessClose">Return to Public Site</button>
      </div>
    </section>`;
    $('#adminAccessClose',c)?.addEventListener('click',close);
    $('#adminAccessLogin',c)?.addEventListener('click',()=>{
      close();
      const existing=String(window.SanPaidAuth?.getRole?.()||'').toUpperCase();
      const role=isAdminRole(existing)?existing:'COOPERATIVE_ADMIN';
      window.SanPaidAuth?.open?.(role,'login');
    });
  }

  async function open(){
    const root=shell();
    root.classList.remove('judge-hidden');
    document.body.style.overflow='hidden';
    await health();
    if(!await verifyAdminSession()){
      renderAccessRequired();
      return false;
    }
    renderDashboard();
    return true;
  }

  function close(){
    const root=shell();
    root.classList.add('judge-hidden');
    document.body.style.overflow='';
    document.body.classList.remove('judge-presentation','admin-mobile-nav-open');
    $('#judgeContent',root)?.classList.remove('coop-nav-open','fed-nav-open');
  }

  async function logout(){
    if(window.SanPaidAuth?.logout){
      await window.SanPaidAuth.logout();
      return;
    }
    try{await api('/api/connected/auth/logout',{method:'POST',body:'{}'});}catch{}
    clearToken();
    user=null;
    close();
  }

  function renderDashboard(){
    const c=$('#judgeContent',shell());
    const role=String(user?.role||'').toUpperCase();
    const cooperative=role==='COOPERATIVE_ADMIN';
    c.innerHTML=`<section class="judge-hero">
      <span class="judge-badge">${cooperative?'AUTHORIZED COOPERATIVE OPERATIONS':'FEDERATION OVERSIGHT'}</span>
      <h1>${cooperative?'Cooperative Administration':'Federation Oversight & Coordination'}</h1>
      <p>${cooperative?'Verified workforce, services, complaints, capacity and local outcomes in one governed workspace.':'Regional cooperative visibility, capacity coordination, escalation oversight and workforce planning in one governed workspace.'}</p>
      <div class="judge-actions"><button class="btn danger small" id="judgeLogout" type="button">Logout</button></div>
    </section>
    <div class="judge-tabs" aria-label="Administration workspace sections">
      ${TABS.map(([id,label],i)=>`<button type="button" class="judge-tab ${i===0?'active':''}" data-judge-tab="${id}">${esc(label)}</button>`).join('')}
    </div>
    ${TABS.map(([id],i)=>`<section class="judge-section ${i===0?'active':''}" id="judge-${id}"><div class="judge-card">Loading…</div></section>`).join('')}`;

    $('#judgeLogout',c)?.addEventListener('click',logout);
    c.querySelectorAll('[data-judge-tab]').forEach(button=>button.addEventListener('click',()=>switchTab(button.dataset.judgeTab)));
    loadTab('golden');
    queueMicrotask(()=>window.dispatchEvent(new CustomEvent('sanpaid:admin-shell-ready',{detail:{role}})));
  }

  function switchTab(id){
    const c=$('#judgeContent',shell());
    if(!c)return;
    c.querySelectorAll('.judge-tab').forEach(x=>x.classList.toggle('active',x.dataset.judgeTab===id));
    c.querySelectorAll('.judge-section').forEach(x=>x.classList.toggle('active',x.id===`judge-${id}`));
    loadTab(id);
  }

  async function loadTab(id){
    const loaders={
      golden:loadSystemStatus,
      matching:loadMatching,
      trust:loadTrust,
      overview:loadOverview,
      capacity:loadCapacity,
      complaint:loadComplaint,
      planning:loadPlanning,
      research:loadResearch,
      security:loadSecurity,
      welfare:loadWelfare,
      control:loadControl
    };
    return loaders[id]?.();
  }

  function errorBox(root,error,retry){
    if(!root)return;
    root.innerHTML=`<div class="judge-error">${esc(error?.message||friendlyError(error?.status||500))} <button class="btn secondary small" type="button" data-retry>Retry</button></div>`;
    root.querySelector('[data-retry]')?.addEventListener('click',retry);
  }

  async function loadSystemStatus(){
    const root=$('#judge-golden');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Checking connected service readiness…</div>';
    try{
      const d=await api('/api/connected/judge/readiness');
      const checks=d.checks||{};
      const labels={customerActive:'Customer Account',workerAReady:'Worker Availability A',workerBReady:'Worker Availability B',cooperativeAdminActive:'Cooperative Administration',federationAdminActive:'Federation Oversight',unverifiedProofReady:'Verification Boundary',noStalePendingOffers:'Offer State Integrity'};
      root.innerHTML=`<div class="judge-card">
        <span class="judge-badge ${d.ok?'':'demo'}">${d.ok?'CONNECTED SERVICES READY':'SERVICE ATTENTION REQUIRED'}</span>
        <h2 style="margin-top:10px">Runtime readiness</h2>
        <p>These checks come from the connected backend state. They do not represent a production certification or government approval.</p>
        <div class="judge-checks">${Object.entries(checks).map(([key,value])=>`<div class="judge-check ${value?'ok':'no'}">${esc(labels[key]||human(key))}</div>`).join('')}</div>
      </div>`;
    }catch(error){errorBox(root,error,loadSystemStatus);}
  }

  async function loadOverview(){
    const root=$('#judge-overview');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading operational data…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const m=d.metrics||{};
      root.innerHTML=`<div class="judge-grid" style="margin-top:12px">
        <div class="judge-card judge-kpi"><span>Registered Workers</span><b>${Number(m.totalWorkers||0)}</b><p>Connected records</p></div>
        <div class="judge-card judge-kpi"><span>Verified Workers</span><b>${Number(m.verifiedWorkers||0)}</b><p>Eligibility source</p></div>
        <div class="judge-card judge-kpi"><span>Available Workforce</span><b>${Number(m.availableWorkers||0)}</b><p>Current availability</p></div>
        <div class="judge-card judge-kpi"><span>Open Complaints</span><b>${Number(m.openComplaints||0)}</b><p>SLA-governed</p></div>
      </div>
      <div class="judge-grid two" style="margin-top:12px">
        <div class="judge-card"><h3>Cooperative Network</h3><div class="judge-coop-list">${(d.cooperatives||[]).map(x=>`<div class="judge-row"><span><b>${esc(x.name)}</b><br><small>${esc(x.city||'—')}</small></span><span>${Number(x.available||0)} available / ${Number(x.workers||0)} workers</span></div>`).join('')||'<p>No cooperative records are available.</p>'}</div></div>
        <div class="judge-card"><h3>Operational Snapshot</h3><div class="judge-row"><span>Active bookings</span><b>${Number(m.activeBookings||0)}</b></div><div class="judge-row"><span>SLA breached</span><b>${Number(m.slaBreached||0)}</b></div><div class="judge-row"><span>Recorded payments</span><b>₹${Number(m.recordedPayments||0).toLocaleString('en-IN')}</b></div></div>
      </div>`;
    }catch(error){errorBox(root,error,loadOverview);}
  }

  async function loadMatching(){
    const root=$('#judge-matching');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading assignment policy evidence…</div>';
    try{
      const latest=await api('/api/connected/judge/latest-demo-booking');
      if(!latest.booking){
        root.innerHTML='<div class="judge-card"><h3>No active booking available</h3><p>Create a customer booking first, then return here to inspect eligibility and ranking.</p></div>';
        return;
      }
      const d=await api(`/api/connected/judge/match/${latest.booking.id}`);
      const checkLabel=k=>({identityVerified:'Identity Verified',skillVerified:'Skill Verified',available:'Available',withinRadius:'Within Service Radius',documentsValid:'Documents Valid',noScheduleConflict:'Schedule Compatible'}[k]||human(k));
      const eligible=(d.eligible||[]).slice(0,3).map(x=>`<div class="judge-card"><div class="judge-row"><span><span class="judge-badge">#${x.rank||'—'} ELIGIBLE</span><h3 style="margin-top:8px">${esc(x.name)}</h3><small>${esc(x.cooperative||'Cooperative')} · ${Number(x.distance||0)} km</small></span><b>${x.score??'—'}%</b></div><div class="judge-checks">${Object.entries(x.checks||{}).map(([k,v])=>`<div class="judge-check ${v?'ok':'no'}">${esc(checkLabel(k))}</div>`).join('')}</div></div>`).join('');
      root.innerHTML=`<div class="judge-card"><span class="judge-badge">ELIGIBILITY FIRST</span><h2 style="margin-top:10px">${esc(d.booking?.bookingCode||'Booking')} · ${esc(d.booking?.service||'Service')}</h2><p>Only eligible workers proceed to explainable ranking. Worker acceptance remains a separate choice.</p></div><div class="judge-grid two" style="margin-top:12px">${eligible||'<div class="judge-card">No eligible candidates currently meet the configured policy.</div>'}</div>`;
    }catch(error){errorBox(root,error,loadMatching);}
  }

  function loadTrust(){
    const root=$('#judge-trust');
    if(!root)return;
    root.innerHTML=`<div class="judge-grid two">
      <div class="judge-card"><span class="judge-badge">SERVICE-START TRUST</span><h2 style="margin-top:10px">Two independent checks before service starts</h2><div class="trust-flow"><div><b>1</b><span>Worker arrives</span></div><div><b>2</b><span>Identity check</span></div><div><b>3</b><span>Booking-specific customer confirmation</span></div><div><b>4</b><span>Backend unlocks service start</span></div></div><div class="judge-note">Current identity/liveness verification remains a controlled capability; production KYC is not claimed.</div></div>
      <div class="judge-card"><span class="judge-badge">CONTINUOUS WORKER TRUST</span><h3 style="margin-top:10px">Identity, skill and document state remain separate</h3><div class="verification-cycle"><span>Registration</span><span>Identity</span><span>Skill</span><span>Documents</span><span>Availability</span><span>Service History</span><span>Ratings / Complaints</span><span>Re-verification</span></div></div>
    </div>`;
  }

  async function loadCapacity(){
    const root=$('#judge-capacity');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading capacity records…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const rows=d.capacityRequests||[];
      root.innerHTML=`<div class="judge-card"><span class="judge-badge">CROSS-COOPERATIVE CAPACITY</span><h2 style="margin-top:10px">Governed capacity exchange</h2><p>Capacity may be requested across cooperatives, but worker consent and authorized approval remain required.</p></div><div class="judge-card" style="margin-top:12px"><h3>Recent capacity records</h3>${rows.length?rows.slice(0,8).map(x=>`<div class="judge-row"><span><b>${esc(x.requestCode||`Request ${x.id}`)}</b><br><small>${esc(x.requestingCooperative||x.requesting_cooperative||'Requesting cooperative')} → ${esc(x.providingCooperative||x.providing_cooperative||'Provider cooperative')}</small></span><b>${esc(human(x.status))}</b></div>`).join(''):'<p>No capacity requests are currently recorded.</p>'}</div>`;
    }catch(error){errorBox(root,error,loadCapacity);}
  }

  async function loadComplaint(){
    const root=$('#judge-complaint');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading complaint and SLA records…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const complaints=d.complaints||[];
      root.innerHTML=`<div class="judge-card"><span class="judge-badge">GRIEVANCE & SLA OVERSIGHT</span><h2 style="margin-top:10px">Complaint escalation remains traceable</h2><p>L1 support, L2 cooperative review and L3 federation oversight remain visible in the complaint lifecycle.</p></div><div class="judge-card" style="margin-top:12px"><h3>Open complaint records</h3>${complaints.length?complaints.slice(0,8).map(x=>`<div class="judge-row"><span><b>${esc(x.ticketNumber||x.ticket_number||`Complaint ${x.id}`)}</b><br><small>${esc(x.category||'Service complaint')}</small></span><b>L${Number(x.escalationLevel||x.escalation_level||1)} · ${esc(human(x.status))}</b></div>`).join(''):'<p>No open complaints are currently recorded.</p>'}</div>`;
    }catch(error){errorBox(root,error,loadComplaint);}
  }

  async function loadPlanning(){
    const root=$('#judge-planning');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading planning data…</div>';
    try{
      const d=await api('/api/connected/judge/planning');
      const gap=Number(d.capacityGap||0);
      root.innerHTML=`<div class="judge-card"><span class="judge-badge">ADVISORY PLANNING</span><h2 style="margin-top:10px">Demand → eligible capacity → governed action</h2><p>Planning output remains advisory and confidence-aware. Human roles retain the final decision.</p></div><div class="judge-grid" style="margin-top:12px"><div class="judge-card judge-kpi"><span>Observed Demand</span><b>${Number(d.historicalDemand30d||0)}</b><p>Recent booking history</p></div><div class="judge-card judge-kpi"><span>Expected Demand</span><b>${Number(d.expectedDemand||0)}</b><p>${esc(d.forecastMethod||'Baseline')}</p></div><div class="judge-card judge-kpi"><span>Eligible Capacity</span><b>${Number(d.eligibleCapacity||0)}</b><p>Verified + skilled + available</p></div><div class="judge-card judge-kpi"><span>Capacity Gap</span><b>${gap}</b><p>Confidence: ${esc(d.confidence||'—')}</p></div></div>`;
    }catch(error){errorBox(root,error,loadPlanning);}
  }

  function loadResearch(){
    const root=$('#judge-research');
    if(!root)return;
    root.innerHTML=`<div class="judge-grid two"><div class="judge-card"><span class="judge-badge">SYSTEM ARCHITECTURE</span><h2 style="margin-top:10px">Separated responsibilities</h2><div class="architecture-stack"><div><b>Users</b><span>Customer · Worker · Cooperative · Federation</span></div><i>↓</i><div><b>Access</b><span>Authentication · role authorization · validation</span></div><i>↓</i><div><b>Core Services</b><span>Booking · matching · trust · complaint · payment · capacity</span></div><i>↓</i><div><b>Data</b><span>PostgreSQL · audit history · integration-ready storage</span></div></div></div><div class="judge-card"><span class="judge-badge">RESEARCH FOUNDATION</span><h3 style="margin-top:10px">Evidence informs product rules</h3><div class="research-grid"><a href="https://owasp.org/API-Security/" target="_blank" rel="noopener"><b>OWASP API Security</b><span>Authorization and API design guidance.</span></a><a href="https://www.postgresql.org/docs/" target="_blank" rel="noopener"><b>PostgreSQL</b><span>Transactions and reliable persistence.</span></a><a href="https://developers.google.com/maps/documentation/routes" target="_blank" rel="noopener"><b>Maps / Routes</b><span>Future route and ETA integration.</span></a></div></div></div>`;
  }

  function loadSecurity(){
    const root=$('#judge-security');
    if(!root)return;
    root.innerHTML=`<div class="judge-grid two"><div class="judge-card"><span class="judge-badge">SECURITY CONTROLS</span><h2 style="margin-top:10px">Connected workflow protections</h2><div class="judge-checks">${['HTTPS/TLS transport','Role-based access','Server-side authorization','Password hashing','Session expiry','Transactional workflow updates','Audit history','One-time service verification tokens'].map(x=>`<div class="judge-check ok">${esc(x)}</div>`).join('')}</div><div class="judge-note">This security architecture is not presented as an external compliance certification.</div></div><div class="judge-card"><span class="judge-badge">PRIVACY BY DESIGN</span><h3 style="margin-top:10px">Purpose-based access and data minimization</h3><div class="judge-row"><span>Worker visibility</span><b>Restricted by role and lifecycle</b></div><div class="judge-row"><span>Customer records</span><b>Booking-scoped access</b></div><div class="judge-row"><span>Administrative data</span><b>Authorized scope only</b></div><div class="judge-note">No legal certification is claimed.</div></div></div>`;
  }

  function loadWelfare(){
    const root=$('#judge-welfare');
    if(!root)return;
    root.innerHTML=`<div class="judge-card"><span class="judge-badge">WORKFORCE DEVELOPMENT</span><h2 style="margin-top:10px">Verified work history can support future worker development</h2><div class="welfare-grid"><div><b>Work History</b><span>Recorded completed service history.</span><em>Connected foundation</em></div><div><b>Training Recommendations</b><span>Human-reviewed workforce development.</span><em>Human-reviewed</em></div><div><b>Certificate Renewal</b><span>Expiry-aware re-verification workflow.</span><em>Future integration</em></div><div><b>Welfare / Insurance</b><span>Authorized integration only.</span><em>Future integration</em></div></div><div class="judge-note">No live welfare, insurance or government-scheme integration is claimed.</div></div>`;
  }

  function loadControl(){
    const root=$('#judge-control');
    if(!root)return;
    root.innerHTML=`<div class="judge-card"><span class="judge-badge">SYSTEM CONTROLS</span><h2 style="margin-top:10px">Operational controls are intentionally limited</h2><p>Destructive reset controls are not exposed in the government-handover administration workspace. Dataset maintenance remains an internal development responsibility.</p></div>`;
  }

  function install(){
    window.SanPaidJudgeMode={open,close,switchTab};
    window.SanPaidRuntimeStatus=Object.assign({},window.SanPaidRuntimeStatus,{legacyJudgeLogin:'RETIRED',administrationAuth:'UNIFIED_ROLE_ACCESS'});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();

```


---

## FILE: `selector-mode.js`

```javascript
(() => {
  'use strict';

  const STEP_META = [
    ['problem','Problem'],
    ['difference','Difference'],
    ['matching','Fair Match'],
    ['choice','Worker Choice'],
    ['trust','Trust'],
    ['governance','Governance'],
    ['capacity','Capacity'],
    ['planning','Planning'],
    ['research','Research'],
    ['impact','Impact']
  ];

  let shell = null;
  let current = 0;
  let returnFocus = null;
  let returnScrollY = 0;
  let autoTimer = null;
  let historyOwned = false;
  let suppressRouteWrite = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  function stepProblem() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 1 · THE PROBLEM</span>
        <h1>Skilled workers exist. Trusted coordination is missing.</h1>
        <p>Customers need trust, workers need fair access to demand, and cooperatives need one connected operational view.</p>
      </div>
      <div class="selector-card-grid five">
        <article class="selector-card"><b>Local Discovery</b><p>Trusted nearby skilled workers are hard to discover.</p></article>
        <article class="selector-card"><b>Pricing Transparency</b><p>Similar service jobs can receive different quotes.</p></article>
        <article class="selector-card"><b>Training & Awareness</b><p>Digital adoption needs guided support and skill readiness.</p></article>
        <article class="selector-card"><b>Worker Welfare</b><p>Insurance and welfare visibility remain uneven.</p></article>
        <article class="selector-card"><b>Trust & Safety</b><p>In-home service needs identity assurance at service start.</p></article>
      </div>
      <div class="selector-callout"><b>Skilled workers already exist. The missing layer is trusted digital coordination.</b></div>`;
  }

  function stepDifference() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 2 · TWO CORE USPs</span>
        <h1>Serve today. Prepare tomorrow.</h1>
        <p>SanPaid is not another worker-listing app. Two connected mechanisms strengthen the cooperative network behind every service.</p>
      </div>
      <div class="selector-compare">
        <article class="selector-card strong-card">
          <span class="selector-mini-label">USP 01 · SERVE TODAY</span>
          <h2>Cooperative Capacity Exchange</h2>
          <div class="selector-chain compact"><span>Local Gap</span><i>→</i><span>Nearby Cooperative</span><i>→</i><span>Worker Consent</span><i>→</i><span>Authorized Service</span></div>
          <p>Use nearby cooperative capacity when local supply is insufficient—without automatic worker transfer.</p>
        </article>
        <article class="selector-card strong-card">
          <span class="selector-mini-label">USP 02 · PREPARE TOMORROW</span>
          <h2>Demand-to-Workforce Loop</h2>
          <div class="selector-chain compact"><span>Demand Signals</span><i>→</i><span>Capacity / Skill Gap</span><i>→</i><span>Human Review</span><i>→</i><span>Train / Onboard / Exchange</span></div>
          <p>Repeated shortages become evidence for workforce readiness instead of disappearing as isolated failures.</p>
        </article>
      </div>
      <div class="selector-callout"><b>Cooperative-owned coordination + human-controlled workforce planning — not forced allocation.</b></div>`;
  }

  function stepMatching() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 3 · ELIGIBILITY-FIRST FAIR MATCHING</span>
        <h1>Closer does not mean eligible.</h1>
        <p>Trust and eligibility are checked before ranking. A closer unverified worker cannot outrank a verified eligible worker.</p>
      </div>
      <div class="selector-proof-pair selector-focus-proof">
        <article class="selector-person excluded">
          <span class="selector-status bad">NOT ELIGIBLE</span>
          <h2>Rahul Deshmukh</h2><strong>1.8 KM</strong><p>Verification Pending</p>
        </article>
        <div class="selector-vs">VS</div>
        <article class="selector-person eligible">
          <span class="selector-status good">ELIGIBLE</span>
          <h2>Amit</h2><strong>2.3 KM</strong>
          <div class="selector-check-list"><span>✓ Verified</span><span>✓ Correct Skill</span><span>✓ Available</span><span>✓ Within Radius</span></div>
        </article>
      </div>
      <div class="selector-flow-three"><span>ELIGIBILITY</span><i>→</i><span>FAIR RANKING</span><i>→</i><span>WORKER CHOICE</span></div>
      <details class="selector-details"><summary>See technical matching detail</summary><div class="selector-two-col"><div><b>Eligibility</b><p>Identity · Skill · Availability · Documents · Radius · Schedule</p></div><div><b>Ranking</b><p>Distance · Rating · Workload · Recent opportunity · Schedule fit</p></div></div></details>
      <div class="selector-callout selector-callout-strong"><b>CLOSER DOES NOT MEAN ELIGIBLE.</b></div>`;
  }

  function stepChoice() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 4 · WORKER CHOICE + FALLBACK</span>
        <h1>Worker choice without breaking the customer journey.</h1>
        <p>If Worker A declines, the same booking continues to the next eligible worker. No new customer booking is created.</p>
      </div>
      <div class="selector-handoff">
        <article><b>Customer Request</b><span>Original booking</span></article><i>→</i>
        <article><b>Worker A</b><span>Eligible · Offered</span><strong class="decline">DECLINES</strong></article><i>→</i>
        <article><b>Same Booking Continues</b><span>Request + voice context preserved</span></article><i>→</i>
        <article><b>Worker B</b><span>Next eligible offer</span><strong class="accept">ACCEPTS</strong></article>
      </div>
      <div class="selector-proof-lines"><span>✓ Same Booking ID</span><span>✓ Same Customer Request</span><span>✓ Same Voice Context</span><span>✓ New Eligible Worker Offer</span></div>
      <div class="selector-callout"><b>Workers keep choice without breaking the customer journey.</b></div>
      <div class="selector-inline-actions"><button class="btn secondary" type="button" data-selector-action="connected">Run Connected Proof</button></div>`;
  }

  function stepTrust() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 5 · TRUSTED SERVICE START</span>
        <h1>Service starts only after dual confirmation.</h1>
        <p>The assigned worker must pass the service-start identity gate and the customer must confirm before work begins.</p>
      </div>
      <div class="selector-trust-flow"><span>Worker Arrives</span><i>→</i><span>Booking Validation</span><i>→</i><span>Sandbox Identity Check</span><i>→</i><span>One-Time Verification</span><i>→</i><span>Customer Confirms</span><i>→</i><span class="enabled">SERVICE START</span></div>
      <div class="selector-lock-rule"><b>IDENTITY VERIFIED</b><strong>+</strong><b>CUSTOMER CONFIRMED</b><strong>=</strong><b>SERVICE START</b></div>
      <div class="selector-truth-note"><span class="selector-status demo">CONTROLLED WORKFLOW</span><p>Without both checks, service cannot start. Current identity/liveness proof is sandboxed; production biometric KYC is not claimed.</p></div>`;
  }

  function stepGovernance() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 6 · COOPERATIVE COMMAND CENTER</span>
        <h1>From scattered records to one command center.</h1>
        <p>The cooperative needs visibility into trust, service delivery, complaints, capacity and operations — not only bookings.</p>
      </div>
      <div class="selector-card-grid three compact-cards">
        <article class="selector-card"><b>Verified Workers</b><p>Eligibility and verification visibility.</p></article>
        <article class="selector-card"><b>Available Workers</b><p>Who can receive eligible offers now.</p></article>
        <article class="selector-card"><b>Active Services</b><p>Current booking and service lifecycle.</p></article>
        <article class="selector-card"><b>Complaints / SLA</b><p>Support workload and governed escalation.</p></article>
        <article class="selector-card"><b>Capacity Gap</b><p>Expected demand versus eligible capacity.</p></article>
        <article class="selector-card"><b>Payments / Operations</b><p>Traceable service transaction records.</p></article>
      </div>
      <div class="selector-truth-note"><span class="selector-status good">CONNECTED PROOF</span><p>Interactive Command Center values are backend-derived rather than random dashboard numbers.</p></div>`;
  }

  function stepCapacity() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 7 · CROSS-COOPERATIVE CAPACITY</span>
        <h1>Share capacity without transferring workers automatically.</h1>
        <p>A cooperative shortage can create a governed nearby-capacity request while provider approval and worker consent remain required.</p>
      </div>
      <div class="selector-scenario-badge">READ-ONLY GOVERNANCE SCENARIO</div>
      <div class="selector-capacity-flow">
        <article><b>Karad Cooperative</b><span>Demand 42</span><span>Eligible Capacity 29</span><strong>Gap 13</strong></article>
        <i>→</i><article><b>Request Capacity</b><span>Governed request</span></article>
        <i>→</i><article><b>Satara Approval</b><span>Available Capacity 8</span></article>
        <i>→</i><article><b>Worker Offer</b><span>CONSENT REQUIRED</span><strong>Accept / Decline</strong></article>
      </div>
      <div class="selector-callout selector-callout-strong"><b>CAPACITY IS SHARED. WORKERS ARE NOT TRANSFERRED AUTOMATICALLY.</b></div>`;
  }

  function stepPlanning() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 8 · DEMAND & SKILL PLANNING</span>
        <h1>AI advises. Cooperative decides.</h1>
        <p>Historical demand and eligible capacity produce confidence-aware operational recommendations — not forced allocation or automatic certification.</p>
      </div>
      <div class="selector-planning-flow"><span>Historical Demand</span><i>→</i><span>Expected Demand + Confidence</span><i>→</i><span>Eligible Capacity</span><i>→</i><span>Capacity / Skill Gap</span><i>→</i><span>Recommended Action</span></div>
      <div class="selector-card-grid three">
        <article class="selector-card"><b>Request Nearby Capacity</b><p>Use governed cross-cooperative support when local capacity is short.</p></article>
        <article class="selector-card"><b>Review Skill Gap</b><p>Identify which verified skills are under-supplied for expected demand.</p></article>
        <article class="selector-card"><b>Recommend Training</b><p>Create an advisory recommendation for cooperative review and approval.</p></article>
      </div>
      <details class="selector-details"><summary>See training decision flow</summary><div class="selector-training-flow"><span>Demand Gap</span><i>→</i><span>Skill Gap</span><i>→</i><span>Training Recommendation</span><i>→</i><span>Human Approval</span><i>→</i><span>Future Skill Verification</span></div></details>
      <div class="selector-callout"><b>AI can recommend. It cannot automatically certify a worker.</b></div>`;
  }

  function stepResearch() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 9 · RESEARCH, SECURITY & SCALE</span>
        <h1>Research becomes system decisions.</h1>
        <p>Six research foundations explain the design without turning the selector journey into a technical report.</p>
      </div>
      <div class="selector-research-grid selector-research-compact">
        <article><b>OWASP API Security</b><p>→ Protected role actions</p></article>
        <article><b>PostgreSQL</b><p>→ Transaction-safe persistent workflow</p></article>
        <article><b>Maps / Geo</b><p>→ Radius and route architecture</p></article>
        <article><b>Person–Job Fit</b><p>→ Eligibility before ranking</p></article>
        <article><b>Cooperative Research</b><p>→ Cooperative/federation governance</p></article>
        <article><b>Workforce Planning</b><p>→ Demand-capacity-skill workflow</p></article>
      </div>
      <div class="selector-detail-actions">
        <details class="selector-details"><summary>View Architecture</summary><div class="selector-architecture"><div><span>Customer · Worker · Cooperative · Federation</span><i>↓</i><span>Auth · Booking · Matching · Trust · Capacity · Planning</span><i>↓</i><span>PostgreSQL · Audit History</span><i>↓</i><span>Maps · Payments · OTP · Welfare</span></div></div></details>
        <details class="selector-details"><summary>View Security Principles</summary><div class="selector-chip-row security"><span>Role-Based Access</span><span>Server Authorization</span><span>Session Protection</span><span>Password Hashing</span><span>Transaction Protection</span><span>Audit Logs</span><span>One-Time Tokens</span><span>Token Expiry</span><span>Privacy-by-Design</span></div><p class="selector-roadmap">Production roadmap includes WAF, DDoS protection, caching, replicas, backup/DR and monitoring where not already deployed.</p></details>
      </div>
      <div class="selector-callout"><b>Research → architecture decision → visible platform evidence.</b></div>`;
  }

  function stepImpact() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 10 · IMPACT + FINAL MESSAGE</span>
        <h1>One network for trusted services and stronger cooperatives.</h1>
        <p>SanPaid connects customer demand, verified cooperative workers, fair opportunity, trusted service delivery and workforce planning.</p>
      </div>
      <div class="selector-card-grid four impact">
        <article class="selector-card"><b>Customer</b><p>→ Verified local access + transparent billing</p></article>
        <article class="selector-card"><b>Worker</b><p>→ Better access to local work opportunities</p></article>
        <article class="selector-card"><b>Cooperative</b><p>→ Traceable operations + visible skill gaps</p></article>
        <article class="selector-card"><b>Federation</b><p>→ Capacity coordination + workforce planning</p></article>
      </div>
      <div class="selector-planning-flow"><span>Baseline</span><i>→</i><span>Pilot</span><i>→</i><span>Measure KPIs</span><i>→</i><span>Validate Impact</span><i>→</i><span>Scale</span></div>
      <details class="selector-details selector-truth-details"><summary>Implementation Status — implemented, controlled and future capabilities</summary>
        <div class="selector-truth-matrix">
          <div><b>Connected Customer → Worker</b><span class="selector-status good">IMPLEMENTED</span></div>
          <div><b>Fair Matching</b><span class="selector-status good">IMPLEMENTED</span></div>
          <div><b>Worker Accept / Decline</b><span class="selector-status good">IMPLEMENTED</span></div>
          <div><b>Dual Verification</b><span class="selector-status demo">CONTROLLED WORKFLOW</span></div>
          <div><b>Payment</b><span class="selector-status demo">SANDBOX</span></div>
          <div><b>SLA Time Advancement</b><span class="selector-status demo">CONTROLLED SIMULATION</span></div>
          <div><b>Insurance / ESIC</b><span class="selector-status future">FUTURE READY</span></div>
          <div><b>Production Biometric KYC</b><span class="selector-status future">FUTURE</span></div>
        </div>
      </details>
      <div class="selector-final-message"><b>Why this solution matters for PS 26089</b><p>SanPaid strengthens cooperative verification, worker opportunity, service trust, complaint governance, capacity coordination and workforce planning instead of replacing cooperatives.</p></div>
      <div class="selector-final-actions">
        <button class="btn primary" type="button" data-selector-action="connected">▶ Open Platform</button>
        <button class="btn secondary" type="button" data-selector-action="judge">🏆 Explore Technical & Research Proof</button>
        <button class="btn ghost" type="button" data-selector-action="home">Return to Home</button>
      </div>`;
  }

  const STEP_RENDERERS = [
    stepProblem, stepDifference, stepMatching, stepChoice, stepTrust,
    stepGovernance, stepCapacity, stepPlanning, stepResearch, stepImpact
  ];

  function injectReleaseStyles() {
    if (document.getElementById('selectorReleaseStyles')) return;
    const style = document.createElement('style');
    style.id = 'selectorReleaseStyles';
    style.textContent = `
      .selector-mode{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .selector-step-head{max-width:860px}.selector-step-head p{max-width:780px}
      .selector-callout-strong{letter-spacing:.01em}.selector-callout-strong b{font-size:clamp(17px,2.4vw,23px)}
      .selector-focus-proof{max-width:940px}.selector-inline-actions,.selector-final-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}
      .selector-final-actions .btn{min-height:48px}.selector-detail-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.selector-detail-actions .selector-details{margin-top:0}
      .selector-research-compact article p{font-weight:700;color:#47627e}.selector-truth-details{margin-top:16px}
      .selector-notice{position:fixed;right:16px;bottom:82px;z-index:9;max-width:420px;padding:12px 14px;border-radius:12px;background:#0f2340;color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.18);font-size:13px;line-height:1.5}
      .selector-progress button[aria-current="step"]{box-shadow:inset 0 0 0 2px rgba(11,25,48,.12)}
      .selector-mode button:focus-visible,.selector-mode summary:focus-visible{outline:3px solid #6ba7ff;outline-offset:3px}
      @media(max-width:720px){.selector-detail-actions{grid-template-columns:1fr}.selector-final-actions{display:grid}.selector-final-actions .btn{width:100%}.selector-notice{left:12px;right:12px;bottom:154px;max-width:none}}
      @media(prefers-reduced-motion:reduce){.selector-mode *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function ensureShell() {
    if (shell) return shell;
    injectReleaseStyles();
    shell = document.createElement('section');
    shell.id = 'selectorModeShell';
    shell.className = 'selector-mode hidden';
    shell.setAttribute('aria-label','SanPaid SIH platform walkthrough');
    shell.innerHTML = `
      <header class="selector-top">
        <div><div class="brand">San<span>Paid</span></div><small>3-Minute SIH Platform Walkthrough · PS 26089</small></div>
        <div class="selector-top-actions"><span class="selector-readonly">READ-ONLY WALKTHROUGH</span><button type="button" class="selector-icon-btn" id="selectorClose" aria-label="Close walkthrough">✕</button></div>
      </header>
      <div class="selector-progress-wrap"><div class="selector-mobile-progress" id="selectorMobileProgress"></div><div class="selector-progress" id="selectorProgress"></div></div>
      <main class="selector-main" id="selectorContent" tabindex="-1" aria-live="polite" aria-atomic="true"></main>
      <div id="selectorNotice" class="selector-notice hidden" role="status" aria-live="polite"></div>
      <footer class="selector-controls">
        <button type="button" class="btn secondary" id="selectorPrev">← Previous</button>
        <button type="button" class="btn ghost" id="selectorAuto" aria-pressed="false">▶ Auto Walkthrough</button>
        <div class="selector-control-spacer"></div>
        <button type="button" class="btn primary" id="selectorNext">Next →</button>
      </footer>`;
    document.body.appendChild(shell);

    shell.querySelector('#selectorClose').addEventListener('click', () => close());
    shell.querySelector('#selectorPrev').addEventListener('click', () => go(current - 1, {manual:true}));
    shell.querySelector('#selectorNext').addEventListener('click', () => {
      if (current === STEP_META.length - 1) return dismissToHome();
      go(current + 1, {manual:true});
    });
    shell.querySelector('#selectorAuto').addEventListener('click', toggleAuto);

    document.addEventListener('keydown', onKeydown);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAuto(); });
    window.addEventListener('popstate', onPopState);
    return shell;
  }

  function renderProgress() {
    const progress = shell.querySelector('#selectorProgress');
    progress.innerHTML = STEP_META.map(([id,label],i) => `
      <button type="button" class="${i === current ? 'active' : i < current ? 'done' : ''}" data-selector-step="${i}" aria-label="Open step ${i+1}: ${esc(label)}" ${i === current ? 'aria-current="step"' : ''}>
        <span>${i < current ? '✓' : i + 1}</span><small>${esc(label)}</small>
      </button>`).join('');
    progress.querySelectorAll('[data-selector-step]').forEach(btn => btn.addEventListener('click', () => go(Number(btn.dataset.selectorStep), {manual:true})));
    shell.querySelector('#selectorMobileProgress').innerHTML = `<b>Step ${current + 1} of ${STEP_META.length}</b><span>${esc(STEP_META[current][1])}</span>`;
  }

  function wireStepActions() {
    shell.querySelectorAll('[data-selector-action="connected"]').forEach(btn => btn.addEventListener('click', openConnected));
    shell.querySelectorAll('[data-selector-action="judge"]').forEach(btn => btn.addEventListener('click', openJudge));
    shell.querySelectorAll('[data-selector-action="home"]').forEach(btn => btn.addEventListener('click', dismissToHome));
  }

  function render() {
    renderProgress();
    const content = shell.querySelector('#selectorContent');
    content.innerHTML = STEP_RENDERERS[current]();
    wireStepActions();
    shell.querySelector('#selectorPrev').disabled = current === 0;
    const next = shell.querySelector('#selectorNext');
    next.textContent = current === STEP_META.length - 1 ? 'Return Home' : 'Next →';
    shell.scrollTop = 0;
    const heading = content.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex','-1');
      requestAnimationFrame(() => heading.focus({preventScroll:true}));
    } else {
      requestAnimationFrame(() => content.focus({preventScroll:true}));
    }
    writeCurrentRoute();
  }

  function go(index, options = {}) {
    if (options.manual) stopAuto();
    current = Math.max(0, Math.min(STEP_META.length - 1, Number(index) || 0));
    render();
  }

  function cleanedUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('sih');
    url.searchParams.delete('step');
    if (url.hash === '#selector-demo') url.hash = '';
    return url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
  }

  function selectorUrl(stepIndex = current) {
    const url = new URL(location.href);
    url.searchParams.set('sih','selector');
    url.searchParams.set('step', String(stepIndex + 1));
    if (url.hash === '#selector-demo') url.hash = '';
    return url.pathname + '?' + url.searchParams.toString() + (url.hash ? url.hash : '');
  }

  function writeCurrentRoute() {
    if (suppressRouteWrite || !shell || shell.classList.contains('hidden')) return;
    const state = historyOwned ? {...(history.state || {}), sanpaidSelector:true} : history.state;
    try { history.replaceState(state, '', selectorUrl(current)); } catch {}
  }

  function open(index = 0, options = {}) {
    ensureShell();
    const alreadyOpen = !shell.classList.contains('hidden');
    if (!alreadyOpen) {
      returnFocus = document.activeElement;
      returnScrollY = window.scrollY;
    }
    current = Math.max(0, Math.min(STEP_META.length - 1, Number(index) || 0));
    shell.classList.remove('hidden');
    document.body.classList.add('selector-open');
    if (window.SanPaidLanding?.closeMobileDrawer) window.SanPaidLanding.closeMobileDrawer(false);
    else {
      const drawer=document.getElementById('mobileDrawer');
      drawer?.classList.add('hidden');
      drawer?.setAttribute('aria-hidden','true');
      document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
      document.body.classList.remove('mobile-drawer-open');
      document.getElementById('mobileDrawerScrim')?.classList.add('hidden');
    }
    document.body.style.overflow = 'hidden';

    if (!alreadyOpen && !options.fromRoute) {
      try {
        history.pushState({...(history.state || {}), sanpaidSelector:true}, '', selectorUrl(current));
        historyOwned = true;
      } catch { historyOwned = false; }
    } else if (options.fromRoute) {
      historyOwned = false;
      suppressRouteWrite = true;
    }

    render();
    suppressRouteWrite = false;
  }

  function close(options = {}) {
    stopAuto();
    if (!shell || shell.classList.contains('hidden')) return;

    if (!options.fromHistory && !options.noHistory && historyOwned && history.state?.sanpaidSelector) {
      try { history.back(); return; } catch {}
    }

    shell.classList.add('hidden');
    document.body.classList.remove('selector-open');
    document.body.style.overflow = '';
    hideNotice();

    if (!options.fromHistory && !options.keepRoute) {
      try { history.replaceState(null, '', cleanedUrl()); } catch {}
    }

    const target = returnFocus;
    returnFocus = null;
    historyOwned = false;
    if (options.restoreScroll !== false) window.scrollTo({top:returnScrollY, behavior:'auto'});
    if (target?.isConnected) setTimeout(() => target.focus(), 0);
  }

  function dismissToHome() {
    stopAuto();
    if (shell && !shell.classList.contains('hidden')) {
      shell.classList.add('hidden');
      document.body.classList.remove('selector-open');
      document.body.style.overflow = '';
      hideNotice();
    }
    try { history.replaceState(null, '', cleanedUrl() || '/'); } catch {}
    historyOwned = false;
    returnFocus = null;
    requestAnimationFrame(() => {
      document.getElementById('home')?.scrollIntoView({behavior:'auto', block:'start'});
      const homeHeading = document.querySelector('#home h1');
      if (homeHeading) {
        homeHeading.setAttribute('tabindex','-1');
        homeHeading.focus({preventScroll:true});
      }
    });
  }

  function onPopState(event) {
    if (!shell || shell.classList.contains('hidden')) return;
    if (event.state?.sanpaidSelector) return;
    close({fromHistory:true, keepRoute:true});
  }

  function showNotice(message) {
    const notice = shell?.querySelector('#selectorNotice');
    if (!notice) return;
    notice.textContent = message;
    notice.classList.remove('hidden');
    clearTimeout(showNotice.timer);
    showNotice.timer = setTimeout(hideNotice, 6000);
  }

  function hideNotice() {
    clearTimeout(showNotice.timer);
    const notice = shell?.querySelector('#selectorNotice');
    notice?.classList.add('hidden');
  }

  async function openConnected() {
    stopAuto();
    if (!window.ConnectedSanPaid?.open) {
      showNotice('Interactive proof is starting. The guided SIH overview is available now. Please retry in a moment.');
      return;
    }
    if (window.SanPaidReadiness?.require && !(await window.SanPaidReadiness.require())) return;
    close({noHistory:true});
    window.ConnectedSanPaid.open();
  }

  function openJudge() {
    stopAuto();
    if (!window.SanPaidJudgeMode?.open) {
      showNotice('Technical proof is starting. The guided SIH overview remains available now. Please retry in a moment.');
      return;
    }
    close({noHistory:true});
    window.SanPaidJudgeMode.open();
  }

  function stopAuto() {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    const btn = shell?.querySelector('#selectorAuto');
    if (btn) {
      btn.setAttribute('aria-pressed','false');
      btn.textContent = '▶ Auto Walkthrough';
    }
  }

  function scheduleAutoAdvance() {
    if (!autoTimer && shell && !shell.classList.contains('hidden')) {
      autoTimer = setTimeout(() => {
        autoTimer = null;
        if (document.hidden || shell.classList.contains('hidden') || current >= STEP_META.length - 1) {
          stopAuto();
          return;
        }
        current += 1;
        render();
        scheduleAutoAdvance();
      }, 11000);
    }
  }

  function toggleAuto() {
    if (autoTimer) {
      stopAuto();
      return;
    }
    const btn = shell.querySelector('#selectorAuto');
    btn.setAttribute('aria-pressed','true');
    btn.textContent = '⏸ Pause';
    scheduleAutoAdvance();
  }

  function onKeydown(event) {
    if (!shell || shell.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    const interactive = event.target.closest?.('input,textarea,select,button,summary,a');
    if (interactive) return;
    if (event.key === 'ArrowRight') go(current + 1, {manual:true});
    if (event.key === 'ArrowLeft') go(current - 1, {manual:true});
  }

  function simplifyLanding() {
    // The redesigned landing uses this section for visible trust controls.
    document.getElementById('sihJudgeModeBtn')?.remove();

    const connected = document.getElementById('connectedDemoBtn');
    if (connected && connected.closest('.hero-ctas')) connected.remove();

    document.querySelectorAll('.navlinks [data-selector-nav]').forEach(el => el.remove());

    const lowerConnected = document.querySelector('#guidedDemo #connectedDemoBtn');
    if (lowerConnected) {
      lowerConnected.textContent = 'Open Platform';
      lowerConnected.onclick = openConnected;
    }
  }

  function install() {
    ensureShell();
    simplifyLanding();

    document.querySelectorAll('[data-open-selector]').forEach(el => {
      el.addEventListener('click', () => open(Number(el.dataset.openSelector || 0)));
    });

    const params = new URLSearchParams(location.search);
    const routeSelector = params.get('sih') === 'selector';
    const hashSelector = location.hash === '#selector-demo';
    if (routeSelector || hashSelector) {
      const rawStep = Number(params.get('step') || 1);
      const start = Number.isFinite(rawStep) ? Math.max(0, Math.min(STEP_META.length - 1, rawStep - 1)) : 0;
      setTimeout(() => open(start, {fromRoute:true}), 80);
    }
  }

  window.SanPaidSelectorMode = { open, close, go };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();

```


---

## FILE: `top1-polish.js`

```javascript
(() => {
  'use strict';

  const loaded=new Set();
  let administrationLoaded=false;
  let customerWorkerLoaded=false;
  let roleShellLoaded=false;
  let enhancementsLoaded=false;
  let authLoaded=false;
  let landingPolishLoaded=false;

  function stylesheet(id,href){
    if(document.getElementById(id)||loaded.has(href))return;
    loaded.add(href);
    const link=document.createElement('link');
    link.id=id;link.rel='stylesheet';link.href=href;
    document.head.appendChild(link);
  }

  function script(id,src){
    if(document.getElementById(id)||loaded.has(src))return;
    loaded.add(src);
    const node=document.createElement('script');
    node.id=id;node.src=src;node.defer=true;
    document.body.appendChild(node);
  }


  const LANDING_PREMIUM_CSS = String.raw`
/* SanPaid landing premium polish — additive, dependency-free, mobile-first. */
#landing.landing-v3{
  --lp-ink:#10243b;
  --lp-muted:#5d7187;
  --lp-blue:#123d73;
  --lp-blue-2:#1b5f9e;
  --lp-blue-soft:#edf5fc;
  --lp-line:#dbe7f2;
  --lp-surface:rgba(255,255,255,.88);
  --lp-shadow:0 24px 70px rgba(20,55,92,.10);
  background:
    radial-gradient(circle at 78% 7%,rgba(45,111,174,.10),transparent 29rem),
    radial-gradient(circle at 12% 18%,rgba(82,151,205,.065),transparent 25rem),
    linear-gradient(180deg,#fbfdff 0,#f7faff 31rem,#fff 31rem,#fff 100%);
}
#landing.landing-v3 .wrap{width:min(1210px,calc(100% - 44px))}
#landing.landing-v3 .ribbon{
  padding:7px 18px;
  background:#0c2e56;
  color:#dbeafb;
  font-size:10px;
  font-weight:700;
  letter-spacing:.065em;
  text-transform:uppercase;
}
#landing.landing-v3 .nav{
  background:rgba(252,254,255,.88);
  border-bottom-color:rgba(205,220,235,.72);
  box-shadow:none;
  backdrop-filter:blur(18px) saturate(135%);
}
#landing.landing-v3 .nav.nav-compact{
  background:rgba(255,255,255,.95);
  box-shadow:0 12px 34px rgba(25,53,85,.075);
}
#landing.landing-v3 .navin{min-height:70px}
#landing.landing-v3 .brand{font-size:25px}
#landing.landing-v3 .navlinks{gap:23px}
#landing.landing-v3 .navlinks a{
  color:#53677d;
  font-size:12px;
  font-weight:750;
}
#landing.landing-v3 .navlinks a:hover,
#landing.landing-v3 .navlinks a.is-active{color:var(--lp-blue)}
#landing.landing-v3 .btn{
  min-height:46px;
  border-radius:14px;
  padding:0 19px;
  letter-spacing:.02em;
}
#landing.landing-v3 .btn.primary{
  background:linear-gradient(135deg,#123d73,#1a5790);
  box-shadow:0 13px 30px rgba(18,61,115,.20);
}
#landing.landing-v3 .btn.primary:hover{background:linear-gradient(135deg,#0f345f,#174f83)}
#landing.landing-v3 .btn.secondary{
  border-color:#bfd3e7;
  background:rgba(255,255,255,.86);
}
#landing.landing-v3 .hero{
  position:relative;
  isolation:isolate;
  padding:74px 0 30px;
}
#landing.landing-v3 .hero:before{
  content:"";
  position:absolute;
  z-index:-2;
  inset:0 0 auto;
  height:min(760px,100%);
  background-image:
    linear-gradient(rgba(36,84,130,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(36,84,130,.045) 1px,transparent 1px);
  background-size:44px 44px;
  mask-image:linear-gradient(to bottom,rgba(0,0,0,.64),transparent 92%);
  pointer-events:none;
}
#landing.landing-v3 .hero:after{
  content:"";
  position:absolute;
  z-index:-1;
  width:520px;
  height:520px;
  right:max(-170px,calc((100vw - 1210px)/2 - 240px));
  top:46px;
  border-radius:50%;
  background:radial-gradient(circle,rgba(70,139,199,.13),rgba(70,139,199,0) 67%);
  pointer-events:none;
}
#landing.landing-v3 .hero-grid{
  grid-template-columns:minmax(0,1.02fr) minmax(430px,.98fr);
  gap:68px;
  align-items:center;
}
#landing.landing-v3 .hero-copy{position:relative;z-index:3}
#landing.landing-v3 .eyebrow{
  background:rgba(235,244,252,.84);
  border-color:#cadff1;
  color:#174e82;
  padding:8px 11px;
  font-size:9px;
  box-shadow:inset 0 1px rgba(255,255,255,.75);
}
#landing.landing-v3 .hero-kicker{
  margin:19px 0 8px;
  color:#557896;
  font-size:11px;
  letter-spacing:.095em;
}
#landing.landing-v3 h1{
  max-width:720px;
  color:var(--lp-ink);
  font-size:clamp(49px,5.15vw,74px);
  line-height:.97;
  letter-spacing:-.058em;
  text-wrap:balance;
}
#landing.landing-v3 h1 em{
  position:relative;
  display:inline-block;
  color:var(--lp-blue);
}
#landing.landing-v3 h1 em:after{
  content:"";
  position:absolute;
  left:2px;
  right:3%;
  bottom:-7px;
  height:7px;
  border-radius:999px;
  background:linear-gradient(90deg,rgba(40,101,161,.22),rgba(40,101,161,.04));
}
#landing.landing-v3 .lead{
  max-width:660px;
  margin-top:25px;
  color:#536a81;
  font-size:15.5px;
  line-height:1.7;
}
#landing.landing-v3 .lead b{color:#263e58}
#landing.landing-v3 .hero-ctas{margin-top:27px;gap:10px}
#landing.landing-v3 .hero-proof-chips{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-top:17px;
}
#landing.landing-v3 .hero-proof-chips span{
  display:inline-flex;
  align-items:center;
  min-height:31px;
  padding:6px 10px;
  border:1px solid #d8e5f0;
  border-radius:999px;
  background:rgba(255,255,255,.68);
  color:#60758a;
  font-size:8.5px;
  font-weight:720;
  box-shadow:0 6px 22px rgba(24,59,94,.035);
}
#landing.landing-v3 .hero-usp-row{
  gap:9px;
  margin-top:18px;
}
#landing.landing-v3 .hero-usp{
  position:relative;
  overflow:hidden;
  border-color:#d4e2ef;
  border-radius:15px;
  padding:13px 14px 13px 17px;
  background:rgba(255,255,255,.76);
  box-shadow:0 9px 28px rgba(23,57,91,.045);
}
#landing.landing-v3 .hero-usp:before{
  content:"";
  position:absolute;
  inset:0 auto 0 0;
  width:3px;
  background:linear-gradient(#2a6ba8,#86afd2);
}
#landing.landing-v3 .hero-usp small{font-size:7.5px}
#landing.landing-v3 .hero-usp b{font-size:10.7px}
#landing.landing-v3 .hero-usp span{font-size:8.7px}
#landing.landing-v3 .hero-visual{
  --sp-pointer-x:0px;
  --sp-pointer-y:0px;
  position:relative;
  min-height:548px;
  padding:19px;
  overflow:hidden;
  border:1px solid rgba(191,211,231,.88);
  border-radius:32px;
  background:
    radial-gradient(circle at 76% 18%,rgba(93,155,207,.13),transparent 16rem),
    linear-gradient(150deg,rgba(255,255,255,.94),rgba(242,248,253,.90));
  box-shadow:
    0 32px 90px rgba(20,55,92,.13),
    inset 0 1px rgba(255,255,255,.9);
}
#landing.landing-v3 .hero-visual:before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
  background:
    linear-gradient(rgba(74,122,168,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(74,122,168,.045) 1px,transparent 1px);
  background-size:34px 34px;
  mask-image:linear-gradient(145deg,#000,transparent 78%);
}
#landing.landing-v3 .phone-stage{
  translate:var(--sp-pointer-x) var(--sp-pointer-y);
  transition:translate .22s ease-out;
}
#landing.landing-v3 .phone-shell{
  filter:drop-shadow(0 28px 38px rgba(24,55,87,.13));
}
#landing.landing-v3 .float-card{
  border-color:rgba(186,207,227,.9);
  background:rgba(255,255,255,.88);
  box-shadow:0 20px 46px rgba(18,61,115,.13);
}
#landing.landing-v3 .visual-caption{
  margin:4px 5px 0;
  border-top-color:#d9e6f1;
}
#landing.landing-v3 .evidence-strip{margin-top:36px}
#landing.landing-v3 .evidence-strip-inner{
  border-color:#dce7f1;
  border-radius:20px;
  background:rgba(255,255,255,.82);
  box-shadow:0 18px 48px rgba(24,57,91,.065);
  backdrop-filter:blur(12px);
}
#landing.landing-v3 .evidence-main,
#landing.landing-v3 .evidence-stat{padding:17px 19px}
#landing.landing-v3 .evidence-main b,
#landing.landing-v3 .evidence-stat b{color:#223b55}
#landing.landing-v3 .section{padding:82px 0}
#landing.landing-v3 .section.alt{
  background:linear-gradient(180deg,#f7faff,#f4f8fc);
  border-color:#eaf0f6;
}
#landing.landing-v3 .compact-head{max-width:780px;margin-bottom:31px}
#landing.landing-v3 .compact-head .tag{
  display:inline-flex;
  align-items:center;
  min-height:25px;
  padding:5px 9px;
  border:1px solid #d2e1ef;
  border-radius:999px;
  background:#f4f9fd;
  color:#315f89;
  font-size:8px;
}
#landing.landing-v3 .compact-head h2{
  margin-top:11px;
  color:#152b42;
  font-size:clamp(31px,3.25vw,45px);
  line-height:1.08;
  letter-spacing:-.045em;
  text-wrap:balance;
}
#landing.landing-v3 .compact-head p{
  max-width:690px;
  color:#667b90;
  font-size:13.5px;
  line-height:1.65;
}
#landing.landing-v3 .problem-card,
#landing.landing-v3 .story-card,
#landing.landing-v3 .diff-card,
#landing.landing-v3 .role-card,
#landing.landing-v3 .evidence-card,
#landing.landing-v3 .impact-card,
#landing.landing-v3 .technical-details{
  border-color:#dbe6f0;
  background:rgba(255,255,255,.90);
  box-shadow:0 10px 30px rgba(23,54,85,.045);
}
#landing.landing-v3 .problem-card:hover,
#landing.landing-v3 .story-card:hover,
#landing.landing-v3 .diff-card:hover,
#landing.landing-v3 .role-card:hover,
#landing.landing-v3 .impact-card:hover{
  border-color:#bfd5e8;
  box-shadow:0 22px 48px rgba(22,58,94,.095);
}
#landing.landing-v3 .visual-card-grid .problem-card{
  min-height:190px;
  padding:18px;
}
#landing.landing-v3 .card-icon,
#landing.landing-v3 .impact-icon,
#landing.landing-v3 .role-avatar{
  border-color:#d1e2f0;
  background:linear-gradient(145deg,#f4f9fd,#e8f3fb);
  box-shadow:inset 0 1px #fff;
}
#landing.landing-v3 .story-card{min-height:272px}
#landing.landing-v3 .story-art{
  background:
    radial-gradient(circle at 50% 45%,rgba(76,141,194,.11),transparent 54%),
    linear-gradient(145deg,#f7fbff,#edf6fd);
}
#landing.landing-v3 .visual-workflow{
  border-color:#d8e5f0;
  background:rgba(255,255,255,.9);
  box-shadow:0 18px 46px rgba(22,55,89,.055);
}
#landing.landing-v3 .flow-line{
  overflow:hidden;
  background:#d5e4f1;
}
#landing.landing-v3 .flow-line:before{
  content:"";
  position:absolute;
  inset:0;
  width:42%;
  background:linear-gradient(90deg,transparent,#2b70ad,transparent);
  animation:lpFlowSignal 2.8s ease-in-out infinite;
}
#landing.landing-v3 .workflow-guardrails span{
  background:#fbfdff;
  border-color:#dfe8f1;
}
#landing.landing-v3 .usp-visual-grid .usp-card{
  border-top-width:1px;
  border-color:#c8dceb;
  border-radius:22px;
  background:
    radial-gradient(circle at 86% 8%,rgba(76,141,194,.08),transparent 13rem),
    linear-gradient(145deg,#fff,#f7fbff);
}
#landing.landing-v3 .usp-visual-grid .usp-card small{color:#426a8f}
#landing.landing-v3 .usp-scene{
  border-color:#d7e5f1;
  background:linear-gradient(145deg,#f6fbff,#edf6fd);
}
#landing.landing-v3 .supporting-control{
  background:#fbfdff;
  border-style:dashed;
}
#landing.landing-v3 .evidence-v3 .evidence-card{
  border-radius:16px;
}
#landing.landing-v3 .evidence-v3 .evidence-card .decision{
  border-left-color:#8eb7d8;
}
#landing.landing-v3 .impact-v3 .impact-card{min-height:205px}
#landing.landing-v3 .pilot-loop{
  border-color:#d9e6f0;
  border-radius:18px;
  background:#fbfdff;
}
#landing.landing-v3 .pilot-loop span{
  border:1px solid #d3e4f2;
  background:#eef6fc;
}
#landing.landing-v3 .technical-details{
  box-shadow:none;
}
#landing.landing-v3 .final-cta{
  padding:72px 0;
  background:
    radial-gradient(circle at 82% 35%,rgba(128,181,226,.17),transparent 23rem),
    linear-gradient(135deg,#0b2b50,#123d73 58%,#174d80);
}
#landing.landing-v3 .final-cta h2{max-width:790px}
#landing.landing-v3 .footer{background:#092640}
@keyframes lpFlowSignal{
  0%{transform:translateX(-130%);opacity:0}
  25%{opacity:.85}
  70%{opacity:.65}
  100%{transform:translateX(340%);opacity:0}
}
@media (max-width:1020px){
  #landing.landing-v3 .hero-grid{grid-template-columns:1fr;gap:31px}
  #landing.landing-v3 .hero-copy{max-width:790px}
  #landing.landing-v3 .hero-visual{max-width:790px}
}
@media (max-width:720px){
  #landing.landing-v3 .wrap{width:min(100% - 28px,1210px)}
  #landing.landing-v3 .ribbon{font-size:8px;padding:6px 12px}
  #landing.landing-v3 .navin{min-height:62px}
  #landing.landing-v3 .brand{font-size:22px}
  #landing.landing-v3 .hero{padding:38px 0 18px}
  #landing.landing-v3 .hero:before{background-size:32px 32px}
  #landing.landing-v3 .hero:after{width:330px;height:330px;right:-170px;top:90px}
  #landing.landing-v3 .hero-kicker{margin-top:13px}
  #landing.landing-v3 h1{
    font-size:clamp(40px,12.2vw,52px);
    letter-spacing:-.052em;
  }
  #landing.landing-v3 h1 em:after{bottom:-4px;height:5px}
  #landing.landing-v3 .lead{
    margin-top:19px;
    font-size:13.2px;
    line-height:1.58;
  }
  #landing.landing-v3 .hero-ctas{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    margin-top:20px;
  }
  #landing.landing-v3 .hero-ctas .btn{
    min-height:45px;
    padding:0 10px;
    font-size:9.5px;
  }
  #landing.landing-v3 .hero-proof-chips{
    display:grid;
    grid-template-columns:1fr;
    gap:6px;
    margin-top:13px;
  }
  #landing.landing-v3 .hero-proof-chips span{
    min-height:30px;
    width:max-content;
    max-width:100%;
    font-size:8px;
  }
  #landing.landing-v3 .hero-usp-row{
    grid-template-columns:1fr 1fr;
    gap:7px;
    margin-top:13px;
  }
  #landing.landing-v3 .hero-usp{
    padding:10px 9px 10px 12px;
    border-radius:13px;
  }
  #landing.landing-v3 .hero-usp span{display:none}
  #landing.landing-v3 .hero-visual{
    min-height:482px;
    padding:10px;
    border-radius:26px;
    box-shadow:0 22px 58px rgba(20,55,92,.12);
  }
  #landing.landing-v3 .phone-stage{translate:0 0!important}
  #landing.landing-v3 .visual-caption{margin-inline:0}
  #landing.landing-v3 .evidence-strip{margin-top:18px}
  #landing.landing-v3 .section{padding:56px 0}
  #landing.landing-v3 .compact-head{margin-bottom:22px}
  #landing.landing-v3 .compact-head h2{font-size:30px}
  #landing.landing-v3 .compact-head p{font-size:12px}
  #landing.landing-v3 .visual-card-grid .problem-card{min-height:188px}
  #landing.landing-v3 .final-cta{padding:58px 0}
}
@media (max-width:430px){
  #landing.landing-v3 .hero-ctas{grid-template-columns:1fr}
  #landing.landing-v3 .hero-usp-row{grid-template-columns:1fr 1fr}
  #landing.landing-v3 .hero-usp b{font-size:8.7px}
  #landing.landing-v3 .hero-visual{min-height:458px}
}
@media (prefers-reduced-motion:reduce){
  #landing.landing-v3 .flow-line:before{animation:none}
  #landing.landing-v3 .phone-stage{translate:0 0!important;transition:none}
}
`;

  function loadLandingPolish(){
    landingPolishLoaded=true;
  }

  function wireLandingDepth(){
    const visual=document.querySelector('#landing .hero-visual');
    if(!visual||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||window.matchMedia?.('(pointer: coarse)')?.matches)return;
    const reset=()=>{
      visual.style.setProperty('--sp-pointer-x','0px');
      visual.style.setProperty('--sp-pointer-y','0px');
    };
    visual.addEventListener('pointermove',event=>{
      const rect=visual.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const x=((event.clientX-rect.left)/rect.width-.5)*8;
      const y=((event.clientY-rect.top)/rect.height-.5)*6;
      visual.style.setProperty('--sp-pointer-x',x.toFixed(2)+'px');
      visual.style.setProperty('--sp-pointer-y',y.toFixed(2)+'px');
    },{passive:true});
    visual.addEventListener('pointerleave',reset,{passive:true});
  }

  function loadEnhancements(){
    if(enhancementsLoaded)return;
    enhancementsLoaded=true;
    stylesheet('sanpaidCredibilityStyles','credibility-layer.css');
    stylesheet('sanpaidWorkforceIntelligenceStyles','workforce-intelligence.css');
    script('sanpaidCredibilityScript','credibility-layer.js');
    script('sanpaidWorkforceIntelligenceScript','workforce-intelligence.js');
  }

  function loadAuth(){
    if(authLoaded)return;
    authLoaded=true;
    stylesheet('sanpaidAuthStyles','auth-unified.css');
    script('sanpaidAuthRuntime','auth-unified.js');
  }

  function loadRoleShell(){
    if(roleShellLoaded)return;
    roleShellLoaded=true;
    loadAuth();
    stylesheet('sanpaidDesignTokens','design-tokens.css');
    stylesheet('sanpaidSelectionStyles','selection-ready-v3.css');
    stylesheet('sanpaidWorkspaceStyles','workspace-ui.css');
    stylesheet('sanpaidColorSystem','color-system-v5.css');
    loadEnhancements();
  }

  function loadCustomerWorker(){
    if(customerWorkerLoaded)return;
    customerWorkerLoaded=true;
    loadRoleShell();
    stylesheet('sanpaidCustomerWorkerStyles','customer-worker-dashboard.css');
    script('sanpaidCustomerWorkerRuntime','customer-worker-dashboard.js');
  }

  function loadAdministration(){
    if(administrationLoaded)return;
    administrationLoaded=true;
    loadRoleShell();
    stylesheet('sanpaidAdminCommandStyles','admin-command-center.css');
    stylesheet('sanpaidFederationGovtechStyles','federation-govtech.css');
    stylesheet('sanpaidFederationPortalStyles','federation-portal.css');
    stylesheet('sanpaidCooperativePortalStyles','cooperative-portal.css');
    stylesheet('sanpaidHandoverEvidenceStyles','handover-evidence.css');

    script('sanpaidAdminCommandRuntime','admin-command-center.js');
    script('sanpaidFederationPortalRuntime','federation-portal.js');
    script('sanpaidCooperativePortalRuntime','cooperative-portal.js');
    script('sanpaidCooperativeAvailabilityRuntime','cooperative-deploy-guard.js');
    script('sanpaidHandoverEvidenceRuntime','handover-evidence.js');
  }

  function closeAdminDrawers(){
    const content=document.getElementById('judgeContent');
    if(!content)return;
    content.classList.remove('coop-nav-open','fed-nav-open');
    document.getElementById('coopNavToggle')?.setAttribute('aria-expanded','false');
    document.getElementById('fedNavToggle')?.setAttribute('aria-expanded','false');
    document.body.classList.remove('admin-mobile-nav-open');
  }

  function wireIntentLoading(){
    document.addEventListener('pointerdown',event=>{
      const target=event.target.closest?.('[data-eval-open-connected],[data-eval-connected-persona],[data-open-connected],[data-platform-access],#connectedDemoBtn,#getStarted,#evalOpenConnected,#evalFinalPrototype');
      if(target)loadCustomerWorker();
      const admin=event.target.closest?.('[data-eval-open-admin],[data-open-role="COOPERATIVE_ADMIN"],[data-open-role="FEDERATION_ADMIN"],[data-judge-role="COOPERATIVE_ADMIN"],[data-judge-role="FEDERATION_ADMIN"]');
      if(admin)loadAdministration();
    },{capture:true,passive:true});

    document.addEventListener('focusin',event=>{
      const target=event.target.closest?.('[data-eval-open-connected],[data-eval-connected-persona],[data-open-connected],[data-platform-access],#connectedDemoBtn,#getStarted,#evalOpenConnected,#evalFinalPrototype');
      if(target)loadCustomerWorker();
      const admin=event.target.closest?.('[data-eval-open-admin],[data-open-role="COOPERATIVE_ADMIN"],[data-open-role="FEDERATION_ADMIN"],[data-judge-role="COOPERATIVE_ADMIN"],[data-judge-role="FEDERATION_ADMIN"]');
      if(admin)loadAdministration();
    });
  }

  function wireAccessibility(){
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape')closeAdminDrawers();
    });
    document.addEventListener('click',event=>{
      const content=document.getElementById('judgeContent');
      if(!content||!content.contains(event.target))return;
      const selected=event.target.closest?.('[data-coop-target],[data-fed-target]');
      if(selected)queueMicrotask(closeAdminDrawers);
    });
  }

  function exposeRuntimeStatus(){
    window.SanPaidBootstrap=Object.freeze({
      version:'handover-bootstrap-v1',
      story:'Problem Details → Eligible Recommended Workers → Customer Selects → Worker Accepts → Call/Inspection → Estimate → Customer Approval → QR-Verified Start → Service → Worker Marks Complete → Customer Confirms → Itemized Bill → Payment → Invoice → Rating/Feedback',
      refreshEvidence:()=>window.SanPaidHandoverEvidence?.refresh?.(),
      loadCustomerWorker,
      loadAdministration,
      closeAdminDrawers
    });
  }

  function start(){
    loadLandingPolish();
    wireLandingDepth();
    loadAuth();
    wireIntentLoading();
    wireAccessibility();
    exposeRuntimeStatus();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

```


---

## FILE: `evaluator-final.js`

```javascript
(() => {
  'use strict';

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  const isMobile=()=>window.matchMedia?.('(max-width: 768px)')?.matches===true;

  const MATCH_CANDIDATES=[
    {id:'rahul',name:'Rahul',distance:1.8,skill:'Electrician',verified:false,available:true,workload:'Low'},
    {id:'amit',name:'Amit',distance:2.3,skill:'Electrician',verified:true,available:true,workload:'Lower recent workload'},
    {id:'suresh',name:'Suresh',distance:3.1,skill:'Electrician',verified:true,available:false,workload:'Balanced'},
    {id:'priya',name:'Priya',distance:4.0,skill:'Electrician',verified:true,available:true,workload:'Balanced recent workload'},
    {id:'sanjay',name:'Sanjay',distance:6.2,skill:'Plumber',verified:true,available:true,workload:'Low'}
  ];

  const demoState={radius:20,eligible:[],ranked:[],offerIndex:-1,audit:[],busy:false};
  const clock=()=>new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false});
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,reduceMotion?0:ms));

  function eligibility(worker){
    if(!worker.verified)return {ok:false,reason:'Verification pending'};
    if(worker.skill!=='Electrician')return {ok:false,reason:'Required skill missing'};
    if(!worker.available)return {ok:false,reason:'Not currently available'};
    if(worker.distance>demoState.radius)return {ok:false,reason:'Outside configured service area'};
    return {ok:true,reason:'Verified + required skill + available + within configured service area'};
  }

  function addAudit(label){demoState.audit.push({time:clock(),label});renderAudit();}
  function renderAudit(){
    const root=$('#evalAudit');if(!root)return;
    if(!demoState.audit.length){root.innerHTML='<div class="eval-audit-row"><time>—</time><span>Run the matching flow to build a reason-coded audit trail.</span></div>';return;}
    root.innerHTML=demoState.audit.slice(-7).map(item=>`<div class="eval-audit-row"><time>${esc(item.time)}</time><span>${esc(item.label)}</span></div>`).join('');
  }

  function candidateCard(worker){
    return `<article class="eval-candidate" data-eval-candidate="${esc(worker.id)}">
      <div><strong>${esc(worker.name)} · ${worker.distance.toFixed(1)} km · ${esc(worker.skill)}</strong><small>${worker.verified?'Verified':'Verification Pending'} · ${worker.available?'Available':'Unavailable'} · Controlled identity check</small><button class="eval-why" type="button" data-eval-why>WHY?</button></div>
      <span class="eval-status pending" data-eval-status>PENDING</span>
      <div class="eval-reason" data-eval-reason>Waiting for Eligibility Gate.</div>
    </article>`;
  }

  function renderCandidates(){const root=$('#evalCandidateList');if(root)root.innerHTML=MATCH_CANDIDATES.map(candidateCard).join('');}
  function renderRankingPlaceholder(message='Run the Eligibility Gate first.'){const root=$('#evalRankingList');if(root)root.innerHTML=`<div class="eval-candidate"><div><strong>Ranking locked</strong><small>${esc(message)}</small></div><span class="eval-status pending">LOCKED</span></div>`;}
  function renderEmptyState(){
    const root=$('#evalRankingList');if(!root)return;
    root.innerHTML='<div class="eval-empty-state"><b>NO ELIGIBLE WORKER</b><p>No verified worker currently meets all eligibility requirements for the configured radius.</p><button class="btn secondary" type="button" id="evalExpandRadius">Expand Configured Radius</button></div>';
    const offer=$('#evalOfferRoot');if(offer)offer.innerHTML='';
  }

  function setMatchState(text){const el=$('#evalMatchState');if(el)el.textContent=`EXPLAINABLE MATCHING · ${text}`;}
  function setEligibilityBadge(text,kind=''){const el=$('#evalEligibilityBadge');if(el){el.textContent=text;el.className=kind;}}
  function setRankingBadge(text,kind=''){const el=$('#evalRankingBadge');if(el){el.textContent=text;el.className=kind;}}

  function resetMatching({keepRadius=true}={}){
    demoState.busy=false;demoState.eligible=[];demoState.ranked=[];demoState.offerIndex=-1;demoState.audit=[];
    if(!keepRadius)demoState.radius=20;
    const radius=$('#evalRadius');if(radius)radius.value=String(demoState.radius);
    renderCandidates();renderRankingPlaceholder();renderAudit();
    const offer=$('#evalOfferRoot');if(offer)offer.innerHTML='';
    const msg=$('#evalWorkerMessage');if(msg){msg.hidden=true;msg.className='eval-worker-message';msg.textContent='';}
    const summary=$('#evalEligibilitySummary');if(summary)summary.innerHTML='<span>5 Candidates</span><i>→</i><span>Run Eligibility</span>';
    const run=$('#runMatchBtn');if(run){run.disabled=false;run.textContent='RUN ELIGIBILITY CHECK';}
    const rank=$('#evalRunRanking');if(rank){rank.disabled=true;rank.textContent='RUN FAIR RANKING';}
    setEligibilityBadge('WAITING');setRankingBadge('LOCKED');setMatchState(`Ready · configured radius ${demoState.radius} km`);
  }

  async function runEligibility(){
    if(demoState.busy)return;
    demoState.busy=true;demoState.eligible=[];demoState.ranked=[];demoState.offerIndex=-1;demoState.audit=[];
    renderAudit();renderRankingPlaceholder('Eligibility check is running.');
    const offerRoot=$('#evalOfferRoot');if(offerRoot)offerRoot.innerHTML='';
    const run=$('#runMatchBtn'),rank=$('#evalRunRanking');
    if(run){run.disabled=true;run.textContent='CHECKING ELIGIBILITY…';}
    if(rank)rank.disabled=true;
    setEligibilityBadge('CHECKING','active');setRankingBadge('LOCKED');setMatchState('Checking eligibility…');
    const summary=$('#evalEligibilitySummary');if(summary)summary.innerHTML='<span>5 Candidates</span><i>→</i><span>Checking…</span>';
    addAudit(`Service request entered Eligibility Gate · Electrician · radius ${demoState.radius} km`);

    for(const worker of MATCH_CANDIDATES){
      const card=$(`[data-eval-candidate="${worker.id}"]`);if(!card)continue;
      card.classList.add('is-checking');
      const status=$('[data-eval-status]',card),reason=$('[data-eval-reason]',card);
      if(status){status.textContent='CHECKING';status.className='eval-status pending';}
      await wait(isMobile()?90:150);
      const gate=eligibility(worker);
      card.classList.remove('is-checking');card.classList.add(gate.ok?'is-eligible':'is-ineligible','show-reason');
      if(status){status.textContent=gate.ok?'ELIGIBLE':'INELIGIBLE';status.className=`eval-status ${gate.ok?'good':'bad'}`;}
      if(reason)reason.textContent=gate.reason;
      if(gate.ok)demoState.eligible.push(worker);
      addAudit(`${worker.name}: ${gate.ok?'eligible':'excluded'} — ${gate.reason}`);
    }

    if(summary)summary.innerHTML=`<span>5 Candidates</span><i>→</i><span>Eligibility Gate</span><i>→</i><span class="good">${demoState.eligible.length} Eligible</span>`;
    setEligibilityBadge(`${demoState.eligible.length} ELIGIBLE`,'good');
    if(demoState.eligible.length){
      setRankingBadge('READY','active');if(rank)rank.disabled=false;
      renderRankingPlaceholder(`${demoState.eligible.length} eligible workers are ready for explainable ranking.`);
      setMatchState(`${demoState.eligible.length} eligible · ranking ready`);
    }else{
      setRankingBadge('NO ELIGIBLE');renderEmptyState();setMatchState('No eligible worker · review radius/schedule');addAudit('No eligible worker — Cooperative Admin review path available');
    }
    if(run){run.disabled=false;run.textContent='RERUN ELIGIBILITY';}
    demoState.busy=false;
  }

  function rankEligible(){
    const workloadOrder=worker=>/lower/i.test(worker.workload)?0:/balanced/i.test(worker.workload)?1:2;
    return demoState.eligible.slice().sort((a,b)=>workloadOrder(a)-workloadOrder(b)||a.distance-b.distance||a.name.localeCompare(b.name));
  }

  async function runRanking(){
    if(demoState.busy||!demoState.eligible.length)return;
    demoState.busy=true;
    const rankBtn=$('#evalRunRanking');if(rankBtn){rankBtn.disabled=true;rankBtn.textContent='RANKING ELIGIBLE WORKERS…';}
    setRankingBadge('RANKING','active');setMatchState('Ranking eligible workers…');
    await wait(isMobile()?180:280);
    demoState.ranked=rankEligible();
    const root=$('#evalRankingList');
    if(root)root.innerHTML=demoState.ranked.map((worker,index)=>`<article class="eval-ranked">
      <div class="eval-ranked-top"><b>#${index+1} ${esc(worker.name)} · ${worker.distance.toFixed(1)} km</b><span class="eval-rank-badge">RANK #${index+1}</span></div>
      <div class="eval-rank-factors"><span>Eligible</span><span>Distance ${worker.distance.toFixed(1)} km</span><span>${esc(worker.workload)}</span><span>Service Suitability</span><span>Policy Rules</span></div>
      <button class="eval-why" type="button" data-eval-rank-why>WHY THIS RANK?</button>
      <div class="eval-rank-detail" hidden>✓ Eligible · ✓ Required Skill · ✓ Available · ✓ Within Service Area · ${index===0?'✓ Lower recent workload considered':'✓ Balanced workload and distance considered'}</div>
    </article>`).join('');
    setRankingBadge('EXPLAINABLE','good');addAudit(`Fair & Explainable Ranking generated for ${demoState.ranked.length} eligible workers`);
    renderOfferLauncher();setMatchState('Ranking complete · opportunity ready');
    if(rankBtn){rankBtn.textContent='RANKING COMPLETE';rankBtn.disabled=true;}
    demoState.busy=false;
  }

  function renderOfferLauncher(){
    const root=$('#evalOfferRoot');if(!root||!demoState.ranked.length)return;
    root.innerHTML=`<div class="eval-offer-card"><small>NEXT CONTROLLED ACTION</small><h4>Opportunity can now be offered to ${esc(demoState.ranked[0].name)}</h4><p style="margin:0 0 10px;color:#78663e;font-size:8.5px">Ranking does not assign work. The worker still decides.</p><button class="btn primary" type="button" data-eval-offer-start>OFFER OPPORTUNITY</button></div>`;
  }

  function renderOffer(index){
    const root=$('#evalOfferRoot');if(!root)return;
    const worker=demoState.ranked[index];
    if(!worker){root.innerHTML='<div class="eval-empty-state"><b>NO FURTHER ELIGIBLE WORKER</b><p>Cooperative Admin review is required before changing schedule, service radius or capacity strategy.</p></div>';return;}
    demoState.offerIndex=index;
    root.innerHTML=`<div class="eval-offer-card"><small>OPPORTUNITY RECEIVED · WORKER CHOICE</small><h4>${esc(worker.name)} · Electrician Service</h4><div class="eval-offer-meta"><span>Distance<br><b>${worker.distance.toFixed(1)} km</b></span><span>Schedule<br><b>Today · 4:00 PM</b></span><span>Expected Earnings<br><b>Illustrative estimate</b></span></div><div class="eval-offer-actions"><button type="button" class="accept" data-eval-offer-accept>ACCEPT</button><button type="button" data-eval-offer-decline>DECLINE</button></div></div>`;
    addAudit(`Opportunity offered to ${worker.name} — worker choice required`);
  }

  async function declineOffer(){
    const worker=demoState.ranked[demoState.offerIndex];if(!worker)return;
    const msg=$('#evalWorkerMessage');if(msg){msg.hidden=false;msg.className='eval-worker-message warn';msg.textContent='Worker choice respected. Offering opportunity to the next eligible worker…';}
    addAudit(`${worker.name} declined opportunity — no forced assignment`);
    await wait(isMobile()?220:350);
    const next=demoState.offerIndex+1;
    if(next<demoState.ranked.length){renderOffer(next);addAudit(`Same service request continued to next eligible worker: ${demoState.ranked[next].name}`);if(msg)msg.textContent=`Worker choice respected. Opportunity moved to ${demoState.ranked[next].name}.`;}
    else{renderOffer(next);if(msg)msg.textContent='No additional eligible worker remains. Cooperative Admin review required.';}
  }

  function acceptOffer(){
    const worker=demoState.ranked[demoState.offerIndex];if(!worker)return;
    const root=$('#evalOfferRoot');if(root)root.innerHTML=`<div class="eval-offer-card" style="border-color:#9ecfb6;background:#f1faf5"><small style="color:#18794e">OPPORTUNITY ACCEPTED</small><h4 style="color:#285c42">${esc(worker.name)} accepted the service opportunity</h4><p style="margin:0;color:#557667;font-size:9px">Customer can now proceed to arrival and Service-Start Verification in the connected platform.</p></div>`;
    const msg=$('#evalWorkerMessage');if(msg){msg.hidden=false;msg.className='eval-worker-message good';msg.textContent='Worker accepted. Customer notification and service lifecycle can continue.';}
    addAudit(`${worker.name} accepted opportunity — customer notified`);addAudit('Audit & Outcome preserved with eligibility and ranking reason codes');
    setMatchState('Worker accepted · auditable outcome recorded');
  }

  function wireMatchingEvents(){
    $('#runMatchBtn')?.addEventListener('click',runEligibility);
    $('#evalRunRanking')?.addEventListener('click',runRanking);
    $('#evalResetMatch')?.addEventListener('click',()=>resetMatching());
    $('#evalRadius')?.addEventListener('change',event=>{
      demoState.radius=Number(event.target.value||20);
      const label=$('.eval-radius-control>span');if(label)label.textContent=`Current setting: ${demoState.radius} km`;
      resetMatching();
    });
    document.addEventListener('click',event=>{
      const why=event.target.closest?.('[data-eval-why]');
      if(why){why.closest('.eval-candidate')?.classList.toggle('show-reason');return;}
      const rankWhy=event.target.closest?.('[data-eval-rank-why]');
      if(rankWhy){const detail=rankWhy.parentElement?.querySelector('.eval-rank-detail');if(detail)detail.hidden=!detail.hidden;return;}
      if(event.target.closest?.('[data-eval-offer-start]')){renderOffer(0);return;}
      if(event.target.closest?.('[data-eval-offer-decline]')){declineOffer();return;}
      if(event.target.closest?.('[data-eval-offer-accept]')){acceptOffer();return;}
      if(event.target.closest?.('#evalExpandRadius')){demoState.radius=20;const radius=$('#evalRadius');if(radius)radius.value='20';resetMatching();setMatchState('Radius expanded to configured policy radius: 20 km');}
    });
  }

  async function openConnected(persona=null){
    window.SanPaidLanding?.closeMobileDrawer?.(false);
    if(window.SanPaidReadiness?.require&&!(await window.SanPaidReadiness.require()))return;
    if(window.ConnectedSanPaid?.open){window.ConnectedSanPaid.open(persona||null);return;}
    window.SanPaidDemo?.showRoles?.();
  }

  function wirePrimaryActions(){
    $('#connectedDemoBtn')?.addEventListener('click',()=>openConnected());
    $$('[data-eval-open-connected]').forEach(button=>button.addEventListener('click',()=>openConnected()));
    $$('[data-eval-connected-persona]').forEach(button=>button.addEventListener('click',()=>openConnected(button.dataset.evalConnectedPersona)));
    $('#evalOpenConnected')?.addEventListener('click',()=>openConnected());
    $('#evalFinalPrototype')?.addEventListener('click',()=>openConnected());
    $('#evalFinalArchitecture')?.addEventListener('click',()=>{const section=document.getElementById('architecture');const details=section?.querySelector('.technical-details');if(details)details.open=true;section?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});});
    $$('[data-eval-open-admin]').forEach(button=>button.addEventListener('click',()=>window.SanPaidDemo?.showRoles?.()));
    $('#evalCapacityConnected')?.addEventListener('click',()=>window.SanPaidSelectorMode?.open?.(6));
    $('#evalResearch')?.addEventListener('click',()=>window.SanPaidSelectorMode?.open?.(8));
    $('#evalResetLocal')?.addEventListener('click',()=>window.SanPaidDemo?.reset?.());
    $$('[data-scroll-target]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'})));
  }

  function wireCapacityDemo(){
    const button=$('#evalCapacityAction'),status=$('#evalCapacityStatus');if(!button||!status)return;
    button.addEventListener('click',async()=>{
      button.disabled=true;button.textContent='CHECKING NETWORK CAPACITY…';status.hidden=false;status.className='eval-worker-message';status.textContent='Checking cooperative network capacity…';
      await wait(isMobile()?180:300);
      status.className='eval-worker-message good';status.textContent='Capacity Exchange Suggested — worker acceptance and authorized cooperative/federation approval are still required.';
      button.textContent='CAPACITY EXCHANGE SUGGESTED';button.disabled=false;
    });
  }

  function wireDashboardTabs(){
    const buttons=$$('[data-eval-dashboard]');if(!buttons.length)return;
    buttons.forEach(button=>button.addEventListener('click',()=>{
      buttons.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
      $$('[data-eval-panel]').forEach(panel=>{const active=panel.dataset.evalPanel===button.dataset.evalDashboard;panel.hidden=!active;panel.classList.toggle('active',active);});
    }));
  }

  function revealElement(el,index=0){
    if(!el||el.classList.contains('is-visible'))return;
    el.style.transitionDelay=`${Math.min(index*60,180)}ms`;
    el.classList.add('is-visible');
  }

  function initScrollReveal(){
    const landing=$('#landing');if(!landing)return;
    const elements=$$('[data-reveal]',landing);
    if(reduceMotion){elements.forEach(el=>el.classList.add('is-visible'));return;}
    landing.classList.add('eval-motion-ready');
    const revealVisible=()=>{
      const viewport=window.visualViewport?.height||window.innerHeight||700;
      elements.forEach((el,index)=>{
        if(el.classList.contains('is-visible'))return;
        const rect=el.getBoundingClientRect();
        if(rect.top<viewport*1.05&&rect.bottom>-40)revealElement(el,index%4);
      });
    };
    revealVisible();
    requestAnimationFrame(()=>requestAnimationFrame(revealVisible));
    if('IntersectionObserver'in window){
      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        revealElement(entry.target);observer.unobserve(entry.target);
      }),{threshold:isMobile()?.02:.08,rootMargin:isMobile()?'0px 0px 12% 0px':'0px 0px -4% 0px'});
      elements.forEach(el=>{if(!el.classList.contains('is-visible'))observer.observe(el);});
    }else{
      const onScroll=()=>revealVisible();window.addEventListener('scroll',onScroll,{passive:true});
    }
    window.addEventListener('pageshow',revealVisible,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(revealVisible,160),{passive:true});
    document.fonts?.ready?.then(revealVisible).catch(()=>{});
    setTimeout(revealVisible,700);
    setTimeout(()=>elements.forEach((el,index)=>{const r=el.getBoundingClientRect();if(r.top<(window.innerHeight||700)*1.2&&r.bottom>-80)revealElement(el,index%4);}),1600);
  }

  function initNav(){
    const nav=$('.master-v2 .nav');if(!nav)return;
    const links=$$('.navlinks a[href^="#"]',nav);
    const sections=links.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);

    const syncCompact=()=>nav.classList.toggle('nav-compact',window.scrollY>24);
    const syncActive=()=>{
      if(!sections.length)return;
      const marker=(nav.getBoundingClientRect().bottom||90)+72;
      let active=sections[0];
      for(const section of sections){
        if(section.getBoundingClientRect().top<=marker)active=section;
        else break;
      }
      links.forEach(link=>{
        const current=link.getAttribute('href')===`#${active.id}`;
        link.classList.toggle('is-active',current);
        if(current)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    };
    const sync=()=>{syncCompact();syncActive();};
    sync();
    window.addEventListener('scroll',sync,{passive:true});
    window.addEventListener('resize',sync,{passive:true});
  }

  function initHeroSequence(){
    const root=$('#evalHeroSystem');if(!root)return;
    root.dataset.animationOwner='evaluator';
    const seq=['request','workers','gate','rank','offer','audit'];
    const nodes=$$('[data-hero-seq]',root),workers=$$('.hero-worker',root),progress=$('#evalHeroProgress');
    if(reduceMotion){
      nodes.forEach(n=>n.classList.add('hero-active'));
      workers.filter(w=>w.classList.contains('good')).forEach(w=>w.classList.add('hero-pass'));
      workers.filter(w=>w.classList.contains('bad')).forEach(w=>w.classList.add('hero-remove'));
      if(progress)progress.style.width='100%';
      return;
    }
    let timer=null;
    const stepDelay=isMobile()?820:1150;
    const lead=isMobile()?120:260;
    const run=()=>{
      nodes.forEach(n=>n.classList.remove('hero-active'));
      workers.forEach(w=>w.classList.remove('hero-pass','hero-remove'));
      if(progress)progress.style.width='0%';
      seq.forEach((name,index)=>setTimeout(()=>{
        const node=$(`[data-hero-seq="${name}"]`,root);node?.classList.add('hero-active');
        if(name==='gate')workers.forEach(w=>w.classList.add(w.classList.contains('good')?'hero-pass':'hero-remove'));
        if(progress)progress.style.width=`${Math.round(((index+1)/seq.length)*100)}%`;
      },lead+index*stepDelay));
      clearTimeout(timer);timer=setTimeout(run,lead+seq.length*stepDelay+(isMobile()?700:1100));
    };
    run();
  }

  function init(){
    renderCandidates();renderRankingPlaceholder();renderAudit();
    wireMatchingEvents();wirePrimaryActions();wireCapacityDemo();wireDashboardTabs();initScrollReveal();initNav();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

```
