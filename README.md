# YUKTI-2026 — SanPaid

Smart India Hackathon 2026 prototype for **PS ID 26089 — Cooperative Gig Services Platform for Household & Community Services**.

## Current repository handoff

- `index.html` — Claude-generated SanPaid HTML/CSS/JavaScript frontend prototype.
- `docs/backend-master-prompt/` — complete backend, database, API and system-integration master prompt, preserved in ordered parts `01` through `06`.

## Prompt reading order

1. `01-foundation-auth-booking.txt`
2. `02-booking-matching-verification-payment.txt`
3. `03-payments-complaints-governance-ai.txt`
4. `04-forecast-database-api-security.txt`
5. `05-reliability-golden-demo-testing.txt`
6. `06-integration-deployment-definition-done.txt`

The backend phase must treat the existing frontend as the UI contract, audit its mock/hardcoded behaviour, then connect real APIs, PostgreSQL/PostGIS data, authentication/RBAC, booking and matching, worker verification, service-start verification, payments, complaints/SLA, cooperative/federation governance, capacity exchange, AI/forecasting, audit/security, testing and deployment.

> Demo-only integrations such as sandbox payment or verification must stay honestly labelled until real production integrations are connected.
