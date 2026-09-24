(() => {
  'use strict';

  const ICONS={
    pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>',
    bell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>',
    home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>',
    jobs:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4h8v2M3 11h18M10 11v2h4v-2"/></svg>',
    current:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L4 17v3h3l5.1-5.1a4 4 0 0 0 5.6-5.6l-2.5 2.5-3-3Z"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></svg>',
    wallet:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12"/><path d="M15 11h6v4h-6a2 2 0 0 1 0-4Z"/></svg>',
    profile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 15-7-5 14-3-6Z"/></svg>'
  };

  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const narrowViewport=()=>window.matchMedia('(max-width: 768px)').matches;
  const touchPoints=()=>Number(navigator.maxTouchPoints||0);
  const coarsePointer=()=>window.matchMedia('(pointer: coarse)').matches||touchPoints()>0;
  const screenMin=()=>Math.min(Number(window.screen?.width||Infinity),Number(window.screen?.height||Infinity));
  const mobileUA=()=>/(Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini)/i.test(String(navigator.userAgent||''));
  const phoneLikeTouch=()=>{
    if(!coarsePointer()&&!mobileUA())return false;
    const dpr=Number(window.devicePixelRatio||1);
    return mobileUA()||window.innerWidth<=1100||screenMin()<=900||(window.innerWidth<=1400&&dpr>=1.5);
  };
  const mobile=()=>narrowViewport()||phoneLikeTouch();

  function ensureReferenceStyle(){
    if(document.getElementById('sanpaidWorkerReferenceLock'))return;
    const style=document.createElement('style');style.id='sanpaidWorkerReferenceLock';
    style.textContent=`
#connectedShell.worker-mobile-final{color-scheme:only light!important;background:#f6f9fc!important;color:#0b2c57!important}
#connectedShell.worker-mobile-final .wm-quick-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
#connectedShell.worker-mobile-final .wm-quick-grid>button{position:relative!important;display:grid!important;grid-template-columns:1fr!important;grid-template-rows:42px auto auto!important;align-content:start!important;min-width:0!important;min-height:116px!important;padding:10px 8px!important;border-radius:15px!important;text-align:left!important;background:#fff!important;color:#0b2c57!important}
#connectedShell.worker-mobile-final .wm-quick-icon{grid-row:auto!important;grid-column:1!important;width:40px!important;height:40px!important;border-radius:12px!important}
#connectedShell.worker-mobile-final .wm-quick-grid b{grid-column:1!important;margin:6px 14px 0 0!important;font-size:11.5px!important;line-height:1.15!important;color:#07386f!important}
#connectedShell.worker-mobile-final .wm-quick-grid small{grid-column:1!important;margin:3px 14px 0 0!important;padding:0!important;font-size:9.5px!important;line-height:1.25!important;color:#69809a!important}
#connectedShell.worker-mobile-final .wm-mini-arrow{position:absolute!important;grid-column:auto!important;grid-row:auto!important;right:6px!important;bottom:13px!important;align-self:auto!important;justify-self:auto!important}
#connectedShell.worker-mobile-final .wm-next-card,#connectedShell.worker-mobile-final .wm-trust-card{grid-template-columns:48px minmax(0,1fr) auto!important;align-items:center!important}
#connectedShell.worker-mobile-final .wm-next-card>button,#connectedShell.worker-mobile-final .wm-trust-card>button{grid-column:auto!important;justify-self:end!important;width:auto!important;min-width:0!important;min-height:40px!important;margin-top:0!important;white-space:nowrap!important}
#connectedShell.worker-mobile-final .wm-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#connectedShell.worker-mobile-final>.wm-bottom-nav>button>span{white-space:normal!important;text-align:center!important}
@media(max-width:380px){#connectedShell.worker-mobile-final .wm-brand img{width:34px!important;height:34px!important;flex-basis:34px!important}#connectedShell.worker-mobile-final .wm-brand small{display:none!important}#connectedShell.worker-mobile-final .wm-location{padding:0 6px!important;font-size:9px!important}#connectedShell.worker-mobile-final .wm-header-actions{gap:4px!important}}
@media(max-width:340px){#connectedShell.worker-mobile-final .wm-next-card,#connectedShell.worker-mobile-final .wm-trust-card{grid-template-columns:40px minmax(0,1fr) auto!important;gap:8px!important}#connectedShell.worker-mobile-final .wm-next-card>button,#connectedShell.worker-mobile-final .wm-trust-card>button{min-height:40px!important;padding:0 7px!important;font-size:9.5px!important}#connectedShell.worker-mobile-final .wm-quick-grid{gap:6px!important}#connectedShell.worker-mobile-final .wm-quick-grid>button{padding:9px 6px!important}#connectedShell.worker-mobile-final .wm-quick-grid b{font-size:10.5px!important}#connectedShell.worker-mobile-final .wm-quick-grid small{font-size:9px!important}}`;
    document.head.appendChild(style);
  }

  function currentUser(){try{return window.SanPaidAuth?.getCurrentUser?.()||{};}catch{return{};}}
  function workerName(){const u=currentUser();return String(u.fullName||u.name||'Worker').trim()||'Worker';}
  function workerEmail(){const u=currentUser();return String(u.email||u.loginId||u.username||'worker@sanpaid').trim();}
  function initials(value){const parts=String(value||'W').trim().split(/\s+/).filter(Boolean);return (parts.length>1?`${parts[0][0]}${parts.at(-1)[0]}`:(parts[0]?.[0]||'W')).toUpperCase();}
  function dashboard(){return $('#connectedContent .cw-dashboard.worker');}
  function openView(view){dashboard()?.querySelector(`[data-cw-view-btn="${view}"]`)?.click();schedule();}

  function readDashboard(){
    const dash=dashboard(),overview=dash?.querySelector('[data-cw-view="overview"]');if(!overview)return null;
    const availability=overview.querySelector('.cw-role-head .cw-status')?.textContent?.trim()||'Available';
    const current=overview.querySelector('.cw-next>div:first-child'),next=overview.querySelector('.cw-next>div+div');
    const metrics=[...overview.querySelectorAll('.cw-metrics>article')],journey=overview.querySelector('.cw-journey')?.innerHTML||'';
    const service=current?.querySelector('h3')?.textContent?.trim()||'No active opportunity';
    const serviceMeta=current?.querySelector('p')?.textContent?.trim()||'Suitable opportunities appear after eligibility checks.';
    const nextTitle=next?.querySelector('h3')?.textContent?.trim()||'View suitable jobs';
    const nextCopy=next?.querySelector('p')?.textContent?.trim()||'Review opportunities and choose Accept or Decline.';
    const nextView=next?.querySelector('[data-cw-view-btn]')?.dataset?.cwViewBtn||'offers';
    const metric=index=>({label:metrics[index]?.querySelector('span')?.textContent?.trim()||'',value:metrics[index]?.querySelector('strong')?.textContent?.trim()||'—',note:metrics[index]?.querySelector('small')?.textContent?.trim()||''});
    return{overview,availability,service,serviceMeta,nextTitle,nextCopy,nextView,journey,offers:metric(0),active:metric(1),earnings:metric(2),rating:metric(3)};
  }

  function ensureHeader(main){let node=main.querySelector(':scope>.wm-mobile-header');if(!node){node=document.createElement('header');node.className='wm-mobile-header';main.prepend(node);}return node;}
  function renderHeader(node){
    const name=workerName();if(node.dataset.signature===name)return;node.dataset.signature=name;
    node.innerHTML=`<div class="wm-brand"><img src="app-icon.svg" alt=""><div><strong>San<span>Paid</span></strong><small>Cooperative Workforce Network</small></div></div><div class="wm-header-actions"><span class="wm-location">${ICONS.pin}<b>Kolhapur, MH</b></span><button type="button" class="wm-icon-btn" aria-label="Open updates">${ICONS.bell}</button><button type="button" class="wm-avatar" aria-label="Open profile">${esc(initials(name))}</button></div>`;
    node.querySelector('.wm-icon-btn')?.addEventListener('click',()=>openView('updates'));node.querySelector('.wm-avatar')?.addEventListener('click',openProfile);
  }
  function homeMarkup(data){
    const first=workerName().split(/\s+/)[0]||'Worker';
    const earningsValue=data.earnings.value||'—',ratingValue=data.rating.value||'—';
    return `<section class="wm-greeting"><div><span>Hello,</span><h1>${esc(first)}</h1><p>Manage jobs, track earnings, and serve with confidence.</p></div><div class="wm-duty"><span class="wm-duty-pill">${esc(data.availability)}</span><small>Availability</small></div></section><button type="button" class="wm-primary-cta" data-wm-view="offers"><span class="wm-primary-icon">${ICONS.jobs}</span><span><b>Today's Jobs</b><small>View job requests near you</small></span><span class="wm-primary-arrow">${ICONS.arrow}</span></button><section class="wm-quick-grid"><button type="button" data-wm-view="current"><span class="wm-quick-icon">${ICONS.current}</span><b>My Jobs</b><small>Active & completed</small><span class="wm-mini-arrow">${ICONS.arrow}</span></button><button type="button" data-wm-view="earnings"><span class="wm-quick-icon teal">${ICONS.wallet}</span><b>Earnings</b><small>Track your income</small><span class="wm-mini-arrow">${ICONS.arrow}</span></button><button type="button" data-wm-view="passport"><span class="wm-quick-icon">${ICONS.shield}</span><b>Ratings</b><small>Your performance</small><span class="wm-mini-arrow">${ICONS.arrow}</span></button></section><section class="wm-work-card"><div class="wm-work-top"><span class="wm-status-chip">${esc(data.availability)}</span><button type="button" data-wm-view="${esc(data.nextView==='offers'?'offers':'current')}">View Details ${ICONS.arrow}</button></div><div class="wm-work-main"><span class="wm-service-icon">${ICONS.current}</span><div class="wm-work-copy"><h2>${esc(data.service)}</h2><b>${esc(data.serviceMeta)}</b><small>Worker choice remains with you.</small></div></div><div class="cw-journey wm-home-journey">${data.journey}</div></section><section class="wm-next-card"><span class="wm-next-icon">${ICONS.next}</span><div><small>WHAT'S NEXT?</small><h3>${esc(data.nextTitle)}</h3><p>${esc(data.nextCopy)}</p></div><button type="button" data-wm-view="${esc(data.nextView)}">Open ${ICONS.arrow}</button></section><section class="wm-metrics"><button type="button" data-wm-view="earnings"><span>Today's Earnings</span><strong>${esc(earningsValue)}</strong><small>${esc(data.earnings.note||'Recorded service income')}</small>${ICONS.arrow}</button><button type="button" data-wm-view="passport"><span>Customer Rating</span><strong>${esc(ratingValue)}</strong><small>${esc(data.rating.note||'Service feedback')}</small>${ICONS.arrow}</button></section><section class="wm-trust-card"><span class="wm-trust-icon">${ICONS.shield}</span><div><b>Your trust record travels with you</b><small>Verification, skills and work outcomes remain visible.</small></div><button type="button" data-wm-view="passport">View Passport</button></section>`;
  }
  function ensureHome(overview,data){
    let home=overview.querySelector(':scope>.wm-mobile-home');if(!home){home=document.createElement('div');home.className='wm-mobile-home';overview.appendChild(home);}
    const signature=[workerName(),data.availability,data.service,data.serviceMeta,data.nextTitle,data.nextCopy,data.nextView,data.offers.value,data.earnings.value,data.rating.value,data.journey].join('|');
    if(home.dataset.signature!==signature){home.dataset.signature=signature;home.innerHTML=homeMarkup(data);home.querySelectorAll('[data-wm-view]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.wmView)));}
    overview.classList.add('wm-home-ready');
  }
  function ensureBottomNav(shell){
    let nav=shell.querySelector(':scope>.wm-bottom-nav');if(!nav){nav=document.createElement('nav');nav.className='wm-bottom-nav';nav.setAttribute('aria-label','Worker mobile navigation');nav.innerHTML=`<button type="button" data-wm-view="overview">${ICONS.home}<span>Home</span></button><button type="button" data-wm-view="offers">${ICONS.jobs}<span>Jobs</span></button><button type="button" data-wm-view="earnings">${ICONS.wallet}<span>Earnings</span></button><button type="button" data-wm-profile>${ICONS.profile}<span>Profile</span></button>`;shell.appendChild(nav);nav.querySelectorAll('[data-wm-view]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.wmView)));nav.querySelector('[data-wm-profile]')?.addEventListener('click',openProfile);}return nav;
  }
  function syncBottomNav(nav,dash){const current=dash?.querySelector('[data-cw-view]:not([hidden])')?.dataset?.cwView||'overview';nav.querySelectorAll('[data-wm-view]').forEach(button=>{const active=button.dataset.wmView===current;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});nav.querySelector('[data-wm-profile]')?.classList.remove('active');}
  function ensureProfile(shell){let layer=shell.querySelector(':scope>.wm-profile-layer');if(!layer){layer=document.createElement('div');layer.className='wm-profile-layer';layer.hidden=true;shell.appendChild(layer);}return layer;}
  function renderProfile(layer){
    const name=workerName(),email=workerEmail(),sig=`${name}|${email}`;if(layer.dataset.signature===sig)return;layer.dataset.signature=sig;
    layer.innerHTML=`<div class="wm-profile-backdrop" data-wm-profile-close></div><section class="wm-profile-sheet" role="dialog" aria-modal="true" aria-label="Worker profile"><div class="wm-profile-head"><span>${esc(initials(name))}</span><div><h3>${esc(name)}</h3><p>${esc(email)}</p><b>Worker</b></div><button type="button" data-wm-profile-close aria-label="Close profile">×</button></div><div class="wm-profile-actions"><button type="button" data-wm-view="schedule">${ICONS.calendar}<span><b>Availability</b><small>Manage when you receive work</small></span>${ICONS.arrow}</button><button type="button" data-wm-view="passport">${ICONS.shield}<span><b>Trust Passport</b><small>Skills, verification and outcomes</small></span>${ICONS.arrow}</button><button type="button" data-wm-view="earnings">${ICONS.wallet}<span><b>Earnings</b><small>Review recorded payments</small></span>${ICONS.arrow}</button><button type="button" data-wm-switch>${ICONS.jobs}<span><b>Switch Role</b><small>Open another SanPaid workspace</small></span>${ICONS.arrow}</button><button type="button" class="danger" data-wm-logout>${ICONS.profile}<span><b>Logout</b><small>End this session</small></span>${ICONS.arrow}</button></div></section>`;
    layer.querySelectorAll('[data-wm-profile-close]').forEach(node=>node.addEventListener('click',closeProfile));layer.querySelectorAll('[data-wm-view]').forEach(button=>button.addEventListener('click',()=>{closeProfile();openView(button.dataset.wmView);}));layer.querySelector('[data-wm-switch]')?.addEventListener('click',()=>document.getElementById('connectedSwitch')?.click());layer.querySelector('[data-wm-logout]')?.addEventListener('click',()=>document.getElementById('connectedLogout')?.click());
  }
  function openProfile(){const shell=$('#connectedShell');if(!shell)return;const layer=ensureProfile(shell);renderProfile(layer);layer.hidden=false;document.documentElement.classList.add('wm-profile-open');}
  function closeProfile(){const layer=$('#connectedShell>.wm-profile-layer');if(layer)layer.hidden=true;document.documentElement.classList.remove('wm-profile-open');}
  function cleanup(shell){shell?.querySelector(':scope>.wm-bottom-nav')?.remove();shell?.querySelector(':scope>.wm-profile-layer')?.remove();shell?.classList.remove('worker-mobile-final','worker-mobile-ready');document.documentElement.classList.remove('wm-profile-open');}

  function apply(){
    const shell=$('#connectedShell'),content=$('#connectedContent');if(!shell||!content)return;
    const isWorker=!shell.classList.contains('hidden')&&String(content.dataset.connectedRole||'').toUpperCase()==='WORKER';
    const active=isWorker&&mobile();shell.dataset.workerMobileMode=active?'true':'false';
    if(!active){cleanup(shell);if(!shell.classList.contains('customer-mobile-bootstrap'))shell.classList.remove('role-mobile-final');return;}
    ensureReferenceStyle();
    const dash=dashboard(),data=readDashboard(),main=dash?.querySelector('.cw-main');
    if(!dash||!data||!main){shell.classList.remove('worker-mobile-final','worker-mobile-ready');return;}
    renderHeader(ensureHeader(main));ensureHome(data.overview,data);const nav=ensureBottomNav(shell);syncBottomNav(nav,dash);
    shell.classList.add('worker-mobile-final','worker-mobile-ready','role-mobile-final');
  }

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-connected-role']});
  window.addEventListener('resize',schedule,{passive:true});window.addEventListener('orientationchange',schedule,{passive:true});document.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
})();
