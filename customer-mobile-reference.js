(() => {
  'use strict';

  const ICONS = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></svg>',
    card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    support: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 19c-.7 1.3-2 2-4 2"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };

  const STEPS=['Request','Eligibility','Worker Choice','Arrival','Verification','Service','Payment'];
  const text=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};

  function installStableStyles(){
    if(document.getElementById('sanpaidCustomerStableMobileStyles'))return;
    const style=document.createElement('style');
    style.id='sanpaidCustomerStableMobileStyles';
    style.textContent=`
      #connectedShell .cm-mobile-app{display:none}
      #connectedShell.customer-mobile-bootstrap.customer-mobile-home-active .cm-mobile-app{display:grid;gap:14px}
      #connectedShell.customer-mobile-bootstrap.customer-mobile-home-active #connectedContent{display:none!important}
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-home-active) .cm-mobile-app{display:none!important}
      #connectedShell.customer-mobile-bootstrap .cm-mobile-app{width:100%;max-width:100%;padding:0 0 4px}
      #connectedShell.customer-mobile-bootstrap .cm-home-next{display:grid;grid-template-columns:55px minmax(0,1fr) auto;gap:13px;align-items:center;min-height:110px;padding:15px 14px;border:1px solid #d7e9f8;border-radius:19px;background:linear-gradient(100deg,#edf8ff 0%,#e5f3ff 100%)}
      #connectedShell.customer-mobile-bootstrap .cm-home-next-icon{width:55px;height:55px;display:grid;place-items:center;border-radius:50%;background:#0a58a2;color:#fff}
      #connectedShell.customer-mobile-bootstrap .cm-home-next-icon svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
      #connectedShell.customer-mobile-bootstrap .cm-home-next-copy{min-width:0}
      #connectedShell.customer-mobile-bootstrap .cm-home-next-copy small{display:block;color:#1b5590;font-size:11px;font-weight:850}
      #connectedShell.customer-mobile-bootstrap .cm-home-next-copy h3{margin:2px 0;color:#0b214c;font-size:20px;line-height:1.08}
      #connectedShell.customer-mobile-bootstrap .cm-home-next-copy p{margin:0;color:#5b7398;font-size:12px;line-height:1.3}
      #connectedShell.customer-mobile-bootstrap .cm-home-next-action{min-height:46px;padding:0 14px;border:1.5px solid #0b58a4;border-radius:13px;background:#fff;color:#0b4e91;font-size:12px;font-weight:800;white-space:nowrap}
      #connectedShell.customer-mobile-bootstrap .cm-home-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #connectedShell.customer-mobile-bootstrap .cm-home-metrics article{min-height:124px;padding:16px 14px;border:1px solid #dce7ef;border-radius:19px;background:#fff;box-shadow:0 6px 16px rgba(13,48,75,.045)}
      #connectedShell.customer-mobile-bootstrap .cm-home-metrics span{display:block;color:#61779b;font-size:10px}
      #connectedShell.customer-mobile-bootstrap .cm-home-metrics strong{display:block;margin:8px 0 5px;color:#0a1d47;font-size:18px;line-height:1.15;overflow-wrap:anywhere}
      #connectedShell.customer-mobile-bootstrap .cm-home-metrics small{display:block;color:#7185a2;font-size:10px;line-height:1.3}
      @media(max-width:430px){
        #connectedShell.customer-mobile-bootstrap .cm-home-next{grid-template-columns:50px minmax(0,1fr);padding:14px 13px}
        #connectedShell.customer-mobile-bootstrap .cm-home-next-icon{width:50px;height:50px}
        #connectedShell.customer-mobile-bootstrap .cm-home-next-action{grid-column:2;justify-self:start;margin-top:5px}
      }
    `;
    document.head.appendChild(style);
  }

  function activeView(dashboard){
    return dashboard?.querySelector('[data-cw-view]:not([hidden])')?.dataset?.cwView||'overview';
  }

  function currentDashboard(){
    return document.getElementById('connectedContent')?.querySelector('.cw-dashboard.customer')||null;
  }

  function clickView(view){
    const dashboard=currentDashboard();
    dashboard?.querySelector(`[data-cw-view-btn="${view}"]`)?.click();
    schedule();
  }

  function ensureHeader(main){
    let header=main.querySelector(':scope > .cm-mobile-header');
    if(header)return header;
    header=document.createElement('header');
    header.className='cm-mobile-header';
    header.innerHTML=`
      <div class="cm-brand-lockup">
        <img src="app-icon.svg" alt="" aria-hidden="true">
        <div><strong>San<span>Paid</span></strong><small>Cooperative Workforce Network</small></div>
      </div>
      <div class="cm-header-actions">
        <span class="cm-location">${ICONS.pin}<b>Kolhapur, MH</b><span aria-hidden="true">⌄</span></span>
        <span class="cm-bell" aria-label="Updates">${ICONS.bell}</span>
        <span class="cm-avatar" aria-label="Customer profile">C</span>
      </div>`;
    main.prepend(header);
    return header;
  }

  function ensureMobileApp(main,header){
    let app=main.querySelector(':scope > .cm-mobile-app');
    if(app)return app;
    app=document.createElement('section');
    app.className='cm-mobile-app';
    app.setAttribute('aria-label','Customer mobile home');
    app.innerHTML=`
      <section class="cm-mobile-greeting">
        <div><span>Hello,</span><h1>Welcome back!</h1><p>Your service journey in one place.</p></div>
        <div class="cm-motto"><span aria-hidden="true">🌱</span><b>Serve Today<br>Prepare Tomorrow</b></div>
      </section>
      <button type="button" class="cm-book-cta" data-cm-view="book">
        <span class="cm-book-plus">${ICONS.plus}</span><span><b>Book a Service</b><small>Get help from verified cooperative workers</small></span><span class="cm-book-arrow">${ICONS.arrow}</span>
      </button>
      <section class="cm-quick-grid">
        <button type="button" data-cm-view="booking"><span class="cm-quick-icon">${ICONS.calendar}</span><b>My Bookings</b><small>Track your services</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>
        <button type="button" data-cm-view="verify"><span class="cm-quick-icon teal">${ICONS.shield}</span><b>Verified Workers</b><small>Trusted & skilled</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>
        <button type="button" data-cm-view="payment"><span class="cm-quick-icon">${ICONS.card}</span><b>Payments</b><small>Invoices & history</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>
      </section>
      <section class="cm-booking-card">
        <div class="cm-booking-head">
          <div class="cm-booking-top"><span class="cm-status-chip">Ready</span><button type="button" data-cm-view="booking">View Details ${ICONS.arrow}</button></div>
          <div class="cm-booking-title"><span class="cm-service-icon">${ICONS.home}</span><div><h2>Service request</h2><b class="cm-booking-code">No active booking</b><small class="cm-booking-meta">Book a service to begin</small></div></div>
        </div>
        <div class="cw-journey cm-home-journey">${STEPS.map((step,index)=>`<div class="${index===0?'active':''}"><span>${index+1}</span><small>${step}</small></div>`).join('')}</div>
      </section>
      <section class="cm-home-next">
        <span class="cm-home-next-icon">${ICONS.clock}</span>
        <div class="cm-home-next-copy"><small>WHAT'S NEXT?</small><h3>Book your first service</h3><p>Choose a service, time and location.</p></div>
        <button type="button" class="cm-home-next-action" data-cm-view="book">Open</button>
      </section>
      <section class="cm-home-metrics">
        <article><span>Booked Worker</span><strong data-cm-worker>Not assigned</strong><small data-cm-worker-note>Shown only after Accept</small></article>
        <article><span>Current Amount</span><strong data-cm-amount>—</strong><small data-cm-amount-note>Approved extras only</small></article>
      </section>
      <section class="cm-support-card"><span class="cm-support-icon">${ICONS.support}</span><div><b>Need Help?</b><small>Our support team is here for you.</small></div><button type="button" data-cm-view="support">Contact Support</button></section>`;
    header.insertAdjacentElement('afterend',app);
    wireActions(app);
    return app;
  }

  function ensureBottomNav(shell){
    let nav=shell.querySelector(':scope > .cm-bottom-nav');
    if(nav)return nav;
    nav=document.createElement('nav');
    nav.className='cm-bottom-nav';
    nav.setAttribute('aria-label','Customer mobile navigation');
    nav.innerHTML=`
      <button type="button" data-cm-view="overview" class="active">${ICONS.home}<span>Home</span></button>
      <button type="button" data-cm-view="book">${ICONS.plus}<span>Book Service</span></button>
      <button type="button" data-cm-view="booking">${ICONS.calendar}<span>My Bookings</span></button>
      <button type="button" data-cm-view="support">${ICONS.support}<span>Support</span></button>`;
    shell.appendChild(nav);
    wireActions(nav);
    return nav;
  }

  function wireActions(root){
    root.querySelectorAll('[data-cm-view]').forEach(button=>{
      button.onclick=()=>clickView(button.dataset.cmView);
    });
  }

  function copyJourney(source,target){
    if(!source||!target)return;
    const next=source.innerHTML;
    if(target.innerHTML!==next)target.innerHTML=next;
  }

  function syncHome(app,dashboard){
    const overview=dashboard.querySelector('[data-cw-view="overview"]');
    if(!overview)return;
    const status=overview.querySelector('.cw-role-head>.cw-status')?.textContent?.trim()||'Ready';
    const currentText=overview.querySelector('.cw-next>div:first-child p')?.textContent?.trim()||'';
    const currentParts=currentText.split('·').map(part=>part.trim()).filter(Boolean);
    const bookingCode=overview.querySelector('.cw-metrics article:nth-child(1) strong')?.textContent?.trim()||'—';
    const worker=overview.querySelector('.cw-metrics article:nth-child(2) strong')?.textContent?.trim()||'Not assigned';
    const workerNote=overview.querySelector('.cw-metrics article:nth-child(2) small')?.textContent?.trim()||'Shown only after Accept';
    const amount=overview.querySelector('.cw-metrics article:nth-child(3) strong')?.textContent?.trim()||'—';
    const amountNote=overview.querySelector('.cw-metrics article:nth-child(3) small')?.textContent?.trim()||'Approved extras only';
    const nextBox=overview.querySelector('.cw-next>div+div');
    const nextTitle=nextBox?.querySelector('h3')?.textContent?.trim()||'Book your first service';
    const nextCopy=nextBox?.querySelector('p')?.textContent?.trim()||'Choose a service, time and location.';
    const nextView=nextBox?.querySelector('[data-cw-view-btn]')?.dataset?.cwViewBtn||'book';
    const service=currentParts.length>1?currentParts.slice(1).join(' · '):(currentParts[0]&&!/^(?:#|SP-)/i.test(currentParts[0])?currentParts[0]:'Service request');

    text(app.querySelector('.cm-status-chip'),status);
    text(app.querySelector('.cm-booking-title h2'),service||'Service request');
    text(app.querySelector('.cm-booking-code'),bookingCode==='—'?'No active booking':bookingCode);
    text(app.querySelector('.cm-booking-meta'),bookingCode==='—'?'Book a service to begin':'Active service request');
    text(app.querySelector('.cm-home-next-copy h3'),nextTitle);
    text(app.querySelector('.cm-home-next-copy p'),nextCopy);
    const nextButton=app.querySelector('.cm-home-next-action');
    if(nextButton){nextButton.dataset.cmView=nextView;nextButton.textContent=bookingCode==='—'?'Book Service':'Open Next Step';nextButton.onclick=()=>clickView(nextView);}
    text(app.querySelector('[data-cm-worker]'),worker);
    text(app.querySelector('[data-cm-worker-note]'),workerNote);
    text(app.querySelector('[data-cm-amount]'),amount);
    text(app.querySelector('[data-cm-amount-note]'),amountNote);
    copyJourney(overview.querySelector('.cw-journey'),app.querySelector('.cm-home-journey'));
  }

  function syncBottomNav(shell,dashboard){
    const current=activeView(dashboard);
    shell.querySelectorAll('.cm-bottom-nav [data-cm-view]').forEach(button=>{
      const active=button.dataset.cmView===current;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    shell.classList.toggle('customer-mobile-home-active',current==='overview');
  }

  function apply(){
    const shell=document.getElementById('connectedShell');
    const content=document.getElementById('connectedContent');
    if(!shell||!content)return;
    const isCustomer=!shell.classList.contains('hidden')&&String(content.dataset.connectedRole||'').toUpperCase()==='CUSTOMER';
    const mobileMode=isCustomer&&shell.dataset.customerMobileMode==='true';
    if(!mobileMode){
      shell.classList.remove('customer-mobile-ready','customer-mobile-home-active');
      return;
    }

    const dashboard=content.querySelector('.cw-dashboard.customer');
    const main=shell.querySelector('.connected-main');
    if(!dashboard||!main)return;

    const header=ensureHeader(main);
    const app=ensureMobileApp(main,header);
    const bottom=ensureBottomNav(shell);
    syncHome(app,dashboard);
    wireActions(app);
    wireActions(bottom);
    syncBottomNav(shell,dashboard);
    shell.classList.add('customer-mobile-ready');
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  installStableStyles();
  new MutationObserver(schedule).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','hidden','data-connected-role','data-customer-mobile-mode','aria-current']
  });
  window.addEventListener('sanpaid:connected-sync',schedule);
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  window.addEventListener('resize',schedule,{passive:true});
  schedule();
})();
