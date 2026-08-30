# SanPaid Frontend Functionality Repair Prompt

Use these files **in order** against the existing `index.html` frontend. The goal is to preserve the current design while making every meaningful control actually work using HTML, CSS and Vanilla JavaScript only.

## Reading / execution order

1. `01-audit-state-booking-customer.txt`
2. `02-worker-admin-service-payment.txt`
3. `03-validation-responsive-click-audit.txt`
4. `04-golden-flows-qa-start.txt`

## Priority

- Audit every clickable element first.
- Remove dead `href="#"` behaviour from critical actions.
- Add real demo state changes, not alert-only placeholders.
- Make Customer, Worker, Cooperative Admin and Federation flows clickable.
- Preserve eligibility-first fair matching and exclude unverified workers.
- Make dual service-start verification, sandbox payment, complaints/SLA and capacity exchange demonstrable.
- Persist demo state using a versioned localStorage key.
- Finish by manually testing every critical button and Golden Flow.

The backend/database integration prompt remains separately under `docs/backend-master-prompt/` and should be used after the frontend demo is stable.