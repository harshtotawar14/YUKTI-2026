(() => {
  'use strict';

  const STEP_META = [
    ['problem','Problem'],
    ['difference','Difference'],
    ['matching','Fair Match'],
    ['choice','Worker Choice'],
    ['trust','Trust'],
    ['governance','Governance'],
    ['capacity','Capacity'],
    ['planning','Planning'],
    ['research','Research'],
    ['impact','Impact']
  ];

  let shell = null;
  let current = 0;
  let returnFocus = null;
  let returnScrollY = 0;
  let autoTimer = null;
  let historyOwned = false;
  let suppressRouteWrite = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  function stepProblem() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 1 · THE PROBLEM</span>
        <h1>Skilled workers exist. Trusted coordination is missing.</h1>
        <p>Customers need trust, workers need fair access to demand, and cooperatives need one connected operational view.</p>
      </div>
      <div class="selector-card-grid four">
        <article class="selector-card"><b>Trust Gap</b><p>Worker identity, skill and current verification are hard to confirm before service.</p></article>
        <article class="selector-card"><b>Discovery Gap</b><p>Verified cooperative workers have limited digital visibility while local demand stays fragmented.</p></article>
        <article class="selector-card"><b>Allocation Gap</b><p>Nearest-only matching can ignore eligibility, fairness, availability and worker choice.</p></article>
        <article class="selector-card"><b>Management Gap</b><p>Bookings, complaints, capacity, payments and workforce planning are often handled separately.</p></article>
      </div>
      <div class="selector-callout"><b>Skilled workers already exist. The missing layer is trusted digital coordination.</b></div>`;
  }

  function stepDifference() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 2 · WHY SANPAID IS DIFFERENT</span>
        <h1>Not another service marketplace.</h1>
        <p>SanPaid extends beyond Customer → Provider → Service by adding cooperative and federation governance around the workforce lifecycle.</p>
      </div>
      <div class="selector-compare">
        <article class="selector-card muted-card">
          <span class="selector-mini-label">TYPICAL MARKETPLACE</span>
          <div class="selector-chain compact"><span>Customer</span><i>→</i><span>Provider</span><i>→</i><span>Service</span></div>
        </article>
        <article class="selector-card strong-card">
          <span class="selector-mini-label">SANPAID NETWORK</span>
          <div class="selector-network-stack"><span>Customer</span><i>↕</i><span>Worker</span><i>↕</i><span>Cooperative</span><i>↕</i><span>Federation</span></div>
          <div class="selector-chip-row"><span>Verified Eligibility</span><span>Fair Opportunity</span><span>Worker Choice</span><span>Cooperative Governance</span><span>Workforce Planning</span></div>
        </article>
      </div>
      <div class="selector-callout"><b>SanPaid does not replace cooperatives — it digitizes and strengthens how they verify, allocate, govern and plan.</b></div>`;
  }

  function stepMatching() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 3 · ELIGIBILITY-FIRST FAIR MATCHING</span>
        <h1>Closer does not mean eligible.</h1>
        <p>Trust and eligibility are checked before ranking. A closer unverified worker cannot outrank a verified eligible worker.</p>
      </div>
      <div class="selector-proof-pair selector-focus-proof">
        <article class="selector-person excluded">
          <span class="selector-status bad">NOT ELIGIBLE</span>
          <h2>Rahul Deshmukh</h2><strong>1.8 KM</strong><p>Verification Pending</p>
        </article>
        <div class="selector-vs">VS</div>
        <article class="selector-person eligible">
          <span class="selector-status good">ELIGIBLE</span>
          <h2>Amit</h2><strong>2.3 KM</strong>
          <div class="selector-check-list"><span>✓ Verified</span><span>✓ Correct Skill</span><span>✓ Available</span><span>✓ Within Radius</span></div>
        </article>
      </div>
      <div class="selector-flow-three"><span>ELIGIBILITY</span><i>→</i><span>FAIR RANKING</span><i>→</i><span>WORKER CHOICE</span></div>
      <details class="selector-details"><summary>See technical matching detail</summary><div class="selector-two-col"><div><b>Eligibility</b><p>Identity · Skill · Availability · Documents · Radius · Schedule</p></div><div><b>Ranking</b><p>Distance · Rating · Workload · Recent opportunity · Schedule fit</p></div></div></details>
      <div class="selector-callout selector-callout-strong"><b>CLOSER DOES NOT MEAN ELIGIBLE.</b></div>`;
  }

  function stepChoice() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 4 · WORKER CHOICE + FALLBACK</span>
        <h1>Worker choice without breaking the customer journey.</h1>
        <p>If Worker A declines, the same booking continues to the next eligible worker. No new customer booking is created.</p>
      </div>
      <div class="selector-handoff">
        <article><b>Customer Request</b><span>Original booking</span></article><i>→</i>
        <article><b>Worker A</b><span>Eligible · Offered</span><strong class="decline">DECLINES</strong></article><i>→</i>
        <article><b>Same Booking Continues</b><span>Request + voice context preserved</span></article><i>→</i>
        <article><b>Worker B</b><span>Next eligible offer</span><strong class="accept">ACCEPTS</strong></article>
      </div>
      <div class="selector-proof-lines"><span>✓ Same Booking ID</span><span>✓ Same Customer Request</span><span>✓ Same Voice Context</span><span>✓ New Eligible Worker Offer</span></div>
      <div class="selector-callout"><b>Workers keep choice without breaking the customer journey.</b></div>
      <div class="selector-inline-actions"><button class="btn secondary" type="button" data-selector-action="connected">Run Connected Proof</button></div>`;
  }

  function stepTrust() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 5 · TRUSTED SERVICE START</span>
        <h1>Service starts only after dual confirmation.</h1>
        <p>The assigned worker must pass the service-start identity gate and the customer must confirm before work begins.</p>
      </div>
      <div class="selector-trust-flow"><span>Worker Arrives</span><i>→</i><span>Booking Validation</span><i>→</i><span>Sandbox Identity Check</span><i>→</i><span>One-Time Verification</span><i>→</i><span>Customer Confirms</span><i>→</i><span class="enabled">SERVICE START</span></div>
      <div class="selector-lock-rule"><b>IDENTITY VERIFIED</b><strong>+</strong><b>CUSTOMER CONFIRMED</b><strong>=</strong><b>SERVICE START</b></div>
      <div class="selector-truth-note"><span class="selector-status demo">PROTOTYPE-DEMO</span><p>Without both checks, service cannot start. Current identity/liveness proof is sandboxed; production biometric KYC is not claimed.</p></div>`;
  }

  function stepGovernance() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 6 · COOPERATIVE COMMAND CENTER</span>
        <h1>From scattered records to one command center.</h1>
        <p>The cooperative needs visibility into trust, service delivery, complaints, capacity and operations — not only bookings.</p>
      </div>
      <div class="selector-card-grid three compact-cards">
        <article class="selector-card"><b>Verified Workers</b><p>Eligibility and verification visibility.</p></article>
        <article class="selector-card"><b>Available Workers</b><p>Who can receive eligible offers now.</p></article>
        <article class="selector-card"><b>Active Services</b><p>Current booking and service lifecycle.</p></article>
        <article class="selector-card"><b>Complaints / SLA</b><p>Support workload and governed escalation.</p></article>
        <article class="selector-card"><b>Capacity Gap</b><p>Expected demand versus eligible capacity.</p></article>
        <article class="selector-card"><b>Payments / Operations</b><p>Traceable service transaction records.</p></article>
      </div>
      <div class="selector-truth-note"><span class="selector-status good">CONNECTED PROOF</span><p>Interactive Command Center values are backend-derived rather than random dashboard numbers.</p></div>`;
  }

  function stepCapacity() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 7 · CROSS-COOPERATIVE CAPACITY</span>
        <h1>Share capacity without transferring workers automatically.</h1>
        <p>A cooperative shortage can create a governed nearby-capacity request while provider approval and worker consent remain required.</p>
      </div>
      <div class="selector-scenario-badge">READ-ONLY GOVERNANCE SCENARIO</div>
      <div class="selector-capacity-flow">
        <article><b>Karad Cooperative</b><span>Demand 42</span><span>Eligible Capacity 29</span><strong>Gap 13</strong></article>
        <i>→</i><article><b>Request Capacity</b><span>Governed request</span></article>
        <i>→</i><article><b>Satara Approval</b><span>Available Capacity 8</span></article>
        <i>→</i><article><b>Worker Offer</b><span>CONSENT REQUIRED</span><strong>Accept / Decline</strong></article>
      </div>
      <div class="selector-callout selector-callout-strong"><b>CAPACITY IS SHARED. WORKERS ARE NOT TRANSFERRED AUTOMATICALLY.</b></div>`;
  }

  function stepPlanning() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 8 · DEMAND & SKILL PLANNING</span>
        <h1>AI advises. Cooperative decides.</h1>
        <p>Historical demand and eligible capacity produce confidence-aware operational recommendations — not forced allocation or automatic certification.</p>
      </div>
      <div class="selector-planning-flow"><span>Historical Demand</span><i>→</i><span>Expected Demand + Confidence</span><i>→</i><span>Eligible Capacity</span><i>→</i><span>Capacity / Skill Gap</span><i>→</i><span>Recommended Action</span></div>
      <div class="selector-card-grid three">
        <article class="selector-card"><b>Request Nearby Capacity</b><p>Use governed cross-cooperative support when local capacity is short.</p></article>
        <article class="selector-card"><b>Review Skill Gap</b><p>Identify which verified skills are under-supplied for expected demand.</p></article>
        <article class="selector-card"><b>Recommend Training</b><p>Create an advisory recommendation for cooperative review and approval.</p></article>
      </div>
      <details class="selector-details"><summary>See training decision flow</summary><div class="selector-training-flow"><span>Demand Gap</span><i>→</i><span>Skill Gap</span><i>→</i><span>Training Recommendation</span><i>→</i><span>Human Approval</span><i>→</i><span>Future Skill Verification</span></div></details>
      <div class="selector-callout"><b>AI can recommend. It cannot automatically certify a worker.</b></div>`;
  }

  function stepResearch() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 9 · RESEARCH, SECURITY & SCALE</span>
        <h1>Research becomes system decisions.</h1>
        <p>Six research foundations explain the design without turning the selector journey into a technical report.</p>
      </div>
      <div class="selector-research-grid selector-research-compact">
        <article><b>OWASP API Security</b><p>→ Protected role actions</p></article>
        <article><b>PostgreSQL</b><p>→ Transaction-safe persistent workflow</p></article>
        <article><b>Maps / Geo</b><p>→ Radius and route architecture</p></article>
        <article><b>Person–Job Fit</b><p>→ Eligibility before ranking</p></article>
        <article><b>Cooperative Research</b><p>→ Cooperative/federation governance</p></article>
        <article><b>Workforce Planning</b><p>→ Demand-capacity-skill workflow</p></article>
      </div>
      <div class="selector-detail-actions">
        <details class="selector-details"><summary>View Architecture</summary><div class="selector-architecture"><div><span>Customer · Worker · Cooperative · Federation</span><i>↓</i><span>Auth · Booking · Matching · Trust · Capacity · Planning</span><i>↓</i><span>PostgreSQL · Audit History</span><i>↓</i><span>Maps · Payments · OTP · Welfare</span></div></div></details>
        <details class="selector-details"><summary>View Security Principles</summary><div class="selector-chip-row security"><span>Role-Based Access</span><span>Server Authorization</span><span>Session Protection</span><span>Password Hashing</span><span>Transaction Protection</span><span>Audit Logs</span><span>One-Time Tokens</span><span>Token Expiry</span><span>Privacy-by-Design</span></div><p class="selector-roadmap">Production roadmap includes WAF, DDoS protection, caching, replicas, backup/DR and monitoring where not already deployed.</p></details>
      </div>
      <div class="selector-callout"><b>Research → architecture decision → visible prototype proof.</b></div>`;
  }

  function stepImpact() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 10 · IMPACT + FINAL MESSAGE</span>
        <h1>One network for trusted services and stronger cooperatives.</h1>
        <p>SanPaid connects customer demand, verified cooperative workers, fair opportunity, trusted service delivery and workforce planning.</p>
      </div>
      <div class="selector-card-grid four impact">
        <article class="selector-card"><b>Customer</b><p>→ Trusted Services</p></article>
        <article class="selector-card"><b>Worker</b><p>→ Fair Opportunities</p></article>
        <article class="selector-card"><b>Cooperative</b><p>→ Digital Operations</p></article>
        <article class="selector-card"><b>Federation</b><p>→ Regional Coordination</p></article>
      </div>
      <details class="selector-details selector-truth-details"><summary>Prototype Truth — what is implemented vs sandbox/future</summary>
        <div class="selector-truth-matrix">
          <div><b>Connected Customer → Worker</b><span class="selector-status good">IMPLEMENTED</span></div>
          <div><b>Fair Matching</b><span class="selector-status good">IMPLEMENTED</span></div>
          <div><b>Worker Accept / Decline</b><span class="selector-status good">IMPLEMENTED</span></div>
          <div><b>Dual Verification</b><span class="selector-status demo">PROTOTYPE-DEMO</span></div>
          <div><b>Payment</b><span class="selector-status demo">SANDBOX</span></div>
          <div><b>SLA Time Advancement</b><span class="selector-status demo">DEMO SIMULATION</span></div>
          <div><b>Insurance / ESIC</b><span class="selector-status future">FUTURE READY</span></div>
          <div><b>Production Biometric KYC</b><span class="selector-status future">FUTURE</span></div>
        </div>
      </details>
      <div class="selector-final-message"><b>Why this solution matters for PS 26089</b><p>SanPaid strengthens cooperative verification, worker opportunity, service trust, complaint governance, capacity coordination and workforce planning instead of replacing cooperatives.</p></div>
      <div class="selector-final-actions">
        <button class="btn primary" type="button" data-selector-action="connected">▶ Open Working Prototype</button>
        <button class="btn secondary" type="button" data-selector-action="judge">🏆 Explore Technical & Research Proof</button>
        <button class="btn ghost" type="button" data-selector-action="home">Return to Home</button>
      </div>`;
  }

  const STEP_RENDERERS = [
    stepProblem, stepDifference, stepMatching, stepChoice, stepTrust,
    stepGovernance, stepCapacity, stepPlanning, stepResearch, stepImpact
  ];

  function injectReleaseStyles() {
    if (document.getElementById('selectorReleaseStyles')) return;
    const style = document.createElement('style');
    style.id = 'selectorReleaseStyles';
    style.textContent = `
      .selector-mode{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .selector-step-head{max-width:860px}.selector-step-head p{max-width:780px}
      .selector-callout-strong{letter-spacing:.01em}.selector-callout-strong b{font-size:clamp(17px,2.4vw,23px)}
      .selector-focus-proof{max-width:940px}.selector-inline-actions,.selector-final-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}
      .selector-final-actions .btn{min-height:48px}.selector-detail-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.selector-detail-actions .selector-details{margin-top:0}
      .selector-research-compact article p{font-weight:700;color:#47627e}.selector-truth-details{margin-top:16px}
      .selector-notice{position:fixed;right:16px;bottom:82px;z-index:9;max-width:420px;padding:12px 14px;border-radius:12px;background:#0f2340;color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.18);font-size:13px;line-height:1.5}
      .selector-progress button[aria-current="step"]{box-shadow:inset 0 0 0 2px rgba(11,25,48,.12)}
      .selector-mode button:focus-visible,.selector-mode summary:focus-visible{outline:3px solid #6ba7ff;outline-offset:3px}
      @media(max-width:720px){.selector-detail-actions{grid-template-columns:1fr}.selector-final-actions{display:grid}.selector-final-actions .btn{width:100%}.selector-notice{left:12px;right:12px;bottom:154px;max-width:none}}
      @media(prefers-reduced-motion:reduce){.selector-mode *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function ensureShell() {
    if (shell) return shell;
    injectReleaseStyles();
    shell = document.createElement('section');
    shell.id = 'selectorModeShell';
    shell.className = 'selector-mode hidden';
    shell.setAttribute('aria-label','SanPaid SIH selector guided demo');
    shell.innerHTML = `
      <header class="selector-top">
        <div><div class="brand">San<span>Paid</span></div><small>3-Minute SIH Guided Demo · PS 26089</small></div>
        <div class="selector-top-actions"><span class="selector-readonly">READ-ONLY WALKTHROUGH</span><button class="selector-icon-btn" id="selectorClose" aria-label="Close guided demo">✕</button></div>
      </header>
      <div class="selector-progress-wrap"><div class="selector-mobile-progress" id="selectorMobileProgress"></div><div class="selector-progress" id="selectorProgress"></div></div>
      <main class="selector-main" id="selectorContent" tabindex="-1" aria-live="polite" aria-atomic="true"></main>
      <div id="selectorNotice" class="selector-notice hidden" role="status" aria-live="polite"></div>
      <footer class="selector-controls">
        <button class="btn secondary" id="selectorPrev">← Previous</button>
        <button class="btn ghost" id="selectorAuto" aria-pressed="false">▶ Auto Walkthrough</button>
        <div class="selector-control-spacer"></div>
        <button class="btn primary" id="selectorNext">Next →</button>
      </footer>`;
    document.body.appendChild(shell);

    shell.querySelector('#selectorClose').addEventListener('click', () => close());
    shell.querySelector('#selectorPrev').addEventListener('click', () => go(current - 1, {manual:true}));
    shell.querySelector('#selectorNext').addEventListener('click', () => {
      if (current === STEP_META.length - 1) return dismissToHome();
      go(current + 1, {manual:true});
    });
    shell.querySelector('#selectorAuto').addEventListener('click', toggleAuto);

    document.addEventListener('keydown', onKeydown);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAuto(); });
    window.addEventListener('popstate', onPopState);
    return shell;
  }

  function renderProgress() {
    const progress = shell.querySelector('#selectorProgress');
    progress.innerHTML = STEP_META.map(([id,label],i) => `
      <button type="button" class="${i === current ? 'active' : i < current ? 'done' : ''}" data-selector-step="${i}" aria-label="Open step ${i+1}: ${esc(label)}" ${i === current ? 'aria-current="step"' : ''}>
        <span>${i < current ? '✓' : i + 1}</span><small>${esc(label)}</small>
      </button>`).join('');
    progress.querySelectorAll('[data-selector-step]').forEach(btn => btn.addEventListener('click', () => go(Number(btn.dataset.selectorStep), {manual:true})));
    shell.querySelector('#selectorMobileProgress').innerHTML = `<b>Step ${current + 1} of ${STEP_META.length}</b><span>${esc(STEP_META[current][1])}</span>`;
  }

  function wireStepActions() {
    shell.querySelectorAll('[data-selector-action="connected"]').forEach(btn => btn.addEventListener('click', openConnected));
    shell.querySelectorAll('[data-selector-action="judge"]').forEach(btn => btn.addEventListener('click', openJudge));
    shell.querySelectorAll('[data-selector-action="home"]').forEach(btn => btn.addEventListener('click', dismissToHome));
  }

  function render() {
    renderProgress();
    const content = shell.querySelector('#selectorContent');
    content.innerHTML = STEP_RENDERERS[current]();
    wireStepActions();
    shell.querySelector('#selectorPrev').disabled = current === 0;
    const next = shell.querySelector('#selectorNext');
    next.textContent = current === STEP_META.length - 1 ? 'Return Home' : 'Next →';
    shell.scrollTop = 0;
    const heading = content.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex','-1');
      requestAnimationFrame(() => heading.focus({preventScroll:true}));
    } else {
      requestAnimationFrame(() => content.focus({preventScroll:true}));
    }
    writeCurrentRoute();
  }

  function go(index, options = {}) {
    if (options.manual) stopAuto();
    current = Math.max(0, Math.min(STEP_META.length - 1, Number(index) || 0));
    render();
  }

  function cleanedUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('sih');
    url.searchParams.delete('step');
    if (url.hash === '#selector-demo') url.hash = '';
    return url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
  }

  function selectorUrl(stepIndex = current) {
    const url = new URL(location.href);
    url.searchParams.set('sih','selector');
    url.searchParams.set('step', String(stepIndex + 1));
    if (url.hash === '#selector-demo') url.hash = '';
    return url.pathname + '?' + url.searchParams.toString() + (url.hash ? url.hash : '');
  }

  function writeCurrentRoute() {
    if (suppressRouteWrite || !shell || shell.classList.contains('hidden')) return;
    const state = historyOwned ? {...(history.state || {}), sanpaidSelector:true} : history.state;
    try { history.replaceState(state, '', selectorUrl(current)); } catch {}
  }

  function open(index = 0, options = {}) {
    ensureShell();
    const alreadyOpen = !shell.classList.contains('hidden');
    if (!alreadyOpen) {
      returnFocus = document.activeElement;
      returnScrollY = window.scrollY;
    }
    current = Math.max(0, Math.min(STEP_META.length - 1, Number(index) || 0));
    shell.classList.remove('hidden');
    document.body.classList.add('selector-open');
    document.getElementById('mobileDrawer')?.classList.add('hidden');
    document.body.style.overflow = 'hidden';

    if (!alreadyOpen && !options.fromRoute) {
      try {
        history.pushState({...(history.state || {}), sanpaidSelector:true}, '', selectorUrl(current));
        historyOwned = true;
      } catch { historyOwned = false; }
    } else if (options.fromRoute) {
      historyOwned = false;
      suppressRouteWrite = true;
    }

    render();
    suppressRouteWrite = false;
  }

  function close(options = {}) {
    stopAuto();
    if (!shell || shell.classList.contains('hidden')) return;

    if (!options.fromHistory && !options.noHistory && historyOwned && history.state?.sanpaidSelector) {
      try { history.back(); return; } catch {}
    }

    shell.classList.add('hidden');
    document.body.classList.remove('selector-open');
    document.body.style.overflow = '';
    hideNotice();

    if (!options.fromHistory && !options.keepRoute) {
      try { history.replaceState(null, '', cleanedUrl()); } catch {}
    }

    const target = returnFocus;
    returnFocus = null;
    historyOwned = false;
    if (options.restoreScroll !== false) window.scrollTo({top:returnScrollY, behavior:'auto'});
    if (target?.isConnected) setTimeout(() => target.focus(), 0);
  }

  function dismissToHome() {
    stopAuto();
    if (shell && !shell.classList.contains('hidden')) {
      shell.classList.add('hidden');
      document.body.classList.remove('selector-open');
      document.body.style.overflow = '';
      hideNotice();
    }
    try { history.replaceState(null, '', cleanedUrl() || '/'); } catch {}
    historyOwned = false;
    returnFocus = null;
    requestAnimationFrame(() => {
      document.getElementById('home')?.scrollIntoView({behavior:'auto', block:'start'});
      const homeHeading = document.querySelector('#home h1');
      if (homeHeading) {
        homeHeading.setAttribute('tabindex','-1');
        homeHeading.focus({preventScroll:true});
      }
    });
  }

  function onPopState(event) {
    if (!shell || shell.classList.contains('hidden')) return;
    if (event.state?.sanpaidSelector) return;
    close({fromHistory:true, keepRoute:true});
  }

  function showNotice(message) {
    const notice = shell?.querySelector('#selectorNotice');
    if (!notice) return;
    notice.textContent = message;
    notice.classList.remove('hidden');
    clearTimeout(showNotice.timer);
    showNotice.timer = setTimeout(hideNotice, 6000);
  }

  function hideNotice() {
    clearTimeout(showNotice.timer);
    const notice = shell?.querySelector('#selectorNotice');
    notice?.classList.add('hidden');
  }

  function openConnected() {
    stopAuto();
    if (!window.ConnectedSanPaid?.open) {
      showNotice('Interactive proof is starting. The guided SIH overview is available now. Please retry in a moment.');
      return;
    }
    close({noHistory:true});
    window.ConnectedSanPaid.open();
  }

  function openJudge() {
    stopAuto();
    if (!window.SanPaidJudgeMode?.open) {
      showNotice('Technical proof is starting. The guided SIH overview remains available now. Please retry in a moment.');
      return;
    }
    close({noHistory:true});
    window.SanPaidJudgeMode.open();
  }

  function stopAuto() {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
    const btn = shell?.querySelector('#selectorAuto');
    if (btn) {
      btn.setAttribute('aria-pressed','false');
      btn.textContent = '▶ Auto Walkthrough';
    }
  }

  function scheduleAutoAdvance() {
    if (!autoTimer && shell && !shell.classList.contains('hidden')) {
      autoTimer = setTimeout(() => {
        autoTimer = null;
        if (document.hidden || shell.classList.contains('hidden') || current >= STEP_META.length - 1) {
          stopAuto();
          return;
        }
        current += 1;
        render();
        scheduleAutoAdvance();
      }, 11000);
    }
  }

  function toggleAuto() {
    if (autoTimer) {
      stopAuto();
      return;
    }
    const btn = shell.querySelector('#selectorAuto');
    btn.setAttribute('aria-pressed','true');
    btn.textContent = '⏸ Pause';
    scheduleAutoAdvance();
  }

  function onKeydown(event) {
    if (!shell || shell.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    const interactive = event.target.closest?.('input,textarea,select,button,summary,a');
    if (interactive) return;
    if (event.key === 'ArrowRight') go(current + 1, {manual:true});
    if (event.key === 'ArrowLeft') go(current - 1, {manual:true});
  }

  function simplifyLanding() {
    document.getElementById('connectedDemoSection')?.remove();
    document.getElementById('sihJudgeModeBtn')?.remove();

    const connected = document.getElementById('connectedDemoBtn');
    if (connected && connected.closest('.hero-ctas')) connected.remove();

    document.querySelectorAll('.navlinks [data-selector-nav]').forEach(el => el.remove());

    const lowerConnected = document.querySelector('#guidedDemo #connectedDemoBtn');
    if (lowerConnected) {
      lowerConnected.textContent = 'Open Working Prototype';
      lowerConnected.onclick = () => window.ConnectedSanPaid?.open?.();
    }
  }

  function install() {
    ensureShell();
    simplifyLanding();

    document.querySelectorAll('[data-open-selector]').forEach(el => {
      el.addEventListener('click', () => open(Number(el.dataset.openSelector || 0)));
    });

    const params = new URLSearchParams(location.search);
    const routeSelector = params.get('sih') === 'selector';
    const hashSelector = location.hash === '#selector-demo';
    if (routeSelector || hashSelector) {
      const rawStep = Number(params.get('step') || 1);
      const start = Number.isFinite(rawStep) ? Math.max(0, Math.min(STEP_META.length - 1, rawStep - 1)) : 0;
      setTimeout(() => open(start, {fromRoute:true}), 80);
    }
  }

  window.SanPaidSelectorMode = { open, close, go };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();