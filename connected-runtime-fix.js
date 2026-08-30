(() => {
  'use strict';

  const BACKEND = 'https://sanpaid-sih-2026.onrender.com';
  const TOKEN_KEY = 'sanpaid_connected_demo_token_v1';
  const DEMO_EMAILS = new Set([
    'customer.connected@sanpaid.demo',
    'worker1.connected@sanpaid.demo',
    'worker2.connected@sanpaid.demo'
  ]);
  const LANG = { mr: 'mr-IN', hi: 'hi-IN', en: 'en-IN' };
  const nativeFetch = window.fetch.bind(window);
  let backendOnline = false;

  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function setToken(value) {
    try {
      if (value) sessionStorage.setItem(TOKEN_KEY, value);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
  function rawUrl(input) { return typeof input === 'string' ? input : (input?.url || ''); }
  function parseBody(init) {
    try { return typeof init?.body === 'string' ? JSON.parse(init.body) : {}; }
    catch { return {}; }
  }
  function direct(path) { return `${BACKEND}${path}`; }

  // Connected SIH demo transport:
  // - demo auth goes directly to Render, bypassing Vercel proxy rate limits
  // - short-lived demo session token is kept only in sessionStorage
  // - all /api/connected calls use Authorization: Bearer <token>
  // Normal SanPaid API calls are untouched.
  window.fetch = async function sanPaidConnectedFetch(input, init = {}) {
    const url = rawUrl(input);
    let target = '';
    let isDemoLogin = false;
    let isDemoLogout = false;

    if (url === '/api/auth/login') {
      const payload = parseBody(init);
      const identifier = String(payload.identifier || '').trim().toLowerCase();
      if (DEMO_EMAILS.has(identifier)) {
        target = direct('/api/connected/auth/login');
        isDemoLogin = true;
      }
    } else if (url === '/api/auth/me') {
      // Connected demo should never depend on an unrelated same-origin cookie.
      target = direct('/api/connected/auth/me');
    } else if (url === '/api/auth/logout') {
      target = direct('/api/connected/auth/logout');
      isDemoLogout = true;
    } else if (url.startsWith('/api/connected/')) {
      target = direct(url);
    }

    if (!target) return nativeFetch(input, init);

    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
    const token = getToken();
    if (!isDemoLogin && token) headers.set('Authorization', `Bearer ${token}`);

    const response = await nativeFetch(target, {
      ...init,
      headers,
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-store'
    });

    if (isDemoLogin && response.ok) {
      try {
        const data = await response.clone().json();
        if (data?.demoToken) setToken(data.demoToken);
      } catch {}
    }
    if (isDemoLogout && response.ok) setToken('');
    return response;
  };

  // Replace long-lived SSE only for this demo page with a small polling
  // adapter that implements the EventSource methods used by connected-demo.js.
  // This avoids reconnect storms through Vercel rewrites.
  class PollingEventSource {
    constructor() {
      this.listeners = new Map();
      this.onerror = null;
      this.readyState = 0;
      this.closed = false;
      this.timer = null;
      this.tick = this.tick.bind(this);
      setTimeout(this.tick, 120);
      this.timer = setInterval(this.tick, 3000);
    }
    addEventListener(type, handler) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(handler);
    }
    removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
    emit(type, payload) {
      const event = { type, data: JSON.stringify(payload) };
      this.listeners.get(type)?.forEach(fn => { try { fn(event); } catch {} });
    }
    async tick() {
      if (this.closed || !getToken()) return;
      try {
        const response = await window.fetch('/api/connected/snapshot', { method: 'GET' });
        if (!response.ok) throw new Error(`snapshot_${response.status}`);
        const snapshot = await response.json();
        this.readyState = 1;
        this.emit('snapshot', snapshot);
        const top = document.getElementById('connectedTopStatus');
        if (top) {
          top.textContent = '● Backend + Live Polling';
          top.style.color = '#8ee2b5';
        }
      } catch (error) {
        this.readyState = 0;
        if (typeof this.onerror === 'function') {
          try { this.onerror(error); } catch {}
        }
      }
    }
    close() {
      this.closed = true;
      this.readyState = 2;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
  }

  window.EventSource = PollingEventSource;
  window.SanPaidConnectedTransport = {
    backend: BACKEND,
    mode: 'DIRECT_RENDER_BEARER_POLLING',
    clearSession: () => setToken('')
  };

  function speak(text, shortLang = 'en') {
    if (!text || !('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text).trim());
    utterance.lang = LANG[shortLang] || LANG.en;
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function inferSummaryLanguage(text = '') {
    if (/आपको|क्षेत्र|जॉब रिक्वेस्ट/.test(text)) return 'hi';
    if (/तुम्हाला|परिसर|जॉब रिक्वेस्ट/.test(text)) return 'mr';
    return 'en';
  }

  function structuredSummaryOnly(text = '') {
    const markers = ['ग्राहक की रिक्वेस्ट:', 'ग्राहकाची विनंती:', 'Customer request:'];
    const clean = String(text).trim();
    for (const marker of markers) {
      const i = clean.indexOf(marker);
      if (i >= 0) return clean.slice(0, i).trim();
    }
    return clean;
  }

  function requestLanguageFromCard(card) {
    const label = card?.querySelector('details summary')?.textContent || '';
    const match = label.match(/\((mr|hi|en)\)/i);
    return match ? match[1].toLowerCase() : 'en';
  }

  function setTextIfChanged(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }
  function setStyleIfChanged(node, prop, value) {
    if (node && node.style[prop] !== value) node.style[prop] = value;
  }

  function setStatusRow(label, badgeText, detail, tone = 'orange') {
    document.querySelectorAll('#status tbody tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      if (!cells.length || !cells[0].textContent.includes(label)) return;
      const badge = cells[1]?.querySelector('.badge');
      const className = `badge ${tone === 'green' ? 'b-green' : tone === 'purple' ? 'b-purple' : 'b-orange'}`;
      if (badge) {
        setTextIfChanged(badge, badgeText);
        if (badge.className !== className) badge.className = className;
      }
      if (detail && cells[2]) setTextIfChanged(cells[2], detail);
    });
  }

  function syncLandingTruth(online) {
    backendOnline = online;
    if (online) {
      setStatusRow('Connected two-device booking', 'BACKEND CONNECTED', 'Shared PostgreSQL booking, worker-scoped offer, Accept/Reject fallback and authenticated live polling', 'green');
      setStatusRow('Eligibility-first matching', 'CONNECTED DEMO', 'Verified/available/skill-verified workers are gated before deterministic ranking', 'green');
      setStatusRow('Worker accept/reject', 'BACKEND CONNECTED', 'Atomic offer response; Reject creates next eligible worker offer with same booking context', 'green');
      setStatusRow('Dual service-start verification', 'CONNECTED SANDBOX', 'Backend-enforced arrival → sandbox identity → one-time token → customer confirmation → service-start lock', 'orange');
      setStatusRow('Payment & invoice', 'CONNECTED SANDBOX', 'Approved extra work + sandbox payment + persisted invoice + rating flow', 'orange');
      setStatusRow('PostgreSQL backend', 'CONNECTED', 'Shared SanPaid PostgreSQL backend is reachable directly from this deployment', 'green');
    } else {
      const pending = 'Connected backend is temporarily unreachable. Retry after the network/backend connection is restored.';
      setStatusRow('Connected two-device booking', 'BACKEND OFFLINE', pending, 'orange');
      setStatusRow('Eligibility-first matching', 'SOURCE READY', 'Eligibility and deterministic ranking remain implemented in source/database.', 'orange');
      setStatusRow('Worker accept/reject', 'BACKEND OFFLINE', pending, 'orange');
      setStatusRow('Dual service-start verification', 'SANDBOX · OFFLINE', pending, 'orange');
      setStatusRow('Payment & invoice', 'SANDBOX · OFFLINE', pending, 'orange');
      setStatusRow('PostgreSQL backend', 'OFFLINE', pending, 'orange');
    }
  }

  async function checkConnectedHealth() {
    try {
      const r = await window.fetch('/api/connected/health', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      syncLandingTruth(Boolean(r.ok && d?.ok));
    } catch {
      syncLandingTruth(false);
    }
  }

  function syncConnectedShellTruth() {
    const top = document.getElementById('connectedTopStatus');
    if (!top) return;
    const offline = /not reachable|unavailable|offline/i.test(top.textContent || '');
    const targetText = offline ? 'BACKEND OFFLINE' : 'CONNECTED BACKEND';
    const targetColor = offline ? '#9a5b00' : '#176b46';
    const targetBackground = offline ? '#fff6e8' : '#eaf8f1';
    const targetBorder = offline ? '#f0d29d' : '#c4e8d5';
    document.querySelectorAll('#connectedShell .connected-badge').forEach(badge => {
      if (!/CONNECTED BACKEND|DEPLOYMENT PENDING|BACKEND OFFLINE/.test(badge.textContent || '')) return;
      setTextIfChanged(badge, targetText);
      setStyleIfChanged(badge, 'color', targetColor);
      setStyleIfChanged(badge, 'background', targetBackground);
      setStyleIfChanged(badge, 'borderColor', targetBorder);
    });
  }

  document.addEventListener('click', event => {
    const originalBtn = event.target.closest?.('[data-listen-original]');
    if (originalBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = originalBtn.closest('[data-offer]');
      const original = card?.querySelector('details .transcript')?.textContent?.replace(/[“”]/g, '').trim() || '';
      speak(original, requestLanguageFromCard(card));
      return;
    }

    const summaryBtn = event.target.closest?.('[data-listen-offer]');
    if (summaryBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = summaryBtn.closest('[data-offer]');
      const displayed = card?.querySelector('.connected-voice > .transcript')?.textContent || '';
      const summary = structuredSummaryOnly(displayed);
      speak(summary, inferSummaryLanguage(summary));
    }
  }, true);

  let observerScheduled = false;
  const observer = new MutationObserver(() => {
    if (observerScheduled) return;
    observerScheduled = true;
    requestAnimationFrame(() => {
      observerScheduled = false;
      syncConnectedShellTruth();
    });
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    checkConnectedHealth();
    window.addEventListener('online', checkConnectedHealth);
    window.addEventListener('offline', () => syncLandingTruth(false));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkConnectedHealth(); });
    setInterval(checkConnectedHealth, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
