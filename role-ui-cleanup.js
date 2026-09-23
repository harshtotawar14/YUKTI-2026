(() => {
  'use strict';

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const movedOrigins=new Map();
  let queued=false;

  const narrowViewport=()=>window.matchMedia('(max-width: 768px)').matches;
  const touchPoints=()=>Number(navigator.maxTouchPoints||0);
  const coarsePointer=()=>window.matchMedia('(pointer: coarse)').matches||touchPoints()>0;
  const screenMin=()=>Math.min(Number(window.screen?.width||Infinity),Number(window.screen?.height||Infinity));
  const mobileUA=()=>/(Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini)/i.test(String(navigator.userAgent||''));
  const phoneLikeTouch=()=>{
    if(!coarsePointer()&&!mobileUA())return false;
    const dpr=Number(window.devicePixelRatio||1);
    return mobileUA()||window.innerWidth<=1100||screenMin()<=900||(window.innerWidth<=1400&&dpr>=1.5);
  };
  const mobile=()=>narrowViewport()||phoneLikeTouch();

  function removeRetiredCustomerGuard(){
    $('#sanpaidCustomerBootGuard')?.remove();
  }

  function syncCustomerMobileMode(){
    const shell=$('#connectedShell'),content=$('#connectedContent');
    if(!shell||!content)return;
    const customer=!shell.classList.contains('hidden')&&String(content.dataset.connectedRole||'').toUpperCase()==='CUSTOMER';
    const active=customer&&mobile();
    shell.classList.toggle('customer-mobile-bootstrap',active);
    shell.dataset.customerMobileMode=active?'true':'false';
    if(active){
      shell.classList.add('customer-reference-page','role-mobile-final');
    }else{
      shell.classList.remove('customer-mobile-ready');
      if(!shell.classList.contains('worker-mobile-final'))shell.classList.remove('role-mobile-final');
    }
    if(customer&&content.querySelector('.cw-dashboard.customer')){
      const source=content.querySelector(':scope>.connected-grid.connected-customer-grid');
      if(source&&!source.querySelector('.connected-card'))source.remove();
    }
  }

  function rememberMovedNode(node,parent,nextSibling){
    if(!(node instanceof Element)||node.dataset.afMoved!=='1'||movedOrigins.has(node))return;
    if(parent?.id==='afDetailBody')return;
    movedOrigins.set(node,{parent,nextSibling});
  }

  function restoreMovedNodes(){
    for(const [node,origin] of [...movedOrigins.entries()]){
      movedOrigins.delete(node);
      const parent=origin?.parent;
      if(!node||!parent?.isConnected)continue;
      try{
        delete node.dataset.afMoved;
        node.hidden=false;
        const sibling=origin.nextSibling;
        if(sibling?.parentNode===parent)parent.insertBefore(node,sibling);
        else parent.appendChild(node);
      }catch{}
    }
  }

  function hideAdminFallbacks(){
    $$('#afDetailBody>[data-af-fallback]').forEach(node=>node.hidden=true);
  }

  function closeAdminProfileMenu(){
    const menu=$('#adminFinalApp .af-profile-menu'),profile=$('#adminFinalApp .af-profile');
    if(menu)menu.hidden=true;
    profile?.setAttribute('aria-expanded','false');
  }

  function ensureAdminProfileMenu(){
    const app=$('#adminFinalApp');if(!app)return;
    const profile=$('.af-profile',app);if(!profile||profile.dataset.finalProfileReady==='1')return;
    profile.dataset.finalProfileReady='1';
    profile.setAttribute('role','button');
    profile.setAttribute('tabindex','0');
    profile.setAttribute('aria-haspopup','menu');
    profile.setAttribute('aria-expanded','false');
    profile.setAttribute('aria-label','Open administration account menu');

    const menu=document.createElement('div');
    menu.className='af-profile-menu';
    menu.hidden=true;
    menu.setAttribute('role','menu');
    menu.innerHTML=`
      <button type="button" role="menuitem" data-af-profile-action="switch"><span>↔</span><span><b>Switch Role</b><small>Return to SanPaid role access</small></span></button>
      <button type="button" role="menuitem" class="danger" data-af-profile-action="logout"><span>⏻</span><span><b>Logout</b><small>End this review session</small></span></button>`;
    $('.af-top-actions',app)?.appendChild(menu);

    const toggle=()=>{
      const open=menu.hidden;
      menu.hidden=!open;
      profile.setAttribute('aria-expanded',String(open));
      if(open)menu.querySelector('button')?.focus();
    };
    profile.addEventListener('click',toggle);
    profile.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}
      if(event.key==='Escape')closeAdminProfileMenu();
    });
    menu.addEventListener('click',async event=>{
      const button=event.target.closest('[data-af-profile-action]');if(!button)return;
      closeAdminProfileMenu();
      const auth=window.SanPaidAuth;
      if(button.dataset.afProfileAction==='switch'){
        await auth?.logout?.({silent:true});
        auth?.openRoleChooser?.();
      }else if(button.dataset.afProfileAction==='logout'){
        await auth?.logout?.();
      }
    });
  }

  function reconcile(){
    removeRetiredCustomerGuard();
    syncCustomerMobileMode();
    ensureAdminProfileMenu();
  }

  const observer=new MutationObserver(records=>{
    let adminAppRemoved=false;
    for(const record of records){
      if(record.type==='childList'){
        for(const node of record.removedNodes){
          rememberMovedNode(node,record.target,record.nextSibling);
          if(node instanceof Element&&(node.id==='adminFinalApp'||node.querySelector?.('#adminFinalApp')))adminAppRemoved=true;
        }
        if(record.target?.id==='afDetailBody'&&record.addedNodes.length)hideAdminFallbacks();
      }
    }
    if(adminAppRemoved)queueMicrotask(restoreMovedNodes);
    schedule();
  });

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;reconcile();});
  }

  document.addEventListener('click',event=>{
    if(event.target.closest?.('#adminFinalApp [data-af-key]'))hideAdminFallbacks();
    const app=$('#adminFinalApp');
    if(app&&!event.target.closest?.('.af-profile,.af-profile-menu'))closeAdminProfileMenu();
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAdminProfileMenu();});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  window.addEventListener('sanpaid:connected-sync',schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','data-connected-role','data-admin-role']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();

  window.SanPaidRoleUICleanup=Object.freeze({
    refresh:schedule,
    restoreAdminModules:restoreMovedNodes,
    mobileMode:mobile
  });
})();
