# Backend

This folder is the human-readable backend section of SanPaid.

The verified production backend currently uses Vercel Functions under `../api/` and PostgreSQL schema under `../database/`. Those runtime paths remain unchanged to preserve the already verified deployment contract. This document is the canonical backend map.

## API entry
- `../api/index.js` — stable Vercel Function entrypoint.
- `../api/[...path].js` — canonical API router and business workflow implementation.

## Backend libraries
- `../api/_lib/db.cjs` — PostgreSQL pool, schema initialization and demo seed.
- `../api/_lib/security.cjs` — password hashing, sessions, token/cookie helpers.
- `../api/_lib/policy.cjs` — booking state transitions and role normalization.

## Database
- `../database/schema.sql` — PostgreSQL schema and constraints.

## Backend scripts/tests
- `../scripts/migrate.mjs` — database migration/bootstrap helper.
- `../scripts/production-e2e.mjs` — live production E2E contract runner.
- `../tests/backend-policy.test.mjs` — policy/state-machine tests.
- `../.github/workflows/production-e2e.yml` — authenticated production E2E.
- `../.github/workflows/production-diagnostics.yml` — safe production diagnostics.

## Environment contract
- `DATABASE_URL` — PostgreSQL connection string.
- `SANPAID_DEMO_PASSWORD` — seeded demo account password in deployment environment.
- `SANPAID_E2E_PASSWORD` — GitHub Actions secret for authenticated production E2E only.

Secrets must never be committed to the repository. Production routes must continue to use database-backed state, ownership checks, RBAC, audit history and explicit state transitions.