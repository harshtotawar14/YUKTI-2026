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
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>`₹${Number(n||0).toLocaleString('en-IN')}`;

  function toast(message,type='success'){
    let wrap=$('#toastWrap');
    if(!wrap){wrap=document.createElement('div');wrap.id='toastWrap';wrap.className='toast-wrap';document.body.appendChild(wrap);}
    const node=document.createElement('div');node.className=`toast ${type}`;node.textContent=message;wrap.appendChild(node);setTimeout(()=>node.remove(),3000);
  }

  function retireLegacyState(){
    try{localStorage.removeItem(LEGACY_STATE_KEY);}catch{}
    const shell=$('#appShell');if(shell)shell.classList.add('hidden');
    const resume=$('#resumeDemo');if(resume)resume.classList.add('hidden');
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

  function rememberService(service){
    if(!service)return;
    try{sessionStorage.setItem(PREFILL_SERVICE_KEY,String(service));}catch{}
  }

  async function openRole(role,persona=null,mode='login'){
    const auth=await waitForAuth();
    if(!auth){toast('Login workspace is still loading. Please retry.','warn');return false;}
    const current=auth.getRole?.();
    if(current===role&&auth.isAuthenticated?.())return auth.openRoleWorkspace(role,persona);
    auth.open(role,mode,persona);
    return true;
  }

  async function startBooking(service){rememberService(service||$('#heroService')?.value||'Electrician');return openRole('CUSTOMER','CUSTOMER','login');}
  async function showRoles(){const auth=await waitForAuth();if(!auth){toast('Role access is still loading.','warn');return;}auth.open(auth.getRole?.()||'CUSTOMER','login');}
  async function showWorkerRegistration(){return openRole('WORKER','WORKER_A','signup');}

  function wireLanding(){
    const getStarted=$('#getStarted');if(getStarted)getStarted.onclick=showRoles;
    const coop=$('#coopLogin');if(coop)coop.onclick=()=>openRole('COOPERATIVE_ADMIN',null,'login');
    const join=$('#joinWorker');if(join)join.onclick=showWorkerRegistration;
    const book=$('#bookServiceHero');if(book)book.onclick=()=>startBooking($('#heroService')?.value||'Electrician');
    const search=$('#heroSearch');if(search)search.onclick=()=>{const area=$('#heroArea')?.value.trim();if(!area){toast('Enter your area first.','error');return;}try{sessionStorage.setItem('sanpaid_prefill_area_v1',area);}catch{}startBooking($('#heroService')?.value||'Electrician');};
    document.addEventListener('click',e=>{const card=e.target.closest?.('#serviceGrid [data-service]');if(card){e.preventDefault();startBooking(card.dataset.service);}});
  }

  function start(){retireLegacyState();renderServices();wireLanding();}

  window.SanPaidDemo={
    reset(){try{localStorage.removeItem(LEGACY_STATE_KEY);sessionStorage.removeItem(PREFILL_SERVICE_KEY);}catch{}location.reload();},
    state:()=>({mode:'CONNECTED_BACKEND_ONLY'}),
    showRoles,
    startBooking
  };
  window.SanPaidLanding={services:SERVICES,startBooking,showRoles};

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();