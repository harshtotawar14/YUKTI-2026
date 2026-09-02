(() => {
  'use strict';

  // Retired compatibility marker.
  // Authentication, role restoration and workspace access are owned exclusively
  // by auth-unified.js. The former Selection Ready v3 runtime duplicated login,
  // signup, role routing and demo credential handling and is intentionally no
  // longer executable. selection-ready-v3.css remains available for mature
  // presentation primitives where they are still used by the canonical UI.
  window.SanPaidRuntimeStatus=Object.assign({},window.SanPaidRuntimeStatus,{
    selectionReadyV3Runtime:'RETIRED',
    authenticationOwner:'auth-unified.js'
  });
})();
