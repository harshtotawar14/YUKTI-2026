(() => {
  'use strict';

  const ICONS={
    overview:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>',
    book:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>',
    booking:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
    verify:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>',
    payment:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
    support:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 19c-.7 1.3-2 2-4 2"/></svg>',
    pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>',
    bell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></svg>'
  };
  const NAV_LABELS={overview:'Dashboard',book:'Book Service',booking:'My Bookings',verify:'Verified Workers',payment:'Payments & Invoice',support:'Support'};
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function currentUser(){try{return window.SanPaidAuth?.getCurrentUser?.()||{};}catch{return{};}}
  function customerName(){const u=currentUser();return String(u.fullName||u.name||'Customer').trim()||'Customer';}
  function customerEmail(){const u=currentUser();return String(u.email||u.loginId||u.username||'customer@sanpaid').trim();}
  function initials(value){const p=String(value||'C').trim().split(/\s+/).filter(Boolean);return (p.length>1?`${p[0][0]}${p.at(-1)[0]}`:(p[0]?.[0]||'C')).toUpperCase();}
  function mobileMode(shell){return shell?.dataset?.customerMobileMode==='true';}

  function parseCurrentLine(line){const p=String(line||'').split('·').map(v=>v.trim()).filter(Boolean);return{code:p[0]||'',service:p.slice(1).join(' · ')||''};}
  function readDashboard(dashboard){
    const overview=dashboard?.querySelector('[data-cw-view="overview"]');if(!overview)return null;
    const status=overview.querySelector('.cw-role-head>.cw-status')?.textContent?.trim()||'Ready';
    const current=overview.querySelector('.cw-next>div:first-child');
    const next=overview.querySelector('.cw-next>div+div');
    const currentLine=parseCurrentLine(current?.querySelector('p')?.textContent?.trim());
    const metrics=[...overview.querySelectorAll('.cw-metrics>article')];
    const bookingCode=metrics[0]?.querySelector('strong')?.textContent?.trim()||currentLine.code||'—';
    const worker=metrics[1]?.querySelector('strong')?.textContent?.trim()||'Not assigned';
    const workerNote=metrics[1]?.querySelector('small')?.textContent?.trim()||'Shown after worker acceptance';
    const amount=metrics[2]?.querySelector('strong')?.textContent?.trim()||'—';
    const amountNote=metrics[2]?.querySelector('small')?.textContent?.trim()||'Approved extras only';
    const serviceStart=metrics[3]?.querySelector('strong')?.textContent?.trim()||'Dual Check';
    const bookingView=dashboard.querySelector('[data-cw-view="booking"]');
    const bookingSummary=bookingView?.querySelector('.cw-panel p')?.textContent?.trim()||'';
    const service=currentLine.service||bookingView?.querySelector('.cw-panel p b')?.textContent?.trim()||'Service request';
    const nextTitle=next?.querySelector('h3')?.textContent?.trim()||'Book your first service';
    const nextCopy=next?.querySelector('p')?.textContent?.trim()||'Choose a service, time and location.';
    const nextView=next?.querySelector('[data-cw-view-btn]')?.dataset?.cwViewBtn||'book';
    const journey=overview.querySelector('.cw-journey')?.innerHTML||'';
    const activeBooking=Boolean(bookingCode&&bookingCode!=='—');
    return{overview,status,bookingCode,worker,workerNote,amount,amountNote,serviceStart,service,bookingSummary,nextTitle,nextCopy,nextView,journey,activeBooking};
  }
  function openView(dashboard,view){dashboard?.querySelector(`[data-cw-view-btn="${view}"]`)?.click();}

  function clearDesktopPresentation(shell,dashboard){
    shell?.querySelector('.cr-header-tools')?.remove();
    dashboard?.querySelector('.cr-desktop-home')?.remove();
    dashboard?.querySelector('.cr-nav-motto')?.remove();
    dashboard?.querySelectorAll('.cr-nav-icon').forEach(node=>node.remove());
    dashboard?.classList.remove('customer-desktop-enhanced');
    dashboard?.querySelector('[data-cw-view="overview"]')?.classList.remove('cr-home-ready');
  }
  function decorateNav(dashboard){
    const nav=dashboard?.querySelector('.cw-nav');if(!nav)return;
    nav.querySelectorAll('[data-cw-view-btn]').forEach(button=>{
      const id=button.dataset.cwViewBtn,label=button.querySelector(':scope>span:not(.cr-nav-icon)');
      if(label&&NAV_LABELS[id])label.textContent=NAV_LABELS[id];
      if(!button.querySelector('.cr-nav-icon')&&ICONS[id]){const icon=document.createElement('span');icon.className='cr-nav-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=ICONS[id];button.prepend(icon);}
    });
    if(!nav.querySelector('.cr-nav-motto')){const motto=document.createElement('div');motto.className='cr-nav-motto';motto.innerHTML='<span aria-hidden="true">🌱</span><div><b>Serve Today<br>Prepare Tomorrow</b><small>Better Homes<br>Stronger Communities</small></div>';nav.appendChild(motto);}
  }
  function ensureDesktopHeader(shell,dashboard){
    const subtitle=shell.querySelector('.connected-top-subtitle');if(subtitle)subtitle.textContent='Cooperative Workforce Network';
    const actions=shell.querySelector('.connected-top>.actions');if(!actions)return;
    let tools=actions.querySelector('.cr-header-tools');if(!tools){tools=document.createElement('div');tools.className='cr-header-tools';actions.prepend(tools);}
    const name=customerName(),email=customerEmail(),signature=`${name}|${email}`;if(tools.dataset.signature===signature)return;
    tools.dataset.signature=signature;
    tools.innerHTML=`<div class="cr-location">${ICONS.pin}<span>Kolhapur, MH</span><b aria-hidden="true">⌄</b></div><button type="button" class="cr-bell" aria-label="Open support and updates">${ICONS.bell}<i>3</i></button><div class="cr-profile-chip"><span>${esc(initials(name))}</span><div><b>${esc(name)}</b><small>Customer</small></div><em title="${esc(email)}">✓</em></div>`;
    tools.querySelector('.cr-bell')?.addEventListener('click',()=>openView(dashboard,'support'));
  }
  function desktopHomeMarkup(data){
    const name=customerName(),assigned=data.worker&&!/^not assigned$/i.test(data.worker),status=data.activeBooking?data.status:'Ready',code=data.activeBooking?data.bookingCode:'No active booking',service=data.activeBooking?data.service:'Book your first service';
    return `<section class="cr-hero"><div><h1>Hello, ${esc(name)}! <span aria-hidden="true">👋</span></h1><p>Your service journey in one place.</p></div><div class="cr-hero-art" aria-hidden="true"><i></i><i></i><i></i><span>Safer service<br>Stronger communities</span></div></section><div class="cr-home-grid"><div class="cr-home-primary"><section class="cr-current-card"><div class="cr-section-top"><h2>Current Booking</h2><span class="cr-status">${esc(status)}</span><button type="button" data-cr-view="booking">View Details ${ICONS.arrow}</button></div><div class="cr-booking-main"><span class="cr-service-icon">${ICONS.overview}</span><div class="cr-booking-copy"><h3>${esc(service)}</h3><p>${esc(code)}</p><small>${esc(data.bookingSummary||'Kolhapur service request')}</small></div><div class="cr-booking-actions"><button type="button" class="primary" data-cr-view="${esc(data.nextView)}">Open Next Step ${ICONS.arrow}</button><button type="button" data-cr-view="support">Contact Support</button></div></div><div class="cw-journey cr-desktop-journey">${data.journey}</div></section><section class="cr-shortcuts-card"><div class="cr-section-top"><h2>Service Actions</h2><span>Everything you need for this booking</span></div><div class="cr-shortcuts"><button type="button" data-cr-view="book"><span>${ICONS.book}</span><div><b>Book Service</b><small>Start a new request</small></div>${ICONS.arrow}</button><button type="button" data-cr-view="booking"><span>${ICONS.booking}</span><div><b>My Bookings</b><small>Track service progress</small></div>${ICONS.arrow}</button><button type="button" data-cr-view="verify"><span>${ICONS.verify}</span><div><b>Verified Worker</b><small>Confirm service identity</small></div>${ICONS.arrow}</button><button type="button" data-cr-view="payment"><span>${ICONS.payment}</span><div><b>Payments & Invoice</b><small>Review approved amount</small></div>${ICONS.arrow}</button></div></section></div><aside class="cr-home-side"><section class="cr-side-card cr-worker-card"><div class="cr-section-top"><h2>Assigned Worker</h2><button type="button" data-cr-view="verify">View Profile ${ICONS.arrow}</button></div><div class="cr-worker-profile"><span class="cr-worker-avatar">${esc(assigned?initials(data.worker):'—')}</span><div><h3>${esc(assigned?data.worker:'Assignment pending')}</h3><p>${esc(assigned?data.workerNote:'A verified cooperative worker will appear here after acceptance.')}</p>${assigned?'<b class="cr-verified">✓ Verified</b>':''}</div></div><div class="cr-worker-stats"><div><strong>${assigned?'Verified':'Pending'}</strong><small>Trust status</small></div><div><strong>Local</strong><small>Cooperative network</small></div></div></section><section class="cr-side-card cr-amount-card"><div><span>Current Amount</span><strong>${esc(data.amount)}</strong><small>${esc(data.amountNote)}</small></div><button type="button" data-cr-view="payment">View Invoice ${ICONS.arrow}</button></section><section class="cr-side-card cr-help-card"><span>${ICONS.support}</span><div><h3>Need Help?</h3><p>Our support team is here for you.</p></div><button type="button" data-cr-view="support">Contact Support ${ICONS.arrow}</button></section><section class="cr-safety-card"><span>${ICONS.shield}</span><div><b>Your Safety Matters</b><small>Verify the booked worker and use the service-start confirmation before work begins.</small></div></section></aside></div>`;
  }
  function ensureDesktopHome(dashboard){
    const data=readDashboard(dashboard);if(!data)return;const overview=data.overview;
    let home=overview.querySelector(':scope>.cr-desktop-home');if(!home){home=document.createElement('div');home.className='cr-desktop-home';overview.appendChild(home);}
    const signature=[customerName(),data.status,data.bookingCode,data.worker,data.amount,data.nextTitle,data.nextCopy,data.service,data.journey].join('|');
    if(home.dataset.signature!==signature){home.dataset.signature=signature;home.innerHTML=desktopHomeMarkup(data);home.querySelectorAll('[data-cr-view]').forEach(button=>button.addEventListener('click',()=>openView(dashboard,button.dataset.crView)));}
    overview.classList.add('cr-home-ready');dashboard.classList.add('customer-desktop-enhanced');
  }
  function requestDashboard(content){
    if(content.querySelector('.cw-dashboard.customer')){delete content.dataset.crRefreshRequested;return;}
    if(content.dataset.crRefreshRequested==='true')return;content.dataset.crRefreshRequested='true';
    window.SanPaidCustomerWorkerDashboard?.requestRefresh?.();
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'customer-final-open'}}));
  }
  function cleanup(shell,content){shell.querySelector('.cr-header-tools')?.remove();delete content.dataset.crRefreshRequested;}
  function apply(){
    const shell=$('#connectedShell'),content=$('#connectedContent');if(!shell||!content)return;
    const isCustomer=!shell.classList.contains('hidden')&&String(content.dataset.connectedRole||'').toUpperCase()==='CUSTOMER';
    shell.classList.toggle('customer-reference-page',isCustomer);
    if(!isCustomer){cleanup(shell,content);return;}
    requestDashboard(content);
    const dashboard=content.querySelector('.cw-dashboard.customer');if(!dashboard)return;
    if(mobileMode(shell)){clearDesktopPresentation(shell,dashboard);return;}
    decorateNav(dashboard);ensureDesktopHeader(shell,dashboard);ensureDesktopHome(dashboard);
  }

  window.SanPaidCustomerReference=Object.freeze({readDashboard,openView,customerName,customerEmail,currentUser,initials,icons:ICONS});
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-connected-role','data-customer-mobile-mode']});
  window.addEventListener('sanpaid:connected-sync',schedule);
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
})();
