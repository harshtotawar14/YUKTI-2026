(() => {
  'use strict';

  document.getElementById('demoReadiness')?.remove();

  async function waitForAuth(attempts = 40) {
    for (let i = 0; i < attempts; i += 1) {
      if (window.SanPaidAuth?.open && window.SanPaidAuth?.getRole) return window.SanPaidAuth;
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    return null;
  }

  function hardenAdministrativeEntry() {
    const mode = window.SanPaidJudgeMode;
    if (!mode?.open || mode.__governmentEntryGuard === true) return;
    const originalOpen = mode.open.bind(mode);
    mode.open = async (...args) => {
      const auth = await waitForAuth();
      const role = String(auth?.getRole?.() || '').toUpperCase();
      if (!['COOPERATIVE_ADMIN', 'FEDERATION_ADMIN'].includes(role)) {
        auth?.open?.('COOPERATIVE_ADMIN', null);
        return false;
      }
      return originalOpen(...args);
    };
    mode.__governmentEntryGuard = true;
  }

  hardenAdministrativeEntry();
  setTimeout(hardenAdministrativeEntry, 300);
  setTimeout(hardenAdministrativeEntry, 900);

  window.SanPaidRuntimeStatus = Object.assign({}, window.SanPaidRuntimeStatus, {
    demoPreflight: 'RETIRED_FROM_PUBLIC_UI',
    legacyAdminLogin: 'GATED_BY_UNIFIED_AUTH'
  });

  window.SanPaidDemoPreflight = {
    run: async () => ({
      ok: false,
      retired: true,
      message: 'Public demo preflight is retired. Use operational health monitoring instead.'
    })
  };
})();
