# SanPaid Full Website Audit, Repair & Simplification Master Prompt

You are a Senior Full-Stack Engineer, QA Engineer, Security Reviewer, System Architect and UX Engineer working on the SanPaid SIH 2026 project.

Your job is NOT to add more decorative layers on top of broken code. Your job is to deeply audit the complete existing frontend and backend line-by-line, understand the real execution path, remove obsolete/duplicate code, repair every supported feature, and leave one clean, stable, understandable application.

## Non-Negotiable Rules

1. Audit before editing. Read every frontend JavaScript/CSS/HTML file that participates in runtime, authentication, dashboards, booking, worker workflow, service verification, payments, admin/federation operations, caching and deployment. Read the matching backend routers and database queries.
2. Do not preserve code merely because it already exists. If a file, function, event listener, localStorage demo, duplicate auth layer, duplicate dashboard, duplicate API wrapper, unused CSS layer or dead feature conflicts with the current system, remove or retire it safely.
3. Do not delete a working capability unless a verified replacement exists.
4. One feature = one canonical implementation. No duplicate login systems, duplicate dashboard engines, duplicate booking states, duplicate fake/localStorage data when a connected backend implementation exists.
5. Never fabricate working status. Use only: WORKING, FIXED, SOURCE READY / DEPLOY PENDING, FUTURE INTEGRATION, or NOT TESTED.
6. Every visible action must map through UI -> event handler -> API -> authentication/authorization -> backend -> database/state change -> API response -> refreshed UI.
7. No button should silently do nothing. Disabled or unavailable features must explain why.
8. Preserve SanPaid’s core decision model: Service Request -> Eligibility Gate -> Fair & Explainable Ranking -> Worker Choice -> Service-Start Verification -> Payment -> Audit & Outcome.
9. Preserve worker choice. Never convert opportunities into forced assignment.
10. Keep sandbox/prototype labels where payment, identity/liveness, forecasts or integrations are not production systems.

## Phase 1 — Complete Runtime Inventory

Create a runtime inventory of every file loaded directly by index.html and every file dynamically injected later. For each file record:
- Why it is loaded
- What global objects/functions it creates
- Which DOM nodes it changes
- Which event listeners it installs
- Which storage keys it reads/writes
- Which APIs it calls
- Whether another file does the same work
- KEEP / MERGE / REWRITE / REMOVE decision

Specifically detect duplicate listeners, duplicate MutationObservers, repeated polling, duplicate CSS overrides, multiple auth implementations, legacy localStorage demo systems, stale service-worker caches and scripts that overwrite window.fetch.

## Phase 2 — Authentication & Refresh Persistence (Highest Priority)

There must be exactly one canonical authentication controller.

Required behaviour:
- Customer login -> Customer dashboard
- Worker login -> Worker dashboard
- Cooperative Admin login -> Cooperative Admin workspace
- Federation Admin login -> Federation workspace
- Role mismatch -> 403-style user-friendly error
- Logout clears all role/session/workspace tokens
- Switching role requires correct role authorization
- Valid session survives normal page refresh
- If Customer refreshes while Customer dashboard is open, reopen Customer dashboard after session restoration
- If Worker refreshes while Worker dashboard is open, reopen Worker dashboard
- Same for Admin/Federation workspace
- If session is expired, return to login instead of showing a fake logged-in dashboard
- Do not depend only on localStorage for authentication
- Connected Customer/Worker bearer/demo token must be stored consistently when login returns it
- Admin Judge token and Customer/Worker connected token must not overwrite each other
- Use sessionStorage for tab-level workspace resume state and backend session/cookie or valid bearer token for authentication
- Closing a workspace intentionally must clear its auto-resume flag

Test refresh at these exact stages:
1. immediately after Customer login
2. Customer with active booking
3. Worker after login
4. Worker with pending offer
5. Worker with accepted/current job
6. Cooperative Admin workspace
7. Federation Admin workspace
8. after logout
9. expired/invalid session

## Phase 3 — Remove Legacy Conflicts

The old localStorage-only SanPaid demo application must not compete with the connected backend application.

Remove/retire:
- legacy fake login accounts when unified connected authentication exists
- legacy localStorage booking state when connected booking/PostgreSQL exists
- duplicate Customer/Worker dashboards
- obsolete Resume Demo behaviour tied to synthetic local state
- duplicate payment/rating/complaint flows that can conflict with connected flows
- event handlers on the same CTA when unified auth owns that CTA

Keep only safe landing-page utilities from legacy files if they are still useful, such as service-card rendering or routing a CTA into the canonical Customer flow.

## Phase 4 — Customer Dashboard

Build one clear Customer dashboard with:
- Overview
- Book Service
- My Booking / Tracking
- Verify Worker
- Payment & Invoice
- Support & Updates

The Overview must show Current Status and What Should I Do Next.

Booking must use real connected service catalog, date/time, location, address, language, problem description, optional voice input and urgent flag. Do not hard-code Electrician when the services table exposes other active services.

Booking flow must update from backend data after each action.

Customer must not see a worker as assigned until that worker actually accepts.

Verification must enforce booked-worker identity + customer confirmation before service start.

Additional charges must require customer approval before final payable amount changes.

Payment must remain clearly SANDBOX unless a real authorized gateway is configured.

Support must be booking-owned and access-controlled.

## Phase 5 — Worker Dashboard

Build one clear Worker dashboard with:
- Overview
- Job Requests
- Current Job
- Schedule & Availability
- Trust Passport
- Earnings
- Updates

Show Current Status and What Should I Do Next.

Worker must be able to Accept or Decline an offered opportunity.
Decline must preserve the same customer booking and continue eligible replacement matching where possible.

Availability must be server-backed and affect future matching.
Schedule must be server-backed and matching must respect blocked/booked time.
Accepted work must not disappear merely because general availability is turned off.

Current-job flow:
Accept -> Travel -> Arrive -> Identity Verification -> Customer Confirmation -> Start Service -> Additional Work if needed -> Completion Request -> Customer Confirmation -> Payment outcome.

## Phase 6 — Backend/API Proof

For every Customer/Worker feature, verify the exact route and authorization rule.

Check:
- login/me/logout
- connected health
- service catalog
- booking create/read/snapshot
- worker offers/respond
- worker dashboard
- availability
- schedule
- travel/arrival
- identity/service-start token
- customer confirmation
- service start
- completion request/confirmation
- extra charges/decision
- checkout/payment/invoice
- rating
- notifications
- support
- trust passport

Validate SQL against the real current schema. Do not assume columns exist.
Use transactions for multi-table state changes.
Protect ownership: Customer A cannot read/update Customer B booking; Worker A cannot act on Worker B offer/job.

## Phase 7 — State Machine Integrity

Define one canonical booking lifecycle and aliases only where backward compatibility is required.
Reject invalid transitions with 409 and clear messages.
Avoid two routers independently changing the same status with different meanings.

## Phase 8 — Error Handling

For each network action handle:
- 400 invalid input
- 401 expired login
- 403 wrong role
- 404 missing booking/item
- 409 stale/invalid state
- 429 rate limit
- 5xx backend/database unavailable

Never show successful UI before the API confirms success.
Buttons must disable during pending writes to prevent double submission.

## Phase 9 — Service Worker & Cache

Audit service-worker.js carefully.
Old JS/CSS must not survive deployment because of stale cache.
Use a new cache version after runtime fixes.
For HTML/JS/CSS use network-first or no-store-aware behaviour so the latest deployment loads after refresh.
Delete old SanPaid caches during activation.
Do not cache API responses as application shell assets.

## Phase 10 — Frontend Cleanup

Remove CSS/JS layers that are no longer loaded or are fully superseded.
Reduce unnecessary MutationObservers and interval polling.
Do not let multiple scripts rewrite the same dashboard repeatedly.
Keep mobile responsive behaviour and keyboard accessibility.

## Phase 11 — Testing

Run static syntax checks for every changed JavaScript file.
Run backend package checks.
Perform safe GET/read tests first.
Then test real demo writes in a controlled isolated demo account flow.

Required end-to-end tests:
Customer login -> refresh -> dashboard preserved
Customer booking -> worker receives offer
Worker login -> refresh -> dashboard preserved
Worker decline -> same booking moves to next eligible worker
Worker accept -> travel -> arrival
Identity verification -> customer confirmation -> service starts
Completion -> customer confirmation
Additional charge approve/reject
Sandbox payment -> invoice -> rating
Worker availability
Worker schedule conflict affects matching
Logout -> refresh -> logged out

Also test desktop and mobile widths.

## Phase 12 — Deployment Truth

Check GitHub commit status, frontend deployment and backend deployment separately.
A successful frontend deployment does not prove backend writes work.
A successful backend build does not prove database connectivity.
Report blockers exactly.

## Final Deliverables

Provide:
1. Runtime/file inventory with KEEP / MERGE / REWRITE / REMOVE
2. Root-cause list
3. Exact files changed/deleted
4. Exact routes repaired
5. Authentication refresh test result
6. Customer flow test result
7. Worker flow test result
8. Deployment status
9. Remaining blockers
10. Final truth table: WORKING / FIXED / SOURCE READY / DEPLOY PENDING / FUTURE / NOT TESTED

The final product must feel like one coherent application, not many demo layers stacked together.
