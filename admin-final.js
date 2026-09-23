(() => {
  'use strict';

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();

  const ICON={
    home:'<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/></svg>',
    users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M15 14a4 4 0 0 1 6 3.5V20"/></svg>',
    calendar:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    wallet:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M15 14h6"/></svg>',
    shield:'<svg viewBox="0 0 24 24"><path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m8.5 12 2.3 2.3 4.7-4.8"/></svg>',
    headset:'<svg viewBox="0 0 24 24"><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/></svg>',
    audit:'<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg>',
    chart:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V5M16 20v-8M22 20H2"/></svg>',
    link:'<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>',
    alert:'<svg viewBox="0 0 24 24"><path d="M12 4 22 20H2Z"/><path d="M12 9v4M12 17h.01"/></svg>',
    rupee:'<svg viewBox="0 0 24 24"><path d="M6 5h12M6 9h12M6 5c5 0 6 7 0 7h3l7 7"/></svg>',
    building:'<svg viewBox="0 0 24 24"><path d="M4 21V7l8-4 8 4v14M8 10h2M14 10h2M8 14h2M14 14h2M9 21v-3h6v3"/></svg>',
    clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>',
    eye:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>'
  };

  const CONFIG={
    COOPERATIVE_ADMIN:{
      name:'Cooperative Admin',scope:'Local cooperative scope',online:'Service Online',kicker:'WELCOME BACK',
      title:'Cooperative Operations Dashboard',sub:'Manage workers, services, verification, complaints and local capacity in one place.',
      note:'Stronger\nLocal Communities',refresh:'Refresh Local Data',section:'LOCAL SOCIETY OPERATIONS',
      entity:'YUKTI Kolhapur Services Cooperative',place:'Kolhapur · Local cooperative scope',foot:'Stronger Communities\nThrough Dignified Work',
      nav:[
        ['overview','Overview','Dashboard & insights','home','home'],
        ['workers','Workers','Directory & availability','users','#coop-workers'],
        ['services','Bookings & Services','Active services','calendar','#coop-services'],
        ['payments','Payments & Earnings','Transactions & reports','wallet','#coop-payments'],
        ['sep'],
        ['verification','Trust & Verification','Identity, skills & documents','shield','#coop-verification'],
        ['complaints','Complaints & SLA','Grievances & resolution','headset','#coop-complaints'],
        ['activity','Audit & Activity','Activity logs & traceability','audit','#coop-activity'],
        ['sep'],
        ['capacity','Local Capacity','Demand & workforce gaps','chart','#coop-capacity'],
        ['planning','Demand & Planning','Forecast & planning','chart','tab:planning']
      ]
    },
    FEDERATION_ADMIN:{
      name:'Federation Admin',scope:'Regional oversight',online:'Network Online',kicker:'FEDERATION OPERATIONS',
      title:'Federation Operations Dashboard',sub:'Monitor connected cooperatives, cross-cooperative assignments, escalations and regional capacity in one place.',
      note:'Stronger\nCooperatives\nA Stronger Region',refresh:'Refresh Federation Data',section:'FEDERATION NETWORK OVERVIEW',
      entity:'Kolhapur Regional Federation',place:'Kolhapur region · Federation scope',foot:'Regional visibility.\nStronger local cooperatives.',
      nav:[
        ['overview','Overview','Federation dashboard','home','home'],
        ['network','Connected Cooperatives','Network & member societies','users','#fed-network'],
        ['assignments','Cross-Coop Assignments','Shared capacity & coordination','link','tab:capacity'],
        ['complaints','Complaints & Escalations','Inter-cooperative grievances','alert','tab:complaint'],
        ['verification','Trust & Verification','Standards across network','shield','tab:trust'],
        ['capacity','Capacity & Demand','Regional planning & insights','chart','tab:planning'],
        ['payments','Payments & Settlements','Cross-coop transactions','wallet','#fed-records'],
        ['reports','Reports & Audit','Governance & compliance','audit','tab:golden']
      ]
    }
  };

  let activeRole='';
  let activeKey='overview';
  let timer=0;
  let shellObserver=null;
  const movedNodes=new Map();

  function role(){
    const auth=String(window.SanPaidAuth?.getRole?.()||'').toUpperCase();
    if(CONFIG[auth])return auth;
    const shell=$('#sihJudgeShell');
    const dataRole=String(shell?.dataset?.adminRole||'').toUpperCase();
    if(CONFIG[dataRole])return dataRole;
    if(shell?.classList.contains('federation-govtech'))return 'FEDERATION_ADMIN';
    if(shell?.classList.contains('cooperative-govtech'))return 'COOPERATIVE_ADMIN';
    return '';
  }

  function visible(){
    const shell=$('#sihJudgeShell');
    return !!shell&&!shell.classList.contains('judge-hidden')&&!!CONFIG[role()];
  }

  function now(){return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});}

  function read(rootSelector,label){
    const root=$(rootSelector),wanted=norm(label);
    if(!root)return '';
    for(const card of $$('article,button,.admin-attention-card',root)){
      if(norm($('span',card)?.textContent)!==wanted)continue;
      return String($('strong,b',card)?.textContent||'').trim();
    }
    return '';
  }

  function fallback(r,label){
    if(!window.SanPaidReviewRuntime?.enabled)return '—';
    const coop={'verification attention':'2','open complaints':'1','sla breaches':'0','capacity requests':'1','total workers':'3','verified workers':'2','available workers':'2','active services':'4','recorded payments':'12'};
    const fed={'connected cooperatives':'8','cross-coop assignments':'12','escalated complaints':'2','repeated shortage signals':'5','verified workers':'126','active cross-coop jobs':'12','open escalations':'2','unfulfilled requests':'9','recorded settlements':'18'};
    return (r==='COOPERATIVE_ADMIN'?coop:fed)[norm(label)]??'—';
  }

  function val(label,selector,r){return read(selector,label)||fallback(r,label);}
  function num(value){const n=Number(String(value).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function currentUserName(){
    const user=window.SanPaidAuth?.getCurrentUser?.()||{};
    return String(user.fullName||user.full_name||user.name||'').trim();
  }

  function stat(tone,icon,label,value,detail,key){
    return `<article class="af-stat-card ${tone}"><span class="af-stat-icon">${ICON[icon]}</span><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small><button type="button" class="af-stat-link" data-af-key="${esc(key)}">View details →</button></article>`;
  }
  function mini(icon,label,value,detail){
    return `<article class="af-mini-card"><span class="af-mini-icon">${ICON[icon]}</span><div><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div></article>`;
  }
  function nav(cfg){
    return cfg.nav.map(item=>item[0]==='sep'?'<div class="af-nav-sep"></div>':`<button type="button" data-af-key="${esc(item[0])}" class="${item[0]==='overview'?'active':''}">${ICON[item[3]]}<b>${esc(item[1])}</b><small>${esc(item[2])}</small></button>`).join('');
  }

  function dataFor(r){
    if(r==='COOPERATIVE_ADMIN'){
      return {
        attention:[
          ['teal','shield','Verification Attention',val('Verification Attention','#adminAttentionGrid',r),'Documents need review','verification'],
          ['red','alert','Open Complaints',val('Open Complaints','#adminAttentionGrid',r),'Needs follow-up','complaints'],
          ['amber','clock','SLA Breaches',val('SLA Breaches','#adminAttentionGrid',r),'Requires attention','complaints'],
          ['blue','users','Capacity Requests',val('Capacity Requests','#adminAttentionGrid',r),'Needs coordination','capacity']
        ],
        overview:[
          ['users','Total Workers',val('Total Workers','#coopKpis',r),'Registered in this cooperative'],
          ['shield','Verified Workers',val('Verified Workers','#coopKpis',r),'Identity verification completed'],
          ['users','Available Workers',val('Available Workers','#coopKpis',r),'Verified + currently available'],
          ['chart','Active Services',val('Active Services','#coopKpis',r),'Currently running services'],
          ['headset','Open Complaints',val('Open Complaints','#coopKpis',r),'Requiring follow-up'],
          ['rupee','Recorded Payments',val('Recorded Payments','#coopKpis',r),'Transactions this month']
        ]
      };
    }

    const source='#fedNetworkKpis';
    const connected=read(source,'Active Cooperatives')||fallback(r,'Connected Cooperatives');
    const verified=read(source,'Verified Workers')||fallback(r,'Verified Workers');
    const capacity=read(source,'Capacity Requests')||fallback(r,'Unfulfilled Requests');
    const escalated=read(source,'Open Escalations')||fallback(r,'Open Escalations');
    const gap=read(source,'Regional Capacity Gap');
    const assignments=fallback(r,'Cross-Coop Assignments');
    const shortage=gap?String(Math.max(0,num(gap))):fallback(r,'Repeated Shortage Signals');

    return {
      attention:[
        ['teal','building','Connected Cooperatives',connected,'Active in the federation','network'],
        ['blue','link','Cross-Coop Assignments',assignments,'Governed shared-capacity jobs','assignments'],
        ['red','alert','Escalated Complaints',escalated,'Need federation attention','complaints'],
        ['amber','chart','Repeated Shortage Signals',shortage,'Human-reviewed planning inputs','capacity']
      ],
      overview:[
        ['building','Connected Cooperatives',connected,'Member societies'],
        ['users','Verified Workers',verified,'Across all cooperatives'],
        ['wallet','Active Cross-Coop Jobs',assignments,'Under federation coordination'],
        ['alert','Open Escalations',escalated,'Require federation action'],
        ['chart','Unfulfilled Requests',capacity,'From cooperatives'],
        ['rupee','Recorded Settlements',fallback(r,'Recorded Settlements'),'Cross-coop transactions this month']
      ]
    };
  }

  function lists(r,data){
    if(r==='COOPERATIVE_ADMIN'){
      const verification=num(data.attention[0][3])||2;
      const complaints=num(data.attention[1][3])||1;
      const capacity=num(data.attention[3][3])||1;
      return {
        alerts:[['risk',`${complaints} new complaint received`,'2 hours ago'],['warn',`${verification} worker documents pending verification`,'5 hours ago'],['ok','All services running normally','1 day ago']],
        tasks:[`Review ${verification} pending worker verifications`,`Follow up on ${complaints} open complaint`,`Check ${capacity} new capacity request`]
      };
    }
    const escalated=num(data.attention[2][3])||2;
    const assignments=num(data.attention[1][3])||12;
    return {
      alerts:[['risk',`${escalated} inter-cooperative complaint escalated`,'2 hours ago'],['warn',`${Math.min(assignments,2)} cross-coop assignments awaiting review`,'5 hours ago'],['ok','Repeated shortage in electrical services','1 day ago']],
      tasks:[`Review ${escalated} escalated complaints`,'Check 1 SLA breach across cooperatives','Review shortage pattern for electricians']
    };
  }

  function trust(){
    return `<div class="af-trust-row"><span>${ICON.eye}Network visibility</span><span>${ICON.users}Cross-coop governance</span><span>${ICON.shield}Escalation oversight</span><span>${ICON.chart}Human-reviewed planning</span></div>`;
  }

  function entityTitle(r,cfg){
    if(r==='COOPERATIVE_ADMIN')return String($('#coopTitle')?.textContent||cfg.entity).trim()||cfg.entity;
    return cfg.entity;
  }

  function dashboard(r){
    const cfg=CONFIG[r],data=dataFor(r),list=lists(r,data),federation=r==='FEDERATION_ADMIN';
    return `<section class="af-dashboard" id="afDashboard">
      <section class="af-hero">
        <div class="af-hero-copy"><span class="af-kicker">${esc(cfg.kicker)}</span><h1>${esc(cfg.title)}</h1><p>${esc(cfg.sub)}</p>${federation?trust():''}</div>
        <button type="button" class="af-refresh" id="afRefresh">↻ &nbsp; ${esc(cfg.refresh)}</button>
        <div class="af-hero-art"><span class="af-hero-note">${esc(cfg.note).replaceAll('\n','<br>')}</span></div>
      </section>
      <section class="af-attention-grid">${data.attention.map(item=>stat(...item)).join('')}</section>
      <section class="af-network">
        <div class="af-section-head"><div><span class="af-section-kicker">${esc(cfg.section)}</span><h2>${esc(entityTitle(r,cfg))}</h2></div><span class="af-scope">⌖ ${esc(cfg.place)}</span></div>
        <div class="af-overview-grid ${federation?'federation':''}">${data.overview.map(item=>mini(...item)).join('')}</div>
      </section>
      <section class="af-bottom-grid">
        <article class="af-list-card"><div class="af-list-title"><h3>● &nbsp; Recent Alerts</h3><button type="button" data-af-key="${federation?'complaints':'activity'}">View all →</button></div><div class="af-list">${list.alerts.map(([tone,text,time])=>`<div class="af-list-row ${tone}"><i></i><span>${esc(text)}</span><small>${esc(time)}</small></div>`).join('')}</div></article>
        <article class="af-list-card"><div class="af-list-title"><h3>☑ &nbsp; Today's Tasks</h3><button type="button" data-af-key="${federation?'reports':'activity'}">View all →</button></div><div class="af-list">${list.tasks.map(text=>`<div class="af-task-row"><i></i><span>${esc(text)}</span><small>Due today</small></div>`).join('')}</div></article>
      </section>
    </section>`;
  }

  function markup(r){
    const cfg=CONFIG[r];
    const profileName=currentUserName()||cfg.name;
    return `<div id="adminFinalApp">
      <header class="af-topbar">
        <div class="af-brand"><button type="button" class="af-mobile-menu" id="afMobileMenu" aria-label="Open navigation">☰</button><img src="app-icon.svg" alt=""><div><strong>San<span>Paid</span></strong><small>Cooperative Workforce Network</small></div></div>
        <div class="af-top-actions">
          <span class="af-pill online"><i class="af-dot"></i>${esc(cfg.online)}</span>
          <span class="af-pill">${ICON.clock}<span id="afLastSync">Last sync: ${esc(now())}</span></span>
          <div class="af-profile-wrap">
            <button type="button" class="af-profile" id="afProfileButton" aria-haspopup="menu" aria-expanded="false">${ICON.users}<span class="af-profile-copy"><b>${esc(profileName)}</b><small>${esc(cfg.scope)}</small></span></button>
            <div class="af-profile-menu" id="afProfileMenu" role="menu" hidden>
              <button type="button" role="menuitem" id="afSwitchRole">Switch Role</button>
              <button type="button" role="menuitem" class="danger" id="afLogout">Logout</button>
            </div>
          </div>
        </div>
      </header>
      <div class="af-layout">
        <aside class="af-sidebar"><nav class="af-nav">${nav(cfg)}</nav><div class="af-side-foot"><span class="af-community-icon"><i></i><i></i><i></i></span><small>${esc(cfg.foot).replaceAll('\n','<br>')}</small></div></aside>
        <main class="af-main">${dashboard(r)}<section class="af-detail-stage" id="afDetailStage" hidden><div class="af-detail-head"><div class="af-detail-title"><h1 id="afDetailTitle">Module</h1><p id="afDetailSubtitle">Operational workspace</p></div><button type="button" class="af-back" data-af-key="overview">← Back to Overview</button></div><div class="af-detail-body" id="afDetailBody"></div></section></main>
      </div>
    </div>`;
  }

  function setActive(key){$$('#adminFinalApp .af-nav [data-af-key]').forEach(button=>button.classList.toggle('active',button.dataset.afKey===key));}

  function rememberNode(node){
    if(movedNodes.has(node))return;
    const marker=document.createComment('sanpaid-admin-module-home');
    node.parentNode?.insertBefore(marker,node);
    movedNodes.set(node,marker);
  }

  function restoreMovedNodes(){
    for(const [node,marker] of movedNodes.entries()){
      if(marker?.parentNode)marker.parentNode.insertBefore(node,marker);
      marker?.remove();
      node.hidden=false;
      delete node.dataset.afMoved;
    }
    movedNodes.clear();
  }

  function hideDetailContent(){
    const body=$('#afDetailBody');
    if(!body)return;
    $$(':scope>[data-af-moved="1"]',body).forEach(node=>node.hidden=true);
    $$(':scope>[data-af-fallback]',body).forEach(node=>node.hidden=true);
  }

  function showNode(node){
    const body=$('#afDetailBody');
    if(!body||!node)return false;
    hideDetailContent();
    rememberNode(node);
    node.dataset.afMoved='1';
    node.hidden=false;
    body.appendChild(node);
    return true;
  }

  function fallbackPanel(key){
    const body=$('#afDetailBody');
    if(!body)return;
    hideDetailContent();
    let node=$(`[data-af-fallback="${key}"]`,body);
    if(!node){
      node=document.createElement('div');
      node.dataset.afFallback=key;
      node.className='admin-health-error';
      node.textContent='This module is still loading. Return to Overview and open it again in a moment.';
      body.appendChild(node);
    }
    node.hidden=false;
  }

  function waitForTarget(getter,key,attempt=0){
    const node=getter();
    if(showNode(node))return;
    if(attempt>=20){fallbackPanel(key);return;}
    setTimeout(()=>waitForTarget(getter,key,attempt+1),100);
  }

  function openKey(key){
    const cfg=CONFIG[activeRole],item=cfg?.nav.find(entry=>entry[0]===key);
    if(!item)return;
    activeKey=key;
    setActive(key);
    $('#adminFinalApp')?.classList.remove('nav-open');
    const dashboardNode=$('#afDashboard'),stage=$('#afDetailStage');
    if(key==='overview'){
      if(dashboardNode)dashboardNode.hidden=false;
      if(stage)stage.hidden=true;
      return;
    }
    if(dashboardNode)dashboardNode.hidden=true;
    if(stage)stage.hidden=false;
    $('#afDetailTitle').textContent=item[1];
    $('#afDetailSubtitle').textContent=item[2];
    hideDetailContent();
    const target=item[4];
    if(target.startsWith('#')){
      waitForTarget(()=>$(target),key);
      return;
    }
    if(target.startsWith('tab:')){
      window.SanPaidJudgeMode?.switchTab?.(target.slice(4));
      waitForTarget(()=>$('#sihJudgeShell .judge-section.active'),key);
      return;
    }
    fallbackPanel(key);
  }

  function refresh(){
    $('#adminHealthRefresh')?.click();
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'admin-final-refresh'}}));
    const button=$('#afRefresh');
    if(button){button.disabled=true;button.textContent='Refreshing…';}
    setTimeout(()=>{
      const host=$('#afDashboard');
      if(host){
        const wrap=document.createElement('div');
        wrap.innerHTML=dashboard(activeRole);
        host.replaceWith(wrap.firstElementChild);
        bindDashboard();
      }
      const sync=$('#afLastSync');
      if(sync)sync.textContent=`Last sync: ${now()}`;
    },650);
  }

  function bindDashboard(){
    const root=$('#afDashboard');
    if(!root)return;
    $('#afRefresh',root)?.addEventListener('click',refresh);
    root.querySelectorAll('[data-af-key]').forEach(button=>button.addEventListener('click',()=>openKey(button.dataset.afKey)));
  }

  async function switchRole(){
    restoreMovedNodes();
    document.getElementById('judgeClose')?.click();
    try{await window.SanPaidAuth?.logout?.({silent:true,keepModal:true});}catch{}
    window.SanPaidAuth?.open?.('CUSTOMER','login');
  }

  async function logout(){
    restoreMovedNodes();
    try{await window.SanPaidAuth?.logout?.();}
    finally{document.getElementById('judgeClose')?.click();}
  }

  function bindProfile(){
    const button=$('#afProfileButton'),menu=$('#afProfileMenu');
    if(!button||!menu)return;
    button.addEventListener('click',event=>{
      event.stopPropagation();
      const open=menu.hidden;
      menu.hidden=!open;
      button.setAttribute('aria-expanded',String(open));
    });
    $('#afSwitchRole')?.addEventListener('click',switchRole);
    $('#afLogout')?.addEventListener('click',logout);
    document.addEventListener('click',event=>{
      if(!event.target.closest('.af-profile-wrap')){
        menu.hidden=true;
        button.setAttribute('aria-expanded','false');
      }
    },{capture:true});
  }

  function bind(){
    const app=$('#adminFinalApp');
    if(!app)return;
    app.addEventListener('click',event=>{
      const button=event.target.closest('[data-af-key]');
      if(button&&!button.closest('#afDashboard'))openKey(button.dataset.afKey);
    });
    $('#afMobileMenu',app)?.addEventListener('click',()=>app.classList.toggle('nav-open'));
    bindProfile();
    bindDashboard();
  }

  function mount(){
    if(!visible())return;
    const nextRole=role(),shell=$('#sihJudgeShell'),content=$('#judgeContent');
    if(!shell||!content)return;
    shell.classList.add('admin-final-active');
    if(nextRole===activeRole&&$('#adminFinalApp'))return;
    restoreMovedNodes();
    $('#adminFinalApp')?.remove();
    activeRole=nextRole;
    activeKey='overview';
    content.insertAdjacentHTML('afterbegin',markup(nextRole));
    bind();
  }

  function cleanup(){
    restoreMovedNodes();
    const shell=$('#sihJudgeShell');
    shell?.classList.remove('admin-final-active');
    $('#adminFinalApp')?.remove();
    activeRole='';
    activeKey='overview';
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(visible())mount();
      else if($('#adminFinalApp'))cleanup();
    },90);
  }

  function attachShellObserver(){
    const shell=$('#sihJudgeShell');
    if(!shell){setTimeout(attachShellObserver,250);return;}
    shellObserver?.disconnect();
    shellObserver=new MutationObserver(schedule);
    shellObserver.observe(shell,{attributes:true,attributeFilter:['class','data-admin-role']});
    schedule();
  }

  window.addEventListener('sanpaid:connected-sync',schedule);
  window.addEventListener('sanpaid:admin-shell-ready',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  document.addEventListener('DOMContentLoaded',attachShellObserver,{once:true});
  if(document.readyState!=='loading')attachShellObserver();
  setTimeout(schedule,400);
})();
