(() => {
  'use strict';

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
    title.querySelector('.drawer-close').addEventListener('click',closeMobileDrawer);
    return drawer;
  }

  function ensureDrawerScrim(){
    let scrim=$('#mobileDrawerScrim');
    if(scrim)return scrim;
    scrim=document.createElement('div');
    scrim.id='mobileDrawerScrim';
    scrim.className='mobile-drawer-scrim hidden';
    scrim.setAttribute('aria-hidden','true');
    scrim.addEventListener('click',closeMobileDrawer);
    document.body.appendChild(scrim);
    return scrim;
  }

  function drawerFocusable(drawer){
    return [...drawer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);
  }

  function openMobileDrawer(){
    const drawer=ensureDrawerStructure(),btn=$('#menuBtn');
    if(!drawer||!btn)return;
    mobileDrawerReturnFocus=document.activeElement;
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
    btn.setAttribute('aria-label','Close menu');
    ensureDrawerScrim().classList.remove('hidden');
    document.body.classList.add('mobile-drawer-open');
    requestAnimationFrame(()=>drawer.querySelector('.drawer-close')?.focus());
  }

  function closeMobileDrawer(){
    const drawer=$('#mobileDrawer'),btn=$('#menuBtn'),scrim=$('#mobileDrawerScrim');
    if(!drawer)return;
    drawer.classList.add('hidden');
    drawer.setAttribute('aria-hidden','true');
    btn?.setAttribute('aria-expanded','false');
    btn?.setAttribute('aria-label','Open menu');
    scrim?.classList.add('hidden');
    document.body.classList.remove('mobile-drawer-open');
    const target=mobileDrawerReturnFocus;
    mobileDrawerReturnFocus=null;
    if(target?.isConnected)requestAnimationFrame(()=>target.focus());
  }

  function toggleMobileDrawer(){
    const drawer=ensureDrawerStructure();
    if(!drawer)return;
    drawer.classList.contains('hidden')?openMobileDrawer():closeMobileDrawer();
  }

  function wireMobileNavigation(){
    const drawer=ensureDrawerStructure(),btn=$('#menuBtn');
    if(!drawer||!btn)return;
    ensureDrawerScrim();
    btn.addEventListener('click',toggleMobileDrawer);
    drawer.addEventListener('click',event=>{
      if(event.target.closest('a[href^="#"]'))closeMobileDrawer();
    });
    document.addEventListener('keydown',event=>{
      if(drawer.classList.contains('hidden'))return;
      if(event.key==='Escape'){event.preventDefault();closeMobileDrawer();return;}
      if(event.key!=='Tab')return;
      const nodes=drawerFocusable(drawer);if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    window.addEventListener('resize',()=>{if(window.innerWidth>960&&!drawer.classList.contains('hidden'))closeMobileDrawer();},{passive:true});
  }

  function wireLandingUtilities(){
    // Role-access buttons such as #getStarted, #coopLogin and Worker demo buttons
    // are owned only by auth-unified.js. This file owns service selection + public mobile navigation.
    const book=$('#bookServiceHero');
    if(book)book.onclick=()=>startBooking($('#heroService')?.value||'Electrician');

    const search=$('#heroSearch');
    if(search)search.onclick=()=>{
      const area=$('#heroArea')?.value.trim();
      if(!area){toast('Enter your area first.','error');return;}
      rememberArea(area);
      startBooking($('#heroService')?.value||'Electrician');
    };

    document.addEventListener('click',e=>{
      const card=e.target.closest?.('#serviceGrid [data-service]');
      if(!card)return;
      e.preventDefault();
      startBooking(card.dataset.service);
    });
  }

  function start(){retireLegacyState();renderServices();wireMobileNavigation();wireLandingUtilities();}

  window.SanPaidDemo={
    reset(){try{localStorage.removeItem(LEGACY_STATE_KEY);sessionStorage.removeItem(PREFILL_SERVICE_KEY);sessionStorage.removeItem(PREFILL_AREA_KEY);}catch{}location.reload();},
    state:()=>({mode:'CONNECTED_BACKEND_ONLY'}),
    showRoles:async()=>{const auth=await waitForAuth();auth?.open?.(auth.getRole?.()||'CUSTOMER','login',auth.getPersona?.()||null);},
    startBooking
  };
  window.SanPaidLanding={services:SERVICES,startBooking,closeMobileDrawer};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();