(() => {
  'use strict';

  const BUILD={release:'connected-backend-rebuild',runtime:'v70',source:'harshtotawar14/YUKTI-2026',branch:'main',loadedAt:new Date().toISOString()};
  window.__SANPAID_BUILD__=Object.freeze(BUILD);
  console.info('[SanPaid build]',BUILD);

  const FALLBACK_SERVICES=[
    {name:'Electrician',icon:'EL'},{name:'Plumber',icon:'PL'},{name:'Carpenter',icon:'CP'},{name:'Painter',icon:'PT'},
    {name:'Cleaner',icon:'CL'},{name:'Domestic Helper',icon:'DH'},{name:'Caregiver',icon:'CG'},{name:'Driver',icon:'DR'},
    {name:'Gardener',icon:'GD'},{name:'Appliance Technician',icon:'AT'},{name:'AC Technician',icon:'AC'},
    {name:'RO Technician',icon:'RO'},{name:'Pest Control Worker',icon:'PC'},{name:'Community Technician',icon:'CT'},
    {name:'General Technician',icon:'GT'}
  ];
  const PREFILL_SERVICE_KEY='sanpaid_prefill_service_v1';
  const PREFILL_AREA_KEY='sanpaid_prefill_area_v1';
  const $=(selector,root=document)=>root.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money=value=>`₹${Number(value||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
  const iconFor=name=>String(name||'SV').split(/\s+/).map(part=>part[0]||'').join('').slice(0,2).toUpperCase()||'SV';
  let catalog=[];
  let catalogSource='LOADING';
  let catalogLoading=false;
  let mobileDrawerReturnFocus=null;

  function toast(message,type='success'){
    let wrap=$('#toastWrap');
    if(!wrap){wrap=document.createElement('div');wrap.id='toastWrap';wrap.className='toast-wrap';document.body.appendChild(wrap);}
    const node=document.createElement('div');node.className=`toast ${type}`;node.textContent=message;wrap.appendChild(node);setTimeout(()=>node.remove(),3000);
  }

  function normalizedCatalog(rows){
    return (Array.isArray(rows)?rows:[]).filter(item=>item?.name).map(item=>({
      id:Number(item.id||0)||null,
      name:String(item.name),
      icon:String(item.icon||iconFor(item.name)),
      basePrice:Number.isFinite(Number(item.basePrice))?Number(item.basePrice):null,
      emergencyCharge:Number.isFinite(Number(item.emergencyCharge))?Number(item.emergencyCharge):null,
      description:String(item.description||''),
      category:String(item.category||''),
      averageDurationMinutes:Number(item.averageDurationMinutes||0)||null
    }));
  }

  function renderServices(){
    const services=catalog.length?catalog:FALLBACK_SERVICES;
    const grid=$('#serviceGrid');
    if(grid){
      grid.innerHTML=services.map(service=>{
        const price=service.basePrice!==null&&service.basePrice!==undefined
          ?`<span class="price">Configured base ${money(service.basePrice)}</span>`
          :'<span class="price">Current pricing loads after connection</span>';
        return `<button class="card service-card" type="button" data-service="${esc(service.name)}"><span class="service-icon" aria-hidden="true">${esc(service.icon||iconFor(service.name))}</span><strong>${esc(service.name)}</strong>${price}</button>`;
      }).join('');
      grid.dataset.catalogSource=catalogSource;
    }
    const hero=$('#heroService');
    if(hero){
      const selected=hero.value;
      hero.innerHTML=services.map(service=>`<option value="${esc(service.name)}">${esc(service.name)}</option>`).join('');
      if(selected&&services.some(service=>service.name===selected))hero.value=selected;
    }
    const status=$('#catalogStatus');
    const retry=$('#catalogRetry');
    if(status){
      status.dataset.state=catalogSource.toLowerCase();
      status.textContent=catalogSource==='DATABASE_CONFIGURATION'
        ?`${services.length} connected services loaded from database configuration.`
        :catalogSource==='LOADING'
          ?'Checking connected service catalog…'
          :'Connected catalog is temporarily unavailable. Service names are shown without current pricing.';
    }
    if(retry){
      retry.hidden=catalogSource!=='STATIC_NAMES_ONLY';
      retry.disabled=catalogLoading;
    }
  }

  async function loadServiceCatalog(){
    if(catalogLoading)return;
    catalogLoading=true;
    catalogSource='LOADING';
    renderServices();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      if(!window.SanPaidApi?.get)throw new Error('api_client_unavailable');
      const data=await window.SanPaidApi.get('/api/public/services',{bearer:false,headers:{Accept:'application/json'},signal:controller.signal,timeoutMs:8000});
      if(!Array.isArray(data.services))throw new Error(data.message||'catalog_unavailable');
      catalog=normalizedCatalog(data.services);
      if(!catalog.length)throw new Error('empty_catalog');
      catalogSource='DATABASE_CONFIGURATION';
    }catch(error){
      catalog=[];
      catalogSource='STATIC_NAMES_ONLY';
      console.warn('[SanPaid catalog] connected service catalog unavailable; displaying service names without current pricing claim.',error?.message||error);
    }finally{
      clearTimeout(timeout);
      catalogLoading=false;
    }
    renderServices();
    window.dispatchEvent(new CustomEvent('sanpaid:service-catalog',{detail:{source:catalogSource,services:catalog.length?catalog:FALLBACK_SERVICES}}));
  }

  async function waitForAuth(attempts=50){
    for(let index=0;index<attempts;index++){
      if(window.SanPaidAuth?.open&&window.SanPaidAuth?.openRoleWorkspace)return window.SanPaidAuth;
      await new Promise(resolve=>setTimeout(resolve,80));
    }
    return null;
  }

  function rememberService(service){try{service?sessionStorage.setItem(PREFILL_SERVICE_KEY,String(service)):sessionStorage.removeItem(PREFILL_SERVICE_KEY);}catch{}}
  function rememberArea(area){try{area?sessionStorage.setItem(PREFILL_AREA_KEY,String(area)):sessionStorage.removeItem(PREFILL_AREA_KEY);}catch{}}

  async function startBooking(service){
    rememberService(service||$('#heroService')?.value||catalog[0]?.name||FALLBACK_SERVICES[0].name);
    const auth=await waitForAuth();
    if(!auth){toast('Login workspace is still loading. Please retry.','warn');return false;}
    if(auth.getRole?.()==='CUSTOMER'&&auth.isAuthenticated?.())return auth.openRoleWorkspace('CUSTOMER','CUSTOMER');
    auth.open('CUSTOMER','CUSTOMER');
    return true;
  }

  function ensureDrawerStructure(){
    const drawer=$('#mobileDrawer');
    if(!drawer||drawer.dataset.mobileReady==='1')return drawer;
    drawer.dataset.mobileReady='1';drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','SanPaid mobile navigation');
    const title=document.createElement('div');title.className='drawer-title';title.innerHTML='<strong>SanPaid Menu</strong><button type="button" class="drawer-close" aria-label="Close menu">×</button>';
    drawer.insertBefore(title,drawer.firstChild);title.querySelector('.drawer-close').addEventListener('click',()=>closeMobileDrawer(true));return drawer;
  }

  function ensureDrawerScrim(){
    let scrim=$('#mobileDrawerScrim');if(scrim)return scrim;
    scrim=document.createElement('div');scrim.id='mobileDrawerScrim';scrim.className='mobile-drawer-scrim hidden';scrim.setAttribute('aria-hidden','true');scrim.addEventListener('click',()=>closeMobileDrawer(true));document.body.appendChild(scrim);return scrim;
  }

  function drawerFocusable(drawer){return [...drawer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>element.getClientRects().length);}

  function setDrawerOpenState(open){
    const drawer=$('#mobileDrawer'),button=$('#menuBtn'),scrim=ensureDrawerScrim();if(!drawer||!button)return;
    drawer.classList.toggle('hidden',!open);drawer.setAttribute('aria-hidden',open?'false':'true');button.setAttribute('aria-expanded',open?'true':'false');button.setAttribute('aria-label',open?'Close menu':'Open menu');scrim.classList.toggle('hidden',!open);scrim.setAttribute('aria-hidden',open?'false':'true');document.body.classList.toggle('mobile-drawer-open',open);
  }
  function openMobileDrawer(){const drawer=ensureDrawerStructure(),button=$('#menuBtn');if(!drawer||!button||window.innerWidth>768)return;mobileDrawerReturnFocus=document.activeElement;setDrawerOpenState(true);requestAnimationFrame(()=>drawer.querySelector('.drawer-close')?.focus());}
  function closeMobileDrawer(restoreFocus=true){const drawer=$('#mobileDrawer');if(!drawer)return;setDrawerOpenState(false);const target=mobileDrawerReturnFocus;mobileDrawerReturnFocus=null;if(restoreFocus&&target?.isConnected)requestAnimationFrame(()=>target.focus());}
  function recoverDrawerState(){const drawer=$('#mobileDrawer');if(!drawer)return;const closed=drawer.classList.contains('hidden')||drawer.getAttribute('aria-hidden')==='true'||window.innerWidth>768;if(closed)setDrawerOpenState(false);}
  function toggleMobileDrawer(){const drawer=ensureDrawerStructure();if(drawer)drawer.classList.contains('hidden')?openMobileDrawer():closeMobileDrawer(true);}

  function wireMobileNavigation(){
    const drawer=ensureDrawerStructure(),button=$('#menuBtn');if(!drawer||!button)return;ensureDrawerScrim();button.addEventListener('click',toggleMobileDrawer);
    drawer.addEventListener('click',event=>{const action=event.target.closest('a[href^="#"],button');if(action&&!action.classList.contains('drawer-close'))queueMicrotask(()=>closeMobileDrawer(false));});
    document.addEventListener('keydown',event=>{if(drawer.classList.contains('hidden'))return;if(event.key==='Escape'){event.preventDefault();closeMobileDrawer(true);return;}if(event.key!=='Tab')return;const nodes=drawerFocusable(drawer);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
    window.addEventListener('resize',()=>{if(window.innerWidth>768)closeMobileDrawer(false);},{passive:true});window.addEventListener('pageshow',recoverDrawerState,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(recoverDrawerState,120),{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)recoverDrawerState();});
  }

  function wireLandingUtilities(){
    $('#bookServiceHero')?.addEventListener('click',()=>startBooking($('#heroService')?.value));
    $('#heroSearch')?.addEventListener('click',()=>{const area=$('#heroArea')?.value.trim();if(!area){toast('Enter your area first.','error');return;}rememberArea(area);startBooking($('#heroService')?.value);});
    document.addEventListener('click',event=>{const card=event.target.closest?.('#serviceGrid [data-service]');if(!card)return;event.preventDefault();startBooking(card.dataset.service);});
    $('#catalogRetry')?.addEventListener('click',loadServiceCatalog);
  }

  function start(){
    renderServices();wireMobileNavigation();wireLandingUtilities();recoverDrawerState();loadServiceCatalog();
  }

  window.SanPaidLanding={
    get services(){return catalog.length?catalog:FALLBACK_SERVICES;},
    get catalogSource(){return catalogSource;},
    reloadServiceCatalog:loadServiceCatalog,startBooking,openMobileDrawer,closeMobileDrawer,recoverDrawerState
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
