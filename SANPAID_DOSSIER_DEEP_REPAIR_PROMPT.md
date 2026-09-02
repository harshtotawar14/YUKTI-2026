# SanPaid SIH 2026 — Dossier-Grounded Deep Repair Master Prompt

Use this prompt on the current repository `harshtotawar14/YUKTI-2026`.

## ROLE
You are the senior product engineer, frontend architect, backend engineer, database engineer, security reviewer, QA lead and SIH demo auditor responsible for making the existing SanPaid website reliable, coherent, defendable and clean.

Do NOT rebuild SanPaid from scratch. Do NOT replace the existing product with a new template. Preserve working flows and the visual identity unless a change is required for correctness, accessibility, clarity, maintainability or SIH proof.

The attached SanPaid SIH 2026 10/10 Master Dossier is the product/strategy source of truth. The live repository and actual tests are the implementation source of truth. When the two disagree, do not fake implementation: either implement the missing behavior or label it Prototype/Demo/Future exactly as supported by evidence.

## PRIMARY GOAL
Produce one coherent SanPaid system in which:
- every visible control works;
- every role sees only authorized data/actions;
- UI claims match actual backend behavior;
- booking/payment/complaint state changes are server-authoritative;
- the SIH killer demo works repeatedly from clean state;
- failure modes are explicit and recoverable;
- dead, hidden, duplicate and misleading code is removed;
- frontend and backend sources are physically readable and maintainable;
- tests prove the most important claims.

Do not optimize for feature count. Optimize for problem → workflow → measurable proof → failure handling → implementation boundary.

---

# 0. NON-NEGOTIABLE TRUTH RULES

1. Never call a feature Implemented because code or UI exists. Test it end-to-end.
2. Every major feature must be classified as `IMPLEMENTED`, `PROTOTYPE/DEMO`, or `FUTURE/INTEGRATION-READY` with proof.
3. Never claim:
   - 100% safe / fraud impossible;
   - AI always accurate;
   - government-certified Worker Passport;
   - all government schemes integrated;
   - live ONDC unless actually connected;
   - all languages supported;
   - 20 km compulsory;
   - a fixed fee as national policy;
   - every feature implemented;
   - training guarantees income;
   - an individual feature is market-first without evidence.
4. Seed/demo data must be visibly identified as demo data.
5. Sandbox identity/payment/distance must remain visibly labelled sandbox/demo.
6. No fake impact percentages, fake model accuracy or invented pilot results.
7. No frontend-only optimistic success. Server response is final authority for booking, assignment, payment, QR/service token, complaint and admin actions.
8. Do not deploy to Vercel during repair. Keep work GitHub/local-CI only until all agreed gates are green and deployment is explicitly requested.

---

# 1. FIRST: BUILD A REAL CURRENT-STATE AUDIT

Before changing architecture, inspect the full repository and generate `docs/IMPLEMENTATION_STATUS.md` containing every dossier feature with:

`Feature | Status | Frontend proof | API proof | DB proof | Automated test | Manual browser test | Missing work`

Audit at minimum:
- Customer signup/login
- Worker role/login
- Cooperative Admin login
- Federation Admin login
- Worker document verification
- Skill verification
- Worker availability/schedule
- Geo/service-area worker discovery
- Eligibility-first matching
- Explainable ranking
- Worker accept/reject
- Timeout/reassignment
- Cross-language request
- Voice input/playback
- Arrival identity/liveness result
- one-time service-start token/QR
- customer service-start confirmation
- controlled additional charges
- admin exception review
- customer revised-estimate approval
- sandbox payment
- invoice
- worker earnings ledger
- rating
- complaint + SLA
- complaint evidence timeline
- Cooperative Admin dashboard
- Federation view
- capacity exchange recommendation
- worker consent for capacity exchange
- Digital Service Passport
- welfare/insurance status
- training recommendation
- demand forecast + confidence
- fairness audit metrics
- low-connectivity/pending-sync behavior
- audit logs
- backup/restore proof

Do not leave `TO VERIFY` after the audit.

---

# 2. P0 PRODUCT/CLAIM MISMATCHES TO FIX

## 2.1 Matching policy must match the claim
Current source must not claim a full fair/explainable policy if backend ranking is only a simple `rating DESC / completed_jobs ASC` selection.

Implement one canonical backend matching policy:

### Eligibility gate
A worker is rankable only if all required gates pass:
- correct cooperative/service scope;
- worker active;
- identity/verification valid;
- required skill verified;
- required specialization if applicable;
- worker available for requested slot;
- service area/radius allowed by policy;
- minimum quality/reliability threshold if configured.

### Practical-fit score
Use real fields that actually exist or add the minimum required fields:
- skill/specialization fit;
- distance/service-area fit;
- schedule fit;
- urgency response fit;
- reliability.

### Fairness score
Among qualified workers only:
- recent workload;
- utilization;
- eligible opportunity share;
- recent offer/job concentration;
- travel burden.

Use a documented configurable prototype formula. The dossier reference weights may be used as initial demo weights only and must be labelled configurable. Persist factor scores/reason codes so Customer/Admin/Worker can see a meaningful explanation.

If a factor cannot be implemented reliably now, remove it from the public claim rather than generating a fake number.

## 2.2 Public proof must not fabricate operational data
Audit `/api/public-proof/summary` and similar endpoints.
- Do not hard-code cooperative names or zones when the database can supply them.
- Do not convert actual zero demand to `1` just to make a graph look populated.
- Keep `observedDemand`, `demoBaseline`, `forecast`, and `capacity` semantically separate.
- Hard-coded capability strings must not imply runtime proof unless backed by status/tests.

## 2.3 Prototype status on landing is stale
The landing currently has a static implementation-status block. Replace stale wording with a source-controlled status registry generated from verified implementation evidence, or update the static copy only after tests.

Do not show `LIVE` for a flow that has only source/build proof.

---

# 3. UI/UX DEEP CLEANUP

## 3.1 Reduce evaluator clutter
The landing must tell one story:
Problem → Core Innovation → Matching Proof → Service Lifecycle → Governance/Capacity → Impact → Implementation Truth → Architecture → Golden Demo.

Remove sections, badges, animations, explanatory labels or duplicate CTAs that repeat the same idea without helping a judge understand or test the system.

## 3.2 Remove dead hidden UI
Current evaluator CSS permanently hides `.quick-booking-details` while the DOM still contains booking/search/worker/cooperative controls inside it.

Choose ONE outcome:
- make the quick-access block genuinely useful and visible at an appropriate breakpoint; OR
- delete the hidden block and all JS/tests that exist only for those controls.

Do not keep permanently hidden interactive controls as legacy baggage.

## 3.3 One visible owner per action
For every user action, have one canonical control/handler path.
Avoid multiple files independently owning:
- mobile navigation;
- auth modal;
- role selection;
- booking creation;
- status polling/sync;
- toasts;
- workspace mounting;
- admin portal mounting.

## 3.4 Accessibility
Pass automated and browser checks for:
- keyboard-only navigation;
- visible focus;
- correct dialog focus trap/restore;
- Escape closes dialogs/drawers;
- labels for all fields;
- live-region feedback for async states;
- no color-only status meaning;
- touch targets >= practical mobile size;
- readable worker/admin tables on mobile;
- reduced-motion support where animation exists;
- meaningful empty/loading/error/retry states.

## 3.5 Mobile-first role workflows
Test at least 390x844 and a normal desktop viewport.
Worker flows must be simpler than evaluator landing flows: large controls, explicit next action, readable job summary, clear accept/reject, no dense dashboard wall.

## 3.6 Error UX
For every API action show distinct states:
`idle → submitting → success` OR `validation error / auth error / conflict / server unavailable / retry`.
Do not silently fail.

---

# 4. FRONTEND ARCHITECTURE CLEANUP

The repository currently contains many root-level CSS/JS presentation layers. Refactor safely and atomically.

Target structure:

```text
frontend/
  public/
  src/
    landing/
    auth/
    customer/
    worker/
    cooperative-admin/
    federation-admin/
    shared/
      api/
      auth/
      state/
      ui/
      accessibility/
    styles/
```

Requirements:
1. `frontend/` becomes the canonical physical frontend source, not only a README map.
2. Build script publishes the same expected root asset URLs into `dist/` so deployment behavior does not break.
3. Do the move in one migration with tests updated simultaneously.
4. Do not leave duplicate root and `frontend/` source copies afterward.
5. Keep only truly necessary CSS layers. Merge presentation patches that repeatedly override the same selectors.
6. Lazy-load role-specific/admin-heavy modules rather than loading everything on landing.
7. Generate a dependency inventory showing which JS/CSS files are loaded, dynamically loaded, test-only, docs-only, or unused.
8. Delete an asset only after proving there is no HTML/JS/service-worker/build/test reference.
9. No new global monkey patches.
10. No browser localStorage operational database. Backend/PostgreSQL remains source of truth.

Specific cleanup candidates to investigate—not blindly delete:
- old presentation-version CSS files;
- duplicated evaluator/polish layers;
- dead DOM selectors such as removed service-grid/quick-access paths;
- scripts loaded globally that are only needed for one role;
- legacy selector/judge helpers whose function has moved to canonical modules.

Produce `docs/DEAD_CODE_REMOVAL.md` with `file/selector → evidence → removal decision`.

---

# 5. BACKEND ARCHITECTURE CLEANUP

The current catch-all API file is too large for long-term maintenance. Preserve the Vercel contract but split implementation into bounded modules.

Target:

```text
backend/
  src/
    auth/
    users/
    workers/
    verification/
    services/
    bookings/
    matching/
    assignments/
    service-start/
    billing/
    payments/
    ratings/
    complaints/
    welfare/
    training/
    capacity/
    federation/
    forecasting/
    audit/
    shared/
      db/
      security/
      errors/
      validation/
```

`api/index.js` and Vercel catch-all should become thin adapters into `backend/src`.

Do not convert to microservices. A modular monolith is preferred for the SIH prototype.

## 5.1 Database initialization
Do not run full schema migration + demo seeding as an implicit side effect of ordinary first production requests.
Move toward explicit migration/bootstrap commands.
Demo seed must be explicit/idempotent and environment-gated.

## 5.2 Validation
Replace scattered string cleaning with explicit per-endpoint schemas/rules.
Reject unknown/invalid state-changing inputs consistently.

## 5.3 Authorization
Every object endpoint requires both role and object/scope authorization.
Test BOLA/IDOR for bookings, workers, cooperative data, complaints, payments and evidence.

## 5.4 Serverless-safe rate limiting
An in-memory `Map` is not sufficient as a reliable distributed/serverless login rate limiter.
Use a durable/shared strategy suitable for the deployed environment, or clearly treat the local limiter as prototype-only and add a production-ready adapter.

## 5.5 Sessions
Choose one coherent browser session strategy. Prefer HttpOnly Secure SameSite cookies for normal browser auth. If a bearer demo token must remain for judge workflows, isolate and document it; do not accidentally expand exposure to production auth.

---

# 6. DATABASE & TRANSACTION RULES

Verify or implement:
- foreign keys for transactional ownership;
- constrained status values;
- unique/transactional protection against double accepted assignment;
- row locks/atomic updates for accept/reassign;
- one-time token with hash, expiry and `consumed_at`;
- payment idempotency key;
- review uniqueness and completed-booking-only rule;
- audit records for privileged verification/policy/complaint actions;
- indexes for frequent role dashboard and booking queries;
- soft-delete/audit-safe policy where required;
- no raw card credentials;
- exact customer address scoped to authorized assignment only;
- backup + restore test instructions and evidence.

PostGIS is not mandatory merely to match the dossier architecture. If real geo is not implemented, keep demo distance clearly labelled and do not claim production geo-routing.

---

# 7. END-TO-END KILLER DEMO — MUST PASS

Build one deterministic resettable demo path:

1. Customer logs in.
2. Customer creates service request (typed Marathi is acceptable if live voice is unavailable).
3. Request fields are structured and critical fields confirmed.
4. Backend produces multiple eligible candidates with reason-coded ranking.
5. Worker A sees understandable preferred-language job and rejects/times out.
6. Same booking is offered to Worker B.
7. Worker B accepts atomically.
8. Worker travels/arrives.
9. Sandbox identity/liveness result is recorded and clearly labelled.
10. Booking-specific one-time service token/QR is generated.
11. Customer confirms; only then can service enter `IN_PROGRESS`.
12. Worker submits additional-work request with reason + breakup.
13. Policy checks routine/exception path.
14. Customer approves revised estimate.
15. Worker submits completion.
16. Customer confirms completion.
17. Sandbox payment succeeds idempotently.
18. Invoice is generated.
19. Worker earnings ledger updates.
20. Customer rating updates completed service history/passport.
21. Complaint/evidence path can be demonstrated from same booking.
22. Cooperative Admin sees booking, SLA/evidence, worker utilization and audit event.
23. Federation view shows authorized capacity/policy scope.
24. Forecast/planning card shows observed data/baseline, confidence, capacity gap and recommended action without fake ML precision.

Add a one-command reset/seed path for this demonstration.
Run it at least 3 times from clean state.

---

# 8. CAPACITY EXCHANGE

Required semantics:
- local capacity checked first;
- shortage may create federation recommendation;
- no automatic worker transfer;
- worker consent required;
- authorized cooperative/federation approval required;
- assignment records home cooperative, serving cooperative, worker, payment responsibility/split and complaint owner;
- rejection moves to next option without punishment/forced transfer.

---

# 9. TRUST / SERVICE PASSPORT

Keep wording defensible:
- verification is lifecycle state, not permanent badge;
- document expiry/renewal affects eligibility;
- sandbox identity result is not government KYC;
- service passport is SanPaid/Federation service-history credential, not government certificate;
- only completed services create ratings/passport service history;
- complaint outcomes remain evidence, not automatically hidden.

---

# 10. BILLING / PAYMENT

Enforce:
- server-calculated amount;
- initial quote/estimate version;
- worker cannot arbitrarily mutate total;
- additional work requires reason + itemized breakup;
- routine policy validation vs admin exception path;
- customer approval before applying additional charge;
- sandbox gateway/payment state clearly labelled;
- repeated callback/request cannot duplicate payment or ledger;
- invoice itemization;
- worker gross/fees/net earnings visibility.

---

# 11. COMPLAINT + SLA + EVIDENCE

Complaint must be connected to the booking and expose a case-scoped timeline including relevant:
- assignment;
- arrival/start verification;
- customer service-start confirmation;
- approved price changes;
- completion;
- invoice/payment;
- customer/worker statements;
- admin actions.

SLA must be configurable by category/severity/policy. No fixed national 24/48-hour claim.
Threshold breach must alert/escalate rather than silently expire.

---

# 12. AI / FORECASTING / FAIRNESS TRUTH

Do not add AI branding to normal rules.

For low-data prototype:
- show transparent baseline;
- show low/medium confidence honestly;
- separate observed values from predicted values;
- track forecast/model version if an actual model exists;
- do not claim accuracy without evaluation;
- human approves training/capacity actions.

Fairness dashboard should measure actual outcomes when data exists:
- eligible opportunity share;
- job/offer concentration;
- utilization distribution;
- travel burden;
- override/review rate.

Do not use protected/sensitive attributes as ranking disadvantages.

---

# 13. LOW-CONNECTIVITY

A network-first service worker alone is not equivalent to offline state-changing support.

Either implement a real pending-sync queue for allowed non-final actions with clear `PENDING SYNC` UI and server conflict handling, OR classify low-connectivity write support as Future/Prototype.
Never confirm accept/payment/completion offline before server acknowledgement.

---

# 14. TEST SUITE — REQUIRED ACCEPTANCE CONTRACT

Automate as many dossier acceptance tests as practical:

- Customer cannot access worker/admin-only endpoint.
- Cooperative Admin cannot modify another society's worker.
- Valid request creates exactly one booking.
- Ineligible worker never appears in eligible list.
- Busy/off-duty worker not offered conflicting slot.
- Two workers accept same assignment → only one succeeds.
- Timeout/reject → next eligible worker offered on same booking.
- Offline stale accept → conflict/reject on sync.
- Consumed/expired service token cannot be reused.
- identity mismatch blocks service start.
- routine extra charge follows policy + still requires customer approval.
- out-of-policy charge requires admin + customer approval.
- repeated payment callback/action produces one payment/ledger outcome.
- only completed-booking customer can rate once.
- complaint SLA threshold creates alert/escalation.
- complaint timeline contains expected evidence.
- low-confidence critical language field requires confirmation.
- cold-start forecast is baseline + low confidence.
- capacity recommendation never auto-transfers worker.
- cross-coop assignment has home/serving cooperative and complaint owner.
- verification/policy change appears in audit log.
- unrelated worker cannot see exact customer address.
- backup/restore test documented and executed in test environment.

Keep existing:
- source integrity;
- UI contract test;
- local Chromium browser audit.

Expand browser audit to role workspaces and the killer demo using a local/test backend fixture or safe test environment—not by hammering production.

---

# 15. PERFORMANCE / RELIABILITY

Measure before optimizing.
- avoid loading admin/federation CSS/JS on initial public landing unless needed;
- reduce duplicate CSS override layers;
- ensure no unbounded polling;
- database queries used by dashboards must be indexed and scoped;
- expose request/correlation IDs in server logs;
- structured error logging without secrets;
- no cache of auth/API/build identity;
- graceful retry for temporary API failure.

Do not add Redis, queues, microservices or other architecture buzzwords unless an actual bottleneck justifies them.

---

# 16. DOCUMENTATION CLEANUP

Update stale docs after implementation.

In particular, `SANPAID_RUNTIME_AUDIT_STATUS.md` must not continue saying PostgreSQL/live backend is pending if production health/database proof has already passed. Distinguish:
- source integrity;
- database connectivity;
- public API health;
- authenticated E2E;
- browser killer-demo proof.

README must explain:
- actual current stack;
- exact frontend/backend directories;
- local setup;
- env variables without secret values;
- migration/seed commands;
- tests;
- feature status matrix;
- demo reset/run steps;
- deployment truth.

---

# 17. FILE REMOVAL RULE

Do not remove a file merely because its name looks old.
For every candidate:
1. search HTML imports;
2. search dynamic loader/import references;
3. search service-worker precache;
4. search build script;
5. search tests/workflows/docs;
6. run build;
7. run source tests;
8. run Chromium audit;
9. only then delete.

After cleanup, there should be one canonical source for each responsibility and no orphan selectors/files.

---

# 18. REQUIRED OUTPUT FROM THE REPAIR AGENT

Do the work, not only an audit report.

Deliver:
1. `docs/IMPLEMENTATION_STATUS.md`
2. `docs/DEAD_CODE_REMOVAL.md`
3. `docs/DOSSIER_GAP_MATRIX.md`
4. cleaned physical `frontend/` source structure
5. cleaned physical `backend/` modular-monolith structure
6. thin Vercel adapters under `api/`
7. updated tests
8. updated README/runtime status docs
9. exact list of deleted files/selectors and reason
10. exact list of remaining Prototype/Future features
11. final test evidence

Final test report must include:
- `npm test`
- clean build
- local Chromium UI audit
- backend policy/integration tests
- role authorization/security tests
- killer demo E2E x3 from reset state
- failure/fallback checks

Do not declare completion while any P0 contract is red.

---

# 19. FINAL QUALITY BAR

A judge should be able to ask:
- What is implemented?
- Why was this worker ranked first?
- What happens if Worker A rejects?
- Can Worker B double-accept?
- Why can service not start yet?
- Can the QR/token be replayed?
- Who approved this extra charge?
- Did payment duplicate on retry?
- Who owns a cross-cooperative complaint?
- Is this forecast real ML or a baseline?
- Is this government integration live?
- What happens offline?

The UI, API, database and test evidence must all give the same answer.

The final SanPaid narrative remains:
**Not another home-service app — an AI-assisted cooperative workforce operating network.**

Closed loop:
**Demand → Capacity/Skill Gap → Prepare → Eligibility-First Fair Match → Worker Choice → Trusted Service → Transparent Earnings/Welfare → Measure → Better Planning.**
