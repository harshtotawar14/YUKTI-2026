(() => {
  'use strict';
  document.getElementById('demoReadiness')?.remove();
  window.SanPaidRuntimeStatus = Object.assign({}, window.SanPaidRuntimeStatus, {
    demoPreflight: 'RETIRED_FROM_PUBLIC_UI'
  });
  window.SanPaidDemoPreflight = {
    run: async () => ({ ok: false, retired: true, message: 'Public demo preflight is retired. Use operational health monitoring instead.' })
  };
})();
