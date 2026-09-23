(() => {
  'use strict';

  function ensureFifthResearchDecision(){
    const map=document.querySelector('#evidence .decision-map');
    if(!map||map.querySelector('[data-selector-finding="05"]'))return;
    const article=document.createElement('article');
    article.dataset.selectorFinding='05';
    article.innerHTML='<div><b>05</b><p>Skill-wise shortages and training needs are hard to see across scattered records.</p></div><strong>Demand-to-Workforce Loop with human-reviewed training and onboarding actions</strong>';
    map.insertBefore(article,map.querySelector(':scope>small')||null);
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
    if(copy)copy.textContent='Four role workflows and controlled sandbox interactions are implemented; production integrations and measured pilot impact remain separate.';
  }

  function apply(){
    ensureFifthResearchDecision();
    alignArchitectureTruth();
    alignCurrentBuildTruth();
    document.documentElement.dataset.selectorReady='true';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();
