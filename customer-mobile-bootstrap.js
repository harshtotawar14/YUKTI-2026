(() => {
  'use strict';

  const narrowViewport=()=>window.matchMedia('(max-width: 768px)').matches;
  const touchPoints=()=>Number(navigator.maxTouchPoints||0);
  const coarsePointer=()=>window.matchMedia('(pointer: coarse)').matches||touchPoints()>0;
  const screenMin=()=>Math.min(Number(window.screen?.width||Infinity),Number(window.screen?.height||Infinity));
  const phoneLikeTouch=()=>{
    if(!coarsePointer())return false;
    const dpr=Number(window.devicePixelRatio||1);
    return window.innerWidth<=1100||screenMin()<=820||(window.innerWidth<=1400&&dpr>=1.5);
  };
  const mobile=()=>narrowViewport()||phoneLikeTouch();

  function apply(){
    const shell=document.getElementById('connectedShell');
    const content=document.getElementById('connectedContent');
    if(!shell||!content)return;
    const isCustomer=!shell.classList.contains('hidden')&&String(content.dataset.connectedRole||'').toUpperCase()==='CUSTOMER';
    const active=isCustomer&&mobile();
    shell.classList.toggle('customer-mobile-bootstrap',active);
    shell.dataset.customerMobileMode=active?'true':'false';
    if(active)shell.classList.add('customer-reference-page');
    else shell.classList.remove('customer-mobile-ready');
  }

  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-connected-role']});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
})();
