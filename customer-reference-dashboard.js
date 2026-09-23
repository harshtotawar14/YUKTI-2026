(() => {
  'use strict';

  const NAV_ICONS = {
    overview: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M12 13v5M9.5 15.5h5"/></svg>',
    booking: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    verify: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m8.7 12 2.1 2.1 4.6-4.6"/></svg>',
    payment: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
    support: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 19c-.7 1.3-2 2-4 2"/></svg>'
  };

  const NAV_LABELS = {
    overview: 'Overview',
    book: 'Book Service',
    booking: 'My Bookings',
    verify: 'Verify Worker',
    payment: 'Payment & Invoice',
    support: 'Support'
  };

  // The base connected customer form is only a source for the real dashboard modules.
  // Never let it paint while the customer dashboard layer is booting; this prevents
  // the previous design from flashing for ~650 ms before the dashboard refresh runs.
  function installCustomerFlashGuard() {
    if (document.getElementById('sanpaidCustomerFlashGuard')) return;
    const style = document.createElement('style');
    style.id = 'sanpaidCustomerFlashGuard';
    style.textContent = `
      #connectedContent[data-connected-role="CUSTOMER"] > .connected-grid.connected-customer-grid {
        display:none!important;
      }
      #connectedContent[data-connected-role="CUSTOMER"]:not(:has(.cw-dashboard.customer)) {
        min-height:calc(100dvh - 118px);
      }
    `;
    document.head.appendChild(style);
  }

  function cleanMovedActions(shell, content) {
    const moved = shell?.querySelector('.connected-top [data-customer-header-moved="true"]');
    if (!moved) return;
    const current = content?.querySelector('.connected-session-bar .connected-header-actions');
    if (!current) moved.remove();
  }

  function moveCustomerHeaderActions(shell, content) {
    const topActions = shell.querySelector('.connected-top>.actions');
    const headerActions = content.querySelector('.connected-session-bar .connected-header-actions');
    const closeButton = shell.querySelector('#connectedClose');
    if (!topActions || !headerActions) return;
    headerActions.dataset.customerHeaderMoved = 'true';
    if (headerActions.parentElement !== topActions) topActions.insertBefore(headerActions, closeButton || null);
  }

  function decorateNav(content) {
    content.querySelectorAll('.cw-dashboard.customer .cw-nav [data-cw-view-btn]').forEach(button => {
      const id = button.dataset.cwViewBtn;
      if (NAV_LABELS[id]) {
        const label = [...button.children].find(node => node.tagName === 'SPAN' && !node.classList.contains('cw-ref-nav-icon'));
        if (label) label.textContent = NAV_LABELS[id];
      }
      if (button.querySelector('.cw-ref-nav-icon') || !NAV_ICONS[id]) return;
      const icon = document.createElement('span');
      icon.className = 'cw-ref-nav-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = NAV_ICONS[id];
      button.prepend(icon);
    });
  }

  function tuneOverview(content) {
    const dashboard = content.querySelector('.cw-dashboard.customer');
    if (!dashboard) return;
    const overview = dashboard.querySelector('[data-cw-view="overview"]');
    if (!overview) return;
    const kicker = overview.querySelector('.cw-role-head .cw-kicker');
    const title = overview.querySelector('.cw-role-head h1');
    const subtitle = overview.querySelector('.cw-role-head p');
    if (kicker) kicker.textContent = 'WELCOME TO SANPAID';
    if (title) title.textContent = 'Your service journey in one place';
    if (subtitle) subtitle.textContent = 'Book, track, verify, approve charges, and pay with clarity.';

    const nextLabels = overview.querySelectorAll('.cw-next>div>small');
    if (nextLabels[0]) nextLabels[0].textContent = 'Current Status';
    if (nextLabels[1]) nextLabels[1].textContent = 'Next Step';
  }

  function requestImmediateCustomerDashboard(content) {
    if (content.querySelector('.cw-dashboard.customer')) {
      delete content.dataset.customerReferenceRefreshRequested;
      return;
    }
    if (content.dataset.customerReferenceRefreshRequested === 'true') return;
    content.dataset.customerReferenceRefreshRequested = 'true';
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync', {
      detail: { source: 'customer-reference-open' }
    }));
  }

  function applyCustomerReference() {
    const shell = document.getElementById('connectedShell');
    const content = document.getElementById('connectedContent');
    if (!shell || !content) return;

    const isCustomer = String(content.dataset.connectedRole || '').toUpperCase() === 'CUSTOMER' && !shell.classList.contains('hidden');
    shell.classList.toggle('customer-reference-page', isCustomer);

    if (!isCustomer) {
      delete content.dataset.customerReferenceRefreshRequested;
      cleanMovedActions(shell, content);
      return;
    }

    requestImmediateCustomerDashboard(content);
    if (!content.querySelector('.cw-dashboard.customer')) return;

    moveCustomerHeaderActions(shell, content);
    decorateNav(content);
    tuneOverview(content);
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyCustomerReference();
    });
  };

  installCustomerFlashGuard();
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'data-connected-role']
  });
  window.addEventListener('sanpaid:connected-sync', schedule);
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  schedule();
})();
