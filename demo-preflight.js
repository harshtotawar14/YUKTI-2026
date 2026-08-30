(() => {
  'use strict';

  const PREFLIGHT_TIMEOUT_MS = 6000;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function injectStyles() {
    if (document.getElementById('sanpaidDemoPreflightStyles')) return;
    const style = document.createElement('style');
    style.id = 'sanpaidDemoPreflightStyles';
    style.textContent = `
      .demo-preflight{padding-top:28px!important;padding-bottom:28px!important;background:#f7fafc}
      .demo-preflight-card{border:1px solid #dbe5ef;border-radius:18px;background:#fff;box-shadow:0 16px 38px -32px rgba(11,25,48,.45);padding:22px}
      .demo-preflight-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:16px}
      .demo-preflight-head h2{margin:4px 0 6px;font-size:clamp(22px,3vw,30px);color:#0b1930}
      .demo-preflight-head p{margin:0;color:#5d7085;max-width:760px;line-height:1.6}
      .demo-preflight-status{flex:0 0 auto;display:inline-flex;align-items:center;min-height:34px;padding:7px 11px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.05em;border:1px solid #cfdbe7;background:#f4f7fa;color:#53657a}
      .demo-preflight-status.ready{border-color:#b9e4cd;background:#eef9f3;color:#17623f}
      .demo-preflight-status.blocked{border-color:#f0c8c8;background:#fff3f3;color:#8b2d2d}
      .demo-preflight-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .demo-preflight-check{display:flex;gap:10px;align-items:flex-start;border:1px solid #e3eaf1;border-radius:13px;padding:12px;background:#fbfcfe}
      .demo-preflight-check strong{display:block;color:#13273f;font-size:13px;margin-bottom:3px}
      .demo-preflight-check small{display:block;color:#6c7f93;line-height:1.4}
      .demo-preflight-dot{width:9px;height:9px;border-radius:50%;margin-top:4px;flex:0 0 9px;background:#aab7c5;box-shadow:0 0 0 4px rgba(170,183,197,.12)}
      .demo-preflight-check.ok .demo-preflight-dot{background:#2fbd7a;box-shadow:0 0 0 4px rgba(47,189,122,.12)}
      .demo-preflight-check.fail .demo-preflight-dot{background:#dc5b5b;box-shadow:0 0 0 4px rgba(220,91,91,.12)}
      .demo-preflight-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px}
      .demo-preflight-note{margin:14px 0 0;padding-top:13px;border-top:1px solid #edf1f5;color:#718297;font-size:12px;line-height:1.55}
      .demo-preflight-time{color:#7a8999;font-size:11px;margin-left:auto}

      /* Final desktop hero composition. Loaded after the legacy polish layer so this is authoritative. */
      @media (min-width:1180px){
        #landing .eval-nav .navin{
          max-width:1240px!important;
          height:62px!important;
        }
        #landing .eval-nav .navlinks{gap:24px!important}
        #landing #home.eval-hero{padding:32px 0 0!important}
        #landing #home .eval-hero-grid{
          width:min(1240px,calc(100% - 48px))!important;
          max-width:1240px!important;
          grid-template-columns:minmax(0,1fr) 480px!important;
          gap:38px!important;
          align-items:start!important;
        }
        #landing #home .eval-hero-copy{
          width:100%!important;
          max-width:none!important;
          padding-top:2px!important;
        }
        #landing #home .eval-badge{
          margin:0!important;
          padding:6px 10px!important;
          font-size:9.5px!important;
        }
        #landing #home h1{
          max-width:none!important;
          margin:13px 0 12px!important;
          font-size:50px!important;
          line-height:1.015!important;
          letter-spacing:-.045em!important;
          white-space:nowrap!important;
        }
        #landing #home .lead{
          max-width:700px!important;
          font-size:14.5px!important;
          line-height:1.5!important;
        }
        #landing #home .hero-master-flow{
          margin-top:14px!important;
          gap:6px!important;
          flex-wrap:nowrap!important;
        }
        #landing #home .hero-master-flow span{
          padding:5px 8px!important;
          font-size:9.8px!important;
        }
        #landing #home .hero-ctas{
          margin:15px 0 6px!important;
          gap:9px!important;
          flex-wrap:nowrap!important;
        }
        #landing #home .hero-ctas .btn{
          min-height:40px!important;
          padding:8px 13px!important;
          font-size:10.2px!important;
        }
        #landing #home .hero-ctas .btn.primary{min-width:170px!important}
        #landing #home .hero-ctas .btn.secondary{min-width:165px!important}
        #landing #home #selectorResearchBtn{
          min-width:0!important;
          padding-left:8px!important;
          padding-right:4px!important;
          font-size:10.2px!important;
          color:#435f74!important;
          opacity:1!important;
        }
        #landing #home .eval-hero-principle{
          margin-top:6px!important;
          font-size:9.6px!important;
        }
        #landing #home .selector-home-note{margin-top:4px!important}
        #landing #home .selector-proof-line{
          font-size:9.5px!important;
          color:#5f7485!important;
        }

        #landing .eval-hero-system{
          width:100%!important;
          max-width:480px!important;
          justify-self:end!important;
          padding:14px!important;
          border-radius:20px!important;
          box-shadow:0 18px 48px rgba(28,55,77,.09)!important;
        }
        #landing .eval-system-top{margin-bottom:8px!important}
        #landing .eval-mini-request{padding:8px 10px!important}
        #landing .eval-mini-request b{font-size:11.5px!important}
        #landing .eval-mini-workers{margin:7px 0!important;gap:6px!important}
        #landing .hero-worker{min-height:39px!important}
        #landing .eval-mini-gate{padding:7px!important;gap:4px!important}
        #landing .eval-mini-gate strong{font-size:14px!important}
        #landing .eval-mini-rank{margin-top:6px!important;padding:7px!important}
        #landing .eval-mini-rank span{padding:5px!important;font-size:8.8px!important}
        #landing .eval-mini-offer{margin-top:6px!important;padding:7px 9px!important}
        #landing .eval-mini-offer b{margin:2px 0 4px!important;font-size:10px!important}
        #landing .eval-mini-audit{margin-top:6px!important;padding:7px 9px!important}
        #landing .eval-system-progress{margin-top:7px!important}

        #landing #home>.eval-trust{
          margin-top:22px!important;
          background:#f8fbfc!important;
        }
        #landing #home>.eval-trust .trustin{
          max-width:1240px!important;
          min-height:42px!important;
          gap:14px!important;
        }
        #landing #home>.eval-trust span{
          font-size:10px!important;
        }
      }

      @media (min-width:1180px) and (max-width:1320px){
        #landing #home .eval-hero-grid{
          width:min(1160px,calc(100% - 40px))!important;
          grid-template-columns:minmax(0,1fr) 445px!important;
          gap:30px!important;
        }
        #landing #home h1{font-size:46px!important}
        #landing .eval-hero-system{max-width:445px!important}
      }

      @media (min-width:961px) and (max-width:1179px){
        #landing #home h1{white-space:normal!important}
      }

      @media(max-width:900px){.demo-preflight-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:600px){.demo-preflight{padding-top:18px!important;padding-bottom:18px!important}.demo-preflight-card{padding:16px}.demo-preflight-head{display:grid}.demo-preflight-grid{grid-template-columns:1fr}.demo-preflight-status{justify-self:start}.demo-preflight-actions{display:grid}.demo-preflight-actions .btn{width:100%}.demo-preflight-time{margin-left:0;text-align:center}}
    `;
    document.head.appendChild(style);
  }

  async function healthCheck() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PREFLIGHT_TIMEOUT_MS);
    try {
      const response = await fetch('/api/connected/health', {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      return {
        ok: Boolean(response.ok && data?.ok !== false),
        status: response.status,
        database: data?.database ?? data?.db ?? null
      };
    } catch (error) {
      return { ok: false, status: 0, error: error?.name === 'AbortError' ? 'Health check timed out' : 'Backend unavailable' };
    } finally {
      clearTimeout(timer);
    }
  }

  function moduleState() {
    return {
      selector: Boolean(window.SanPaidSelectorMode?.open),
      connected: Boolean(window.ConnectedSanPaid?.open),
      judge: Boolean(window.SanPaidJudgeMode?.open)
    };
  }

  function checkMarkup(label, ok, detail) {
    return `<div class="demo-preflight-check ${ok ? 'ok' : 'fail'}"><span class="demo-preflight-dot"></span><div><strong>${esc(label)}</strong><small>${esc(detail)}</small></div></div>`;
  }

  function mount() {
    if (document.getElementById('demoReadiness')) return document.getElementById('demoReadiness');
    const anchor = document.getElementById('guidedDemo') || document.getElementById('architecture') || document.getElementById('status');
    if (!anchor) return null;

    const section = document.createElement('section');
    section.id = 'demoReadiness';
    section.className = 'section demo-preflight';
    section.innerHTML = `
      <div class="wrap">
        <div class="demo-preflight-card">
          <div class="demo-preflight-head">
            <div>
              <span class="tag">Golden Demo Preflight</span>
              <h2>Verify the connected demo before presenting.</h2>
              <p>This check verifies the browser modules and the live connected-backend health endpoint. It does not invent pilot, stakeholder, payment-provider or production-KYC readiness.</p>
            </div>
            <span id="demoPreflightStatus" class="demo-preflight-status">CHECKING…</span>
          </div>
          <div id="demoPreflightChecks" class="demo-preflight-grid" aria-live="polite"></div>
          <div class="demo-preflight-actions">
            <button class="btn primary" type="button" id="demoPreflightRun">Recheck Demo</button>
            <button class="btn secondary" type="button" id="demoPreflightOpen">Open Working Prototype</button>
            <span id="demoPreflightTime" class="demo-preflight-time"></span>
          </div>
          <p class="demo-preflight-note"><b>Truth rule:</b> “Core Demo Ready” means this frontend and <code>/api/connected/health</code> passed now. It does not guarantee demo-account seed state or external third-party integrations unless those are separately verified.</p>
        </div>
      </div>`;
    anchor.insertAdjacentElement('afterend', section);

    section.querySelector('#demoPreflightRun').addEventListener('click', run);
    section.querySelector('#demoPreflightOpen').addEventListener('click', () => window.ConnectedSanPaid?.open?.());
    return section;
  }

  async function run() {
    const section = mount();
    if (!section) return;
    const status = section.querySelector('#demoPreflightStatus');
    const checks = section.querySelector('#demoPreflightChecks');
    const runButton = section.querySelector('#demoPreflightRun');
    const time = section.querySelector('#demoPreflightTime');

    status.className = 'demo-preflight-status';
    status.textContent = 'CHECKING…';
    runButton.disabled = true;
    checks.innerHTML = checkMarkup('Browser Network', navigator.onLine, navigator.onLine ? 'Browser reports online' : 'Browser reports offline');

    const modules = moduleState();
    const health = await healthCheck();
    const modulesOk = modules.selector && modules.connected && modules.judge;
    const allReady = navigator.onLine && modulesOk && health.ok;

    checks.innerHTML = [
      checkMarkup('Browser Network', navigator.onLine, navigator.onLine ? 'Online' : 'Offline'),
      checkMarkup('Guided Demo', modules.selector, modules.selector ? 'Selector Mode loaded' : 'Selector Mode missing'),
      checkMarkup('Connected + Judge UI', modules.connected && modules.judge, modules.connected && modules.judge ? 'Connected Demo and Judge Mode loaded' : 'One or more proof modules are missing'),
      checkMarkup('Shared Backend', health.ok, health.ok ? `Health endpoint reachable${health.database ? ` · DB: ${health.database}` : ''}` : (health.error || `Health endpoint returned ${health.status || 'an error'}`))
    ].join('');

    status.textContent = allReady ? 'CORE DEMO READY' : 'DEMO CHECK NEEDED';
    status.className = `demo-preflight-status ${allReady ? 'ready' : 'blocked'}`;
    time.textContent = `Checked ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}`;
    runButton.disabled = false;
  }

  function install() {
    injectStyles();
    if (!mount()) return;
    setTimeout(run, 120);
    window.addEventListener('online', run);
    window.addEventListener('offline', run);
  }

  window.SanPaidDemoPreflight = { run };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();