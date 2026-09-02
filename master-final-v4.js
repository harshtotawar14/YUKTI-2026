(() => {
  'use strict';
  // Compatibility marker only.
  // The former v4 runtime installed duplicate role-entry capture handlers,
  // MutationObservers and workspace copy logic that now belong to canonical
  // auth-unified.js, customer-worker-dashboard.js and demo-first-stable.js.
  // CSS may still be loaded for mature visual primitives; no runtime ownership remains here.
  window.SanPaidRuntimeStatus=Object.assign({},window.SanPaidRuntimeStatus,{masterFinalV4:'RETIRED_RUNTIME'});
})();
