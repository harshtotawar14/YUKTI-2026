(() => {
  'use strict';

  const SERVICE_MAP={
    'Electrician':'Electrician',
    'Plumber':'Plumber',
    'Painter':'Painter',
    'Home Cleaning':'House Cleaning',
    'AC Service':'AC Repair',
    'Appliance Repair':'Appliance Repair',
    'Gardening':'Gardener'
  };

  const ICONS={
    'Electrician':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2 5.7 13h5l-.9 9L18.3 10h-5.2l.1-8Z"/></svg>',
    'Plumber':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.2a4.5 4.5 0 0 0-5.9 5.9L3.4 17.5a2.2 2.2 0 0 0 3.1 3.1l5.4-5.4a4.5 4.5 0 0 0 5.9-5.9l-2.7 2.7-3.1-3.1 2.7-2.7Z"/></svg>',
    'Painter':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h11a3 3 0 0 1 3 3v3H8V7H4V4Zm4 6h10v3a2 2 0 0 1-2 2h-3v5H9v-5H8v-5Z"/></svg>',
    'Home Cleaning':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 3 1.1 2.9L18 7l-2.9 1.1L14 11l-1.1-2.9L10 7l2.9-1.1L14 3ZM6 9l.8 2.2L9 12l-2.2.8L6 15l-.8-2.2L3 12l2.2-.8L6 9Zm9.5 3.5 1.2 3.1 3.3 1.2-3.3 1.2-1.2 3.1-1.2-3.1-3.3-1.2 3.3-1.2 1.2-3.1Z"/></svg>',
    'AC Service':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5M3.8 10.3 7.2 11l-1-3.3M20.2 13.7l-3.4-.7 1 3.3M3.8 13.7l3.4-.7-1 3.3M20.2 10.3l-3.4.7 1-3.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'Appliance Repair':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 0 0 12 8.2Zm8 3.8-2.1-.8a6.4 6.4 0 0 0-.6-1.5l.9-2-1.9-1.9-2 .9a6.4 6.4 0 0 0-1.5-.6L12 4h-2.7l-.8 2.1a6.4 6.4 0 0 0-1.5.6l-2-.9-1.9 1.9.9 2a6.4 6.4 0 0 0-.6 1.5L1.3 12v2.7l2.1.8c.1.5.3 1 .6 1.5l-.9 2 1.9 1.9 2-.9c.5.3 1 .5 1.5.6l.8 2.1H12l.8-2.1c.5-.1 1-.3 1.5-.6l2 .9 1.9-1.9-.9-2c.3-.5.5-1 .6-1.5l2.1-.8V12Z" transform="scale(.88) translate(1.7 -.8)"/></svg>',
    'Gardening':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 4.5C13.8 4.6 9.7 6.8 8.2 11c-1 2.9.2 5.2 2.3 6.2 2.5 1.2 5.4-.2 6.7-3.2 1.4-3.2 1.8-6.4 2.3-9.5ZM5 20c2.2-4.8 5.4-8.1 10-10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'More Services':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>'
  };

  function ensureRoleLightTheme(){
    if(document.getElementById('sanpaidRoleLightTheme'))return;
    const style=document.createElement('style');
    style.id='sanpaidRoleLightTheme';
    style.textContent=`
#connectedShell.customer-mobile-bootstrap,
#connectedShell.worker-mobile-final,
html[data-sanpaid-theme="dark"] #connectedShell.customer-mobile-bootstrap,
html[data-sanpaid-theme="dark"] #connectedShell.worker-mobile-final{
  color-scheme:only light!important;
  --sp-bg:#f6f9fc!important;--sp-bg-soft:#f0f5f9!important;--sp-surface:#fff!important;--sp-surface-solid:#fff!important;--sp-surface-2:#f3f7fb!important;
  --sp-text:#405b79!important;--sp-text-2:#526b86!important;--sp-muted:#69809a!important;--sp-border:#dbe6f0!important;--sp-border-strong:#c8d8e6!important;
  --sp-success-bg:#eaf8f4!important;--sp-success-border:#c7e8df!important;--sp-warning-bg:#fff7e8!important;--sp-warning-border:#edd7aa!important;
  --sp-error-bg:#fff1f1!important;--sp-error-border:#edc7c7!important;--sp-future-bg:#f1f4f7!important;--sp-future-border:#d7e0e8!important;--sp-soft-teal:#eaf8f4!important;
  --sp-navy:#07386f!important;--sp-navy-2:#0b4f8f!important;--sp-blue:#1269bf!important;--sp-green:#0b987d!important;--sp-green-2:#087563!important;
  --sp-ink:#0b2c57!important;--sp-line:#dbe6f0!important;--sp-card:#fff!important;--sp-blue-soft:#edf5ff!important;--sp-green-soft:#eaf8f4!important;
  background:linear-gradient(180deg,#fbfdff 0%,#f6f9fc 100%)!important;color:#405b79!important;
}
body:has(#connectedShell.customer-mobile-bootstrap:not(.hidden)),body:has(#connectedShell.worker-mobile-final:not(.hidden)){color-scheme:only light!important;background:#f6f9fc!important}
#connectedShell.customer-mobile-bootstrap .cm-mobile-header,#connectedShell.worker-mobile-final .wm-mobile-header{background:rgba(255,255,255,.985)!important;border-bottom-color:#dbe6f0!important;color:#0b2c57!important}
#connectedShell.customer-mobile-bootstrap :is(.cm-quick-grid>button,.cm-booking-card,.cm-mobile-metrics>button,.cw-panel,.cw-role-head,.cw-next,.connected-card,.wi-block,.cw-service-card),
#connectedShell.worker-mobile-final :is(.wm-quick-grid>button,.wm-work-card,.wm-metrics>button,.cw-panel,.cw-role-head,.cw-next,.connected-card,.wi-block,.cw-service-card){background:#fff!important;border-color:#dbe6f0!important;color:#0b2c57!important;box-shadow:0 5px 16px rgba(7,56,111,.045)!important}
#connectedShell.customer-mobile-bootstrap :is(.cm-quick-icon,.cm-service-icon),#connectedShell.worker-mobile-final :is(.wm-quick-icon,.wm-service-icon){background:#edf5ff!important;color:#07386f!important}
#connectedShell.customer-mobile-bootstrap :is(.cm-quick-grid b,.cm-booking-copy h2,.cm-mobile-metrics strong,.cw-role-head h1,.cw-panel h2,.cw-panel h3),
#connectedShell.worker-mobile-final :is(.wm-quick-grid b,.wm-work-copy h2,.wm-metrics strong,.cw-role-head h1,.cw-panel h2,.cw-panel h3){color:#07386f!important}
#connectedShell.customer-mobile-bootstrap :is(.cm-quick-grid small,.cm-booking-copy>b,.cm-booking-copy>small,.cm-mobile-metrics span,.cm-mobile-metrics small),
#connectedShell.worker-mobile-final :is(.wm-quick-grid small,.wm-work-copy>b,.wm-work-copy>small,.wm-metrics span,.wm-metrics small){color:#69809a!important}
#connectedShell.customer-mobile-bootstrap .cm-next-card,#connectedShell.worker-mobile-final .wm-next-card{background:#edf5ff!important;border-color:#d8e8f7!important;color:#0b2c57!important}
#connectedShell.customer-mobile-bootstrap .cm-next-card :is(h3,b),#connectedShell.worker-mobile-final .wm-next-card :is(h3,b){color:#07386f!important}
#connectedShell.customer-mobile-bootstrap .cm-next-card :is(p,small),#connectedShell.worker-mobile-final .wm-next-card :is(p,small){color:#526b86!important}
#connectedShell.customer-mobile-bootstrap .cm-support-card,#connectedShell.worker-mobile-final .wm-trust-card{background:#eaf8f4!important;border-color:#cfe8df!important;color:#087563!important}
#connectedShell.customer-mobile-bootstrap :is(.cm-next-card>button,.cm-support-card button),#connectedShell.worker-mobile-final :is(.wm-next-card>button,.wm-trust-card button){background:#fff!important}
#connectedShell.customer-mobile-bootstrap>.cm-bottom-nav,#connectedShell.worker-mobile-final>.wm-bottom-nav{background:rgba(255,255,255,.99)!important;border-top-color:#dbe6f0!important;box-shadow:0 -8px 24px rgba(7,56,111,.08)!important}
#connectedShell.customer-mobile-bootstrap>.cm-bottom-nav>button,#connectedShell.worker-mobile-final>.wm-bottom-nav>button{background:transparent!important;color:#69809a!important}
#connectedShell.customer-mobile-bootstrap>.cm-bottom-nav>button.active{color:#0b987d!important}#connectedShell.worker-mobile-final>.wm-bottom-nav>button.active{color:#0b4f8f!important;background:#edf5ff!important}
#connectedShell.customer-mobile-bootstrap :is(input,select,textarea),#connectedShell.worker-mobile-final :is(input,select,textarea){color-scheme:only light!important;background:#fff!important;color:#0b2c57!important;border-color:#c8d8e6!important}
#connectedShell.customer-mobile-bootstrap :is(.cm-profile-sheet,.cm-profile-actions>button),#connectedShell.worker-mobile-final :is(.wm-profile-sheet,.wm-profile-actions>button){background:#fff!important;color:#0b2c57!important;border-color:#dbe6f0!important}
#connectedShell.customer-mobile-bootstrap .cm-book-cta{background:linear-gradient(135deg,#0b987d,#087563)!important;color:#fff!important}
#connectedShell.worker-mobile-final .wm-primary-cta{background:linear-gradient(135deg,#07386f,#07549a)!important;color:#fff!important}`;
    document.head.appendChild(style);
  }

  function polishServiceTiles(){
    const grid=document.querySelector('#services .service-tile-grid');
    if(!grid||grid.dataset.polished==='1')return;
    grid.dataset.polished='1';
    [...grid.querySelectorAll('.service-tile')].forEach(tile=>{
      const label=tile.querySelector('b')?.textContent?.trim()||'';
      const button=document.createElement('button');
      button.type='button';
      button.className=tile.className;
      button.setAttribute('role','listitem');
      button.setAttribute('aria-label',label==='More Services'?'View all service categories':`Book ${label}`);
      if(SERVICE_MAP[label])button.dataset.service=SERVICE_MAP[label];
      button.innerHTML=`<i class="service-line-icon">${ICONS[label]||ICONS['More Services']}</i><b>${label}</b><small>${label==='More Services'?'Explore all':'Book service'}</small>`;
      button.addEventListener('click',async()=>{
        if(label==='More Services'){
          await window.SanPaidLanding?.openRoleAccess?.('CUSTOMER');
          return;
        }
        await window.SanPaidLanding?.startBooking?.(SERVICE_MAP[label]||label);
      });
      tile.replaceWith(button);
    });
  }

  function wireSmoothNavigation(){
    const links=[...document.querySelectorAll('#landing.reference-home .eval-nav a[href^="#"]')];
    const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    links.forEach(link=>link.addEventListener('click',event=>{
      const target=document.querySelector(link.getAttribute('href'));
      if(!target)return;
      event.preventDefault();
      target.scrollIntoView({behavior:prefersReduced?'auto':'smooth',block:'start'});
      try{history.replaceState(null,'',link.getAttribute('href'));}catch{}
    }));

    const desktopLinks=[...document.querySelectorAll('#landing.reference-home .navlinks a[href^="#"]')];
    const sectionById=new Map(desktopLinks.map(link=>[link.getAttribute('href').slice(1),link]));
    const sections=[...sectionById.keys()].map(id=>document.getElementById(id)).filter(Boolean);
    if(!sections.length)return;
    const setActive=id=>desktopLinks.forEach(link=>link.classList.toggle('is-active',link.getAttribute('href')===`#${id}`));
    setActive('home');
    if(!('IntersectionObserver' in window))return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible?.target?.id)setActive(visible.target.id);
    },{rootMargin:'-24% 0px -58% 0px',threshold:[0,.05,.2,.5]});
    sections.forEach(section=>observer.observe(section));
  }

  function polishHeroCopy(){
    const card=document.querySelector('#landing.reference-home .reference-worker-card');
    if(card)card.setAttribute('aria-label','Verified cooperative worker — Electrician, Kolhapur');
    const visual=document.querySelector('#landing.reference-home .reference-worker-visual');
    if(visual)visual.setAttribute('aria-label','Verified cooperative worker profile with identity, skill and local availability checks');
  }

  function polishTruthCopy(){
    const architecture=document.querySelector('#architecture .architecture-card>div p');
    if(architecture)architecture.textContent='Role-based controls and an auditable data architecture keep service, payment, complaint and capacity decisions connected.';
    const paymentStep=document.querySelector('#how .service-flow li:nth-child(3) small');
    if(paymentStep)paymentStep.textContent='Approve the estimate, confirm the booked worker, complete service, use the review payment step and receive the invoice.';
  }

  function start(){
    ensureRoleLightTheme();
    polishServiceTiles();
    wireSmoothNavigation();
    polishHeroCopy();
    polishTruthCopy();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
