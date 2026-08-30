# YUKTI-2026 — SanPaid

Smart India Hackathon 2026 prototype for **PS ID 26089 — Cooperative Gig Services Platform for Household & Community Services**.

## Current repository handoff

- `index.html` — Claude-generated SanPaid HTML/CSS/JavaScript frontend prototype.
- `docs/frontend-functionality-repair/` — frontend repair master prompt split into ordered parts. Use this first to make all important buttons, forms, modals, dashboards and demo flows actually clickable and stateful while preserving the current design.
- `docs/backend-master-prompt/` — complete backend, database, API and system-integration master prompt, preserved in ordered parts `01` through `06`. Use this after the frontend functionality pass.

## Frontend repair prompt reading order

1. `docs/frontend-functionality-repair/01-audit-state-booking-customer.txt`
2. `docs/frontend-functionality-repair/02-worker-admin-service-payment.txt`
3. `docs/frontend-functionality-repair/03-validation-responsive-click-audit.txt`
4. `docs/frontend-functionality-repair/04-golden-flows-qa-start.txt`

Frontend repair priorities:

- audit every clickable element;
- remove dead `href="#"` and missing handlers from critical actions;
- use meaningful demo state instead of alert-only placeholders;
- make Customer, Worker, Cooperative Admin and Federation flows usable;
- preserve eligibility-first matching and exclude unverified workers;
- demonstrate dual service-start verification, payment sandbox, complaints/SLA and capacity exchange;
- persist appropriate demo state in localStorage;
- manually test every critical button and Golden Flow.

## Backend prompt reading order

1. `docs/backend-master-prompt/01-foundation-auth-booking.txt`
2. `docs/backend-master-prompt/02-booking-matching-verification-payment.txt`
3. `docs/backend-master-prompt/03-payments-complaints-governance-ai.txt`
4. `docs/backend-master-prompt/04-forecast-database-api-security.txt`
5. `docs/backend-master-prompt/05-reliability-golden-demo-testing.txt`
6. `docs/backend-master-prompt/06-integration-deployment-definition-done.txt`

The backend phase must treat the repaired frontend as the UI contract, audit any remaining mock/hardcoded behaviour, then connect real APIs, PostgreSQL/PostGIS data, authentication/RBAC, booking and matching, worker verification, service-start verification, payments, complaints/SLA, cooperative/federation governance, capacity exchange, AI/forecasting, audit/security, testing and deployment.

> Demo-only integrations such as sandbox payment or verification must stay honestly labelled until real production integrations are connected.
