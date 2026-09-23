(() => {
  'use strict';

  const ROLE_VIEW = {
    CUSTOMER: { icon: '👥', label: 'Customer' },
    WORKER: { icon: '👷', label: 'Worker' },
    COOPERATIVE_ADMIN: { icon: '🏢', label: 'Cooperative Admin' },
    FEDERATION_ADMIN: { icon: '🏛️', label: 'Federation Admin' }
  };

  function selectedRole(root) {
    return root.querySelector('.spu-role.active')?.dataset?.spuRole || 'CUSTOMER';
  }

  function referenceCredentials(root) {
    const codes = [...root.querySelectorAll('.spu-demo-access code')].map(node => node.textContent.trim()).filter(Boolean);
    const role = selectedRole(root);
    const fallbackIds = {
      CUSTOMER: 'customer',
      WORKER: 'worker-a',
      COOPERATIVE_ADMIN: 'cooperative-admin',
      FEDERATION_ADMIN: 'federation-admin'
    };
    return {
      id: codes[0] || fallbackIds[role] || 'customer',
      password: codes[1] || ''
    };
  }

  function applyReferenceLogin() {
    const root = document.getElementById('sanpaidUnifiedAuthRoot');
    if (!root || root.hidden) return;

    const entryCustomer = root.querySelector('[data-spu-entry-role="CUSTOMER"]');
    if (entryCustomer && !root.querySelector('#spuLoginForm')) {
      if (root.dataset.referenceOpening !== 'true') {
        root.dataset.referenceOpening = 'true';
        setTimeout(() => {
          root.dataset.referenceOpening = '';
          if (entryCustomer.isConnected) entryCustomer.click();
        }, 0);
      }
      return;
    }

    const form = root.querySelector('#spuLoginForm');
    const content = root.querySelector('#spuContent');
    if (!form || !content || form.dataset.referenceApplied === 'true') return;

    form.dataset.referenceApplied = 'true';
    root.classList.add('spu-reference-login');

    if (!content.querySelector('.spu-login-reference-brand')) {
      const brand = document.createElement('div');
      brand.className = 'spu-login-reference-brand';
      brand.innerHTML = `<img src="app-icon.svg" alt="" aria-hidden="true"><span class="spu-login-reference-wordmark"><strong>San<span>Paid</span></strong><small>Cooperative Workforce Network</small></span>`;
      content.prepend(brand);
    }

    if (!root.querySelector('.spu-login-reference-motto')) {
      const motto = document.createElement('div');
      motto.className = 'spu-login-reference-motto';
      motto.textContent = 'Serve Today   |   Prepare Tomorrow';
      root.appendChild(motto);
    }

    const title = root.querySelector('#spuTitle');
    if (title) title.innerHTML = 'Welcome to <span class="spu-title-accent">SanPaid</span>';
    const subtitle = root.querySelector('.spu-sub');
    if (subtitle) subtitle.textContent = 'Choose your role to continue';

    root.querySelectorAll('[data-spu-role]').forEach(button => {
      const view = ROLE_VIEW[button.dataset.spuRole];
      if (!view) return;
      const code = button.querySelector('.spu-role-code');
      const label = button.querySelector('b');
      if (code) code.textContent = view.icon;
      if (label) label.textContent = view.label;
    });

    const access = root.querySelector('#spuEmail');
    const password = root.querySelector('#spuPassword');
    if (access) {
      access.placeholder = 'Enter your ID';
      access.setAttribute('aria-label', 'Access ID');
      if (!access.dataset.referenceUserEdited) access.value = '';
      access.addEventListener('input', () => { access.dataset.referenceUserEdited = 'true'; }, { once: true });
    }
    if (password) {
      password.placeholder = 'Enter your password';
      password.setAttribute('aria-label', 'Password');
    }

    const submit = root.querySelector('#spuLoginSubmit');
    if (submit && !submit.disabled) submit.textContent = 'Sign In';

    root.querySelector('.spu-login-demo-line')?.remove();
    const credentials = referenceCredentials(root);
    const accessLine = document.createElement('div');
    accessLine.className = 'spu-login-demo-line';
    accessLine.setAttribute('role', credentials.password ? 'button' : 'status');
    if (credentials.password) accessLine.setAttribute('tabindex', '0');
    accessLine.setAttribute('aria-label', credentials.password ? 'Use review access credentials' : 'Loading review access credentials');
    accessLine.innerHTML = `<span><b>Review Access:</b> <code>${credentials.id}</code> / <code>${credentials.password || 'Loading…'}</code></span>`;
    const fill = () => {
      if (!credentials.password) return;
      const idInput = root.querySelector('#spuEmail');
      const passwordInput = root.querySelector('#spuPassword');
      if (idInput) { idInput.value = credentials.id; idInput.dataset.referenceUserEdited = 'true'; }
      if (passwordInput) passwordInput.value = credentials.password;
      idInput?.focus();
    };
    accessLine.addEventListener('click', fill);
    accessLine.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fill(); }
    });
    form.insertAdjacentElement('afterend', accessLine);
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyReferenceLogin();
    });
  };

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  schedule();
})();
