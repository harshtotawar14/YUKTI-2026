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
    try{
      const dashboard=window.SanPaidCustomerWorkerDashboard;
      if(typeof dashboard?.requestRefresh==='function'){
        dashboard.requestRefresh({detail:{source:'review-runtime-role-ready',role,at:Date.now()}});
        return;
      }
      window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'review-runtime-role-ready',role,at:Date.now()}}));
    }catch{}
  }

  async function ensureBundle(){
    if(!window.SanPaidReviewRuntime?.enabled)return;
    const role=activeConnectedRole();
    if(!role){lastRole='';clearTimeout(retryTimer);return;}
    if(document.querySelector(`#cwDashboard.${role.toLowerCase()}`))return;

    if(!window.SanPaidCustomerWorkerDashboard){
      const loader=window.SanPaidBootstrap?.loadCustomerWorker;
      if(typeof loader==='function'){
        if(!loading)loading=Promise.resolve(loader()).catch(error=>console.warn('[SanPaid review] customer/worker bundle load failed',error?.message||error)).finally(()=>{loading=null;});
        await loading;
      }
    }

    signal(role);
    if(lastRole!==role)lastRole=role;
    clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>{
      if(activeConnectedRole()===role&&!document.querySelector(`#cwDashboard.${role.toLowerCase()}`))signal(role);
    },260);
  }

  function currentDemoState(){
    try{return window.SanPaidSelectionDemo?.state?.()||window.SanPaidReviewRuntime?.state?.()||null;}catch{return null;}
  }

  function clearPrivateReviewSession(){
    try{
      window.SanPaidSelectionDemo?.reset?.();
      sessionStorage.removeItem('sanpaid_connected_booking_id');
      sessionStorage.removeItem('sanpaid_dashboard_view_customer');
      sessionStorage.removeItem('sanpaid_dashboard_view_worker');
      for(let i=sessionStorage.length-1;i>=0;i-=1){
        const key=sessionStorage.key(i)||'';
        if(key.startsWith('sanpaid_service_start_token_'))sessionStorage.removeItem(key);
      }
    }catch{}
  }

  function installLogoutFreshStartGuard(){
    if(document.documentElement.dataset.sanpaidLogoutFreshStart==='1')return;
    document.documentElement.dataset.sanpaidLogoutFreshStart='1';
    document.addEventListener('click',event=>{
      const target=event.target?.closest?.('#connectedLogout,#afLogout,#judgeLogout,#logoutBtn,[data-cm-logout],[data-wm-logout]');
      if(!target)return;
      clearPrivateReviewSession();
    },true);
  }

  function patchWorkerEstimateTruth(){
    const state=currentDemoState();
    const booking=state?.booking;
    if(!booking?.id)return;
    const status=String(booking.status||'').toUpperCase();
    const approved=state?.estimate?.status==='APPROVED'||['IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAYMENT_PENDING','PAID','CLOSED'].includes(status);
    document.querySelectorAll('#connectedLifecycleHost .connected-trust-row').forEach(row=>{
      if(String(row.querySelector('span')?.textContent||'').trim()!=='Estimate Approval')return;
      row.classList.toggle('done',approved);
      const value=row.querySelector('b');
      if(value)value.textContent=approved?'✅ Approved':'⏳ Required';
    });
  }

  function uniqueCooperatives(state){
    const names=new Set();
    for(const worker of state?.workers||[]){
      const explicit=String(worker.cooperative||'').trim();
      if(explicit)names.add(explicit);
      else if(/panhala/i.test(String(worker.zone||'')))names.add('Panhala Cooperative');
      else names.add('YUKTI Kolhapur Services Cooperative');
    }
    for(const request of state?.capacityRequests||[]){
      if(request.requestingCooperative)names.add(String(request.requestingCooperative));
      if(request.providingCooperative)names.add(String(request.providingCooperative));
    }
    return names.size;
  }

  function adminMetricMap(role,state){
    const workers=state?.workers||[];
    const complaints=state?.complaints||[];
    const capacity=state?.capacityRequests||[];
    const verified=workers.filter(w=>String(w.verificationStatus||'').toUpperCase()==='VERIFIED').length;
    const available=workers.filter(w=>String(w.verificationStatus||'').toUpperCase()==='VERIFIED'&&String(w.availability||'').toUpperCase()==='AVAILABLE').length;
    const openComplaints=complaints.filter(c=>String(c.status||'').toUpperCase()!=='RESOLVED').length;
    const escalated=complaints.filter(c=>String(c.status||'').toUpperCase()!=='RESOLVED'&&Number(c.escalationLevel||0)>=3).length;
    const pendingVerification=workers.filter(w=>String(w.verificationStatus||'').toUpperCase()!=='VERIFIED').length;
    const pendingCapacity=capacity.filter(r=>String(r.status||'').toUpperCase()!=='APPROVED').length;
    const assignments=capacity.filter(r=>String(r.status||'').toUpperCase()==='APPROVED').reduce((sum,r)=>sum+Number(r.approvedAssignments||0),0);
    const activeBooking=state?.booking?.id&&!['PAID','CLOSED','CANCELLED','READY'].includes(String(state.booking.status||'').toUpperCase())?1:0;
    const paymentCount=state?.payment?1:0;
    if(role==='COOPERATIVE_ADMIN')return {
      'Verification Attention':pendingVerification,
      'Open Complaints':openComplaints,
      'SLA Breaches':complaints.filter(c=>Boolean(c.slaBreached)).length,
      'Capacity Requests':pendingCapacity,
      'Total Workers':workers.length,
      'Verified Workers':verified,
      'Available Workers':available,
      'Active Services':activeBooking,
      'Recorded Payments':paymentCount
    };
    return {
      'Connected Cooperatives':uniqueCooperatives(state),
      'Cross-Coop Assignments':assignments,
      'Escalated Complaints':escalated,
      'Repeated Shortage Signals':pendingCapacity,
      'Verified Workers':verified,
      'Active Cross-Coop Jobs':assignments,
      'Open Escalations':escalated,
      'Unfulfilled Requests':pendingCapacity,
      'Recorded Settlements':state?.payment&&state?.booking?.crossCoop?1:0
    };
  }

  function patchAdminMetricTruth(){
    const state=currentDemoState();
    const app=document.getElementById('adminFinalApp');
    if(!state||!app)return;
    const role=String(window.SanPaidAuth?.getRole?.()||document.getElementById('sihJudgeShell')?.dataset?.adminRole||'').toUpperCase();
    const metrics=adminMetricMap(role,state);
    app.querySelectorAll('.af-stat-card,.af-mini-card').forEach(card=>{
      const label=String(card.querySelector('span:not(.af-stat-icon):not(.af-mini-icon),div>span')?.textContent||'').trim();
      if(!(label in metrics))return;
      const value=card.querySelector('strong');
      if(value)value.textContent=String(metrics[label]);
    });
  }

  function patchTruth(){
    patchWorkerEstimateTruth();
    patchAdminMetricTruth();
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensureBundle();patchTruth();});
  }

  installLogoutFreshStartGuard();
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-connected-role','data-admin-role']});
  window.addEventListener('sanpaid:connected-sync',schedule);
  window.addEventListener('sanpaid:selection-demo-sync',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
