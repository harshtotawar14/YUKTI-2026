# Frontend

This folder is the human-readable frontend section of SanPaid.

The deployed frontend is currently a static multi-script application built from the repository root into `dist/`. To avoid breaking the verified production runtime, the existing public source files remain at the root for now; this document is the canonical frontend map until the physical move is done in a dedicated migration commit with all build/tests updated together.

## Entry point
- `../index.html` — landing page, evaluator narrative and public UI shell.

## Core runtime
- `../app.js` — landing/catalog/mobile navigation bootstrap.
- `../mobile.js` — mobile behavior.
- `../auth-unified.js` / `../auth-unified.css` — role access/auth UI.
- `../connected-runtime-fix.js` — canonical connected runtime compatibility layer.
- `../connected-demo.js` / `../connected-demo.css` — golden demo shell.
- `../connected-service-ui.js` — booking/service workflow UI.
- `../connected-commerce-ui.js` — charges, checkout, invoice/rating UI.
- `../customer-worker-dashboard.js` / `.css` — customer and worker workspaces.
- `../cooperative-portal.js` / `.css` — Cooperative Admin workspace.
- `../federation-portal.js` / `.css` — Federation workspace.
- `../admin-command-center.js` / `.css` — governance/command-center UI.
- `../capacity-worker-ui.js` — worker capacity-offer UI.
- `../judge-demo.js` / `.css` — evaluator/judge evidence UI.
- `../workforce-intelligence.js` / `.css` — workforce intelligence presentation.
- `../credibility-layer.js` / `.css` — evidence/credibility UI.
- `../handover-evidence.js` / `.css` — connected evidence layer.
- `../evaluator-final.js` / `.css` — final evaluator polish/behavior.

## Styling
- `../design-tokens.css` — shared tokens.
- `../styles.css` — base website styles.
- `../mobile.css` — responsive rules.
- `../color-system-v5.css`, `../sih-final.css`, `../selector-mode.css`, `../hero-viewport-fix.css` — presentation layers.

## Public assets
- `../app-icon.svg`
- `../social-preview.svg`
- `../manifest.webmanifest`
- `../service-worker.js`
- `../robots.txt`
- `../sitemap.xml`

## Frontend quality gates
- `../tests/ui-contract.test.mjs` checks duplicate IDs, button wiring, accessible names, broken local assets, invalid links and critical demo controls.
- `../tests/runtime-integrity.mjs` checks canonical runtime, security, service worker and source integrity.

Do not add new frontend source files at repository root without also adding them to this map or migrating them into the final frontend source tree.