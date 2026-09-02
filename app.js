(() => {
  'use strict';

  const BUILD={release:'mobile-runtime-v64',source:'harshtotawar14/YUKTI-2026',branch:'main',loadedAt:new Date().toISOString()};
  window.__SANPAID_BUILD__=Object.freeze(BUILD);
  console.info('[SanPaid build]',BUILD);

  const SERVICES=[
    {name:'Electrician',icon:'⚡',price:249},
    {name:'Plumber',icon:'🔧',price:279},
    {name:'Carpenter',icon:'🪚',price:299},
    {name:'Painter',icon:'🎨',price:349},
    {name:'Cleaner',icon:'🧹',price:199},
    {name:'Domestic Help',icon:'🏠',price:229},
    {name:'Caregiver',icon:'🤝',price:399},
    {name:'Driver',icon:'🚗',price:349},
    {name:'Gardener',icon:'🌿',price:249},
    {name:'Technician',icon:'🛠️',price:299}
  ];
  const LEGACY_STATE_KEY='sanpaid_demo_state_v2';
  const PREFILL_SERVICE_KEY='sanpaid_prefill_service_v1';
  const PREFILL_AREA_KEY='sanpaid_prefill_area_v1';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>`₹${Number(n||0).toLocaleString('en-IN')}`;
  let mobileDrawerReturnFocus=null;

  function toast(message,type='success'){
    let wrap=$('#toastWrap');
    if(!wrap){wrap=document.createElement('div');wrap.id='toastWrap';wrap.className='toast-wrap';document.body.appendChild(wrap);}
    const node=document.createElement('div');node.className=`toast ${type}`;node.textContent=message;wrap.appendChild(node);setTimeout(()=>node.remove(),3000);
  }

  function retireLegacyState(){
    try{localStorage.removeItem(LEGACY_STATE_KEY);}catch{}
    $('#appShell')?.classList.add('hidden');
    $('#resumeDemo')?.classList.add('hidden');
  }

  function renderServices(){
    const grid=$('#serviceGrid');
    if(grid&&!grid.dataset.connectedCatalog){
      grid.innerHTML=SERVICES.map(s=>`<button class="card service-card" type="button" data-service="${esc(s.name)}"><span class="service-icon">${s.icon}</span><strong>${esc(s.name)}</strong><span class="price">From ${money(s.price)}</span></button>`).join('');
      grid.dataset.connectedCatalog='1';
    }
    const hero=$('#heroService');
    if(hero&&!hero.options.length)hero.innerHTML=SERVICES.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');
  }

  async function waitForAuth(attempts=50){
    for(let i=0;i<attempts;i++){
      if(window.SanPaidAuth?.open&&window.SanPaidAuth?.openRoleWorkspace)return window.SanPaidAuth;
      await new Promise(r=>setTimeout(r,80));
    }
    return null;
  }

  function rememberService(service){try{service?sessionStorage.setItem(PREFILL_SERVICE_KEY,String(service)):sessionStorage.removeItem(PREFILL_SERVICE_KEY);}catch{}}
  function rememberArea(area){try{area?sessionStorage.setItem(PREFILL_AREA_KEY,String(area)):sessionStorage.removeItem(PREFILL_AREA_KEY);}catch{}}

  async function startBooking(service){
    rememberService(service||$('#heroService')?.value||'Electrician');
    const auth=await waitForAuth();
    if(!auth){toast('Login workspace is still loading. Please retry.','warn');return false;}
    const current=auth.getRole?.();
    if(current==='CUSTOMER'&&auth.isAuthenticated?.())return auth.openRoleWorkspace('CUSTOMER','CUSTOMER');
    auth.open('CUSTOMER','login','CUSTOMER');
    return true;
  }

  function ensureDrawerStructure(){
    const drawer=$('#mobileDrawer');
    if(!drawer||drawer.dataset.mobileReady==='1')return drawer;
    drawer.dataset.mobileReady='1';
    drawer.setAttribute('role','dialog');
    drawer.setAttribute('aria-modal','true');
    drawer.setAttribute('aria-label','SanPaid mobile navigation');
    const title=document.createElement('div');
    title.className='drawer-title';
    title.innerHTML='<strong>SanPaid Menu</strong><button type="button" class="drawer-close" aria-label="Close menu">✕</button>';
    drawer.insertBefore(title,drawer.firstChild);
    title.querySelector('.drawer-close').addEventListener('click',()=>closeMobileDrawer(true));
    return drawer;
  }

  function ensureDrawerScrim(){
    let scrim=$('#mobileDrawerScrim');
    if(scrim)return scrim;
    scrim=document.createElement('div');
    scrim.id='mobileDrawerScrim';
    scrim.className='mobile-drawer-scrim hidden';
    scrim.setAttribute('aria-hidden','true');
    scrim.addEventListener('click',()=>closeMobileDrawer(true));
    document.body.appendChild(scrim);
    return scrim;
  }

  function drawerFocusable(drawer){
    return [...drawer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);
  }

  function setDrawerOpenState(open){
    const drawer=$('#mobileDrawer'),btn=$('#menuBtn'),scrim=ensureDrawerScrim();
    if(!drawer||!btn)return;
    drawer.classList.toggle('hidden',!open);
    drawer.setAttribute('aria-hidden',open?'false':'true');
    btn.setAttribute('aria-expanded',open?'true':'false');
    btn.setAttribute('aria-label',open?'Close menu':'Open menu');
    scrim.classList.toggle('hidden',!open);
    scrim.setAttribute('aria-hidden',open?'false':'true');
    document.body.classList.toggle('mobile-drawer-open',open);
  }

  function openMobileDrawer(){
    const drawer=ensureDrawerStructure(),btn=$('#menuBtn');
    if(!drawer||!btn||window.innerWidth>960)return;
    mobileDrawerReturnFocus=document.activeElement;
    setDrawerOpenState(true);
    requestAnimationFrame(()=>drawer.querySelector('.drawer-close')?.focus());
  }

  function closeMobileDrawer(restoreFocus=true){
    const drawer=$('#mobileDrawer');
    if(!drawer)return;
    setDrawerOpenState(false);
    const target=mobileDrawerReturnFocus;
    mobileDrawerReturnFocus=null;
    if(restoreFocus&&target?.isConnected)requestAnimationFrame(()=>target.focus());
  }

  function recoverDrawerState(){
    const drawer=$('#mobileDrawer');
    if(!drawer)return;
    const shouldBeClosed=drawer.classList.contains('hidden')||drawer.getAttribute('aria-hidden')==='true'||window.innerWidth>960;
    if(shouldBeClosed)setDrawerOpenState(false);
  }

  function toggleMobileDrawer(){
    const drawer=ensureDrawerStructure();
    if(!drawer)return;
    drawer.classList.contains('hidden')?openMobileDrawer():closeMobileDrawer(true);
  }

  function wireMobileNavigation(){
    const drawer=ensureDrawerStructure(),btn=$('#menuBtn');
    if(!drawer||!btn)return;
    ensureDrawerScrim();
    btn.addEventListener('click',toggleMobileDrawer);
    drawer.addEventListener('click',event=>{
      const link=event.target.closest('a[href^="#"]');
      if(link){queueMicrotask(()=>closeMobileDrawer(false));return;}
      const action=event.target.closest('button');
      if(action&&!action.classList.contains('drawer-close'))queueMicrotask(()=>closeMobileDrawer(false));
    });
    document.addEventListener('keydown',event=>{
      if(drawer.classList.contains('hidden'))return;
      if(event.key==='Escape'){event.preventDefault();closeMobileDrawer(true);return;}
      if(event.key!=='Tab')return;
      const nodes=drawerFocusable(drawer);if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    window.addEventListener('resize',()=>{if(window.innerWidth>960)closeMobileDrawer(false);},{passive:true});
    window.addEventListener('pageshow',recoverDrawerState,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(recoverDrawerState,120),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)recoverDrawerState();});
  }

  function wireLandingUtilities(){
    const book=$('#bookServiceHero');
    if(book)book.onclick=()=>startBooking($('#heroService')?.value||'Electrician');

    const search=$('#heroSearch');
    if(search)search.onclick=()=>{
      const area=$('#heroArea')?.value.trim();
      if(!area){toast('Enter your area first.','error');return;}
      rememberArea(area);
      startBooking($('#heroService')?.value||'Electrician');
    };

    document.addEventListener('click',event=>{
      const card=event.target.closest?.('#serviceGrid [data-service]');
      if(!card)return;
      event.preventDefault();
      startBooking(card.dataset.service);
    });
  }

  function start(){
    retireLegacyState();
    renderServices();
    wireMobileNavigation();
    wireLandingUtilities();
    recoverDrawerState();
  }

  window.SanPaidDemo={
    reset(){try{localStorage.removeItem(LEGACY_STATE_KEY);sessionStorage.removeItem(PREFILL_SERVICE_KEY);sessionStorage.removeItem(PREFILL_AREA_KEY);}catch{}location.reload();},
    state:()=>({mode:'CONNECTED_BACKEND_ONLY'}),
    showRoles:async()=>{const auth=await waitForAuth();auth?.open?.(auth.getRole?.()||'CUSTOMER','login',auth.getPersona?.()||null);},
    startBooking
  };
  window.SanPaidLanding={services:SERVICES,startBooking,openMobileDrawer,closeMobileDrawer,recoverDrawerState};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();