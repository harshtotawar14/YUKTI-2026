# SanPaid Dead-Code and Duplicate-UI Removal Log

This file records removals only when there is evidence that the code is hidden, duplicated, unreachable, or replaced by a canonical runtime owner.

| Candidate | Evidence | Decision |
|---|---|---|
| `build-assets/hero-hq-00.b64` | The production builder only decodes `hero-final-*.b64`; this fragment was not part of the checksum-verified hero output. | Removed. |
| `mobile-light-role-fix.css` | No reference in root HTML, build allowlist, service worker, inspected frontend loaders, or audited tests; it was outside the deploy allowlist. | Removed. |
| `master-v2.css` | No HTML, runtime loader, CSS import, or test-contract reference; only stale build/offline-cache entries existed. Both entries were removed and the service-worker cache was versioned. | Removed. |
| `assets/sanpaid-reference-hero-right-hq.svg` | No reference in runtime source, build inputs, or audited tests; the live hero WebP is generated from the `hero-final-*.b64` fragments. | Removed. |
| `.quick-booking-details` landing block | `evaluator-final.css` permanently sets `display:none!important`; it duplicates Role Access and Golden Demo controls. | Removed from deployable `dist/index.html` by `scripts/build.mjs`. Physical source removal will happen during frontend migration. |
| `heroService`, `heroArea`, `heroSearch`, `catalogRetry`, `bookServiceHero`, `joinWorker`, `coopLogin` inside hidden quick block | Controls are inside the permanently hidden block and are not part of the visible evaluator path. | No longer treated as critical UI acceptance controls. Deploy artifact does not include them. |
| Customer/Worker dashboard loaded on every landing visit | Role dashboard JS/CSS is not needed to read the public SIH story. | Deferred until connected-role user intent through `top1-polish.js`. |
| Cooperative/Federation administration bundle on normal landing | Heavy role-specific workspace is unnecessary until an admin/federation path is requested. | Remains lazy-loaded. Explicit admin intent triggers load. |
| Legacy localStorage application engine / legacy voice shell | Previously duplicated backend/PostgreSQL state and connected voice flow. | Already removed; must not return. |

## Removal rule

Do not delete a file merely because its name looks old. Before deletion, prove all of the following:

1. no static HTML reference;
2. no dynamic script/style loader reference;
3. no service-worker/build manifest reference;
4. no test contract requires it;
5. no role-specific runtime depends on its global API;
6. local build and Chromium audit pass after removal.

## Next cleanup candidates

Investigate, do not blindly delete:

- overlapping presentation layers such as `sih-final.css`, `selector-mode.css`, `credibility-layer.css`, `workforce-intelligence.css`, `evaluator-final.css`;
- duplicate global loaders/portal initializers;
- old DOM selectors for service-grid or pre-connected landing booking paths;
- role-specific scripts that can be loaded only after role selection.
