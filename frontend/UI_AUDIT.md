# SanPaid UI Audit

## Scope
This audit covers the public landing shell, role access entry points, local assets, accessibility wiring, critical demo controls and connected workflow ownership. Backend lifecycle correctness is separately covered by the authenticated production E2E suite.

## Defect found and fixed
- **Worker Access button was dead.** `#joinWorker` existed in `index.html` but had no JavaScript interaction owner. It is now wired through the canonical auth loader and opens the Worker role access/workspace.

## Automated UI contracts now enforced
- no duplicate DOM IDs;
- every static button declares `type`;
- every static button has an explicit ID handler or delegated data-action owner;
- form controls have accessible names;
- every `aria-controls` target exists;
- all local CSS/JS/image/manifest references in `index.html` exist;
- no empty or `javascript:` navigation links;
- Golden Demo, Role Access, mobile menu, matching CTA, service search, catalog retry, booking, worker access and cooperative access controls must remain present and wired;
- obvious TODO/FIXME/Coming-soon runtime placeholders are rejected.

## Existing connected-flow coverage
The authenticated production E2E suite already verifies:
Customer login → booking → Worker A decline → Worker B fallback/accept → travel → arrive → identity → customer confirm → service start → additional charge approval → completion → sandbox payment → invoice → rating → persistence → Cooperative Admin/Federation views → logout.

## Repository organization decision
`frontend/` and `backend/` are now visible top-level sections with canonical source maps. Runtime source files are intentionally not bulk-moved in this change because the existing build, Vercel Function path, CSP checks, service worker and integrity suite are verified against current paths. A physical source move should only happen as one dedicated migration that updates build/test/runtime references atomically; readability must not come at the cost of breaking the SIH demo.

## Deployment state
Vercel Git auto-deployment is disabled. These GitHub fixes do not consume a Vercel deployment and will reach production only when a manual deployment is intentionally requested.