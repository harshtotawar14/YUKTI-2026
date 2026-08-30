# YUKTI-2026 — SanPaid

Smart India Hackathon 2026 prototype for **PS ID 26089 — Cooperative Gig Services Platform for Household & Community Services**.

## Current repository handoff

- `index.html` — current SanPaid HTML frontend with mobile/PWA metadata and responsive assets loaded.
- `styles.css` — shared desktop/base styling.
- `mobile.css` — mobile-first responsive layout, touch-target, modal, bottom-nav and dashboard overrides.
- `mobile-fix.css` — final drawer scrolling/header-alignment mobile hotfixes.
- `app.js` — current frontend demo/application logic.
- `voice-request.js` — customer voice capture + worker-scoped voice request delivery/playback enhancement.
- `mobile.js` — functional mobile landing drawer, role-aware dashboard navigation, Customer/Worker bottom navigation, mobile status handling, connectivity banner, install flow and service-worker registration.
- `manifest.webmanifest` — installable SanPaid PWA metadata.
- `service-worker.js` — versioned static app-shell cache and offline navigation fallback.
- `app-icon.svg` — SanPaid PWA/app icon asset.
- `docs/final-research-grounded-frontend-master-prompt.md` — **PRIMARY research-grounded frontend execution prompt**.
- `docs/voice-request-worker-delivery-addendum.md` — **MANDATORY voice-flow addendum**.
- `docs/mobile-first-pwa-upgrade/` — mobile-first/PWA upgrade specification, preserved as ordered parts `01` through `04`.
- `docs/frontend-functionality-repair/` — earlier detailed frontend repair prompt; keep as supporting QA/reference material.
- `docs/backend-master-prompt/` — backend, PostgreSQL/PostGIS, API and system-integration prompt.

## Mobile implementation now present

The repository now includes an actual mobile runtime rather than only a mobile prompt.

Implemented mobile-shell behaviour includes:

- `viewport-fit=cover` and safe-area-aware layout;
- responsive hero/search/cards at phone/tablet widths;
- zero page-level horizontal overflow protection;
- minimum mobile touch targets for primary controls;
- full mobile landing menu instead of desktop-only navigation;
- functional mobile dashboard drawer generated from the current role's real sidebar views;
- Customer bottom navigation: Home / Book / Active / History / More;
- Worker bottom navigation: Home / Offers / Active / Earnings / More;
- Admin/Federation mobile navigation through the real dashboard drawer;
- mobile-safe full-width/bottom-sheet-style modals and 16px form inputs for iOS;
- mobile voice controls and worker voice-offer controls sized for touch;
- responsive QR, toast, timeline, KPI and table handling;
- connection/offline status feedback;
- installable PWA metadata where browser support permits;
- service-worker app-shell caching with an update path.

## Important architecture limitation

The current demo application state is still browser-local (`localStorage`). This means Customer and Worker flows can be demonstrated sequentially on the **same browser/device**, but two separate phones do **not** share bookings, offers or voice requests yet.

Real cross-device behaviour requires the backend phase:

`Customer phone → API/database/realtime event → matched Worker phone`

Do not claim cross-device realtime delivery until the shared backend/database is connected.

## Recommended execution order

### Phase 1 — Research-grounded frontend

Use:

1. `docs/final-research-grounded-frontend-master-prompt.md`
2. `docs/voice-request-worker-delivery-addendum.md`

Core requirements:

- audit the real repository before editing;
- preserve good existing SanPaid design/code;
- remove dead buttons, broken links and fake CTA behaviour;
- replace disconnected/random values with deterministic connected demo state;
- make Customer, Worker, Cooperative Admin and Federation Admin dashboards operational;
- keep eligibility before fairness and worker choice mandatory;
- implement continuous worker trust, Digital Worker ID and dual service-start verification;
- deliver Customer Voice → transcript → booking → eligible worker offer → worker-language text/listen → Accept/Reject;
- preserve the voice-request context when the first worker rejects or times out;
- keep payment/biometric integrations honestly sandboxed;
- synchronize affected dashboards and persist state.

### Phase 2 — Mobile-first + PWA upgrade

Reference specification:

1. `docs/mobile-first-pwa-upgrade/01-audit-layout-navigation-voice.txt`
2. `docs/mobile-first-pwa-upgrade/02-voice-booking-mobile-workflows.txt`
3. `docs/mobile-first-pwa-upgrade/03-pwa-offline-performance-golden-demo.txt`
4. `docs/mobile-first-pwa-upgrade/04-permissions-breakpoints-qa-start.txt`

A first implementation pass is now present in `mobile.css`, `mobile-fix.css` and `mobile.js`. Continue testing against the acceptance goals below rather than creating a second mobile website.

Mobile acceptance goals:

- same SanPaid product works on Android, iPhone, tablet and desktop;
- zero horizontal page scrolling;
- proper mobile landing navigation and dashboard navigation;
- Customer and Worker flows are fully usable from a phone without desktop dependency;
- Worker Job Offers preserve the mobile voice request + Listen + Accept/Reject flow;
- voice fallback works when SpeechRecognition or TTS is unavailable;
- mobile location/camera permission failure never crashes booking;
- mobile-safe touch targets, bottom sheets/modals, forms, filters and admin tables;
- PWA manifest/service-worker/install flow where supported;
- offline app shell with honest local/offline semantics;
- refresh preserves booking, voice request, offer, worker acceptance, service state, payment and complaint;
- zero dead mobile buttons and zero critical mobile console/runtime errors.

### Phase 3 — Supporting frontend QA

If extra repair detail is needed, follow:

1. `docs/frontend-functionality-repair/01-audit-state-booking-customer.txt`
2. `docs/frontend-functionality-repair/02-worker-admin-service-payment.txt`
3. `docs/frontend-functionality-repair/03-validation-responsive-click-audit.txt`
4. `docs/frontend-functionality-repair/04-golden-flows-qa-start.txt`

### Phase 4 — Backend / database / API integration

Then follow:

1. `docs/backend-master-prompt/01-foundation-auth-booking.txt`
2. `docs/backend-master-prompt/02-booking-matching-verification-payment.txt`
3. `docs/backend-master-prompt/03-payments-complaints-governance-ai.txt`
4. `docs/backend-master-prompt/04-forecast-database-api-security.txt`
5. `docs/backend-master-prompt/05-reliability-golden-demo-testing.txt`
6. `docs/backend-master-prompt/06-integration-deployment-definition-done.txt`

The backend phase must treat the final responsive frontend as the UI contract, replace remaining demo adapters with real APIs, and connect PostgreSQL/PostGIS, authentication/RBAC, booking/matching, worker verification, voice-request delivery, service-start verification, payments, complaints/SLA, cooperative/federation governance, capacity exchange, AI/forecasting, audit/security, testing and deployment.

## Critical voice-flow rule

A microphone button alone is **not** a completed voice feature.

The feature is complete only when:

`Customer speaks → transcript is captured → customer confirms critical fields → booking stores the voice-derived request → eligibility/fair matching selects a worker → a worker-scoped offer is created → the worker can read/listen in a supported preferred language → the worker Accepts/Rejects → all affected role views update and persist.`

If the first worker rejects or times out, create a new offer for the next eligible worker while carrying the same confirmed voice-request context forward.

## Product positioning

SanPaid should be presented as an **AI-assisted cooperative workforce operating network**, not another generic home-service marketplace.

Core integrated differentiation:

- Cooperative / Federation Governance
- Cross-Cooperative Capacity Exchange
- Eligibility-First Fair Opportunity
- Explainable Ranking
- Continuous Trust Lifecycle
- Worker Choice
- Dual Service-Start Verification
- Transparent Earnings + Service Passport
- Demand → Capacity → Skill-Gap Planning
- Auditable Governance

> Demo-only integrations such as sandbox payment, speech/translation fallback or sandbox identity verification must remain honestly labelled until real production integrations are connected.
