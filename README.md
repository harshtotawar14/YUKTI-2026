# YUKTI-2026 — SanPaid

Smart India Hackathon 2026 prototype for **PS ID 26089 — Cooperative Gig Services Platform for Household & Community Services**.

## Current repository handoff

- `index.html` — SanPaid landing page with mobile/PWA + Connected SIH Demo entry.
- `styles.css` — shared desktop/base styling.
- `mobile.css` — canonical mobile-first responsive and dashboard behaviour.
- `connected-demo.css` — responsive connected-demo UI.
- `app.js` — lean landing controller and database-catalog entry routing.
- `mobile.js` — mobile navigation/PWA/connectivity runtime.
- `connected-demo.js` — shared-backend Customer/Worker booking, voice, matching and offer flow.
- `connected-service-ui.js` — connected travel/arrival/dual-verification/service/completion UI.
- `connected-commerce-ui.js` — connected extra-charge approval, sandbox checkout, invoice and rating UI.
- `api/[...path].js` — canonical same-origin Vercel API for auth, booking, worker choice, lifecycle, commerce and administration.
- `database/schema.sql` — idempotent PostgreSQL schema for the rebuilt backend.
- `vercel.json` — static frontend, security headers and local serverless API deployment.
- `manifest.webmanifest` / `service-worker.js` / `app-icon.svg` — PWA shell.
- `scripts/build.mjs` — reproducible Vercel artifact builder with exact commit identity.
- `docs/final-sih-demo-hardening/` — final SIH hardening specification.

## Connected SIH implementation present in source

The public product has one operational mode: the **Connected Two-Device Demo** backed by the configured API and shared PostgreSQL state. The landing-page matching animation is explanatory only; it is not a second local booking engine.

Connected Golden Demo source flow now reaches:

`Customer Device → backend login → Voice/Text Request → PostgreSQL Booking → Eligibility Gate → Worker A Offer → Listen → Accept/Reject → Worker B fallback when rejected → Customer shared update → Travel → Arrive → SANDBOX Identity Check → One-Time Booking Token → Customer Confirms Booked Worker → backend-enforced Start Service → optional Additional Work Approval → Completion Request → Customer Completion Confirmation → SANDBOX Payment → Persisted Invoice → Rating`

The deleted Render service is no longer part of the runtime. Backend source now lives in this repository and deploys with the same Vercel project. PostgreSQL remains external durable state through `DATABASE_URL`.

## Connected API families

Core two-device booking:

- `GET /api/connected/health`
- `POST /api/connected/bookings`
- `GET /api/connected/customer/bookings/:id`
- `GET /api/connected/worker/offers`
- `POST /api/connected/worker/offers/:id/respond`
- `GET /api/connected/snapshot` — role-scoped connected state

Connected service lifecycle:

- `POST /api/connected/jobs/:id/travel`
- `POST /api/connected/jobs/:id/arrive`
- `POST /api/connected/jobs/:id/identity`
- `GET /api/connected/service-start/:token`
- `POST /api/connected/service-start/:token/confirm`
- `POST /api/connected/jobs/:id/start`
- `POST /api/connected/jobs/:id/completion-request`
- `POST /api/connected/customer/bookings/:id/complete`

Connected commerce:

- `POST /api/connected/worker/jobs/:id/extra-charge`
- `GET /api/connected/customer/bookings/:id/charges`
- `POST /api/connected/customer/charges/:id/decision`
- `GET /api/connected/customer/bookings/:id/checkout`
- `POST /api/connected/customer/bookings/:id/pay`
- `POST /api/connected/customer/bookings/:id/rating`

## Connected demo accounts

The connected flow uses isolated SIH-only Customer, Worker A, Worker B,
Cooperative Admin and Federation Admin identities. Passwords are deliberately
not stored in this public repository. Obtain the current event-scoped demo
credentials from the project owner immediately before a rehearsal or judging
session.

Worker A and Worker B are seeded as VERIFIED + AVAILABLE workers in the YUKTI cooperative.

Database ranking smoke check confirms:

1. Worker A — demo distance 3.2 km, rating 4.91
2. Worker B — demo distance 6.4 km, rating 4.72

Therefore the intended judge fallback scenario is deterministic: Worker A receives the first offer; if rejected, Worker B is next among the exact-zone connected demo workers.

## Database hardening completed

Connected request fields:

- `bookings.request_source`
- `bookings.request_language`
- `bookings.voice_transcript`
- `booking_assignment_offers.rejection_reason`

Dual service-start verification:

- `job_verifications.identity_verified_at`
- `job_verifications.customer_confirmed_at`
- `job_verifications.identity_mode`
- `service_start_tokens` with hashed token, booking/worker binding, expiry, used state

Booking status constraint was safely extended without removing legacy statuses to support:

- `FINDING_REPLACEMENT`
- `IDENTITY_VERIFIED`
- `CUSTOMER_CONFIRMED`

Indexes were verified for worker-offer lookup and `(booking_id, worker_id)` uniqueness.

## Backend safety in the connected Golden Demo

- authenticated server-side sessions;
- role checks on Customer/Worker actions;
- eligibility before ranking;
- verified + available + verified-skill gate;
- deterministic exact-zone ranking;
- offer rejection reason persisted;
- same booking/voice request preserved through fallback;
- transaction-protected worker Accept/Reject;
- one-time service-start token stored only as a hash;
- token expiry and one-use enforcement;
- Start Service blocked on backend unless both identity and customer confirmation exist;
- additional work changes checkout only when customer APPROVES it;
- sandbox payment is idempotent for an already successful booking payment;
- invoice is persisted by booking;
- duplicate rating prevented by booking uniqueness;
- API/SSE requests are excluded from PWA cache.

## Backend configuration

Set these Vercel Production environment variables before connected verification:

- `DATABASE_URL` — PostgreSQL connection string with SSL enabled.
- `SANPAID_DEMO_PASSWORD` — event-scoped password of at least 8 characters used to seed the five isolated demo accounts.

The first API request applies `database/schema.sql` and idempotently seeds cooperatives, 12 services, Customer, Worker A, Worker B, Cooperative Admin and Federation Admin. Session and service-start tokens are high-entropy random values stored only as SHA-256 hashes. Run `npm run migrate` when a controlled migration step is preferred.

## Mobile / PWA

The connected screens are responsive for phone use, with touch-friendly actions, voice fallback, worker Listen controls, full-width forms and same-origin API proxy design.

The service worker caches only the static application shell. `/api/*` and SSE requests always use the network/shared backend.

## Deployment truth — important

**Source implementation and database migrations are ready, but a source commit is not treated as a successful live deployment.**

Expected wiring:

`YUKTI-2026 frontend → same-origin Vercel /api function → PostgreSQL database`

The production URL is supplied to CI through the `SANPAID_PRODUCTION_URL`
repository variable, with `https://yukti-2026-brown.vercel.app/` as the current
production-domain fallback. Every Golden Demo entry now runs a same-origin
readiness gate against the exact deployed build, connected backend,
authentication route, snapshot route and database-backed service catalog. A
failed dependency blocks connected role access instead of displaying a fake
successful write.

The current branch must still be deployed and the complete two-device flow
must be rerun after deployment. The readiness gate proves dependency response;
it does not replace lifecycle testing.

CI keeps source integrity and production deployment integrity as separate
jobs. Production passes only when `/build-info.json` reports the exact pushed
commit and the backend health/catalog contracts pass. If the fallback alias is
stale or deleted, configure `SANPAID_PRODUCTION_URL` to the active Vercel
production domain instead of weakening the check.

Do not claim production/live cross-device behaviour until both sides are deployed and a real two-browser/two-phone run passes.

## Runtime integrity checks

The frontend has a dependency-free validation suite:

```bash
npm test
npm run build
```

It verifies JavaScript syntax, local asset references, unique HTML IDs,
same-origin browser API policy, CSP/proxy alignment, service-worker safety,
public credential hygiene, reproducible build identity and the single Golden
Demo CTA contract.

## Feature truth matrix

| Capability | Source | Database-backed | Live verification required | Production integration |
|---|---:|---:|---:|---:|
| Customer booking and worker offers | Implemented | Yes | Yes | Prototype |
| Eligibility and deterministic ranking | Implemented | Yes | Yes | Prototype policy |
| Identity verification | Implemented | Yes | Yes | Sandbox |
| Payment, invoice and rating | Implemented | Yes | Yes | Sandbox |
| Cooperative evidence and complaints | Implemented | Yes | Yes | Prototype |
| Maps/route ETA | Design-ready | No | Not applicable | Future authorized integration |
| Welfare/insurance systems | Design-ready | No | Not applicable | Future authorized integration |

## Next hardening priorities

P1–P5 core connected implementation is now present in source/database. Next priorities are:

1. Provision PostgreSQL and configure the three Production environment variables.
2. Verify `/api/connected/health` and `/api/public/services` on the production Vercel domain.
3. Run the real two-browser/two-phone Golden Demo and fix any runtime/network/cookie issue.
4. Deepen Cooperative Command Center with DB-derived KPIs and verification actions.
5. Connect Cooperative/Federation Capacity Exchange with worker consent.
6. Connect Complaint + L1→L2→L3 SLA + audit timeline.
7. Connect Demand → Capacity → Skill Gap → operational action.
8. Add before/after evidence object-storage adapter if time permits.
9. Run final mobile/click/console/network QA.

## Critical voice-flow rule

A microphone button alone is not a completed voice feature.

Connected proof is:

`Customer speaks → transcript → backend booking stores confirmed voice context → eligibility → worker-scoped offer on another session/device → worker reads/listens → Accept/Reject → same request survives fallback → shared state update`

## Product positioning

SanPaid is an **AI-assisted cooperative workforce operating network**, not another generic home-service marketplace.

> Payment and identity/liveness remain explicitly **SANDBOX**. Do not present them as production payment or production biometric verification until real providers are connected and verified.
