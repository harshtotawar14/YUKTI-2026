(() => {
  'use strict';

  const TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const ROLE_HINT_KEY='sanpaid_admin_role_hint_v1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const ROLE_CONFIG={
    COOPERATIVE_ADMIN:{
      short:'Cooperative Admin',
      title:'Cooperative Operations Command Center',
      description:'Manage worker verification, service delivery, complaints, local capacity and fair opportunity allocation from one governed workspace.',
      scope:['Workers','Verification','Bookings','Complaints','Local Capacity'],
      order:['overview','trust','matching','complaint','capacity','planning','golden','research','security','welfare','control'],
      labels:{overview:'Command Center',trust:'Worker Trust',matching:'Fair Matching',complaint:'Complaints & SLA',capacity:'Capacity Exchange',planning:'Workforce Planning',golden:'System Proof',research:'Architecture & Research',security:'Security & Scale',welfare:'Welfare & Growth',control:'Demo Control'}
    },
    FEDERATION_ADMIN:{
      short:'Federation Admin',
      title:'Federation Regional Command Center',
      description:'Regional workforce visibility, capacity coordination, escalation oversight and cooperative governance in one auditable operating workspace.',
      scope:['Regional Network','Cross-Cooperative Capacity','L3 Escalations','Skill Gaps','Governance'],
      order:['overview','capacity','complaint','planning','trust','matching','welfare','golden','research','security','control'],
      labels:{overview:'Regional Command',capacity:'Capacity Network',complaint:'Escalations & SLA',planning:'Planning & Intelligence',trust:'Trust Governance',matching:'Matching Policy',welfare:'Welfare Readiness',golden:'System Proof',research:'Architecture & Research',security:'Security & Scale',control:'Demo Control'}
    }
  };

  const FED_NAV=[
    ['fed-home','Overview','Regional operations'],
    ['fed-network','Cooperative Network','Aggregate cooperative data'],
    ['planning','Demand & Capacity','Observed demand and eligible capacity'],
    ['capacity','Capacity Exchange','Cross-cooperative requests'],
    ['complaint','Escalations & SLA','L1 → L2 → L3 visibility'],
    ['planning','Workforce & Skills','Skill gaps and advisory actions'],
    ['trust','Trust Governance','Verification oversight'],
    ['matching','Matching Policy','Eligibility-first transparency'],
    ['fed-health','Feature Verification','Frontend / API / DB status'],
    ['welfare','Welfare Readiness','Future authorized integrations'],
    ['golden','System Proof','Golden Demo and evidence'],
    ['research','Architecture & Research','Technical evidence']
  ];

  const FEATURE_CATALOG=[
    {name:'Federation authentication',front:'SanPaidAuth + Federation role',back:'/api/auth/login · /api/auth/me · session bridge',db:'users · sessions',auth:'FEDERATION_ADMIN',mode:'READ'},
    {name:'Regional Command Center',front:'Federation Overview',back:'GET /api/connected/judge/overview',db:'workers · cooperatives · bookings · complaints · payment_ledger',auth:'ADMIN / FEDERATION',mode:'READ'},
    {name:'Demo readiness',front:'System Proof / Module Health',back:'GET /api/connected/judge/readiness',db:'users · workers · booking_assignment_offers',auth:'ADMIN / FEDERATION',mode:'READ'},
    {name:'Fair matching explanation',front:'Matching Policy',back:'GET /api/connected/judge/match/:bookingId',db:'bookings · workers · worker_skills · worker_documents',auth:'ADMIN / FEDERATION',mode:'READ'},
    {name:'Demand & skill planning',front:'Planning & Intelligence',back:'GET /api/connected/judge/planning',db:'bookings · workers · worker_skills · demand_forecasts',auth:'ADMIN / FEDERATION',mode:'READ'},
    {name:'Capacity request',front:'Capacity Exchange',back:'POST /api/connected/judge/capacity/request',db:'capacity_requests',auth:'ADMIN / FEDERATION',mode:'WRITE'},
    {name:'Capacity approval / offers',front:'Capacity Exchange',back:'POST /api/connected/judge/capacity/:id/approve',db:'capacity_requests · capacity_request_workers',auth:'ADMIN / FEDERATION',mode:'WRITE'},
    {name:'Complaint / SLA escalation',front:'Escalations & SLA',back:'POST complaint demo / simulate breach',db:'complaints · complaint_events',auth:'ADMIN / FEDERATION',mode:'WRITE'},
    {name:'Training recommendation',front:'Planning & Intelligence',back:'POST /api/connected/judge/training/recommend-default',db:'training_recommendations',auth:'ADMIN / FEDERATION',mode:'WRITE'},
    {name:'Service-start verification',front:'Connected service workflow',back:'Connected service verification + start routes',db:'bookings · service_start_tokens',auth:'CUSTOMER / WORKER',mode:'CONNECTED_FLOW'},
    {name:'Payment',front:'Connected commerce workflow',back:'Connected commerce routes',db:'payment_ledger',auth:'CUSTOMER',mode:'SANDBOX'},
    {name:'Insurance / ESIC / schemes',front:'Welfare Readiness',back:'No live external integration claimed',db:'—',auth:'Future authorized integration',mode:'FUTURE'}
  ];

  let refreshTimer=0;
  let shellObserver=null;
  let lastRuntime=null;

  function storeRoleHint(role){try{if(ROLE_CONFIG[role])sessionStorage.setItem(ROLE_HINT_KEY,role)}catch{}}
  function roleHint(){try{return sessionStorage.getItem(ROLE_HINT_KEY)||''}catch{return ''}}
  function currentRole(){
    const fromAuth=window.SanPaidAuth?.getRole?.();
    if(ROLE_CONFIG[fromAuth]){storeRoleHint(fromAuth);return fromAuth;}
    const hinted=roleHint();
    if(ROLE_CONFIG[hinted])return hinted;
    const email=String(window.SanPaidAuth?.getCurrentUser?.()?.email||'').toLowerCase();
    return email.includes('federation')?'FEDERATION_ADMIN':'COOPERATIVE_ADMIN';
  }
  function token(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return ''}}

  async function api(path){
    const headers={};
    const t=token();
    if(t)headers.Authorization=`Bearer ${t}`;
    const r=await fetch(path,{credentials:'include',cache:'no-store',headers});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(data.message||data.error||`Request failed (${r.status})`);e.status=r.status;throw e;}
    return data;
  }

  function stateBadge(label,tone='neutral'){return `<span class="admin-module-state ${tone}">${esc(label)}</span>`;}

  function setFedActive(target){
    $$('#sihJudgeShell [data-fed-target]').forEach(btn=>btn.classList.toggle('active',btn.dataset.fedTarget===target));
  }

  function switchTo(id){
    setFedActive(id);
    window.SanPaidJudgeMode?.switchTab?.(id);
    setTimeout(()=>$('#sihJudgeShell .judge-section.active')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
    closeFedNav();
  }

  function scrollFed(id){
    setFedActive(id);
    $(`#${id}`)?.scrollIntoView({behavior:'smooth',block:'start'});
    closeFedNav();
  }

  function reorderTabs(role){
    const tabs=$('#sihJudgeShell .judge-tabs');
    if(!tabs)return;
    const cfg=ROLE_CONFIG[role];
    cfg.order.forEach(id=>{
      const tab=$(`[data-judge-tab="${id}"]`,tabs);
      if(!tab)return;
      if(cfg.labels[id])tab.textContent=cfg.labels[id];
      tabs.appendChild(tab);
    });
    tabs.setAttribute('aria-label',`${cfg.short} workspace modules`);
  }

  function roleHero(role){
    const cfg=ROLE_CONFIG[role];
    const shell=$('#sihJudgeShell');
    if(!shell)return;
    shell.dataset.adminRole=role;
    shell.classList.add('admin-command-center');
    shell.classList.toggle('federation-govtech',role==='FEDERATION_ADMIN');

    const topSmall=$('.judge-top small',shell);
    if(topSmall)topSmall.textContent=role==='FEDERATION_ADMIN'?'Federation Operations Prototype · Regional Governance Workspace':`${cfg.short} · Governed Operations Workspace`;

    const hero=$('.judge-hero',shell);
    if(!hero)return;
    const badge=$('.judge-badge',hero);
    const h1=$('h1',hero);
    const p=$('p',hero);
    if(badge){badge.textContent=role==='FEDERATION_ADMIN'?'FEDERATION OPERATIONS · SIH 2026':'COOPERATIVE OPERATIONS WORKSPACE';badge.classList.add('admin-role-badge');}
    if(h1)h1.textContent=cfg.title;
    if(p)p.textContent=cfg.description;
    const presentation=$('#judgePresentation',hero);
    if(presentation)presentation.textContent=role==='FEDERATION_ADMIN'?'System Proof View':'Presentation View';
    if(role==='FEDERATION_ADMIN'&&!$('#fedGovTruth',hero)){
      const truth=document.createElement('small');
      truth.id='fedGovTruth';
      truth.className='fed-gov-truth';
      truth.textContent='GovTech-inspired prototype · Not an official government portal';
      p?.insertAdjacentElement('afterend',truth);
    }
  }

  function summaryShell(role){
    const content=$('#judgeContent');
    const tabs=$('.judge-tabs',content);
    if(!content||!tabs)return null;
    let panel=$('#adminCommandSummary',content);
    if(!panel){
      panel=document.createElement('section');
      panel.id='adminCommandSummary';
      panel.className='admin-command-summary';
      tabs.insertAdjacentElement('beforebegin',panel);
    }
    const cfg=ROLE_CONFIG[role];
    panel.dataset.role=role;
    panel.innerHTML=`
      <div class="admin-command-heading">
        <div><span class="admin-command-kicker">${esc(cfg.short)} workspace</span><h2>${role==='FEDERATION_ADMIN'?'Regional operational overview':'What needs attention now?'}</h2><p>Live read-only checks come from the connected backend. Write actions remain manual so status checks never mutate demo state.</p></div>
        <button type="button" class="btn secondary small" id="adminHealthRefresh">Refresh Status</button>
      </div>
      <div class="admin-attention-grid" id="adminAttentionGrid"><div class="admin-skeleton">Loading operational priorities…</div></div>
      ${role==='FEDERATION_ADMIN'?`<section id="fed-home" class="fed-home-block" aria-label="Federation overview"><div id="fedNetworkKpis" class="fed-kpi-grid"><div class="admin-skeleton">Loading network overview…</div></div></section>
      <section id="fed-network" class="fed-network-block"><div class="fed-section-head"><div><span>REGIONAL COOPERATIVE NETWORK</span><h3>Cooperative network snapshot</h3></div><small>Aggregate operational data only</small></div><div id="fedNetworkTable" class="fed-network-table"><div class="admin-skeleton">Loading cooperatives…</div></div></section>
      <section id="fed-records" class="fed-records-block"><div class="fed-section-head"><div><span>RECENT GOVERNANCE RECORDS</span><h3>Latest connected operational records</h3></div><small>No fabricated audit events</small></div><div id="fedRecentRecords" class="fed-record-grid"><div class="admin-skeleton">Loading records…</div></div></section>`:''}
      <div class="admin-command-lower" id="fed-health">
        <div class="admin-scope-card"><span>ROLE SCOPE</span><div>${cfg.scope.map(x=>`<b>${esc(x)}</b>`).join('')}</div></div>
        <div class="admin-module-health"><div class="admin-module-health-head"><span>RUNTIME MODULE HEALTH</span><small>Read checks are live · write actions are manual</small></div><div id="adminModuleHealth" class="admin-module-list"><div class="admin-skeleton">Checking modules…</div></div></div>
      </div>
      ${role==='FEDERATION_ADMIN'?`<section class="fed-feature-audit"><div class="fed-section-head"><div><span>FEATURE VERIFICATION MATRIX</span><h3>Frontend → API → Database → Authorization</h3></div><small>Code audit + runtime read checks</small></div><div id="fedFeatureMatrix" class="fed-feature-matrix"></div></section>`:''}`;
    $('#adminHealthRefresh',panel)?.addEventListener('click',()=>runHealth(role,true));
    return panel;
  }

  function attentionItem({tone='neutral',label,value,detail,target}){
    return `<button type="button" class="admin-attention-card ${tone}" data-admin-target="${target}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small><i>Review →</i></button>`;
  }

  function renderAttention(role,overview,planning){
    const root=$('#adminAttentionGrid');
    if(!root)return;
    const m=overview?.metrics||{};
    const pending=Number(m.pendingVerification||0);
    const complaints=Number(m.openComplaints||0);
    const sla=Number(m.slaBreached||0);
    const cap=(overview?.capacityRequests||[]).filter(x=>!['COMPLETED','CANCELLED','CLOSED'].includes(String(x.status||''))).length;
    const gap=Math.max(0,Number(planning?.capacityGap||0));
    const items=role==='FEDERATION_ADMIN'?
      [
        {tone:cap?'warn':'ok',label:'Cross-Cooperative Requests',value:String(cap),detail:cap?'Regional capacity coordination needs review.':'No open demo capacity requests.',target:'capacity'},
        {tone:sla?'risk':'ok',label:'SLA Escalations',value:String(sla),detail:sla?'Breached complaints require Federation visibility.':'No breached open complaints.',target:'complaint'},
        {tone:gap?'warn':'ok',label:'Regional Capacity Gap',value:String(gap),detail:gap?'Expected demand is above eligible capacity.':'No current shortage in planning baseline.',target:'planning'},
        {tone:'info',label:'Planning Confidence',value:String(planning?.confidence||'—'),detail:'Forecast remains advisory and human-controlled.',target:'planning'}
      ]:
      [
        {tone:pending?'warn':'ok',label:'Pending Verification',value:String(pending),detail:pending?'Workers need verification review before full eligibility.':'No pending worker verification.',target:'trust'},
        {tone:complaints?'warn':'ok',label:'Open Complaints',value:String(complaints),detail:complaints?'Customer issues need operational follow-up.':'No open complaints.',target:'complaint'},
        {tone:sla?'risk':'ok',label:'SLA Risk / Breach',value:String(sla),detail:sla?'Escalated complaint requires attention.':'No breached open complaints.',target:'complaint'},
        {tone:cap?'info':'ok',label:'Capacity Requests',value:String(cap),detail:cap?'Capacity exchange activity is available for review.':'No active demo capacity request.',target:'capacity'}
      ];
    root.innerHTML=items.map(attentionItem).join('');
    $$('[data-admin-target]',root).forEach(btn=>btn.onclick=()=>switchTo(btn.dataset.adminTarget));
  }

  function moduleRow(name,status,tone,detail,target){
    return `<button type="button" class="admin-module-row" data-admin-target="${target}"><span><b>${esc(name)}</b><small>${esc(detail)}</small></span>${stateBadge(status,tone)}</button>`;
  }

  function renderFederationData(overview,planning){
    if(!overview)return;
    const m=overview.metrics||{};
    const coops=overview.cooperatives||[];
    const activeCapacity=(overview.capacityRequests||[]).filter(x=>!['COMPLETED','CANCELLED','CLOSED'].includes(String(x.status||''))).length;
    const gap=Math.max(0,Number(planning?.capacityGap||0));
    const kpis=$('#fedNetworkKpis');
    if(kpis)kpis.innerHTML=[
      ['Active Cooperatives',coops.length,'Database-derived cooperative records'],
      ['Verified Workers',Number(m.verifiedWorkers||0),'Network eligibility source'],
      ['Available Workforce',Number(m.availableWorkers||0),'Verified + currently available'],
      ['Regional Capacity Gap',gap,planning?.confidence?`Planning confidence: ${planning.confidence}`:'Planning baseline'],
      ['Open Escalations',Number(m.slaBreached||0),'Open complaints with SLA breach'],
      ['Capacity Requests',activeCapacity,'Open connected demo capacity records']
    ].map(([label,value,detail])=>`<article class="fed-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`).join('');

    const table=$('#fedNetworkTable');
    if(table){
      const rows=coops.map(c=>{
        const workers=Number(c.workers||0),available=Number(c.available||0);
        const ratio=workers?available/workers:0;
        const status=workers===0?'NO WORKFORCE':ratio<.25?'CAPACITY LOW':ratio<.5?'MONITOR':'BALANCED';
        const tone=status==='BALANCED'?'ok':status==='MONITOR'?'warn':'risk';
        return `<tr><td><b>${esc(c.name||'Cooperative')}</b></td><td>${esc(c.city||'—')}</td><td>${workers}</td><td>${available}</td><td>${stateBadge(status,tone)}</td></tr>`;
      }).join('');
      table.innerHTML=coops.length?`<div class="judge-table-wrap"><table class="judge-table fed-table"><thead><tr><th>Cooperative</th><th>City / Zone</th><th>Workers</th><th>Available</th><th>Capacity Status</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="fed-empty">No cooperative records are available from the connected backend.</div>';
    }

    const rec=$('#fedRecentRecords');
    if(rec){
      const capacity=(overview.capacityRequests||[])[0];
      const complaint=(overview.complaints||[])[0];
      const forecast=(overview.forecasts||[])[0];
      const cards=[];
      if(capacity)cards.push(['Capacity Request',capacity.requestCode||`#${capacity.id}`,String(capacity.status||'—').replaceAll('_',' '),capacity.requestedAt||'']);
      if(complaint)cards.push(['Complaint / SLA',`Complaint #${complaint.id}`,`L${Number(complaint.escalationLevel||1)} · ${String(complaint.status||'—').replaceAll('_',' ')}`,complaint.slaDueAt||'']);
      if(forecast)cards.push(['Planning Record',forecast.service||'Service',`Expected ${Number(forecast.expectedDemand||0)} · Available ${Number(forecast.availableWorkers||0)}`,forecast.createdAt||'']);
      rec.innerHTML=cards.length?cards.map(([type,title,detail,time])=>`<article class="fed-record"><span>${esc(type)}</span><b>${esc(title)}</b><p>${esc(detail)}</p>${time?`<small>${esc(new Date(time).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}))}</small>`:''}</article>`).join(''):'<div class="fed-empty">No recent connected governance records are available yet.</div>';
    }
  }

  function runtimeStatusFor(feature,runtime){
    if(feature.mode==='FUTURE')return ['FUTURE AUTHORIZED INTEGRATION','neutral'];
    if(feature.mode==='SANDBOX')return ['SANDBOX · MANUAL TEST REQUIRED','info'];
    if(feature.mode==='WRITE')return ['CONNECTED BUT NOT LIVE-TESTED','warn'];
    if(feature.mode==='CONNECTED_FLOW')return ['CONNECTED FLOW · MANUAL REGRESSION REQUIRED','info'];
    const map={
      'Federation authentication':runtime.auth,
      'Regional Command Center':runtime.overview,
      'Demo readiness':runtime.readiness,
      'Fair matching explanation':runtime.matching,
      'Demand & skill planning':runtime.planning
    };
    const ok=map[feature.name];
    if(ok===true)return ['CONNECTED + READ VERIFIED','ok'];
    if(ok===false)return ['ATTENTION / READ FAILED','risk'];
    return ['CONNECTED BUT NOT TESTED','warn'];
  }

  function renderFeatureMatrix(runtime){
    const root=$('#fedFeatureMatrix');
    if(!root)return;
    root.innerHTML=`<div class="judge-table-wrap"><table class="judge-table fed-feature-table"><thead><tr><th>Feature</th><th>Frontend</th><th>Backend / API</th><th>Database</th><th>Authorization</th><th>Runtime Status</th></tr></thead><tbody>${FEATURE_CATALOG.map(f=>{const [status,tone]=runtimeStatusFor(f,runtime);return `<tr><td><b>${esc(f.name)}</b></td><td>${esc(f.front)}</td><td>${esc(f.back)}</td><td>${esc(f.db)}</td><td>${esc(f.auth)}</td><td>${stateBadge(status,tone)}</td></tr>`}).join('')}</tbody></table></div><p class="fed-matrix-note">Read endpoints are checked without changing demo state. Write flows stay marked as manual until an actual isolated demo transaction is executed; code existence alone is not treated as PASS.</p>`;
  }

  async function runHealth(role,manual=false){
    const moduleRoot=$('#adminModuleHealth');
    const attentionRoot=$('#adminAttentionGrid');
    if(moduleRoot)moduleRoot.innerHTML='<div class="admin-skeleton">Checking connected modules…</div>';
    if(manual&&attentionRoot)attentionRoot.innerHTML='<div class="admin-skeleton">Refreshing operational priorities…</div>';

    const [healthR,authR,overviewR,readinessR,planningR,latestR]=await Promise.allSettled([
      api('/api/connected/health'),
      api('/api/auth/me'),
      api('/api/connected/judge/overview'),
      api('/api/connected/judge/readiness'),
      api('/api/connected/judge/planning'),
      api('/api/connected/judge/latest-demo-booking')
    ]);
    const health=healthR.status==='fulfilled'?healthR.value:null;
    const auth=authR.status==='fulfilled'?authR.value:null;
    const overview=overviewR.status==='fulfilled'?overviewR.value:null;
    const readiness=readinessR.status==='fulfilled'?readinessR.value:null;
    const planning=planningR.status==='fulfilled'?planningR.value:null;
    const latest=latestR.status==='fulfilled'?latestR.value:null;

    let matching=null;
    if(latest?.booking?.id){
      try{await api(`/api/connected/judge/match/${latest.booking.id}`);matching=true}catch{matching=false}
    }
    const runtime={health:!!health,auth:!!auth?.user,overview:!!overview,readiness:!!readiness,planning:!!planning,matching};
    lastRuntime=runtime;

    if(moduleRoot){
      moduleRoot.innerHTML=[
        moduleRow('Backend Connectivity',health?'Connected':'Unavailable',health?'ok':'risk',health?'Connected health endpoint responded.':'Backend health endpoint did not respond.','overview'),
        moduleRow('Federation Session',runtime.auth?'Authenticated':'Unavailable',runtime.auth?'ok':'risk',runtime.auth?'Current authenticated session restored.':'Federation session read failed.','overview'),
        moduleRow('Regional Command',overview?'Connected':'Unavailable',overview?'ok':'risk',overview?'Database-derived operational metrics loaded.':'Overview endpoint did not respond.','overview'),
        moduleRow('Demo Readiness',readiness?.ok?'Ready':readiness?'Attention':'Unavailable',readiness?.ok?'ok':readiness?'warn':'risk',readiness?'Backend readiness checks completed.':'Readiness endpoint did not respond.','golden'),
        moduleRow('Fair Matching',matching===true?'Connected':matching===false?'Attention':'Ready after booking',matching===true?'ok':matching===false?'risk':'neutral',matching===true?'Latest booking matching explanation loaded.':matching===false?'Latest booking exists but match explanation failed.':'No current booking to read-test matching.','matching'),
        moduleRow('Demand & Skill Planning',planning?'Connected':'Unavailable',planning?'ok':'risk',planning?'Planning baseline and capacity data loaded.':'Planning endpoint did not respond.','planning'),
        moduleRow('Capacity Exchange','Manual test required','info','Write actions are available but health check does not create/approve records.','capacity'),
        moduleRow('Complaint / SLA','Manual test required','info','Write actions are available but health check does not mutate complaint state.','complaint'),
        moduleRow('Service-Start Trust','Manual regression required','info','Backend-connected workflow exists; invariant should be verified in isolated Golden Demo.','trust'),
        moduleRow('Payment Sandbox','Manual regression required','info','Sandbox flow remains separate from production payment claims.','golden'),
        moduleRow('Demo Reset','Manual only','neutral','Destructive reset requires explicit confirmation.','control')
      ].join('');
      $$('[data-admin-target]',moduleRoot).forEach(btn=>btn.onclick=()=>switchTo(btn.dataset.adminTarget));
    }

    if(overview){renderAttention(role,overview,planning||{});if(role==='FEDERATION_ADMIN')renderFederationData(overview,planning||{});}
    else if(attentionRoot)attentionRoot.innerHTML='<div class="admin-health-error">Operational data could not be loaded. Use Refresh Status or open a module to retry.</div>';
    if(role==='FEDERATION_ADMIN')renderFeatureMatrix(runtime);

    const stamp=$('.admin-command-heading p');
    if(stamp&&manual)stamp.textContent=`Status refreshed at ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Read checks are live; write actions remain manual.`;
    const sync=$('#fedLastSync');
    if(sync)sync.textContent=`Last sync ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  }

  function ensureFederationFrame(){
    const content=$('#judgeContent');
    if(!content||$('#fedSidebar',content))return;
    const aside=document.createElement('aside');
    aside.id='fedSidebar';
    aside.className='fed-sidebar';
    aside.setAttribute('aria-label','Federation navigation');
    aside.innerHTML=`<div class="fed-side-brand"><b>SanPaid</b><span>FEDERATION OPERATIONS</span><small>Cooperative Workforce Network</small></div><nav>${FED_NAV.map(([target,label,desc])=>`<button type="button" data-fed-target="${target}"><span>${esc(label)}</span><small>${esc(desc)}</small></button>`).join('')}</nav><div class="fed-side-foot"><span class="fed-proto-label">Federation Operations Prototype · SIH 2026</span><small>GovTech-inspired · Not an official government portal</small></div>`;
    content.insertBefore(aside,content.firstChild);
    const toggle=document.createElement('button');
    toggle.id='fedNavToggle';
    toggle.type='button';
    toggle.className='fed-nav-toggle';
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls','fedSidebar');
    toggle.textContent='☰ Federation Menu';
    content.insertBefore(toggle,aside.nextSibling);
    toggle.onclick=()=>{const open=content.classList.toggle('fed-nav-open');toggle.setAttribute('aria-expanded',String(open));};
    $$('[data-fed-target]',aside).forEach(btn=>btn.onclick=()=>{
      const target=btn.dataset.fedTarget;
      if(target.startsWith('fed-'))scrollFed(target);else switchTo(target);
    });
    setFedActive('fed-home');

    const topActions=$('.judge-top-actions');
    if(topActions&&!$('#fedLastSync',topActions)){
      const sync=document.createElement('span');sync.id='fedLastSync';sync.className='fed-last-sync';sync.textContent='Last sync —';
      topActions.insertBefore(sync,topActions.firstChild);
    }
  }

  function closeFedNav(){
    const content=$('#judgeContent');if(!content)return;
    content.classList.remove('fed-nav-open');
    $('#fedNavToggle',content)?.setAttribute('aria-expanded','false');
  }

  function enhance(){
    const shell=$('#sihJudgeShell');
    const content=$('#judgeContent');
    if(!shell||shell.classList.contains('judge-hidden')||!content||!$('.judge-tabs',content)||!$('.judge-hero',content))return;
    const role=currentRole();
    const alreadyEnhanced=content.dataset.adminEnhanced===role&&!!$('#adminCommandSummary',content)&&!!$('.admin-role-badge',content)&&(role!=='FEDERATION_ADMIN'||!!$('#fedSidebar',content));
    if(alreadyEnhanced)return;
    roleHero(role);
    reorderTabs(role);
    summaryShell(role);
    if(role==='FEDERATION_ADMIN')ensureFederationFrame();
    content.dataset.adminEnhanced=role;
    if(role==='FEDERATION_ADMIN'){
      window.SanPaidJudgeMode?.switchTab?.('overview');
      setFedActive('fed-home');
      setTimeout(()=>$('#adminCommandSummary')?.scrollIntoView({block:'start'}),40);
    }else setTimeout(()=>switchTo('overview'),60);
    runHealth(role,false);
  }

  function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(enhance,60);}

  function install(){
    schedule();
    const bodyObserver=new MutationObserver(()=>{
      const shell=$('#sihJudgeShell');
      if(!shell)return;
      bodyObserver.disconnect();
      shellObserver=new MutationObserver(schedule);
      shellObserver.observe(shell,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
      schedule();
    });
    if($('#sihJudgeShell')){
      shellObserver=new MutationObserver(schedule);
      shellObserver.observe($('#sihJudgeShell'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }else bodyObserver.observe(document.body,{childList:true,subtree:true});

    document.addEventListener('click',event=>{
      const roleButton=event.target.closest?.('[data-judge-role]');
      if(roleButton?.dataset?.judgeRole)storeRoleHint(roleButton.dataset.judgeRole);
      if(event.target.closest?.('#getStarted,[data-judge-role],#sihJudgeModeBtn,#judgeModeStatusBtn'))setTimeout(schedule,160);
    },true);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeFedNav();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();