(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
  const money=v=>{const n=Number(String(v??'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?`₹${n.toLocaleString('en-IN',{maximumFractionDigits:0})}`:'—';};

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
    eye:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
    refresh:'↻'
  };

  const CONFIG={
    COOPERATIVE_ADMIN:{
      roleName:'Cooperative Admin',subRole:'Local cooperative scope',online:'Service Online',kicker:'WELCOME BACK',title:'Cooperative Operations Dashboard',subtitle:'Manage workers, services, verification, complaints and local capacity in one place.',heroNote:'Stronger\nLocal Communities',refresh:'Refresh Local Data',networkKicker:'LOCAL SOCIETY OPERATIONS',networkTitle:'YUKTI Kolhapur Services Cooperative',scope:'Kolhapur · Local cooperative scope',footer:'Stronger Communities\nThrough Dignified Work',
      nav:[
        ['overview','Overview','Dashboard & insights','home','home'],['workers','Workers','Directory & availability','users','#coop-workers'],['services','Bookings & Services','Active services','calendar','#coop-services'],['payments','Payments & Earnings','Transactions & reports','wallet','#coop-payments'],['sep'],['verification','Trust & Verification','Identity, skills & documents','shield','#coop-verification'],['complaints','Complaints & SLA','Grievances & resolution','headset','#coop-complaints'],['activity','Audit & Activity','Activity logs & traceability','audit','#coop-activity'],['sep'],['capacity','Local Capacity','Demand & workforce gaps','chart','#coop-capacity'],['planning','Demand & Planning','Forecast & planning','chart','tab:planning']
      ]
    },
    FEDERATION_ADMIN:{
      roleName:'Federation Admin',subRole:'Regional oversight',online:'Network Online',kicker:'FEDERATION OPERATIONS',title:'Federation Operations Dashboard',subtitle:'Monitor connected cooperatives, cross-cooperative assignments, escalations and regional capacity in one place.',heroNote:'Stronger\nCooperatives\nA Stronger Region',refresh:'Refresh Federation Data',networkKicker:'FEDERATION NETWORK OVERVIEW',networkTitle:'Kolhapur Regional Federation',scope:'Kolhapur region · Federation scope',footer:'Regional visibility.\nStronger local cooperatives.',
      nav:[
        ['overview','Overview','Federation dashboard','home','home'],['network','Connected Cooperatives','Network & member societies','users','#fed-network'],['assignments','Cross-Coop Assignments','Shared capacity & coordination','link','#fedCapacityGovernance'],['complaints','Complaints & Escalations','Inter-cooperative grievances','alert','tab:complaint'],['verification','Trust & Verification','Standards across network','shield','tab:trust'],['capacity','Capacity & Demand','Regional planning & insights','chart','tab:planning'],['payments','Payments & Settlements','Cross-coop transactions','wallet','#fed-records'],['reports','Reports & Audit','Governance & compliance','audit','tab:golden']
      ]
    }
  };

  let currentRole='';
  let currentKey='overview';
  let renderTimer=0;

  function role(){
    const auth=String(window.SanPaidAuth?.getRole?.()||'').toUpperCase();
    if(CONFIG[auth])return auth;
    const shell=$('#sihJudgeShell');
    const data=String(shell?.dataset?.adminRole||'').toUpperCase();
    if(CONFIG[data])return data;
    return shell?.classList.contains('federation-govtech')?'FEDERATION_ADMIN':shell?.classList.contains('cooperative-govtech')?'COOPERATIVE_ADMIN':'';
  }
  function visibleAdmin(){const shell=$('#sihJudgeShell');return !!shell&&!shell.classList.contains('judge-hidden')&&!!CONFIG[role()];}
  function textValue(root,label){
    const wanted=norm(label);if(!root)return'';
    const cards=$$('article,button,.admin-attention-card',root);
    for(const card of cards){
      const labelNode=$('span',card);if(norm(labelNode?.textContent)!==wanted)continue;
      return String($('strong,b',card)?.textContent||'').trim();
    }
    return'';
  }
  function demoFallback(r,label){
    if(!window.SanPaidReviewRuntime?.enabled)return '—';
    const coop={'verification attention':'2','open complaints':'1','sla breaches':'0','capacity requests':'1','total workers':'3','verified workers':'2','available workers':'2','active services':'4','recorded payments':'12'};
    const fed={'connected cooperatives':'8','cross-coop assignments':'12','escalated complaints':'2','repeated shortage signals':'5','verified workers':'126','active cross-coop jobs':'12','open escalations':'2','unfulfilled requests':'9','recorded settlements':'18'};
    return (r==='COOPERATIVE_ADMIN'?coop:fed)[norm(label)]??'—';
  }
  function value(label,sourceSelector,r){return textValue($(sourceSelector),label)||demoFallback(r,label);}
  function numberish(v){const n=Number(String(v).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function nowLabel(){return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});}

  function statCard(tone,icon,label,val,detail,key){return `<article class="af-stat-card ${tone}"><span class="af-stat-icon">${ICON[icon]}</span><span>${esc(label)}</span><strong>${esc(val)}</strong><small>${esc(detail)}</small><button type="button" class="af-stat-link" data-af-key="${esc(key)}">View details →</button></article>`;}
  function miniCard(icon,label,val,detail){return `<article class="af-mini-card"><span class="af-mini-icon">${ICON[icon]}</span><div><span>${esc(label)}</span><strong>${esc(val)}</strong><small>${esc(detail)}</small></div></article>`;}
  function navMarkup(cfg){return cfg.nav.map(item=>item[0]==='sep'?'<div class="af-nav-sep"></div>':`<button type="button" data-af-key="${esc(item[0])}" class="${item[0]==='overview'?'active':''}">${ICON[item[3]]}<b>${esc(item[1])}</b><small>${esc(item[2])}</small></button>`).join('');}

  function federationTrustRow(){return `<div class="af-trust-row"><span>${ICON.eye}Network visibility</span><span>${ICON.users}Cross-coop governance</span><span>${ICON.shield}Escalation oversight</span><span>${ICON.chart}Human-reviewed planning</span></div>`;}

  function cooperativeData(){
    const r='COOPERATIVE_ADMIN';
    const attention=[
      ['teal','shield','Verification Attention',value('Verification Attention','#adminAttentionGrid',r),'Documents need review','verification'],
      ['red','alert','Open Complaints',value('Open Complaints','#adminAttentionGrid',r),'Needs follow-up','complaints'],
      ['amber','clock','SLA Breaches',value('SLA Breaches','#adminAttentionGrid',r),'Requires attention','complaints'],
      ['blue','users','Capacity Requests',value('Capacity Requests','#adminAttentionGrid',r),'Needs coordination','capacity']
    ];
    const overview=[
      ['users','Total Workers',value('Total Workers','#coopKpis',r),'Registered in this cooperative'],['shield','Verified Workers',value('Verified Workers','#coopKpis',r),'Identity verification completed'],['users','Available Workers',value('Available Workers','#coopKpis',r),'Verified + currently available'],['chart','Active Services',value('Active Services','#coopKpis',r),'Currently running services'],['headset','Open Complaints',value('Open Complaints','#coopKpis',r),'Requiring follow-up'],['rupee','Recorded Payments',value('Recorded Payments','#coopKpis',r),'Transactions this month']
    ];
    return {attention,overview};
  }

  function federationData(){
    const r='FEDERATION_ADMIN';
    const source='#fedNetworkKpis';
    const attSource='#adminAttentionGrid';
    const connected=value('Active Cooperatives',source,r)!=='—'?value('Active Cooperatives',source,r):demoFallback(r,'Connected Cooperatives');
    const verified=value('Verified Workers',source,r);
    const capacity=value('Capacity Requests',source,r);
    const escal=value('Open Escalations',source,r)!=='—'?value('Open Escalations',source,r):demoFallback(r,'Open Escalations');
    const gap=value('Regional Capacity Gap',source,r);
    const assignments=demoFallback(r,'Cross-Coop Assignments');
    const shortage=gap!=='—'?String(Math.max(0,numberish(gap))):demoFallback(r,'Repeated Shortage Signals');
    const attention=[
      ['teal','building','Connected Cooperatives',connected,'Active in the federation','network'],
      ['blue','link','Cross-Coop Assignments',assignments,'Governed shared-capacity jobs','assignments'],
      ['red','alert','Escalated Complaints',escal,'Need federation attention','complaints'],
      ['amber','chart','Repeated Shortage Signals',shortage,'Human-reviewed planning inputs','capacity']
    ];
    const overview=[
      ['building','Connected Cooperatives',connected,'Member societies'],['users','Verified Workers',verified!=='—'?verified:demoFallback(r,'Verified Workers'),'Across all cooperatives'],['wallet','Active Cross-Coop Jobs',assignments,'Under federation coordination'],['alert','Open Escalations',escal,'Require federation action'],['chart','Unfulfilled Requests',capacity!=='—'?capacity:demoFallback(r,'Unfulfilled Requests'),'From cooperatives'],['rupee','Recorded Settlements',demoFallback(r,'Recorded Settlements'),'Cross-coop transactions this month']
    ];
    return {attention,overview};
  }

  function alertTaskMarkup(r,data){
    const a=data.attention;
    if(r==='COOPERATIVE_ADMIN'){
      const complaints=numberish(a[1][3]),verify=numberish(a[0][3]),cap=numberish(a[3][3]);
      return {alerts:[['risk',`${complaints||1} new complaint received`,'2 hours ago'],['warn',`${verify||2} worker documents pending verification`,'5 hours ago'],['ok','All services running normally','1 day ago']],tasks:[`Review ${verify||2} pending worker verifications`,`Follow up on ${complaints||1} open complaint`,`Check ${cap||1} new capacity request`]};
    }
    const escal=numberish(a[2][3]),assign=numberish(a[1][3]),short=numberish(a[3][3]);
    return {alerts:[['risk',`${escal||1} inter-cooperative complaint escalated`,'2 hours ago'],['warn',`${Math.min(assign||2,2)} cross-coop assignments awaiting review`,'5 hours ago'],['ok','Repeated shortage in electrical services','1 day ago']],tasks:[`Review ${escal||2} escalated complaints`,'Check 1 SLA breach across cooperatives',`Review shortage pattern for electricians`]};
  }

  function dashboardMarkup(r){
    const cfg=CONFIG[r],data=r==='COOPERATIVE_ADMIN'?cooperativeData():federationData();
    const lists=alertTaskMarkup(r,data);
    const att=data.attention.map(x=>statCard(...x)).join('');
    const overview=data.overview.map(x=>miniCard(...x)).join('');
    const federation=r==='FEDERATION_ADMIN';
    return `<section class="af-dashboard" id="afDashboard">
      <section class="af-hero"><div class="af-hero-copy"><span class="af-kicker">${esc(cfg.kicker)}</span><h1>${esc(cfg.title)}</h1><p>${esc(cfg.subtitle)}</p>${federation?federationTrustRow():''}</div><button type="button" class="af-refresh" id="afRefresh">${ICON.refresh} &nbsp; ${esc(cfg.refresh)}</button><div class="af-hero-art"><span class="af-hero-note">${esc(cfg.heroNote).replaceAll('\n','<br>')}</span></div></section>
      <section class="af-attention-grid">${att}</section>
      <section class="af-network"><div class="af-section-head"><div><span class="af-section-kicker">${esc(cfg.networkKicker)}</span><h2>${esc(cfg.networkTitle)}</h2></div><span class="af-scope">⌖ ${esc(cfg.scope)}</span></div><div class="af-overview-grid ${federation?'federation':''}">${overview}</div></section>
      <section class="af-bottom-grid"><article class="af-list-card"><div class="af-list-title"><h3>● &nbsp; Recent Alerts</h3><button type="button" data-af-key="${federation?'complaints':'activity'}">View all →</button></div><div class="af-list">${lists.alerts.map(([tone,text,time])=>`<div class="af-list-row ${tone}"><i></i><span>${esc(text)}</span><small>${esc(time)}</small></div>`).join('')}</div></article><article class="af-list-card"><div class="af-list-title"><h3>☑ &nbsp; Today's Tasks</h3><button type="button" data-af-key="${federation?'reports':'activity'}">View all →</button></div><div class="af-list">${lists.tasks.map(text=>`<div class="af-task-row"><i></i><span>${esc(text)}</span><small>Due today</small></div>`).join('')}</div></article></section>
    </section>`;
  }

  function appMarkup(r){const cfg=CONFIG[r];return `<div id="adminFinalApp"><header class="af-topbar"><div class="af-brand"><button type="button" class="af-mobile-menu" id="afMobileMenu" aria-label="Open navigation">☰</button><img src="app-icon.svg" alt=""><div><strong>San<span>Paid</span></strong><small>Cooperative Workforce Network</small></div></div><div class="af-top-actions"><span class="af-pill online"><i class="af-dot"></i>${esc(cfg.online)}</span><span class="af-pill">${ICON.clock}<span id="afLastSync">Last sync: ${esc(nowLabel())}</span></span><div class="af-profile">${ICON.users}<span class="af-profile-copy"><b>${esc(cfg.roleName)}</b><small>${esc(cfg.subRole)}</small></span></div></div></header><div class="af-layout"><aside class="af-sidebar"><nav class="af-nav">${navMarkup(cfg)}</nav><div class="af-side-foot"><span class="af-community-icon"><i></i><i></i><i></i></span><small>${esc(cfg.footer).replaceAll('\n','<br>')}</small></div></aside><main class="af-main">${dashboardMarkup(r)}<section class="af-detail-stage" id="afDetailStage" hidden><div class="af-detail-head"><div class="af-detail-title"><h1 id="afDetailTitle">Module</h1><p id="afDetailSubtitle">Operational workspace</p></div><button type="button" class="af-back" data-af-key="overview">← Back to Overview</button></div><div class="af-detail-body" id="afDetailBody"></div></section></main></div></div>`;}

  function bindApp(r){
    const app=$('#adminFinalApp');if(!app)return;
    app.addEventListener('click',e=>{const btn=e.target.closest('[data-af-key]');if(btn)openKey(btn.dataset.afKey);});
    $('#afRefresh',app)?.addEventListener('click',()=>refreshData());
    $('#afMobileMenu',app)?.addEventListener('click',()=>app.classList.toggle('nav-open'));
    document.addEventListener('click',e=>{if(!app.classList.contains('nav-open'))return;if(e.target.closest('.af-sidebar,.af-mobile-menu'))return;app.classList.remove('nav-open');});
  }

  function titleForKey(key){const item=CONFIG[currentRole]?.nav.find(x=>x[0]===key);return item||['overview','Overview','Dashboard & insights','home','home'];}
  function setNavActive(key){$$('#adminFinalApp .af-nav [data-af-key]').forEach(b=>b.classList.toggle('active',b.dataset.afKey===key));}

  function resolveLegacy(item){
    const target=item[4];
    if(!target||target==='home')return null;
    if(target.startsWith('#'))return $(target);
    if(target.startsWith('tab:')){
      const tab=target.slice(4);
      window.SanPaidJudgeMode?.switchTab?.(tab);
      return $('#sihJudgeShell .judge-section.active');
    }
    return null;
  }

  function openKey(key){
    const cfg=CONFIG[currentRole],item=cfg?.nav.find(x=>x[0]===key);if(!item)return;
    currentKey=key;setNavActive(key);$('#adminFinalApp')?.classList.remove('nav-open');
    const dash=$('#afDashboard'),stage=$('#afDetailStage'),body=$('#afDetailBody');
    if(key==='overview'){if(dash)dash.hidden=false;if(stage)stage.hidden=true;return;}
    if(dash)dash.hidden=true;if(stage)stage.hidden=false;
    $('#afDetailTitle').textContent=item[1];$('#afDetailSubtitle').textContent=item[2];
    $$('#afDetailBody>[data-af-moved="1"]').forEach(n=>n.hidden=true);
    let target=resolveLegacy(item);
    const reveal=()=>{
      target=target||resolveLegacy(item);
      if(target){target.dataset.afMoved='1';target.hidden=false;body.appendChild(target);return;}
      let fallback=$(`[data-af-fallback="${key}"]`,body);
      if(!fallback){fallback=document.createElement('div');fallback.dataset.afFallback=key;fallback.className='admin-health-error';fallback.textContent='This module is preparing. Return to Overview and open it again in a moment.';body.appendChild(fallback);}fallback.hidden=false;
    };
    reveal();if(!target)setTimeout(reveal,350);
  }

  function refreshData(){
    const old=$('#adminHealthRefresh');old?.click();
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'admin-final-refresh'}}));
    const btn=$('#afRefresh');if(btn){btn.disabled=true;btn.textContent='Refreshing…';}
    setTimeout(()=>{renderHomeOnly();const b=$('#afRefresh');if(b){b.disabled=false;b.innerHTML=`${ICON.refresh} &nbsp; ${esc(CONFIG[currentRole].refresh)}`;}const sync=$('#afLastSync');if(sync)sync.textContent=`Last sync: ${nowLabel()}`;},650);
  }

  function renderHomeOnly(){
    const main=$('#adminFinalApp .af-main');if(!main)return;
    const old=$('#afDashboard');const wrapper=document.createElement('div');wrapper.innerHTML=dashboardMarkup(currentRole);const fresh=wrapper.firstElementChild;
    if(old)old.replaceWith(fresh);else main.prepend(fresh);
    $('#afRefresh',fresh)?.addEventListener('click',refreshData);
    fresh.querySelectorAll('[data-af-key]').forEach(btn=>btn.addEventListener('click',()=>openKey(btn.dataset.afKey)));
  }

  function mount(){
    if(!visibleAdmin())return;
    const r=role(),shell=$('#sihJudgeShell'),content=$('#judgeContent');if(!shell||!content)return;
    shell.classList.add('admin-final-active');
    if(r!==currentRole||!$('#adminFinalApp')){
      currentRole=r;currentKey='overview';$('#adminFinalApp')?.remove();
      content.insertAdjacentHTML('afterbegin',appMarkup(r));bindApp(r);
    }else if(currentKey==='overview'){renderHomeOnly();}
  }

  function cleanup(){const shell=$('#sihJudgeShell');shell?.classList.remove('admin-final-active');$('#adminFinalApp')?.remove();currentRole='';currentKey='overview';}
  function schedule(){clearTimeout(renderTimer);renderTimer=setTimeout(()=>{if(visibleAdmin())mount();else if($('#adminFinalApp'))cleanup();},120);}

  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-admin-role']});
  window.addEventListener('sanpaid:connected-sync',schedule);
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  setTimeout(schedule,0);setTimeout(schedule,900);
})();
