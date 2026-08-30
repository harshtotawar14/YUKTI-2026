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
  let autoTimer = null;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function stepProblem() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 1 · THE PROBLEM</span>
        <h1>Skilled cooperative workers exist. The digital operating layer is missing.</h1>
        <p>SanPaid focuses on four gaps that directly affect customers, workers and labour cooperatives.</p>
      </div>
      <div class="selector-card-grid four">
        <article class="selector-card"><b>Trust Gap</b><p>Customers cannot easily confirm worker identity, skill or current verification before service.</p></article>
        <article class="selector-card"><b>Discovery Gap</b><p>Verified cooperative workers have limited digital visibility while nearby demand stays fragmented.</p></article>
        <article class="selector-card"><b>Allocation Gap</b><p>Nearest-only matching can ignore eligibility, fairness, availability and worker choice.</p></article>
        <article class="selector-card"><b>Management Gap</b><p>Workers, bookings, complaints, capacity, payments and planning are often handled separately.</p></article>
      </div>
      <div class="selector-callout"><b>SanPaid connects these gaps into one auditable workforce operating network.</b></div>`;
  }

  function stepDifference() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 2 · WHY SANPAID IS DIFFERENT</span>
        <h1>Not another service marketplace.</h1>
        <p>Ordinary service platforms mainly connect a customer to a provider. SanPaid adds cooperative and federation governance around the complete workforce lifecycle.</p>
      </div>
      <div class="selector-compare">
        <article class="selector-card muted-card">
          <span class="selector-mini-label">TYPICAL MARKETPLACE</span>
          <div class="selector-chain compact"><span>Customer</span><i>→</i><span>Provider</span><i>→</i><span>Service</span></div>
        </article>
        <article class="selector-card strong-card">
          <span class="selector-mini-label">SANPAID NETWORK</span>
          <div class="selector-network-stack">
            <span>Customer</span><i>↕</i><span>Worker</span><i>↕</i><span>Cooperative</span><i>↕</i><span>Federation</span>
          </div>
          <div class="selector-chip-row">
            <span>Verification</span><span>Fair Opportunity</span><span>Worker Choice</span><span>Service Trust</span><span>Complaint Governance</span><span>Capacity Exchange</span><span>Workforce Planning</span>
          </div>
        </article>
      </div>
      <div class="selector-callout"><b>SanPaid does not only help customers book services. It helps cooperatives operate and plan their workforce.</b></div>`;
  }

  function stepMatching() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 3 · ELIGIBILITY-FIRST FAIR MATCHING</span>
        <h1>Nearest does not automatically mean eligible.</h1>
        <p>Trust and eligibility are checked before ranking. A closer unverified worker cannot outrank a verified eligible worker.</p>
      </div>
      <div class="selector-proof-pair">
        <article class="selector-person excluded">
          <span class="selector-status bad">NOT ELIGIBLE</span>
          <h2>Rahul Deshmukh</h2>
          <strong>1.8 KM</strong>
          <p>Verification Pending</p>
        </article>
        <div class="selector-vs">VS</div>
        <article class="selector-person eligible">
          <span class="selector-status good">ELIGIBLE & FAIRLY RANKED</span>
          <h2>Amit</h2>
          <strong>2.3 KM</strong>
          <div class="selector-check-list"><span>✓ Verified</span><span>✓ Correct Skill</span><span>✓ Available</span><span>✓ Within Radius</span></div>
        </article>
      </div>
      <div class="selector-flow-three"><span>ELIGIBILITY FIRST</span><i>→</i><span>FAIR RANKING</span><i>→</i><span>WORKER CHOICE</span></div>
      <details class="selector-details"><summary>See how fairness is evaluated</summary><div class="selector-two-col"><div><b>Eligibility</b><p>Identity · Skill · Availability · Valid documents · Radius · Schedule</p></div><div><b>Ranking</b><p>Distance · Rating · Workload · Recent opportunity · Schedule fit</p></div></div></details>
      <div class="selector-callout"><b>Distance alone cannot override trust and eligibility.</b></div>`;
  }

  function stepChoice() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 4 · WORKER CHOICE + FALLBACK</span>
        <h1>The platform offers work. It does not force work.</h1>
        <p>If the first eligible worker declines, the same customer request continues to the next eligible worker without creating a new booking.</p>
      </div>
      <div class="selector-handoff">
        <article><b>Customer Request</b><span>Same booking record</span></article><i>→</i>
        <article><b>Worker A</b><span>Eligible · Receives Offer</span><strong class="decline">DECLINES</strong></article><i>→</i>
        <article><b>Same Booking Continues</b><span>Same request · Same voice context</span></article><i>→</i>
        <article><b>Worker B</b><span>Next eligible offer</span><strong class="accept">ACCEPTS</strong></article>
      </div>
      <div class="selector-proof-lines">
        <span>✓ Same Booking ID</span><span>✓ Same Customer Request</span><span>✓ Same Voice Context</span><span>✓ New Eligible Worker Offer</span>
      </div>
      <div class="selector-callout"><b>Workers are never forced to accept jobs.</b></div>`;
  }

  function stepTrust() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 5 · TRUSTED SERVICE START</span>
        <h1>Booking a worker is not enough. Starting the service must also be trusted.</h1>
        <p>SanPaid uses a dual service-start gate so the assigned worker and the customer both confirm before work begins.</p>
      </div>
      <div class="selector-trust-flow">
        <span>Worker Arrives</span><i>→</i><span>Booking Validation</span><i>→</i><span>Sandbox Identity Check</span><i>→</i><span>One-Time Verification</span><i>→</i><span>Customer Confirmation</span><i>→</i><span class="enabled">SERVICE START ENABLED</span>
      </div>
      <div class="selector-lock-rule">
        <b>NO VERIFIED IDENTITY</b><strong>+</strong><b>NO CUSTOMER CONFIRMATION</b><strong>=</strong><b>NO SERVICE START</b>
      </div>
      <div class="selector-truth-note"><span class="selector-status demo">PROTOTYPE-DEMO</span><p>Current identity/liveness proof is sandboxed. The website does not claim production biometric KYC.</p></div>`;
  }

  function stepGovernance() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 6 · COOPERATIVE COMMAND CENTER</span>
        <h1>From scattered records to one operational view.</h1>
        <p>The cooperative needs more than bookings. It needs visibility into trust, service delivery, complaints, capacity and worker operations.</p>
      </div>
      <div class="selector-card-grid four compact-cards">
        <article class="selector-card"><b>Verified Workers</b><p>Eligibility and verification status.</p></article>
        <article class="selector-card"><b>Available Workers</b><p>Who can receive eligible offers now.</p></article>
        <article class="selector-card"><b>Active Services</b><p>Current booking/service lifecycle.</p></article>
        <article class="selector-card"><b>Pending Verification</b><p>Workers not yet public/eligible.</p></article>
        <article class="selector-card"><b>Open Complaints</b><p>Support and escalation workload.</p></article>
        <article class="selector-card"><b>SLA At Risk</b><p>Complaints needing governed attention.</p></article>
        <article class="selector-card"><b>Capacity Gaps</b><p>Demand compared with eligible capacity.</p></article>
        <article class="selector-card"><b>Payments</b><p>Traceable service transaction records.</p></article>
      </div>
      <div class="selector-truth-note"><span class="selector-status good">CONNECTED PROOF</span><p>The interactive Judge Command Center uses backend-derived values instead of random dashboard metrics.</p></div>`;
  }

  function stepCapacity() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 7 · CROSS-COOPERATIVE CAPACITY</span>
        <h1>A shortage should create coordination — not silent worker transfer.</h1>
        <p>This read-only governance scenario shows how one cooperative can request nearby capacity while preserving provider approval and worker consent.</p>
      </div>
      <div class="selector-scenario-badge">READ-ONLY GOVERNANCE SCENARIO</div>
      <div class="selector-capacity-flow">
        <article><b>Karad Cooperative</b><span>Electrician Demand 42</span><span>Eligible Capacity 29</span><strong>Gap 13</strong></article>
        <i>→</i><article><b>Request Nearby Capacity</b><span>Governed request</span></article>
        <i>→</i><article><b>Satara Cooperative</b><span>Available Capacity 8</span><span>Provider Approval</span></article>
        <i>→</i><article><b>Eligible Worker Offer</b><span>Accept / Decline</span></article>
      </div>
      <div class="selector-callout"><b>Capacity can be shared. Workers are never transferred automatically.</b></div>`;
  }

  function stepPlanning() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 8 · DEMAND & SKILL PLANNING</span>
        <h1>SanPaid converts service demand into workforce decisions.</h1>
        <p>AI-assisted planning is advisory: demand and eligible capacity produce operational recommendations, not automatic worker certification or forced allocation.</p>
      </div>
      <div class="selector-planning-flow">
        <span>Historical Demand</span><i>→</i><span>Expected Demand + Confidence</span><i>→</i><span>Eligible Capacity</span><i>→</i><span>Capacity / Skill Gap</span><i>→</i><span>Operational Action</span>
      </div>
      <div class="selector-card-grid three">
        <article class="selector-card"><b>Request Nearby Capacity</b><p>Use cross-cooperative support when verified local capacity is short.</p></article>
        <article class="selector-card"><b>Review Skill Gap</b><p>Identify which verified skills are under-supplied for expected demand.</p></article>
        <article class="selector-card"><b>Recommend Training</b><p>Create an advisory training recommendation for cooperative review.</p></article>
      </div>
      <div class="selector-training-flow"><span>Demand Gap</span><i>→</i><span>Skill Gap</span><i>→</i><span>Training Recommendation</span><i>→</i><span>Human Approval</span><i>→</i><span>Future Skill Verification</span></div>
      <div class="selector-callout"><b>AI can recommend training. It cannot automatically certify a worker.</b></div>`;
  }

  function stepResearch() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 9 · RESEARCH, SECURITY & SCALE</span>
        <h1>Research is translated into system decisions.</h1>
        <p>The public experience stays simple; this guided view shows the research foundations without turning the website into a technical report.</p>
      </div>
      <div class="selector-research-grid">
        <article><b>OWASP API Security</b><p>Authorization and secure API design → role checks and protected connected actions.</p></article>
        <article><b>PostgreSQL</b><p>Persistent workflow and transactions → shared state, locking and auditability.</p></article>
        <article><b>Google Maps / Geo</b><p>Distance and route architecture → policy radius and future route/ETA integration.</p></article>
        <article><b>Person–Job Fit Research</b><p>Matching research → eligibility gates before explainable ranking.</p></article>
        <article><b>Cooperative / Government Research</b><p>Governance research → cooperative/federation roles and workforce coordination.</p></article>
        <article><b>Workforce Planning Research</b><p>Demand planning → capacity gaps, operational action and training recommendations.</p></article>
      </div>
      <div class="selector-architecture">
        <b>Simple Architecture</b>
        <div><span>Customer · Worker · Cooperative · Federation</span><i>↓</i><span>Auth · Booking · Matching · Payment · Complaint · Capacity · Planning · Voice</span><i>↓</i><span>PostgreSQL · Audit History</span><i>↓</i><span>Maps · Payments · OTP · Welfare / Insurance (integration roadmap)</span></div>
      </div>
      <details class="selector-details"><summary>Security & production-readiness principles</summary><div class="selector-chip-row security"><span>Role-Based Access</span><span>Server Authorization</span><span>Session Protection</span><span>Password Hashing</span><span>Transaction-Protected Actions</span><span>Audit Logs</span><span>One-Time Tokens</span><span>Token Expiry</span><span>Privacy-by-Design</span></div><p class="selector-roadmap">Production roadmap: WAF · DDoS protection · caching · replicas · backup/DR · monitoring. These are not presented as already deployed where they are not.</p></details>`;
  }

  function stepImpact() {
    return `
      <div class="selector-step-head">
        <span class="selector-kicker">STEP 10 · IMPACT + FINAL MESSAGE</span>
        <h1>Why this solution matters for PS 26089.</h1>
        <p>The value is not one feature. It is the connected operating model across customer demand, worker opportunity and cooperative governance.</p>
      </div>
      <div class="selector-card-grid five impact">
        <article class="selector-card"><b>Customer</b><p>Verified service discovery and trusted service start.</p></article>
        <article class="selector-card"><b>Worker</b><p>Fairer digital opportunities with Accept / Decline choice.</p></article>
        <article class="selector-card"><b>Cooperative</b><p>Digital workforce operations, complaints and capacity visibility.</p></article>
        <article class="selector-card"><b>Federation</b><p>Regional coordination, escalation and workforce planning.</p></article>
        <article class="selector-card"><b>System</b><p>Demand can become measurable capacity and skill decisions.</p></article>
      </div>
      <div class="selector-truth-matrix">
        <div><b>Connected Customer → Worker</b><span class="selector-status good">IMPLEMENTED</span></div>
        <div><b>Worker Accept / Decline</b><span class="selector-status good">IMPLEMENTED</span></div>
        <div><b>Eligibility-First Matching</b><span class="selector-status good">IMPLEMENTED</span></div>
        <div><b>Dual Verification</b><span class="selector-status demo">PROTOTYPE-DEMO</span></div>
        <div><b>Payment</b><span class="selector-status demo">SANDBOX</span></div>
        <div><b>SLA Time Advance</b><span class="selector-status demo">DEMO SIMULATION</span></div>
        <div><b>Insurance / ESIC</b><span class="selector-status future">FUTURE INTEGRATION READY</span></div>
        <div><b>Production Biometric KYC</b><span class="selector-status future">FUTURE INTEGRATION</span></div>
      </div>
      <div class="selector-final-message">
        <b>SanPaid does not only book local services.</b>
        <p>It connects customer demand, verified cooperative workers, fair opportunities, trusted service delivery and cooperative workforce planning into one operating network.</p>
      </div>
      <div class="selector-why">
        <b>Why this solution matters</b>
        <span>Direct PS 26089 alignment</span><span>Cooperative governance, not replacement</span><span>Worker choice preserved</span><span>Customer trust built into service start</span><span>Cross-cooperative collaboration</span><span>Demand data becomes workforce planning</span>
      </div>`;
  }

  const STEP_RENDERERS = [
    stepProblem, stepDifference, stepMatching, stepChoice, stepTrust,
    stepGovernance, stepCapacity, stepPlanning, stepResearch, stepImpact
  ];

  function ensureShell() {
    if (shell) return shell;
    shell = document.createElement('section');
    shell.id = 'selectorModeShell';
    shell.className = 'selector-mode hidden';
    shell.setAttribute('aria-label','SanPaid SIH selector guided demo');
    shell.innerHTML = `
      <header class="selector-top">
        <div>
          <div class="brand">San<span>Paid</span></div>
          <small>3-Minute SIH Guided Demo · PS 26089</small>
        </div>
        <div class="selector-top-actions">
          <span class="selector-readonly">READ-ONLY WALKTHROUGH</span>
          <button class="selector-icon-btn" id="selectorClose" aria-label="Close guided demo">✕</button>
        </div>
      </header>
      <div class="selector-progress-wrap">
        <div class="selector-mobile-progress" id="selectorMobileProgress"></div>
        <div class="selector-progress" id="selectorProgress"></div>
      </div>
      <main class="selector-main" id="selectorContent" tabindex="-1"></main>
      <footer class="selector-controls">
        <button class="btn secondary" id="selectorPrev">← Previous</button>
        <button class="btn ghost" id="selectorAuto" aria-pressed="false">▶ Auto Walkthrough</button>
        <div class="selector-control-spacer"></div>
        <button class="btn ghost" id="selectorWorkingDemo">Open Working Prototype</button>
        <button class="btn secondary" id="selectorTechnical">Explore Technical Proof</button>
        <button class="btn primary" id="selectorNext">Next →</button>
      </footer>`;
    document.body.appendChild(shell);

    shell.querySelector('#selectorClose').addEventListener('click', close);
    shell.querySelector('#selectorPrev').addEventListener('click', () => go(current - 1));
    shell.querySelector('#selectorNext').addEventListener('click', () => {
      if (current === STEP_META.length - 1) openConnected();
      else go(current + 1);
    });
    shell.querySelector('#selectorAuto').addEventListener('click', toggleAuto);
    shell.querySelector('#selectorWorkingDemo').addEventListener('click', openConnected);
    shell.querySelector('#selectorTechnical').addEventListener('click', openJudge);

    document.addEventListener('keydown', onKeydown);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto();
    });
    return shell;
  }

  function renderProgress() {
    const progress = shell.querySelector('#selectorProgress');
    progress.innerHTML = STEP_META.map(([id,label],i) => `
      <button type="button" class="${i === current ? 'active' : i < current ? 'done' : ''}" data-selector-step="${i}" aria-label="Open step ${i+1}: ${esc(label)}">
        <span>${i < current ? '✓' : i + 1}</span><small>${esc(label)}</small>
      </button>`).join('');
    progress.querySelectorAll('[data-selector-step]').forEach(btn => {
      btn.addEventListener('click', () => go(Number(btn.dataset.selectorStep)));
    });
    shell.querySelector('#selectorMobileProgress').innerHTML =
      `<b>Step ${current + 1} of ${STEP_META.length}</b><span>${esc(STEP_META[current][1])}</span>`;
  }

  function render() {
    renderProgress();
    const content = shell.querySelector('#selectorContent');
    content.innerHTML = STEP_RENDERERS[current]();
    shell.querySelector('#selectorPrev').disabled = current === 0;
    const next = shell.querySelector('#selectorNext');
    next.textContent = current === STEP_META.length - 1 ? 'Open Working Prototype →' : 'Next →';
    content.scrollTop = 0;
    shell.scrollTop = 0;
    requestAnimationFrame(() => content.focus({preventScroll:true}));
  }

  function go(index) {
    current = Math.max(0, Math.min(STEP_META.length - 1, Number(index) || 0));
    render();
  }

  function open(index = 0) {
    ensureShell();
    returnFocus = document.activeElement;
    current = Math.max(0, Math.min(STEP_META.length - 1, Number(index) || 0));
    shell.classList.remove('hidden');
    document.body.classList.add('selector-open');
    document.getElementById('mobileDrawer')?.classList.add('hidden');
    document.body.style.overflow = 'hidden';
    render();
  }

  function close() {
    stopAuto();
    if (!shell) return;
    shell.classList.add('hidden');
    document.body.classList.remove('selector-open');
    document.body.style.overflow = '';
    const target = returnFocus;
    returnFocus = null;
    if (target?.isConnected) setTimeout(() => target.focus(), 0);
  }

  function openConnected() {
    stopAuto();
    close();
    window.ConnectedSanPaid?.open?.();
  }

  function openJudge() {
    stopAuto();
    close();
    window.SanPaidJudgeMode?.open?.();
  }

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
    const btn = shell?.querySelector('#selectorAuto');
    if (btn) {
      btn.setAttribute('aria-pressed','false');
      btn.textContent = '▶ Auto Walkthrough';
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
    autoTimer = setInterval(() => {
      if (document.hidden || shell.classList.contains('hidden')) {
        stopAuto();
        return;
      }
      if (current >= STEP_META.length - 1) {
        stopAuto();
        return;
      }
      go(current + 1);
    }, 10000);
  }

  function onKeydown(event) {
    if (!shell || shell.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowRight' && !event.target.matches('input,textarea,select,button')) go(current + 1);
    if (event.key === 'ArrowLeft' && !event.target.matches('input,textarea,select,button')) go(current - 1);
  }

  function simplifyLanding() {
    document.getElementById('connectedDemoSection')?.remove();
    document.getElementById('sihJudgeModeBtn')?.remove();

    const heroCtas = document.querySelector('.hero-ctas');
    if (heroCtas && !document.getElementById('selectorDemoBtn')) {
      const guided = document.createElement('button');
      guided.id = 'selectorDemoBtn';
      guided.className = 'btn primary selector-hero-primary';
      guided.type = 'button';
      guided.textContent = '▶ View 3-Minute SIH Demo';
      guided.addEventListener('click', () => open(0));
      heroCtas.prepend(guided);
    }

    if (heroCtas && !document.getElementById('selectorResearchBtn')) {
      const research = document.createElement('button');
      research.id = 'selectorResearchBtn';
      research.className = 'btn ghost';
      research.type = 'button';
      research.textContent = 'Explore Research & Proof';
      research.addEventListener('click', () => open(8));
      heroCtas.appendChild(research);
    }

    const connected = document.getElementById('connectedDemoBtn');
    if (connected) {
      connected.textContent = 'Open Working Prototype';
      connected.classList.remove('secondary');
      connected.classList.add('ghost');
      connected.onclick = () => window.ConnectedSanPaid?.open?.();
    }

    const nav = document.querySelector('.navlinks');
    if (nav && !nav.querySelector('[data-selector-nav]')) {
      const demo = document.createElement('button');
      demo.type = 'button';
      demo.className = 'selector-nav-link';
      demo.dataset.selectorNav = 'demo';
      demo.textContent = '3-Minute Demo';
      demo.addEventListener('click', () => open(0));
      nav.appendChild(demo);

      const research = document.createElement('button');
      research.type = 'button';
      research.className = 'selector-nav-link';
      research.dataset.selectorNav = 'research';
      research.textContent = 'Research';
      research.addEventListener('click', () => open(8));
      nav.appendChild(research);
    }

    const statusHead = document.querySelector('#status .head');
    if (statusHead && !document.getElementById('selectorResearchFromPage')) {
      const action = document.createElement('button');
      action.id = 'selectorResearchFromPage';
      action.type = 'button';
      action.className = 'btn primary';
      action.textContent = 'Explore Research in 3-Minute Demo';
      action.style.marginTop = '12px';
      action.addEventListener('click', () => open(8));
      statusHead.appendChild(action);
    }
  }

  function install() {
    ensureShell();
    simplifyLanding();

    document.querySelectorAll('[data-open-selector]').forEach(el => {
      el.addEventListener('click', () => open(Number(el.dataset.openSelector || 0)));
    });

    const params = new URLSearchParams(location.search);
    const shouldAutoOpen = params.get('sih') === 'selector' || location.hash === '#selector-demo';
    if (shouldAutoOpen) setTimeout(() => open(0), 250);
  }

  window.SanPaidSelectorMode = { open, close, go };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, {once:true});
  } else {
    install();
  }
})();