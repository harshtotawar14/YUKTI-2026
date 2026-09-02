(() => {
  'use strict';

  let declineReturnFocus = null;

  function ensureStylesheet(id, href) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function ensureScript(id, src) {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
  }

  function loadCoreDesign() {
    ensureStylesheet('sanpaidDesignTokensV5', 'design-tokens.css');
    ensureStylesheet('sanpaidSelectionReadyV3Styles', 'selection-ready-v3.css');
    ensureStylesheet('sanpaidWorkspaceUiStyles', 'workspace-ui.css');
    ensureStylesheet('sanpaidColorSystemV5', 'color-system-v5.css');
    ensureStylesheet('sanpaidUnifiedAuthStyles', 'auth-unified.css');
    ensureStylesheet('sanpaidCustomerWorkerDashboardStyles', 'customer-worker-dashboard.css');
  }

  function loadCoreRuntime() {
    ensureScript('sanpaidUnifiedAuthScript', 'auth-unified.js');
    ensureScript('sanpaidCustomerWorkerDashboardScript', 'customer-worker-dashboard.js');
  }

  function loadAdministration() {
    ensureStylesheet('sanpaidAdminCommandCenterStyles', 'admin-command-center.css');
    ensureStylesheet('sanpaidFederationGovtechStyles', 'federation-govtech.css');
    ensureStylesheet('sanpaidFederationPortalStyles', 'federation-portal.css');
    ensureStylesheet('sanpaidCooperativePortalStyles', 'cooperative-portal.css');
    ensureScript('sanpaidAdminCommandCenterScript', 'admin-command-center.js');
    ensureScript('sanpaidFederationPortalScript', 'federation-portal.js');
    ensureScript('sanpaidCooperativePortalScript', 'cooperative-portal.js');
    ensureScript('sanpaidCooperativeDeployGuardScript', 'cooperative-deploy-guard.js');
  }

  function injectGovernmentStyles() {
    if (document.getElementById('sanpaidGovernmentReadyStyles')) return;
    const style = document.createElement('style');
    style.id = 'sanpaidGovernmentReadyStyles';
    style.textContent = `
      :root{
        --gov-navy:#0B1F33;
        --gov-teal:#0F766E;
        --gov-teal-strong:#0D6B64;
        --gov-bg:#F6F8FA;
        --gov-surface:#FFFFFF;
        --gov-border:#D7E1E6;
        --gov-text:#142B3A;
        --gov-muted:#607482;
      }
      html{background:var(--gov-bg)}
      body{background:var(--gov-bg)!important;color:var(--gov-text)!important}
      #landing{background:var(--gov-bg)!important}
      #landing .eval-nav{background:#fff!important;border-bottom:1px solid var(--gov-border)!important;box-shadow:0 4px 16px rgba(11,31,51,.04)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      #landing .eval-hero{background:var(--gov-bg)!important}
      #landing .eval-hero:before{opacity:.08!important}
      #landing .eval-hero-system,#landing .card,#landing .eval-core-card,#landing .eval-match,#landing .eval-proof-panel,#landing .eval-coop-card,#landing .eval-architecture-preview,#landing .eval-kpi-card,#landing .eval-truth-col{
        border-color:var(--gov-border)!important;
        border-radius:12px!important;
        box-shadow:0 8px 24px rgba(11,31,51,.055)!important;
      }
      #landing .btn{border-radius:8px!important;font-weight:750!important;letter-spacing:0!important;min-height:44px}
      #landing .btn.primary{background:var(--gov-teal)!important;border-color:var(--gov-teal)!important;box-shadow:none!important}
      #landing .btn.primary:hover{background:var(--gov-teal-strong)!important;border-color:var(--gov-teal-strong)!important}
      #landing .btn.secondary{background:#fff!important;border-color:#BFCED5!important;color:var(--gov-text)!important;box-shadow:none!important}
      #landing .eval-badge,#landing .tag{border-radius:6px!important;letter-spacing:.04em!important}
      #landing .eval-final-cta{background:var(--gov-navy)!important;border-radius:14px!important;box-shadow:none!important}
      #landing .eval-final-cta:after{display:none!important}
      #landing .footer{background:#081A28!important}
      #landing .hero-master-flow span,#landing .eval-master-chain span,#landing .eval-measure-flow span{border-radius:7px!important}
      #landing .eval-mini-request,#landing .eval-mini-workers,#landing .eval-mini-gate,#landing .eval-mini-rank,#landing .eval-mini-offer,#landing .eval-mini-audit{border-radius:8px!important}
      #landing .eval-phone,#landing .sp-readiness,#landing #researchBackedUpgrades,#landing #top1Readiness,#landing #demoReadiness{display:none!important}
      #premiumThemeToggle{display:none!important}
      .connected-top,.judge-top,.app-top{background:var(--gov-navy)!important}
      .connected-card,.coop-card,.fed-card,.judge-card,.admin-command-card{border-radius:10px!important;box-shadow:0 6px 18px rgba(11,31,51,.05)!important}
      .connected-shell .btn,.spu-root button,#sihJudgeShell .btn{border-radius:8px!important}
      .spu-shell{border-radius:14px!important;box-shadow:0 24px 70px rgba(3,17,28,.24)!important}
      .spu-brand{background:var(--gov-navy)!important}
      .spu-role-code{display:grid;place-items:center;min-width:32px;height:32px;padding:0 6px;border-radius:7px;background:#E9F4F2;color:var(--gov-teal);font-size:11px;font-weight:850;letter-spacing:.03em}
      .spu-role{gap:9px!important;align-items:center!important}
      .spu-demo-pill{border-radius:6px!important}
      .sp-service-unavailable{margin:0 0 14px;padding:14px 16px;border:1px solid #E5C98F;border-left:4px solid #A96813;border-radius:8px;background:#FFF8EA;color:#604212;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
      .sp-service-unavailable strong{display:block;color:#51380E;margin-bottom:3px}
      .sp-service-unavailable span{display:block;font-size:12px;line-height:1.5}
      .sp-service-unavailable button{min-height:38px}
      @media(max-width:768px){
        #landing .section{padding:48px 0!important}
        #landing .eval-hero{padding-top:38px!important}
        #landing .eval-hero h1{font-size:clamp(31px,10vw,44px)!important}
        #landing .hero-ctas{gap:8px!important}
        #landing .eval-master-chain,#landing .eval-measure-flow{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .sp-service-unavailable{display:grid}
        .sp-service-unavailable button{width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  function setText(selector, text) {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }

  function setTag(sectionSelector, text) {
    const node = document.querySelector(`${sectionSelector} .tag`);
    if (node) node.textContent = text;
  }

  function polishGovernmentLanding() {
    const landing = document.getElementById('landing');
    if (!landing) return;

    landing.querySelector('.ribbon')?.remove();
    document.querySelector('link[href="mobile-fix.css"]')?.remove();

    ['connectedDemoSection', 'governance', 'intelligence', 'researchBackedUpgrades', 'top1Readiness', 'demoReadiness']
      .forEach(id => document.getElementById(id)?.remove());

    setText('#landing .eval-badge', 'COOPERATIVE WORKFORCE SERVICE PLATFORM');
    setText('#landing .eval-system-label', 'SERVICE ASSIGNMENT FLOW');
    setText('#landing .eval-system-demo', 'PROTOTYPE ENVIRONMENT');
    setText('#connectedDemoBtn', 'OPEN SERVICE PORTAL');
    setText('#getStarted', 'ROLE ACCESS');
    setText('#heroMatchingCta', 'VIEW ASSIGNMENT LOGIC');
    setText('#selectorResearchBtn', 'VIEW SYSTEM OVERVIEW →');
    setText('#bookServiceHero', 'Book Verified Service');
    setText('#joinWorker', 'Worker Access');
    setText('#coopLogin', 'Cooperative Access');

    document.querySelectorAll('[data-eval-open-connected]').forEach(button => {
      if (/TRY LIVE PROTOTYPE/i.test(button.textContent || '')) button.textContent = 'OPEN SERVICE PORTAL';
    });

    const note = landing.querySelector('.selector-home-note');
    if (note) note.innerHTML = '<span class="selector-proof-line">Prototype environment · role-based access · production government integrations are not claimed.</span>';

    const details = landing.querySelector('.quick-booking-details summary');
    if (details) details.textContent = 'Quick service access';

    const navLabels = {
      '#home': 'Overview', '#how': 'How It Works', '#matching': 'Service Workflow',
      '#impact': 'Outcomes', '#architecture': 'Architecture', '#research': 'Research'
    };
    landing.querySelectorAll('.navlinks a,.mobile-drawer a').forEach(link => {
      const href = link.getAttribute('href');
      if (navLabels[href]) link.textContent = navLabels[href];
    });

    setTag('#problem', '01 — Service Delivery Gap');
    setTag('#how', '02 — Assignment & Trust Model');
    setTag('#matching', '03 — Service Workflow Proof');
    setTag('#operatingModel', '04 — Governance Model');
    setTag('#capacity', '05 — Capacity Coordination');
    setTag('#impact', '06 — Pilot Measurement');
    setTag('#status', '07 — Implementation Status');
    setTag('#architecture', '08 — Architecture & Security');

    const impactHeading = document.querySelector('#impact h2');
    if (impactHeading) impactHeading.textContent = 'Measure outcomes before scaling.';
    const statusHeading = document.querySelector('#status h2');
    if (statusHeading) statusHeading.textContent = 'Current implementation status';
    const statusCopy = document.querySelector('#status .head p');
    if (statusCopy) statusCopy.textContent = 'Working functions, controlled prototype capabilities and future authorized integrations are kept clearly separate.';
    const archHeading = document.querySelector('#architecture h2');
    if (archHeading) archHeading.textContent = 'Secure, modular and auditable by design.';
    const archCopy = document.querySelector('#architecture .head p');
    if (archCopy) archCopy.textContent = 'The architecture separates role access, service workflows, data persistence, auditability and external integrations.';

    const finalHeading = landing.querySelector('.eval-final-cta h2');
    const finalCopy = landing.querySelector('.eval-final-cta p');
    if (finalHeading) finalHeading.innerHTML = 'Trusted Services.<br>Fair Opportunities.<br>Accountable Governance.';
    if (finalCopy) finalCopy.textContent = 'Eligibility first. Worker choice protected. Cooperative and federation responsibility remain visible.';

    const footerMeta = landing.querySelector('.footer p');
    if (footerMeta) footerMeta.textContent = 'SanPaid · Cooperative Workforce Service Platform · Prototype environment';

    const trust = landing.querySelector('#trust');
    if (trust) {
      const labels = ['Cooperative Governance', 'Eligibility Gate', 'Worker Choice', 'Capacity Coordination'];
      trust.querySelectorAll('.trustin > span').forEach((node, index) => {
        if (labels[index]) node.textContent = labels[index];
      });
    }
  }

  function focusable(root) {
    return [...root.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hidden && element.getClientRects().length);
  }

  function trapFocus(event, root) {
    if (event.key !== 'Tab') return;
    const nodes = focusable(root);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function closeAdminNav() {
    const content = document.getElementById('judgeContent');
    if (!content) return;
    content.classList.remove('coop-nav-open', 'fed-nav-open');
    document.getElementById('coopNavToggle')?.setAttribute('aria-expanded', 'false');
    document.getElementById('fedNavToggle')?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('admin-mobile-nav-open');
  }

  function syncAdminNavLock({ focusDrawer = false } = {}) {
    const content = document.getElementById('judgeContent');
    const mobile = window.matchMedia('(max-width: 820px)').matches;
    const coopOpen = !!content?.classList.contains('coop-nav-open');
    const fedOpen = !!content?.classList.contains('fed-nav-open');
    const open = mobile && (coopOpen || fedOpen);
    document.body.classList.toggle('admin-mobile-nav-open', open);
    if (open && focusDrawer) {
      const drawer = coopOpen ? document.getElementById('coopSidebar') : document.getElementById('fedSidebar');
      requestAnimationFrame(() => focusable(drawer || document.body)[0]?.focus());
    }
  }

  function handleAdminNavClick(event) {
    const content = document.getElementById('judgeContent');
    if (!content || !window.matchMedia('(max-width: 820px)').matches) return;
    const toggle = event.target.closest?.('#coopNavToggle,#fedNavToggle');
    if (toggle) { setTimeout(() => syncAdminNavLock({ focusDrawer: true }), 0); return; }
    const coopOpen = content.classList.contains('coop-nav-open');
    const fedOpen = content.classList.contains('fed-nav-open');
    if (!coopOpen && !fedOpen) return;
    const drawer = coopOpen ? document.getElementById('coopSidebar') : document.getElementById('fedSidebar');
    if (event.target.closest?.('[data-coop-target],[data-fed-target],[data-fed-portal-target]')) {
      setTimeout(closeAdminNav, 0);
      return;
    }
    if (drawer && !drawer.contains(event.target)) closeAdminNav();
  }

  function start() {
    loadCoreDesign();
    loadCoreRuntime();
    loadAdministration();
    injectGovernmentStyles();
    polishGovernmentLanding();

    document.addEventListener('keydown', event => {
      const connectedDialog = document.querySelector('#connectedModalRoot [role="dialog"]');
      if (event.key === 'Tab' && connectedDialog) { trapFocus(event, connectedDialog); return; }
      if (event.key !== 'Escape') return;
      const content = document.getElementById('judgeContent');
      if (content?.classList.contains('coop-nav-open') || content?.classList.contains('fed-nav-open')) {
        event.preventDefault();
        closeAdminNav();
        return;
      }
      document.querySelector('#connectedModalRoot [data-modal-cancel]')?.click();
    });

    document.addEventListener('click', event => {
      handleAdminNavClick(event);
      const decline = event.target.closest?.('[data-reject-offer]');
      if (decline) {
        declineReturnFocus = decline;
        setTimeout(() => document.querySelector('#connectedModalRoot input[name="declineReason"]')?.focus(), 0);
        return;
      }
      const connectedCancel = event.target.closest?.('#connectedModalRoot [data-modal-cancel]');
      if (connectedCancel && declineReturnFocus) {
        const target = declineReturnFocus;
        declineReturnFocus = null;
        setTimeout(() => { if (target.isConnected) target.focus(); }, 0);
      }
    }, true);

    window.addEventListener('resize', () => {
      if (window.innerWidth > 820) closeAdminNav();
      else syncAdminNavLock();
    }, { passive: true });

    window.SanPaidRuntimeStatus = Object.assign({}, window.SanPaidRuntimeStatus, {
      presentationLayer: 'GOVERNMENT_READY',
      premiumRuntime: 'RETIRED',
      syntheticFallback: 'RETIRED',
      demoPreflight: 'RETIRED'
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
