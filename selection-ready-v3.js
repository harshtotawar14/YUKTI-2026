(() => {
  'use strict';

  const ROLE_META = {
    CUSTOMER: { icon:'👤', label:'Customer', email:'customer.connected@sanpaid.demo', role:'CUSTOMER', target:'connected', persona:'CUSTOMER', help:'Request and track verified local services.' },
    WORKER: { icon:'🛠', label:'Worker', email:'worker1.connected@sanpaid.demo', role:'WORKER', target:'connected', persona:'WORKER_A', help:'Review an eligible opportunity and choose Accept / Decline.' },
    COOPERATIVE_ADMIN: { icon:'🏢', label:'Cooperative Admin', email:'admin.connected@sanpaid.demo', role:'COOPERATIVE_ADMIN', target:'judge', help:'Workforce, SLA, matching and cooperative operations.' },
    FEDERATION_ADMIN: { icon:'🌐', label:'Federation Admin', email:'federation.connected@sanpaid.demo', role:'FEDERATION_ADMIN', target:'judge', help:'Regional governance and cross-cooperative capacity planning.' }
  };
  const DEMO_PASSWORD = 'Demo@2026';
  const JUDGE_TOKEN_KEY = 'sanpaid_judge_demo_token_v1';
  let authMode = 'login';
  let selectedRole = 'CUSTOMER';
  let signupStep = 1;
  let lastFocus = null;

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function post(path, body={}) {
    const response = await fetch(path, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      cache:'no-store',
      body:JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || data.error || 'This demo action could not be completed.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function toast(message) {
    document.querySelector('.sp-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'sp-toast';
    node.setAttribute('role','status');
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2600);
  }

  function installScrollState() {
    const nav = $('#landing .eval-nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('sp-nav-scrolled', window.scrollY > 16);
    onScroll();
    addEventListener('scroll', onScroll, {passive:true});

    const links = $$('#landing .navlinks a[href^="#"], #landing .mobile-drawer a[href^="#"]');
    const sectionIds = [...new Set(links.map(a => a.getAttribute('href')).filter(Boolean))];
    const sections = sectionIds.map(id => document.querySelector(id)).filter(Boolean);
    if (!('IntersectionObserver' in window) || !sections.length) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(x => x.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (!visible) return;
      const id = `#${visible.target.id}`;
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === id));
    }, {rootMargin:'-24% 0px -62% 0px', threshold:[0,.15,.35,.6]});
    sections.forEach(s => observer.observe(s));
  }

  function installSectionRhythm() {
    $$('#landing main>.section .head').forEach(head => head.classList.add('sp-section-head'));
    $$('#landing main>.section').forEach(section => {
      const tag = $('.head .tag', section);
      if (tag && !tag.dataset.spNormalized) {
        tag.dataset.spNormalized = 'true';
        tag.setAttribute('aria-label', tag.textContent.trim());
      }
    });
  }

  function installMatchingProgress() {
    const match = $('#matching .eval-match');
    const body = $('#matching .eval-proof-body');
    if (!match || !body || $('#spDemoProgress')) return;
    const rail = document.createElement('div');
    rail.id = 'spDemoProgress';
    rail.className = 'sp-demo-progress';
    rail.setAttribute('aria-label','Interactive matching demo progress');
    rail.innerHTML = `
      <div class="sp-demo-stage" id="spStageEligibility" data-state="active"><i>1</i><b>Eligibility Gate</b><small>Rules check verified eligibility first</small></div>
      <div class="sp-demo-stage" id="spStageRanking" data-state="locked"><i>2</i><b>Fair Ranking</b><small>Only eligible workers can be ranked</small></div>
      <div class="sp-demo-stage" id="spStageChoice" data-state="locked"><i>3</i><b>Worker Choice</b><small>Opportunity is offered, not forced</small></div>`;
    body.insertAdjacentElement('beforebegin', rail);

    const eligibilityBadge = $('#evalEligibilityBadge');
    const rankingBadge = $('#evalRankingBadge');
    const offerRoot = $('#evalOfferRoot');
    const s1 = $('#spStageEligibility');
    const s2 = $('#spStageRanking');
    const s3 = $('#spStageChoice');

    const derive = () => {
      const e = (eligibilityBadge?.textContent || '').trim().toUpperCase();
      const r = (rankingBadge?.textContent || '').trim().toUpperCase();
      const offerText = (offerRoot?.textContent || '').trim().toUpperCase();
      const eligibilityDone = !/WAITING|RUN|CHECKING|ACTIVE/.test(e) && e.length > 0;
      const rankingUnlocked = eligibilityDone || !/LOCKED/.test(r);
      const rankingDone = rankingUnlocked && !/LOCKED|WAITING|RUN|READY/.test(r) && r.length > 0;
      const choiceReady = rankingDone || /ACCEPT|DECLINE|OFFER/.test(offerText);
      s1.dataset.state = eligibilityDone ? 'done' : 'active';
      s1.querySelector('i').textContent = eligibilityDone ? '✓' : '1';
      s2.dataset.state = rankingDone ? 'done' : rankingUnlocked ? 'active' : 'locked';
      s2.querySelector('i').textContent = rankingDone ? '✓' : '2';
      s3.dataset.state = choiceReady ? 'active' : 'locked';
      s3.querySelector('i').textContent = '3';
    };
    derive();
    const mo = new MutationObserver(derive);
    [eligibilityBadge, rankingBadge, offerRoot].filter(Boolean).forEach(n => mo.observe(n,{subtree:true,childList:true,characterData:true,attributes:true}));
    $('#evalResetMatch')?.addEventListener('click', () => setTimeout(derive, 20));
  }

  function authRoot() {
    let root = $('#sanpaidAuthRoot');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'sanpaidAuthRoot';
    root.className = 'sp-auth-root';
    root.hidden = true;
    root.innerHTML = `
      <div class="sp-auth-shell" role="dialog" aria-modal="true" aria-labelledby="spAuthTitle">
        <aside class="sp-auth-brand">
          <div class="sp-auth-logo">San<span>Paid</span></div>
          <h2>One network.<br>Four governed roles.</h2>
          <p>Eligibility is checked before ranking, workers retain choice, and important outcomes remain auditable.</p>
          <div class="sp-auth-principle"><span>Rules First</span><span>AI-Assisted</span><span>Auditable</span></div>
          <div class="sp-auth-mini-flow" aria-hidden="true">
            <div><i>1</i>Verified eligibility</div><div><i>2</i>Fair &amp; explainable ranking</div><div><i>3</i>Worker choice</div><div><i>4</i>Auditable service outcome</div>
          </div>
        </aside>
        <section class="sp-auth-main">
          <button class="sp-auth-close" type="button" aria-label="Close role access">✕</button>
          <div class="sp-auth-tabs" role="tablist" aria-label="Role access mode">
            <button class="sp-auth-tab active" data-auth-mode="login" role="tab" aria-selected="true">Login</button>
            <button class="sp-auth-tab" data-auth-mode="signup" role="tab" aria-selected="false">Signup Preview</button>
          </div>
          <div id="spAuthContent"></div>
        </section>
      </div>`;
    document.body.appendChild(root);
    $('.sp-auth-close',root).onclick = closeAuth;
    root.addEventListener('mousedown', e => { if (e.target === root) closeAuth(); });
    root.addEventListener('keydown', trapAuthFocus);
    $$('[data-auth-mode]',root).forEach(btn => btn.onclick = () => setAuthMode(btn.dataset.authMode));
    return root;
  }

  function setAuthMode(mode) {
    authMode = mode === 'signup' ? 'signup' : 'login';
    signupStep = 1;
    const root = authRoot();
    $$('[data-auth-mode]',root).forEach(btn => {
      const active = btn.dataset.authMode === authMode;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',String(active));
    });
    renderAuth();
  }

  function roleButtons() {
    return `<div class="sp-role-selector" role="group" aria-label="Choose role">${Object.entries(ROLE_META).map(([key,m]) => `<button class="sp-role-btn ${selectedRole===key?'active':''}" type="button" data-sp-role="${key}">${m.icon}<b>${m.label}</b></button>`).join('')}</div>`;
  }

  function renderLogin() {
    const m = ROLE_META[selectedRole];
    const content = $('#spAuthContent',authRoot());
    content.innerHTML = `
      <h2 id="spAuthTitle">Access SanPaid</h2>
      <p class="sp-auth-sub">Choose a role. These are isolated SIH demo identities; no real stakeholder data is used.</p>
      ${roleButtons()}
      <form id="spLoginForm" class="sp-form-grid">
        <div class="sp-field"><label for="spLoginEmail">Email / demo identity</label><input id="spLoginEmail" type="email" autocomplete="username" value="${esc(m.email)}" required></div>
        <div class="sp-field"><label for="spLoginPassword">Password</label><input id="spLoginPassword" type="password" autocomplete="current-password" value="${DEMO_PASSWORD}" required></div>
        <div id="spLoginMessage" aria-live="polite"></div>
        <button class="sp-auth-primary" id="spLoginSubmit" type="submit">Continue as ${esc(m.label)}</button>
      </form>
      <div class="sp-auth-secondary-row"><span>Guided Demo needs no login.</span><button class="sp-link-btn" id="spOpenGuided" type="button">Open 3-Minute Overview</button></div>
      <div class="sp-auth-helper"><b>${esc(m.label)}:</b> ${esc(m.help)}<br>Connected identities use the shared demo backend and isolated demo dataset.</div>`;
    wireRoleButtons();
    $('#spOpenGuided').onclick = () => { closeAuth(); document.querySelector('#selectorResearchBtn')?.click(); };
    $('#spLoginForm').onsubmit = submitLogin;
  }

  async function submitLogin(e) {
    e.preventDefault();
    const meta = ROLE_META[selectedRole];
    const msg = $('#spLoginMessage');
    const btn = $('#spLoginSubmit');
    msg.innerHTML = '';
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = 'Signing in…';
    try {
      const result = await post('/api/auth/login', {
        identifier:$('#spLoginEmail').value.trim(),
        password:$('#spLoginPassword').value,
        role:meta.role,
        remember:false
      });
      if (meta.target === 'judge') {
        try { if (result.demoToken) sessionStorage.setItem(JUDGE_TOKEN_KEY,result.demoToken); } catch {}
        closeAuth();
        toast(`${meta.label} demo session opened.`);
        setTimeout(() => window.SanPaidJudgeMode?.open?.(), 30);
      } else {
        closeAuth();
        toast(`${meta.label} connected demo opened.`);
        setTimeout(() => window.ConnectedSanPaid?.open?.(meta.persona), 30);
      }
    } catch (err) {
      const text = err.status === 401 ? 'Demo email, password or selected role did not match.' : err.status === 429 ? 'Too many login attempts. Please wait and retry.' : 'Connected demo authentication is temporarily unavailable. Please retry.';
      msg.innerHTML = `<div class="sp-auth-error">${esc(text)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = old;
    }
  }

  function signupRoleSpecific(meta) {
    if (selectedRole === 'WORKER') return `<div class="sp-form-row"><div class="sp-field"><label for="spSignupSkill">Primary service</label><select id="spSignupSkill"><option>Electrician</option><option>Plumber</option><option>Cleaner</option><option>Carpenter</option></select></div><div class="sp-field"><label for="spSignupArea">Service area</label><input id="spSignupArea" placeholder="e.g. Karad Zone 1"></div></div>`;
    if (selectedRole === 'COOPERATIVE_ADMIN' || selectedRole === 'FEDERATION_ADMIN') return `<div class="sp-field"><label for="spSignupOrg">${selectedRole==='COOPERATIVE_ADMIN'?'Cooperative':'Federation / Organization'} name</label><input id="spSignupOrg" placeholder="Authorized organization name"></div><div class="sp-auth-note">Admin onboarding requires authorized organization verification. This evaluator site does not self-approve admin accounts.</div>`;
    return `<div class="sp-field"><label for="spSignupArea">Preferred service area</label><input id="spSignupArea" placeholder="e.g. Karad Zone 1"></div>`;
  }

  function renderSignup() {
    const m = ROLE_META[selectedRole];
    const content = $('#spAuthContent',authRoot());
    if (signupStep === 3) {
      content.innerHTML = `<h2 id="spAuthTitle">Onboarding preview complete</h2><p class="sp-auth-sub">The verification-first UX is demonstrated without creating a real account from the public SIH evaluator site.</p><div class="sp-auth-success"><b>Prototype preview only.</b><br>Production onboarding would remain pending until the required identity / skill / cooperative authorization checks are completed.</div><div class="sp-auth-helper">No personal data entered in this preview is submitted or stored by this UI.</div><button class="sp-auth-primary" id="spSignupDone" type="button">Back to Login</button>`;
      $('#spSignupDone').onclick = () => setAuthMode('login');
      return;
    }
    content.innerHTML = `
      <h2 id="spAuthTitle">Signup / onboarding preview</h2>
      <p class="sp-auth-sub">This demonstrates the intended verification-first signup UX. It does not claim production public registration.</p>
      <div class="sp-auth-stepper" aria-label="Signup preview progress"><span class="done"></span><span class="${signupStep>=2?'done':''}"></span><span></span></div>
      ${roleButtons()}
      <form id="spSignupForm" class="sp-form-grid">
        ${signupStep===1 ? `<div class="sp-form-row"><div class="sp-field"><label for="spSignupName">Full name</label><input id="spSignupName" autocomplete="name" required placeholder="Demo preview name"></div><div class="sp-field"><label for="spSignupEmail">Email</label><input id="spSignupEmail" type="email" autocomplete="email" required placeholder="name@example.com"></div></div><div class="sp-field"><label for="spSignupPassword">Password</label><input id="spSignupPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="8+ characters"><div class="sp-password-meter"><i id="spPasswordMeter"></i></div></div>` : `${signupRoleSpecific(m)}<label class="sp-consent"><input id="spSignupConsent" type="checkbox" required><span>I understand this is an SIH onboarding UX preview and does not create or verify a production account.</span></label>`}
        <div id="spSignupMessage" aria-live="polite"></div>
        <button class="sp-auth-primary" type="submit">${signupStep===1?'Continue to Verification Context':'Complete Preview'}</button>
      </form>
      <div class="sp-auth-secondary-row"><button class="sp-link-btn" id="spSignupBack" type="button">${signupStep===1?'Back to Login':'Back'}</button><span>${esc(m.label)} onboarding</span></div>`;
    wireRoleButtons();
    if (signupStep === 1) {
      $('#spSignupBack').onclick = () => setAuthMode('login');
      $('#spSignupPassword')?.addEventListener('input', updatePasswordStrength);
    } else {
      $('#spSignupBack').onclick = () => { signupStep = 1; renderSignup(); };
    }
    $('#spSignupForm').onsubmit = e => {
      e.preventDefault();
      if (signupStep === 1) { signupStep = 2; renderSignup(); }
      else { signupStep = 3; renderSignup(); }
    };
  }

  function updatePasswordStrength(e) {
    const v = e.target.value || '';
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const meter = $('#spPasswordMeter');
    if (!meter) return;
    meter.style.width = `${score*25}%`;
    meter.style.background = score < 2 ? 'var(--sp-red)' : score < 4 ? 'var(--sp-amber)' : 'var(--sp-green)';
  }

  function wireRoleButtons() {
    $$('[data-sp-role]',authRoot()).forEach(btn => btn.onclick = () => {
      selectedRole = btn.dataset.spRole;
      if (authMode === 'signup') signupStep = 1;
      renderAuth();
    });
  }

  function renderAuth() { authMode === 'signup' ? renderSignup() : renderLogin(); }

  function openAuth(role='CUSTOMER', mode='login') {
    if (ROLE_META[role]) selectedRole = role;
    authMode = mode === 'signup' ? 'signup' : 'login';
    signupStep = 1;
    lastFocus = document.activeElement;
    const root = authRoot();
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    setAuthMode(authMode);
    setTimeout(() => $('.sp-auth-close',root)?.focus(), 0);
  }

  function closeAuth() {
    const root = authRoot();
    root.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus?.isConnected) lastFocus.focus();
    lastFocus = null;
  }

  function trapAuthFocus(e) {
    if (e.key === 'Escape') { closeAuth(); return; }
    if (e.key !== 'Tab') return;
    const root = authRoot();
    const focusables = $$('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',root).filter(x => x.getClientRects().length);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length-1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function installAccessEntrypoints() {
    const roleBtn = $('#getStarted');
    if (roleBtn) {
      roleBtn.textContent = 'ACCESS ROLES';
      roleBtn.setAttribute('aria-label','Open Customer, Worker, Cooperative Admin or Federation Admin access');
      roleBtn.onclick = () => openAuth('CUSTOMER','login');
    }
    const drawer = $('#mobileDrawer');
    if (drawer && !$('#spMobileAccess',drawer)) {
      const btn = document.createElement('button');
      btn.id = 'spMobileAccess';
      btn.className = 'btn secondary';
      btn.type = 'button';
      btn.textContent = 'ACCESS ROLES';
      btn.onclick = () => openAuth('CUSTOMER','login');
      drawer.appendChild(btn);
    }
    $('#coopLogin')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openAuth('COOPERATIVE_ADMIN','login'); });
  }

  function installLogoutFeedback() {
    document.addEventListener('click', e => {
      const target = e.target.closest?.('#connectedLogout,#judgeLogout');
      if (!target) return;
      setTimeout(() => toast('Demo session cleared. You have been logged out.'), 250);
    }, true);
  }

  function installFooterVersion() {
    if ($('.sp-version-footer')) return;
    const footer = document.createElement('div');
    footer.className = 'sp-version-footer';
    footer.innerHTML = '<b>SanPaid · SIH 2026</b> · Selection Build v3 · Updated 31 Aug 2026 · Claim-safe prototype';
    const landing = $('#landing');
    landing?.appendChild(footer);
  }

  function normalizeMobileDrawer() {
    $$('#mobileDrawer a[href^="#"]').forEach(a => a.addEventListener('click', () => {
      const drawer = $('#mobileDrawer');
      const menu = $('#menuBtn');
      drawer?.classList.add('hidden');
      drawer?.setAttribute('aria-hidden','true');
      menu?.setAttribute('aria-expanded','false');
    }));
  }

  function start() {
    if (!$('#landing')) return;
    installSectionRhythm();
    installScrollState();
    installMatchingProgress();
    installAccessEntrypoints();
    installLogoutFeedback();
    installFooterVersion();
    normalizeMobileDrawer();
    window.SanPaidAccess = { open:openAuth, close:closeAuth };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
