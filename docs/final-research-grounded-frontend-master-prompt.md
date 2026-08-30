# SANPAID — FINAL RESEARCH-GROUNDED WORKING WEBSITE MASTER PROMPT

## SIH 2026 · PS ID 26089
## HTML + CSS + Vanilla JavaScript only

You are the Principal Frontend Engineer, Product Designer, UX Architect, Product Manager, QA Engineer, Data Visualization Engineer and Accessibility Engineer for the EXISTING SanPaid repository.

Your task is not to create another disconnected website or a visual mockup. Transform the existing SanPaid HTML/CSS/JavaScript frontend into a complete, coherent, high-fidelity, SIH-ready working product demo while preserving good existing code and the current SanPaid identity.

Use only HTML, CSS and Vanilla JavaScript unless an existing dependency is already safely used. Real backend/PostgreSQL integration will happen separately. For now, the entire frontend must behave like a realistic application through a structured Demo Data + API Adapter architecture so the backend can later replace the demo layer without rewriting the UI.

---

## 1. FIRST: AUDIT THE REAL REPOSITORY

Before editing, inspect the complete repository including `index.html`, all HTML/CSS/JS files, README, `docs/frontend-functionality-repair/`, `docs/backend-master-prompt/`, current demo data, buttons, links, forms, dashboards, cards, tables, charts, navigation, localStorage/sessionStorage logic, modals and event listeners.

Create an internal audit with:

- Page
- Feature
- Current state
- Expected behaviour
- Current data source
- Dead / working
- Fix required

Find and fix every `href="#"`, dead button, fake CTA, alert-only action, placeholder console log, hardcoded KPI, random result, broken selector, missing handler, duplicate ID, broken route/modal, non-working search/filter/pagination, fake loading state and inconsistent role state.

Do not start by rewriting the design. Understand first, then repair systematically.

---

## 2. PRODUCT SOURCE OF TRUTH

SanPaid is NOT another Urban Company-style marketplace.

Position it as:

> SanPaid is an AI-assisted cooperative workforce operating network that connects verified local demand and supply, distributes qualified opportunities fairly, supports trusted service delivery, protects worker earnings and welfare, and helps cooperatives prepare for future demand.

The complete operating loop is:

Customer → Service Demand → Cooperative Workforce → Verified Eligible Workers → Fair & Explainable Allocation → Worker Choice → Trusted Service Delivery → Transparent Payment → Service Passport / Feedback → Cooperative Intelligence → Demand / Capacity Planning → Better Workforce Preparation.

The five visible product pillars are:

1. CONNECT
2. TRUST
3. ALLOCATE FAIRLY
4. PROTECT & GROW
5. GOVERN & PREDICT

---

## 3. DATA MUST NOT LOOK FAKE

Do not type random dashboard numbers directly into HTML.

Create one central deterministic, connected demo dataset such as `DemoDatabase` with linked entities for:

- users
- roles
- customers
- workers
- cooperatives
- federation
- services
- worker skills
- worker documents
- availability
- bookings
- offers
- payments
- invoices
- ratings
- complaints
- notifications
- welfare
- training
- capacity requests
- forecasts
- policies
- audit logs

All KPIs and tables must be derived from this data.

Do not use `Math.random()` for business data that changes on every refresh. Seed data must be stable and persist using a versioned localStorage key such as `sanpaid_demo_state_v3`.

Refresh must preserve bookings, assignments, verification state, payments, complaints, notifications, capacity requests, policies and audit history.

Use realistic Maharashtra geography and realistic Indian names. Create enough connected records so the system feels operational, but paginate long tables.

Do not display giant “fake data” labels everywhere. Use one subtle environment indicator such as `SIH Demonstration Environment`. Only true sandbox capabilities such as biometric verification and payment should visibly say `SANDBOX`.

Never call something LIVE unless it is actually live.

---

## 4. VISUAL DIRECTION

Preserve SanPaid as a professional cooperative/public-infrastructure + modern workforce SaaS product.

Use:

- dark cooperative navy/green
- muted gold selectively
- off-white backgrounds
- white professional cards
- clean typography
- strong spacing hierarchy
- professional icons
- status badges
- timelines
- tables
- charts
- detail drawers
- subtle micro-interactions

Avoid neon, gaming gradients, cartoon-heavy UI, excessive glassmorphism, huge emojis, fake testimonials, fake customer counts, fake revenue, fake AI accuracy or random “live activity”.

The live website and SIH demo should feel like one coherent product, not a college template.

---

## 5. LANDING PAGE

Hero:

SANPAID
AI-Assisted Cooperative Workforce Operating Network

Headline:

Trusted Local Services.
Fair Opportunities.
Stronger Cooperatives.

Primary actions:

- Book a Service
- Join as Worker
- Cooperative Login
- Federation Login

Hero search must include:

- Service
- Location
- Preferred Time
- Search Verified Workers

Search must validate inputs, create a request, check local capacity, run eligibility, rank workers and display results. It must not simply scroll down.

Service categories:

Electrician, Plumber, Carpenter, Painter, Cleaner, Domestic Helper, Caregiver, Driver, Gardener and Technician.

Every service card must be clickable and keyboard accessible and show a starting estimate, typical duration, available eligible capacity and actions.

Availability must come from worker state, not the same hardcoded value for every card.

---

## 6. ROLE-BASED APPLICATION

Primary roles:

- CUSTOMER
- WORKER
- COOPERATIVE ADMIN
- FEDERATION ADMIN

Implement role-aware demo login, session persistence, role-specific dashboards, logout, back-to-website and optional role switching when appropriate.

No role should see the same dashboard with only labels changed.

---

## 7. CUSTOMER DASHBOARD

Navigation:

Overview, Book Service, Active Booking, Upcoming Services, Service History, Invoices, Payments, Ratings, Complaints, Saved Addresses, Notifications and Profile.

Calculated overview cards:

- Active Service
- Upcoming Service
- Total Completed
- Pending Payment
- Open Complaint

Add recent service timeline, Book Again and recommendations based on actual service history rather than random recommendations.

---

## 8. COMPLETE CUSTOMER BOOKING FLOW

Working wizard:

1. Select Service
2. Problem description
3. Optional AI-assisted service suggestion
4. Location
5. Schedule: Now / Later / Urgent
6. Estimate
7. Local capacity / eligibility / fair matching
8. Confirmation

Support text, optional image and browser voice input where available.

On confirmation:

- generate unique booking ID
- persist booking
- create status history
- create notifications
- create audit event
- update all affected dashboards

---

## 9. AI SERVICE DIAGNOSIS

Optional input:

- problem text
- image
- voice

Output:

- Recommended Service
- Likely Skill
- Urgency
- Confidence
- Safety Advice

Label it `AI-Assisted Suggestion`, not production AI.

Allow `Use Recommendation` and `Choose Service Manually`.

If AI is unavailable, manual booking must continue.

---

## 10. LOCAL CAPACITY FIRST + CONFIGURABLE RADIUS

Matching flow:

Customer Request → Local Capacity Check → Eligibility Gate → Fair Ranking → Worker Offer.

If local capacity is insufficient, offer policy-authorized radius expansion, alternate time or Federation Capacity Exchange.

20 KM is the default demo preference, not a universal fixed rule. Display `20 KM Default Radius`, not `Mandatory 20 KM Rule`.

Centralize the radius in policy data.

---

## 11. ELIGIBILITY BEFORE FAIRNESS

Before ranking, validate:

- VERIFIED worker
- correct skill
- valid required certificate
- valid mandatory documents
- active status
- available status
- correct service zone
- within current policy radius
- no schedule conflict
- not suspended
- no incompatible active booking

Customer must never see an unverified worker as bookable.

Only after eligibility should fair ranking occur.

---

## 12. FAIR & EXPLAINABLE RANKING

Use deterministic policy-driven factors:

- distance
- skill match
- availability
- rating
- recent workload
- recent opportunity count
- schedule fit
- travel burden
- fair rotation

Customer sees simplified reasons such as:

Amit Patil · 91% Match
Verified Electrician · 2.3 KM Away · Available Now · 4.8 Rating · Balanced Recent Workload

Cooperative Admin sees deeper factor breakdown.

Do not present ranking as magical AI.

Create Fair Allocation analytics using actual state:

- eligible workers
- offers sent
- accepted
- rejected
- completed
- average jobs per worker
- underutilized workers
- opportunity concentration
- travel burden

These metrics must update after real demo actions.

---

## 13. WORKER CHOICE + OFFER FALLBACK

Worker job card shows:

Booking ID, Service, Area, Approx Distance, Schedule, Expected Duration, Estimated Earnings, Urgency, Preferred Customer Language and Special Instructions.

Buttons:

- ACCEPT
- REJECT

Reject reasons:

Too Far, Unavailable, Schedule Conflict, Not My Skill, Personal Reason, Other.

Worker must never be forced into a job.

If rejected or timed out, record the outcome and offer the next eligible candidate. Customer should see a real state such as `Finding another verified worker...`.

---

## 14. SMART REPLACEMENT

If assigned worker later cancels:

Confirmed → Worker Cancelled → Finding Replacement → Re-run Eligibility → Re-rank → Offer Backup Worker → Replacement Accepted → Customer Updated.

If no replacement is found, provide alternate time, authorized radius expansion, capacity exchange or customer cancellation.

Do not kill the entire booking immediately.

---

## 15. CONTINUOUS TRUST SYSTEM

Worker verification is a lifecycle, not a permanent tick.

Use:

identity, cooperative affiliation, documents, skills, certificates, expiry, training, completed jobs, ratings, complaints and re-verification.

Statuses:

DRAFT, SUBMITTED, UNDER REVIEW, MORE INFO REQUIRED, VERIFIED, EXPIRED, SUSPENDED, REJECTED.

Expired mandatory documents must immediately affect eligibility.

---

## 16. DIGITAL WORKER ID

Customer-safe profile may show:

- Worker ID
- Photo
- Name
- Verified Status
- Cooperative
- Verified Skills
- Rating
- Completed Services
- Verification Validity
- Service Passport summary

Never expose Aadhaar number, bank details, private address, private document numbers or internal admin comments.

---

## 17. COOPERATIVE WORKER VERIFICATION FLOW

Admin verification queue must be real and interactive.

Worker details include identity status, profile photo, cooperative membership, skills, certificates, experience and document validity.

Actions:

- VERIFY
- REQUEST MORE INFORMATION
- REJECT
- SUSPEND where policy permits

Each action must update the worker, matching eligibility, admin dashboard, worker dashboard, notifications and audit log immediately.

No visual-only buttons.

---

## 18. DUAL SERVICE-START VERIFICATION

This is a flagship SanPaid trust flow.

Worker Accepted → Traveling → Arrived → Location/Booking Check → Sandbox Identity/Liveness Verification → Identity Verified → Booking-specific One-time QR/Token → Customer Views Worker Details → Customer Confirms → Service Start Enabled.

Critical frontend rule:

`identityVerified === true && customerConfirmed === true`

Only then may START SERVICE become enabled.

The QR/token must be booking-specific, short-lived and one-time. Track ACTIVE, EXPIRED and USED states. Do not allow reuse.

Use the label `Sandbox Identity Verification`; never pretend it is Aadhaar biometric verification.

---

## 19. SERVICE EXECUTION

Worker Active Service screen must show:

Customer Area, Service, Booking ID, Start Time, Current Status, Problem Description, Approved Estimate, Before Evidence, Additional Work and Completion.

Timeline:

Assigned → Traveling → Arrived → Verified → Customer Confirmed → Service Started → In Progress → Completion Requested → Completed.

Support Before Service Photo and After Service Photo with preview and timestamps. Associate evidence with the booking. In frontend demo, keep files browser-local if needed and do not pretend they are cloud stored.

---

## 20. CONTROLLED EXTRA CHARGE

Worker cannot silently change price.

Worker submits:

- Reason
- Description
- Amount
- Optional Evidence

Customer sees original estimate, requested addition, reason and updated total.

Customer must APPROVE or REJECT.

Only approved amount affects final bill.

Create notification + audit event.

---

## 21. COMPLETION + SANDBOX PAYMENT + INVOICE

Worker requests completion.

Customer can Confirm Service Completed or Report Issue.

On confirmation:

COMPLETED → PAYMENT PENDING.

Payment methods may show UPI, Card, Wallet and Cash but must clearly be `SANDBOX PAYMENT` in frontend-only mode. Do not pretend real money moved.

Generate stable transaction ID, timestamp, amount, method and status.

Payment must update:

- customer payment history
- worker earnings ledger
- invoice
- cooperative analytics
- notifications
- audit log

Invoice must show Booking ID, Customer, Worker, Cooperative, Service, original estimate, base/visit/distance/urgency charges where applicable, approved extra work, taxes/fees where applicable, final total, payment method, transaction ID and payment status.

Provide View, Print and print-to-PDF friendly layout.

---

## 22. WORKER EARNINGS LEDGER

Worker dashboard calculates:

- Today’s Earnings
- This Week
- This Month
- Pending Settlement
- Completed Jobs

Ledger table:

Booking, Service, Gross Amount, Applicable Fee, Net Worker Amount, Settlement Status, Date.

All values must derive from bookings/payments. No random earnings.

---

## 23. RATINGS + DIGITAL SERVICE REPORT + SERVICE PASSPORT

Only completed service can be rated.

Rating categories:

Service Quality, Professionalism, Punctuality, Communication and Feedback.

Submission updates worker rating, service history, passport and analytics and prevents duplicate rating.

Create a Digital Service Report with:

Booking ID, Worker, Cooperative, Service, Arrival, Identity Verification, Customer Confirmation, Start, Completion, Before Evidence, After Evidence, Original Estimate, Approved Extras, Payment, Invoice, Rating and Complaint reference if any.

Worker dashboard must include a `SanPaid Verified Service Passport` with verified skills, skill level, certificates, completed services, rating trend, verified training, cooperative affiliation, service categories, work history and expiring qualifications.

Do not call it a government certificate.

---

## 24. WORKER DASHBOARD

Mobile-first navigation:

Overview, Job Offers, Active Service, Schedule, Availability, Earnings, Service History, Service Passport, Ratings, Skills, Documents, Verification, Welfare, Training, Notifications, Support and Profile.

ONLINE/OFFLINE availability toggle must affect matching immediately.

---

## 25. WORKER WELFARE + TRAINING

Welfare page:

Welfare Programs, Insurance Status, Renewal Reminders, Training, Skill Development, Safety Resources and Financial Guidance.

Status labels:

AVAILABLE, ELIGIBLE, CHECK REQUIRED, APPLIED, ENROLLED, COMPLETED, EXPIRED.

Do not claim government/insurance APIs are connected unless they really are. Use `Information` or `Integration Ready` where appropriate.

Training recommendations must connect to actual demand/skill gaps, not random courses.

Only after successful assessment should a new skill become verified.

---

## 26. COOPERATIVE GOVERNANCE COMMAND CENTER

This must be one of the strongest screens.

Navigation:

Overview, Workers, Verification, Skills, Bookings, Matching, Fair Allocation, Capacity, Payments, Complaints, SLA, Welfare, Training, Analytics, Demand Planning, Reports, Audit Logs, Policies and Settings.

Overview KPIs must be calculated from state:

Total Workers, Verified, Pending Verification, Available, Busy, Offline, Expired Documents, Today’s Bookings, Active Services, Completed Today, Open Complaints, SLA Breaches, Pending Payments, Worker Utilization and Current Demand Gap.

Operational tables must support search, filter, sort, pagination, details view and authorized actions.

---

## 27. CAPACITY VIEW + CROSS-COOPERATIVE EXCHANGE

Capacity view shows by service:

Demand, Available Eligible Workers, Busy Workers, Available Capacity and Shortage/Surplus.

Values must be calculated from state/forecast.

Capacity Exchange flow:

Shortage → View Nearby Cooperatives → Show Verified Available Capacity → Request Capacity → Provider Review → Approve/Reject → Eligible Workers Receive Offer → Worker Accept/Reject → Assignment.

Worker choice remains mandatory.

Show Home Cooperative, Serving Cooperative, Service, Time, Distance, Worker Consent, Request Owner, Complaint Responsibility and Status.

---

## 28. FEDERATION COMMAND CENTER

Navigation:

Overview, Cooperatives, Regional Workforce, Demand Map, Capacity Map, Capacity Exchange, Policy Standards, Compliance, SLA, Disputes, Appeals, Demand Planning, Skill Gap, Analytics, Audit and Reports.

Calculated top cards:

Total Cooperatives, Total Verified Workers, Regional Demand, Regional Capacity, Current Shortages, Capacity Requests, Regional SLA Breaches and Open Appeals.

---

## 29. POLICY ENGINE UI

Central policy object must include:

- Default Service Radius
- Maximum Expansion
- Worker Offer Timeout
- Urgent Priority
- Minimum Eligibility Conditions
- Pricing Limits
- Extra Charge Limit
- SLA Times
- Document Expiry Rules
- Ranking Weights
- Capacity Exchange Policy
- Working Zones

Show policy version, effective date and last updated by.

Do not scatter policy values through individual handlers.

---

## 30. COMPLAINT + SLA + EVIDENCE TIMELINE

Customer can raise complaint against an eligible booking.

Categories include Incomplete Service, Service Quality, Late Arrival, Worker Behaviour, Pricing, Additional Charge, Payment, Cancellation, No Show, Safety and Other.

Admin complaint detail automatically reconstructs evidence timeline:

Booking Created → Worker Offered → Worker Accepted → Arrival → Verification → Customer Confirmation → Service Start → Extra Work Request → Extra Work Decision → Completion → Payment → Invoice → Rating → Complaint.

SLA states:

NEW → ASSIGNED L1 → UNDER REVIEW → ESCALATED L2 → ESCALATED L3 → RESOLVED → CLOSED.

Show owner, created time, SLA due time, remaining time, status and timeline.

Put `Simulate SLA Breach` only inside authorized Demo Tools, not customer UI.

Escalation must create notifications and audit events.

---

## 31. MULTILINGUAL + VOICE

Support only the languages actually promised in the prototype:

English, Hindi and Marathi.

Do not claim all languages.

Example customer request:

`Mala udya sakali plumber pahije.`

Structure it into Service, Date, Time and Location. Show recognition confidence and confirm critical fields before proceeding when confidence is low.

Worker can have preferred language and receive translated job summary.

If browser speech API is unavailable, text input must remain functional.

---

## 32. LOW-CONNECTIVITY SAFE MODE

Detect browser network state.

When offline, display `Offline Mode` and allow viewing cached active job/service information.

Offline action must become `PENDING SYNC`, not immediately confirmed.

When connection returns, sync and show `SYNCED` or `FAILED — RETRY`.

---

## 33. DEMAND + WORKFORCE PLANNING

Cooperative Demand Planning must show:

Service, Zone, Historical Demand, Expected Demand, Forecast Confidence, Eligible Capacity, Capacity Gap, Skill Gap and Recommended Action.

Possible actions:

No Action, Open More Slots, Capacity Exchange, Training Recommendation, Offer Later Service Window.

Use deterministic baseline/trend logic in frontend demo.

Low-data case:

BASELINE + LOW CONFIDENCE.

Data-rich case:

TREND-ASSISTED FORECAST + justified MEDIUM/HIGH confidence.

Never invent precise model accuracy.

Forecast must lead to working actions such as `Create Capacity Request` or `Review Training Gap`.

---

## 34. ANALYTICS

Charts must come from state, not random visuals.

Customer:

service history, spending summary.

Worker:

earnings trend, jobs trend, rating trend.

Cooperative:

booking trend, service demand, worker utilization, opportunity distribution, complaint SLA, payment status, training impact.

Federation:

regional demand, regional capacity, capacity exchange, skill gaps, SLA comparison.

Use lightweight SVG/CSS/canvas charts where appropriate.

---

## 35. AUDIT LOG

Every major action creates an audit event, including:

LOGIN, BOOKING_CREATED, MATCH_RUN, WORKER_OFFERED, OFFER_REJECTED, WORKER_ASSIGNED, WORKER_ARRIVED, IDENTITY_VERIFIED, CUSTOMER_CONFIRMED, SERVICE_STARTED, EXTRA_CHARGE_REQUESTED, EXTRA_CHARGE_APPROVED, SERVICE_COMPLETED, PAYMENT_COMPLETED, RATING_SUBMITTED, WORKER_VERIFIED, COMPLAINT_CREATED, SLA_ESCALATED, CAPACITY_REQUESTED, CAPACITY_APPROVED and POLICY_UPDATED.

Admin audit table shows Time, Actor, Role, Action, Entity, ID and Description.

---

## 36. NOTIFICATION CENTER

Notifications must be generated from actual actions, not static cards.

Support customer, worker and admin notifications for booking, offers, assignment, arrival, verification, extra charges, completion, payment, complaints, document expiry, training, SLA breach, capacity requests and policy alerts.

Allow mark-read, mark-all-read and filters.

---

## 37. GLOBAL SEARCH + DETAIL DRAWERS

Admin global search should find Booking ID, Worker Name, Worker ID, Complaint ID, Invoice ID, Service and Cooperative.

Selecting a result opens the correct detail view.

Make records explorable:

Booking → Booking Details
Worker → Worker Details
Complaint → Complaint Timeline
Invoice → Invoice
Capacity Request → Request Workflow
Forecast → Forecast Explanation

This is critical for making the application feel like a real operating system.

---

## 38. STATE SYNCHRONIZATION

A single action must update all affected views immediately.

Example: Admin verifies a worker → verification queue updates → verified count updates → worker becomes matching-eligible → worker dashboard updates → notification created → audit event created.

Example: Customer creates booking → customer active booking updates → cooperative booking table updates → matching record created → worker offer created → admin metrics update.

Example: Worker accepts → customer sees assignment → cooperative sees assignment → worker active job updates → notifications update.

No manual page refresh should be required.

---

## 39. UI/UX QUALITY

Every sidebar item must open meaningful content.

No menu item may merely highlight itself without rendering a real page.

Use reusable modal/drawer/toast/form systems.

Forms need labels, required validation, specific errors, disabled/loading state, success state and cancel/back controls.

Do not use `alert()` for normal UX.

Provide professional loading, empty and failure states.

Examples:

Checking Eligibility…
Evaluating Verified Capacity…
Ranking Eligible Workers…
Creating Booking…
Verifying Identity…
Processing Sandbox Payment…

Failure paths must include:

No Worker → alternate time/radius/capacity exchange
Worker Rejected → next worker
Worker Cancelled → replacement
Camera Unavailable → approved fallback
Location Denied → manual address
Voice Unavailable → text
Translation Failed → original text
Payment Failed → safe retry
AI Unavailable → manual booking

---

## 40. RESPONSIVE + ACCESSIBLE

Test at 360, 390, 430, 768, 1024, 1366, 1440 and 1920 widths.

Customer mobile must be simple.
Worker mobile gets highest priority.
Admin desktop uses sidebar.
Admin mobile uses drawer.

No horizontal overflow, clipped cards, broken modals, unreadable tables or tiny controls.

Use semantic HTML, labels, keyboard navigation, visible focus, ARIA where needed, minimum touch targets and accessible statuses. Do not rely only on colour.

---

## 41. CLAIM-SAFE RESEARCH DIFFERENTIATION

Do not say:

- Urban Company has no verification
- Other platforms do not support workers
- SanPaid is India’s first
- only platform in India

Instead use claim-safe wording:

> Existing platforms address parts of discovery, booking, verification and service matching. SanPaid differentiates through an integrated cooperative/federation operating model combining cross-cooperative capacity exchange, eligibility-first fair opportunity, explainable allocation, worker lifecycle support and demand-led workforce planning.

Core differentiators to make visible:

- Cooperative / Federation Governance
- Cross-Cooperative Capacity Exchange
- Eligibility-First Fair Opportunity
- Explainable Ranking
- Cross-Cooperative Ownership
- Demand → Capacity → Skill-Gap Planning
- Worker Lifecycle / Service Passport

---

## 42. IMPACT

Show Social, Economic, Educational, Technological and Environmental impact without fabricated percentages.

Social: trusted local service, community inclusion, worker dignity.
Economic: fair opportunity, transparent earnings, local economic activity.
Educational: training, verified skill growth, digital literacy.
Technological: cooperative digitisation, AI-assisted planning, auditable workflow.
Environmental: local matching, less unnecessary travel, paperless service records.

Use `Metrics to measure during pilot` rather than fake achieved impact percentages.

---

## 43. HONEST IMPLEMENTATION STATUS

Do not claim everything is production-ready.

Use:

- WORKING FRONTEND DEMO
- FRONTEND PROTOTYPE
- SANDBOX
- BACKEND INTEGRATION PENDING
- INTEGRATION READY
- FUTURE

Biometric/payment frontend simulations must say SANDBOX.
Government/insurance features stay INTEGRATION READY unless actually connected.

Do not make normal operational dashboards look fake by repeating demo labels everywhere.

---

## 44. API ADAPTER ARCHITECTURE

All UI actions must go through an abstraction layer such as:

`API.login()`
`API.getDashboard()`
`API.createBooking()`
`API.findEligibleWorkers()`
`API.submitOfferResponse()`
`API.verifyArrival()`
`API.confirmWorker()`
`API.requestExtraCharge()`
`API.completeService()`
`API.makePayment()`
`API.raiseComplaint()`
`API.createCapacityRequest()`
`API.getForecast()`

Current implementation uses `DemoAPI`.
Future backend uses `RealAPI`.

Do not tightly couple UI components directly to localStorage.

---

## 45. CENTRAL BUSINESS POLICIES

Centralize:

- defaultRadiusKm
- maximumRadiusKm
- offerTimeoutSeconds
- extraChargeLimit
- SLA hours
- ranking weights
- pricing rules
- document expiry behaviour
- working zones

Do not hardcode them separately in UI handlers.

---

## 46. PRIVACY

Customer sees only safe worker information.
Worker sees only booking-relevant customer information.
Cooperative sees its authorized society data.
Federation sees authorized aggregate/regional data.

Hide exact customer address before assignment where practical.

Do not claim localStorage provides production security.

---

## 47. DEMO CONTROL CENTER

Create a subtle presenter-only Demo Control Center with:

- Reset Demo Dataset
- Jump to Customer Scenario
- Jump to Worker Offer
- Jump to Arrival Verification
- Jump to Complaint SLA
- Jump to Capacity Shortage
- Jump to Forecast Scenario

This exists to make the SIH presentation reliable and should not dominate normal user screens.

---

## 48. GOLDEN DEMO FLOWS — ALL MUST WORK

### Golden Demo 1 — Customer Service
Landing → Customer Login → Electrician Request → Location → Problem → Estimate → Eligibility → Explainable Ranking → Worker Offer → Worker Accept → Customer Assignment → Traveling → Arrival → Sandbox Identity Check → Dynamic QR → Customer Confirm → Start Service → Before Evidence → Additional Work Request → Customer Approval → Completion → After Evidence → Customer Confirm → Sandbox Payment → Invoice → Rating → Digital Service Report → Worker Passport Update → Admin Analytics Update.

### Golden Demo 2 — Worker Reject
Offer Worker A → Reject + Reason → Next Eligible Worker → Offer → Accept → Assignment → Customer Update.

### Golden Demo 3 — Replacement
Confirmed Worker → Cancel → Finding Replacement → Eligible Pool → New Offer → New Worker Accept → Customer Notification → Booking Continues.

### Golden Demo 4 — Complaint
Completed Service → Complaint → Evidence Timeline → L1 → Demo SLA Breach → L2 → optional Federation L3 → Human Resolution → Audit Log.

### Golden Demo 5 — Capacity Exchange
Demand Gap → Local Shortage → Federation Capacity View → Nearby Cooperative → Request Capacity → Cooperative Approval → Worker Offer → Worker Accept → Cross-Coop Assignment.

### Golden Demo 6 — Demand Planning
Historical Demand → Baseline / Forecast → Confidence → Capacity → Gap → Skill Gap → Training Recommendation and/or Capacity Exchange → Human Action.

### Golden Demo 7 — Language
Customer Marathi request → structured fields → confidence → confirmation → worker preferred Hindi → translated job card → Accept.

---

## 49. CLICK + CONSOLE + STATE QA

Manually click every critical navigation item, login, Get Started, booking action, service card, search, Back/Next/Cancel, location, voice, matching, worker details, Accept, Reject, availability, arrival, verification, QR, customer confirmation, Start Service, extra charge, approval/rejection, completion, payment, invoice, rating, complaint, SLA, worker verification, filters, capacity request/approval, forecast, policy, notifications, language, profile, logout and mobile menu.

No critical button may be dead.

There must be zero uncaught JavaScript errors, zero null event-listener crashes, zero broken imports, zero duplicate-ID bugs and zero malformed HTML interaction failures.

State consistency test:

- create booking → refresh → booking remains
- accept worker → refresh → assignment remains
- verify worker → refresh → status remains
- create complaint → refresh → complaint remains
- approve capacity request → refresh → approval remains
- reset demo data → deterministic original dataset returns

---

## 50. FINAL ACCEPTANCE

Before finishing, internally verify YES for all:

- Get Started works
- all four role logins work
- booking persists
- matching excludes unverified workers
- ranking explains itself
- worker reject triggers next offer
- worker accept assigns correctly
- customer sees assignment
- worker cancellation triggers replacement
- arrival works
- sandbox identity verification works
- customer confirmation works
- service start is locked until both verification conditions pass
- extra-charge approval works
- completion works
- sandbox payment works
- invoice works
- rating updates worker data
- Service Passport updates
- complaint works
- complaint timeline shows evidence
- SLA demo escalates
- admin can verify worker
- verification affects matching immediately
- all KPIs are computed, not hardcoded
- capacity exchange works
- worker still chooses
- federation dashboard works
- forecast shows confidence
- forecast leads to working action
- Hindi/Marathi flow works
- offline state has a safe fallback
- every navigation item opens meaningful content
- mobile works
- refresh preserves state
- no critical console errors remain

If any answer is NO, fix it before completion.

---

## 51. FINAL PRODUCT FEEL

When an SIH judge opens SanPaid, it should not feel like a set of hackathon cards. It should feel like a real cooperative workforce operating system condensed into a reliable working prototype.

Within 2–3 minutes, the judge should understand:

Customer → trusted local service.
Worker → fair opportunity + choice + transparent earnings + growth.
Cooperative → verification + operations + governance + capacity.
Federation → multi-cooperative coordination + policy + workforce planning.

The final story is:

DEMAND → ELIGIBILITY → FAIR ALLOCATION → WORKER CHOICE → TRUSTED DELIVERY → TRANSPARENT PAYMENT → AUDITABLE OUTCOME → CAPACITY / SKILL PLANNING.

Never write claims such as `100% Secure`, `Fraud Free`, `Government Approved`, `All Workers Aadhaar Verified`, `Guaranteed Worker Income`, `95% Accurate AI`, `Millions of Users` or `Only Platform in India` without evidence.

---

## 52. EXECUTION ORDER

1. Repository audit
2. Repair dead interactions
3. Central deterministic dataset
4. API adapter
5. Authentication/roles
6. Customer booking
7. Eligibility + matching
8. Worker offer + reject/accept
9. Smart replacement
10. Continuous verification
11. Dual service-start verification
12. Service execution + evidence
13. Controlled pricing
14. Payment + invoice
15. Rating + service report + passport
16. Worker dashboard
17. Worker welfare/training
18. Cooperative Command Center
19. Complaint + SLA
20. Capacity Exchange
21. Federation Command Center
22. Voice + translation + offline safety
23. Demand planning
24. Analytics + audit
25. Responsive/accessibility pass
26. Full click audit
27. Golden Demo QA

Do not stop after the landing page. Do not stop after making buttons clickable. Complete Customer, Worker, Cooperative and Federation flows as one synchronized product.

---

## START NOW

Open the CURRENT SanPaid repository. Do not create a second independent website. Preserve good code and design, audit every interaction, replace disconnected/hardcoded behaviour with connected deterministic application state, make every dashboard operational, make every major action synchronize across affected roles, keep sandbox integrations honestly labelled, and manually test every Golden Demo flow.

The final objective is a HIGH-FIDELITY, RESEARCH-GROUNDED, COHERENT, CLICKABLE, STATEFUL, SIH-READY SANPAID WORKING PROTOTYPE — NOT A STATIC WEBSITE.
