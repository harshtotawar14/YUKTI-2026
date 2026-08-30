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
  function friendly(e){if(e?.status===401)return 'Your demo session expired. Please log in again.';if(e?.status>=500)return 'Capacity offers are temporarily unavailable. Please retry.';return e?.message||'Capacity offer could not be loaded.';}

  async function render(force=false){
    if(busy||document.hidden||!shellOpen())return;const content=workerScreen();if(!content)return;
    busy=true;let card=document.getElementById('connectedCapacityOffers');
    try{
      const offers=await request('/api/connected/worker/capacity-offers');const signature=JSON.stringify((offers||[]).map(o=>[o.offerId,o.offerStatus,o.requestCode,o.service,o.zone,o.requestingCooperative,o.providingCooperative]));if(!force&&signature===lastSignature)return;lastSignature=signature;
      if(!card){card=document.createElement('section');card.id='connectedCapacityOffers';card.className='connected-card';card.style.marginTop='14px';content.appendChild(card);}
      card.innerHTML=`<div class="connected-heading-row"><div><span class="connected-step-label">COOPERATIVE CAPACITY</span><h3>Cross-Cooperative Offers</h3><p>Workers are never transferred automatically. Every capacity offer requires your choice.</p></div><span class="badge b-purple">WORKER CONSENT</span></div>${offers.length?offers.map(o=>`<article class="connected-offer" data-capacity-offer="${o.offerId}"><div class="connected-heading-row"><div><b>${esc(o.service)} · ${esc(o.requestCode)}</b><p>${esc(o.requestingCooperative)} needs capacity in ${esc(o.zone)}.</p></div><span class="badge b-orange">${esc(String(o.offerStatus).replaceAll('_',' '))}</span></div><div class="connected-state-line"><b>Providing Cooperative</b><p>${esc(o.providingCooperative||'Your cooperative')}</p></div>${o.offerStatus==='OFFERED'?`<div class="connected-actions"><button class="btn danger" data-cap-reject="${o.offerId}">Decline</button><button class="btn primary" data-cap-accept="${o.offerId}">Accept Capacity Offer</button></div>`:'<div class="connected-success">Accepted voluntarily. Cross-cooperative capacity can now be used.</div>'}</article>`).join(''):'<div class="connected-empty">No cross-cooperative capacity offers right now.</div>'}<div id="connectedCapacityMessage"></div>`;
      card.querySelectorAll('[data-cap-accept]').forEach(b=>b.onclick=()=>respond(b,'ACCEPT'));card.querySelectorAll('[data-cap-reject]').forEach(b=>b.onclick=()=>respond(b,'REJECT'));
    }catch(e){if(e.status===401||e.status===403){card?.remove();lastSignature='';}else{if(!card){card=document.createElement('section');card.id='connectedCapacityOffers';card.className='connected-card';card.style.marginTop='14px';content.appendChild(card);}card.innerHTML=`<div class="connected-error">${esc(friendly(e))}</div>`;lastSignature='ERR';}}
    finally{busy=false;}
  }
  function message(text,type='success'){const el=document.getElementById('connectedCapacityMessage');if(el)el.innerHTML=`<div class="${type==='error'?'connected-error':'connected-success'}">${esc(text)}</div>`;}
  async function respond(button,action){if(busy)return;busy=true;const id=button.dataset.capAccept||button.dataset.capReject;const old=button.textContent;button.disabled=true;button.textContent=action==='ACCEPT'?'Accepting…':'Declining…';try{const r=await post(`/api/connected/worker/capacity-offers/${id}/respond`,{action});message(r.message||`Capacity offer ${action==='ACCEPT'?'accepted':'declined'}.`);lastSignature='';}catch(e){message(friendly(e),'error');button.disabled=false;button.textContent=old;}finally{busy=false;setTimeout(()=>render(true),250);}}
  function schedule(delay=7200){clearTimeout(timer);timer=setTimeout(async()=>{await render();schedule(document.hidden?12000:7200);},delay);}
  function start(){setTimeout(()=>render(true),900);schedule();document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});document.addEventListener('click',e=>{if(e.target.closest('[data-connected-persona],#connectedLogin,[data-open-connected]'))setTimeout(()=>render(true),800);},true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();