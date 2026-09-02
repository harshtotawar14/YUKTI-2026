(() => {
  'use strict';

  const ROLE_META = {
    CUSTOMER: {
      code: 'C', label: 'Customer', email: 'customer.connected@sanpaid.demo',
      role: 'CUSTOMER', target: 'connected', persona: 'CUSTOMER',
      help: 'Request and track verified local services.'
    },
    WORKER: {
      code: 'W', label: 'Worker', email: 'worker1.connected@sanpaid.demo',
      role: 'WORKER', target: 'connected', persona: 'WORKER_A',
      help: 'Review eligible opportunities and choose Accept or Decline.'
    },
    COOPERATIVE_ADMIN: {
      code: 'CA', label: 'Cooperative Administration', email: 'admin.connected@sanpaid.demo',
      role: 'COOPERATIVE_ADMIN', target: 'judge', persona: null,
      help: 'Manage workforce trust, services, complaints, capacity and local operations.'
    },
    FEDERATION_ADMIN: {
      code: 'FA', label: 'Federation Oversight', email: 'federation.connected@sanpaid.demo',
      role: 'FEDERATION_ADMIN', target: 'judge', persona: null,
      help: 'Review multi-cooperative governance, capacity coordination and regional planning.'
    }
  };

  const PERSONA_EMAILS = {
    CUSTOMER: 'customer.connected@sanpaid.demo',
    WORKER_A: 'worker1.connected@sanpaid.demo',
    WORKER_B: 'worker2.connected@sanpaid.demo'
  };

  const CONNECTED_TOKEN_KEY = 'sanpaid_connected_demo_token_v1';
  const JUDGE_TOKEN_KEY = 'sanpaid_judge_demo_token_v1';
  const WORKSPACE_KEY = 'sanpaid_active_workspace_v2';
  const PREFILL_SERVICE_KEY = 'sanpaid_prefill_service_v1';
  const PREFILL_AREA_KEY = 'sanpaid_prefill_area_v1';

  const state = {
    user: null,
    checking: false,
    checked: false,
    requestedRole: 'CUSTOMER',
    requestedPersona: 'CUSTOMER',
    lastFocus: null,
    restorePromise: null,
    resuming: false
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function storageGet(key) {
    try { return sessionStorage.getItem(key) || ''; } catch { return ''; }
  }
  function storageSet(key, value) {
    try { value ? sessionStorage.setItem(key, value) : sessionStorage.removeItem(key); } catch {}
  }
  function saveConnectedToken(token) { storageSet(CONNECTED_TOKEN_KEY, token || ''); }
  function saveJudgeToken(token) { storageSet(JUDGE_TOKEN_KEY, token || ''); }
  function readConnectedToken() { return storageGet(CONNECTED_TOKEN_KEY); }
  function readJudgeToken() { return storageGet(JUDGE_TOKEN_KEY); }
  function clearTokens() { saveConnectedToken(''); saveJudgeToken(''); }

  function saveWorkspace(role, persona, target) {
    try {
      sessionStorage.setItem(WORKSPACE_KEY, JSON.stringify({
        role, persona: persona || null, target, active: true, at: Date.now()
      }));
    } catch {}
  }
  function readWorkspace() {
    try { return JSON.parse(sessionStorage.getItem(WORKSPACE_KEY) || 'null'); } catch { return null; }
  }
  function clearWorkspace() {
    try { sessionStorage.removeItem(WORKSPACE_KEY); } catch {}
  }

  function roleKeyFromUser(user) {
    if (!user) return null;
    const role = String(user.role || '').toUpperCase();
    if (role === 'ADMIN') return 'COOPERATIVE_ADMIN';
    return ROLE_META[role] ? role : null;
  }
  function personaForUser(user) {
    const email = String(user?.email || '').toLowerCase();
    if (email === PERSONA_EMAILS.WORKER_B) return 'WORKER_B';
    if (email === PERSONA_EMAILS.WORKER_A) return 'WORKER_A';
    if (email === PERSONA_EMAILS.CUSTOMER) return 'CUSTOMER';
    return ROLE_META[roleKeyFromUser(user)]?.persona || null;
  }
  function expectedEmail(role, persona) {
    if (role === 'WORKER' && PERSONA_EMAILS[persona]) return PERSONA_EMAILS[persona];
    if (role === 'CUSTOMER') return PERSONA_EMAILS.CUSTOMER;
    return ROLE_META[role]?.email || '';
  }
  function personaMatches(user, persona) {
    if (!persona || roleKeyFromUser(user) !== 'WORKER') return true;
    const expected = PERSONA_EMAILS[persona];
    return !expected || String(user?.email || '').toLowerCase() === expected;
  }

  async function jsonFetch(path, options = {}) {
    const response = await fetch(path, {
      cache: 'no-store',
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Authentication request failed.');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }
  const post = (path, body = {}) => jsonFetch(path, { method: 'POST', body: JSON.stringify(body) });

  function toast(message) {
    $('.spu-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'spu-toast';
    node.setAttribute('role', 'status');
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2600);
  }

  async function meWithToken(token) {
    if (!token) return null;
    try {
      return (await jsonFetch('/api/connected/auth/me', {
        credentials: 'omit', headers: { Authorization: `Bearer ${token}` }
      })).user || null;
    } catch { return null; }
  }

  async function ensureAdminBridge() {
    const key = roleKeyFromUser(state.user);
    if (!['COOPERATIVE_ADMIN', 'FEDERATION_ADMIN'].includes(key)) return '';
    const existing = readJudgeToken();
    if (existing) return existing;
    try {
      const bridged = await post('/api/auth/session-bridge', {});
      if (bridged?.demoToken) {
        saveJudgeToken(bridged.demoToken);
        return bridged.demoToken;
      }
    } catch {}
    return '';
  }

  async function restoreSession(force = false) {
    if (state.user && !force) return state.user;
    if (state.restorePromise && !force) return state.restorePromise;
    state.checking = true;
    state.restorePromise = (async () => {
      let user = null;
      try {
        user = (await jsonFetch('/api/auth/me')).user || null;
      } catch (error) {
        if (error.status !== 401 && error.status !== 403) {
          console.warn('[auth restore cookie]', error?.message || error);
        }
      }
      if (!user) {
        user = await meWithToken(readConnectedToken());
        if (!user) user = await meWithToken(readJudgeToken());
      }
      state.user = user;
      state.checked = true;
      if (user) {
        const role = roleKeyFromUser(user);
        if (['COOPERATIVE_ADMIN', 'FEDERATION_ADMIN'].includes(role)) await ensureAdminBridge();
      } else {
        clearTokens();
        clearWorkspace();
      }
      return user;
    })();
    try { return await state.restorePromise; }
    finally {
      state.restorePromise = null;
      state.checking = false;
      updateAccessUI();
    }
  }

  async function login({ identifier, password, role, remember = false }) {
    if (!identifier || !password) throw Object.assign(new Error('Email and password are required.'), { status: 400 });
    if (state.user && (roleKeyFromUser(state.user) !== role || !personaMatches(state.user, state.requestedPersona))) {
      await logout({ silent: true, keepModal: true });
    }
    const result = await post('/api/auth/login', { identifier, password, role, remember });
    state.user = result.user || null;
    state.checked = true;
    if (result.demoToken) {
      if (['CUSTOMER', 'WORKER'].includes(role)) {
        saveConnectedToken(result.demoToken);
        saveJudgeToken('');
      } else {
        saveJudgeToken(result.demoToken);
        saveConnectedToken('');
      }
    }
    updateAccessUI();
    return state.user;
  }

  async function logout({ silent = false, keepModal = false } = {}) {
    try { await post('/api/auth/logout', {}); } catch {}
    clearTokens();
    clearWorkspace();
    state.user = null;
    state.checked = true;
    try { window.ConnectedSanPaid?.close?.(); } catch {}
    try { window.SanPaidJudgeMode?.close?.(); } catch {}
    updateAccessUI();
    if (!keepModal) closeAuth();
    if (!silent) toast('You are logged out.');
  }

  async function waitForWorkspace(kind, attempts = 60) {
    for (let i = 0; i < attempts; i += 1) {
      if (kind === 'connected' && window.ConnectedSanPaid?.open) return true;
      if (kind === 'judge' && window.SanPaidJudgeMode?.open) return true;
      await sleep(80);
    }
    return false;
  }

  async function applyConnectedPrefill() {
    const service = storageGet(PREFILL_SERVICE_KEY);
    const area = storageGet(PREFILL_AREA_KEY);
    if (!service && !area) return;
    for (let i = 0; i < 30; i += 1) {
      const select = $('#cdService');
      const zone = $('#cdZone');
      if (select && service) {
        const option = [...select.options].find(o => o.value === service || o.textContent.startsWith(service));
        if (option) { select.value = option.value; storageSet(PREFILL_SERVICE_KEY, ''); }
      }
      if (zone && area) { zone.value = area; storageSet(PREFILL_AREA_KEY, ''); }
      if ((!service || !storageGet(PREFILL_SERVICE_KEY)) && (!area || !storageGet(PREFILL_AREA_KEY))) break;
      await sleep(100);
    }
  }

  async function openRoleWorkspace(roleKey = roleKeyFromUser(state.user), persona = null) {
    const meta = ROLE_META[roleKey];
    if (!meta) { openAuth('CUSTOMER'); return false; }
    const requestedPersona = persona || meta.persona;
    const user = await restoreSession();
    if (!user) { clearWorkspace(); openAuth(roleKey, requestedPersona); return false; }
    const actual = roleKeyFromUser(user);
    if (actual !== roleKey) { clearWorkspace(); openAuth(roleKey, requestedPersona); return false; }
    if (roleKey === 'WORKER' && requestedPersona && !personaMatches(user, requestedPersona)) {
      await logout({ silent: true, keepModal: true });
      state.requestedRole = 'WORKER';
      state.requestedPersona = requestedPersona;
      openAuth('WORKER', requestedPersona);
      return false;
    }
    if (meta.target === 'judge') {
      window.SanPaidBootstrap?.loadAdministration?.();
      await ensureAdminBridge();
      if (!await waitForWorkspace('judge')) { toast('Administrative workspace is still loading. Please retry.'); return false; }
      saveWorkspace(roleKey, null, 'judge');
      window.SanPaidJudgeMode.open();
      return true;
    }
    if (!await waitForWorkspace('connected')) { toast('Service workspace is still loading. Please retry.'); return false; }
    if (window.SanPaidReadiness?.run) {
      let readiness = window.SanPaidReadiness.getLastResult?.();
      if (!readiness || Date.now() - Number(readiness.checkedAt || 0) > 60000) readiness = await window.SanPaidReadiness.run();
      if (!readiness?.ok && window.SanPaidReadiness.require && !(await window.SanPaidReadiness.require())) return false;
    }
    const finalPersona = roleKey === 'WORKER' ? (requestedPersona || personaForUser(user)) : requestedPersona;
    saveWorkspace(roleKey, finalPersona, 'connected');
    await window.ConnectedSanPaid.open(finalPersona);
    applyConnectedPrefill();
    return true;
  }

  function root() {
    let node = $('#sanpaidUnifiedAuthRoot');
    if (node) return node;
    node = document.createElement('div');
    node.id = 'sanpaidUnifiedAuthRoot';
    node.className = 'spu-root';
    node.hidden = true;
    node.innerHTML = `<div class="spu-shell" role="dialog" aria-modal="true" aria-labelledby="spuTitle">
      <aside class="spu-brand">
        <div class="spu-logo">San<span>Paid</span></div>
        <h2>Secure role access.<br>One governed network.</h2>
        <p>Sign in to the workspace authorized for your role. Valid sessions return to the same workspace after refresh.</p>
        <div class="spu-principles"><span>Role-Based Access</span><span>Session Restore</span><span>Auditability</span></div>
        <div class="spu-proof">Prototype environment. Administrative access remains authorization-controlled and no production government integration is claimed.</div>
      </aside>
      <main class="spu-main">
        <button class="spu-close" type="button" aria-label="Close authentication">✕</button>
        <div id="spuContent"></div>
      </main>
    </div>`;
    document.body.appendChild(node);
    $('.spu-close', node).onclick = closeAuth;
    node.addEventListener('mousedown', event => { if (event.target === node) closeAuth(); });
    node.addEventListener('keydown', trapFocus);
    return node;
  }

  function roleGrid() {
    return `<div class="spu-role-grid" role="group" aria-label="Choose role">${Object.entries(ROLE_META).map(([key, meta]) => `
      <button type="button" class="spu-role ${state.requestedRole === key ? 'active' : ''}" data-spu-role="${key}" aria-pressed="${state.requestedRole === key ? 'true' : 'false'}">
        <span class="spu-role-code" aria-hidden="true">${meta.code}</span><b>${meta.label}</b>
      </button>`).join('')}</div>`;
  }
  function wireRoleGrid() {
    $$('[data-spu-role]', root()).forEach(button => {
      button.onclick = () => {
        state.requestedRole = button.dataset.spuRole;
        state.requestedPersona = ROLE_META[state.requestedRole]?.persona || null;
        render();
      };
    });
  }

  function renderChecking() {
    const content = $('#spuContent', root());
    content.innerHTML = `<h2 id="spuTitle">Checking session…</h2><p class="spu-sub">Restoring your authorized SanPaid session.</p><div class="spu-checking"><span class="spu-spinner"></span><b>CHECKING SESSION</b></div>`;
  }

  function renderCurrent() {
    const key = roleKeyFromUser(state.user);
    const meta = ROLE_META[key] || ROLE_META.CUSTOMER;
    const content = $('#spuContent', root());
    const persona = personaForUser(state.user) || meta.persona;
    content.innerHTML = `<span class="spu-demo-pill">AUTHORIZED SESSION</span><h2 id="spuTitle">Welcome back</h2><p class="spu-sub">Your valid session is active.</p>
      <div class="spu-current"><div class="spu-current-top"><span class="spu-current-role">${esc(meta.label)}</span><span class="spu-demo-pill">SESSION RESTORED</span></div>
      <h3>${esc(state.user?.fullName || state.user?.email || 'SanPaid user')}</h3><p>${esc(state.user?.email || '')}</p>
      <div class="spu-current-actions"><button class="spu-primary" id="spuContinue" type="button">Continue to workspace</button><button class="spu-secondary" id="spuSwitch" type="button">Switch Role</button><button class="spu-secondary spu-danger" id="spuLogout" type="button">Logout</button></div></div>`;
    $('#spuContinue').onclick = () => { closeAuth(); openRoleWorkspace(key, persona); };
    $('#spuSwitch').onclick = async () => { await logout({ silent: true, keepModal: true }); state.requestedRole = 'CUSTOMER'; state.requestedPersona = 'CUSTOMER'; render(); };
    $('#spuLogout').onclick = () => logout();
  }

  function loginError(error) {
    if (error.status === 400) return 'Enter both email and password.';
    if (error.status === 401) return 'Email, password or selected role did not match.';
    if (error.status === 403) return 'This role is not authorized for this account.';
    if (error.status === 429) return 'Too many attempts. Please wait and retry.';
    return 'Authentication is temporarily unavailable. Please retry.';
  }

  function renderLogin() {
    if (state.user) return renderCurrent();
    const meta = ROLE_META[state.requestedRole] || ROLE_META.CUSTOMER;
    const content = $('#spuContent', root());
    const loginEmail = expectedEmail(state.requestedRole, state.requestedPersona);
    const workerContext = state.requestedRole === 'WORKER'
      ? `<div class="spu-status-card"><small>Selected worker workspace</small><b>${state.requestedPersona === 'WORKER_B' ? 'Replacement worker account' : 'Primary worker account'}</b></div>`
      : '';

    content.innerHTML = `<span class="spu-demo-pill">PROTOTYPE ENVIRONMENT</span><h2 id="spuTitle">Access SanPaid</h2><p class="spu-sub">Select your authorized role and sign in.</p>
      ${roleGrid()}${workerContext}
      <form id="spuLoginForm" class="spu-form" novalidate>
        <div class="spu-field"><label for="spuEmail">Email</label><input id="spuEmail" name="email" type="email" inputmode="email" autocomplete="username" value="${esc(loginEmail)}" required></div>
        <div class="spu-field spu-password"><label for="spuPassword">Password</label><input id="spuPassword" name="password" type="password" autocomplete="current-password" placeholder="Enter password" aria-describedby="spuLoginMessage" required><button class="spu-show" id="spuShowPassword" type="button" aria-controls="spuPassword" aria-pressed="false">Show</button></div>
        <label class="spu-remember"><input id="spuRemember" name="remember" type="checkbox"><span>Remember this device</span></label>
        <div id="spuLoginMessage" role="status" aria-live="polite"></div>
        <button class="spu-primary" id="spuLoginSubmit" type="submit">SIGN IN</button>
      </form>
      <div class="spu-helper"><b>${esc(meta.label)}:</b> ${esc(meta.help)}</div>`;

    wireRoleGrid();
    const password = $('#spuPassword');
    $('#spuShowPassword').onclick = () => {
      const show = password.type === 'password';
      password.type = show ? 'text' : 'password';
      $('#spuShowPassword').textContent = show ? 'Hide' : 'Show';
      $('#spuShowPassword').setAttribute('aria-pressed',show?'true':'false');
    };
    $('#spuLoginForm').onsubmit = async event => {
      event.preventDefault();
      const button = $('#spuLoginSubmit');
      const message = $('#spuLoginMessage');
      button.disabled = true;
      button.textContent = 'SIGNING IN…';
      event.currentTarget.setAttribute('aria-busy','true');
      message.innerHTML = '';
      try {
        await login({
          identifier: $('#spuEmail').value.trim(),
          password: password.value,
          role: meta.role,
          remember: $('#spuRemember').checked
        });
        if (!personaMatches(state.user, state.requestedPersona)) {
          throw Object.assign(new Error('This account does not match the selected worker workspace.'), { status: 403 });
        }
        closeAuth();
        toast(`${meta.label} session opened.`);
        await openRoleWorkspace(meta.role, state.requestedPersona || meta.persona);
      } catch (error) {
        message.innerHTML = `<div class="spu-error">${esc(loginError(error))}</div>`;
      } finally {
        button.disabled = false;
        button.textContent = 'SIGN IN';
        event.currentTarget.setAttribute('aria-busy','false');
      }
    };
  }

  function render() {
    if (state.checking) return renderChecking();
    renderLogin();
  }

  async function openAuth(role = 'CUSTOMER', persona = null) {
    if (ROLE_META[role]) state.requestedRole = role;
    state.requestedPersona = persona || ROLE_META[state.requestedRole]?.persona || null;
    state.lastFocus = document.activeElement;
    const authRoot = root();
    authRoot.hidden = false;
    document.body.style.overflow = 'hidden';
    renderChecking();
    await restoreSession();
    if (state.user && roleKeyFromUser(state.user) === role && role === 'WORKER' && !personaMatches(state.user, state.requestedPersona)) {
      await logout({ silent: true, keepModal: true });
    }
    render();
    setTimeout(() => ($('#spuEmail', authRoot) || $('.spu-close', authRoot))?.focus(), 0);
  }

  function closeAuth() {
    const authRoot = root();
    authRoot.hidden = true;
    document.body.style.overflow = '';
    if (state.lastFocus?.isConnected) state.lastFocus.focus();
    state.lastFocus = null;
  }

  function trapFocus(event) {
    if (event.key === 'Escape') { closeAuth(); return; }
    if (event.key !== 'Tab') return;
    const nodes = $$('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])', root())
      .filter(node => node.getClientRects().length);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function roleFromTrigger(target) {
    if (target.closest?.('#coopLogin,#sihJudgeModeBtn,#judgeModeStatusBtn')) return ['COOPERATIVE_ADMIN', null];
    const judgeRole = target.closest?.('[data-judge-role]')?.dataset?.judgeRole;
    if (judgeRole === 'FEDERATION_ADMIN') return ['FEDERATION_ADMIN', null];
    if (judgeRole === 'COOPERATIVE_ADMIN') return ['COOPERATIVE_ADMIN', null];
    const source = target.closest?.('[data-open-connected],[data-eval-connected-persona],[data-open-connected-role],[data-connected-persona]');
    const persona = source?.dataset?.openConnected || source?.dataset?.evalConnectedPersona || source?.dataset?.openConnectedRole || source?.dataset?.connectedPersona;
    if (persona === 'CUSTOMER') return ['CUSTOMER', 'CUSTOMER'];
    if (persona === 'WORKER_A' || persona === 'WORKER_B') return ['WORKER', persona];
    if (target.closest?.('#connectedDemoBtn,[data-eval-open-connected],#evalFinalPrototype')) return ['CUSTOMER', 'CUSTOMER'];
    return null;
  }

  function installCaptureGuards() {
    document.addEventListener('click', async event => {
      const target = event.target;
      if (target.closest?.('#connectedClose,.close-connected,#judgeClose,[data-judge-close]')) { clearWorkspace(); return; }
      if (target.closest?.('#connectedLogout,#judgeLogout,#logoutBtn')) {
        event.preventDefault(); event.stopImmediatePropagation(); await logout(); return;
      }
      if (target.closest?.('#connectedSwitch')) {
        event.preventDefault(); event.stopImmediatePropagation(); await logout({ silent: true }); openAuth('CUSTOMER'); return;
      }
      if (target.closest?.('#getStarted,#spMobileAccess')) {
        event.preventDefault(); event.stopImmediatePropagation(); openAuth(roleKeyFromUser(state.user) || 'CUSTOMER', personaForUser(state.user)); return;
      }
      const request = roleFromTrigger(target);
      if (!request) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const [role, persona] = request;
      const needsConnectedPreflight = role === 'CUSTOMER' || role === 'WORKER';
      if (needsConnectedPreflight && window.SanPaidReadiness?.require) {
        const ready = await window.SanPaidReadiness.require();
        if (!ready) return;
      }
      const user = await restoreSession();
      if (user && roleKeyFromUser(user) === role && personaMatches(user, persona)) openRoleWorkspace(role, persona);
      else openAuth(role, persona);
    }, true);
  }

  function updateAccessUI() {
    const key = roleKeyFromUser(state.user);
    const meta = ROLE_META[key];
    const button = $('#getStarted');
    if (button) button.textContent = meta ? `CONTINUE · ${meta.label.toUpperCase()}` : 'ROLE ACCESS';
  }

  async function resumeWorkspace() {
    if (state.resuming) return;
    const intent = readWorkspace();
    if (!intent?.active) return;
    const user = state.user || await restoreSession();
    if (!user) return;
    const role = roleKeyFromUser(user);
    if (role !== intent.role) { clearWorkspace(); return; }
    const persona = role === 'WORKER' ? personaForUser(user) : (intent.persona || ROLE_META[role]?.persona || null);
    state.resuming = true;
    try {
      saveWorkspace(role, persona, intent.target || ROLE_META[role]?.target);
      await sleep(120);
      await openRoleWorkspace(role, persona);
    } finally { state.resuming = false; }
  }

  function publish() {
    window.SanPaidAuth = {
      login, logout, restoreSession,
      isAuthenticated: () => !!state.user,
      getCurrentUser: () => state.user,
      getRole: () => roleKeyFromUser(state.user),
      getPersona: () => personaForUser(state.user),
      openRoleWorkspace,
      switchRole: async role => { await logout({ silent: true }); openAuth(role || 'CUSTOMER'); },
      handleExpiredSession: async () => {
        state.user = null; clearTokens(); clearWorkspace(); updateAccessUI(); openAuth(state.requestedRole || 'CUSTOMER', state.requestedPersona);
      },
      open: openAuth,
      close: closeAuth,
      clearWorkspace
    };
    window.SanPaidAccess = { open: openAuth, close: closeAuth };
  }

  async function start() {
    root();
    publish();
    installCaptureGuards();
    updateAccessUI();
    await restoreSession();
    await resumeWorkspace();
    [400, 1000, 2200].forEach(ms => setTimeout(() => { publish(); updateAccessUI(); }, ms));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
