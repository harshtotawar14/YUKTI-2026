(() => {
  'use strict';

  const narrowViewport = () => window.matchMedia('(max-width: 768px)').matches;
  const touchPoints = () => Number(navigator.maxTouchPoints || 0);
  const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches || touchPoints() > 0;
  const screenMin = () => Math.min(Number(window.screen?.width || Infinity), Number(window.screen?.height || Infinity));
  const phoneLikeTouch = () => {
    if (!coarsePointer()) return false;
    const dpr = Number(window.devicePixelRatio || 1);
    return window.innerWidth <= 1100 || screenMin() <= 820 || (window.innerWidth <= 1400 && dpr >= 1.5 && touchPoints() > 1);
  };
  const mobile = () => narrowViewport() || phoneLikeTouch();

  function installMobilePaintGuard() {
    if (document.getElementById('sanpaidCustomerMobilePaintGuard')) return;
    const style = document.createElement('style');
    style.id = 'sanpaidCustomerMobilePaintGuard';
    style.textContent = `
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-ready) #connectedContent{
        visibility:hidden!important;
        pointer-events:none!important;
      }
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-ready) .connected-top,
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-ready) .connected-session-bar{
        visibility:hidden!important;
      }
      #connectedShell.customer-mobile-bootstrap.customer-mobile-home-active #connectedContent{
        display:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  function forceMobileMediaRules() {
    const shouldForce = !narrowViewport() && mobile();
    const existing = document.getElementById('sanpaidCustomerForcedMobileCss');
    if (!shouldForce) {
      existing?.remove();
      return;
    }
    if (existing) return;

    const sheet = Array.from(document.styleSheets).find(item => String(item.href || '').includes('customer-mobile-reference.css'));
    if (!sheet) return;

    try {
      const sourceRule = Array.from(sheet.cssRules || []).find(rule =>
        rule.type === CSSRule.MEDIA_RULE && /max-width\s*:\s*768px/i.test(String(rule.conditionText || rule.media?.mediaText || ''))
      );
      if (!sourceRule) return;
      const style = document.createElement('style');
      style.id = 'sanpaidCustomerForcedMobileCss';
      style.dataset.source = 'customer-mobile-reference';
      style.textContent = Array.from(sourceRule.cssRules || []).map(rule => rule.cssText).join('\n');
      document.head.appendChild(style);
    } catch (_) {
      // Same-origin CSS normally allows this; regular mobile media rules remain the fallback.
    }
  }

  function requestMobileUi(shell) {
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync', { detail: { source: 'customer-mobile-bootstrap' } }));
    clearTimeout(Number(shell.dataset.customerMobileRetry || 0));
    const retry = setTimeout(() => {
      if (!shell.classList.contains('hidden') && !shell.classList.contains('customer-mobile-ready')) {
        window.dispatchEvent(new CustomEvent('sanpaid:connected-sync', { detail: { source: 'customer-mobile-bootstrap-retry' } }));
      }
    }, 120);
    shell.dataset.customerMobileRetry = String(retry);
  }

  function apply() {
    const shell = document.getElementById('connectedShell');
    const content = document.getElementById('connectedContent');
    if (!shell || !content) return;

    const isCustomer = !shell.classList.contains('hidden') && String(content.dataset.connectedRole || '').toUpperCase() === 'CUSTOMER';
    const shouldUseMobile = isCustomer && mobile();

    installMobilePaintGuard();
    shell.classList.toggle('customer-mobile-bootstrap', shouldUseMobile);
    shell.dataset.customerMobileMode = shouldUseMobile ? 'true' : 'false';

    if (!shouldUseMobile) {
      shell.classList.remove('customer-mobile-home-active', 'customer-mobile-ready');
      delete shell.dataset.customerMobileEntered;
      clearTimeout(Number(shell.dataset.customerMobileRetry || 0));
      delete shell.dataset.customerMobileRetry;
      document.getElementById('sanpaidCustomerForcedMobileCss')?.remove();
      return;
    }

    shell.classList.add('customer-reference-page');
    forceMobileMediaRules();

    if (shell.dataset.customerMobileEntered !== 'true') {
      // Hide the complete legacy customer surface immediately. The dedicated
      // mobile app stage becomes visible without a desktop-layout flash.
      shell.classList.add('customer-mobile-home-active');
      const overviewButton = content.querySelector('.cw-dashboard.customer [data-cw-view-btn="overview"]');
      if (overviewButton) {
        shell.dataset.customerMobileEntered = 'true';
        overviewButton.click();
      }
    }

    requestMobileUi(shell);
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  };

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'data-connected-role']
  });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  schedule();
})();
