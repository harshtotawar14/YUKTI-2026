(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const SCENARIOS = [
    {
      id:'no-worker', title:'No Eligible Worker', short:'Eligibility produces zero valid candidates',
      happened:'All available candidates failed one or more eligibility rules.',
      why:'Verification, required skill, availability, credential or configured service-radius policy can exclude a candidate.',
      next:'Keep the request unassigned; show the capacity gap; allow authorized cooperative review or a governed capacity-exchange option.',
      control:'No worker is forced and no ineligible worker is silently bypassed into ranking.',
      audit:'Eligibility exclusions + NO_WORKER_AVAILABLE / capacity-gap reason remain traceable.'
    },
    {
      id:'decline', title:'Worker Declines', short:'Worker choice is respected',
      happened:'The first eligible worker declines the opportunity.',
      why:'The worker may have a schedule conflict, distance concern, availability issue or another valid reason.',
      next:'Preserve the same booking and offer it to the next eligible worker.',
      control:'Decline is a worker choice, not a punishment signal. Assignment remains unforced.',
      audit:'Decline reason + FINDING_REPLACEMENT + next-offer event are recorded.'
    },
    {
      id:'network', title:'Network Unavailable', short:'Field connectivity fails',
      happened:'The worker app loses connectivity while a booking is active.',
      why:'Mobile-data coverage or device connectivity can fail in real field conditions.',
      next:'Preserve booking state and use the prototype SMS / OTP fallback path for critical continuity.',
      control:'Fallback does not change eligibility or service-start rules.',
      audit:'Connectivity/fallback context should remain attached to the booking lifecycle. Current SMS path is PROTOTYPE DEMO.'
    },
    {
      id:'capacity', title:'Capacity Shortage', short:'Local eligible capacity is insufficient',
      happened:'Demand exceeds the verified eligible capacity available in the local cooperative.',
      why:'Peak demand, skill gaps or availability constraints can create temporary shortages.',
      next:'Suggest Cross-Cooperative Capacity Exchange without automatically transferring a worker.',
      control:'Worker acceptance + authorized cooperative approval remain required.',
      audit:'Home cooperative, serving cooperative, worker consent, assignment and ownership fields stay explicit.'
    },
    {
      id:'sla', title:'SLA Risk', short:'Complaint approaches configured threshold',
      happened:'A complaint remains unresolved as its configured SLA threshold approaches.',
      why:'The current handling level has not resolved the issue within policy time.',
      next:'Alert the responsible role and escalate L1 → L2 / L3 according to configured policy.',
      control:'Authorized support/admin roles remain responsible for resolution.',
      audit:'Threshold, escalation level, alert and timestamped status changes are traceable. Time advancement may be simulated in demo.'
    },
    {
      id:'verification', title:'Verification Failure', short:'Service-start trust check fails',
      happened:'Identity or booking-specific customer confirmation has not passed.',
      why:'Wrong/expired token, booking mismatch or missing identity confirmation.',
      next:'Keep Start Service locked until both worker identity and customer confirmation are valid.',
      control:'Customer confirmation cannot be bypassed by the worker UI.',
      audit:'Failed/blocked verification attempts and successful confirmation state remain distinguishable.'
    }
  ];

  function makeScenarioButton(s, i) {
    return `<button class="sp-scenario-btn ${i===0?'active':''}" type="button" data-sp-scenario="${s.id}" aria-pressed="${i===0?'true':'false'}"><span class="sp-scenario-no">${String(i+1).padStart(2,'0')}</span><span><b>${s.title}</b><small>${s.short}</small></span><span class="sp-scenario-state">Demo proof</span></button>`;
  }

  function panelMarkup(s) {
    return `<div class="sp-failure-top"><div><span class="tag">Failure-Safe Outcome</span><h3>${s.title}</h3></div><span class="sp-scope-pill">Prototype / Demo</span></div>
      <div class="sp-failure-grid">
        <div class="sp-failure-item"><small>What happened</small><b>${s.happened}</b></div>
        <div class="sp-failure-item"><small>Why</small><b>${s.why}</b></div>
        <div class="sp-failure-item"><small>What SanPaid does next</small><b>${s.next}</b></div>
        <div class="sp-failure-item"><small>Who retains control</small><b>${s.control}</b></div>
      </div>
      <div class="sp-audit-proof"><b>Audit &amp; Outcome:</b> ${s.audit}</div>`;
  }

  function mount() {
    if ($('#top1Readiness')) return $('#top1Readiness');
    const anchor = $('#researchBackedUpgrades') || $('#intelligence') || $('#impact');
    if (!anchor) return null;

    const section = document.createElement('section');
    section.id = 'top1Readiness';
    section.className = 'section white sp-readiness';
    section.innerHTML = `<div class="wrap">
      <div class="head" data-reveal>
        <span class="tag">09B — Failure-Safe Operations</span>
        <h2>A strong prototype explains what happens when things go wrong.</h2>
        <p>SanPaid does not hide failure states. Each scenario shows the reason, next action, human control and auditable outcome without bypassing eligibility or worker choice.</p>
      </div>
      <div class="sp-readiness-grid" data-reveal>
        <div class="sp-scenario-list" role="list" aria-label="Failure demo scenarios">${SCENARIOS.map(makeScenarioButton).join('')}</div>
        <article class="sp-failure-panel" id="spFailurePanel" aria-live="polite">${panelMarkup(SCENARIOS[0])}</article>
      </div>

      <div class="sp-validation-wrap" data-reveal>
        <article class="sp-validation-card" id="stakeholderValidationReadiness">
          <span class="sp-validation-status">Awaiting real stakeholder evidence</span>
          <h3>Cooperative / Admin Validation Readiness</h3>
          <p>The website is ready to show real stakeholder validation when it is collected. No organization, quote, approval or pilot result is fabricated.</p>
          <div class="sp-validation-fields"><span>Stakeholder Role</span><span>Organization Type</span><span>Date</span><span>Problem Confirmed</span><span>Most Valuable Feature</span><span>Improvement Suggestion</span><span>Permission to Quote</span><span>Evidence / Notes</span></div>
          <div class="sp-validation-truth"><b>Truth rule:</b> publish a stakeholder name, organization or quote only after direct feedback and permission. Until then this remains a validation-readiness placeholder, not a partnership claim.</div>
        </article>
        <article class="sp-validation-card">
          <span class="tag">Evidence Queue</span>
          <h3>What still creates the most judge value</h3>
          <div class="sp-proof-queue">
            <article><i>01</i><div><b>1 real Cooperative/Admin feedback</b><small>Confirm operational pain + most useful SanPaid capability.</small></div></article>
            <article><i>02</i><div><b>2–5 worker/customer usability checks</b><small>Test clarity of Accept / Decline, trust and service-start steps.</small></div></article>
            <article><i>03</i><div><b>Pilot baseline before impact claims</b><small>Measure assignment time, booking success, SLA and opportunity distribution.</small></div></article>
          </div>
        </article>
      </div>
    </div>`;

    anchor.insertAdjacentElement('afterend', section);
    return section;
  }

  function wire(section) {
    if (!section) return;
    const panel = $('#spFailurePanel', section);
    $$('[data-sp-scenario]', section).forEach(button => {
      button.addEventListener('click', () => {
        const scenario = SCENARIOS.find(s => s.id === button.dataset.spScenario);
        if (!scenario || !panel) return;
        $$('[data-sp-scenario]', section).forEach(b => {
          const active = b === button;
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        panel.innerHTML = panelMarkup(scenario);
      });
    });
  }

  function addTruthStatus() {
    const prototypeList = $('#status .eval-truth-col.prototype ul');
    if (prototypeList && !prototypeList.querySelector('[data-sp-truth="failure"]')) {
      const li = document.createElement('li');
      li.dataset.spTruth = 'failure';
      li.textContent = 'Failure-Mode Demonstration';
      prototypeList.appendChild(li);
    }
    const impactNote = $('#impact .eval-impact-note');
    if (impactNote && !$('#impact [data-sp-validation-note]')) {
      const note = document.createElement('p');
      note.dataset.spValidationNote = 'true';
      note.className = 'eval-impact-note';
      note.textContent = 'Real cooperative/admin and worker/customer validation is still required before external pilot claims.';
      impactNote.insertAdjacentElement('afterend', note);
    }
  }

  function installReveal(section) {
    if (!section) return;
    const targets = $$('[data-reveal]', section);
    targets.forEach(node => node.classList.add('premium-reveal'));
    if (!('IntersectionObserver' in window) || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      targets.forEach(node => node.classList.add('premium-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('premium-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold:.12, rootMargin:'0px 0px -7% 0px' });
    targets.forEach(node => observer.observe(node));
  }

  function start() {
    if (!$('#landing')) return;
    const section = mount();
    wire(section);
    addTruthStatus();
    installReveal(section);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();