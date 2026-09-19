# Claude Main Page Handoff — Part 1 of 3

## Project
SanPaid / YUKTI-2026
Live page: https://sahkriya.vercel.app/
Repository: https://github.com/harshtotawar14/YUKTI-2026

## Your task
Redesign ONLY the public main/landing page to a premium, modern, highly polished SIH-level experience while preserving all current functionality.

## Non-negotiable rules
- Do not rebuild or replace the backend, database, authentication, dashboards, role flows, APIs, or business logic.
- Stay compatible with the existing plain HTML/CSS/JS architecture.
- Preserve all functional IDs, data-* attributes, anchors, accessibility relationships and selectors unless every dependent reference is safely updated.
- Do not break Customer, Worker, Cooperative Admin, Federation Admin, platform-tour, eligibility/ranking demo, evidence links, mobile navigation, or connected-workspace launches.
- You may shorten/reorganize copy, but do not invent metrics, approvals, government endorsement, measured pilot impact, live AI capabilities or production integrations.
- Mobile-first is critical.
- Keep performance strong and accessibility intact.
- Avoid generic AI-template visuals, excessive gradients, glassmorphism, random neon, too many cards, duplicate CTAs, or decorative animation with no explanatory value.
- Keep the core SanPaid story obvious immediately: cooperative-owned local workforce network, verified service flow, Cooperative Capacity Exchange, Demand-to-Workforce Loop, and field evidence.
- Do not convert to React/Next.js.

## Design target
Create stronger visual hierarchy, premium typography, clean spacing, a memorable hero, clearer one-glance explanation, subtle depth/motion, polished micro-interactions, cohesive color system, excellent mobile responsiveness, and credible civic-tech/product-grade presentation.

Use restrained 3D/depth or network animation only when it helps explain the system.

## Workflow
1. Audit these files first for duplicate/conflicting styles and weak hierarchy.
2. Design the new visual system.
3. Then write production-ready replacement code.
4. Keep interactions compatible with Parts 2 and 3.
5. When all 3 parts are provided, return:
   - concise diagnosis
   - proposed visual system
   - exact files changed
   - complete replacement code for each changed file
   - regression checklist confirming existing interactions still work

Do not start final implementation until you have read Parts 1, 2 and 3.

## Files in this part
- index.html
- design-tokens.css
- styles.css
- mobile.css
- dossier-redesign.css


---

## FILE: `index.html`

```html
<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="SanPaid is a cooperative-owned local workforce network for verified services, fair worker opportunity and data-driven cooperative planning.">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="application-name" content="SanPaid">
<meta name="theme-color" content="#F5F8FC">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<title>SanPaid — Cooperative Workforce Network</title>
<link rel="canonical" href="https://sahkriya.vercel.app/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SanPaid">
<meta property="og:title" content="SanPaid — Cooperative Workforce Network">
<meta property="og:description" content="Verified local services, fair worker opportunity and accountable cooperative operations in one connected platform.">
<meta property="og:url" content="https://sahkriya.vercel.app/">
<meta property="og:image" content="https://sahkriya.vercel.app/social-preview.svg">
<meta property="og:image:alt" content="SanPaid cooperative workforce network">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SanPaid — Cooperative Workforce Network">
<meta name="twitter:description" content="A connected platform for trusted local services, fair work allocation and cooperative capacity planning.">
<meta name="twitter:image" content="https://sahkriya.vercel.app/social-preview.svg">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="app-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="app-icon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" id="sanpaidDesignTokens" href="design-tokens.css">
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="mobile.css">
<link rel="stylesheet" href="connected-demo.css">
<link rel="stylesheet" href="judge-demo.css">
<link rel="stylesheet" href="selector-mode.css">
<link rel="stylesheet" id="sanpaidDossierRedesignStyles" href="dossier-redesign.css">
</head>
<body>
<a class="skip-link" href="#mainContent">Skip to main content</a>
<div id="landing">
  <nav class="nav eval-nav" aria-label="SanPaid navigation">
    <div class="wrap navin">
      <a class="brand" href="#home" aria-label="SanPaid home">San<span>Paid</span></a>
      <div class="navlinks">
        <a href="#how">How it works</a>
        <a href="#difference">Why SanPaid</a>
        <a href="#evidence">Field proof</a>
        <a href="#operatingModel">Roles</a>
      </div>
      <div class="actions">
        <button class="btn primary desktop-only" id="getStarted" type="button">OPEN PLATFORM</button>
        <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileDrawer">☰</button>
      </div>
    </div>
    <div id="mobileDrawer" class="mobile-drawer hidden" aria-hidden="true">
      <a href="#how">How it works</a>
      <a href="#difference">Why SanPaid</a>
      <a href="#evidence">Field proof</a>
      <a href="#operatingModel">Roles</a>
      <button type="button" class="btn primary" id="spMobileAccess">OPEN PLATFORM</button>
      <button type="button" class="btn secondary" data-open-selector="0">PLATFORM TOUR</button>
    </div>
  </nav>

  <header class="hero eval-hero" id="home">
    <div class="wrap eval-hero-grid">
      <div class="eval-hero-copy" data-reveal>
        <span class="eyebrow eval-badge">Cooperative-owned local workforce network</span>
        <h1>Cooperative services.<br><em>Connected locally.</em><br>Managed intelligently.</h1>
        <p class="lead"><b>Not another worker-listing app.</b> SanPaid connects customers with verified cooperative workers and gives cooperatives one accountable system to manage service capacity.</p>
        <div class="hero-ctas">
          <button class="btn primary eval-primary" type="button" data-platform-access>OPEN PLATFORM</button>
          <button class="btn secondary eval-secondary" id="heroTourCta" type="button" data-open-selector="0">SEE PLATFORM TOUR</button>
        </div>
        <div class="hero-assurance" aria-label="SanPaid operating principles">
          <span>Verified workers</span><span>Worker choice</span><span>Transparent billing</span>
        </div>
        <div class="hero-usp-row" aria-label="SanPaid core differentiators">
          <article class="hero-usp"><small>USP 01 · SERVE TODAY</small><b>Cooperative Capacity Exchange</b></article>
          <article class="hero-usp"><small>USP 02 · PREPARE TOMORROW</small><b>Demand-to-Workforce Loop</b></article>
        </div>
      </div>

      <aside class="network-visual" id="evalHeroSystem" aria-label="Customer to cooperative network to verified worker" data-reveal>
        <div class="network-visual-head"><span>Local service network</span><b>Accountable by design</b></div>
        <div class="network-route" aria-hidden="true">
          <article class="network-node customer-node"><small>01</small><span>Customer</span><b>Requests service</b></article>
          <i><span></span></i>
          <article class="network-node network-node-core"><small>02</small><span>Cooperative network</span><b>Verifies + matches</b></article>
          <i><span></span></i>
          <article class="network-node worker-node"><small>03</small><span>Verified worker</span><b>Accepts + delivers</b></article>
        </div>
        <div class="network-signal"><span class="signal-dot"></span><p><b>Every outcome returns as a demand signal.</b><br>Service records help cooperatives prepare future capacity.</p></div>
      </aside>
    </div>
    <div class="hero-proof-strip" aria-label="Validation summary">
      <div class="wrap">
        <b>Stakeholder-informed design · Kolhapur</b>
        <span>~50-minute stakeholder discussion</span>
        <span>Signed &amp; stamped acknowledgement</span>
        <span>5 findings mapped to product controls</span>
        <a href="https://youtu.be/NMOKz8rl-LQ" target="_blank" rel="noopener">View evidence ↗</a>
      </div>
    </div>
  </header>

  <main id="mainContent" tabindex="-1">
    <section class="section flow-section" id="how">
      <div class="wrap">
        <div class="section-intro" data-reveal><span class="tag">How SanPaid works</span><h2>One request. One trusted service record.</h2><p>From discovery to payment, every important decision stays visible to the customer, worker and cooperative.</p></div>
        <ol class="service-flow" data-reveal>
          <li><span>01</span><b>Request</b><small>Service + location + time</small></li>
          <li><span>02</span><b>Check eligibility</b><small>Skill + documents + availability</small></li>
          <li><span>03</span><b>Rank fairly</b><small>Explainable suitability factors</small></li>
          <li><span>04</span><b>Worker chooses</b><small>Accept or decline without penalty</small></li>
          <li><span>05</span><b>Verify service</b><small>Booking-linked OTP / QR start</small></li>
          <li><span>06</span><b>Complete &amp; record</b><small>Bill + payment + rating + audit</small></li>
        </ol>
        <div class="flow-rule" data-reveal><b>Eligibility first.</b><span>Fair ranking second.</span><span>Worker choice always.</span></div>
      </div>
    </section>

    <section class="section difference-section" id="difference">
      <div class="wrap">
        <div class="section-intro" data-reveal><span class="tag">Why SanPaid</span><h2>Beyond booking: manage today and prepare tomorrow.</h2><p>Two connected systems make SanPaid different from a standard worker-listing marketplace.</p></div>
        <div class="difference-grid">
          <article class="difference-card capacity-card" id="capacity" data-reveal>
            <div class="difference-top"><span>01</span><small>Cooperative Capacity Exchange</small></div>
            <h3>Local capacity first. Network support when needed.</h3>
            <p>If suitable local capacity is low, another cooperative can offer verified support—with worker consent, authorized approval and recorded responsibility.</p>
            <div class="capacity-mini" aria-label="Capacity exchange flow"><span>Local gap</span><i>→</i><span>Worker consent</span><i>→</i><span>Authorized support</span></div>
            <div class="difference-actions"><button class="text-action" id="evalCapacityAction" type="button">Check exchange logic</button><button class="text-action secondary-action" id="evalCapacityConnected" type="button">View walkthrough</button></div>
            <div class="eval-worker-message" id="evalCapacityStatus" hidden></div>
          </article>
          <article class="difference-card demand-card" id="demandLoop" data-reveal>
            <div class="difference-top"><span>02</span><small>Demand-to-Workforce Loop</small></div>
            <h3>Serve today. Prepare tomorrow.</h3>
            <p>Completed services and unmet requests become skill-wise demand signals. Human-reviewed forecasting supports training, onboarding and capacity decisions.</p>
            <div class="demand-mini" aria-label="Demand planning loop"><span>Service signals</span><i>→</i><span>Skill demand</span><i>→</i><span>Cooperative action</span></div>
            <div class="human-review-note"><b>Human-reviewed AI</b><span>No automatic workforce action.</span></div>
          </article>
        </div>
      </div>
    </section>

    <section class="section proof-section" id="evidence">
      <div class="wrap proof-layout">
        <div class="proof-story" data-reveal>
          <span class="tag">Field proof</span>
          <h2>Real operational pain points shaped the product.</h2>
          <p>A recorded cooperative stakeholder interaction surfaced the need for trusted discovery, transparent pricing, digital traceability, welfare visibility and stronger home-service safety.</p>
          <div class="proof-facts">
            <div><strong>~50 min</strong><span>Recorded discussion</span></div>
            <div><strong>5</strong><span>Validated priorities</span></div>
            <div><strong>4</strong><span>Evidence artifacts</span></div>
          </div>
          <a class="evidence-link" href="https://youtu.be/NMOKz8rl-LQ" target="_blank" rel="noopener">Watch stakeholder evidence <span>↗</span></a>
        </div>
        <div class="decision-map" data-reveal>
          <div class="decision-map-head"><span>Finding</span><span>SanPaid decision</span></div>
          <article><div><b>01</b><p>Nearby reliable workers are hard to discover.</p></div><strong>Verified local eligibility and fair ranking</strong></article>
          <article><div><b>02</b><p>Quotes and service records lack transparency.</p></div><strong>Approved estimates, invoices and audit history</strong></article>
          <article><div><b>03</b><p>Unknown workers entering homes need stronger trust.</p></div><strong>Verified profile plus OTP / QR service start</strong></article>
          <article><div><b>04</b><p>Insurance and welfare visibility is uneven.</p></div><strong>Digital Service Passport with welfare status</strong></article>
          <small>Qualitative field validation—not Government approval or measured pilot impact.</small>
        </div>
      </div>
    </section>

    <section class="section trust-section" id="connectedDemoSection">
      <div class="wrap">
        <div class="section-intro" data-reveal><span class="tag">Trust built into the flow</span><h2>Controls appear where they matter.</h2><p>SanPaid connects verification, service delivery, billing and complaint ownership instead of treating trust as a profile badge.</p></div>
        <div class="trust-control-grid" data-reveal>
          <article><span>✓</span><div><b>Verified cooperative workers</b><p>Identity, association and skill evidence are reviewed.</p></div></article>
          <article><span>✓</span><div><b>OTP / QR service start</b><p>The customer confirms the booked worker before work begins.</p></div></article>
          <article><span>✓</span><div><b>Transparent billing</b><p>New cost requires fresh approval before the final invoice.</p></div></article>
          <article><span>✓</span><div><b>Digital Service Passport</b><p>Skills, ratings, incidents and welfare status stay traceable.</p></div></article>
          <article><span>✓</span><div><b>Complaints + SLA</b><p>Ownership, evidence, escalation and closure remain recorded.</p></div></article>
          <article><span>✓</span><div><b>Role-based audit trail</b><p>Operational actions stay attributable and reviewable.</p></div></article>
        </div>
      </div>
    </section>

    <section class="section live-proof-section" id="matching">
      <div class="wrap">
        <div class="section-intro" data-reveal><span class="tag">Working policy proof</span><h2>See eligibility and fair ranking in action.</h2><p>This explanatory scenario mirrors the connected assignment policy without claiming live Maps distance or a real booking.</p></div>
        <div class="eval-match" data-reveal>
          <div class="eval-request-bar">
            <div class="eval-request-item"><small>Service</small><b>Electrician</b><span>Example request</span></div>
            <div class="eval-request-item"><small>Policy</small><b>Verified · Skilled · Available</b><span>Eligibility before ranking</span></div>
            <div class="eval-request-item eval-radius-control"><small>Scenario radius</small><select id="evalRadius" aria-label="Explanatory scenario radius"><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="20" selected>20 km</option><option value="30">30 km</option></select><span>Configurable policy example</span></div>
          </div>
          <div class="eval-radius-copy">Distances shown here are controlled scenario values. The connected platform applies the same eligibility-first decision sequence.</div>
          <div class="eval-proof-body">
            <div class="eval-proof-panel">
              <div class="eval-panel-heading"><div><small>STEP 1</small><h3>Eligibility gate</h3></div><span id="evalEligibilityBadge">WAITING</span></div>
              <div class="eval-stage-summary" id="evalEligibilitySummary"><span>5 candidates</span><i>→</i><span>Run check</span></div>
              <div class="eval-candidate-list" id="evalCandidateList" aria-live="polite"></div>
            </div>
            <div class="eval-proof-panel">
              <div class="eval-panel-heading"><div><small>STEP 2–3</small><h3>Fair ranking → worker choice</h3></div><span id="evalRankingBadge">LOCKED</span></div>
              <div class="eval-ranking-list" id="evalRankingList" aria-live="polite"></div>
              <div id="evalOfferRoot" aria-live="polite"></div>
              <div class="eval-worker-message" id="evalWorkerMessage" hidden></div>
              <div class="eval-audit-head"><small>Audit outcome</small><span>Reason-coded explanatory trail</span></div>
              <div class="eval-audit" id="evalAudit" aria-live="polite"></div>
            </div>
          </div>
          <div class="eval-actions-row">
            <button class="btn primary" id="runMatchBtn" type="button">Run Eligibility Check</button>
            <button class="btn secondary" id="evalRunRanking" type="button" disabled>Run Fair Ranking</button>
            <button class="btn tertiary" id="evalResetMatch" type="button">Reset</button>
            <span id="evalMatchState" class="eval-demo-truth">EXPLANATORY SCENARIO · NOT A LIVE ASSIGNMENT</span>
          </div>
        </div>
        <div class="live-proof-bridge" data-reveal><div><b>Ready to explore the connected workflow?</b><span>Open the customer workspace to create and follow a service request.</span></div><button class="btn primary" id="evalOpenConnected" type="button">Open Customer Workspace</button></div>
        <div id="matchResults" hidden></div>
      </div>
    </section>

    <section class="section roles-section" id="operatingModel">
      <div class="wrap">
        <div class="section-intro" data-reveal><span class="tag">One platform · four clear roles</span><h2>Every role sees the work it owns.</h2><p>Customer service, worker delivery and cooperative governance stay connected without mixing authority.</p></div>
        <div class="role-grid" data-reveal>
          <article><span class="role-mark">CU</span><h3>Customer</h3><p>Request, approve, verify, pay and review a trusted local service.</p><button type="button" data-open-connected="CUSTOMER">Open customer workspace</button></article>
          <article><span class="role-mark">WK</span><h3>Worker</h3><p>Manage availability, accept work, deliver service and build a verified record.</p><button type="button" data-open-connected="WORKER_A">Open worker workspace</button></article>
          <article><span class="role-mark">CA</span><h3>Cooperative Admin</h3><p>Verify workers, manage local services, complaints, SLA and capacity.</p><button type="button" data-judge-role="COOPERATIVE_ADMIN">Open cooperative workspace</button></article>
          <article><span class="role-mark">FA</span><h3>Federation Admin</h3><p>Coordinate network capacity, policy, regional demand and escalations.</p><button type="button" data-judge-role="FEDERATION_ADMIN">Open federation workspace</button></article>
        </div>
        <div class="role-action" data-reveal><button class="btn secondary" id="evalAdminPrototype" type="button" data-eval-open-admin>View Administration Workspaces</button></div>
      </div>
    </section>

    <section class="section outcome-section" id="impact">
      <div class="wrap">
        <div class="section-intro" data-reveal><span class="tag">Pilot outcomes to measure</span><h2>Better service access. Stronger workforce readiness.</h2><p>SanPaid does not claim impact before a pilot. It defines the outcomes that cooperatives should measure.</p></div>
        <div class="outcome-grid" data-reveal>
          <article><span>01</span><b>Faster verified discovery</b><p>Time to first eligible worker and fulfilment rate.</p></article>
          <article><span>02</span><b>Better access to local work opportunities</b><p>Opportunity distribution across eligible active workers.</p></article>
          <article><span>03</span><b>Traceable service delivery</b><p>Verification, billing and complaint-resolution records.</p></article>
          <article><span>04</span><b>Workforce preparation</b><p>Skill-wise capacity gaps reviewed for training or onboarding.</p></article>
        </div>
        <div class="pilot-sequence" data-reveal><span>Baseline</span><i>→</i><span>Pilot</span><i>→</i><span>Measure KPIs</span><i>→</i><span>Validate Impact</span></div>
      </div>
    </section>

    <section class="section architecture-section" id="architecture">
      <div class="wrap architecture-card" data-reveal>
        <div><span class="tag">Connected and accountable</span><h2>One record from request to outcome.</h2><p>Role-based access, PostgreSQL-backed operations and audit history keep service, payment, complaint and capacity decisions connected.</p></div>
        <div class="architecture-line" aria-label="SanPaid connected architecture"><span>People</span><i>→</i><span>Service workflow</span><i>→</i><span>Role controls</span><i>→</i><span>PostgreSQL + audit</span></div>
        <button class="text-action" id="evalResearch" type="button">View full architecture &amp; research</button>
      </div>
    </section>

    <section class="section scope-section" id="status">
      <div class="wrap scope-bar" data-reveal><b>IMPLEMENTED IN CURRENT BUILD</b><span>Connected source and controlled sandbox functions are separated from future production integrations and pilot impact claims.</span></div>
    </section>

    <section class="final-cta" aria-label="Open SanPaid platform">
      <div class="wrap" data-reveal>
        <span class="tag">Serve today · prepare tomorrow</span>
        <h2>Turn local workforce capacity into a trusted cooperative network.</h2>
        <p>Explore the working role flows and see how one service record supports delivery, governance and planning.</p>
        <div class="final-actions"><button class="btn primary" id="evalFinalPrototype" type="button" data-platform-access>OPEN PLATFORM</button><button class="btn secondary" id="evalFinalArchitecture" type="button">VIEW ARCHITECTURE</button></div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="wrap footer-grid">
      <div><div class="brand">San<span>Paid</span></div><p>Cooperative-owned local workforce network.</p></div>
      <div><b>Core journey</b><p>Request → eligibility → fair ranking → worker choice → verified delivery → billing → audit.</p></div>
      <div><b>Evidence boundary</b><p>Field research validates direction. Pilot KPIs will validate measured impact.</p></div>
    </div>
  </footer>
</div>

<div id="toastWrap" class="toast-wrap"></div>
<script src="app.js"></script>
<script src="mobile.js"></script>
<script src="connected-demo.js"></script>
<script src="connected-service-ui.js"></script>
<script src="connected-commerce-ui.js"></script>
<script src="connected-runtime-fix.js"></script>
<script src="capacity-worker-ui.js"></script>
<script src="judge-demo.js"></script>
<script src="selector-mode.js"></script>
<script src="top1-polish.js"></script>
<script src="evaluator-final.js"></script>
</body>
</html>

```


---

## FILE: `design-tokens.css`

```css
/* SanPaid Design System v5 — canonical color system for landing, auth and role workspaces.
   Deep navy + teal + neutral surfaces + controlled semantic status colors. */
:root{
  --sp-ink:#0B1F33;
  --sp-ink-2:#12344D;
  --sp-ink-3:#1A405B;
  --sp-teal:#0F766E;
  --sp-teal-2:#0D9488;
  --sp-cyan:#4BB8AF;
  --sp-blue:#316B9A;
  --sp-amber:#A96813;
  --sp-green:#167A5B;
  --sp-red:#B24646;
  --sp-future:#667784;

  --sp-bg:#F6F8FA;
  --sp-bg-soft:#F0F4F5;
  --sp-surface:#FFFFFF;
  --sp-surface-solid:#FFFFFF;
  --sp-surface-2:#F0F4F5;
  --sp-text:#10283A;
  --sp-text-2:#506676;
  --sp-muted:#6B7D89;
  --sp-border:#DCE5E9;
  --sp-border-strong:#CBD8DE;
  --sp-focus:#0D9488;

  --sp-success-bg:#EAF7F1;
  --sp-success-border:#BFE4D4;
  --sp-warning-bg:#FFF6E5;
  --sp-warning-border:#EED29D;
  --sp-error-bg:#FDF0F0;
  --sp-error-border:#EAC1C1;
  --sp-future-bg:#F0F3F5;
  --sp-future-border:#D5DDE2;
  --sp-soft-teal:#E8F5F2;

  --sp-font-display:"Space Grotesk","Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --sp-font-body:"Inter",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;

  --sp-fs-xs:.75rem;
  --sp-fs-sm:.875rem;
  --sp-fs-md:1rem;
  --sp-fs-lg:1.125rem;
  --sp-fs-xl:1.375rem;
  --sp-fs-2xl:clamp(2.25rem,4vw,3rem);
  --sp-fs-hero:clamp(2.75rem,6vw,4.75rem);

  --sp-space-1:4px;
  --sp-space-2:8px;
  --sp-space-3:12px;
  --sp-space-4:16px;
  --sp-space-5:24px;
  --sp-space-6:32px;
  --sp-space-7:48px;
  --sp-space-8:64px;
  --sp-space-9:80px;
  --sp-space-10:96px;

  --sp-radius-sm:8px;
  --sp-radius-md:12px;
  --sp-radius-lg:20px;
  --sp-radius-xl:28px;
  --sp-pill:999px;

  --sp-shadow-sm:0 8px 24px rgba(11,31,51,.055);
  --sp-shadow-md:0 18px 44px rgba(11,31,51,.085);
  --sp-shadow-lg:0 28px 70px rgba(11,31,51,.12);
  --sp-shadow-focus:0 0 0 4px rgba(13,148,136,.16);

  --sp-ease:cubic-bezier(.2,.75,.2,1);
  --sp-fast:180ms;
  --sp-med:300ms;
  --sp-slow:400ms;

  /* Canonical semantic aliases. */
  --color-bg:var(--sp-bg);
  --color-surface:var(--sp-surface);
  --color-text:var(--sp-text);
  --color-muted:var(--sp-muted);
  --color-primary:var(--sp-teal-2);
  --color-success:var(--sp-green);
  --color-warning:var(--sp-amber);
  --color-danger:var(--sp-red);
  --color-border:var(--sp-border);

  /* Compatibility bridge: older components inherit the canonical palette. */
  --navy:var(--sp-ink);
  --navy2:var(--sp-ink-2);
  --navy3:var(--sp-ink-3);
  --green:var(--sp-teal);
  --green2:var(--sp-teal-2);
  --soft:var(--sp-bg);
  --line:var(--sp-border);
  --text:var(--sp-text);
  --muted:var(--sp-muted);
  --warn:var(--sp-amber);
  --danger:var(--sp-red);
  --purple:var(--sp-blue);
  --white:var(--sp-surface-solid);
  --shadow:var(--sp-shadow-sm);
  --r:var(--sp-radius-md);
}

html[data-sanpaid-theme="dark"]{
  color-scheme:dark;
  --sp-bg:#07131F;
  --sp-bg-soft:#0B1C29;
  --sp-surface:#0D2030;
  --sp-surface-solid:#0D2030;
  --sp-surface-2:#102A3C;
  --sp-text:#ECF5F8;
  --sp-text-2:#C5D6DE;
  --sp-muted:#AAC0CB;
  --sp-border:#294556;
  --sp-border-strong:#365669;
  --sp-teal:#4BC6BA;
  --sp-teal-2:#42BBAF;
  --sp-cyan:#65D1C7;
  --sp-blue:#72A5CC;
  --sp-green:#58C79B;
  --sp-amber:#E0A652;
  --sp-red:#E37777;
  --sp-future:#A9BAC3;
  --sp-soft-teal:rgba(75,198,186,.10);
  --sp-success-bg:rgba(88,199,155,.10);
  --sp-success-border:rgba(88,199,155,.26);
  --sp-warning-bg:rgba(224,166,82,.10);
  --sp-warning-border:rgba(224,166,82,.28);
  --sp-error-bg:rgba(227,119,119,.10);
  --sp-error-border:rgba(227,119,119,.28);
  --sp-future-bg:rgba(169,186,195,.08);
  --sp-future-border:rgba(169,186,195,.22);
  --sp-shadow-sm:0 8px 24px rgba(0,0,0,.18);
  --sp-shadow-md:0 18px 44px rgba(0,0,0,.25);
  --sp-shadow-lg:0 28px 70px rgba(0,0,0,.34);
}

*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sp-font-body);background:var(--sp-bg);color:var(--sp-text);text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased}
h1,h2,h3,.brand{font-family:var(--sp-font-display)}
button,input,select,textarea{font:inherit}

:focus-visible{
  outline:2px solid var(--sp-focus)!important;
  outline-offset:3px!important;
  box-shadow:var(--sp-shadow-focus);
}

@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto!important}
  *,*::before,*::after{
    animation-duration:.01ms!important;
    animation-iteration-count:1!important;
    transition-duration:.01ms!important;
    scroll-behavior:auto!important;
  }
}

```


---

## FILE: `styles.css`

```css
:root{--navy:#0b1930;--navy2:#102847;--navy3:#183b66;--green:#20a66a;--green2:#2bc27b;--soft:#f5f8fb;--line:#dce5ef;--text:#14233d;--muted:#687990;--warn:#e6952e;--danger:#d84c4c;--purple:#7367d8;--white:#fff;--shadow:0 18px 45px -25px rgba(11,25,48,.35);--r:16px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:var(--soft);color:var(--text)}button,input,select,textarea{font:inherit}button,a{touch-action:manipulation}.hidden{display:none!important}.wrap{max-width:1180px;margin:auto;padding:0 22px}.ribbon{background:#071426;color:#bfead4;padding:8px 12px;text-align:center;font-size:12px}.nav{position:sticky;top:0;z-index:60;background:rgba(11,25,48,.96);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08)}.navin{height:70px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{font-weight:800;color:#fff;font-size:20px;letter-spacing:.2px}.brand span{color:var(--green2)}.navlinks{display:flex;gap:24px}.navlinks a{color:#c9d5e4;text-decoration:none;font-size:14px}.navlinks a:hover{color:#fff}.actions{display:flex;gap:10px;align-items:center}.btn{border:0;border-radius:999px;padding:11px 18px;font-weight:700;cursor:pointer;transition:.2s;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}.btn:hover{transform:translateY(-1px)}.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}.primary{background:var(--green);color:#fff}.secondary{background:#fff;color:var(--navy);border:1px solid var(--line)}.ghost{background:rgba(255,255,255,.09);color:#fff;border:1px solid rgba(255,255,255,.18)}.danger{background:var(--danger);color:#fff}.small{padding:8px 12px;font-size:12px}.menu-btn{display:none;background:transparent;border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:10px;padding:8px 10px}.hero{background:radial-gradient(900px 550px at 80% 10%,rgba(43,194,123,.16),transparent 60%),linear-gradient(135deg,var(--navy2),var(--navy));color:#fff;padding:86px 0 72px}.hero-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:50px;align-items:center}.eyebrow{display:inline-block;color:#9fe2bf;border:1px solid rgba(43,194,123,.35);background:rgba(43,194,123,.11);padding:7px 12px;border-radius:999px;font-size:12px;font-weight:700}.hero h1{font-size:clamp(38px,5vw,62px);line-height:1.04;margin:20px 0 18px}.hero h1 em{font-style:normal;color:#91e2b8}.lead{color:#c6d2e2;max-width:650px;line-height:1.7}.hero-ctas{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0}.searchbox{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;padding:16px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:rgba(255,255,255,.06)}.searchbox select,.searchbox input{width:100%;background:#0e2340;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:12px}.loop-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:28px}.loop{display:grid;gap:12px}.loop-step{padding:13px 15px;border-radius:12px;background:rgba(255,255,255,.06);color:#bdcada;border-left:3px solid rgba(255,255,255,.15)}.loop-step.active{border-left-color:var(--green2);background:rgba(43,194,123,.13);color:#fff}.trust{background:#081629;color:#c8d4e2}.trustin{display:flex;gap:28px;justify-content:space-between;flex-wrap:wrap;padding-top:21px;padding-bottom:21px}.trust span{font-size:13px}.section{padding:82px 0}.section.white{background:#fff}.head{max-width:720px;margin-bottom:34px}.head .tag{color:var(--green);font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.07em}.head h2{font-size:clamp(28px,4vw,42px);margin:8px 0 12px;color:var(--navy2)}.head p{color:var(--muted);line-height:1.7}.problem-grid,.benefit-grid,.service-grid,.kpis,.dashboard-grid{display:grid;gap:16px}.problem-grid{grid-template-columns:repeat(3,1fr)}.benefit-grid{grid-template-columns:repeat(4,1fr)}.service-grid{grid-template-columns:repeat(5,1fr)}.card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:20px;box-shadow:var(--shadow)}.problem-card{border-left:4px solid var(--warn)}.card h3,.card h4{margin:0 0 8px}.card p{color:var(--muted);line-height:1.55;margin:0}.service-card{cursor:pointer;text-align:center;transition:.2s;min-height:142px;display:flex;flex-direction:column;justify-content:center}.service-card:hover,.service-card:focus{transform:translateY(-4px);border-color:#a8d9c0;outline:none}.service-card.selected{border:2px solid var(--green);background:#effbf5}.service-icon{font-size:28px;margin-bottom:8px}.price{font-size:12px;color:var(--muted)}.match{background:var(--navy2);color:#fff;border-radius:22px;padding:28px}.match-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:24px}.muted-light{color:#b9c7d9;line-height:1.6}.match-results{display:grid;gap:10px}.worker-row{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:14px}.worker-row.top{border-color:var(--green2);background:rgba(43,194,123,.11)}.worker-top{display:flex;justify-content:space-between;gap:10px}.score{color:#75dda8;font-weight:800}.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.chip{font-size:11px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.08);color:#c9d5e4}.timeline{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}.tstep{background:#fff;border:1px solid var(--line);padding:16px;border-radius:13px}.tstep b{display:block;color:var(--green);margin-bottom:7px}.status-table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden}.status-table th,.status-table td{padding:13px;border-bottom:1px solid var(--line);text-align:left;font-size:13px}.badge{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}.b-green{background:#e6f8ef;color:#178352}.b-orange{background:#fff0dc;color:#b36a12}.b-purple{background:#eeeafd;color:#6256c7}.b-gray{background:#edf1f5;color:#607186}.footer{background:#071426;color:#8090a8;padding:42px 0}.footer a{color:#aebbd0}.modal-backdrop{position:fixed;inset:0;background:rgba(5,15,28,.68);z-index:100;display:flex;align-items:center;justify-content:center;padding:18px}.modal{background:#fff;width:min(720px,100%);max-height:92vh;overflow:auto;border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.35)}.modal.wide{width:min(1040px,100%)}.modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--line)}.modal-head h2{margin:0;font-size:21px}.close{border:0;background:#eef2f6;width:36px;height:36px;border-radius:50%;cursor:pointer}.modal-body{padding:22px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.field{display:grid;gap:6px}.field.full{grid-column:1/-1}.field label{font-size:12px;font-weight:800;color:#52647c}.field input,.field select,.field textarea{border:1px solid #cfd9e4;border-radius:10px;padding:11px;background:#fff;color:var(--text)}.field textarea{min-height:100px;resize:vertical}.field input:focus,.field select:focus,.field textarea:focus{outline:2px solid rgba(32,166,106,.22);border-color:var(--green)}.error{color:var(--danger);font-size:12px;min-height:16px}.modal-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.roles{display:grid;grid-template-columns:1fr 1fr;gap:12px}.role-card{border:1px solid var(--line);border-radius:14px;padding:18px;background:#fff;cursor:pointer;text-align:left}.role-card:hover{border-color:var(--green);background:#f2fbf7}.app-shell{min-height:100vh;background:#eef3f8}.app-top{height:68px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 22px;position:sticky;top:0;z-index:40}.app-main{display:grid;grid-template-columns:250px 1fr;min-height:calc(100vh - 68px)}.side{background:#fff;border-right:1px solid var(--line);padding:18px 12px}.side button{width:100%;text-align:left;border:0;background:transparent;padding:11px 12px;border-radius:9px;color:#52647c;cursor:pointer;margin-bottom:4px}.side button:hover,.side button.active{background:#eaf8f1;color:#11784c;font-weight:800}.content{padding:28px}.content h1{margin-top:0;color:var(--navy2)}.kpis{grid-template-columns:repeat(4,1fr);margin-bottom:18px}.kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px}.kpi .n{font-size:28px;font-weight:900;color:var(--navy2)}.kpi .l{font-size:12px;color:var(--muted);margin-top:4px}.panel{background:#fff;border:1px solid var(--line);border-radius:15px;padding:18px;margin-bottom:18px}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}.panel h3{margin:0}.list{display:grid;gap:10px}.list-item{border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;justify-content:space-between;gap:14px;align-items:center}.list-item .meta{color:var(--muted);font-size:12px;margin-top:4px}.statusline{display:flex;gap:8px;flex-wrap:wrap}.progress{height:8px;background:#e9eef4;border-radius:999px;overflow:hidden}.progress>span{display:block;height:100%;background:var(--green)}.booking-timeline{display:grid;gap:8px}.booking-timeline .row{display:flex;gap:12px;align-items:flex-start;padding:8px 0}.dot{width:12px;height:12px;border-radius:50%;background:#d5dee8;margin-top:4px}.row.done .dot{background:var(--green)}.row.current .dot{box-shadow:0 0 0 5px rgba(32,166,106,.18);background:var(--green)}.toast-wrap{position:fixed;right:18px;bottom:18px;z-index:200;display:grid;gap:10px}.toast{background:#0f2545;color:#fff;padding:12px 15px;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.25);min-width:240px}.toast.success{border-left:4px solid var(--green2)}.toast.error{border-left:4px solid var(--danger)}.toast.warn{border-left:4px solid var(--warn)}.demo-note{background:#fff6e9;border:1px solid #f3d2a2;border-radius:12px;padding:12px;color:#8a5b1d;font-size:12px}.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:15px}.tabs button{border:1px solid var(--line);background:#fff;padding:8px 12px;border-radius:9px;cursor:pointer}.tabs button.active{background:var(--navy2);color:#fff}.qr{width:170px;height:170px;margin:12px auto;background:repeating-linear-gradient(45deg,#0b1930 0 8px,#fff 8px 16px),repeating-linear-gradient(-45deg,transparent 0 12px,#0b1930 12px 20px);border:10px solid #fff;box-shadow:0 0 0 1px var(--line);display:grid;place-items:center;color:#fff;font-weight:800;text-align:center;font-size:10px}.stars{display:flex;gap:6px}.stars button{font-size:28px;border:0;background:transparent;color:#d5dce5;cursor:pointer}.stars button.on{color:#f4b63f}.mobile-drawer{display:none}.empty{padding:24px;text-align:center;color:var(--muted);border:1px dashed #cbd6e2;border-radius:12px}.divider{height:1px;background:var(--line);margin:18px 0}@media(max-width:960px){.hero-grid,.match-grid{grid-template-columns:1fr}.service-grid{grid-template-columns:repeat(3,1fr)}.benefit-grid{grid-template-columns:repeat(2,1fr)}.problem-grid{grid-template-columns:1fr}.timeline{grid-template-columns:repeat(2,1fr)}.navlinks{display:none}.menu-btn{display:block}.app-main{grid-template-columns:1fr}.side{display:none}.kpis{grid-template-columns:repeat(2,1fr)}.mobile-drawer{display:block;position:fixed;inset:68px 0 auto 0;background:#fff;z-index:55;padding:15px;border-bottom:1px solid var(--line)}.mobile-drawer button,.mobile-drawer a{display:block;width:100%;padding:11px;border:0;background:transparent;text-align:left;text-decoration:none;color:var(--text)}}@media(max-width:640px){.hero{padding-top:58px}.searchbox,.form-grid{grid-template-columns:1fr}.service-grid{grid-template-columns:repeat(2,1fr)}.benefit-grid,.roles,.kpis{grid-template-columns:1fr}.actions .desktop-only{display:none}.timeline{grid-template-columns:1fr}.content{padding:18px}.modal-body{padding:17px}.trustin{gap:14px}.list-item{align-items:flex-start;flex-direction:column}.hero h1{font-size:40px}}
```


---

## FILE: `mobile.css`

```css
/* SanPaid mobile-first responsive system — shared public/app primitives. */
:root{
  --mobile-page:clamp(14px,4vw,22px);
  --mobile-nav-h:68px;
  --mobile-bottom-h:68px;
  --touch-min:44px;
}
html,body{max-width:100%;overflow-x:clip}
body{min-height:100dvh;-webkit-text-size-adjust:100%;text-size-adjust:100%}
img,svg,video,canvas{max-width:100%;height:auto}
button,input,select,textarea{max-width:100%;min-width:0}
button,a,input,select,textarea{touch-action:manipulation}
:is(h1,h2,h3,h4,p,span,b,strong,small,code,dd,dt,td,th){overflow-wrap:anywhere}
.card,.panel,.kpi,.list-item,.match,.loop-card,.worker-row,.voice-offer-panel{min-width:0;overflow-wrap:anywhere}
.btn,.menu-btn,.side button,.mobile-drawer button,.mobile-drawer a{min-height:var(--touch-min)}
.btn.small{min-height:42px;padding:9px 12px}
.status-table{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-inline:contain}
.status-table tbody,.status-table thead{min-width:720px;display:table;width:100%}
.app-shell{min-height:100dvh}
.app-main{min-height:calc(100dvh - 68px)}
.app-top{padding-left:max(14px,env(safe-area-inset-left));padding-right:max(14px,env(safe-area-inset-right))}
#appUser{min-width:0;max-width:min(40vw,360px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.content{min-width:0}
.modal{max-height:92dvh}
.modal-body,.modal-head{min-width:0}
.field input,.field select,.field textarea{width:100%}
.qr{max-width:70vw;max-height:70vw}
.mobile-drawer-scrim{position:fixed;inset:0;background:rgba(5,15,28,.48);z-index:35;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);pointer-events:auto}
.mobile-drawer-scrim.hidden{display:none!important;pointer-events:none!important}
body.mobile-drawer-open{overflow:hidden;overscroll-behavior:none}
.mobile-drawer .drawer-title{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 4px 12px;border-bottom:1px solid var(--line);margin-bottom:8px}
.mobile-drawer .drawer-title strong{font-size:15px;color:var(--navy2)}
.mobile-drawer .drawer-close{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:#eef3f8;color:var(--navy2);font-size:18px}
.mobile-drawer .drawer-section{padding:7px 0}
.mobile-drawer .drawer-label{padding:8px 10px 4px;color:var(--muted);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}
.mobile-drawer .drawer-action{display:flex!important;align-items:center;gap:10px!important;border-radius:11px!important;margin:2px 0!important;padding:12px!important}
.mobile-drawer .drawer-action.active{background:#eaf8f1!important;color:#11784c!important;font-weight:800}
.mobile-drawer .drawer-action.primary-mobile{background:var(--green)!important;color:#fff!important}
.mobile-drawer .drawer-action.danger-mobile{color:var(--danger)!important}
.mobile-bottom-nav{display:none}
.connection-banner{position:fixed;left:50%;transform:translateX(-50%);top:max(8px,env(safe-area-inset-top));z-index:250;max-width:calc(100% - 24px);padding:9px 13px;border-radius:999px;background:#0f2545;color:#fff;font-size:12px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.22)}
.connection-banner.offline{background:#7a4b0d}
.pwa-install-banner{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:230;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px;box-shadow:0 18px 45px rgba(11,25,48,.24);display:flex;gap:10px;align-items:center;justify-content:space-between}
.pwa-install-banner .pwa-copy{min-width:0}
.pwa-install-banner .pwa-copy b{display:block;color:var(--navy2)}
.pwa-install-banner .pwa-copy span{font-size:12px;color:var(--muted)}

@media(max-width:960px){
  .wrap{padding-left:var(--mobile-page);padding-right:var(--mobile-page)}
  .hero-grid,.match-grid{grid-template-columns:1fr}
  .hero-grid{gap:28px}
  .hero-grid>*{min-width:0}
  .searchbox{grid-template-columns:1fr!important}
  .searchbox select,.searchbox input,.searchbox .btn{min-height:48px}
  .navlinks{display:none}
  .menu-btn{display:inline-grid;place-items:center;min-width:44px;padding:8px}
  .app-main{grid-template-columns:1fr}
  .side{display:none}
  .content{padding:22px var(--mobile-page) calc(28px + env(safe-area-inset-bottom))}
  .mobile-drawer{display:block;position:fixed!important;top:var(--mobile-nav-h)!important;right:0!important;bottom:0!important;left:auto!important;width:min(88vw,360px)!important;height:calc(100dvh - var(--mobile-nav-h))!important;max-height:calc(100dvh - var(--mobile-nav-h))!important;background:#fff!important;z-index:110!important;padding:12px max(12px,env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) 12px!important;border:0!important;border-left:1px solid var(--line)!important;border-radius:18px 0 0 0!important;box-shadow:-20px 0 55px rgba(11,25,48,.22)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;pointer-events:auto}
  .mobile-drawer.hidden{display:none!important;pointer-events:none!important}
  .mobile-drawer button,.mobile-drawer a{font-size:14px;width:100%;text-align:left;border-radius:10px}
  .service-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .benefit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .problem-grid{grid-template-columns:1fr}
  .timeline{grid-template-columns:repeat(2,minmax(0,1fr))}
  .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  .modal.wide{width:min(94vw,900px)}
}

@media(max-width:768px){
  :root{--mobile-nav-h:64px;--mobile-bottom-h:70px}
  .ribbon{font-size:11px;padding:7px 10px}
  .navin{height:64px}
  .nav .brand{font-size:19px}
  .hero{padding:48px 0 48px}
  .hero h1{font-size:clamp(32px,10vw,48px);line-height:1.06}
  .hero-ctas{display:grid;grid-template-columns:1fr;gap:10px}
  .hero-ctas .btn{width:100%;min-height:50px}
  .hero-master-flow{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
  .searchbox{padding:12px}
  .loop-card{padding:20px}
  .section{padding:54px 0}
  .head{margin-bottom:24px}
  .trustin{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}
  .trust span{line-height:1.4}
  .match{padding:20px 16px;border-radius:18px}
  .service-card{min-height:126px;padding:15px 10px}
  .content{padding:18px var(--mobile-page) calc(var(--mobile-bottom-h) + 24px + env(safe-area-inset-bottom))}
  .content h1{font-size:clamp(24px,7vw,31px);line-height:1.15;margin-bottom:16px}
  .panel{padding:15px;border-radius:14px}
  .kpi{padding:14px}
  .kpi .n{font-size:clamp(20px,6vw,26px);line-height:1.1}
  .kpi .l{font-size:11px;line-height:1.35}
  .list-item{align-items:flex-start;flex-direction:column}
  .list-item>div:last-child:has(.btn){width:100%;display:flex;gap:8px;flex-wrap:wrap}
  .list-item>div:last-child:has(.btn) .btn{flex:1 1 140px}
  .app-top{min-height:64px;height:auto;padding-top:max(8px,env(safe-area-inset-top));padding-bottom:8px;gap:8px}
  .app-top .brand{font-size:18px;flex:0 0 auto}
  .app-top .actions{min-width:0;gap:6px;justify-content:flex-end}
  #appUser{max-width:28vw;font-size:11px}
  #homeFromApp,#logoutBtn{font-size:0;min-width:44px;padding:8px}
  #homeFromApp::before{content:'⌂';font-size:20px}
  #logoutBtn::before{content:'↪';font-size:19px}
  .mobile-bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:46;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));min-height:var(--mobile-bottom-h);padding:6px max(6px,env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left));background:rgba(255,255,255,.97);border-top:1px solid var(--line);box-shadow:0 -10px 30px rgba(11,25,48,.08);backdrop-filter:blur(14px)}
  .mobile-bottom-nav.hidden{display:none!important}
  .mobile-bottom-nav button{appearance:none;border:0;background:transparent;color:#66788f;min-width:0;min-height:52px;border-radius:11px;padding:4px 2px;display:grid;place-items:center;align-content:center;gap:2px;font-size:10px;font-weight:700}
  .mobile-bottom-nav .nav-icon{font-size:20px;line-height:1}
  .mobile-bottom-nav button.active{background:#eaf8f1;color:#11784c}
  .modal-backdrop{padding:0;align-items:flex-end}
  .modal,.modal.wide{width:100%;max-width:none;max-height:92dvh;border-radius:20px 20px 0 0;overscroll-behavior:contain}
  .modal-head{position:sticky;top:0;z-index:2;background:#fff;padding:15px 16px}
  .modal-head h2{font-size:18px;line-height:1.25;padding-right:6px}
  .modal-body{padding:16px;padding-bottom:max(18px,env(safe-area-inset-bottom))}
  .form-grid{grid-template-columns:1fr!important}
  .field.full{grid-column:auto}
  .field input,.field select,.field textarea,.searchbox input,.searchbox select{font-size:16px;min-height:48px}
  .field textarea{min-height:112px}
  .modal-foot{position:sticky;bottom:calc(-16px - env(safe-area-inset-bottom));z-index:2;background:linear-gradient(to bottom,rgba(255,255,255,.88),#fff 16%);padding:12px 0 calc(4px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}
  .modal-foot .btn{width:100%;min-height:50px}
  .roles{grid-template-columns:1fr}
  .role-card{min-height:82px;padding:15px}
  .voice-capture-actions,.voice-offer-actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
  .voice-capture-actions .btn,.voice-offer-actions .btn,.voice-lang-select{width:100%!important;min-height:48px!important;font-size:14px!important}
  .voice-offer-panel{width:100%!important;max-width:100%!important;padding:12px!important}
  .voice-summary,.voice-transcript{font-size:14px!important;line-height:1.6!important}
  .qr{width:min(70vw,250px);height:min(70vw,250px);max-width:250px;max-height:250px}
  .toast-wrap{left:10px;right:10px;bottom:calc(var(--mobile-bottom-h) + 12px + env(safe-area-inset-bottom));width:auto}
  .toast{width:100%;min-width:0;font-size:13px}
  .stars{justify-content:center;gap:3px}
  .stars button{min-width:44px;min-height:44px}
  .booking-timeline .row{padding:9px 0}
  .status-table{border-radius:12px}
  .status-table th,.status-table td{padding:11px;font-size:12px}
  .pwa-install-banner{bottom:calc(var(--mobile-bottom-h) + 12px + env(safe-area-inset-bottom))}
}

@media(max-width:768px) and (prefers-reduced-motion:no-preference){
  #landing.eval-motion-ready [data-reveal]{will-change:opacity,transform}
  #landing.eval-motion-ready [data-reveal].is-visible{animation:spMobileReveal .62s cubic-bezier(.2,.75,.2,1) both}
  #landing .hero-seq.hero-active{animation:spHeroStep .62s cubic-bezier(.2,.75,.2,1) both}
  #landing .hero-worker.good.hero-pass{animation:spWorkerPass .55s ease both}
  #landing .hero-worker.bad.hero-remove{animation:spWorkerRemove .55s ease both}
  #landing .eval-system-progress i{transition:width .45s cubic-bezier(.2,.75,.2,1)!important}
}

@keyframes spMobileReveal{
  from{opacity:0;transform:translate3d(0,18px,0) scale(.985)}
  to{opacity:1;transform:translate3d(0,0,0) scale(1)}
}
@keyframes spHeroStep{
  0%{opacity:.48;transform:translateY(6px) scale(.985);box-shadow:0 0 0 rgba(15,118,110,0)}
  55%{opacity:1;transform:translateY(0) scale(1.015);box-shadow:0 8px 24px rgba(15,118,110,.12)}
  100%{opacity:1;transform:translateY(0) scale(1);box-shadow:0 0 0 rgba(15,118,110,0)}
}
@keyframes spWorkerPass{
  0%{transform:scale(.96);box-shadow:0 0 0 0 rgba(32,166,106,.2)}
  60%{transform:scale(1.04);box-shadow:0 0 0 7px rgba(32,166,106,.08)}
  100%{transform:scale(1);box-shadow:0 0 0 0 rgba(32,166,106,0)}
}
@keyframes spWorkerRemove{
  0%{opacity:1;transform:scale(1)}
  100%{opacity:.32;transform:scale(.94)}
}

@media(max-width:520px){
  .service-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .benefit-grid{grid-template-columns:1fr}
  .timeline{grid-template-columns:1fr}
  .trustin{grid-template-columns:1fr}
  .worker-top{align-items:flex-start}
  .worker-top .score{flex:0 0 auto}
  .chips{gap:5px}
  .chip{white-space:normal}
  .panel-head{align-items:flex-start;flex-direction:column}
  .panel-head .btn{width:100%}
  .pwa-install-banner{align-items:stretch;flex-direction:column}
  .pwa-install-banner .btn{width:100%}
}

@media(max-width:360px){
  :root{--mobile-page:12px}
  .service-grid,.kpis{grid-template-columns:1fr}
  .hero h1{font-size:30px}
  .eyebrow{font-size:10px}
  .mobile-bottom-nav button{font-size:9px}
  #appUser{display:none}
  .mobile-drawer{width:100vw!important;border-radius:0!important}
}

@media(min-width:961px){
  .mobile-drawer-scrim{display:none!important}
  body.mobile-drawer-open{overflow:auto}
}
@media(min-width:769px){.mobile-bottom-nav{display:none!important}}
@media(hover:none){.btn:hover,.service-card:hover{transform:none}}
@supports(padding:max(0px)){.footer{padding-bottom:max(42px,calc(20px + env(safe-area-inset-bottom)))}}

```


---

## FILE: `dossier-redesign.css`

```css
/* SanPaid premium landing system — final cascade owner. */
:root{
  --sp-navy:#0b2a43;
  --sp-navy-2:#123b5a;
  --sp-blue:#176e9c;
  --sp-blue-soft:#eaf4f9;
  --sp-teal:#0f817b;
  --sp-teal-soft:#e9f7f5;
  --sp-ink:#142c3e;
  --sp-muted:#5e7282;
  --sp-line:#d7e3ea;
  --sp-bg:#f5f8fb;
  --sp-white:#fff;
  --sp-shadow:0 24px 70px rgba(14,45,69,.10);
}

html{scroll-behavior:smooth}
body{margin:0;background:var(--sp-bg);color:var(--sp-ink);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}
body>*{min-width:0}
.skip-link{position:fixed;left:16px;top:12px;z-index:1000;padding:11px 16px;border-radius:10px;background:var(--sp-navy);color:#fff;font-weight:700;text-decoration:none}
.skip-link:not(:focus){clip-path:inset(50%);width:1px;height:1px;overflow:hidden;padding:0}

#landing{background:var(--sp-bg)!important;color:var(--sp-ink)!important;overflow:hidden}
#landing *{box-sizing:border-box}
#landing .wrap{width:min(1180px,calc(100% - 40px))!important;margin-inline:auto}
#landing .section{padding:100px 0!important;scroll-margin-top:82px}
#landing .section-intro{max-width:780px;margin:0 auto 46px;text-align:center}
#landing .section-intro .tag,#landing .tag{display:inline-flex;align-items:center;min-height:28px;padding:6px 11px;border:1px solid #bdded9;border-radius:999px;background:var(--sp-teal-soft);color:#0b6f6a;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
#landing .section-intro h2,#landing .proof-story h2,#landing .architecture-card h2{margin:14px 0 14px;color:var(--sp-navy);font-size:clamp(32px,4vw,50px);line-height:1.08;letter-spacing:-.045em}
#landing .section-intro p,#landing .proof-story>p,#landing .architecture-card p{margin:0;color:var(--sp-muted);font-size:16px;line-height:1.72}
#landing button,#landing a{-webkit-tap-highlight-color:transparent}
#landing .btn{min-height:48px;padding:13px 19px;border-radius:11px;font-size:14px;font-weight:800;letter-spacing:.015em;transition:transform .2s ease,box-shadow .2s ease,background .2s ease,border-color .2s ease}
#landing .btn:hover{transform:translateY(-2px)}
#landing .btn:focus-visible,#landing a:focus-visible,#landing select:focus-visible{outline:3px solid rgba(23,110,156,.28)!important;outline-offset:3px}
#landing .btn.primary{border:1px solid var(--sp-navy)!important;background:var(--sp-navy)!important;color:#fff!important;box-shadow:0 10px 24px rgba(11,42,67,.16)}
#landing .btn.primary:hover{background:#123b5a!important}
#landing .btn.secondary{border:1px solid #c6d7e1!important;background:#fff!important;color:var(--sp-navy)!important;box-shadow:none!important}
#landing .btn.tertiary{border:1px solid transparent!important;background:transparent!important;color:#536c7d!important}

/* Navigation */
#landing .eval-nav{position:sticky!important;top:0;z-index:70;min-height:74px;background:rgba(255,255,255,.92)!important;border:0!important;border-bottom:1px solid rgba(205,220,229,.9)!important;backdrop-filter:blur(18px);box-shadow:0 8px 28px rgba(15,42,62,.035)}
#landing .eval-nav .navin{min-height:74px!important;display:flex;align-items:center;justify-content:space-between;gap:26px}
#landing .eval-nav .brand,#landing .footer .brand{color:var(--sp-navy)!important;font-size:24px!important;font-weight:850!important;letter-spacing:-.05em;text-decoration:none}
#landing .eval-nav .brand span,#landing .footer .brand span{color:var(--sp-teal)!important}
#landing .eval-nav .navlinks{display:flex;align-items:center;gap:28px!important}
#landing .eval-nav .navlinks a{position:relative;color:#52697a!important;font-size:14px!important;font-weight:650!important;text-decoration:none}
#landing .eval-nav .navlinks a::after{content:"";position:absolute;left:0;right:100%;bottom:-9px;height:2px;background:var(--sp-teal);transition:right .2s ease}
#landing .eval-nav .navlinks a:hover::after{right:0}
#landing .eval-nav .actions{display:flex;align-items:center;gap:10px}
#landing .eval-nav #getStarted{min-height:42px;padding:10px 17px}
#landing .menu-btn{display:none;place-items:center;width:44px;height:44px;border:1px solid var(--sp-line);border-radius:11px;background:#fff;color:var(--sp-navy);font-size:21px;cursor:pointer}
#landing .mobile-drawer{position:fixed!important;z-index:81!important;top:0!important;right:0!important;width:min(360px,90vw)!important;height:100dvh!important;padding:74px 24px 28px!important;background:#fff!important;box-shadow:-24px 0 60px rgba(11,42,67,.18)!important;overflow:auto!important}
#landing .mobile-drawer.hidden{display:none!important}
#landing .mobile-drawer a{display:block;padding:16px 4px;border-bottom:1px solid var(--sp-line);color:var(--sp-navy);font-size:16px;font-weight:700;text-decoration:none}
#landing .mobile-drawer .btn{width:100%;margin-top:14px}
#landing .drawer-title{position:absolute;inset:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--sp-line);color:var(--sp-navy)}
#landing .drawer-close{width:40px;height:40px;border:1px solid var(--sp-line);border-radius:10px;background:#fff;color:var(--sp-navy);font-size:24px}
#mobileDrawerScrim{z-index:79!important;background:rgba(7,29,47,.48)!important;backdrop-filter:blur(2px)}

/* Hero */
#landing #home.eval-hero{padding:86px 0 0!important;background:radial-gradient(circle at 78% 18%,rgba(15,129,123,.11),transparent 28%),radial-gradient(circle at 25% 20%,rgba(23,110,156,.08),transparent 28%),linear-gradient(180deg,#fbfdff 0%,#f1f6fa 100%)!important;color:var(--sp-ink)!important}
#landing #home .eval-hero-grid{display:grid!important;grid-template-columns:minmax(0,1.03fr) minmax(430px,.97fr)!important;align-items:center!important;gap:70px!important}
#landing #home .eval-hero-copy{min-width:0}
#landing #home .eval-badge{display:inline-flex!important;align-items:center;min-height:30px;padding:7px 12px!important;border:1px solid #baddd8!important;border-radius:999px!important;background:var(--sp-teal-soft)!important;color:#0b6f69!important;font-size:11px!important;font-weight:800!important;letter-spacing:.065em!important;text-transform:uppercase}
#landing #home h1{max-width:700px!important;margin:20px 0 22px!important;color:var(--sp-navy)!important;font-size:clamp(44px,5.2vw,68px)!important;line-height:1.01!important;letter-spacing:-.06em!important;white-space:normal!important}
#landing #home h1 em{color:var(--sp-teal)!important;font-style:normal!important}
#landing #home .lead{max-width:650px!important;margin:0!important;color:#4f6678!important;font-size:18px!important;line-height:1.67!important}
#landing #home .lead b{color:var(--sp-navy)}
#landing #home .hero-ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px!important}
#landing #home .hero-ctas .btn{min-width:164px}
#landing .hero-assurance{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:25px;color:#557080;font-size:13px;font-weight:700}
#landing .hero-assurance span{display:inline-flex;align-items:center;gap:7px}
#landing .hero-assurance span::before{content:"✓";display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--sp-teal-soft);color:var(--sp-teal);font-size:10px;font-weight:900}
#landing .hero-usp-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;max-width:650px}
#landing .hero-usp{position:relative;padding:13px 14px 13px 17px;border:1px solid #d4e2ea;border-radius:13px;background:rgba(255,255,255,.72);overflow:hidden}
#landing .hero-usp::before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:linear-gradient(var(--sp-teal),var(--sp-blue))}
#landing .hero-usp small,#landing .hero-usp b{display:block}
#landing .hero-usp small{color:#68808f;font-size:9px;font-weight:850;letter-spacing:.06em}
#landing .hero-usp b{margin-top:5px;color:var(--sp-navy);font-size:12px;line-height:1.4}

#landing .network-visual{position:relative;min-width:0;border:1px solid #c9dce6;border-radius:24px;background:rgba(255,255,255,.88);box-shadow:var(--sp-shadow);overflow:hidden;transform:perspective(1200px) rotateY(-1.5deg)}
#landing .network-visual::before{content:"";position:absolute;inset:0 0 auto;height:4px;background:linear-gradient(90deg,var(--sp-teal),var(--sp-blue))}
#landing .network-visual-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px;border-bottom:1px solid var(--sp-line);color:#5f7586;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
#landing .network-visual-head b{color:var(--sp-teal)}
#landing .network-route{display:grid;grid-template-columns:1fr 46px 1.2fr 46px 1fr;align-items:center;gap:4px;padding:34px 22px 30px}
#landing .network-node{position:relative;min-height:150px;padding:18px 16px;border:1px solid #d6e3ea;border-radius:16px;background:#f8fbfd}
#landing .network-node small{display:grid;place-items:center;width:29px;height:29px;margin-bottom:28px;border-radius:9px;background:#eaf3f8;color:var(--sp-blue);font-size:10px;font-weight:900}
#landing .network-node span,#landing .network-node b{display:block}
#landing .network-node span{color:var(--sp-navy);font-size:15px;font-weight:800}
#landing .network-node b{margin-top:7px;color:#6b7f8e;font-size:11px;line-height:1.45}
#landing .network-node-core{border-color:#a9d4cf;background:linear-gradient(145deg,#effaf8,#f7fbfd);box-shadow:0 14px 34px rgba(15,129,123,.10)}
#landing .network-node-core small{background:var(--sp-teal);color:#fff}
#landing .network-route>i{position:relative;height:2px;background:#c5d9e3;font-style:normal}
#landing .network-route>i::after{content:"";position:absolute;right:-2px;top:-3px;width:8px;height:8px;border-top:2px solid #84aaba;border-right:2px solid #84aaba;transform:rotate(45deg)}
#landing .network-route>i span{position:absolute;left:0;top:-2px;width:6px;height:6px;border-radius:50%;background:var(--sp-teal);animation:sp-route 3s ease-in-out infinite}
#landing .network-signal{display:flex;gap:12px;align-items:flex-start;margin:0 22px 22px;padding:15px 16px;border-radius:13px;background:var(--sp-navy);color:#dbe8ee}
#landing .network-signal .signal-dot{flex:0 0 auto;width:9px;height:9px;margin-top:5px;border-radius:50%;background:#6ed6ca;box-shadow:0 0 0 6px rgba(110,214,202,.11)}
#landing .network-signal p{margin:0;font-size:12px;line-height:1.55}
#landing .network-signal b{color:#fff}
@keyframes sp-route{0%,100%{transform:translateX(0);opacity:.25}50%{transform:translateX(38px);opacity:1}}

#landing .hero-proof-strip{margin-top:82px;background:var(--sp-navy);color:#c8d8e2}
#landing .hero-proof-strip .wrap{display:grid;grid-template-columns:auto repeat(3,1fr) auto;align-items:center;gap:20px;min-height:72px}
#landing .hero-proof-strip b{color:#79d8cf;font-size:11px;letter-spacing:.08em}
#landing .hero-proof-strip span{padding-left:18px;border-left:1px solid rgba(255,255,255,.12);font-size:12px;font-weight:650}
#landing .hero-proof-strip a{color:#fff;font-size:12px;font-weight:800;text-decoration:none}

/* Product flow */
#landing .flow-section{background:#fff!important}
#landing .service-flow{position:relative;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;list-style:none;margin:0;padding:0}
#landing .service-flow::before{content:"";position:absolute;left:7%;right:7%;top:31px;height:1px;background:#cbdde6}
#landing .service-flow li{position:relative;min-width:0;padding:0 10px;text-align:center}
#landing .service-flow li>span{position:relative;z-index:1;display:grid;place-items:center;width:62px;height:62px;margin:0 auto 18px;border:1px solid #c9dce6;border-radius:18px;background:#fff;color:var(--sp-blue);font-size:12px;font-weight:900;box-shadow:0 9px 22px rgba(18,59,90,.07)}
#landing .service-flow li:nth-child(2)>span,#landing .service-flow li:nth-child(3)>span,#landing .service-flow li:nth-child(4)>span{border-color:#b6ddd8;background:var(--sp-teal-soft);color:var(--sp-teal)}
#landing .service-flow b{display:block;color:var(--sp-navy);font-size:14px;line-height:1.35}
#landing .service-flow small{display:block;margin-top:7px;color:#708390;font-size:11px;line-height:1.55}
#landing .flow-rule{display:flex;justify-content:center;gap:0;margin:38px auto 0;width:max-content;max-width:100%;border:1px solid #bededb;border-radius:999px;background:var(--sp-teal-soft);overflow:hidden}
#landing .flow-rule>*{padding:11px 16px;color:#3b6e6b;font-size:12px}
#landing .flow-rule>*+*{border-left:1px solid #c5e2df}
#landing .flow-rule b{color:#0b6f69}

/* Differentiators */
#landing .difference-section{background:#f2f6f9!important}
#landing .difference-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
#landing .difference-card{position:relative;min-width:0;padding:34px;border:1px solid #d1e0e8;border-radius:22px;background:#fff;box-shadow:0 14px 40px rgba(14,45,69,.055);overflow:hidden}
#landing .difference-card::after{content:"";position:absolute;inset:auto -80px -110px auto;width:220px;height:220px;border-radius:50%;background:rgba(23,110,156,.045)}
#landing .capacity-card::before,#landing .demand-card::before{content:"";position:absolute;inset:0 0 auto;height:4px;background:linear-gradient(90deg,var(--sp-teal),var(--sp-blue))}
#landing .difference-top{display:flex;align-items:center;gap:11px;color:var(--sp-teal)}
#landing .difference-top>span{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--sp-teal-soft);font-size:10px;font-weight:900}
#landing .difference-top small{font-size:11px;font-weight:850;letter-spacing:.075em;text-transform:uppercase}
#landing .difference-card h3{max-width:520px;margin:23px 0 12px;color:var(--sp-navy);font-size:clamp(25px,3vw,34px);line-height:1.13;letter-spacing:-.035em}
#landing .difference-card>p{max-width:590px;margin:0;color:var(--sp-muted);font-size:15px;line-height:1.72}
#landing .capacity-mini,#landing .demand-mini{position:relative;z-index:1;display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:8px;align-items:center;margin:28px 0 24px;padding:14px;border:1px solid var(--sp-line);border-radius:14px;background:#f8fbfc}
#landing .capacity-mini span,#landing .demand-mini span{display:grid;place-items:center;min-height:48px;padding:8px;border-radius:10px;background:#fff;color:#36556b;font-size:11px;font-weight:800;text-align:center}
#landing .capacity-mini i,#landing .demand-mini i{color:#79a4b7;font-style:normal}
#landing .difference-actions{position:relative;z-index:2;display:flex;flex-wrap:wrap;gap:10px}
#landing .text-action{min-height:42px;padding:10px 14px;border:1px solid var(--sp-navy);border-radius:10px;background:var(--sp-navy);color:#fff;font-size:12px;font-weight:800;cursor:pointer}
#landing .text-action.secondary-action{border-color:#c7d9e3;background:#fff;color:var(--sp-navy)}
#landing .human-review-note{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:24px;padding:15px 16px;border-radius:12px;background:var(--sp-navy);color:#c7dae5;font-size:12px}
#landing .human-review-note b{color:#7cddd4}
#landing .difference-card .eval-worker-message{position:relative;z-index:2;margin-top:14px!important;font-size:12px!important}

/* Evidence */
#landing .proof-section{background:#fff!important}
#landing .proof-layout{display:grid;grid-template-columns:.88fr 1.12fr;gap:64px;align-items:center}
#landing .proof-story h2{max-width:520px}
#landing .proof-story>p{max-width:520px}
#landing .proof-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:28px 0}
#landing .proof-facts div{padding:17px 14px;border:1px solid var(--sp-line);border-radius:13px;background:#f8fbfc}
#landing .proof-facts strong,#landing .proof-facts span{display:block}
#landing .proof-facts strong{color:var(--sp-navy);font-size:20px;letter-spacing:-.03em}
#landing .proof-facts span{margin-top:5px;color:#6d818f;font-size:10px;line-height:1.4}
#landing .evidence-link{display:inline-flex;align-items:center;gap:20px;padding:13px 16px;border-radius:10px;background:var(--sp-navy);color:#fff;font-size:12px;font-weight:800;text-decoration:none}
#landing .decision-map{border:1px solid #cadce6;border-radius:20px;background:#fff;box-shadow:var(--sp-shadow);overflow:hidden}
#landing .decision-map-head{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:13px 20px;background:var(--sp-navy);color:#bdd0dc;font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
#landing .decision-map article{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:center;padding:18px 20px;border-bottom:1px solid var(--sp-line)}
#landing .decision-map article>div{display:grid;grid-template-columns:30px 1fr;gap:11px;align-items:start}
#landing .decision-map article b{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--sp-blue-soft);color:var(--sp-blue);font-size:9px}
#landing .decision-map article p{margin:2px 0 0;color:#566d7d;font-size:12px;line-height:1.55}
#landing .decision-map article strong{color:var(--sp-navy);font-size:12px;line-height:1.55}
#landing .decision-map>small{display:block;padding:13px 20px;background:#f6f9fb;color:#6f818e;font-size:10px;line-height:1.5}

/* Trust */
#landing .trust-section{background:var(--sp-navy)!important;color:#fff}
#landing .trust-section .section-intro h2{color:#fff}
#landing .trust-section .section-intro p{color:#b8cad5}
#landing .trust-section .tag{border-color:rgba(117,215,207,.25);background:rgba(117,215,207,.10);color:#86ddd5}
#landing .trust-control-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
#landing .trust-control-grid article{display:grid;grid-template-columns:auto 1fr;gap:14px;min-height:128px;padding:22px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.055)}
#landing .trust-control-grid article>span{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:rgba(117,215,207,.12);color:#82ddd5;font-weight:900}
#landing .trust-control-grid b{display:block;color:#fff;font-size:14px;line-height:1.4}
#landing .trust-control-grid p{margin:7px 0 0;color:#adc1cd;font-size:12px;line-height:1.55}

/* Interactive policy proof */
#landing .live-proof-section{background:#edf3f7!important}
#landing .eval-match{border:1px solid #c8dae5!important;border-radius:22px!important;background:#fff!important;box-shadow:var(--sp-shadow)!important;overflow:hidden!important}
#landing .eval-request-bar{display:grid!important;grid-template-columns:.8fr 1.4fr 1fr!important;background:var(--sp-navy)!important}
#landing .eval-request-item{min-width:0;padding:18px 20px!important;border-right:1px solid rgba(255,255,255,.10)!important}
#landing .eval-request-item:last-child{border-right:0!important}
#landing .eval-request-item small{color:#84d9d1!important}
#landing .eval-request-item b{color:#fff!important;font-size:14px!important}
#landing .eval-request-item span{color:#aabfcb!important;font-size:11px!important}
#landing .eval-request-item select{min-height:38px;border:1px solid rgba(255,255,255,.22);border-radius:9px;background:#143b58;color:#fff;font-size:13px}
#landing .eval-radius-copy{padding:12px 20px!important;border-bottom:1px solid var(--sp-line)!important;background:#f7fafc!important;color:#667b8a!important;font-size:11px!important;text-align:center!important}
#landing .eval-proof-body{display:grid!important;grid-template-columns:1fr 1fr!important}
#landing .eval-proof-panel{min-width:0;padding:24px!important;border-right:1px solid var(--sp-line)!important}
#landing .eval-proof-panel:last-child{border-right:0!important}
#landing .eval-panel-heading h3{color:var(--sp-navy)!important}
#landing .eval-actions-row{display:flex!important;align-items:center!important;justify-content:flex-start!important;flex-wrap:wrap!important;gap:10px!important;padding:20px 24px!important;border-top:1px solid var(--sp-line)!important;background:#f8fbfc!important}
#landing .eval-actions-row .btn{min-height:42px!important;padding:10px 14px!important}
#landing .eval-demo-truth{margin-left:auto!important;color:#718491!important;font-size:9px!important}
#landing .live-proof-bridge{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:16px;padding:22px 24px;border:1px solid #cbdde6;border-radius:16px;background:#fff}
#landing .live-proof-bridge b,#landing .live-proof-bridge span{display:block}
#landing .live-proof-bridge b{color:var(--sp-navy);font-size:15px}
#landing .live-proof-bridge span{margin-top:5px;color:#677c8a;font-size:12px}

/* Roles */
#landing .roles-section{background:#fff!important}
#landing .role-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
#landing .role-grid article{display:flex;min-width:0;min-height:290px;flex-direction:column;padding:24px;border:1px solid var(--sp-line);border-radius:18px;background:#fbfdfe;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
#landing .role-grid article:hover{transform:translateY(-4px);border-color:#acd1cf;box-shadow:0 16px 34px rgba(14,45,69,.08)}
#landing .role-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:var(--sp-blue-soft);color:var(--sp-blue);font-size:11px;font-weight:900}
#landing .role-grid article:nth-child(2) .role-mark,#landing .role-grid article:nth-child(3) .role-mark{background:var(--sp-teal-soft);color:var(--sp-teal)}
#landing .role-grid h3{margin:25px 0 10px;color:var(--sp-navy);font-size:19px;letter-spacing:-.025em}
#landing .role-grid p{margin:0 0 24px;color:var(--sp-muted);font-size:14px;line-height:1.65}
#landing .role-grid button{margin-top:auto;padding:12px 0;border:0;border-top:1px solid var(--sp-line);background:transparent;color:var(--sp-blue);font-size:13px;font-weight:850;text-align:left;cursor:pointer}
#landing .role-grid button::after{content:" →"}
#landing .role-action{display:flex;justify-content:center;margin-top:24px}

/* Pilot outcomes */
#landing .outcome-section{background:#f2f6f9!important}
#landing .outcome-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
#landing .outcome-grid article{min-width:0;padding:23px;border:1px solid var(--sp-line);border-radius:16px;background:#fff}
#landing .outcome-grid article>span{display:grid;place-items:center;width:30px;height:30px;margin-bottom:22px;border-radius:9px;background:var(--sp-blue-soft);color:var(--sp-blue);font-size:10px;font-weight:900}
#landing .outcome-grid b{display:block;color:var(--sp-navy);font-size:15px;line-height:1.4}
#landing .outcome-grid p{margin:8px 0 0;color:var(--sp-muted);font-size:12px;line-height:1.6}
#landing .pilot-sequence{display:flex;align-items:center;justify-content:center;gap:12px;margin:28px auto 0;padding:14px 18px;border:1px solid #c7dce4;border-radius:14px;background:#fff;color:#426276;font-size:12px;font-weight:800}
#landing .pilot-sequence i{color:#80a8b8;font-style:normal}

/* Architecture, truth and final CTA */
#landing .architecture-section{padding:0 0 26px!important;background:#fff!important}
#landing .architecture-card{display:grid;grid-template-columns:1.05fr 1.25fr auto;gap:32px;align-items:center;padding:32px!important;border:1px solid #cbdde6;border-radius:20px;background:#f4f8fa}
#landing .architecture-card h2{margin:11px 0 10px;font-size:29px}
#landing .architecture-card p{font-size:13px}
#landing .architecture-line{display:flex;align-items:center;justify-content:center;gap:8px;min-width:0}
#landing .architecture-line span{padding:10px 11px;border:1px solid var(--sp-line);border-radius:10px;background:#fff;color:#395970;font-size:10px;font-weight:800;text-align:center}
#landing .architecture-line i{color:#83a8b9;font-style:normal}
#landing .architecture-card .text-action{white-space:nowrap}
#landing .scope-section{padding:0 0 90px!important;background:#fff!important}
#landing .scope-bar{display:flex;align-items:center;justify-content:center;gap:18px;padding:14px 18px!important;border:1px solid #d6e2e9;border-radius:12px;background:#f8fafb;color:#607583;font-size:11px;text-align:center}
#landing .scope-bar b{color:var(--sp-navy);white-space:nowrap}
#landing .final-cta{padding:90px 0;background:linear-gradient(135deg,#08253b 0%,#0f405d 70%,#0d6768 140%);color:#fff;text-align:center}
#landing .final-cta .wrap{max-width:860px!important}
#landing .final-cta .tag{border-color:rgba(123,220,211,.28);background:rgba(123,220,211,.10);color:#8be0d8}
#landing .final-cta h2{margin:17px auto 15px;color:#fff;font-size:clamp(36px,5vw,56px);line-height:1.07;letter-spacing:-.05em}
#landing .final-cta p{max-width:690px;margin:0 auto;color:#bfd0da;font-size:16px;line-height:1.7}
#landing .final-actions{display:flex;justify-content:center;gap:12px;margin-top:30px}
#landing .final-cta .btn.primary{border-color:#fff!important;background:#fff!important;color:var(--sp-navy)!important}
#landing .final-cta .btn.secondary{border-color:rgba(255,255,255,.25)!important;background:transparent!important;color:#fff!important}

#landing .footer{padding:38px 0!important;background:#061d2e!important;color:#9fb4c1!important}
#landing .footer-grid{display:grid;grid-template-columns:.8fr 1.1fr 1.1fr;gap:44px}
#landing .footer p{margin:9px 0 0;color:#9fb4c1;font-size:11px;line-height:1.6}
#landing .footer b{color:#dce7ed;font-size:11px;letter-spacing:.04em}

/* Keep the connected role workspaces visually aligned without changing behavior. */
#connectedShell .connected-top,#sihJudgeShell .judge-top{background:#0d2a44!important;color:#fff!important;border-bottom:1px solid #31516b!important}
#cwDashboard .cw-nav,#coopSidebar,#fedSidebar{background:#f7fafc!important;border-color:#d4e0e8!important}
#cwDashboard .cw-nav button{min-height:46px!important;border-radius:10px!important;font-size:14px!important}
#cwDashboard .cw-nav button.active{background:#e8f3f6!important;color:#0d5679!important;border-left:3px solid #176e9c!important}
#cwDashboard .cw-role-head h1{font-size:clamp(26px,3vw,40px)!important;line-height:1.15!important;letter-spacing:-.035em!important}
#cwDashboard .cw-next,#cwDashboard .cw-metrics article,#sihJudgeShell .judge-card,#sihJudgeShell .coop-section,#sihJudgeShell .fed-section{border-color:#d4e0e8!important;border-radius:16px!important;box-shadow:0 5px 20px rgba(16,40,61,.035)!important}
#connectedShell input,#connectedShell select,#connectedShell textarea{min-height:44px;font-size:16px!important}
#connectedShell button,#sihJudgeShell button{min-height:40px}

@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}#landing *{animation:none!important;transition:none!important}}

@media (max-width:1040px){
  #landing #home .eval-hero-grid{grid-template-columns:1fr!important;gap:44px!important}
  #landing #home h1{max-width:760px!important}
  #landing #home .lead{max-width:720px!important}
  #landing .network-visual{max-width:720px;transform:none}
  #landing .hero-proof-strip .wrap{grid-template-columns:auto 1fr 1fr;min-height:0;padding-block:18px}
  #landing .hero-proof-strip a{grid-column:3}
  #landing .service-flow{grid-template-columns:repeat(3,1fr);gap:28px 12px}
  #landing .service-flow::before{display:none}
  #landing .proof-layout{grid-template-columns:1fr;gap:38px}
  #landing .proof-story h2,#landing .proof-story>p{max-width:740px}
  #landing .role-grid{grid-template-columns:1fr 1fr}
  #landing .role-grid article{min-height:260px}
  #landing .outcome-grid{grid-template-columns:1fr 1fr}
  #landing .architecture-card{grid-template-columns:1fr}
  #landing .architecture-card .text-action{justify-self:start}
}

@media (max-width:1020px){
  #landing .eval-nav .navlinks,#landing .eval-nav .desktop-only{display:none!important}
  #landing .menu-btn{display:grid}
}

@media (max-width:780px){
  #landing .wrap{width:min(100% - 28px,1180px)!important}
  #landing .section{padding:72px 0!important}
  #landing .section-intro{margin-bottom:32px;text-align:left}
  #landing .section-intro h2,#landing .proof-story h2{font-size:clamp(31px,9vw,42px)}
  #landing .section-intro p,#landing .proof-story>p{font-size:15px}
  #landing .eval-nav,#landing .eval-nav .navin{min-height:66px!important}
  #landing #home.eval-hero{padding-top:58px!important}
  #landing #home h1{font-size:clamp(42px,12vw,58px)!important}
  #landing #home .lead{font-size:16px!important}
  #landing .network-route{grid-template-columns:1fr;gap:10px;padding:24px 18px}
  #landing .network-node{min-height:0;padding:16px}
  #landing .network-node small{display:inline-grid;margin:0 12px 0 0;vertical-align:middle}
  #landing .network-node span{display:inline;font-size:14px}
  #landing .network-node b{margin:8px 0 0 44px}
  #landing .network-route>i{width:2px;height:22px;margin:auto;background:#c5d9e3}
  #landing .network-route>i::after{right:-3px;top:auto;bottom:-1px;transform:rotate(135deg)}
  #landing .network-route>i span{display:none}
  #landing .network-signal{margin:0 18px 18px}
  #landing .hero-proof-strip{margin-top:58px}
  #landing .hero-proof-strip .wrap{display:grid;grid-template-columns:1fr;gap:10px;padding-block:18px}
  #landing .hero-proof-strip span{padding-left:0;border-left:0}
  #landing .hero-proof-strip a{grid-column:auto}
  #landing .service-flow{grid-template-columns:1fr 1fr;gap:24px 10px}
  #landing .service-flow li>span{width:54px;height:54px;margin-bottom:13px;border-radius:15px}
  #landing .flow-rule{width:100%;border-radius:14px;flex-direction:column;text-align:center}
  #landing .flow-rule>*+*{border-top:1px solid #c5e2df;border-left:0}
  #landing .difference-grid{grid-template-columns:1fr}
  #landing .difference-card{padding:26px}
  #landing .proof-facts{grid-template-columns:1fr 1fr 1fr}
  #landing .decision-map-head{display:none}
  #landing .decision-map article{grid-template-columns:1fr;gap:8px}
  #landing .trust-control-grid{grid-template-columns:1fr 1fr}
  #landing .eval-request-bar{grid-template-columns:1fr!important}
  #landing .eval-request-item{border-right:0!important;border-bottom:1px solid rgba(255,255,255,.10)!important}
  #landing .eval-proof-body{grid-template-columns:1fr!important}
  #landing .eval-proof-panel{border-right:0!important;border-bottom:1px solid var(--sp-line)!important}
  #landing .eval-actions-row{align-items:stretch!important}
  #landing .eval-actions-row .btn{flex:1 1 150px}
  #landing .eval-demo-truth{flex:1 0 100%;margin:4px 0 0!important;text-align:left}
  #landing .live-proof-bridge{align-items:flex-start;flex-direction:column}
  #landing .role-grid{grid-template-columns:1fr}
  #landing .role-grid article{min-height:0}
  #landing .outcome-grid{grid-template-columns:1fr}
  #landing .pilot-sequence{align-items:stretch;flex-direction:column;text-align:center}
  #landing .pilot-sequence i{transform:rotate(90deg)}
  #landing .architecture-line{align-items:stretch;flex-direction:column}
  #landing .architecture-line i{transform:rotate(90deg);text-align:center}
  #landing .scope-section{padding:0 0 70px!important}
  #landing .scope-bar{align-items:flex-start;flex-direction:column;text-align:left}
  #landing .final-cta{padding:72px 0}
  #landing .final-actions{align-items:stretch;flex-direction:column}
  #landing .footer-grid{grid-template-columns:1fr;gap:24px}
}

@media (max-width:480px){
  #landing .wrap{width:min(100% - 24px,1180px)!important}
  #landing #home h1{font-size:clamp(38px,11.5vw,50px)!important}
  #landing #home .hero-ctas{align-items:stretch;flex-direction:column}
  #landing #home .hero-ctas .btn{width:100%}
  #landing .hero-assurance{align-items:flex-start;flex-direction:column;gap:10px}
  #landing .hero-usp-row{grid-template-columns:1fr}
  #landing .network-visual-head{align-items:flex-start;flex-direction:column}
  #landing .service-flow{grid-template-columns:1fr 1fr}
  #landing .capacity-mini,#landing .demand-mini{grid-template-columns:1fr;padding:10px}
  #landing .capacity-mini i,#landing .demand-mini i{transform:rotate(90deg);text-align:center}
  #landing .difference-actions{align-items:stretch;flex-direction:column}
  #landing .difference-actions .text-action{width:100%}
  #landing .human-review-note{align-items:flex-start;flex-direction:column}
  #landing .proof-facts{grid-template-columns:1fr}
  #landing .trust-control-grid{grid-template-columns:1fr}
  #landing .eval-proof-panel{padding:18px!important}
  #landing .architecture-card{padding:24px!important}
}

```
