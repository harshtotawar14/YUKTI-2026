(() => {
  'use strict';

  const narrowViewport = () => window.matchMedia('(max-width: 768px)').matches;
  const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches || Number(navigator.maxTouchPoints || 0) > 0;
  const mobile = () => narrowViewport() || (coarsePointer() && window.innerWidth <= 1100);

  function forceMobileMediaRules() {
    const shouldForce = !narrowViewport() && coarsePointer() && window.innerWidth <= 1100;
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
      // The stylesheet is same-origin in production. If CSSOM access is unavailable,
      // the regular narrow-viewport media query remains the safe fallback.
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

    shell.classList.toggle('customer-mobile-bootstrap', shouldUseMobile);
    shell.dataset.customerMobileMode = shouldUseMobile ? 'true' : 'false';

    if (!shouldUseMobile) {
      delete shell.dataset.customerMobileEntered;
      clearTimeout(Number(shell.dataset.customerMobileRetry || 0));
      delete shell.dataset.customerMobileRetry;
      document.getElementById('sanpaidCustomerForcedMobileCss')?.remove();
      return;
    }

    shell.classList.add('customer-reference-page');
    forceMobileMediaRules();

    if (shell.dataset.customerMobileEntered !== 'true') {
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
  window.addEventListener('sanpaid:connected-sync', schedule);
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  schedule();
})();
