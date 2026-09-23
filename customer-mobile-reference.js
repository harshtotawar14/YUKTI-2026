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

  const text = (node, value) => {
    if (node && node.textContent !== value) node.textContent = value;
  };

  function activeView(dashboard) {
    return dashboard?.querySelector('[data-cw-view]:not([hidden])')?.dataset?.cwView || 'overview';
  }

  function clickView(dashboard, view) {
    dashboard?.querySelector(`[data-cw-view-btn="${view}"]`)?.click();
  }

  function ensureHeader(main) {
    let header = main.querySelector('.cm-mobile-header');
    if (header) return header;
    header = document.createElement('header');
    header.className = 'cm-mobile-header';
    header.innerHTML = `
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

  function ensureGreeting(overview) {
    let greeting = overview.querySelector('.cm-mobile-greeting');
    if (greeting) return greeting;
    greeting = document.createElement('section');
    greeting.className = 'cm-mobile-greeting';
    greeting.innerHTML = `
      <div><span>Hello,</span><h1>Welcome back!</h1><p>Your service journey in one place.</p></div>
      <div class="cm-motto"><span aria-hidden="true">🌱</span><b>Serve Today<br>Prepare Tomorrow</b></div>`;
    overview.prepend(greeting);
    return greeting;
  }

  function ensureBookCta(overview) {
    let cta = overview.querySelector('.cm-book-cta');
    if (cta) return cta;
    cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'cm-book-cta';
    cta.dataset.cmView = 'book';
    cta.innerHTML = `<span class="cm-book-plus">${ICONS.plus}</span><span><b>Book a Service</b><small>Get help from verified cooperative workers</small></span><span class="cm-book-arrow">${ICONS.arrow}</span>`;
    const roleHead = overview.querySelector('.cw-role-head');
    roleHead?.insertAdjacentElement('afterend', cta);
    return cta;
  }

  function ensureQuickGrid(overview) {
    let grid = overview.querySelector('.cm-quick-grid');
    if (grid) return grid;
    grid = document.createElement('section');
    grid.className = 'cm-quick-grid';
    grid.innerHTML = `
      <button type="button" data-cm-view="booking"><span class="cm-quick-icon">${ICONS.calendar}</span><b>My Bookings</b><small>Track your services</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>
      <button type="button" data-cm-view="verify"><span class="cm-quick-icon teal">${ICONS.shield}</span><b>Verified Workers</b><small>Trusted & skilled</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>
      <button type="button" data-cm-view="payment"><span class="cm-quick-icon">${ICONS.card}</span><b>Payments</b><small>Invoices & history</small><span class="cm-mini-arrow">${ICONS.arrow}</span></button>`;
    const cta = overview.querySelector('.cm-book-cta');
    cta?.insertAdjacentElement('afterend', grid);
    return grid;
  }

  function ensureBookingCard(overview) {
    const journey = overview.querySelector('.cw-journey');
    if (!journey) return null;
    let card = journey.closest('.cm-booking-card');
    if (!card) {
      card = document.createElement('section');
      card.className = 'cm-booking-card';
      journey.replaceWith(card);
      card.appendChild(journey);
    }
    let head = card.querySelector('.cm-booking-head');
    if (!head) {
      head = document.createElement('div');
      head.className = 'cm-booking-head';
      head.innerHTML = `
        <div class="cm-booking-top"><span class="cm-status-chip">Ready</span><button type="button" data-cm-view="booking">View Details ${ICONS.arrow}</button></div>
        <div class="cm-booking-title"><span class="cm-service-icon">${ICONS.home}</span><div><h2>Service request</h2><b class="cm-booking-code">No active booking</b><small class="cm-booking-meta">Book a service to begin</small></div></div>`;
      card.prepend(head);
    }
    return card;
  }

  function updateBookingCard(overview, card) {
    if (!card) return;
    const status = overview.querySelector('.cw-role-head>.cw-status')?.textContent?.trim() || 'Ready';
    const current = overview.querySelector('.cw-next>div:first-child p')?.textContent?.trim() || '';
    const parts = current.split('·').map(part => part.trim()).filter(Boolean);
    const bookingCode = overview.querySelector('.cw-metrics article:nth-child(1) strong')?.textContent?.trim() || '—';
    const service = parts.length > 1 ? parts.slice(1).join(' · ') : (parts[0] && !parts[0].startsWith('#') && !parts[0].startsWith('SP-') ? parts[0] : 'Service request');
    text(card.querySelector('.cm-status-chip'), status);
    text(card.querySelector('.cm-booking-title h2'), service || 'Service request');
    text(card.querySelector('.cm-booking-code'), bookingCode === '—' ? 'No active booking' : bookingCode);
    text(card.querySelector('.cm-booking-meta'), bookingCode === '—' ? 'Book a service to begin' : 'Active service request');
  }

  function ensureSupport(overview) {
    let support = overview.querySelector('.cm-support-card');
    if (support) return support;
    support = document.createElement('section');
    support.className = 'cm-support-card';
    support.innerHTML = `<span class="cm-support-icon">${ICONS.support}</span><div><b>Need Help?</b><small>Our support team is here for you.</small></div><button type="button" data-cm-view="support">Contact Support</button>`;
    overview.appendChild(support);
    return support;
  }

  function ensureBottomNav(shell) {
    let nav = shell.querySelector('.cm-bottom-nav');
    if (nav) return nav;
    nav = document.createElement('nav');
    nav.className = 'cm-bottom-nav';
    nav.setAttribute('aria-label', 'Customer mobile navigation');
    nav.innerHTML = `
      <button type="button" data-cm-view="overview" class="active">${ICONS.home}<span>Home</span></button>
      <button type="button" data-cm-view="book">${ICONS.plus}<span>Book Service</span></button>
      <button type="button" data-cm-view="booking">${ICONS.calendar}<span>My Bookings</span></button>
      <button type="button" data-cm-view="support">${ICONS.support}<span>Support</span></button>`;
    shell.appendChild(nav);
    return nav;
  }

  function wireActions(root, dashboard) {
    root.querySelectorAll('[data-cm-view]').forEach(button => {
      if (button.dataset.cmWired === 'true') return;
      button.dataset.cmWired = 'true';
      button.addEventListener('click', () => clickView(dashboard, button.dataset.cmView));
    });
  }

  function syncBottomNav(shell, dashboard) {
    const current = activeView(dashboard);
    shell.querySelectorAll('.cm-bottom-nav [data-cm-view]').forEach(button => {
      const on = button.dataset.cmView === current;
      button.classList.toggle('active', on);
      if (on) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
  }

  function apply() {
    const shell = document.getElementById('connectedShell');
    const content = document.getElementById('connectedContent');
    if (!shell || !content) return;
    const isCustomer = !shell.classList.contains('hidden') && String(content.dataset.connectedRole || '').toUpperCase() === 'CUSTOMER';
    if (!isCustomer) {
      shell.classList.remove('customer-mobile-ready');
      return;
    }

    const dashboard = content.querySelector('.cw-dashboard.customer');
    const main = shell.querySelector('.connected-main');
    const overview = dashboard?.querySelector('[data-cw-view="overview"]');
    if (!dashboard || !main || !overview) return;

    ensureHeader(main);
    ensureGreeting(overview);
    ensureBookCta(overview);
    ensureQuickGrid(overview);
    const bookingCard = ensureBookingCard(overview);
    updateBookingCard(overview, bookingCard);
    ensureSupport(overview);
    const bottom = ensureBottomNav(shell);
    wireActions(overview, dashboard);
    wireActions(bottom, dashboard);
    syncBottomNav(shell, dashboard);
    shell.classList.add('customer-mobile-ready');
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  };

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'data-connected-role', 'aria-current']
  });
  window.addEventListener('sanpaid:connected-sync', schedule);
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
})();
