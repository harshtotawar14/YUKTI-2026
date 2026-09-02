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
      const chargeHtml=charges.length?charges.map(c=>`<div class="connected-state-line"><div class="connected-heading-row"><b>${esc(c.workItem)}</b><b>${money(c.amount)}</b></div><p>${esc(c.reason||'Additional work')}</p><span class="badge ${c.status==='APPROVED'?'b-green':c.status==='REJECTED'?'b-gray':'b-orange'}">${esc(human(c.status))}</span>${c.status==='PENDING'?`<div class="connected-actions"><button class="btn danger small" data-charge="${c.id}" data-decision="REJECT">Reject</button><button class="btn primary small" data-charge="${c.id}" data-decision="APPROVE">Approve</button></div>`:''}</div>`).join(''):'<div class="connected-empty">No additional work charges.</div>';
      const payable=['COMPLETED','PAYMENT_PENDING','PAID'].includes(checkout.status),paid=!!checkout.payment;
      const html=`<div class="connected-card"><span class="connected-step-label">CHECKOUT</span><h3>Charges, Sandbox Payment & Invoice</h3><p>Only customer-approved extra work is included in the final amount.</p><div class="connected-list">${chargeHtml}</div><div class="connected-divider"></div><div class="connected-meta"><div>Service Amount<b>${money(checkout.total)}</b></div><div>Approved Extra Work<b>${money(checkout.approvedAdditional)}</b></div><div>Final Amount<b>${money(checkout.finalAmount)}</b></div><div>Status<b>${esc(human(checkout.status))}</b></div></div>${payable&&!paid?`<div class="connected-demo-note"><b>SANDBOX PAYMENT</b> · No real money will move.</div><div class="connected-actions"><select id="connectedPayMethod" class="voice-lang-select"><option value="DEMO">Demo</option><option value="UPI">UPI · Sandbox</option><option value="CARD">Card · Sandbox</option><option value="CASH">Cash Record</option></select><button class="btn primary" id="connectedPay">Complete Sandbox Payment</button></div>`:''}${paid?`<div class="connected-success connected-payment-success"><b>Payment Successful — Sandbox ✓</b><br>Transaction ID: ${esc(checkout.payment.transactionReference)}<br>Method: ${esc(checkout.payment.paymentMethod)}<br>Amount: ${money(checkout.payment.amount)}${checkout.invoice?`<br>Invoice: <b>${esc(checkout.invoice.invoiceNumber)}</b>`:''}</div>${checkout.invoice?`<div class="connected-actions"><button class="btn secondary" type="button" id="connectedPrintInvoice">Print Invoice</button></div>`:''}<div class="connected-divider"></div><form id="connectedRatingForm" class="connected-form"><div class="field"><label>Rating</label><select id="connectedStars"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Needs Improvement</option><option value="1">1 — Poor</option></select></div><div class="field"><label>Feedback</label><textarea id="connectedFeedback" placeholder="Optional service feedback"></textarea></div><button class="btn primary" id="connectedRatingSubmit" type="submit">Submit Rating</button></form>`:''}<div id="connectedCommerceMessage"></div></div>`;
      if(setMarkup(h,signature,html,'customer')){h.querySelectorAll('[data-charge]').forEach(b=>b.onclick=()=>decide(Number(b.dataset.charge),b.dataset.decision,b));h.querySelector('#connectedPay')?.addEventListener('click',e=>pay(id,h.querySelector('#connectedPayMethod').value,e.currentTarget));h.querySelector('#connectedRatingForm')?.addEventListener('submit',e=>rate(e,id));h.querySelector('#connectedPrintInvoice')?.addEventListener('click',()=>window.print());}
    }catch(e){if(e.status===404)setSession(BOOKING_KEY,'');if(lastCustomerSignature!=='ERR'){h.innerHTML=`<div class="connected-error">${esc(friendly(e))}</div>`;lastCustomerSignature='ERR';}}
  }

  function msg(text,type='success'){const e=document.getElementById('connectedCommerceMessage');if(e)e.innerHTML=`<div class="${type==='error'?'connected-error':'connected-success'}" style="margin-top:10px">${esc(text)}</div>`;}
  async function decide(id,decision,button){if(busy)return;busy=true;const old=button.textContent;button.disabled=true;button.textContent=decision==='APPROVE'?'Approving…':'Rejecting…';try{await post(`/api/connected/customer/charges/${id}/decision`,{decision});msg(`Additional charge ${decision==='APPROVE'?'approved':'rejected'}.`);lastCustomerSignature='';signal('extra-charge-decision');}catch(e){msg(friendly(e),'error');button.disabled=false;button.textContent=old;}finally{busy=false;setTimeout(refresh,160);}}
  async function pay(id,method,button){if(busy)return;busy=true;const old=button.textContent;button.disabled=true;button.textContent='Processing Sandbox Payment…';try{const r=await post(`/api/connected/customer/bookings/${id}/pay`,{method});msg(`Sandbox payment recorded: ${r.payment?.transactionReference||'success'}.`);lastCustomerSignature='';signal('sandbox-payment');}catch(e){msg(friendly(e),'error');button.disabled=false;button.textContent=old;}finally{busy=false;setTimeout(refresh,160);}}
  async function rate(event,id){event.preventDefault();if(busy)return;busy=true;const b=document.getElementById('connectedRatingSubmit'),old=b?.textContent;if(b){b.disabled=true;b.textContent='Saving rating…';}try{await post(`/api/connected/customer/bookings/${id}/rating`,{stars:Number(document.getElementById('connectedStars').value),feedback:document.getElementById('connectedFeedback').value.trim()});msg('Rating saved to the worker service profile.');lastCustomerSignature='';signal('rating-submitted');}catch(e){msg(friendly(e),'error');if(b){b.disabled=false;b.textContent=old;}}finally{busy=false;}}

  function start(){
    setTimeout(refresh,600);
    window.addEventListener('sanpaid:connected-sync',()=>setTimeout(refresh,100));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
