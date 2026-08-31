(() => {
  'use strict';

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const wait = ms => new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : ms));

  const ICONS = {
    signal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M11 18.5a2 2 0 0 1 2 0"/><path d="M4 4l16 16"/></svg>',
    welfare: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z"/><path d="M9 12h6M12 9v6"/></svg>',
    chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/><path d="m4 8 6-4 6 8 5-4"/></svg>'
  };

  function makeSection() {
    if ($('#researchBackedUpgrades')) return $('#researchBackedUpgrades');
    const anchor = $('#intelligence');
    if (!anchor) return null;

    const section = document.createElement('section');
    section.id = 'researchBackedUpgrades';
    section.className = 'section sp-research-upgrades';
    section.innerHTML = `
      <div class="wrap">
        <div class="head" data-reveal>
          <span class="tag">09A — Field Resilience &amp; Welfare Readiness</span>
          <h2>Design for real field conditions, not only ideal connectivity.</h2>
          <p>Three research-backed additions strengthen SanPaid without overstating prototype maturity: fallback communication, worker-welfare readiness and synthetic-data forecasting proof.</p>
        </div>

        <div class="sp-upgrade-grid">
          <article class="sp-upgrade-card" data-reveal>
            <div class="sp-upgrade-head">
              <span class="sp-upgrade-icon">${ICONS.signal}</span>
              <span class="sp-proof-badge demo">Prototype Demo</span>
            </div>
            <h3>SMS / Offline Fallback</h3>
            <p>If the worker app loses connectivity, the booking state should remain preserved and a fallback communication path can be used for critical OTP / job-status continuity.</p>
            <div class="sp-proof-flow" id="spFallbackFlow">
              <div class="sp-proof-step" data-fallback-step="0"><i>01</i><div><b>App Session</b><small>Worker booking state active</small></div><span class="sp-step-state">READY</span></div>
              <div class="sp-proof-step" data-fallback-step="1"><i>02</i><div><b>Connectivity Loss</b><small>Fallback condition detected</small></div><span class="sp-step-state">WAITING</span></div>
              <div class="sp-proof-step" data-fallback-step="2"><i>03</i><div><b>SMS / OTP Fallback</b><small>Demo communication route</small></div><span class="sp-step-state">WAITING</span></div>
              <div class="sp-proof-step" data-fallback-step="3"><i>04</i><div><b>State Preserved</b><small>Booking + audit context retained</small></div><span class="sp-step-state">WAITING</span></div>
            </div>
            <div class="sp-proof-actions"><button class="btn primary" type="button" id="spRunFallback">RUN FALLBACK DEMO</button></div>
            <div class="sp-proof-result" id="spFallbackResult">No real SMS is sent. This interaction demonstrates the resilience logic only.</div>
          </article>

          <article class="sp-upgrade-card" data-reveal>
            <div class="sp-upgrade-head">
              <span class="sp-upgrade-icon">${ICONS.welfare}</span>
              <span class="sp-proof-badge future">Future Authorized Integration</span>
            </div>
            <h3>Worker Welfare Readiness</h3>
            <p>SanPaid can keep welfare visibility connected to verified work records while leaving scheme rules, contribution policy and insurance integration under authorized cooperative control.</p>
            <div class="sp-welfare-chain">
              <div class="sp-welfare-node"><small>Work Record</small><b>Verified completed service</b></div><i>→</i>
              <div class="sp-welfare-node"><small>Cooperative Policy</small><b>Approved welfare / insurance rule</b></div><i>→</i>
              <div class="sp-welfare-node"><small>Worker View</small><b>Eligibility &amp; benefit status</b></div>
            </div>
            <div class="sp-welfare-note"><b>Truth rule:</b> no production insurance, welfare-wallet funding or government-scheme integration is claimed in the current prototype.</div>
            <div class="sp-proof-actions"><button class="btn secondary" type="button" id="spOpenWorkerFlow">VIEW WORKER FLOW</button></div>
          </article>

          <article class="sp-upgrade-card" data-reveal>
            <div class="sp-upgrade-head">
              <span class="sp-upgrade-icon">${ICONS.chart}</span>
              <span class="sp-proof-badge synthetic">Synthetic Data</span>
            </div>
            <h3>Synthetic Forecast Proof</h3>
            <p>Because real cooperative history is not yet available, the prototype can demonstrate the forecasting pipeline with synthetic demand scenarios before any production ML claim is made.</p>
            <div class="sp-forecast-meta"><span>Browser-generated scenario</span><span>Baseline first</span><span>No accuracy claim</span></div>
            <div class="sp-forecast-chart" id="spForecastChart" aria-label="Synthetic monthly demand scenario"></div>
            <div class="sp-forecast-legend"><span><i></i> Synthetic baseline</span><span><i></i> Forecast window</span></div>
            <div class="sp-proof-actions"><button class="btn secondary" type="button" id="spRegenerateForecast">REGENERATE SYNTHETIC SCENARIO</button></div>
            <div class="sp-proof-result" id="spForecastResult">Synthetic scenario only · production forecasting requires authorized historical cooperative data.</div>
          </article>
        </div>

        <div class="sp-upgrade-truth" data-reveal><b>Evaluator truth:</b> these additions improve field-readiness and research alignment while preserving the rule: IMPLEMENTED, PROTOTYPE-DEMO and FUTURE INTEGRATION are shown separately.</div>
      </div>`;

    anchor.insertAdjacentElement('afterend', section);
    return section;
  }

  async function runFallbackDemo() {
    const button = $('#spRunFallback');
    const result = $('#spFallbackResult');
    const steps = $$('#spFallbackFlow [data-fallback-step]');
    if (!button || !steps.length) return;

    button.disabled = true;
    button.textContent = 'SIMULATING FALLBACK…';
    steps.forEach((step, index) => {
      step.classList.remove('active', 'done');
      const state = $('.sp-step-state', step);
      if (state) state.textContent = index === 0 ? 'READY' : 'WAITING';
    });
    if (result) {
      result.className = 'sp-proof-result';
      result.textContent = 'Simulating app connectivity loss. No external SMS provider is being called.';
    }

    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      const state = $('.sp-step-state', step);
      step.classList.add('active');
      if (state) state.textContent = i === 0 ? 'ACTIVE' : 'CHECKING';
      await wait(i === 0 ? 260 : 520);
      step.classList.remove('active');
      step.classList.add('done');
      if (state) state.textContent = 'DONE';
    }

    if (result) {
      result.className = 'sp-proof-result good';
      result.textContent = 'Prototype result: booking context preserved → fallback route demonstrated → audit continuity retained.';
    }
    button.disabled = false;
    button.textContent = 'RERUN FALLBACK DEMO';
  }

  function syntheticSeries(seedShift = 0) {
    const now = Date.now();
    const seed = (Math.floor(now / 1000) + seedShift * 97) % 997;
    const values = [];
    for (let i = 0; i < 12; i += 1) {
      const seasonal = 48 + Math.sin((i / 12) * Math.PI * 2 - .8) * 15;
      const trend = i * 2.1;
      const noise = (((seed + i * 37) % 17) - 8) * 1.15;
      values.push(Math.max(22, Math.round(seasonal + trend + noise)));
    }
    return values;
  }

  function renderForecast(regeneration = 0) {
    const chart = $('#spForecastChart');
    const result = $('#spForecastResult');
    if (!chart) return;
    const values = syntheticSeries(regeneration);
    const max = Math.max(...values) * 1.08;
    const labels = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    chart.innerHTML = values.map((value, index) => {
      const height = Math.max(18, Math.round((value / max) * 100));
      return `<span class="sp-forecast-bar ${index >= 9 ? 'forecast' : ''}" style="--h:${height}%;--delay:${index * 34}ms" data-label="${labels[index]}" title="Synthetic demand index ${value}"></span>`;
    }).join('');
    const baseline = Math.round(values.slice(0, 9).reduce((a, b) => a + b, 0) / 9);
    const forecast = Math.round(values.slice(9).reduce((a, b) => a + b, 0) / 3);
    if (result) {
      result.className = 'sp-proof-result';
      result.textContent = `Synthetic scenario · baseline demand index ${baseline} → forecast-window index ${forecast}. No real cooperative data or prediction accuracy claimed.`;
    }
  }

  function strengthenPrototypeTruth() {
    const prototypeList = $('#status .eval-truth-col.prototype ul');
    if (prototypeList && !prototypeList.querySelector('[data-sp-truth="fallback"]')) {
      const fallback = document.createElement('li');
      fallback.dataset.spTruth = 'fallback';
      fallback.textContent = 'SMS / Offline Fallback Simulation';
      prototypeList.appendChild(fallback);
      const synthetic = document.createElement('li');
      synthetic.dataset.spTruth = 'synthetic';
      synthetic.textContent = 'Synthetic Forecast Scenario';
      prototypeList.appendChild(synthetic);
    }

    const futureList = $('#status .eval-truth-col.future ul');
    if (futureList) {
      const insurance = Array.from(futureList.children).find(li => /Insurance\s*\/\s*Welfare/i.test(li.textContent));
      if (insurance) insurance.textContent = 'Production Welfare / Insurance Integration';
    }
  }

  function strengthenArchitecture() {
    const integrationRow = $('#architecture .eval-arch-layer:last-of-type div');
    if (integrationRow && !integrationRow.querySelector('[data-sp-arch="sms"]')) {
      const sms = document.createElement('span');
      sms.dataset.spArch = 'sms';
      sms.textContent = 'SMS / OTP Fallback';
      integrationRow.appendChild(sms);
      const welfare = document.createElement('span');
      welfare.dataset.spArch = 'welfare';
      welfare.textContent = 'Welfare / Insurance';
      integrationRow.appendChild(welfare);
    }

    const intelligence = $('#architecture .eval-architecture-preview aside');
    if (intelligence && !intelligence.querySelector('[data-sp-arch="synthetic"]')) {
      const synthetic = document.createElement('span');
      synthetic.dataset.spArch = 'synthetic';
      synthetic.textContent = 'Synthetic Data Sandbox';
      intelligence.appendChild(synthetic);
    }
  }

  function installReveal(section) {
    if (!section || reduceMotion || !('IntersectionObserver' in window)) return;
    const targets = $$('[data-reveal]', section);
    targets.forEach(node => node.classList.add('premium-reveal'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('premium-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    targets.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index, 3) * 70}ms`;
      observer.observe(node);
    });
  }

  function wireEvents() {
    $('#spRunFallback')?.addEventListener('click', runFallbackDemo);
    $('#spOpenWorkerFlow')?.addEventListener('click', () => {
      if (window.ConnectedSanPaid?.open) window.ConnectedSanPaid.open('WORKER_A');
      else window.SanPaidDemo?.showRoles?.();
    });
    let generation = 0;
    $('#spRegenerateForecast')?.addEventListener('click', () => {
      generation += 1;
      renderForecast(generation);
    });
  }

  function start() {
    if (!$('#landing')) return;
    const section = makeSection();
    if (!section) return;
    strengthenPrototypeTruth();
    strengthenArchitecture();
    renderForecast();
    wireEvents();
    installReveal(section);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
