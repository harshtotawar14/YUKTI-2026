# YUKTI-2026 — SanPaid

Smart India Hackathon 2026 prototype for **PS ID 26089 — Cooperative Gig Services Platform for Household & Community Services**.

## Current repository handoff

- `index.html` — SanPaid landing/app shell with mobile/PWA + Connected SIH Demo entry.
- `styles.css` — shared desktop/base styling.
- `mobile.css` — mobile-first responsive layout, touch-target, modal, bottom-nav and dashboard overrides.
- `mobile-fix.css` — final drawer scrolling/header-alignment mobile hotfixes.
- `connected-demo.css` — responsive two-device connected-demo UI.
- `app.js` — browser-local fallback/demo application logic.
- `voice-request.js` — browser-local customer voice capture + worker delivery enhancement.
- `mobile.js` — mobile landing drawer, role-aware navigation, bottom navigation, connectivity, install flow and service-worker registration.
- `connected-demo.js` — shared-backend Customer/Worker two-device workflow using `/api/connected/*`.
- `vercel.json` — same-origin `/api/*` proxy to the shared SanPaid Render backend.
- `manifest.webmanifest` — PWA metadata.
- `service-worker.js` — versioned app-shell cache; `/api/*` is never served from cache.
- `app-icon.svg` — PWA/app icon.
- `docs/final-sih-demo-hardening/` — final SIH hardening specification.

## Connected SIH implementation now present

The repository now contains two modes:

1. **Main prototype/fallback mode** — browser-local state for rehearsals and offline-safe UI demonstrations.
2. **Connected Two-Device Demo** — shared backend/PostgreSQL workflow for cross-browser/customer-worker proof.

Connected flow implemented in the frontend:

`Customer Device → backend login → Voice/Text Request → POST /api/connected/bookings → eligibility-first matching → worker-scoped offer → Worker Device → Listen → Accept/Reject → shared booking update → SSE snapshot → Customer Device update`

Backend implementation lives in the existing `harshtotawar14/SanPaid-sih-2026` backend and uses the already-existing PostgreSQL/Supabase database. The connected API layer adds:

- `/api/connected/health`
- `/api/connected/me`
- `POST /api/connected/bookings`
- `GET /api/connected/customer/bookings/:id`
- `GET /api/connected/worker/offers`
- `POST /api/connected/worker/offers/:id/respond`
- `GET /api/connected/events` (SSE snapshots)

The connected flow uses verified + available + skill-verified workers before deterministic ranking. Worker rejection records the reason, keeps the same booking/voice context, and sends the next eligible worker a new offer. Acceptance is transaction-protected so the booking cannot be casually reassigned by the browser alone.

## Connected demo accounts

These are isolated SIH demo identities only. They are not real team/customer credentials.

- Customer: `customer.connected@sanpaid.demo`
- Worker A: `worker1.connected@sanpaid.demo`
- Worker B: `worker2.connected@sanpaid.demo`
- Demo password: `Demo@2026`

Worker A and Worker B are verified Electrician demo workers in `Karad Zone 1`. Worker A ranks first; rejecting the offer demonstrates fallback to the next eligible worker.

## Database hardening added for connected flow

The shared database now stores connected request metadata needed for the two-device demo:

- request source (`TEXT` / `VOICE`)
- request language
- voice transcript
- worker rejection reason

Supporting indexes were added for booking updates and worker-offer lookup.

## Mobile implementation

Implemented mobile-shell behaviour includes:

- `viewport-fit=cover` and safe areas;
- responsive hero/search/cards;
- page-level horizontal-overflow protection;
- touch-friendly primary actions;
- mobile landing menu;
- role-aware dashboard drawer;
- Customer / Worker bottom navigation;
- mobile-safe modals and 16px inputs;
- mobile voice controls;
- responsive QR/toast/timeline/KPI/table handling;
- connectivity feedback;
- PWA install metadata;
- app-shell caching.

The Connected SIH Demo is also responsive and designed for separate Customer and Worker phones/browsers.

## Deployment truth

**Do not claim the connected flow is live until both deployments are verified.**

Current source wiring is:

`YUKTI-2026 frontend → /api proxy → https://sanpaid-sih-2026.onrender.com → shared PostgreSQL database`

The backend source was updated in `SanPaid-sih-2026`. Render is configured with auto-deploy from that repository, but the new deployment must be observed as live before SIH rehearsal.

The current Vercel project historically points to `SanPaid-sih-2026`, not `YUKTI-2026`. The YUKTI frontend therefore still needs to be imported/linked to Vercel (or otherwise deployed) before the new Connected Two-Device Demo can be tested from its live URL.

## Final hardening priorities

Do not add random features. Continue in this order:

1. Verify backend deploy + connected API health.
2. Deploy/link `YUKTI-2026` frontend.
3. Run two-browser/two-phone Customer → Worker A → Reject → Worker B → Accept test.
4. Connect the remaining service lifecycle to the shared backend: Traveling → Arrived → sandbox identity → booking token/QR → customer confirmation → service start.
5. Connect extra-charge approval, completion, sandbox payment, invoice and rating.
6. Deepen Cooperative Command Center with backend-derived KPIs.
7. Connect Capacity Exchange with worker consent.
8. Connect Complaint/SLA and Federation escalation.
9. Connect Demand → Capacity → Skill Gap → Action.
10. Run final mobile/click/console/network QA.

## Critical voice-flow rule

A microphone button alone is not a completed voice feature.

Connected proof is:

`Customer speaks → transcript → customer confirms → backend booking stores voice context → eligibility → worker-scoped offer on another session/device → worker reads/listens → Accept/Reject → shared state update`

If Worker A rejects, Worker B must receive the **same booking and original confirmed voice context**, not a recreated local request.

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

SanPaid is an **AI-assisted cooperative workforce operating network**, not another generic home-service marketplace.

> Payment, identity/liveness and other external integrations must remain honestly labelled `SANDBOX`, `PROTOTYPE`, or `INTEGRATION READY` until the real provider is connected and verified.
