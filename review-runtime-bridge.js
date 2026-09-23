(() => {
  'use strict';

  let loading=null;
  let queued=false;

  function activeConnectedRole(){
    const shell=document.getElementById('connectedShell');
    const content=document.getElementById('connectedContent');
    if(!shell||shell.classList.contains('hidden')||!content)return '';
    const role=String(content.dataset.connectedRole||'').toUpperCase();
    return role==='CUSTOMER'||role==='WORKER'?role:'';
  }

  async function ensureBundle(){
    if(!window.SanPaidReviewRuntime?.enabled||!activeConnectedRole())return;
    if(document.querySelector('#cwDashboard'))return;
    const loader=window.SanPaidBootstrap?.loadCustomerWorker;
    if(typeof loader!=='function')return;
    if(!loading)loading=Promise.resolve(loader()).catch(error=>console.warn('[SanPaid review] customer/worker bundle load failed',error?.message||error)).finally(()=>{loading=null;});
    await loading;
    try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'review-runtime-bundle',at:Date.now()}}));}catch{}
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensureBundle();});
  }

  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-connected-role']});
  window.addEventListener('sanpaid:connected-sync',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
