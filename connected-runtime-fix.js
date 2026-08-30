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
  const NativeEventSource = window.EventSource;

  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }
  function setToken(value) {
    try {
      if (value) sessionStorage.setItem(TOKEN_KEY, value);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
  }
  function connectedShellActive() {
    const shell = document.getElementById('connectedShell');
    return !!(shell && !shell.classList.contains('hidden'));
  }
  function rawUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.pathname + input.search;
    return input?.url || '';
  }
  function parseBody(init) {
    try { return typeof init?.body === 'string' ? JSON.parse(init.body) : {}; }
    catch { return {}; }
  }
  function direct(path) { return `${BACKEND}${path}`; }
  function connectedPath(url) {
    try {
      if (url.startsWith('/api/connected/')) return url;
      const parsed = new URL(url, location.href);
      if (parsed.origin === location.origin && parsed.pathname.startsWith('/api/connected/')) return parsed.pathname + parsed.search;
    } catch {}
    return '';
  }

  window.fetch = async function sanPaidConnectedFetch(input, init = {}) {
    const url = rawUrl(input);
    const token = getToken();
    let targetPath = '';
    let isDemoLogin = false;
    let isDemoLogout = false;

    if (url === '/api/auth/login' && connectedShellActive()) {
      const payload = parseBody(init);
      const identifier = String(payload.identifier || '').trim().toLowerCase();
      if (DEMO_EMAILS.has(identifier)) {
        targetPath = '/api/connected/auth/login';
        isDemoLogin = true;
      }
    } else if (url === '/api/auth/me' && connectedShellActive()) {
      if (!token) {
        return new Response(JSON.stringify({ error: 'not_authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      targetPath = '/api/connected/auth/me';
    } else if (url === '/api/auth/logout' && connectedShellActive() && token) {
      targetPath = '/api/connected/auth/logout';
      isDemoLogout = true;
    } else {
      targetPath = connectedPath(url);
    }

    if (!targetPath) return nativeFetch(input, init);

    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
    if (!isDemoLogin && token) headers.set('Authorization', `Bearer ${token}`);

    const response = await nativeFetch(direct(targetPath), {
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
    if (response.status === 401 && targetPath.startsWith('/api/connected/') && !isDemoLogin) setToken('');
    return response;
  };

  function setTextIfChanged(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }
  function setStyleIfChanged(node, prop, value) {
    if (node && node.style[prop] !== value) node.style[prop] = value;
  }
  function syncConnectedShellTruth() {
    const top = document.getElementById('connectedTopStatus');
    if (!top) return;
    const offline = /not reachable|unavailable|offline|reconnecting/i.test(top.textContent || '');
    const targetText = offline ? 'BACKEND OFFLINE' : 'CONNECTED BACKEND';
    const targetColor = offline ? '#9a5b00' : '#176b46';
    const targetBackground = offline ? '#fff6e8' : '#eaf8f1';
    const targetBorder = offline ? '#f0d29d' : '#c4e8d5';
    document.querySelectorAll('#connectedShell .connected-badge').forEach(badge => {
      if (!/CONNECTED BACKEND|DEPLOYMENT PENDING|BACKEND OFFLINE|SHARED BACKEND/.test(badge.textContent || '')) return;
      setTextIfChanged(badge, targetText);
      setStyleIfChanged(badge, 'color', targetColor);
      setStyleIfChanged(badge, 'background', targetBackground);
      setStyleIfChanged(badge, 'borderColor', targetBorder);
    });
  }

  class ConnectedPollingSource {
    constructor(url) {
      this.url = String(url || '');
      this.listeners = new Map();
      this.onerror = null;
      this.onopen = null;
      this.readyState = 0;
      this.closed = false;
      this.timer = null;
      this.opened = false;
      this.lastSignature = '';
      this.tick = this.tick.bind(this);
      this.schedule(120);
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
    schedule(delay = 3000) {
      if (this.closed) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(this.tick, delay);
    }
    snapshotSignature(snapshot) {
      return JSON.stringify({
        role: snapshot?.role || '',
        bookings: snapshot?.bookings || [],
        offers: snapshot?.offers || []
      });
    }
    async tick() {
      if (this.closed) return;
      if (document.hidden || !connectedShellActive()) {
        this.schedule(1500);
        return;
      }
      if (!getToken()) {
        this.readyState = 0;
        this.schedule(1500);
        return;
      }
      try {
        const response = await window.fetch('/api/connected/snapshot', { method: 'GET', cache: 'no-store' });
        if (!response.ok) throw new Error(`snapshot_${response.status}`);
        const snapshot = await response.json();
        const signature = this.snapshotSignature(snapshot);
        this.readyState = 1;
        if (!this.opened) {
          this.opened = true;
          if (typeof this.onopen === 'function') { try { this.onopen({ type: 'open' }); } catch {} }
        }
        if (signature !== this.lastSignature) {
          this.lastSignature = signature;
          this.emit('snapshot', snapshot);
        }
        const top = document.getElementById('connectedTopStatus');
        if (top) {
          setTextIfChanged(top, '● Backend + Live Polling');
          setStyleIfChanged(top, 'color', '#8ee2b5');
        }
        syncConnectedShellTruth();
        this.schedule(3000);
      } catch (error) {
        this.readyState = 0;
        const top = document.getElementById('connectedTopStatus');
        if (top) {
          setTextIfChanged(top, '● Reconnecting…');
          setStyleIfChanged(top, 'color', '#ffb66e');
        }
        syncConnectedShellTruth();
        if (typeof this.onerror === 'function') { try { this.onerror(error); } catch {} }
        this.schedule(4500);
      }
    }
    close() {
      this.closed = true;
      this.readyState = 2;
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  if (NativeEventSource) {
    window.EventSource = function SanPaidEventSource(url, options) {
      if (String(url || '') === '/api/connected/events') return new ConnectedPollingSource(url, options);
      return new NativeEventSource(url, options);
    };
    window.EventSource.CONNECTING = NativeEventSource.CONNECTING ?? 0;
    window.EventSource.OPEN = NativeEventSource.OPEN ?? 1;
    window.EventSource.CLOSED = NativeEventSource.CLOSED ?? 2;
    window.EventSource.prototype = NativeEventSource.prototype;
  } else {
    window.EventSource = ConnectedPollingSource;
  }

  window.SanPaidConnectedTransport = {
    backend: BACKEND,
    mode: 'DIRECT_RENDER_BEARER_POLLING_OPTIMIZED',
    hasSession: () => !!getToken(),
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
      speak(structuredSummaryOnly(displayed), inferSummaryLanguage(displayed));
    }
  }, true);

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
    if (online) {
      setStatusRow('Connected two-device booking', 'BACKEND CONNECTED', 'Shared PostgreSQL booking, worker-scoped offer, Accept/Reject fallback and authenticated live polling', 'green');
      setStatusRow('Eligibility-first matching', 'CONNECTED DEMO', 'Verified/available/skill-verified workers are gated before deterministic ranking', 'green');
      setStatusRow('Worker accept/reject', 'BACKEND CONNECTED', 'Atomic offer response; Reject creates next eligible worker offer with the same booking context', 'green');
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
    if (document.hidden) return;
    try {
      const r = await window.fetch('/api/connected/health', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      syncLandingTruth(Boolean(r.ok && d?.ok));
      syncConnectedShellTruth();
    } catch {
      syncLandingTruth(false);
      syncConnectedShellTruth();
    }
  }

  function start() {
    checkConnectedHealth();
    window.addEventListener('online', checkConnectedHealth);
    window.addEventListener('offline', () => syncLandingTruth(false));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkConnectedHealth(); });
    setInterval(checkConnectedHealth, 45000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();