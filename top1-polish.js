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
      .connected-trust-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid #ead8a8;background:#fff9ea;border-radius:11px}
      .connected-trust-row.done{border-color:#c4e8d5;background:#eef9f3}
      .connected-payment-success{line-height:1.65}
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

  function loadHeroViewportFix() {
    ensureStylesheet('sanpaidHeroViewportFix', 'hero-viewport-fix.css');
  }

  function loadPremiumExperience() {
    ensureStylesheet('sanpaidPremiumSihStyles', 'premium-sih.css');
    ensureScript('sanpaidPremiumSihScript', 'premium-sih.js');
  }

  function loadResearchUpgrades() {
    ensureStylesheet('sanpaidResearchUpgradeStyles', 'research-upgrades.css');
    ensureScript('sanpaidResearchUpgradeScript', 'research-upgrades.js');
  }

  function loadTop1Readiness() {
    ensureStylesheet('sanpaidTop1ReadinessStyles', 'top1-readiness.css');
    ensureScript('sanpaidTop1ReadinessScript', 'top1-readiness.js');
  }

  function polishLandingHero() {
    const landing = document.getElementById('landing');
    const hero = document.getElementById('home');
    if (!landing || !hero) return;

    landing.querySelector('.ribbon')?.remove();

    const productBadge = hero.querySelector('.hero-grid>div:first-child>.eyebrow');
    if (productBadge) {
      productBadge.textContent = 'SIH 2026 • Cooperative Workforce Network';
      productBadge.classList.add('eval-badge');
    }

    const research = hero.querySelector('#selectorResearchBtn');
    if (research) {
      research.textContent = '3-Minute SIH Overview →';
      research.classList.add('hero-tertiary-link');
      research.classList.remove('ghost');
    }

    const note = hero.querySelector('.selector-home-note');
    if (note) note.innerHTML = '<span class="selector-proof-line">✓ Guided overview needs no login · Connected prototype uses isolated demo accounts</span>';

    const loopCard = hero.querySelector('.loop-card');
    if (loopCard) {
      const title = loopCard.querySelector(':scope > .eyebrow, :scope > .loop-title');
      if (title) {
        title.textContent = 'SANPAID DECISION LOGIC';
        title.classList.remove('eyebrow');
        title.classList.add('loop-title');
      }
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

  function loadCredibilityLayer() {
    ensureStylesheet('sanpaidCredibilityStyles', 'credibility-layer.css');
    ensureScript('sanpaidCredibilityScript', 'credibility-layer.js');
  }

  function loadWorkforceIntelligence() {
    ensureStylesheet('sanpaidWorkforceIntelligenceStyles', 'workforce-intelligence.css');
    ensureScript('sanpaidWorkforceIntelligenceScript', 'workforce-intelligence.js');
    ensureScript('sanpaidWorkerTrustPassportScript', 'worker-trust-passport-ui.js');
  }

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
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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

    document.addEventListener('keydown', event => {
      const connectedDialog = document.querySelector('#connectedModalRoot [role="dialog"]');
      if (event.key === 'Tab' && connectedDialog) {
        trapFocus(event, connectedDialog);
        return;
      }
      if (event.key !== 'Escape') return;
      document.querySelector('#connectedModalRoot [data-modal-cancel]')?.click();
    });

    document.addEventListener('click', event => {
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();