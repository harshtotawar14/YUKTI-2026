(() => {
  'use strict';

  const loaded=new Set();
  let administrationLoaded=false;

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

  function loadCore(){
    stylesheet('sanpaidDesignTokens','design-tokens.css');
    stylesheet('sanpaidSelectionStyles','selection-ready-v3.css');
    stylesheet('sanpaidWorkspaceStyles','workspace-ui.css');
    stylesheet('sanpaidColorSystem','color-system-v5.css');
    stylesheet('sanpaidAuthStyles','auth-unified.css');
    stylesheet('sanpaidCustomerWorkerStyles','customer-worker-dashboard.css');

    script('sanpaidAuthRuntime','auth-unified.js');
    script('sanpaidCustomerWorkerRuntime','customer-worker-dashboard.js');
  }

  function loadAdministration(){
    if(administrationLoaded)return;
    administrationLoaded=true;
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
      story:'Customer Request → Eligibility Gate → Fair Ranking → Worker Choice → Service-Start Verification → Service → Completion → Sandbox Payment → Rating → Audit Outcome',
      refreshEvidence:()=>window.SanPaidHandoverEvidence?.refresh?.(),
      loadAdministration,
      closeAdminDrawers
    });
  }

  function start(){
    loadCore();
    wireAccessibility();
    exposeRuntimeStatus();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
