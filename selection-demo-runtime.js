(() => {
  'use strict';

  // Selection-demo reliability layer.
  // The existing review runtime remains the source of API behaviour and role rules.
  // This layer only shares its business state across tabs in the same browser so
  // Customer, Worker, Cooperative Admin and Federation Admin can participate in
  // one deterministic SIH walkthrough without depending on the external database.
  if (!window.SanPaidReviewRuntime?.enabled) return;

  const legacyFetch = window.fetch.bind(window);
  const LEGACY_STATE_KEY = 'sanpaid_sih_review_state_v1';
  const SHARED_STATE_KEY = 'sanpaid_sih_selection_shared_state_v2';
  const CHANNEL_NAME = 'sanpaid-sih-selection-demo-v2';
  const MODE = 'SELECTION_DEMO_BACKEND';
  let channel = null;
  let lastSharedRevision = 0;

  const clone = value => JSON.parse(JSON.stringify(value));
  const safeParse = (value, fallback = null) => {
    try { return JSON.parse(value) ?? fallback; }
    catch { return fallback; }
  };

  function validState(value) {
    return !!(value && typeof value === 'object' && value.booking && Array.isArray(value.offers) && Array.isArray(value.timeline));
  }

  function readLegacyState() {
    try {
      const raw = sessionStorage.getItem(LEGACY_STATE_KEY);
      const parsed = safeParse(raw, null);
      if (validState(parsed)) return parsed;
    } catch {}
    try {
      const state = window.SanPaidReviewRuntime?.state?.();
      if (validState(state)) return state;
    } catch {}
    return null;
  }

  function readSharedEnvelope() {
    try {
      const envelope = safeParse(localStorage.getItem(SHARED_STATE_KEY), null);
      if (!envelope || !validState(envelope.state)) return null;
      return envelope;
    } catch { return null; }
  }

  function writeLegacyState(next) {
    if (!validState(next)) return;
    try { sessionStorage.setItem(LEGACY_STATE_KEY, JSON.stringify(next)); } catch {}
  }

  function refreshVisibleRole(source = 'selection-demo-sync') {
    const detail = { source, mode: MODE, at: Date.now() };
    try { window.dispatchEvent(new CustomEvent('sanpaid:selection-demo-sync', { detail })); } catch {}
    try { window.dispatchEvent(new CustomEvent('sanpaid:connected-sync', { detail })); } catch {}
    try {
      const dashboard = window.SanPaidCustomerWorkerDashboard;
      if (typeof dashboard?.requestRefresh === 'function') dashboard.requestRefresh({ detail });
    } catch {}
  }

  function writeSharedState(next, source = 'local-change') {
    if (!validState(next)) return null;
    const revision = Number(next.revision || 0);
    const envelope = {
      version: 2,
      mode: MODE,
      revision,
      updatedAt: new Date().toISOString(),
      source,
      state: clone(next)
    };
    try { localStorage.setItem(SHARED_STATE_KEY, JSON.stringify(envelope)); } catch {}
    writeLegacyState(next);
    lastSharedRevision = revision;
    try { channel?.postMessage({ type: 'state', revision, source, at: Date.now() }); } catch {}
    refreshVisibleRole(source);
    return envelope;
  }

  function hydrateFromShared() {
    const shared = readSharedEnvelope();
    if (shared?.state) {
      writeLegacyState(shared.state);
      lastSharedRevision = Number(shared.revision || shared.state.revision || 0);
      return shared.state;
    }
    const legacy = readLegacyState();
    if (legacy) {
      writeSharedState(legacy, 'initial-migration');
      return legacy;
    }
    return null;
  }

  function persistLegacyState(source) {
    const current = readLegacyState();
    if (!current) return null;
    return writeSharedState(current, source);
  }

  function isSameOriginApi(input) {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url || '';
    try {
      const url = new URL(raw, location.href);
      return url.origin === location.origin && url.pathname.startsWith('/api/') ? url : null;
    } catch { return null; }
  }

  function isBusinessMutation(pathname, method) {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false;
    if (pathname.startsWith('/api/auth/')) return false;
    return pathname.startsWith('/api/connected/') || pathname.startsWith('/api/cooperative-admin/') || pathname.startsWith('/api/federation/');
  }

  async function sharedDemoFetch(input, options = {}) {
    const url = isSameOriginApi(input);
    if (!url) return legacyFetch(input, options);

    // Keep each browser tab's auth session independent, but always hydrate the
    // shared business ledger before an API call so separate role tabs see one flow.
    if (!url.pathname.startsWith('/api/auth/')) hydrateFromShared();

    const method = String(options.method || input?.method || 'GET').toUpperCase();
    const response = await legacyFetch(input, options);

    if (response.ok && isBusinessMutation(url.pathname, method)) {
      persistLegacyState(`${method} ${url.pathname}`);
    }
    return response;
  }

  function resetJourney() {
    let fresh = null;
    try { fresh = window.SanPaidReviewRuntime.reset(); } catch {}
    if (!validState(fresh)) return null;
    writeLegacyState(fresh);
    writeSharedState(fresh, 'manual-reset');
    try { sessionStorage.removeItem('sanpaid_connected_booking_id'); } catch {}
    return clone(fresh);
  }

  function currentState() {
    const shared = readSharedEnvelope();
    if (shared?.state) return clone(shared.state);
    const legacy = readLegacyState();
    return legacy ? clone(legacy) : null;
  }

  function status() {
    const envelope = readSharedEnvelope();
    return {
      enabled: true,
      mode: MODE,
      sharedAcrossTabs: true,
      externalDatabaseRequired: false,
      revision: Number(envelope?.revision || currentState()?.revision || 0),
      updatedAt: envelope?.updatedAt || null
    };
  }

  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener('message', event => {
        if (event?.data?.type !== 'state') return;
        const shared = readSharedEnvelope();
        if (!shared?.state) return;
        const revision = Number(shared.revision || 0);
        if (revision < lastSharedRevision) return;
        writeLegacyState(shared.state);
        lastSharedRevision = revision;
        refreshVisibleRole('cross-tab-broadcast');
      });
    }
  } catch { channel = null; }

  window.addEventListener('storage', event => {
    if (event.key !== SHARED_STATE_KEY) return;
    const shared = readSharedEnvelope();
    if (!shared?.state) return;
    writeLegacyState(shared.state);
    lastSharedRevision = Number(shared.revision || 0);
    refreshVisibleRole('cross-tab-storage');
  });

  window.addEventListener('focus', () => {
    const shared = readSharedEnvelope();
    if (!shared?.state) return;
    const revision = Number(shared.revision || 0);
    if (revision === lastSharedRevision) return;
    writeLegacyState(shared.state);
    lastSharedRevision = revision;
    refreshVisibleRole('focus-sync');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    const shared = readSharedEnvelope();
    if (!shared?.state) return;
    const revision = Number(shared.revision || 0);
    if (revision === lastSharedRevision) return;
    writeLegacyState(shared.state);
    lastSharedRevision = revision;
    refreshVisibleRole('visibility-sync');
  });

  hydrateFromShared();
  window.fetch = sharedDemoFetch;
  window.SanPaidSelectionDemo = Object.freeze({
    enabled: true,
    mode: MODE,
    state: currentState,
    status,
    reset: resetJourney,
    sync: () => {
      const next = hydrateFromShared();
      refreshVisibleRole('manual-sync');
      return next ? clone(next) : null;
    }
  });
  document.documentElement.dataset.sanpaidDemoBackend = 'shared-browser-ledger';
})();
