(() => {
  'use strict';

  const TOKEN_KEY = 'sanpaid_judge_demo_token_v1';
  let probeTimer = 0;
  let shellObserver = null;

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

  function loadHandoverEvidence() {
    ensureStylesheet('sanpaidHandoverEvidenceStyles', 'handover-evidence.css?v=20260902-1');
    ensureScript('sanpaidHandoverEvidenceScript', 'handover-evidence.js?v=20260902-1');
  }

  function token() {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }

  function role() {
    const shell = document.getElementById('sihJudgeShell');
    if (!shell || shell.classList.contains('judge-hidden')) return '';
    return String(window.SanPaidAuth?.getRole?.() || shell.dataset.adminRole || '').toUpperCase();
  }

  function summaryRoot() {
    return document.getElementById('adminCommandSummary') || document.querySelector('#judgeContent .judge-hero') || document.getElementById('judgeContent');
  }

  function removeNotice() {
    document.getElementById('adminServiceAvailabilityNotice')?.remove();
    document.body.classList.remove('admin-service-degraded');
  }

  function showNotice(message, kind = 'warning') {
    const root = summaryRoot();
    if (!root) return;
    let notice = document.getElementById('adminServiceAvailabilityNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'adminServiceAvailabilityNotice';
      notice.className = 'sp-service-unavailable';
      root.insertBefore(notice, root.firstChild);
    }
    notice.dataset.kind = kind;
    notice.innerHTML = `<div><strong>${kind === 'auth' ? 'Administrative access requires authorization' : 'Administrative service temporarily unavailable'}</strong><span>${message}</span></div><button type="button" class="btn secondary small" id="adminServiceRetry">Retry</button>`;
    notice.querySelector('#adminServiceRetry')?.addEventListener('click', () => probe(true), { once: true });
    document.body.classList.toggle('admin-service-degraded', kind !== 'auth');
  }

  async function request(path) {
    const headers = { Accept: 'application/json' };
    const currentToken = token();
    if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      return await fetch(path, {
        credentials: 'include',
        cache: 'no-store',
        headers,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function probe(force = false) {
    const currentRole = role();
    if (!['COOPERATIVE_ADMIN', 'FEDERATION_ADMIN'].includes(currentRole)) {
      removeNotice();
      return;
    }

    try {
      const path = currentRole === 'COOPERATIVE_ADMIN'
        ? '/api/cooperative-admin/workspace'
        : '/api/connected/health';
      const response = await request(path);
      if (response.ok) {
        removeNotice();
        if (force) window.SanPaidHandoverEvidence?.refresh?.();
        return;
      }
      if (response.status === 401 || response.status === 403) {
        showNotice('Your session does not currently authorize this administrative workspace. Sign in again with the correct role.', 'auth');
        return;
      }
      showNotice(`The connected administrative service returned HTTP ${response.status}. No synthetic operational data is being substituted.`);
    } catch (error) {
      const detail = error?.name === 'AbortError'
        ? 'The service health check timed out.'
        : 'The connected backend could not be reached.';
      showNotice(`${detail} Existing operational data is not replaced with demo records. Please retry when connectivity is restored.`);
    }
  }

  function schedule() {
    clearTimeout(probeTimer);
    probeTimer = setTimeout(() => probe(), 250);
  }

  function attachShellObserver() {
    const shell = document.getElementById('sihJudgeShell');
    if (!shell) {
      setTimeout(attachShellObserver, 300);
      return;
    }
    shellObserver?.disconnect();
    shellObserver = new MutationObserver(schedule);
    shellObserver.observe(shell, { attributes: true, attributeFilter: ['class', 'data-admin-role'] });
    schedule();
  }

  function start() {
    loadHandoverEvidence();
    attachShellObserver();
    window.addEventListener('online', schedule);
    window.addEventListener('pageshow', schedule);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    window.SanPaidAdminAvailability = { probe };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
