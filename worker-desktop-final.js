(() => {
  'use strict';

  const ICONS={
    overview:'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3Z"/></svg>',
    offers:'<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 6V4h8v2M4 11h16"/></svg>',
    current:'<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L4 17v3h3l5.1-5.1a4 4 0 0 0 5.6-5.6l-2.5 2.5-3-3Z"/></svg>',
    schedule:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    passport:'<svg viewBox="0 0 24 24"><path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></svg>',
    earnings:'<svg viewBox="0 0 24 24"><path d="M6 5h12M6 9h12M6 5c5 0 6 7 0 7h3l7 7"/></svg>',
    updates:'<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>',
    pin:'<svg viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>',
    arrow:'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    shield:'<svg viewBox="0 0 24 24"><path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></svg>'
  };
  const LABELS={overview:'Dashboard',offers:'Job Requests',current:'My Jobs',schedule:'Availability',passport:'Trust Passport',earnings:'Earnings',updates:'Updates & Support'};
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let queued=false;

  function user(){try{return window.SanPaidAuth?.getCurrentUser?.()||{};}catch{return{};}}
  function name(){const u=user();return String(u.fullName||u.name||'Worker').trim()||'Worker';}
  function email(){const u=user();return String(u.email||u.loginId||'worker@sanpaid').trim();}
  function initials(value){const p=String(value||'W').trim().split(/\s+/).filter(Boolean);return (p.length>1?`${p[0][0]}${p.at(-1)[0]}`:(p[0]?.[0]||'W')).toUpperCase();}
  function dashboard(){return $('#connectedContent .cw-dashboard.worker');}
  function openView(view){dashboard()?.querySelector(`[data-cw-view-btn="${view}"]`)?.click();schedule();}

  function read(){
    const dash=dashboard(),overview=dash?.querySelector('[data-cw-view="overview"]');if(!overview)return null;
    const head=overview.querySelector('.cw-role-head'),current=overview.querySelector('.cw-next>div:first-child'),next=overview.querySelector('.cw-next>div+div');
    const metrics=[...overview.querySelectorAll('.cw-metrics>article')];
    const metric=i=>({label:metrics[i]?.querySelector('span')?.textContent?.trim()||'',value:metrics[i]?.querySelector('strong')?.textContent?.trim()||'—',note:metrics[i]?.querySelector('small')?.textContent?.trim()||''});
    return {
      overview,
      availability:head?.querySelector('.cw-status')?.textContent?.trim()||'Available',
      service:current?.querySelector('h3')?.textContent?.trim()||'No active opportunity',
      serviceMeta:current?.querySelector('p')?.textContent?.trim()||'Suitable opportunities appear after eligibility checks.',
      nextTitle:next?.querySelector('h3')?.textContent?.trim()||'Review suitable work',
      nextCopy:next?.querySelector('p')?.textContent?.trim()||'Open job requests and choose Accept or Decline.',
      nextView:next?.querySelector('[data-cw-view-btn]')?.dataset?.cwViewBtn||'offers',
      journey:overview.querySelector('.cw-journey')?.innerHTML||'',
      offers:metric(0),active:metric(1),earnings:metric(2),rating:metric(3)
    };
  }

  function decorateNav(dash){
    const nav=dash?.querySelector('.cw-nav');if(!nav)return;
    nav.querySelectorAll('[data-cw-view-btn]').forEach(button=>{
      const id=button.dataset.cwViewBtn,label=button.querySelector(':scope>span:not(.wd-nav-icon)');
      if(label&&LABELS[id])label.textContent=LABELS[id];
      if(!button.querySelector('.wd-nav-icon')&&ICONS[id]){const icon=document.createElement('span');icon.className='wd-nav-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=ICONS[id];button.prepend(icon);}
    });
    if(!nav.querySelector('.wd-nav-motto')){const m=document.createElement('div');m.className='wd-nav-motto';m.innerHTML='<span>🌱</span><div><b>Serve Today<br>Prepare Tomorrow</b><small>Better Workers<br>Stronger Communities</small></div>';nav.appendChild(m);}
  }

  function ensureHeader(shell,content,dash){
    const subtitle=shell.querySelector('.connected-top-subtitle');if(subtitle)subtitle.textContent='Cooperative Workforce Network';
    const actions=shell.querySelector('.connected-top>.actions'),headerActions=content.querySelector('.connected-session-bar .connected-header-actions'),close=shell.querySelector('#connectedClose');
    if(actions&&headerActions&&headerActions.parentElement!==actions){headerActions.dataset.workerHeaderMoved='true';actions.insertBefore(headerActions,close||null);}
    if(!actions)return;
    let tools=actions.querySelector('.wd-header-tools');if(!tools){tools=document.createElement('div');tools.className='wd-header-tools';actions.prepend(tools);}
    const signature=`${name()}|${email()}`;if(tools.dataset.signature===signature)return;tools.dataset.signature=signature;
    tools.innerHTML=`<span class="wd-location">${ICONS.pin}<b>Kolhapur, MH</b></span><button type="button" class="wd-bell" aria-label="Open updates">${ICONS.updates}<i>2</i></button><div class="wd-profile"><span>${esc(initials(name()))}</span><div><b>${esc(name())}</b><small>Verified Worker</small></div><em>✓</em></div>`;
    tools.querySelector('.wd-bell')?.addEventListener('click',()=>openView('updates'));
  }

  function homeMarkup(data){
    const first=name().split(/\s+/)[0]||'Worker';
    return `<section class="wd-hero"><div><h1>Hello, ${esc(first)}! <span>👋</span></h1><p>Ready to make a difference today?</p></div><span class="wd-availability">● ${esc(data.availability)}</span><div class="wd-hero-art" aria-hidden="true"></div></section>
      <div class="wd-home-grid"><div class="wd-primary">
        <section class="wd-current"><div class="wd-section-top"><h2>Current Job</h2><span class="wd-status">${esc(data.availability)}</span><button type="button" data-wd-view="${esc(data.nextView==='offers'?'current':data.nextView)}">View Details ${ICONS.arrow}</button></div><div class="wd-current-main"><span class="wd-service-icon">${ICONS.current}</span><div><h3>${esc(data.service)}</h3><p>${esc(data.serviceMeta)}</p><small>Worker choice and service-start verification remain recorded.</small></div><button type="button" class="wd-primary-btn" data-wd-view="${esc(data.nextView)}">${esc(data.nextTitle)} ${ICONS.arrow}</button></div><div class="cw-journey wd-journey">${data.journey}</div></section>
        <section class="wd-requests"><div class="wd-section-top"><h2>Job Requests</h2><button type="button" data-wd-view="offers">View All ${ICONS.arrow}</button></div><div class="wd-request-summary"><span class="wd-request-icon">${ICONS.offers}</span><div><b>${esc(data.offers.value)} suitable opportunities</b><small>${esc(data.offers.note||'Eligibility checked before offer')}</small></div><button type="button" data-wd-view="offers">Review Requests</button></div></section>
      </div><aside class="wd-side">
        <section class="wd-profile-card"><div class="wd-section-top"><h2>My Profile</h2><button type="button" data-wd-view="passport">View Trust ${ICONS.arrow}</button></div><div class="wd-profile-main"><span>${esc(initials(name()))}</span><div><h3>${esc(name())} <em>✓</em></h3><p>Verified cooperative worker</p><small>Kolhapur local workforce network</small></div></div><div class="wd-profile-stats"><div><strong>${esc(data.rating.value)}</strong><small>Rating</small></div><div><strong>${esc(data.active.value)}</strong><small>Active Jobs</small></div><div><strong>Verified</strong><small>Trust</small></div></div></section>
        <button type="button" class="wd-earning-card" data-wd-view="earnings"><span>${ICONS.earnings}</span><div><small>Recorded Earnings</small><strong>${esc(data.earnings.value)}</strong><p>${esc(data.earnings.note||'Payment ledger')}</p></div>${ICONS.arrow}</button>
        <section class="wd-safety"><span>${ICONS.shield}</span><div><b>Your Safety Matters</b><small>Review job details and complete service-start verification before work begins.</small></div></section>
      </aside></div>`;
  }

  function ensureHome(dash,data){
    const overview=data.overview;let home=overview.querySelector(':scope>.wd-desktop-home');if(!home){home=document.createElement('div');home.className='wd-desktop-home';overview.appendChild(home);}
    const sig=[name(),data.availability,data.service,data.serviceMeta,data.nextTitle,data.nextCopy,data.nextView,data.offers.value,data.active.value,data.earnings.value,data.rating.value,data.journey].join('|');
    if(home.dataset.signature!==sig){home.dataset.signature=sig;home.innerHTML=homeMarkup(data);home.querySelectorAll('[data-wd-view]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.wdView)));}
    overview.classList.add('wd-home-ready');dash.classList.add('worker-desktop-enhanced');
  }

  function cleanup(shell,content){
    shell?.classList.remove('worker-desktop-final-page');
    shell?.querySelector('.wd-header-tools')?.remove();
    const moved=shell?.querySelector('.connected-top [data-worker-header-moved="true"]');
    const bar=content?.querySelector('.connected-session-bar');
    if(moved){delete moved.dataset.workerHeaderMoved;if(bar)bar.appendChild(moved);else moved.remove();}
  }

  function apply(){
    const shell=$('#connectedShell'),content=$('#connectedContent');if(!shell||!content)return;
    const worker=!shell.classList.contains('hidden')&&String(content.dataset.connectedRole||'').toUpperCase()==='WORKER';
    if(!worker||shell.classList.contains('worker-mobile-final')){cleanup(shell,content);return;}
    const dash=dashboard();if(!dash)return;
    const data=read();if(!data)return;
    shell.classList.add('worker-desktop-final-page');decorateNav(dash);ensureHeader(shell,content,dash);ensureHome(dash,data);
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','data-connected-role']});
  window.addEventListener('resize',schedule,{passive:true});window.addEventListener('orientationchange',schedule,{passive:true});window.addEventListener('sanpaid:connected-sync',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
