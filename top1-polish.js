(() => {
  'use strict';

  const loaded=new Set();
  let administrationLoaded=false;
  let customerWorkerLoaded=false;
  let roleShellLoaded=false;
  let enhancementsLoaded=false;
  let authLoaded=false;

  function stylesheet(id,href){
    if(document.getElementById(id)||loaded.has(href))return;
    loaded.add(href);
    const link=document.createElement('link');
    link.id=id;link.rel='stylesheet';link.href=href;
    document.head.appendChild(link);
  }

  function script(id,src){
    if(document.getElementById(id)||loaded.has(src))return;
    loaded.add(src);
    const node=document.createElement('script');
    node.id=id;node.src=src;node.defer=true;
    document.body.appendChild(node);
  }

  function loadEnhancements(){
    if(enhancementsLoaded)return;
    enhancementsLoaded=true;
    stylesheet('sanpaidCredibilityStyles','credibility-layer.css');
    stylesheet('sanpaidWorkforceIntelligenceStyles','workforce-intelligence.css');
    script('sanpaidCredibilityScript','credibility-layer.js');
    script('sanpaidWorkforceIntelligenceScript','workforce-intelligence.js');
  }

  function loadAuth(){
    if(authLoaded)return;
    authLoaded=true;
    stylesheet('sanpaidAuthStyles','auth-unified.css');
    script('sanpaidAuthRuntime','auth-unified.js');
  }

  function loadRoleShell(){
    if(roleShellLoaded)return;
    roleShellLoaded=true;
    loadAuth();
    stylesheet('sanpaidDesignTokens','design-tokens.css');
    stylesheet('sanpaidSelectionStyles','selection-ready-v3.css');
    stylesheet('sanpaidWorkspaceStyles','workspace-ui.css');
    stylesheet('sanpaidColorSystem','color-system-v5.css');
    loadEnhancements();
  }

  function loadCustomerWorker(){
    if(customerWorkerLoaded)return;
    customerWorkerLoaded=true;
    loadRoleShell();
    stylesheet('sanpaidCustomerWorkerStyles','customer-worker-dashboard.css');
    script('sanpaidCustomerWorkerRuntime','customer-worker-dashboard.js');
  }

  function loadAdministration(){
    if(administrationLoaded)return;
    administrationLoaded=true;
    loadRoleShell();
    stylesheet('sanpaidAdminCommandStyles','admin-command-center.css');
    stylesheet('sanpaidFederationGovtechStyles','federation-govtech.css');
    stylesheet('sanpaidFederationPortalStyles','federation-portal.css');
    stylesheet('sanpaidCooperativePortalStyles','cooperative-portal.css');
    stylesheet('sanpaidHandoverEvidenceStyles','handover-evidence.css');

    script('sanpaidAdminCommandRuntime','admin-command-center.js');
    script('sanpaidFederationPortalRuntime','federation-portal.js');
    script('sanpaidCooperativePortalRuntime','cooperative-portal.js');
    script('sanpaidCooperativeAvailabilityRuntime','cooperative-deploy-guard.js');
    script('sanpaidHandoverEvidenceRuntime','handover-evidence.js');
  }

  function closeAdminDrawers(){
    const content=document.getElementById('judgeContent');
    if(!content)return;
    content.classList.remove('coop-nav-open','fed-nav-open');
    document.getElementById('coopNavToggle')?.setAttribute('aria-expanded','false');
    document.getElementById('fedNavToggle')?.setAttribute('aria-expanded','false');
    document.body.classList.remove('admin-mobile-nav-open');
  }

  function wireIntentLoading(){
    document.addEventListener('pointerdown',event=>{
      const target=event.target.closest?.('[data-eval-open-connected],[data-eval-connected-persona],#connectedDemoBtn,#getStarted,#evalOpenConnected,#evalFinalPrototype');
      if(target)loadCustomerWorker();
      const admin=event.target.closest?.('[data-eval-open-admin],[data-open-role="COOPERATIVE_ADMIN"],[data-open-role="FEDERATION_ADMIN"]');
      if(admin)loadAdministration();
    },{capture:true,passive:true});

    document.addEventListener('focusin',event=>{
      const target=event.target.closest?.('[data-eval-open-connected],[data-eval-connected-persona],#connectedDemoBtn,#getStarted,#evalOpenConnected,#evalFinalPrototype');
      if(target)loadCustomerWorker();
      const admin=event.target.closest?.('[data-eval-open-admin],[data-open-role="COOPERATIVE_ADMIN"],[data-open-role="FEDERATION_ADMIN"]');
      if(admin)loadAdministration();
    });
  }

  function wireAccessibility(){
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape')closeAdminDrawers();
    });
    document.addEventListener('click',event=>{
      const content=document.getElementById('judgeContent');
      if(!content||!content.contains(event.target))return;
      const selected=event.target.closest?.('[data-coop-target],[data-fed-target]');
      if(selected)queueMicrotask(closeAdminDrawers);
    });
  }

  function exposeRuntimeStatus(){
    window.SanPaidBootstrap=Object.freeze({
      version:'handover-bootstrap-v1',
      story:'Problem Details → Eligible Recommended Workers → Customer Selects → Worker Accepts → Call/Inspection → Estimate → Customer Approval → QR-Verified Start → Service → Worker Marks Complete → Customer Confirms → Itemized Bill → Payment → Invoice → Rating/Feedback',
      refreshEvidence:()=>window.SanPaidHandoverEvidence?.refresh?.(),
      loadCustomerWorker,
      loadAdministration,
      closeAdminDrawers
    });
  }

  function start(){
    loadAuth();
    wireIntentLoading();
    wireAccessibility();
    exposeRuntimeStatus();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
