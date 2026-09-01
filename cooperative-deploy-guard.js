(() => {
  'use strict';

  const TOKEN_KEY='sanpaid_judge_demo_token_v1';
  let timer=0;
  let lastState='';

  function token(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return ''}}
  function isCooperativeOpen(){
    const shell=document.getElementById('sihJudgeShell');
    if(!shell||shell.classList.contains('judge-hidden'))return false;
    const role=String(window.SanPaidAuth?.getRole?.()||shell.dataset.adminRole||'').toUpperCase();
    return role==='COOPERATIVE_ADMIN';
  }

  async function probe(){
    if(!isCooperativeOpen())return;
    const headers={};const t=token();if(t)headers.Authorization=`Bearer ${t}`;
    try{
      const r=await fetch('/api/cooperative-admin/workspace',{credentials:'include',cache:'no-store',headers});
      if(r.ok){lastState='ready';return;}
      // Authentication errors should remain visible to the normal auth/session
      // flow. Only an unavailable/new-route failure should downgrade the UI.
      if([401,403].includes(r.status))return;
      fallback(`Connected Cooperative workspace is not available on the current backend deployment (${r.status}).`);
    }catch{
      fallback('Connected Cooperative workspace is temporarily unavailable.');
    }
  }

  function fallback(message){
    if(lastState==='fallback')return;lastState='fallback';
    const shell=document.getElementById('sihJudgeShell');
    const content=document.getElementById('judgeContent');
    if(!shell||!content)return;
    shell.classList.remove('cooperative-govtech');
    document.getElementById('coopSidebar')?.remove();
    document.getElementById('coopNavToggle')?.remove();
    document.getElementById('coopProfileChip')?.remove();
    document.getElementById('coopLastSync')?.remove();
    document.getElementById('coopWorkerDrawer')?.remove();
    document.body.classList.remove('coop-drawer-open');
    document.getElementById('coopPortal')?.remove();
    let notice=document.getElementById('coopBackendDeployNotice');
    if(!notice){
      notice=document.createElement('div');
      notice.id='coopBackendDeployNotice';
      notice.className='admin-health-error';
      const summary=document.getElementById('adminCommandSummary');
      summary?.insertBefore(notice,summary.firstChild);
    }
    notice.textContent=`${message} Existing Cooperative Admin modules remain available; the local-scope GovTech upgrade will activate automatically when the backend deployment reaches the latest commit.`;
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(probe,900);}
  const observer=new MutationObserver(schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-admin-role']});schedule();},{once:true});
  else{observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-admin-role']});schedule();}
})();
