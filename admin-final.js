(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();
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
      name:'Cooperative Admin',scope:'Local cooperative scope',online:'Service Online',kicker:'WELCOME BACK',title:'Cooperative Operations Dashboard',subtitle:'Manage workers, services, verification, complaints and local capacity in one place.',note:'Stronger\nLocal Communities',refresh:'Refresh Local Data',section:'LOCAL SOCIETY OPERATIONS',entity:'YUKTI Kolhapur Services Cooperative',place:'Kolhapur · Local cooperative scope',footer:'Stronger Communities\nThrough Dignified Work',
      nav:[['overview','Overview','Dashboard & insights','home','home'],['workers','Workers','Directory & availability','users','#coop-workers'],['services','Bookings & Services','Active services','calendar','#coop-services'],['payments','Payments & Earnings','Transactions & reports','wallet','#coop-payments'],['sep'],['verification','Trust & Verification','Identity, skills & documents','shield','#coop-verification'],['complaints','Complaints & SLA','Grievances & resolution','headset','#coop-complaints'],['activity','Audit & Activity','Activity logs & traceability','audit','#coop-activity'],['sep'],['capacity','Local Capacity','Demand & workforce gaps','chart','#coop-capacity'],['planning','Demand & Planning','Forecast & planning','chart','tab:planning']]
    },
    FEDERATION_ADMIN:{
      name:'Federation Admin',scope:'Regional oversight',online:'Network Online',kicker:'FEDERATION OPERATIONS',title:'Federation Operations Dashboard',subtitle:'Monitor connected cooperatives, cross-cooperative assignments, escalations and regional capacity in one place.',note:'Stronger\nCooperatives\nA Stronger Region',refresh:'Refresh Federation Data',section:'FEDERATION NETWORK OVERVIEW',entity:'Kolhapur Regional Federation',place:'Kolhapur region · Federation scope',footer:'Regional visibility.\nStronger local cooperatives.',
      nav:[['overview','Overview','Federation dashboard','home','home'],['network','Connected Cooperatives','Network & member societies','users','#fed-network'],['assignments','Cross-Coop Assignments','Shared capacity & coordination','link','tab:capacity'],['complaints','Complaints & Escalations','Inter-cooperative grievances','alert','tab:complaint'],['verification','Trust & Verification','Standards across network','shield','tab:trust'],['capacity','Capacity & Demand','Regional planning & insights','chart','tab:planning'],['payments','Payments & Settlements','Cross-coop transactions','wallet','#fed-records'],['reports','Reports & Audit','Governance & compliance','audit','tab:golden']]
    }
  };

  let activeRole='',activeKey='overview',renderTimer=0;
  const movedOrigins=new Map();

  function role(){
    const auth=String(window.SanPaidAuth?.getRole?.()||'').toUpperCase();if(CONFIG[auth])return auth;
    const shell=$('#sihJudgeShell'),data=String(shell?.dataset?.adminRole||'').toUpperCase();if(CONFIG[data])return data;
    return shell?.classList.contains('federation-govtech')?'FEDERATION_ADMIN':shell?.classList.contains('cooperative-govtech')?'COOPERATIVE_ADMIN':'';
  }
  function visible(){const shell=$('#sihJudgeShell');return !!shell&&!shell.classList.contains('judge-hidden')&&!!CONFIG[role()];}
  function now(){return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});}
  function read(rootSelector,label){const root=$(rootSelector),wanted=norm(label);if(!root)return'';for(const card of $$('article,button,.admin-attention-card',root)){if(norm($('span',card)?.textContent)!==wanted)continue;return String($('strong,b',card)?.textContent||'').trim();}return'';}
  function demo(r,label){
    if(!window.SanPaidReviewRuntime?.enabled)return'—';
    const cooperative={'verification attention':'2','open complaints':'1','sla breaches':'0','capacity requests':'1','total workers':'3','verified workers':'2','available workers':'2','active services':'4','recorded payments':'12'};
    const federation={'connected cooperatives':'8','cross-coop assignments':'12','escalated complaints':'2','repeated shortage signals':'5','verified workers':'126','active cross-coop jobs':'12','open escalations':'2','unfulfilled requests':'9','recorded settlements':'18'};
    return(r==='COOPERATIVE_ADMIN'?cooperative:federation)[norm(label)]??'—';
  }
  function value(label,source,r){return read(source,label)||demo(r,label);}
  function numberValue(v){const n=Number(String(v).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}

  function statCard(tone,icon,label,val,detail,key){return `<article class="af-stat-card ${tone}"><span class="af-stat-icon">${ICON[icon]}</span><span>${esc(label)}</span><strong>${esc(val)}</strong><small>${esc(detail)}</small><button type="button" class="af-stat-link" data-af-key="${esc(key)}">View details →</button></article>`;}
  function miniCard(icon,label,val,detail){return `<article class="af-mini-card"><span class="af-mini-icon">${ICON[icon]}</span><div><span>${esc(label)}</span><strong>${esc(val)}</strong><small>${esc(detail)}</small></div></article>`;}
  function navMarkup(cfg){return cfg.nav.map(item=>item[0]==='sep'?'<div class="af-nav-sep"></div>':`<button type="button" data-af-key="${esc(item[0])}" class="${item[0]==='overview'?'active':''}">${ICON[item[3]]}<b>${esc(item[1])}</b><small>${esc(item[2])}</small></button>`).join('');}
  function dataFor(r){
    if(r==='COOPERATIVE_ADMIN')return{
      attention:[['teal','shield','Verification Attention',value('Verification Attention','#adminAttentionGrid',r),'Documents need review','verification'],['red','alert','Open Complaints',value('Open Complaints','#adminAttentionGrid',r),'Needs follow-up','complaints'],['amber','clock','SLA Breaches',value('SLA Breaches','#adminAttentionGrid',r),'Requires attention','complaints'],['blue','users','Capacity Requests',value('Capacity Requests','#adminAttentionGrid',r),'Needs coordination','capacity']],
      overview:[['users','Total Workers',value('Total Workers','#coopKpis',r),'Registered in this cooperative'],['shield','Verified Workers',value('Verified Workers','#coopKpis',r),'Identity verification completed'],['users','Available Workers',value('Available Workers','#coopKpis',r),'Verified + currently available'],['chart','Active Services',value('Active Services','#coopKpis',r),'Currently running services'],['headset','Open Complaints',value('Open Complaints','#coopKpis',r),'Requiring follow-up'],['rupee','Recorded Payments',value('Recorded Payments','#coopKpis',r),'Transactions this month']]
    };
    const source='#fedNetworkKpis';
    const connected=read(source,'Active Cooperatives')||demo(r,'Connected Cooperatives');
    const verified=read(source,'Verified Workers')||demo(r,'Verified Workers');
    const requests=read(source,'Capacity Requests')||demo(r,'Unfulfilled Requests');
    const escalations=read(source,'Open Escalations')||demo(r,'Open Escalations');
    const gap=read(source,'Regional Capacity Gap');
    const assignments=demo(r,'Cross-Coop Assignments');
    const shortage=gap?String(Math.max(0,numberValue(gap))):demo(r,'Repeated Shortage Signals');
    return{
      attention:[['teal','building','Connected Cooperatives',connected,'Active in the federation','network'],['blue','link','Cross-Coop Assignments',assignments,'Governed shared-capacity jobs','assignments'],['red','alert','Escalated Complaints',escalations,'Need federation attention','complaints'],['amber','chart','Repeated Shortage Signals',shortage,'Human-reviewed planning inputs','capacity']],
      overview:[['building','Connected Cooperatives',connected,'Member societies'],['users','Verified Workers',verified,'Across all cooperatives'],['wallet','Active Cross-Coop Jobs',assignments,'Under federation coordination'],['alert','Open Escalations',escalations,'Require federation action'],['chart','Unfulfilled Requests',requests,'From cooperatives'],['rupee','Recorded Settlements',demo(r,'Recorded Settlements'),'Cross-coop transactions this month']]
    };
  }
  function listsFor(r,data){
    if(r==='COOPERATIVE_ADMIN'){
      const verification=numberValue(data.attention[0][3])||2,complaints=numberValue(data.attention[1][3])||1,capacity=numberValue(data.attention[3][3])||1;
      return{alerts:[['risk',`${complaints} new complaint received`,'2 hours ago'],['warn',`${verification} worker documents pending verification`,'5 hours ago'],['ok','All services running normally','1 day ago']],tasks:[`Review ${verification} pending worker verifications`,`Follow up on ${complaints} open complaint`,`Check ${capacity} new capacity request`]};
    }
    const escalations=numberValue(data.attention[2][3])||2,assignments=numberValue(data.attention[1][3])||12;
    return{alerts:[['risk',`${escalations} inter-cooperative complaint escalated`,'2 hours ago'],['warn',`${Math.min(assignments,2)} cross-coop assignments awaiting review`,'5 hours ago'],['ok','Repeated shortage in electrical services','1 day ago']],tasks:[`Review ${escalations} escalated complaints`,'Check 1 SLA breach across cooperatives','Review shortage pattern for electricians']};
  }
  function trustRow(){return `<div class="af-trust-row"><span>${ICON.eye}Network visibility</span><span>${ICON.users}Cross-coop governance</span><span>${ICON.shield}Escalation oversight</span><span>${ICON.chart}Human-reviewed planning</span></div>`;}
  function dashboardMarkup(r){
    const cfg=CONFIG[r],data=dataFor(r),lists=listsFor(r,data),federation=r==='FEDERATION_ADMIN';
    return `<section class="af-dashboard" id="afDashboard"><section class="af-hero"><div class="af-hero-copy"><span class="af-kicker">${esc(cfg.kicker)}</span><h1>${esc(cfg.title)}</h1><p>${esc(cfg.subtitle)}</p>${federation?trustRow():''}</div><button type="button" class="af-refresh" id="afRefresh">↻ &nbsp; ${esc(cfg.refresh)}</button><div class="af-hero-art"><span class="af-hero-note">${esc(cfg.note).replaceAll('\n','<br>')}</span></div></section><section class="af-attention-grid">${data.attention.map(item=>statCard(...item)).join('')}</section><section class="af-network"><div class="af-section-head"><div><span class="af-section-kicker">${esc(cfg.section)}</span><h2>${esc(cfg.entity)}</h2></div><span class="af-scope">⌖ ${esc(cfg.place)}</span></div><div class="af-overview-grid ${federation?'federation':''}">${data.overview.map(item=>miniCard(...item)).join('')}</div></section><section class="af-bottom-grid"><article class="af-list-card"><div class="af-list-title"><h3>● &nbsp; Recent Alerts</h3><button type="button" data-af-key="${federation?'complaints':'activity'}">View all →</button></div><div class="af-list">${lists.alerts.map(([tone,text,time])=>`<div class="af-list-row ${tone}"><i></i><span>${esc(text)}</span><small>${esc(time)}</small></div>`).join('')}</div></article><article class="af-list-card"><div class="af-list-title"><h3>☑ &nbsp; Today's Tasks</h3><button type="button" data-af-key="${federation?'reports':'activity'}">View all →</button></div><div class="af-list">${lists.tasks.map(text=>`<div class="af-task-row"><i></i><span>${esc(text)}</span><small>Due today</small></div>`).join('')}</div></article></section></section>`;
  }
  function appMarkup(r){
    const cfg=CONFIG[r];
    return `<div id="adminFinalApp"><header class="af-topbar"><div class="af-brand"><button type="button" class="af-mobile-menu" id="afMobileMenu" aria-label="Open navigation" aria-expanded="false">☰</button><img src="app-icon.svg" alt=""><div><strong>San<span>Paid</span></strong><small>Cooperative Workforce Network</small></div></div><div class="af-top-actions"><span class="af-pill online"><i class="af-dot"></i>${esc(cfg.online)}</span><span class="af-pill">${ICON.clock}<span id="afLastSync">Last sync: ${esc(now())}</span></span><div class="af-profile">${ICON.users}<span class="af-profile-copy"><b>${esc(cfg.name)}</b><small>${esc(cfg.scope)}</small></span></div></div></header><div class="af-layout"><aside class="af-sidebar"><nav class="af-nav" aria-label="${esc(cfg.name)} navigation">${navMarkup(cfg)}</nav><div class="af-side-foot"><span class="af-community-icon"><i></i><i></i><i></i></span><small>${esc(cfg.footer).replaceAll('\n','<br>')}</small></div></aside><main class="af-main">${dashboardMarkup(r)}<section class="af-detail-stage" id="afDetailStage" hidden><div class="af-detail-head"><div class="af-detail-title"><h1 id="afDetailTitle">Module</h1><p id="afDetailSubtitle">Operational workspace</p></div><button type="button" class="af-back" data-af-key="overview">← Back to Overview</button></div><div class="af-detail-body" id="afDetailBody"></div></section></main></div></div>`;
  }

  function setActive(key){$$('#adminFinalApp .af-nav [data-af-key]').forEach(button=>{const active=button.dataset.afKey===key;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});}
  function rememberOrigin(node){if(movedOrigins.has(node))return;const parent=node.parentNode;if(!parent)return;movedOrigins.set(node,{parent,next:node.nextSibling,hidden:node.hidden});}
  function restoreMoved(){
    for(const [node,origin] of movedOrigins){
      if(!node?.isConnected&&!origin.parent?.isConnected)continue;
      if(origin.parent?.isConnected){if(origin.next?.parentNode===origin.parent)origin.parent.insertBefore(node,origin.next);else origin.parent.appendChild(node);node.hidden=origin.hidden;delete node.dataset.afMoved;}
    }
    movedOrigins.clear();
    $$('#afDetailBody>[data-af-fallback]').forEach(node=>node.remove());
  }
  function showNode(node){const body=$('#afDetailBody');if(!body||!node)return false;restoreMoved();rememberOrigin(node);node.dataset.afMoved='1';node.hidden=false;body.appendChild(node);return true;}
  function fallbackPanel(key){const body=$('#afDetailBody');if(!body)return;restoreMoved();const panel=document.createElement('div');panel.dataset.afFallback=key;panel.className='admin-health-error';panel.textContent='This module is preparing. Return to Overview and open it again in a moment.';body.appendChild(panel);}
  function resolveItem(key){return CONFIG[activeRole]?.nav.find(item=>item[0]===key)||null;}
  function openKey(key){
    const item=resolveItem(key);if(!item)return;
    const app=$('#adminFinalApp'),dashboard=$('#afDashboard'),stage=$('#afDetailStage');
    activeKey=key;setActive(key);app?.classList.remove('nav-open');$('#afMobileMenu')?.setAttribute('aria-expanded','false');
    if(key==='overview'){restoreMoved();if(dashboard)dashboard.hidden=false;if(stage)stage.hidden=true;return;}
    if(dashboard)dashboard.hidden=true;if(stage)stage.hidden=false;
    $('#afDetailTitle').textContent=item[1];$('#afDetailSubtitle').textContent=item[2];
    const target=item[4];
    if(target.startsWith('#')){const node=$(target);if(showNode(node))return;setTimeout(()=>showNode($(target))||fallbackPanel(key),300);return;}
    if(target.startsWith('tab:')){restoreMoved();window.SanPaidJudgeMode?.switchTab?.(target.slice(4));setTimeout(()=>showNode($('#sihJudgeShell .judge-section.active'))||fallbackPanel(key),160);return;}
    fallbackPanel(key);
  }
  function bindDashboard(){const root=$('#afDashboard');if(!root)return;$('#afRefresh',root)?.addEventListener('click',refreshData);root.querySelectorAll('[data-af-key]').forEach(button=>button.addEventListener('click',()=>openKey(button.dataset.afKey)));}
  function refreshData(){
    $('#adminHealthRefresh')?.click();
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'admin-final-refresh'}}));
    const button=$('#afRefresh');if(button){button.disabled=true;button.textContent='Refreshing…';}
    setTimeout(()=>{
      if(activeKey==='overview'){
        const current=$('#afDashboard');if(current){const wrap=document.createElement('div');wrap.innerHTML=dashboardMarkup(activeRole);current.replaceWith(wrap.firstElementChild);bindDashboard();}
      }
      const sync=$('#afLastSync');if(sync)sync.textContent=`Last sync: ${now()}`;
      const next=$('#afRefresh');if(next){next.disabled=false;next.innerHTML=`↻ &nbsp; ${esc(CONFIG[activeRole].refresh)}`;}
    },650);
  }
  function bindApp(){
    const app=$('#adminFinalApp');if(!app)return;
    app.addEventListener('click',event=>{const button=event.target.closest('[data-af-key]');if(button&&!button.closest('#afDashboard'))openKey(button.dataset.afKey);});
    $('#afMobileMenu',app)?.addEventListener('click',event=>{const open=app.classList.toggle('nav-open');event.currentTarget.setAttribute('aria-expanded',String(open));});
    document.addEventListener('click',event=>{if(!app.classList.contains('nav-open'))return;if(event.target.closest('#adminFinalApp .af-sidebar,#afMobileMenu'))return;app.classList.remove('nav-open');$('#afMobileMenu')?.setAttribute('aria-expanded','false');},{capture:true});
    bindDashboard();
  }
  function mount(){
    if(!visible())return;
    const nextRole=role(),shell=$('#sihJudgeShell'),content=$('#judgeContent');if(!shell||!content)return;
    if(nextRole===activeRole&&$('#adminFinalApp')){shell.classList.add('admin-final-active');return;}
    cleanup(false);activeRole=nextRole;activeKey='overview';shell.classList.add('admin-final-active');content.insertAdjacentHTML('afterbegin',appMarkup(nextRole));bindApp();
  }
  function cleanup(resetRole=true){restoreMoved();const shell=$('#sihJudgeShell');shell?.classList.remove('admin-final-active');$('#adminFinalApp')?.remove();if(resetRole){activeRole='';activeKey='overview';}}
  function schedule(){clearTimeout(renderTimer);renderTimer=setTimeout(()=>{if(visible())mount();else if($('#adminFinalApp'))cleanup();},100);}
  function onMutations(mutations){if(mutations.every(m=>m.target?.closest?.('#adminFinalApp')))return;schedule();}

  new MutationObserver(onMutations).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-admin-role']});
  window.addEventListener('sanpaid:connected-sync',schedule);
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  setTimeout(schedule,0);setTimeout(schedule,900);
})();
