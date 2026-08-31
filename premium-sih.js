(() => {
  'use strict';

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const ICONS = {
    shield: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 5.5 5.6v5.2c0 4.2 2.6 7.8 6.5 9.2 3.9-1.4 6.5-5 6.5-9.2V5.6L12 3Z"/><path d="m9.2 11.7 1.8 1.8 3.9-4"/></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v18M5 6h14M7 6l-3 6h6L7 6Zm10 0-3 6h6l-3-6ZM8 21h8"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5.5 20c.6-4 2.8-6 6.5-6s5.9 2 6.5 6"/><path d="m17.2 10.8 1.4 1.4 2.4-2.8"/></svg>',
    network: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="m8.2 8.3 2.4 7M15.8 8.3l-2.4 7M8.5 7h7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/></svg>',
    rank: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18h3V9H5v9Zm5.5 0h3V5h-3v13Zm5.5 0h3v-6h-3v6Z"/></svg>',
    audit: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h8l4 4v14H7V3Z"/><path d="M15 3v5h4M10 12h6M10 16h6"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.3A8.2 8.2 0 0 1 8.7 4a8.2 8.2 0 1 0 11.3 11.3Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
  };

  function setTheme(theme) {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.sanpaidTheme = resolved;
    try { localStorage.setItem('sanpaid-theme', resolved); } catch {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#07131d' : '#f4f8fa');
    const button = $('#premiumThemeToggle');
    if (button) {
      button.innerHTML = resolved === 'dark' ? ICONS.sun : ICONS.moon;
      button.setAttribute('aria-label', resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      button.title = resolved === 'dark' ? 'Light mode' : 'Dark mode';
    }
  }

  function installThemeToggle() {
    let stored = '';
    try { stored = localStorage.getItem('sanpaid-theme') || ''; } catch {}
    setTheme(stored || 'light');

    const actions = $('#landing .eval-nav .actions');
    if (!actions || $('#premiumThemeToggle')) return;
    const button = document.createElement('button');
    button.id = 'premiumThemeToggle';
    button.className = 'premium-theme-toggle';
    button.type = 'button';
    actions.insertBefore(button, actions.firstElementChild);
    setTheme(document.documentElement.dataset.sanpaidTheme || 'light');
    button.addEventListener('click', () => setTheme(document.documentElement.dataset.sanpaidTheme === 'dark' ? 'light' : 'dark'));
  }

  function decorateHeroBadges() {
    const chips = $$('#landing #home .hero-master-flow > span');
    const data = [
      {icon: ICONS.shield, tip: 'Identity, skill, availability and configured service area are checked before ranking.'},
      {icon: ICONS.rank, tip: 'Only eligible workers are ranked using visible factors such as distance and workload balance.'},
      {icon: ICONS.user, tip: 'The worker can accept or decline. Ranking never forces assignment.'},
      {icon: ICONS.audit, tip: 'Reason codes and service outcomes remain traceable for cooperative oversight.'}
    ];
    chips.forEach((chip, index) => {
      const item = data[index];
      if (!item || chip.dataset.premiumDecorated === 'true') return;
      const label = chip.textContent.trim();
      chip.innerHTML = `${item.icon}${label}`;
      chip.dataset.tip = item.tip;
      chip.dataset.premiumDecorated = 'true';
      chip.tabIndex = 0;
      chip.setAttribute('aria-label', `${label}. ${item.tip}`);
    });
  }

  function decorateTrustStrip() {
    const items = $$('#landing #home > .eval-trust .trustin > span');
    const data = [
      {icon: ICONS.network, title: 'Cooperative Governance', desc: 'Authorized oversight'},
      {icon: ICONS.shield, title: 'Eligibility Gate', desc: 'Rules before ranking'},
      {icon: ICONS.user, title: 'Worker Choice', desc: 'Accept or decline'},
      {icon: ICONS.scale, title: 'Capacity Exchange', desc: 'Governed coordination'}
    ];
    items.forEach((item, index) => {
      const x = data[index];
      if (!x || item.dataset.premiumDecorated === 'true') return;
      item.innerHTML = `${x.icon}<div><b>${x.title}</b><small>${x.desc}</small></div>`;
      item.dataset.premiumDecorated = 'true';
    });
  }

  function addWorkflowRail() {
    const panel = $('#evalHeroSystem');
    if (!panel || panel.querySelector('.premium-workflow-line')) return;
    const rail = document.createElement('div');
    rail.className = 'premium-workflow-line';
    rail.setAttribute('aria-hidden', 'true');
    panel.appendChild(rail);
  }

  function animateNumber(node, target, suffix = '') {
    if (!node) return;
    if (reduceMotion) { node.textContent = `${target}${suffix}`; return; }
    const duration = 620;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function pulseHeroMetrics() {
    const gate = $('#landing .eval-mini-gate');
    if (!gate) return;
    const values = gate.querySelectorAll('strong');
    animateNumber(values[0], 5, ' Workers');
    animateNumber(values[1], 3);
    animateNumber(values[2], 2);
    const offer = $('#landing .eval-mini-offer');
    if (offer) {
      offer.classList.remove('premium-offer-nudge');
      void offer.offsetWidth;
      offer.classList.add('premium-offer-nudge');
    }
  }

  function runChipSequence() {
    const chips = $$('#landing .eval-mini-workers .hero-worker');
    if (!chips.length || reduceMotion) return;
    let index = 0;
    let count = 0;
    const maxSteps = Math.max(chips.length * 2, 8);
    const step = () => {
      if (document.hidden) { setTimeout(step, 900); return; }
      chips.forEach((chip, i) => chip.classList.toggle('premium-chip-active', i === index));
      index = (index + 1) % chips.length;
      count += 1;
      if (count < maxSteps) setTimeout(step, 760);
      else setTimeout(() => chips.forEach(chip => chip.classList.remove('premium-chip-active')), 900);
    };
    step();
  }

  function installHeroMetricLoop() {
    pulseHeroMetrics();
    if (!reduceMotion) setTimeout(() => { if (!document.hidden) pulseHeroMetrics(); }, 8200);
  }

  function installNavScroll() {
    const nav = $('#landing .eval-nav');
    if (!nav) return;
    const sync = () => nav.classList.toggle('premium-scrolled', window.scrollY > 18);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  function installReveal() {
    const targets = [
      ...$$('#landing .section .head'),
      ...$$('#landing .problem-card'),
      ...$$('#landing .eval-core-card'),
      ...$$('#landing .eval-match'),
      ...$$('#landing .eval-phone'),
      ...$$('#landing .eval-coop-card'),
      ...$$('#landing .eval-decision-card'),
      ...$$('#landing .eval-kpi-card'),
      ...$$('#landing .eval-truth-col'),
      ...$$('#landing .eval-architecture-preview')
    ];
    const unique = [...new Set(targets)];
    unique.forEach(node => node.classList.add('premium-reveal'));
    if (reduceMotion || !('IntersectionObserver' in window)) {
      unique.forEach(node => node.classList.add('premium-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('premium-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    unique.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(node);
    });
  }

  function installCardPointerDepth() {
    if (reduceMotion || !window.matchMedia?.('(pointer:fine)')?.matches) return;
    const panel = $('#evalHeroSystem');
    if (!panel) return;
    panel.addEventListener('pointermove', event => {
      const rect = panel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      panel.style.transform = `perspective(900px) rotateX(${(-y * 1.6).toFixed(2)}deg) rotateY(${(x * 1.8).toFixed(2)}deg) translateY(-3px)`;
    });
    panel.addEventListener('pointerleave', () => { panel.style.transform = ''; });
  }

  function start() {
    if (!$('#landing')) return;
    installThemeToggle();
    decorateHeroBadges();
    decorateTrustStrip();
    addWorkflowRail();
    runChipSequence();
    installHeroMetricLoop();
    installNavScroll();
    installReveal();
    installCardPointerDepth();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();