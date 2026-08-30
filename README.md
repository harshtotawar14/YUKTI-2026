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
- `docs/final-research-grounded-frontend-master-prompt.md` — **PRIMARY research-grounded frontend specification**.
- `docs/voice-request-worker-delivery-addendum.md` — **MANDATORY voice-flow addendum**.
- `docs/mobile-first-pwa-upgrade/` — mobile-first/PWA specification and QA reference.
- `docs/final-sih-demo-hardening/` — **NEW FINAL SIH HARDENING PHASE**: shared backend, two-device realtime workflow, deep booking lifecycle, governance, capacity exchange, SLA, demand planning and final acceptance QA.
- `docs/frontend-functionality-repair/` — supporting frontend repair/QA reference.
- `docs/backend-master-prompt/` — detailed backend/PostgreSQL/PostGIS/API/system-integration reference.

## Mobile implementation now present

The repository includes an actual mobile runtime rather than only a mobile prompt.

Implemented mobile-shell behaviour includes:

- `viewport-fit=cover` and safe-area-aware layout;
- responsive hero/search/cards at phone/tablet widths;
- page-level horizontal overflow protection;
- mobile touch targets for primary controls;
- full mobile landing menu;
- functional role-aware mobile dashboard drawer;
- Customer bottom navigation: Home / Book / Active / History / More;
- Worker bottom navigation: Home / Offers / Active / Earnings / More;
- Admin/Federation navigation through the real dashboard drawer;
- mobile-safe full-width/bottom-sheet-style modals and 16px form inputs for iOS;
- mobile voice controls and worker voice-offer controls sized for touch;
- responsive QR, toast, timeline, KPI and table handling;
- connection/offline status feedback;
- installable PWA metadata where browser support permits;
- service-worker app-shell caching with an update path.

## Important current architecture limitation

The current demo application state is still browser-local (`localStorage`). Customer and Worker flows can be demonstrated sequentially on the same browser/device, but two separate phones do **not** share bookings, offers or voice requests yet.

The final hardening target is:

`Customer phone → API → PostgreSQL/shared backend → matching/business rules → realtime event → Worker phone`

Do not claim cross-device realtime delivery until this shared backend path is actually connected.

## Recommended execution order

### Phase 1 — Research-grounded frontend

Use:

1. `docs/final-research-grounded-frontend-master-prompt.md`
2. `docs/voice-request-worker-delivery-addendum.md`

Keep the core product rules intact: eligibility before fairness, worker choice mandatory, continuous trust, dual service-start verification, honest sandbox labels, connected role state and claim-safe UI.

### Phase 2 — Mobile-first + PWA

Follow/reference:

1. `docs/mobile-first-pwa-upgrade/01-audit-layout-navigation-voice.txt`
2. `docs/mobile-first-pwa-upgrade/02-voice-booking-mobile-workflows.txt`
3. `docs/mobile-first-pwa-upgrade/03-pwa-offline-performance-golden-demo.txt`
4. `docs/mobile-first-pwa-upgrade/04-permissions-breakpoints-qa-start.txt`

A first implementation pass is present in `mobile.css`, `mobile-fix.css` and `mobile.js`.

### Phase 3 — Final SIH Demo Hardening — NEXT MAIN IMPLEMENTATION PHASE

Follow strictly in order:

1. `docs/final-sih-demo-hardening/01-backend-two-device-matching.txt`
2. `docs/final-sih-demo-hardening/02-trust-service-capacity-sla.txt`
3. `docs/final-sih-demo-hardening/03-demand-mobile-realtime-demo.txt`
4. `docs/final-sih-demo-hardening/04-qa-security-acceptance-start.txt`

Main objective:

**Do not add random features. Turn the current feature-rich prototype into a connected, two-device, backend-backed SIH demonstration.**

Priority order:

`Shared Backend + PostgreSQL → Cross-device Customer/Worker booking → Realtime Offer/Accept/Reject → One flawless booking lifecycle → Dual Verification → Explainable Fair Matching → Cooperative Command Center → Capacity Exchange → Complaint/SLA → Demand→Capacity→Skill Gap → Service Passport → final mobile/QA polish`

Critical target flow:

`Customer Phone → Voice/Text Request → Backend Booking → Eligibility → Fair Ranking → Worker Offer on Another Phone → Listen → Accept/Reject → Customer Realtime Update → Arrival → Sandbox Identity → One-Time QR → Customer Confirmation → Service → Extra Charge Approval → Completion → Sandbox Payment → Invoice → Rating → Passport/Audit/Analytics`

The hardening phase also requires:

- deterministic, connected and believable seed data;
- no fake/random KPI values;
- realtime cross-device events for critical booking/service actions;
- worker reject fallback and replacement;
- server-side service-start lock;
- capacity exchange with worker consent;
- complaint L1→L2→L3 SLA workflow;
- forecast confidence with actionable capacity/training recommendations;
- transactions/idempotency/race protection for sensitive operations;
- one-click SIH demo reset;
- final two-browser/two-device QA and zero critical dead buttons.

### Phase 4 — Supporting frontend QA

Use if additional repair detail is needed:

1. `docs/frontend-functionality-repair/01-audit-state-booking-customer.txt`
2. `docs/frontend-functionality-repair/02-worker-admin-service-payment.txt`
3. `docs/frontend-functionality-repair/03-validation-responsive-click-audit.txt`
4. `docs/frontend-functionality-repair/04-golden-flows-qa-start.txt`

### Phase 5 — Detailed backend reference

Use `docs/backend-master-prompt/` as the deeper PostgreSQL/PostGIS/API/security/reliability implementation reference while executing Phase 3.

## Critical voice-flow rule

A microphone button alone is **not** a completed voice feature.

The feature is complete only when:

`Customer speaks → transcript is captured → customer confirms critical fields → backend booking stores the request → eligibility/fair matching selects a worker → worker-scoped offer reaches the matched worker on another session/device → worker can read/listen in a supported preferred language → Accept/Reject → all affected role views update and persist.`

If the first worker rejects or times out, create a new offer for the next eligible worker while carrying the same confirmed voice-request context forward.

## Final SIH quality rule

Every important SanPaid claim must have working proof:

- Verified Workers → Worker Verification Workflow
- Fair Opportunities → Eligibility + Explainable Ranking + Worker Choice
- Customer Trust → Dual Service-Start Verification
- Reliability → Reject fallback + Replacement
- Cooperative Governance → Command Center
- Federation Governance → Capacity Exchange
- Accountability → Complaint + SLA + Audit
- Worker Growth → Service Passport + Training
- Planning → Demand → Capacity → Skill Gap → Action
- Inclusive Access → Marathi/Hindi/English Voice
- Mobile Accessibility → Customer + Worker two-device demonstration

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
