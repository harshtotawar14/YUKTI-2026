(() => {
  'use strict';

  let loading=null;
  let queued=false;
  let retryTimer=0;
  let lastRole='';

  function activeConnectedRole(){
    const shell=document.getElementById('connectedShell');
    const content=document.getElementById('connectedContent');
    if(!shell||shell.classList.contains('hidden')||!content)return '';
    const role=String(content.dataset.connectedRole||'').toUpperCase();
    return role==='CUSTOMER'||role==='WORKER'?role:'';
  }

  function signal(role){
    try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'review-runtime-role-ready',role,at:Date.now()}}));}catch{}
  }

  async function ensureBundle(){
    if(!window.SanPaidReviewRuntime?.enabled)return;
    const role=activeConnectedRole();
    if(!role){lastRole='';clearTimeout(retryTimer);return;}
    if(document.querySelector(`#cwDashboard.${role.toLowerCase()}`))return;

    const loader=window.SanPaidBootstrap?.loadCustomerWorker;
    if(typeof loader==='function'){
      if(!loading)loading=Promise.resolve(loader()).catch(error=>console.warn('[SanPaid review] customer/worker bundle load failed',error?.message||error)).finally(()=>{loading=null;});
      await loading;
    }

    signal(role);
    if(lastRole!==role)lastRole=role;
    clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>{
      if(activeConnectedRole()===role&&!document.querySelector(`#cwDashboard.${role.toLowerCase()}`))signal(role);
    },220);
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensureBundle();});
  }

  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-connected-role']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
