# SanPaid — Final SIH Demo Hardening

This folder contains the final deep-integration execution prompt for turning the current SanPaid frontend/mobile prototype into a connected SIH-ready system.

Use the files strictly in this order:

1. `01-backend-two-device-matching.txt`
2. `02-trust-service-capacity-sla.txt`
3. `03-demand-mobile-realtime-demo.txt`
4. `04-qa-security-acceptance-start.txt`

## Core objective

Do not add random features. Deepen the strongest SanPaid workflows:

- shared backend + PostgreSQL/PostGIS where needed;
- two-device Customer → Worker booking;
- realtime worker offers and customer updates;
- eligibility-first explainable matching;
- worker Accept/Reject and replacement;
- dual service-start verification;
- controlled extra-charge/payment/invoice flow;
- Cooperative Command Center;
- cross-cooperative capacity exchange with worker consent;
- complaint/SLA escalation and audit timeline;
- Demand → Capacity → Skill Gap → Action;
- mobile voice request delivery;
- deterministic, connected and believable demo data;
- final mobile, network, race-condition, idempotency and click QA.

## Priority rule

If time is limited, prioritize:

`Backend → Two-device booking → Realtime offer → Booking lifecycle → Dual verification → Fair matching → Cooperative governance → Capacity exchange → Complaint/SLA → Demand planning`

Do not sacrifice these for decorative maps, animations or extra categories.

## Critical acceptance rule

The final SIH demo should allow a Customer on one device to create a booking and a Worker on another device/browser to receive, listen to, reject/accept and progress the same backend-backed booking. A localStorage-only same-device flow is not sufficient for the final hardening phase.
