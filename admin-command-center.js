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
      description:'Coordinate regional capacity, escalations, skill gaps and cross-cooperative governance while preserving cooperative approval and worker choice.',
      scope:['Regional Demand','Cross-Cooperative Capacity','Escalations','Skill Gaps','Governance'],
      order:['overview','capacity','complaint','planning','trust','matching','golden','research','security','welfare','control'],
      labels:{overview:'Regional Command',capacity:'Capacity Network',complaint:'Escalations',planning:'Regional Planning',trust:'Trust Governance',matching:'Matching Policy',golden:'System Proof',research:'Architecture & Research',security:'Security & Scale',welfare:'Welfare Readiness',control:'Demo Control'}
    }
  };

  let refreshTimer=0;
  let shellObserver=null;

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

  function stateBadge(label,tone='neutral'){
    return `<span class="admin-module-state ${tone}">${esc(label)}</span>`;
  }

  function switchTo(id){
    window.SanPaidJudgeMode?.switchTab?.(id);
    setTimeout(()=>$('#sihJudgeShell .judge-section.active')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
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

    const topSmall=$('.judge-top small',shell);
    if(topSmall)topSmall.textContent=`${cfg.short} · Governed Operations Workspace`;

    const hero=$('.judge-hero',shell);
    if(!hero)return;
    const badge=$('.judge-badge',hero);
    const h1=$('h1',hero);
    const p=$('p',hero);
    if(badge){badge.textContent=role==='FEDERATION_ADMIN'?'FEDERATION GOVERNANCE WORKSPACE':'COOPERATIVE OPERATIONS WORKSPACE';badge.classList.add('admin-role-badge');}
    if(h1)h1.textContent=cfg.title;
    if(p)p.textContent=cfg.description;
    const presentation=$('#judgePresentation',hero);
    if(presentation)presentation.textContent='Presentation View';
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
        <div><span class="admin-command-kicker">${esc(cfg.short)} workspace</span><h2>What needs attention now?</h2><p>Live read-only checks come from the connected backend. Write actions remain manual so this health check does not mutate demo state.</p></div>
        <button type="button" class="btn secondary small" id="adminHealthRefresh">Refresh Status</button>
      </div>
      <div class="admin-attention-grid" id="adminAttentionGrid">
        <div class="admin-skeleton">Loading operational priorities…</div>
      </div>
      <div class="admin-command-lower">
        <div class="admin-scope-card"><span>ROLE SCOPE</span><div>${cfg.scope.map(x=>`<b>${esc(x)}</b>`).join('')}</div></div>
        <div class="admin-module-health"><div class="admin-module-health-head"><span>MODULE HEALTH</span><small>Read checks are live · write actions are manual</small></div><div id="adminModuleHealth" class="admin-module-list"><div class="admin-skeleton">Checking modules…</div></div></div>
      </div>`;
    $('#adminHealthRefresh',panel)?.addEventListener('click',()=>runHealth(role,true));
    return panel;
  }

  function attentionItem({tone='neutral',label,value,detail,target}){
    return `<button type="button" class="admin-attention-card ${tone}" data-admin-target="${target}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small><i>Open →</i></button>`;
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
        {tone:sla?'risk':'ok',label:'SLA Escalations',value:String(sla),detail:sla?'Breached complaints require federation visibility.':'No breached open complaints.',target:'complaint'},
        {tone:gap?'warn':'ok',label:'Regional Capacity Gap',value:gap?String(gap):'0',detail:gap?'Expected demand is above eligible capacity.':'No current shortage in planning baseline.',target:'planning'},
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

  async function runHealth(role,manual=false){
    const moduleRoot=$('#adminModuleHealth');
    const attentionRoot=$('#adminAttentionGrid');
    if(moduleRoot)moduleRoot.innerHTML='<div class="admin-skeleton">Checking connected modules…</div>';
    if(manual&&attentionRoot)attentionRoot.innerHTML='<div class="admin-skeleton">Refreshing operational priorities…</div>';

    const [overviewR,readinessR,planningR,latestR]=await Promise.allSettled([
      api('/api/connected/judge/overview'),
      api('/api/connected/judge/readiness'),
      api('/api/connected/judge/planning'),
      api('/api/connected/judge/latest-demo-booking')
    ]);
    const overview=overviewR.status==='fulfilled'?overviewR.value:null;
    const readiness=readinessR.status==='fulfilled'?readinessR.value:null;
    const planning=planningR.status==='fulfilled'?planningR.value:null;
    const latest=latestR.status==='fulfilled'?latestR.value:null;

    let matchState={status:'Ready after booking',tone:'neutral',detail:'Create a connected customer booking to inspect ranking.'};
    if(latest?.booking?.id){
      try{
        await api(`/api/connected/judge/match/${latest.booking.id}`);
        matchState={status:'Connected',tone:'ok',detail:'Latest booking eligibility and ranking explanation is readable.'};
      }catch{
        matchState={status:'Attention',tone:'risk',detail:'Latest booking exists but matching proof did not load.'};
      }
    }

    if(moduleRoot){
      moduleRoot.innerHTML=[
        moduleRow('Command Center',overview?'Connected':'Unavailable',overview?'ok':'risk',overview?'Database-derived operational metrics loaded.':'Overview endpoint did not respond.','overview'),
        moduleRow('Demo Readiness',readiness?.ok?'Ready':readiness?'Attention':'Unavailable',readiness?.ok?'ok':readiness?'warn':'risk',readiness?'Backend readiness checks completed.':'Readiness endpoint did not respond.','golden'),
        moduleRow('Fair Matching',matchState.status,matchState.tone,matchState.detail,'matching'),
        moduleRow('Demand & Skill Planning',planning?'Connected':'Unavailable',planning?'ok':'risk',planning?'Planning baseline and capacity data loaded.':'Planning endpoint did not respond.','planning'),
        moduleRow('Capacity Exchange','Manual action','info','Request/approval actions are available; health check does not create data.','capacity'),
        moduleRow('Complaint / SLA','Manual action','info','Create/escalate actions are available; health check does not mutate complaint state.','complaint'),
        moduleRow('Service-Start Trust','Connected flow','ok','Identity + customer confirmation proof remains in the connected service workflow.','trust'),
        moduleRow('Demo Reset','Manual only','neutral','Destructive reset always requires explicit confirmation.','control')
      ].join('');
      $$('[data-admin-target]',moduleRoot).forEach(btn=>btn.onclick=()=>switchTo(btn.dataset.adminTarget));
    }

    if(overview)renderAttention(role,overview,planning||{});
    else if(attentionRoot)attentionRoot.innerHTML='<div class="admin-health-error">Operational data could not be loaded. Use Refresh Status or open a module to retry.</div>';

    const stamp=$('.admin-command-heading p');
    if(stamp&&manual)stamp.textContent=`Status refreshed at ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Read checks are live; write actions remain manual.`;
  }

  function enhance(){
    const shell=$('#sihJudgeShell');
    const content=$('#judgeContent');
    if(!shell||shell.classList.contains('judge-hidden')||!content||!$('.judge-tabs',content)||!$('.judge-hero',content))return;
    const role=currentRole();
    const alreadyEnhanced=content.dataset.adminEnhanced===role&&!!$('#adminCommandSummary',content)&&!!$('.admin-role-badge',content);
    if(alreadyEnhanced)return;
    roleHero(role);
    reorderTabs(role);
    summaryShell(role);
    content.dataset.adminEnhanced=role;
    setTimeout(()=>switchTo('overview'),60);
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
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();