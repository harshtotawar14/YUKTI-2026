# YUKTI-2026 — SanPaid

Smart India Hackathon 2026 prototype for **PS ID 26089 — Cooperative Gig Services Platform for Household & Community Services**.

## Current repository handoff

- `index.html` — current SanPaid HTML frontend.
- `styles.css` — current shared styling.
- `app.js` — current frontend demo/application logic.
- `voice-request.js` — customer voice capture + worker-scoped voice request delivery/playback enhancement.
- `docs/final-research-grounded-frontend-master-prompt.md` — **PRIMARY research-grounded frontend execution prompt**.
- `docs/voice-request-worker-delivery-addendum.md` — **MANDATORY voice-flow addendum**.
- `docs/mobile-first-pwa-upgrade/` — **MANDATORY mobile-first/PWA upgrade prompt**, preserved as ordered parts `01` through `04`.
- `docs/frontend-functionality-repair/` — earlier detailed frontend repair prompt; keep as supporting QA/reference material.
- `docs/backend-master-prompt/` — backend, PostgreSQL/PostGIS, API and system-integration prompt; use after the frontend state/UI contract is stable.

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

Follow in order:

1. `docs/mobile-first-pwa-upgrade/01-audit-layout-navigation-voice.txt`
2. `docs/mobile-first-pwa-upgrade/02-voice-booking-mobile-workflows.txt`
3. `docs/mobile-first-pwa-upgrade/03-pwa-offline-performance-golden-demo.txt`
4. `docs/mobile-first-pwa-upgrade/04-permissions-breakpoints-qa-start.txt`

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
- offline app shell with honest `PENDING SYNC` semantics;
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
