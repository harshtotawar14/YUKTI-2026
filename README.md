# YUKTI-2026 — SanPaid

Smart India Hackathon 2026 prototype for **PS ID 26089 — Cooperative Gig Services Platform for Household & Community Services**.

## Current repository handoff

- `index.html` — current SanPaid HTML frontend.
- `styles.css` — current shared styling.
- `app.js` — current frontend demo/application logic.
- `docs/final-research-grounded-frontend-master-prompt.md` — **LATEST / PRIMARY frontend execution prompt**. Use this first for the full research-grounded website upgrade.
- `docs/frontend-functionality-repair/` — earlier detailed frontend repair prompt; keep as supporting QA/reference material.
- `docs/backend-master-prompt/` — backend, PostgreSQL/PostGIS, API and system-integration prompt; use after the frontend state/UI contract is stable.

## Recommended execution order

### Phase 1 — Final frontend upgrade

Use:

`docs/final-research-grounded-frontend-master-prompt.md`

Main goals:

- audit the real repository before editing;
- preserve good existing SanPaid design/code;
- remove every dead button, broken link and fake CTA;
- replace disconnected/random values with one deterministic connected demo dataset;
- make Customer, Worker, Cooperative Admin and Federation Admin dashboards operational;
- keep eligibility before fairness;
- keep worker choice mandatory;
- implement continuous worker trust, Digital Worker ID and dual service-start verification;
- make payment/biometric actions honest sandbox workflows;
- implement worker earnings, Service Passport, welfare/training, complaint/SLA, capacity exchange and demand planning;
- synchronize actions across all affected dashboards;
- use claim-safe research framing;
- manually test every Golden Demo flow and every critical click.

### Phase 2 — Supporting frontend QA

If extra repair detail is needed, follow:

1. `docs/frontend-functionality-repair/01-audit-state-booking-customer.txt`
2. `docs/frontend-functionality-repair/02-worker-admin-service-payment.txt`
3. `docs/frontend-functionality-repair/03-validation-responsive-click-audit.txt`
4. `docs/frontend-functionality-repair/04-golden-flows-qa-start.txt`

### Phase 3 — Backend / database / API integration

Then follow:

1. `docs/backend-master-prompt/01-foundation-auth-booking.txt`
2. `docs/backend-master-prompt/02-booking-matching-verification-payment.txt`
3. `docs/backend-master-prompt/03-payments-complaints-governance-ai.txt`
4. `docs/backend-master-prompt/04-forecast-database-api-security.txt`
5. `docs/backend-master-prompt/05-reliability-golden-demo-testing.txt`
6. `docs/backend-master-prompt/06-integration-deployment-definition-done.txt`

The backend phase must treat the final frontend as the UI contract, replace remaining demo adapters with real APIs, connect PostgreSQL/PostGIS, authentication/RBAC, booking/matching, worker verification, service-start verification, payments, complaints/SLA, cooperative/federation governance, capacity exchange, AI/forecasting, audit/security, testing and deployment.

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

> Demo-only integrations such as sandbox payment or sandbox identity verification must remain honestly labelled until real production integrations are connected.
