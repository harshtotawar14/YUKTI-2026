(() => {
  'use strict';

  let declineReturnFocus = null;

  function injectBaseStyles() {
    if (document.getElementById('sanpaidFinalPolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'sanpaidFinalPolishStyles';
    style.textContent = `
      .ribbon{display:none!important}
      .connected-trust-checks{display:grid;gap:8px;margin:12px 0}
      .connected-trust-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid var(--sp-warning-border,#EED29D);background:var(--sp-warning-bg,#FFF6E5);border-radius:11px;color:var(--sp-text,#10283A)}
      .connected-trust-row.done{border-color:var(--sp-success-border,#BFE4D4);background:var(--sp-success-bg,#EAF7F1)}
      .connected-payment-success{line-height:1.65}
      body.admin-mobile-nav-open{overflow:hidden;overscroll-behavior:none}
      #sihJudgeShell .judge-table-wrap,#sihJudgeShell .fed-network-table,#sihJudgeShell .fed-feature-matrix,#sihJudgeShell [class*="table-wrap"]{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-inline:contain}
      #sihJudgeShell table{max-width:none}
      @media(max-width:820px){
        #judgeContent.coop-nav-open::before,#judgeContent.fed-nav-open::before{content:"";position:fixed;inset:72px 0 0;z-index:19;background:rgba(4,18,29,.42);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
        #sihJudgeShell .judge-top{gap:8px!important}
        #sihJudgeShell .judge-top-actions{display:flex!important;align-items:center;justify-content:flex-end;gap:6px!important;flex-wrap:wrap;min-width:0}
        #sihJudgeShell .judge-top-actions>*{max-width:100%}
        #sihJudgeShell .judge-main,#sihJudgeShell #judgeContent,#sihJudgeShell .admin-command-summary{min-width:0!important;max-width:100%!important}
        #sihJudgeShell .coop-sidebar,#sihJudgeShell .fed-sidebar{padding-bottom:env(safe-area-inset-bottom);overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
        #sihJudgeShell .coop-nav-toggle,#sihJudgeShell .fed-nav-toggle{min-height:48px!important}
      }
      @media(max-width:560px){
        #sihJudgeShell .judge-top{padding-left:max(10px,env(safe-area-inset-left))!important;padding-right:max(10px,env(safe-area-inset-right))!important}
        #sihJudgeShell .judge-top .brand{font-size:18px!important}
        #sihJudgeShell .judge-top>div:first-child{min-width:0}
        #sihJudgeShell .judge-top>div:first-child small{display:block;max-width:52vw;white-space:normal;line-height:1.25}
        #sihJudgeShell .judge-live{font-size:10px!important;min-height:30px!important}
        #sihJudgeShell .judge-hero,#sihJudgeShell .admin-command-summary,#sihJudgeShell .judge-card{overflow-wrap:anywhere}
        #sihJudgeShell .judge-table-wrap{border-radius:8px}
      }
      @media print{
        body>*{display:none!important}
        #connectedShell{display:block!important;position:static!important;background:#fff!important}
        #connectedShell .connected-top,#connectedShell .connected-actions,#connectedModalRoot{display:none!important}
        .connected-shell,.connected-main{overflow:visible!important;width:100%!important;max-width:none!important;padding:0!important}
        .connected-card{box-shadow:none!important;break-inside:avoid}
      }
    `;
    document.head.appendChild(style);
  }

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

  function loadHeroViewportFix() { ensureStylesheet('sanpaidHeroViewportFix', 'hero-viewport-fix.css'); }
  function loadPremiumExperience() { ensureStylesheet('sanpaidPremiumSihStyles', 'premium-sih.css'); ensureScript('sanpaidPremiumSihScript', 'premium-sih.js'); }
  function loadResearchUpgrades() { ensureStylesheet('sanpaidResearchUpgradeStyles', 'research-upgrades.css'); ensureScript('sanpaidResearchUpgradeScript', 'research-upgrades.js'); }
  function loadTop1Readiness() { ensureStylesheet('sanpaidTop1ReadinessStyles', 'top1-readiness.css'); ensureScript('sanpaidTop1ReadinessScript', 'top1-readiness.js'); }

  function loadSharedDesignSystem() {
    ensureStylesheet('sanpaidDesignTokensV5', 'design-tokens.css');
    /* Keep mature landing primitives only. The duplicate v3 auth/runtime JS is intentionally not loaded. */
    ensureStylesheet('sanpaidSelectionReadyV3Styles', 'selection-ready-v3.css');
    ensureStylesheet('sanpaidSectionGapHotfix', 'section-gap-hotfix.css');
  }

  function loadUnifiedAuth() { ensureStylesheet('sanpaidUnifiedAuthStyles', 'auth-unified.css'); ensureScript('sanpaidUnifiedAuthScript', 'auth-unified.js'); }
  function loadMasterFinalV4() { ensureStylesheet('sanpaidMasterFinalV4Styles', 'master-final-v4.css'); ensureScript('sanpaidMasterFinalV4Script', 'master-final-v4.js'); }
  function loadWorkspaceUi() { ensureStylesheet('sanpaidWorkspaceUiStyles', 'workspace-ui.css'); }
  function loadColorSystemV5() { ensureStylesheet('sanpaidColorSystemV5', 'color-system-v5.css'); }

  function loadAdminCommandCenter() {
    ensureStylesheet('sanpaidAdminCommandCenterStyles', 'admin-command-center.css');
    ensureStylesheet('sanpaidFederationGovtechStyles', 'federation-govtech.css');
    ensureStylesheet('sanpaidFederationPortalStyles', 'federation-portal.css');
    ensureStylesheet('sanpaidCooperativePortalStyles', 'cooperative-portal.css');
    ensureScript('sanpaidAdminCommandCenterScript', 'admin-command-center.js');
    ensureScript('sanpaidFederationPortalScript', 'federation-portal.js');
    ensureScript('sanpaidCooperativePortalScript', 'cooperative-portal.js');
    ensureScript('sanpaidCooperativeDeployGuardScript', 'cooperative-deploy-guard.js');
  }

  function loadDemoFirstStable() { ensureStylesheet('sanpaidDemoFirstStableStyles', 'demo-first-stable.css'); ensureScript('sanpaidDemoFirstStableScript', 'demo-first-stable.js'); }
  function loadCustomerWorkerDashboard() { ensureStylesheet('sanpaidCustomerWorkerDashboardStyles', 'customer-worker-dashboard.css'); ensureScript('sanpaidCustomerWorkerDashboardScript', 'customer-worker-dashboard.js'); }
  function loadSelectionProofV4() { ensureScript('sanpaidSelectionProofV4Script', 'selection-proof-v4.js'); }

  function polishLandingHero() {
    const landing = document.getElementById('landing');
    const hero = document.getElementById('home');
    if (!landing || !hero) return;
    landing.querySelector('.ribbon')?.remove();
    const productBadge = hero.querySelector('.hero-grid>div:first-child>.eyebrow');
    if (productBadge) { productBadge.textContent = 'SIH 2026 • Cooperative Workforce Network'; productBadge.classList.add('eval-badge'); }
    const research = hero.querySelector('#selectorResearchBtn');
    if (research) { research.textContent = '3-Minute SIH Overview →'; research.classList.add('hero-tertiary-link'); research.classList.remove('ghost'); }
    const note = hero.querySelector('.selector-home-note');
    if (note) note.innerHTML = '<span class="selector-proof-line">✓ Guided overview needs no login · Connected prototype uses isolated demo accounts</span>';
    const loopCard = hero.querySelector('.loop-card');
    if (loopCard) {
      const title = loopCard.querySelector(':scope > .eyebrow, :scope > .loop-title');
      if (title) { title.textContent = 'SANPAID DECISION LOGIC'; title.classList.remove('eyebrow'); title.classList.add('loop-title'); }
      const labels = ['Service Request','Eligibility Gate','Fair & Explainable Ranking','Worker Choice','Service Verification','Payment','Audit & Outcome'];
      loopCard.querySelectorAll('.loop-step').forEach((step, index) => {
        const number = String(index + 1).padStart(2, '0');
        step.classList.remove('active');
        step.setAttribute('aria-label', `${number} ${labels[index] || ''}`.trim());
        step.innerHTML = `<span class="loop-no">${number}</span><span class="loop-label">${labels[index] || ''}</span>`;
      });
      const message = loopCard.querySelector('.loop-message');
      if (message) message.textContent = 'Only eligible workers reach ranking. Opportunities are offered, not forced. Service outcomes remain traceable.';
    }
    const trust = landing.querySelector('#trust');
    if (trust) {
      const trustLabels = ['Cooperative Governance','Eligibility Gate','Worker Choice','Cross-Cooperative Capacity'];
      trust.querySelectorAll('.trustin > span').forEach((node, index) => { if (trustLabels[index]) node.textContent = trustLabels[index]; });
      if (trust.parentElement !== hero) hero.appendChild(trust);
    }
  }

  function loadCredibilityLayer() { ensureStylesheet('sanpaidCredibilityStyles', 'credibility-layer.css'); ensureScript('sanpaidCredibilityScript', 'credibility-layer.js'); }
  function loadWorkforceIntelligence() { ensureStylesheet('sanpaidWorkforceIntelligenceStyles', 'workforce-intelligence.css'); ensureScript('sanpaidWorkforceIntelligenceScript', 'workforce-intelligence.js'); ensureScript('sanpaidWorkerTrustPassportScript', 'worker-trust-passport-ui.js'); }

  function scheduleJudgeCredibility() {
    [1200, 3000].forEach(delay => setTimeout(() => {
      const shell = document.getElementById('sihJudgeShell');
      if (!shell || shell.classList.contains('judge-hidden')) return;
      if (!shell.querySelector('.judge-tabs') || shell.querySelector('[data-judge-tab="credibility"]')) return;
      window.SanPaidJudgeMode?.open?.();
    }, delay));
  }

  function focusable(root) {
    return [...root.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.hidden && el.getClientRects().length);
  }

  function trapFocus(event, root) {
    if (event.key !== 'Tab') return;
    const nodes = focusable(root);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
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

  function syncAdminNavLock({focusDrawer=false}={}) {
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
    if (toggle) { setTimeout(() => syncAdminNavLock({focusDrawer:true}), 0); return; }
    const coopOpen = content.classList.contains('coop-nav-open');
    const fedOpen = content.classList.contains('fed-nav-open');
    if (!coopOpen && !fedOpen) return;
    const drawer = coopOpen ? document.getElementById('coopSidebar') : document.getElementById('fedSidebar');
    if (event.target.closest?.('[data-coop-target],[data-fed-target],[data-fed-portal-target],[data-demo-first-target]')) {
      setTimeout(closeAdminNav, 0);
      return;
    }
    if (drawer && !drawer.contains(event.target)) closeAdminNav();
  }

  function start() {
    injectBaseStyles();
    loadHeroViewportFix();
    polishLandingHero();
    loadCredibilityLayer();
    loadWorkforceIntelligence();
    loadPremiumExperience();
    loadResearchUpgrades();
    loadTop1Readiness();
    loadSharedDesignSystem();
    loadUnifiedAuth();
    loadMasterFinalV4();
    loadWorkspaceUi();
    loadColorSystemV5();
    loadAdminCommandCenter();
    loadDemoFirstStable();
    loadCustomerWorkerDashboard();
    loadSelectionProofV4();

    document.addEventListener('keydown', event => {
      const connectedDialog = document.querySelector('#connectedModalRoot [role="dialog"]');
      if (event.key === 'Tab' && connectedDialog) { trapFocus(event, connectedDialog); return; }
      if (event.key !== 'Escape') return;
      const content = document.getElementById('judgeContent');
      if (content?.classList.contains('coop-nav-open') || content?.classList.contains('fed-nav-open')) { event.preventDefault(); closeAdminNav(); return; }
      document.querySelector('#connectedModalRoot [data-modal-cancel]')?.click();
    });

    document.addEventListener('click', event => {
      handleAdminNavClick(event);
      if (event.target.closest?.('[data-judge-role]')) scheduleJudgeCredibility();
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();