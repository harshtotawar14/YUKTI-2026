(() => {
  'use strict';

  const ICONS={
    pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>',
    bell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>',
    home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>',
    plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    users:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M18 8a3 3 0 0 1 0 6M21 21v-2a3 3 0 0 0-2-2.8"/></svg>',
    card:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 15-7-5 14-3-6Z"/></svg>',
    support:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 19c-.7 1.3-2 2-4 2"/></svg>',
    profile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></svg>'
  };

  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const api=()=>window.SanPaidCustomerReference||{};

  function dashboard(){return $('#connectedContent .cw-dashboard.customer');}
  function read(){return api().readDashboard?.(dashboard())||null;}
  function name(){return api().customerName?.()||'Customer';}
  function email(){return api().customerEmail?.()||'customer@sanpaid';}
  function initials(value){return api().initials?.(value)||'C';}
  function openView(view){api().openView?.(dashboard(),view);schedule();}

  function ensureHeader(main){
    let header=main.querySelector(':scope>.cm-mobile-header');
    if(header)return header;
    header=document.createElement('header');
    header.className='cm-mobile-header';
    main.prepend(header);
    return header;
  }

  function renderHeader(header){
    const userName=name();
    const signature=userName;
    if(header.dataset.signature===signature)return;
    header.dataset.signature=signature;
    header.innerHTML=`
      <div class="cm-brand-lockup"><img src="app-icon.svg" alt=""><div><strong>San<span>Paid</span></strong><small>Cooperative Workforce Network</small></div></div>
      <div class="cm-header-actions">
        <span class="cm-location">${ICONS.pin}<b>Kolhapur, MH</b><span aria-hidden="true">⌄</span></span>
        <button type="button" class="cm-bell" aria-label="Open updates">${ICONS.bell}<i>3</i></button>
        <button type="button" class="cm-avatar" aria-label="Open profile">${esc(initials(userName))}</button>
      </div>`;
    header.querySelector('.cm-bell')?.addEventListener('click',()=>openView('support'));
    header.querySelector('.cm-avatar')?.addEventListener('click',openProfile);
  }

  function mobileHomeMarkup(data){
    const userName=name();
    const workerAssigned=data.worker&&!/^not assigned$/i.test(data.worker);
    const active=data.activeBooking;
    const status=active?data.status:'Ready';
    const code=active?data.bookingCode:'No active booking';
    const service=active?data.service:'Service request';
    return `
      <section class="cm-mobile-greeting">
        <div><span>Hello,</span><h1>Welcome back!</h1><p>Your service journey in one place.</p></div>
        <div class="cm-motto"><span aria-hidden="true">🌱</span><b>Serve Today<br>Prepare Tomorrow</b></div>
      </section>
      <button type="button" class="cm-book-cta" data-cm-view="book"><span class="cm-book-plus">${ICONS.plus}</span><span><b>Book a Service</b><small>Get help from verified cooperative workers</small></span><span class="cm-book-arrow">${ICONS.arrow}</span></button>
      <section class="cm-quick-grid">
        <button type="button" data-cm-view="booking"><span class="cm-quick-icon">${ICONS.calendar}</span><b>My Bookings</b><small>View & manage</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>
        <button type="button" data-cm-view="verify"><span class="cm-quick-icon">${ICONS.users}</span><b>Verified Workers</b><small>Trusted professionals</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>
        <button type="button" data-cm-view="payment"><span class="cm-quick-icon">${ICONS.card}</span><b>Payments</b><small>View invoices</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>
      </section>
      <section class="cm-booking-card">
        <div class="cm-booking-top"><span class="cm-status-chip">${esc(status)}</span><button type="button" data-cm-view="booking">View Details ${ICONS.arrow}</button></div>
        <div class="cm-booking-main"><span class="cm-service-icon">${ICONS.home}</span><div class="cm-booking-copy"><h2>${esc(service)}</h2><b>${esc(code)}</b><small>${active?esc(data.bookingSummary||'Current service request'):'Book a service to begin'}</small>${workerAssigned?`<div class="cm-worker-inline"><span>${esc(initials(data.worker))}</span><div><strong>${esc(data.worker)}</strong><small>Verified cooperative worker</small></div><em>✓</em></div>`:''}</div></div>
        <div class="cw-journey cm-home-journey">${data.journey}</div>
      </section>
      <section class="cm-next-card"><span class="cm-next-icon">${ICONS.next}</span><div><small>WHAT'S NEXT?</small><h3>${esc(data.nextTitle)}</h3><p>${esc(data.nextCopy)}</p></div><button type="button" data-cm-view="${esc(data.nextView)}">${active?'View Booking':'Open'} ${ICONS.arrow}</button></section>
      <section class="cm-mobile-metrics">
        <button type="button" data-cm-view="verify"><span>Booked Worker</span><strong>${esc(workerAssigned?data.worker:'Not assigned')}</strong><small>${esc(workerAssigned?data.workerNote:'Shown after worker acceptance')}</small>${ICONS.arrow}</button>
        <button type="button" data-cm-view="payment"><span>Estimated Amount</span><strong>${esc(data.amount)}</strong><small>${esc(data.amountNote)}</small>${ICONS.arrow}</button>
      </section>
      <section class="cm-support-card"><span class="cm-support-icon">${ICONS.support}</span><div><b>Need Help?</b><small>Our support team is here for you.</small></div><button type="button" data-cm-view="support">Contact Support</button></section>`;
  }

  function ensureMobileHome(overview,data){
    let home=overview.querySelector(':scope>.cm-mobile-home');
    if(!home){home=document.createElement('div');home.className='cm-mobile-home';overview.appendChild(home);}
    const signature=[name(),data.status,data.bookingCode,data.worker,data.amount,data.service,data.nextTitle,data.nextCopy,data.journey].join('|');
    if(home.dataset.signature!==signature){
      home.dataset.signature=signature;
      home.innerHTML=mobileHomeMarkup(data);
      home.querySelectorAll('[data-cm-view]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.cmView)));
    }
    overview.classList.add('cm-home-ready');
  }

  function ensureBottomNav(shell){
    let nav=shell.querySelector(':scope>.cm-bottom-nav');
    if(!nav){
      nav=document.createElement('nav');
      nav.className='cm-bottom-nav';
      nav.setAttribute('aria-label','Customer mobile navigation');
      nav.innerHTML=`
        <button type="button" data-cm-view="overview">${ICONS.home}<span>Home</span></button>
        <button type="button" data-cm-view="book">${ICONS.plus}<span>Book Service</span></button>
        <button type="button" data-cm-view="booking">${ICONS.calendar}<span>Bookings</span></button>
        <button type="button" data-cm-profile>${ICONS.profile}<span>Profile</span></button>`;
      shell.appendChild(nav);
      nav.querySelectorAll('[data-cm-view]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.cmView)));
      nav.querySelector('[data-cm-profile]')?.addEventListener('click',openProfile);
    }
    return nav;
  }

  function ensureProfileSheet(shell){
    let wrap=shell.querySelector(':scope>.cm-profile-layer');
    if(wrap)return wrap;
    wrap=document.createElement('div');
    wrap.className='cm-profile-layer';
    wrap.hidden=true;
    shell.appendChild(wrap);
    return wrap;
  }

  function renderProfileSheet(layer){
    const userName=name();
    const sig=`${userName}|${email()}`;
    if(layer.dataset.signature===sig)return;
    layer.dataset.signature=sig;
    layer.innerHTML=`<div class="cm-profile-backdrop" data-cm-profile-close></div><section class="cm-profile-sheet" role="dialog" aria-modal="true" aria-label="Customer profile"><div class="cm-profile-head"><span>${esc(initials(userName))}</span><div><h3>${esc(userName)}</h3><p>${esc(email())}</p><b>Customer</b></div><button type="button" data-cm-profile-close aria-label="Close profile">×</button></div><div class="cm-profile-actions"><button type="button" data-cm-view="booking">${ICONS.calendar}<span><b>My Bookings</b><small>Track your service history</small></span>${ICONS.arrow}</button><button type="button" data-cm-view="support">${ICONS.support}<span><b>Help & Support</b><small>Open support and updates</small></span>${ICONS.arrow}</button><button type="button" data-cm-switch>${ICONS.users}<span><b>Switch Role</b><small>Open another SanPaid workspace</small></span>${ICONS.arrow}</button><button type="button" class="danger" data-cm-logout>${ICONS.profile}<span><b>Logout</b><small>End this session</small></span>${ICONS.arrow}</button></div></section>`;
    layer.querySelectorAll('[data-cm-profile-close]').forEach(node=>node.addEventListener('click',closeProfile));
    layer.querySelectorAll('[data-cm-view]').forEach(button=>button.addEventListener('click',()=>{closeProfile();openView(button.dataset.cmView);}));
    layer.querySelector('[data-cm-switch]')?.addEventListener('click',()=>document.getElementById('connectedSwitch')?.click());
    layer.querySelector('[data-cm-logout]')?.addEventListener('click',()=>document.getElementById('connectedLogout')?.click());
  }

  function openProfile(){const shell=$('#connectedShell');if(!shell)return;const layer=ensureProfileSheet(shell);renderProfileSheet(layer);layer.hidden=false;document.documentElement.classList.add('cm-profile-open');}
  function closeProfile(){const layer=$('#connectedShell>.cm-profile-layer');if(layer)layer.hidden=true;document.documentElement.classList.remove('cm-profile-open');}

  function syncBottomNav(nav,dash){
    const current=dash?.querySelector('[data-cw-view]:not([hidden])')?.dataset?.cwView||'overview';
    nav.querySelectorAll('[data-cm-view]').forEach(button=>{
      const active=button.dataset.cmView===current;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    nav.querySelector('[data-cm-profile]')?.classList.remove('active');
  }

  function cleanup(){
    document.querySelector('#connectedShell>.cm-bottom-nav')?.remove();
    document.querySelector('#connectedShell>.cm-profile-layer')?.remove();
    document.documentElement.classList.remove('cm-profile-open');
  }

  function apply(){
    const shell=$('#connectedShell');
    const content=$('#connectedContent');
    if(!shell||!content)return;
    const mobileMode=!shell.classList.contains('hidden')&&shell.dataset.customerMobileMode==='true'&&String(content.dataset.connectedRole||'').toUpperCase()==='CUSTOMER';
    if(!mobileMode){shell.classList.remove('customer-mobile-ready');cleanup();return;}
    const dash=dashboard();
    if(!dash)return;
    const data=read();
    if(!data)return;
    const main=dash.querySelector('.cw-main');
    const overview=data.overview;
    if(!main||!overview)return;
    const header=ensureHeader(main);
    renderHeader(header);
    ensureMobileHome(overview,data);
    const nav=ensureBottomNav(shell);
    syncBottomNav(nav,dash);
    shell.classList.add('customer-mobile-ready');
  }

  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-connected-role','data-customer-mobile-mode']});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  schedule();
})();
