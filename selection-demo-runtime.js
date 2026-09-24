(() => {
  'use strict';

  // Selection-demo reliability layer.
  // The existing review runtime remains the source of API behaviour and role rules.
  // This layer shares business state across tabs in the same browser and preserves
  // customer photo/voice evidence in IndexedDB so the four-role SIH walkthrough can
  // run deterministically without depending on the external database.
  if (!window.SanPaidReviewRuntime?.enabled) return;

  const legacyFetch = window.fetch.bind(window);
  const LEGACY_STATE_KEY = 'sanpaid_sih_review_state_v1';
  const SHARED_STATE_KEY = 'sanpaid_sih_selection_shared_state_v2';
  const CHANNEL_NAME = 'sanpaid-sih-selection-demo-v2';
  const MEDIA_DB_NAME = 'sanpaid-sih-selection-media-v1';
  const MEDIA_STORE = 'media';
  const MODE = 'SELECTION_DEMO_BACKEND';
  const memoryMedia = new Map();
  let channel = null;
  let lastSharedRevision = 0;
  let mediaDbPromise = null;

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

  function openMediaDb() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise(resolve => {
      try {
        const request = indexedDB.open(MEDIA_DB_NAME, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE, { keyPath: 'key' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch { resolve(null); }
    });
    return mediaDbPromise;
  }

  async function putMedia(key, value) {
    if (!key || !value?.data) return false;
    const record = { key, ...value, storedAt: new Date().toISOString() };
    memoryMedia.set(key, record);
    const db = await openMediaDb();
    if (!db) return true;
    return new Promise(resolve => {
      try {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        tx.objectStore(MEDIA_STORE).put(record);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch { resolve(false); }
    });
  }

  async function getMedia(key) {
    if (memoryMedia.has(key)) return memoryMedia.get(key);
    const db = await openMediaDb();
    if (!db) return null;
    return new Promise(resolve => {
      try {
        const request = db.transaction(MEDIA_STORE, 'readonly').objectStore(MEDIA_STORE).get(key);
        request.onsuccess = () => {
          const value = request.result || null;
          if (value) memoryMedia.set(key, value);
          resolve(value);
        };
        request.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  }

  async function clearMedia() {
    memoryMedia.clear();
    const db = await openMediaDb();
    if (!db) return;
    await new Promise(resolve => {
      try {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        tx.objectStore(MEDIA_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch { resolve(); }
    });
  }

  function blobFromBase64(data, mimeType = 'application/octet-stream') {
    try {
      const binary = atob(String(data || ''));
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
    } catch { return null; }
  }

  async function mediaResponse(kind, bookingId) {
    const record = await getMedia(`${kind}:${bookingId}`);
    if (!record?.data) return new Response(JSON.stringify({ ok: false, error: 'MEDIA_NOT_FOUND', message: 'Attached demo media is unavailable.' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    const blob = blobFromBase64(record.data, record.mimeType);
    if (!blob) return new Response(JSON.stringify({ ok: false, error: 'MEDIA_INVALID', message: 'Attached demo media could not be decoded.' }), { status: 422, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    return new Response(blob, { status: 200, headers: { 'Content-Type': record.mimeType || blob.type || 'application/octet-stream', 'Cache-Control': 'private, no-store', 'X-SanPaid-Demo-Media': 'browser-local' } });
  }

  function parseRequestBody(options = {}) {
    if (!options.body || typeof options.body !== 'string') return {};
    return safeParse(options.body, {}) || {};
  }

  async function preserveBookingMedia(payload, booking) {
    const bookingId = Number(booking?.id || 0);
    if (!bookingId) return false;
    const current = readLegacyState();
    if (!current?.booking || Number(current.booking.id) !== bookingId) return false;

    const photo = payload?.problemPhoto;
    const voice = payload?.voiceMessage;
    let changed = false;

    if (photo?.data) {
      const stored = await putMedia(`photo:${bookingId}`, {
        data: photo.data,
        mimeType: photo.mimeType || 'image/jpeg',
        size: Number(photo.size || 0),
        width: Number(photo.width || 0),
        height: Number(photo.height || 0)
      });
      if (stored) {
        current.booking.problemPhoto = {
          available: true,
          url: `/api/selection-demo/media/photo/${bookingId}`,
          mimeType: photo.mimeType || 'image/jpeg',
          size: Number(photo.size || 0),
          width: Number(photo.width || 0),
          height: Number(photo.height || 0)
        };
        changed = true;
      }
    }

    if (voice?.data) {
      const stored = await putMedia(`voice:${bookingId}`, {
        data: voice.data,
        mimeType: voice.mimeType || 'audio/webm',
        durationMs: Number(voice.durationMs || 0),
        size: Number(voice.size || 0)
      });
      if (stored) {
        current.booking.voiceMessage = {
          available: true,
          url: `/api/selection-demo/media/voice/${bookingId}`,
          mimeType: voice.mimeType || 'audio/webm',
          durationMs: Number(voice.durationMs || 0),
          size: Number(voice.size || 0)
        };
        current.booking.requestSource = 'VOICE';
        changed = true;
      }
    }

    if (changed) {
      current.revision = Number(current.revision || 0) + 1;
      current.booking.updatedAt = new Date().toISOString();
      const history = Array.isArray(current.history) ? current.history.find(item => Number(item.id) === bookingId) : null;
      if (history) Object.assign(history, clone(current.booking));
      writeLegacyState(current);
      writeSharedState(current, 'booking-media-preserved');
    }
    return changed;
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

    const mediaMatch = url.pathname.match(/^\/api\/selection-demo\/media\/(photo|voice)\/(\d+)$/);
    if (mediaMatch && String(options.method || input?.method || 'GET').toUpperCase() === 'GET') return mediaResponse(mediaMatch[1], Number(mediaMatch[2]));

    // Keep each browser tab's auth session independent, but always hydrate the
    // shared business ledger before an API call so separate role tabs see one flow.
    if (!url.pathname.startsWith('/api/auth/')) hydrateFromShared();

    const method = String(options.method || input?.method || 'GET').toUpperCase();
    const bookingPayload = url.pathname === '/api/connected/bookings' && method === 'POST' ? parseRequestBody(options) : null;
    const response = await legacyFetch(input, options);

    if (response.ok && bookingPayload) {
      const booking = await response.clone().json().catch(() => null);
      await preserveBookingMedia(bookingPayload, booking);
      persistLegacyState(`${method} ${url.pathname}`);
    } else if (response.ok && isBusinessMutation(url.pathname, method)) {
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
    clearMedia().catch(() => {});
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
      browserMediaStore: true,
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