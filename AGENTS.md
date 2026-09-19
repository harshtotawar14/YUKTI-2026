# SanPaid / SahKriya Codex Instructions

## Goal
Improve the existing SanPaid / SahKriya SIH 2026 prototype without rebuilding it.

## Non-negotiable
- Preserve existing pages, navigation, auth, APIs, backend, database integration, role flows, admin flows, and working features.
- Do not remove working functionality to simplify the UI.
- Do not hardcode secrets, tokens, passwords, or DATABASE_URL.
- Prefer editing existing files/components instead of introducing a new framework or duplicate pages.
- Keep backend behavior unchanged unless a frontend change strictly requires it.

## Current priority
Focus on frontend/UI/UX, especially the landing page.

The landing page should:
- be mobile-first;
- explain the product within a few seconds;
- use less text and more visual storytelling;
- feel premium, professional, civic-tech/SaaS, and SIH-ready;
- use restrained blue/white styling, strong hierarchy, subtle depth, clean cards, and purposeful motion;
- avoid flashy gaming UI, neon, excessive gradients/glow, heavy glassmorphism, clutter, and decorative motion with no information value.

## Mobile-first rules
Always verify at about 375px, 390px, tablet, and desktop.
- No horizontal overflow.
- No overlapping cards/buttons.
- No tiny text.
- Comfortable touch targets.
- Important content above the fold.
- Smooth performance on average phones.

## Motion / 3D
Use only lightweight, purposeful effects:
- entrance reveals;
- subtle parallax;
- card tilt/depth;
- animated workflow connections;
- cooperative capacity exchange visualization;
- demand-to-workforce visualization.

Respect prefers-reduced-motion. Avoid expensive continuous animation and heavy WebGL unless clearly justified.

## Product positioning
SanPaid is not another worker-listing app.

Core idea:
A cooperative-owned local workforce operating network that helps cooperatives:
1. deliver trusted services today;
2. learn from real demand;
3. prepare workforce capacity for tomorrow.

## Core USPs
Keep these visually prominent:

### 1. Cooperative Capacity Exchange
Local capacity first. If capacity is insufficient, eligible connected cooperative capacity may be suggested.
Customer keeps choice.
Worker keeps consent.
Cross-cooperative service requires governed authorization.
Never present this as forced assignment.

### 2. Demand-to-Workforce Loop
Observed demand -> capacity gap -> AI-assisted recommendation -> human review -> train / onboard / share capacity.
Always present AI as human-reviewed.

## Trust principles
Visually reinforce:
- verified workers;
- eligibility before ranking;
- fair opportunity;
- customer choice;
- worker consent;
- transparent estimate and approved extra cost;
- service-start verification;
- completion confirmation;
- invoice trail;
- ratings, complaints, and auditability.

Do not claim features or integrations that are not actually implemented.

## Evidence
Field validation is a major strength.
Show evidence as:
Source / Finding -> SanPaid Design Decision

Use wording like field-informed, stakeholder-informed, reviewed.
Do not imply government endorsement.

## Landing-page story
Prefer this sequence:
1. What SanPaid is
2. Real problem
3. How service moves
4. Two USPs
5. Evidence / field validation
6. Connected roles
7. Impact
8. Technical proof as progressive disclosure

## Hero
Keep it simple and visual.

Primary message:
Trusted local services.
Stronger cooperatives.

Show, rather than explain:
customer need -> verified worker -> cooperative network -> demand signal -> workforce preparation.

Primary CTA: OPEN PLATFORM
Secondary CTA: SEE PLATFORM TOUR

## Roles
Preserve:
- Customer
- Worker
- Cooperative Admin
- Federation / Network Admin

Normal service flow should remain customer + worker focused. Governance appears when needed.

## Copy
Use short, simple language.
Avoid long paragraphs, jargon, repeated explanations, exaggerated AI claims, and generic marketing fluff.

## Performance
- Avoid unnecessary JS.
- Prefer SVG/WebP for visuals.
- Lazy-load non-critical media.
- Avoid layout shift.
- Keep first render fast.
- Avoid large animation libraries unless needed.

## Accessibility
Keep semantic HTML, keyboard access, focus states, contrast, labels, alt text, and reduced-motion support.
Do not replace real buttons with clickable divs.

## Workflow
Before editing:
1. inspect the relevant existing files;
2. understand the current flow;
3. identify dependencies;
4. reuse existing styles/components where practical.

After editing:
1. run relevant checks/build;
2. inspect console errors;
3. verify desktop and mobile;
4. check overflow and alignment;
5. verify navigation and buttons;
6. verify role flows still work;
7. summarize changed files.

Do not declare completion without validation.

## Git / deployment
Repository: harshtotawar14/YUKTI-2026
Live design deployment: https://sahkriya.vercel.app/
Main branch is connected to Vercel.

Push only verified work to main with clear commit messages.

## Current instruction
Until explicitly told otherwise:
- focus on frontend design and UX;
- do not redesign backend architecture;
- do not change database configuration;
- do not introduce unrelated features;
- improve the existing product rather than rebuilding it.
