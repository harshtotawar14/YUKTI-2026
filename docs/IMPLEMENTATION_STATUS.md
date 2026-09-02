# SanPaid Implementation Status — Evidence First

Status meanings:
- **IMPLEMENTED** — backend/source behavior exists and has automated or previous production E2E proof.
- **PROTOTYPE / DEMO** — intentionally controlled or sandbox behavior; do not present as a production external integration.
- **FUTURE / INTEGRATION-READY** — not currently connected end to end.
- **VERIFY NEXT** — source exists but this specific dossier acceptance behavior still needs dedicated proof before it is called implemented.

| Feature | Status | Current proof / boundary |
|---|---|---|
| Customer login | IMPLEMENTED | Session auth and production E2E previously passed. |
| Worker login | IMPLEMENTED | Role login and worker E2E previously passed. |
| Cooperative Admin login | IMPLEMENTED | Role login and scoped workspace E2E previously passed. |
| Federation Admin login | IMPLEMENTED | Role login and judge/federation views previously passed. |
| Customer booking | IMPLEMENTED | PostgreSQL-backed create flow + E2E. |
| Eligibility-first matching | IMPLEMENTED IN SOURCE | Canonical matching module gates active/verified/skill/availability/cooperative/radius before ranking; deploy verification pending after current repair batch. |
| Explainable fair ranking | IMPLEMENTED IN SOURCE | Persisted matching score, factor scores and reason codes; deploy verification pending. |
| Worker accept/decline | IMPLEMENTED | Server-authoritative offer response flow. |
| Same-booking fallback/reassignment | IMPLEMENTED | Production E2E previously passed; new source pre-ranks fallback queue. |
| Atomic double accept protection | IMPLEMENTED IN SOURCE | Conditional booking claim in matching route; automated matching tests. |
| Travel/arrival lifecycle | IMPLEMENTED | Production E2E previously passed. |
| Identity/liveness | PROTOTYPE / DEMO | Sandbox identity result only; no government/production biometric integration claimed. |
| One-time service-start token | IMPLEMENTED | Hashed short-lived token, customer ownership check, one-time consumption; E2E passed. |
| Customer service-start confirmation | IMPLEMENTED | E2E passed. |
| Additional charge request | IMPLEMENTED | Worker request + customer approval E2E passed. |
| Admin out-of-policy price exception | VERIFY NEXT | Dossier behavior needs dedicated policy/approval proof. |
| Completion confirmation | IMPLEMENTED | Worker completion request + customer confirmation E2E passed. |
| Payment | PROTOTYPE / DEMO | Sandbox payment only; state/invoice persistence E2E passed. |
| Invoice | IMPLEMENTED FOR SANDBOX FLOW | Generated and persisted with sandbox payment. |
| Rating | IMPLEMENTED | Completed booking rating E2E passed. |
| Worker earnings ledger | VERIFY NEXT | Do not claim until dedicated ledger proof is green. |
| Complaint creation | IMPLEMENTED IN SOURCE | Customer-owned booking validation, severity, configurable SLA selection and complaint event/audit evidence are covered by automated source contracts; deployment E2E pending. |
| Complaint SLA escalation | IMPLEMENTED IN SOURCE / PROTOTYPE OPERATIONS | Configurable per-cooperative/category/severity policy, overdue escalation state and admin notification exist. Escalation is evaluated during complaint API activity; a durable background scheduler is future hardening. |
| Complaint evidence timeline | IMPLEMENTED IN SOURCE | Case-scoped timeline aggregates complaint events, booking states, additional charges, payment/invoice and audit events; deployment E2E pending. |
| Cooperative Admin dashboard | IMPLEMENTED CORE | Scoped booking workspace E2E passed; deeper governance actions need module-specific tests. |
| Federation view | IMPLEMENTED CORE | Judge/federation overview/planning/workforce routes E2E passed. |
| Capacity exchange | PROTOTYPE / VERIFY NEXT | Data model/UI exists; consent + authorized cross-coop assignment semantics need dedicated E2E. |
| Digital Service Passport | PROTOTYPE / VERIFY NEXT | SanPaid/Federation service-history concept only; never call government certificate. |
| Welfare/insurance | FUTURE / INTEGRATION-READY | Informational/integration-ready only unless a real authorized integration is added. |
| Training recommendation | PROTOTYPE / VERIFY NEXT | Source/data model exists; demand-linked human-approved workflow needs proof. |
| Demand forecast | PROTOTYPE | Public proof now exposes observed demand/capacity truth; do not claim trained ML accuracy without evaluation. |
| Fairness audit metrics | PARTIAL / VERIFY NEXT | Matching factors persist; outcome-level opportunity concentration/utilization/travel metrics still need dedicated audit proof. |
| Cross-language typed request | PARTIAL / VERIFY NEXT | Request-language/voice transcript fields exist; low-confidence critical-field confirmation needs proof. |
| Voice playback / speech provider | PROTOTYPE / VERIFY NEXT | Do not claim production speech integration without provider proof. |
| Low-connectivity pending sync | FUTURE / VERIFY NEXT | Network-first caching is not transactional offline sync. |
| Audit events | IMPLEMENTED CORE | Booking and privileged workflow events persist in PostgreSQL. |
| Backup/restore proof | VERIFY NEXT | Must be tested before final SIH submission. |

## Rule

The landing, PPT and judge answers must never promote a row above this status without new test evidence.
