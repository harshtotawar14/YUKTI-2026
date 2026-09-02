# SanPaid Runtime Audit Status

## Current Repair Principle
One canonical runtime per responsibility. Connected backend data wins over legacy localStorage demo state. No feature is marked working only because code exists.

## Frontend Runtime Decisions

| File / Layer | Status | Decision | Reason |
|---|---|---|---|
| `app.js` | REWRITTEN | KEEP LEAN | Old file contained a second localStorage login/booking/payment/dashboard engine. It now only handles landing utilities and routes users into unified auth. |
| `auth-unified.js` | REWRITTEN | CANONICAL AUTH | Saves Customer/Worker connected token, Admin/Federation judge token, restores backend session, stores tab-level active workspace and resumes it after refresh. |
| `connected-runtime-fix.js` | REWRITTEN | CANONICAL CONNECTED TRANSPORT | Auth remains same-origin; connected APIs use bearer/cookie fallback. `/api/auth/me` can restore from connected bearer token. |
| `service-worker.js` | REWRITTEN | KEEP | Old large shell cache replaced with network-first runtime cache. Old `sanpaid-*` caches are deleted on activation. APIs and deployment identity are not cached. |
| `connected-demo.js` | KEEP | AUDITED CORE | Owns connected Customer/Worker shell, booking request and worker offer UI. Must remain backend-connected. |
| `connected-service-ui.js` | KEEP | AUDITED FEATURE MODULE | Service lifecycle actions remain connected to backend service routes. |
| `connected-commerce-ui.js` | KEEP | AUDITED FEATURE MODULE | Additional charges, sandbox checkout/payment/invoice/rating. |
| `customer-worker-dashboard.js` | KEEP / MONITOR | ROLE DASHBOARD ENHANCER | Organizes connected modules into one Customer/Worker dashboard. Some new sections depend on latest backend role-dashboard routes being deployed. |
| `worker-trust-passport-ui.js` | KEEP | SAFE WORKER TRUST VIEW | Connected worker-facing trust/verification view. |
| `capacity-worker-ui.js` | KEEP | SPECIALIZED CONNECTED MODULE | Cross-cooperative worker consent/capacity proof; should not replace normal job offers. |
| `judge-demo.js` | KEEP | ADMIN/FEDERATION PROOF ENGINE | Underlying authenticated admin/federation proof workspace. |
| `admin-command-center.js` | KEEP | ADMIN UI LAYER | Cooperative/Federation command-center renderer. |
| `cooperative-portal.js` | KEEP | ROLE-SPECIFIC UI | Cooperative Admin portal augmentation. |
| `federation-portal.js` | KEEP | ROLE-SPECIFIC UI | Federation regional portal augmentation. |
| `top1-polish.js` | KEEP AS LOADER | RUNTIME LOADER | Dynamically loads modern auth/dashboard/admin layers. Avoid adding more duplicate loaders. |
| legacy `#appShell`, `voice-lazy-loader.js`, `voice-request.js` | REMOVED | DELETE | The hidden localStorage application/voice engine duplicated the connected Customer flow and could create misleading browser-local state. |
| `scripts/build.mjs` | NEW | KEEP | Produces the deployable static artifact and `/build-info.json` with the exact commit identity. |

## Critical Root Causes Found

### 1. Customer/Worker token was lost after unified login
`/api/auth/login` returns `demoToken`, but the old unified auth stored it only for Admin/Federation. Customer/Worker connected shell then had no bearer token.

**Fix:** Customer/Worker now store `sanpaid_connected_demo_token_v1`; Admin/Federation use `sanpaid_judge_demo_token_v1`.

### 2. Refresh restored authentication but not the workspace
The old auth controller called `/api/auth/me` after load but never remembered that Customer/Worker/Admin/Federation workspace was open.

**Fix:** `sanpaid_active_workspace_v2` is stored in `sessionStorage`. On a normal refresh, a valid matching session automatically reopens the same role workspace. Closing/logging out clears it.

### 3. Connected runtime could synthesize a 401 when token was absent
The old fetch override intercepted auth requests in ways that could prevent normal same-origin cookie/session restoration.

**Fix:** auth uses same-origin session requests; connected APIs use bearer when available and same-origin cookie fallback otherwise. `/api/auth/me` can use connected bearer restoration when needed.

### 4. Two application engines were active
Old `app.js` maintained fake users, bookings, workers, payments, complaints and dashboards in localStorage while the connected system used backend/PostgreSQL.

**Fix:** old local application engine, hidden shell and lazy legacy voice module are removed. `app.js` is now a landing router only; connected voice remains in `connected-demo.js`.

### 5. Stale service-worker assets could survive deployment
The previous service worker precached a very large list of JS/CSS files and kept multiple runtime generations available.

**Fix:** `sanpaid-runtime-v70` uses network-first HTML/JS/CSS loading, deletes older SanPaid caches, never caches `/build-info.json`, and precaches assets independently so one optional asset cannot cancel the entire installation.

### 6. Some browser modules bypassed the same-origin API policy
`credibility-layer.js` and `workforce-intelligence.js` previously called a deleted Render host directly while the enforced CSP allowed only `connect-src 'self'`.

**Fix:** browser API traffic now uses the repository-owned `/api/*` Vercel functions. A Golden Demo readiness gate verifies backend health and the database-backed catalog before connected Customer/Worker access.

## Backend Source Status

**BACKEND SOURCE REBUILT IN THIS REPOSITORY.** `api/[...path].js`, `api/_lib/*` and `database/schema.sql` are now the canonical deployable backend. The deleted/suspended Render service is not used. Live/database-backed claims remain pending until Vercel has a valid `DATABASE_URL` and the production contract passes.

## Refresh Acceptance Tests Required

These must be browser-tested against the deployed frontend + database-connected backend:

1. Customer login -> Customer dashboard -> browser refresh -> Customer dashboard reopens.
2. Customer with active booking -> refresh -> same booking reloads.
3. Worker login -> Worker dashboard -> refresh -> Worker dashboard reopens.
4. Worker pending offer -> refresh -> same offer remains.
5. Worker accepted job -> refresh -> current job state remains.
6. Cooperative Admin -> refresh -> Cooperative workspace reopens.
7. Federation Admin -> refresh -> Federation workspace reopens.
8. Logout -> refresh -> no dashboard auto-opens.
9. Invalid/expired token -> login required; no fake dashboard.

## Deployment Truth

CI now reports `Source integrity` and `Production deployment integrity` separately. Production requires the active URL to serve `/build-info.json` for the exact pushed commit, then pass backend health and database catalog contracts. Configure the repository variable `SANPAID_PRODUCTION_URL` when the active Vercel domain changes.

Backend source, Vercel function deployment and database behavior are checked separately. Source-ready is not the same as database-connected live.
