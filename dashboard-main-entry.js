(() => {
  'use strict';

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function waitForRuntime(timeoutMs = 12000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (window.SanPaidAuth?.login && window.SanPaidAuth?.openRoleWorkspace && window.ConnectedSanPaid?.open) {
        return window.SanPaidAuth;
      }
      await sleep(80);
    }
    return null;
  }

  function forceCustomerOverview() {
    try { sessionStorage.setItem('sanpaid_dashboard_view_customer', 'overview'); } catch {}

    const button = document.querySelector('#connectedShell #cwDashboard [data-cw-view-btn="overview"]');
    if (button && !button.classList.contains('active')) button.click();

    const shell = document.getElementById('connectedShell');
    const main = shell?.querySelector(':scope > .connected-main');
    if (shell) shell.scrollTop = 0;
    if (main) main.scrollTop = 0;
  }

  async function customerDemoAccess() {
    const response = await fetch('/api/auth/demo-access', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('DEMO_ACCESS_UNAVAILABLE');
    const data = await response.json();
    const account = (data.accounts || []).find(item => String(item.role || '').toUpperCase() === 'CUSTOMER');
    if (!account?.accessId || !data.password) throw new Error('CUSTOMER_ACCESS_MISSING');
    return { accessId: account.accessId, password: data.password };
  }

  async function bootCustomerDashboard() {
    if (window.__SANPAID_ROOT_DASHBOARD_BOOT__) return;
    window.__SANPAID_ROOT_DASHBOARD_BOOT__ = true;

    try { sessionStorage.setItem('sanpaid_dashboard_view_customer', 'overview'); } catch {}

    const auth = await waitForRuntime();
    if (!auth) return;

    try {
      let user = await auth.restoreSession?.();
      let role = String(auth.getRole?.() || user?.role || '').toUpperCase();

      if (role !== 'CUSTOMER') {
        if (user) await auth.logout?.({ silent: true, keepModal: true });
        const credentials = await customerDemoAccess();
        await auth.login({
          identifier: credentials.accessId,
          password: credentials.password,
          role: 'CUSTOMER',
          remember: false
        });
      }

      try { sessionStorage.setItem('sanpaid_dashboard_view_customer', 'overview'); } catch {}
      await auth.openRoleWorkspace('CUSTOMER', 'CUSTOMER');

      for (let i = 0; i < 80; i += 1) {
        if (document.querySelector('#connectedShell:not(.hidden) #cwDashboard')) break;
        await sleep(75);
      }
      forceCustomerOverview();
    } catch (error) {
      console.warn('[SanPaid main dashboard] automatic customer workspace open failed.', error?.message || error);
      auth.open?.('CUSTOMER', 'login', 'CUSTOMER');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootCustomerDashboard, { once: true });
  } else {
    bootCustomerDashboard();
  }
})();
