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
        color-scheme:only light!important;
      }
      html.customer-mobile-document{background-color:#f6fafc!important}
      html.customer-mobile-document body{min-height:100dvh!important}
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-ready) #connectedContent{
        visibility:hidden!important;
        pointer-events:none!important;
      }
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-ready) .connected-top,
      #connectedShell.customer-mobile-bootstrap:not(.customer-mobile-ready) .connected-session-bar{
        display:none!important;
      }
      #connectedShell.customer-mobile-bootstrap.customer-mobile-home-active #connectedContent{
        display:none!important;
      }
      #connectedShell.customer-mobile-bootstrap .cm-mobile-boot-stage{
        position:fixed;inset:0;z-index:900;display:grid;align-content:start;gap:18px;
        padding:max(22px,env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));
        background:#f6fafc!important;color:#0a1d47!important;overflow:auto;
      }
      #connectedShell.customer-mobile-bootstrap.customer-mobile-ready .cm-mobile-boot-stage{display:none!important}
      .cm-mobile-boot-brand{display:flex;align-items:center;gap:10px;min-height:58px;padding-top:6px}
      .cm-mobile-boot-brand img{width:46px;height:46px;display:block}
      .cm-mobile-boot-brand strong{font-size:25px;letter-spacing:-.04em;color:#0a2850}
      .cm-mobile-boot-brand strong span{color:#0ab4a1}
      .cm-mobile-boot-card{margin-top:24px;padding:22px 18px;border:1px solid #dbe7f0;border-radius:22px;background:#fff;box-shadow:0 10px 30px rgba(16,51,80,.06)}
      .cm-mobile-boot-card small{display:block;color:#0a8f79;font-size:11px;font-weight:900;letter-spacing:.11em}
      .cm-mobile-boot-card h2{margin:9px 0 6px;color:#0a1d47;font-size:28px;line-height:1.05;letter-spacing:-.04em}
      .cm-mobile-boot-card p{margin:0;color:#657b9e;font-size:14px;line-height:1.45}
      .cm-mobile-boot-bar{height:10px;margin-top:18px;border-radius:999px;background:linear-gradient(90deg,#d8f2ec 0%,#0aa68d 48%,#d8f2ec 100%);background-size:220% 100%;animation:cmBootMove 1.1s linear infinite}
      .cm-mobile-boot-note{margin-top:12px;color:#7185a2;font-size:12px}
      @keyframes cmBootMove{from{background-position:100% 0}to{background-position:-100% 0}}
      #connectedShell.customer-mobile-bootstrap.customer-mobile-ready :is(.cw-role-head,.cw-next,.cw-panel,.cw-metrics article,.cw-module-slot>.connected-card,.connected-card,.connected-state-line,.cw-service-card,.cw-trust-explainer article,.cw-history-list article,.cw-notification-list article){
        background:#fff!important;color:#10283a!important;
      }
      #connectedShell.customer-mobile-bootstrap.customer-mobile-ready :is(.cw-role-head,.cw-next,.cw-panel,.cw-module-slot>.connected-card,.connected-card){border-color:#d7e1e6!important}
      #connectedShell.customer-mobile-bootstrap.customer-mobile-ready :is(input,select,textarea){background:#fff!important;color:#10283a!important;color-scheme:only light!important}
    `;
    document.head.appendChild(style);
  }

  function ensureBootStage(shell, content) {
    let stage = shell.querySelector(':scope > .cm-mobile-boot-stage');
    if (stage) return stage;
    stage = document.createElement('section');
    stage.className = 'cm-mobile-boot-stage';
    stage.setAttribute('aria-live', 'polite');
    stage.innerHTML = `
      <div class="cm-mobile-boot-brand"><img src="app-icon.svg" alt=""><strong>San<span>Paid</span></strong></div>
      <div class="cm-mobile-boot-card">
        <small>CUSTOMER WORKSPACE</small>
        <h2>Loading your service journey</h2>
        <p>Preparing bookings, worker verification and payment status in the mobile view.</p>
        <div class="cm-mobile-boot-bar" aria-hidden="true"></div>
        <div class="cm-mobile-boot-note">Please wait a moment…</div>
      </div>`;
    shell.insertBefore(stage, content);
    return stage;
  }

  function removeBootStage(shell) {
    shell.querySelector(':scope > .cm-mobile-boot-stage')?.remove();
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

  // Mobile rendering is a UI-only concern. Never reuse sanpaid:connected-sync
  // here: that event intentionally triggers server snapshot refreshes.
  function dispatchMobileRender(source) {
    window.dispatchEvent(new CustomEvent('sanpaid:customer-mobile-render', { detail: { source } }));
  }

  function requestMobileUi(shell) {
    dispatchMobileRender('customer-mobile-bootstrap');
    clearTimeout(Number(shell.dataset.customerMobileRetry || 0));
    const retry = setTimeout(() => {
      if (!shell.classList.contains('hidden') && !shell.classList.contains('customer-mobile-ready')) {
        dispatchMobileRender('customer-mobile-bootstrap-retry');
      }
    }, 120);
    shell.dataset.customerMobileRetry = String(retry);
  }

  function ensureOverview(content, shell) {
    const dashboard = content.querySelector('.cw-dashboard.customer');
    if (!dashboard) return false;
    const overview = dashboard.querySelector('[data-cw-view="overview"]');
    const overviewButton = dashboard.querySelector('[data-cw-view-btn="overview"]');
    if (overview && overview.hidden && overviewButton) overviewButton.click();
    try { sessionStorage.setItem('sanpaid_dashboard_view_customer', 'overview'); } catch {}
    shell.dataset.customerMobileEntered = 'true';
    return true;
  }

  function scheduleRecovery(shell, content) {
    clearTimeout(Number(shell.dataset.customerMobileFailSafe || 0));
    const timer = setTimeout(() => {
      if (shell.classList.contains('hidden') || shell.classList.contains('customer-mobile-ready')) return;
      ensureOverview(content, shell);
      dispatchMobileRender('customer-mobile-recovery-1');
      setTimeout(() => {
        if (shell.classList.contains('hidden') || shell.classList.contains('customer-mobile-ready')) return;
        ensureOverview(content, shell);
        dispatchMobileRender('customer-mobile-recovery-2');
      }, 350);
      setTimeout(() => {
        if (shell.classList.contains('hidden') || shell.classList.contains('customer-mobile-ready')) return;
        const note = shell.querySelector('.cm-mobile-boot-note');
        if (note) note.textContent = 'Still preparing your mobile workspace…';
        dispatchMobileRender('customer-mobile-recovery-3');
      }, 900);
    }, 650);
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
      removeBootStage(shell);
      return;
    }

    shell.classList.add('customer-reference-page');
    forceMobileMediaRules();

    if (!shell.classList.contains('customer-mobile-ready')) ensureBootStage(shell, content);
    if (shell.dataset.customerMobileEntered !== 'true') ensureOverview(content, shell);

    requestMobileUi(shell);
    if (!shell.classList.contains('customer-mobile-ready')) {
      scheduleRecovery(shell, content);
    } else {
      clearTimeout(Number(shell.dataset.customerMobileFailSafe || 0));
      delete shell.dataset.customerMobileFailSafe;
      removeBootStage(shell);
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
