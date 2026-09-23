(() => {
  'use strict';

  const narrowViewport = () => window.matchMedia('(max-width: 768px)').matches;
  const touchPoints = () => Number(navigator.maxTouchPoints || 0);
  const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches || touchPoints() > 0;
  const screenMin = () => Math.min(Number(window.screen?.width || Infinity), Number(window.screen?.height || Infinity));
  const phoneLikeTouch = () => {
    if (!coarsePointer()) return false;
    const dpr = Number(window.devicePixelRatio || 1);
    return window.innerWidth <= 1100 || screenMin() <= 820 || (window.innerWidth <= 1400 && dpr >= 1.5);
  };
  const mobile = () => narrowViewport() || phoneLikeTouch();

  function installMobilePaintGuard() {
    if (document.getElementById('sanpaidCustomerMobilePaintGuard')) return;
    const style = document.createElement('style');
    style.id = 'sanpaidCustomerMobilePaintGuard';
    style.textContent = `
      html.customer-mobile-document,
      html.customer-mobile-document body,
      html.customer-mobile-document #connectedShell,
      #connectedShell.customer-mobile-bootstrap{
        background:#f6fafc!important;
        color:#0a1d47!important;
        color-scheme:light!important;
      }
      html.customer-mobile-document{background-color:#f6fafc!important}
      html.customer-mobile-document body{min-height:100dvh!important}
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-ready) .connected-top,
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-ready) .connected-session-bar{
        display:none!important;
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
    if (!shouldForce) { existing?.remove(); return; }
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
    } catch (_) {}
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

  function ensureOverview(content, shell) {
    const dashboard = content.querySelector('.cw-dashboard.customer');
    if (!dashboard) return false;
    const overview = dashboard.querySelector('[data-cw-view="overview"]');
    const overviewButton = dashboard.querySelector('[data-cw-view-btn="overview"]');
    const visible = overview && !overview.hidden;
    if (!visible && overviewButton) overviewButton.click();
    shell.dataset.customerMobileEntered = 'true';
    return true;
  }

  function installReadyFailSafe(shell, content) {
    clearTimeout(Number(shell.dataset.customerMobileFailSafe || 0));
    const timer = setTimeout(() => {
      if (shell.classList.contains('hidden') || shell.classList.contains('customer-mobile-ready')) return;
      // Retry the actual mobile home first. Never expose a stale deep desktop
      // customer view (payment/verification) as the phone fallback.
      ensureOverview(content, shell);
      window.dispatchEvent(new CustomEvent('sanpaid:connected-sync', { detail: { source: 'customer-mobile-failsafe-retry' } }));

      setTimeout(() => {
        if (shell.classList.contains('hidden') || shell.classList.contains('customer-mobile-ready')) return;
        shell.classList.remove('customer-mobile-home-active');
        const dashboard = content.querySelector('.cw-dashboard.customer');
        const overview = dashboard?.querySelector('[data-cw-view="overview"]');
        dashboard?.querySelectorAll('[data-cw-view]').forEach(view => { view.hidden = view !== overview; });
        content.style.removeProperty('visibility');
        content.style.removeProperty('pointer-events');
        content.style.removeProperty('display');
      }, 500);
    }, 900);
    shell.dataset.customerMobileFailSafe = String(timer);
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
    document.documentElement.classList.toggle('customer-mobile-document', shouldUseMobile);

    if (!shouldUseMobile) {
      shell.classList.remove('customer-mobile-home-active', 'customer-mobile-ready');
      delete shell.dataset.customerMobileEntered;
      clearTimeout(Number(shell.dataset.customerMobileRetry || 0));
      clearTimeout(Number(shell.dataset.customerMobileFailSafe || 0));
      delete shell.dataset.customerMobileRetry;
      delete shell.dataset.customerMobileFailSafe;
      document.getElementById('sanpaidCustomerForcedMobileCss')?.remove();
      return;
    }

    shell.classList.add('customer-reference-page');
    forceMobileMediaRules();

    // Every fresh entry into Customer on a phone must start at Home. A stale
    // payment/verification view from desktop/session state must never flash.
    if (shell.dataset.customerMobileEntered !== 'true') ensureOverview(content, shell);

    requestMobileUi(shell);
    if (!shell.classList.contains('customer-mobile-ready')) installReadyFailSafe(shell, content);
    else {
      clearTimeout(Number(shell.dataset.customerMobileFailSafe || 0));
      delete shell.dataset.customerMobileFailSafe;
    }
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; apply(); });
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
