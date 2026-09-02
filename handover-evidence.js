(() => {
  'use strict';

  const TOKEN_KEY = 'sanpaid_judge_demo_token_v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const human = value => String(value || '—').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
  const fmtDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });
  };

  let activeComplaintId = 0;
  let refreshTimer = 0;
  let observer = null;
  let retryTimers = [];

  function token() {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }

  function role() {
    const shell = $('#sihJudgeShell');
    if (!shell || shell.classList.contains('judge-hidden')) return '';
    return String(window.SanPaidAuth?.getRole?.() || shell.dataset.adminRole || '').toUpperCase();
  }

  async function api(path) {
    const headers = { Accept:'application/json' };
    const currentToken = token();
    if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(path, { credentials:'include', cache:'no-store', headers, signal:controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.message || data.error || `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function truthPill(text = 'CONNECTED') {
    return `<span class="handover-truth-pill">${esc(text)}</span>`;
  }

  function ensureTrustPanel() {
    const section = $('#coop-workers');
    if (!section) return null;
    let panel = $('#coopTrustLifecycle', section);
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'coopTrustLifecycle';
    panel.className = 'handover-proof-panel';
    panel.innerHTML = `
      <div class="handover-proof-head">
        <div><span>WORKER TRUST LIFECYCLE</span><h4>Verification to current eligibility</h4></div>
        ${truthPill('CONNECTED')}
      </div>
      <p class="handover-proof-note">Identity, skill, documents and current availability remain separate controls. Training never auto-verifies a skill.</p>
      <div id="coopTrustLifecycleBody" class="handover-trust-grid"><div class="handover-loading">Loading connected trust evidence…</div></div>`;
    section.querySelector('.coop-section-head')?.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function renderTrust(data) {
    const panel = ensureTrustPanel();
    const root = $('#coopTrustLifecycleBody', panel || document);
    if (!root) return;
    const stages = Array.isArray(data?.stages) ? data.stages : [];
    if (!stages.length) {
      root.innerHTML = '<div class="handover-empty">No worker trust lifecycle records are available for this cooperative.</div>';
      return;
    }
    root.innerHTML = stages.map((stage, index) => {
      const total = Math.max(0, Number(stage.total || 0));
      const value = Math.max(0, Number(stage.value || 0));
      const ratio = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
      return `<article class="handover-trust-stage">
        <div class="handover-stage-top"><i>${index + 1}</i><span>${esc(stage.label)}</span><strong>${value}/${total}</strong></div>
        <div class="handover-progress" aria-label="${esc(stage.label)} ${ratio}%"><b style="width:${ratio}%"></b></div>
        <small>${esc(stage.rule || '')}</small>
      </article>`;
    }).join('');
  }

  function trustUnavailable(message) {
    const panel = ensureTrustPanel();
    const root = $('#coopTrustLifecycleBody', panel || document);
    if (root) root.innerHTML = `<div class="handover-unavailable"><b>Connected evidence unavailable</b><span>${esc(message)}</span><small>No synthetic worker records are substituted.</small></div>`;
  }

  function ensureComplaintPanel() {
    const section = $('#coop-complaints');
    if (!section) return null;
    let panel = $('#coopComplaintEvidence', section);
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'coopComplaintEvidence';
    panel.className = 'handover-proof-panel handover-complaint-panel';
    panel.innerHTML = `
      <div class="handover-proof-head handover-evidence-head">
        <div><span>COMPLAINT EVIDENCE TIMELINE</span><h4>Recorded grievance events and SLA escalation</h4></div>
        ${truthPill('CONNECTED')}
      </div>
      <div class="handover-evidence-toolbar">
        <label for="coopEvidenceComplaintSelect">Complaint</label>
        <select id="coopEvidenceComplaintSelect" disabled><option>Loading complaints…</option></select>
      </div>
      <div id="coopEvidenceComplaintMeta" class="handover-complaint-meta"></div>
      <div id="coopEvidenceTimeline" class="handover-timeline"><div class="handover-loading">Loading connected complaint evidence…</div></div>
      <p class="handover-proof-note">Only stored complaint events are shown. Missing events remain visibly missing; they are not reconstructed or fabricated.</p>`;
    section.querySelector('.coop-section-head')?.insertAdjacentElement('afterend', panel);
    $('#coopEvidenceComplaintSelect', panel)?.addEventListener('change', event => {
      const id = Number(event.target.value || 0);
      if (id > 0) loadComplaintEvidence(id);
    });
    return panel;
  }

  function renderComplaintMeta(complaint) {
    const root = $('#coopEvidenceComplaintMeta');
    if (!root) return;
    if (!complaint) {
      root.innerHTML = '';
      return;
    }
    root.innerHTML = `
      <article><span>Booking</span><b>${esc(complaint.bookingCode || `#${complaint.bookingId || '—'}`)}</b></article>
      <article><span>Status</span><b>${esc(human(complaint.status))}</b></article>
      <article><span>SLA Level</span><b>L${Number(complaint.escalationLevel || 0)}</b></article>
      <article><span>SLA</span><b>${complaint.slaBreached ? 'BREACHED' : 'WITHIN / NOT MARKED BREACHED'}</b></article>
      <article><span>Worker</span><b>${esc(complaint.workerName || '—')}</b></article>
      <article><span>Created</span><b>${esc(fmtDate(complaint.createdAt))}</b></article>`;
  }

  function renderTimeline(data) {
    renderComplaintMeta(data?.complaint || null);
    const root = $('#coopEvidenceTimeline');
    if (!root) return;
    const events = Array.isArray(data?.events) ? data.events : [];
    if (!events.length) {
      root.innerHTML = '<div class="handover-empty"><b>No recorded evidence events</b><span>This complaint currently has no stored complaint-event records. Nothing has been invented to fill the gap.</span></div>';
      return;
    }
    root.innerHTML = events.map(event => `
      <article class="handover-timeline-event">
        <div class="handover-event-dot"></div>
        <div class="handover-event-body">
          <div class="handover-event-top"><b>${esc(human(event.eventType))}</b><span>L${Number(event.escalationLevel || 0)}</span>${event.demoSimulation ? '<em>DEMO SIMULATION</em>' : ''}</div>
          <p>${esc(event.message || 'Recorded complaint event')}</p>
          <small>${esc(human(event.actorRole || 'SYSTEM'))} · ${esc(fmtDate(event.createdAt))}</small>
        </div>
      </article>`).join('');
  }

  function complaintUnavailable(message) {
    const panel = ensureComplaintPanel();
    const select = $('#coopEvidenceComplaintSelect', panel || document);
    if (select) {
      select.disabled = true;
      select.innerHTML = '<option>Connected evidence unavailable</option>';
    }
    const root = $('#coopEvidenceTimeline', panel || document);
    if (root) root.innerHTML = `<div class="handover-unavailable"><b>Complaint evidence unavailable</b><span>${esc(message)}</span><small>No synthetic timeline is substituted.</small></div>`;
    renderComplaintMeta(null);
  }

  async function loadComplaintEvidence(id) {
    activeComplaintId = id;
    const root = $('#coopEvidenceTimeline');
    if (root) root.innerHTML = '<div class="handover-loading">Loading stored complaint events…</div>';
    try {
      const data = await api(`/api/cooperative-admin/complaints/${encodeURIComponent(id)}/evidence`);
      if (activeComplaintId !== id) return;
      renderTimeline(data);
    } catch (error) {
      if (activeComplaintId !== id) return;
      complaintUnavailable(error.status === 404 ? 'This complaint is outside the authenticated cooperative scope or no longer exists.' : 'The connected evidence endpoint did not respond successfully.');
    }
  }

  async function loadComplaints() {
    const panel = ensureComplaintPanel();
    const select = $('#coopEvidenceComplaintSelect', panel || document);
    try {
      const rows = await api('/api/cooperative-admin/complaints');
      const complaints = Array.isArray(rows) ? rows : [];
      if (!select) return;
      if (!complaints.length) {
        select.disabled = true;
        select.innerHTML = '<option>No complaints recorded</option>';
        renderComplaintMeta(null);
        const root = $('#coopEvidenceTimeline');
        if (root) root.innerHTML = '<div class="handover-empty"><b>No complaint records</b><span>No local complaint exists in the connected cooperative scope.</span></div>';
        return;
      }
      select.disabled = false;
      select.innerHTML = complaints.slice(0, 40).map(item => `<option value="${Number(item.id)}">${esc(item.bookingCode || `Complaint #${item.id}`)} · ${esc(human(item.status))}</option>`).join('');
      const firstId = Number(complaints[0].id);
      select.value = String(firstId);
      await loadComplaintEvidence(firstId);
    } catch (error) {
      complaintUnavailable(error.status === 401 || error.status === 403 ? 'Administrative authorization is required.' : 'The connected complaint list could not be loaded.');
    }
  }

  function formalizeVisibleAdminLabels() {
    const shell = $('#sihJudgeShell');
    if (!shell || shell.classList.contains('judge-hidden')) return;
    const targets = [
      ...shell.querySelectorAll('.judge-top small,.judge-hero .judge-badge,.coop-side-foot span,.fed-side-foot span,[data-judge-tab="golden"],[data-judge-tab="control"]')
    ];
    for (const node of targets) {
      const text = String(node.textContent || '');
      const next = text
        .replace(/SIH\s*2026/gi, 'Prototype Environment')
        .replace(/Golden\s*Demo/gi, 'System Verification')
        .replace(/Demo\s*Control/gi, 'Controlled Test')
        .replace(/Judge\s*Mode/gi, 'Administration Workspace');
      if (next !== text) node.textContent = next;
    }
  }

  async function refresh() {
    if (role() !== 'COOPERATIVE_ADMIN') {
      formalizeVisibleAdminLabels();
      return;
    }
    formalizeVisibleAdminLabels();
    ensureTrustPanel();
    ensureComplaintPanel();
    try {
      renderTrust(await api('/api/cooperative-admin/trust-lifecycle'));
    } catch (error) {
      trustUnavailable(error.status === 401 || error.status === 403 ? 'Administrative authorization is required.' : 'The connected trust lifecycle endpoint did not respond successfully.');
    }
    await loadComplaints();
  }

  function schedule(delay = 450) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, delay);
  }

  function scheduleRetries() {
    retryTimers.forEach(clearTimeout);
    retryTimers = [0, 280, 850, 1700].map(delay => setTimeout(() => schedule(0), delay));
  }

  function attach() {
    const shell = $('#sihJudgeShell');
    if (!shell) {
      setTimeout(attach, 350);
      return;
    }
    observer?.disconnect();
    observer = new MutationObserver(scheduleRetries);
    observer.observe(shell, { attributes:true, attributeFilter:['class','data-admin-role'] });
    scheduleRetries();
  }

  function start() {
    attach();
    window.addEventListener('online', scheduleRetries);
    window.addEventListener('pageshow', scheduleRetries);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRetries(); });
    document.addEventListener('click', event => {
      if (event.target.closest?.('[data-spu-role],#spuLoginSubmit,#getStarted,#coopLogin,[data-judge-role]')) scheduleRetries();
    }, true);
    window.SanPaidHandoverEvidence = { refresh };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
