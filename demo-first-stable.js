(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]||c));
  let timer=0;
  let healthState='unknown';

  const COOP_NAV=[
    ['coop-home','Overview','Local society operations'],
    ['coop-workers','Workforce & Trust','Workers, verification and eligibility'],
    ['coop-services','Services & Matching','Bookings, eligibility and worker choice'],
    ['coop-complaints','Complaints & SLA','Local cases and escalation state'],
    ['coop-capacity','Capacity & Planning','Demand, shortage and planning'],
    ['coop-payments','Payments & Outcomes','Billing, ratings and service outcome'],
    ['coop-training','Training & Welfare','Human-approved growth and welfare'],
    ['coop-activity','Audit & System','Audit trail, health and SIH proof']
  ];

  const FED_NAV=[
    ['fed-home','Overview','Regional governance overview'],
    ['fed-network','Cooperative Network','Societies, workforce and availability'],
    ['fed-demand-snapshot','Demand & Capacity','Regional demand, skill gaps and forecast'],
    ['fed-policy-governance','Policy & Governance','Standards and current demo policy'],
    ['capacity','Capacity Exchange','Cross-cooperative shortage coordination'],
    ['complaint','Appeals & SLA','L3 escalation and evidence'],
    ['fed-fairness-governance','Fairness & Development','Opportunity fairness and workforce growth'],
    ['fed-health','Audit & System','Governance audit, health and SIH proof']
  ];

  function role(){return String(window.SanPaidAuth?.getRole?.()||$('#sihJudgeShell')?.dataset?.adminRole||'').toUpperCase();}
  function shellOpen(){const shell=$('#sihJudgeShell');return !!shell&&!shell.classList.contains('judge-hidden');}
  function switchTab(id){window.SanPaidJudgeMode?.switchTab?.(id);setTimeout(()=>$('#sihJudgeShell .judge-section.active')?.scrollIntoView({behavior:'smooth',block:'start'}),50);}
  function scrollToId(id){const node=document.getElementById(id);if(node)node.scrollIntoView({behavior:'smooth',block:'start'});}

  function addStatusBar(kind){
    const summary=$('#adminCommandSummary');if(!summary)return;
    let bar=$('#demoFirstStatusBar',summary);
    if(!bar){bar=document.createElement('div');bar.id='demoFirstStatusBar';bar.className='demo-first-statusbar';summary.insertBefore(bar,summary.firstChild);}
    const fallback=kind==='fallback';
    bar.classList.toggle('fallback',fallback);
    bar.innerHTML=fallback
      ? `<div><strong>Demo Proof Mode</strong><span>Connected backend is unavailable. The operational structure below stays available with clearly labelled synthetic demo data. No write action is sent.</span></div><b class="demo-first-badge">SYNTHETIC DATA · PROTOTYPE-DEMO</b>`
      : `<div><strong>Connected Operations</strong><span>Authenticated operational data is available. System Proof and demo simulations remain separately labelled.</span></div><b class="demo-first-badge">CONNECTED</b>`;
  }

  function ensureRoleBrief(){
    const summary=$('#adminCommandSummary');if(!summary||$('#demoFirstRoleBrief',summary))return;
    const r=role();if(!['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(r))return;
    const fed=r==='FEDERATION_ADMIN';
    const brief=document.createElement('section');brief.id='demoFirstRoleBrief';brief.className=`demo-first-role-brief ${fed?'federation':''}`;
    const chain=fed?['Cooperative Network','Regional Shortage','Capacity Exchange','L3 SLA','Policy & Planning']:['Workers','Verification','Services','Complaints','Local Capacity'];
    brief.innerHTML=`<div><span class="eyebrow">${fed?'MULTI-COOPERATIVE GOVERNANCE':'ONE SOCIETY · LOCAL OPERATIONS'}</span><h3>${fed?'Federation coordinates the network.':'Cooperative Admin runs the society.'}</h3><p>${fed?'Aggregate regional visibility, cross-cooperative capacity, escalations, standards and workforce planning. Individual worker KYC is not the Federation default view.':'Own workers, worker verification, local bookings, complaints, capacity, payments and workforce development. It should not expose another society’s private operational data.'}</p></div><div class="demo-first-role-chain">${chain.map((x,i)=>`${i?'<i>→</i>':''}<span>${esc(x)}</span>`).join('')}</div>`;
    const heading=$('.admin-command-heading',summary);heading?.insertAdjacentElement('afterend',brief);
    ensureTruthLegend(summary,brief);
  }

  function ensureTruthLegend(summary,after){
    if($('#demoFirstTruthLegend',summary))return;
    const legend=document.createElement('div');legend.id='demoFirstTruthLegend';legend.className='demo-first-truth-legend';legend.setAttribute('aria-label','Prototype truth labels');legend.innerHTML='<span class="connected">Connected</span><span class="demo">Prototype-Demo</span><span class="sandbox">Sandbox</span><span class="future">Future Authorized Integration</span>';
    after.insertAdjacentElement('afterend',legend);
  }

  function buildPrimaryNav(nav,items,roleType){
    if(!nav)return;
    nav.querySelectorAll(':scope > button[data-coop-target],:scope > button[data-fed-target]').forEach(b=>b.classList.add('demo-first-legacy-nav'));
    nav.querySelectorAll(':scope > .coop-nav-group,:scope > .fed-nav-group').forEach(x=>x.classList.add('demo-first-legacy-label'));
    let primary=$('.demo-first-primary-nav',nav);
    if(primary)return;
    primary=document.createElement('div');primary.className='demo-first-primary-nav';
    primary.innerHTML=items.map(([target,label,desc],i)=>`<button type="button" ${i===0?'class="active"':''} data-demo-first-target="${esc(target)}"><span>${esc(label)}</span><small>${esc(desc)}</small></button>`).join('');
    nav.insertBefore(primary,nav.firstChild);
    primary.addEventListener('click',e=>{
      const btn=e.target.closest('[data-demo-first-target]');if(!btn)return;
      primary.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));
      const target=btn.dataset.demoFirstTarget;
      if(['capacity','complaint','matching','planning','trust','welfare','golden','research'].includes(target))switchTab(target);else scrollToId(target);
      if(roleType==='coop'){$('#judgeContent')?.classList.remove('coop-nav-open');$('#coopNavToggle')?.setAttribute('aria-expanded','false');}
      else{$('#judgeContent')?.classList.remove('fed-nav-open');$('#fedNavToggle')?.setAttribute('aria-expanded','false');}
    });
  }

  function quickAction(sectionId,label,target){
    const section=document.getElementById(sectionId),head=$('.coop-section-head,.fed-section-head,.demo-first-section-head',section);if(!section||!head)return;
    let actions=$('.demo-first-quick-actions',head);if(!actions){actions=document.createElement('div');actions.className='demo-first-quick-actions';head.querySelector('div')?.appendChild(actions);}
    if(actions.querySelector(`[data-demo-tab="${target}"]`))return;
    const b=document.createElement('button');b.type='button';b.dataset.demoTab=target;b.textContent=label;b.onclick=()=>switchTab(target);actions.appendChild(b);
  }

  function ensureCoopNavigation(){
    if(role()!=='COOPERATIVE_ADMIN')return;
    buildPrimaryNav($('#coopSidebar nav'),COOP_NAV,'coop');
    quickAction('coop-workers','Open Trust Passport','trust');
    quickAction('coop-services','Open Matching Proof','matching');
    quickAction('coop-capacity','Open Planning Proof','planning');
    quickAction('coop-training','Open Welfare Readiness','welfare');
    quickAction('coop-activity','Open SIH System Proof','golden');
  }

  function ensureFederationPolicy(){
    if(role()!=='FEDERATION_ADMIN'||$('#fed-policy-governance'))return;
    const anchor=$('#fed-demand-snapshot')||$('#fed-network');if(!anchor)return;
    const section=document.createElement('section');section.id='fed-policy-governance';section.className='demo-first-policy';section.innerHTML=`
      <div class="demo-first-section-head"><div><span>POLICY & GOVERNANCE</span><h3>Federation standards and policy readiness</h3></div><small>Truth-labelled governance view · No fake official policy</small></div>
      <div class="demo-first-policy-grid">
        <article><span>Verification Standard</span><strong>Identity + verified skill evidence</strong><p>Identity review and skill verification remain separate governance decisions.</p><em>CURRENT DEMO POLICY</em></article>
        <article><span>Local Service Radius</span><strong>Demo Policy Example: 20 km</strong><p>The operating radius is configurable by geography, service and cooperative policy.</p><em>CURRENT DEMO POLICY</em></article>
        <article><span>Matching Guardrail</span><strong>Eligibility → Fair Ranking → Worker Choice</strong><p>Ineligible workers should never be promoted by ranking alone.</p><em>CURRENT DEMO POLICY</em></article>
        <article><span>Complaint SLA</span><strong>Configured SLA · L1 → L2 → L3</strong><p>Any accelerated breach action shown during evaluation is a demo simulation.</p><em>DEMO GOVERNANCE</em></article>
        <article><span>Pricing / Additional Work</span><strong>Customer approval before billing</strong><p>No hidden commission split is claimed by this prototype.</p><em>SANDBOX POLICY PROOF</em></article>
        <article><span>Welfare Standards</span><strong>Training connected · schemes future</strong><p>Insurance, ESIC and government-scheme connections require authorized integration.</p><em>FUTURE GOVERNED CONFIGURATION</em></article>
      </div>
      <div class="demo-first-responsibility"><div><span>Requesting Cooperative</span><b>Owns the local shortage request</b></div><div><span>Providing Cooperative</span><b>Supplies eligible capacity</b></div><div><span>Worker</span><b>Consent remains required</b></div><div><span>Responsibility Record</span><b>Prototype design where not persisted</b></div></div>`;
    anchor.insertAdjacentElement('afterend',section);
  }

  function ensureFederationFairness(){
    if(role()!=='FEDERATION_ADMIN'||$('#fed-fairness-governance'))return;
    const anchor=$('#fed-policy-governance')||$('#fed-network');if(!anchor)return;
    const section=document.createElement('section');section.id='fed-fairness-governance';section.className='demo-first-fairness';section.innerHTML=`
      <div class="demo-first-section-head"><div><span>FAIRNESS & WORKFORCE DEVELOPMENT</span><h3>Opportunity governance without black-box scoring</h3></div><small>Only derivable indicators should become metrics</small></div>
      <div class="demo-first-fairness-grid"><article><b>Opportunity Distribution</b><p>Offers, accepts, declines and completed jobs are the preferred auditable inputs.</p></article><article><b>Utilization & Underuse</b><p>Use actual workload and availability records before recommending capacity or training.</p></article><article><b>Travel Burden & Concentration</b><p>Show only when location/opportunity history is sufficient; never infer protected traits.</p></article></div>
      <div class="demo-first-insufficient"><b>Governance rule:</b> if the connected dataset cannot support a network fairness metric, display “INSUFFICIENT DATA FOR FAIRNESS METRIC” instead of inventing a score.</div>`;
    anchor.insertAdjacentElement('afterend',section);
    quickAction('fed-fairness-governance','Open Matching Policy Proof','matching');
  }

  function ensureFederationNavigation(){
    if(role()!=='FEDERATION_ADMIN')return;
    ensureFederationPolicy();ensureFederationFairness();
    buildPrimaryNav($('#fedSidebar nav'),FED_NAV,'fed');
    quickAction('fed-policy-governance','Open System Proof','golden');
  }

  function renderFederationFallback(){
    if(role()!=='FEDERATION_ADMIN')return;
    addStatusBar('fallback');
    const attention=$('#adminAttentionGrid');if(attention)attention.innerHTML=`
      <article class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><div class="demo-fallback-metrics"><article><span>Capacity Request</span><strong>1</strong></article><article><span>L3 SLA Case</span><strong>1</strong></article><article><span>Regional Gap</span><strong>2</strong></article><article><span>Planning Confidence</span><strong>LOW</strong></article></div></article>`;
    const kpi=$('#fedNetworkKpis');if(kpi)kpi.innerHTML=[['Active Cooperatives','3'],['Verified Workforce','18'],['Available Workforce','11'],['Regional Gap','2'],['L3 Escalations','1'],['Open Capacity Request','1']].map(([a,b])=>`<article class="fed-kpi"><span>${a}</span><strong>${b}</strong><small>Synthetic demonstration value</small></article>`).join('');
    const table=$('#fedNetworkTable');if(table)table.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><table class="demo-fallback-table"><thead><tr><th>Cooperative</th><th>Zone</th><th>Workers</th><th>Available</th><th>Capacity</th></tr></thead><tbody><tr><td>Demo Cooperative A</td><td>Zone 1</td><td>8</td><td>5</td><td><span class="demo-fallback-state ok">Balanced</span></td></tr><tr><td>Demo Cooperative B</td><td>Zone 2</td><td>6</td><td>2</td><td><span class="demo-fallback-state warn">Capacity Low</span></td></tr><tr><td>Demo Cooperative C</td><td>Zone 3</td><td>7</td><td>4</td><td><span class="demo-fallback-state info">Monitor</span></td></tr></tbody></table></div>`;
    const records=$('#fedRecentRecords');if(records)records.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><div class="demo-fallback-list"><article><div><b>Capacity shortage raised</b><small>Demo Cooperative B · Electrician · worker consent required</small></div><span class="demo-fallback-state warn">Requested</span></article><article><div><b>SLA escalated to Federation</b><small>Evidence timeline remains the review source</small></div><span class="demo-fallback-state risk">L3</span></article><article><div><b>Planning advisory</b><small>Expected demand exceeds eligible capacity by 2</small></div><span class="demo-fallback-state info">Low Confidence</span></article></div></div>`;
    const health=$('#adminModuleHealth');if(health)health.innerHTML=`<div class="demo-fallback-list"><article><div><b>Connected backend</b><small>No mutation is attempted while unavailable.</small></div><span class="demo-fallback-state risk">Unavailable</span></article><article><div><b>Guided SIH proof</b><small>Client-side demo logic and synthetic role views remain available.</small></div><span class="demo-fallback-state ok">Available</span></article></div>`;
  }

  function setHealth(state){
    healthState=state;document.body.classList.toggle('demo-first-fallback',state==='fallback');
    if(!shellOpen())return;
    addStatusBar(state);
    if(state==='fallback')renderFederationFallback();
  }

  async function probeHealth(){
    const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(),2600);
    try{const r=await fetch('/api/connected/health',{credentials:'include',cache:'no-store',signal:ctl.signal});clearTimeout(timeout);setHealth(r.ok?'connected':'fallback');}
    catch{clearTimeout(timeout);setHealth('fallback');}
  }

  function enhance(){
    if(!shellOpen())return;
    ensureRoleBrief();ensureCoopNavigation();ensureFederationNavigation();
    if(healthState!=='unknown')setHealth(healthState);
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(enhance,120);}
  function start(){
    const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-admin-role']});
    schedule();probeHealth();
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-judge-role],#coopLogin,#getStarted,[data-open-selector]'))setTimeout(()=>{schedule();probeHealth();},250);},true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
