(() => {
  'use strict';

  const CUSTOMER_BASE_GRID_GUARD='#connectedContent[data-connected-role="CUSTOMER"]>.connected-grid.connected-customer-grid{position:absolute!important;left:-99999px!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}';

  function neutralizeLegacyCustomerBootGuard(){
    const guard=document.getElementById('sanpaidCustomerBootGuard');
    if(!guard)return;
    // Keep the duplicate base Customer grid isolated, but remove the old
    // preparation placeholder from the selector-facing experience.
    if(guard.textContent!==CUSTOMER_BASE_GRID_GUARD)guard.textContent=CUSTOMER_BASE_GRID_GUARD;
  }

  function alignEvidenceTruth(){
    const strip=document.querySelector('.hero-proof-strip .wrap');
    if(!strip)return;
    [...strip.querySelectorAll('span')].forEach(node=>{
      if(node.textContent.trim()==='5 findings mapped to product controls'){
        node.textContent='Field findings mapped to product controls';
      }
    });
  }

  function alignArchitectureTruth(){
    const card=document.querySelector('#architecture .architecture-card');
    if(!card)return;
    const copy=card.querySelector(':scope>div:first-child>p');
    if(copy)copy.textContent='Role-based workflows, audit-oriented records and a PostgreSQL-ready data layer keep service, payment, complaint and capacity decisions connected.';
    const finalLayer=card.querySelector('.architecture-line span:last-child');
    if(finalLayer)finalLayer.textContent='Data + audit layer';
  }

  function alignCurrentBuildTruth(){
    const bar=document.querySelector('#status .scope-bar');
    if(!bar)return;
    const heading=bar.querySelector('b');
    const copy=bar.querySelector('span');
    if(heading)heading.textContent='WHAT YOU CAN EXPLORE NOW';
    if(copy)copy.textContent='Four role workflows and controlled review interactions are implemented; production integrations and measured pilot impact remain separate.';
  }

  function alignAdminTruth(){
    document.querySelectorAll('#adminFinalApp .af-pill.online').forEach(node=>{
      if(node.textContent.trim()==='Workspace Ready')return;
      const dot=node.querySelector('.af-dot');
      node.textContent='';
      if(dot)node.appendChild(dot);
      node.append(document.createTextNode('Workspace Ready'));
    });
    document.querySelectorAll('#adminFinalApp .af-task-row span').forEach(node=>{
      if(node.textContent.trim()==='Check 1 SLA breach across cooperatives'){
        node.textContent='Review SLA status across cooperatives';
      }
    });
  }

  function apply(){
    neutralizeLegacyCustomerBootGuard();
    alignEvidenceTruth();
    alignArchitectureTruth();
    alignCurrentBuildTruth();
    alignAdminTruth();
    document.documentElement.dataset.selectorReady='true';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();

  // Admin cards render after authentication, so observe only that shell.
  const observeAdmin=()=>{
    const shell=document.getElementById('sihJudgeShell');
    if(!shell){setTimeout(observeAdmin,250);return;}
    new MutationObserver(()=>requestAnimationFrame(alignAdminTruth)).observe(shell,{childList:true,subtree:true});
  };
  observeAdmin();
})();

(() => {
  'use strict';

  const BOOKING_KEY='sanpaid_connected_booking_id';
  const BOOKING_OWNER_KEY='sanpaid_connected_booking_owner_v3';
  const CALL_PANEL_ID='sanpaidAcceptedCallPanel';
  const CALLABLE_STATES=new Set(['ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION']);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let renderTimer=0;
  let renderBusy=false;
  let lastPanelSignature='';
  let ownContactCache={at:0,data:null};

  function sessionGet(key){try{return sessionStorage.getItem(key)||'';}catch{return'';}}
  function sessionSet(key,value){try{value?sessionStorage.setItem(key,String(value)):sessionStorage.removeItem(key);}catch{}}
  function clearBookingArtifacts({owner=false}={}){
    try{
      const keys=[];
      for(let index=0;index<sessionStorage.length;index+=1){const key=sessionStorage.key(index);if(key)keys.push(key);}
      keys.filter(key=>key===BOOKING_KEY||key.startsWith('sanpaid_service_start_token_')||key.startsWith('sanpaid_customer_start_token_')).forEach(key=>sessionStorage.removeItem(key));
      if(owner)sessionStorage.removeItem(BOOKING_OWNER_KEY);
    }catch{}
    ownContactCache={at:0,data:null};
    lastPanelSignature='';
    document.getElementById(CALL_PANEL_ID)?.remove();
  }

  function currentUser(){return window.SanPaidAuth?.getCurrentUser?.()||null;}
  function syncBookingOwner(){
    const user=currentUser();
    if(!user)return;
    const next=`${Number(user.id)||0}:${String(user.email||'').toLowerCase()}`;
    const previous=sessionGet(BOOKING_OWNER_KEY);
    if(previous&&previous!==next)clearBookingArtifacts();
    sessionSet(BOOKING_OWNER_KEY,next);
  }

  async function request(path,opt={}){
    if(window.SanPaidApi?.request)return window.SanPaidApi.request(path,opt);
    const response=await fetch(path,{...opt,credentials:'include',cache:'no-store',headers:{...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(data.message||data.error||`Request failed (${response.status})`);error.status=response.status;throw error;}
    return data;
  }
  const patch=(path,body)=>window.SanPaidApi?.patch?window.SanPaidApi.patch(path,body):request(path,{method:'PATCH',body:JSON.stringify(body)});

  function installForbiddenBookingGuard(){
    if(window.fetch?.__sanpaidBookingGuard)return;
    const original=window.fetch.bind(window);
    const guarded=async(...args)=>{
      const response=await original(...args);
      try{
        const raw=typeof args[0]==='string'?args[0]:args[0]?.url||'';
        const pathname=new URL(raw,location.href).pathname;
        if(response.status===403&&/^\/api\/connected\/customer\/bookings\/\d+/.test(pathname))clearBookingArtifacts();
      }catch{}
      return response;
    };
    guarded.__sanpaidBookingGuard=true;
    window.fetch=guarded;
  }

  function shellOpen(){const shell=document.getElementById('connectedShell');return Boolean(shell&&!shell.classList.contains('hidden'));}
  function connectedRole(){return String(document.getElementById('connectedContent')?.dataset.connectedRole||'').toUpperCase();}

  async function context(){
    const role=connectedRole();
    if(!['CUSTOMER','WORKER'].includes(role))return null;
    if(role==='CUSTOMER'){
      const snapshot=window.SanPaidSync?.getLastSnapshot?.()||await request('/api/connected/snapshot');
      const bookings=Array.isArray(snapshot?.bookings)?snapshot.bookings:[];
      const saved=Number(sessionGet(BOOKING_KEY)||0);
      let booking=saved?bookings.find(item=>Number(item.id)===saved):null;
      if(saved&&!booking){sessionSet(BOOKING_KEY,'');clearBookingArtifacts();}
      booking=booking||bookings[0]||null;
      if(booking?.id)sessionSet(BOOKING_KEY,booking.id);
      return booking?{role,bookingId:Number(booking.id),status:String(booking.status||'')}:null;
    }
    const offers=await request('/api/connected/worker/offers');
    const active=(Array.isArray(offers)?offers:[]).find(item=>item.offerStatus==='ACCEPTED'||CALLABLE_STATES.has(String(item.status||'').toUpperCase()));
    return active?{role,bookingId:Number(active.bookingId),status:String(active.status||'')}:null;
  }

  function panelHost(role){
    if(role==='CUSTOMER')return document.getElementById('connectedCustomerState')?.closest('.connected-card')||document.querySelector('[data-cw-slot="booking"]');
    return document.querySelector('#connectedLifecycleHost .connected-card')||document.getElementById('connectedLifecycleHost')||document.querySelector('[data-cw-slot="current"]');
  }

  async function ownContact(){
    if(ownContactCache.data&&Date.now()-ownContactCache.at<10000)return ownContactCache.data;
    const data=await request('/api/connected/contact/me');
    ownContactCache={at:Date.now(),data};
    return data;
  }

  function queueContactRender(delay=120){clearTimeout(renderTimer);renderTimer=setTimeout(()=>renderContactPanel(),delay);}
  async function renderContactPanel(){
    if(renderBusy||document.hidden||!shellOpen())return;
    syncBookingOwner();
    renderBusy=true;
    try{
      const ctx=await context();
      if(!ctx||!CALLABLE_STATES.has(String(ctx.status).toUpperCase())){document.getElementById(CALL_PANEL_ID)?.remove();lastPanelSignature='';return;}
      const host=panelHost(ctx.role);if(!host)return;
      const [mine,other]=await Promise.all([ownContact(),request(`/api/connected/bookings/${ctx.bookingId}/contact`)]);
      const counterpartLabel=ctx.role==='CUSTOMER'?'Worker':'Customer';
      const signature=JSON.stringify([ctx.role,ctx.bookingId,ctx.status,mine?.phone||'',other?.available,other?.counterpart?.phone||'',other?.counterpart?.name||'']);
      let panel=document.getElementById(CALL_PANEL_ID);
      if(signature===lastPanelSignature&&panel?.isConnected)return;
      lastPanelSignature=signature;
      if(!panel){panel=document.createElement('div');panel.id=CALL_PANEL_ID;panel.className='connected-demo-note';panel.style.marginTop='12px';}
      const callAction=other?.available&&other?.counterpart?.phone
        ? `<a class="btn primary" href="tel:${esc(other.counterpart.phone)}" data-sanpaid-call>Call ${esc(counterpartLabel)}</a>`
        : `<button class="btn secondary" type="button" disabled>Call ${esc(counterpartLabel)}</button>`;
      const availability=other?.available
        ? `${esc(other.counterpart.name||counterpartLabel)} · ${esc(other.counterpart.maskedPhone||'Contact ready')}`
        : `${counterpartLabel} contact is not configured yet.`;
      panel.innerHTML=`<span class="connected-step-label">BOOKING CONTACT</span><h3 style="margin:6px 0">Call During Active Service</h3><p style="margin:0 0 10px">Contact is private to this accepted booking and is available only during the active service journey.</p><div class="connected-form-row"><div class="field"><label>Your mobile number</label><input id="sanpaidOwnPhone" inputmode="tel" autocomplete="tel" placeholder="+91 98765 43210" value="${esc(mine?.phone||'')}"></div><div class="field"><label>Booking contact</label><div style="padding-top:9px"><b>${availability}</b></div></div></div><div class="connected-actions"><button class="btn secondary" type="button" id="sanpaidSavePhone">${mine?.configured?'Update My Number':'Save My Number'}</button>${callAction}</div><div id="sanpaidCallMessage"></div>`;
      host.appendChild(panel);
      panel.querySelector('#sanpaidSavePhone')?.addEventListener('click',async event=>{
        const button=event.currentTarget,input=panel.querySelector('#sanpaidOwnPhone'),message=panel.querySelector('#sanpaidCallMessage');
        const old=button.textContent;button.disabled=true;button.textContent='Saving…';
        try{
          const saved=await patch('/api/connected/contact/me',{phone:input?.value||''});
          ownContactCache={at:Date.now(),data:saved};
          if(message)message.innerHTML='<div class="connected-success" style="margin-top:8px">Contact number saved for accepted-booking calls.</div>';
          lastPanelSignature='';queueContactRender(120);
        }catch(error){if(message)message.innerHTML=`<div class="connected-error" style="margin-top:8px">${esc(error?.message||'Could not save contact number.')}</div>`;button.disabled=false;button.textContent=old;}
      });
    }catch(error){
      if(Number(error?.status)===401)window.SanPaidAuth?.handleExpiredSession?.();
      if([403,404].includes(Number(error?.status)))clearBookingArtifacts();
    }finally{renderBusy=false;}
  }

  function fastSync(){
    if(document.hidden||!shellOpen()||!currentUser())return;
    window.SanPaidSync?.refreshNow?.().catch?.(()=>{});
    queueContactRender(220);
  }

  function installSessionGuards(){
    document.addEventListener('submit',event=>{
      if(event.target?.matches?.('#spuLoginForm'))clearBookingArtifacts({owner:true});
    },true);
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#connectedLogout,#judgeLogout,#logoutBtn,#spuLogout,#spuSwitch,#connectedSwitch'))clearBookingArtifacts({owner:true});
    },true);
    window.addEventListener('sanpaid:session-expired',()=>clearBookingArtifacts({owner:true}));
    window.addEventListener('sanpaid:connected-sync',()=>queueContactRender(120));
    window.addEventListener('pageshow',()=>{syncBookingOwner();queueContactRender(180);});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncBookingOwner();fastSync();}});
  }

  function startSmoothFlow(){
    installForbiddenBookingGuard();
    installSessionGuards();
    syncBookingOwner();
    setInterval(()=>{syncBookingOwner();fastSync();},6000);
    [250,700,1400,2600].forEach(ms=>setTimeout(()=>{syncBookingOwner();queueContactRender();},ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startSmoothFlow,{once:true});else startSmoothFlow();
})();
