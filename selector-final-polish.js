(() => {
  'use strict';

  const CUSTOMER_BASE_GRID_GUARD='#connectedContent[data-connected-role="CUSTOMER"]>.connected-grid.connected-customer-grid{position:absolute!important;left:-99999px!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}';

  function neutralizeLegacyCustomerBootGuard(){
    const guard=document.getElementById('sanpaidCustomerBootGuard');
    if(!guard)return;
    // Keep the duplicate base Customer grid isolated, but remove the old
    // preparation placeholder from the selector-facing experience.
    if(guard.textContent!==CUSTOMER_BASE_GRID_GUARD)guard.textContent=CUSTOMER_BASE_GRID_GUARD;
  }

  function alignEvidenceTruth(){
    const strip=document.querySelector('.hero-proof-strip .wrap');
    if(!strip)return;
    [...strip.querySelectorAll('span')].forEach(node=>{
      if(node.textContent.trim()==='5 findings mapped to product controls'){
        node.textContent='Field findings mapped to product controls';
      }
    });
  }

  function alignArchitectureTruth(){
    const card=document.querySelector('#architecture .architecture-card');
    if(!card)return;
    const copy=card.querySelector(':scope>div:first-child>p');
    if(copy)copy.textContent='Role-based workflows, audit-oriented records and a PostgreSQL-ready data layer keep service, payment, complaint and capacity decisions connected.';
    const finalLayer=card.querySelector('.architecture-line span:last-child');
    if(finalLayer)finalLayer.textContent='Data + audit layer';
  }

  function alignCurrentBuildTruth(){
    const bar=document.querySelector('#status .scope-bar');
    if(!bar)return;
    const heading=bar.querySelector('b');
    const copy=bar.querySelector('span');
    if(heading)heading.textContent='WHAT YOU CAN EXPLORE NOW';
    if(copy)copy.textContent='Four role workflows and controlled review interactions are implemented; production integrations and measured pilot impact remain separate.';
  }

  function alignAdminTruth(){
    document.querySelectorAll('#adminFinalApp .af-pill.online').forEach(node=>{
      if(node.textContent.trim()==='Workspace Ready')return;
      const dot=node.querySelector('.af-dot');
      node.textContent='';
      if(dot)node.appendChild(dot);
      node.append(document.createTextNode('Workspace Ready'));
    });
    document.querySelectorAll('#adminFinalApp .af-task-row span').forEach(node=>{
      if(node.textContent.trim()==='Check 1 SLA breach across cooperatives'){
        node.textContent='Review SLA status across cooperatives';
      }
    });
  }

  function apply(){
    neutralizeLegacyCustomerBootGuard();
    alignEvidenceTruth();
    alignArchitectureTruth();
    alignCurrentBuildTruth();
    alignAdminTruth();
    document.documentElement.dataset.selectorReady='true';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();

  // Admin cards render after authentication, so observe only that shell.
  const observeAdmin=()=>{
    const shell=document.getElementById('sihJudgeShell');
    if(!shell){setTimeout(observeAdmin,250);return;}
    new MutationObserver(()=>requestAnimationFrame(alignAdminTruth)).observe(shell,{childList:true,subtree:true});
  };
  observeAdmin();
})();
