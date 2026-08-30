# SanPaid Mobile-First + PWA Upgrade

Use these prompt parts in order after the research-grounded frontend and voice-delivery requirements are understood:

1. `01-audit-layout-navigation-voice.txt`
2. `02-voice-booking-mobile-workflows.txt`
3. `03-pwa-offline-performance-golden-demo.txt`
4. `04-permissions-breakpoints-qa-start.txt`

## Non-negotiable outcomes

- Same SanPaid product works on Android, iPhone, tablet and desktop.
- Zero horizontal page scrolling on phone layouts.
- Working mobile navigation replaces desktop-only sidebars/navigation.
- Customer booking is fully usable on mobile.
- Existing `voice-request.js` flow is preserved and optimized for mobile.
- Worker receives the matched booking's voice-derived request in Job Offers, can read/listen in a supported preferred language, then Accept/Reject.
- Voice context survives offer fallback to the next eligible worker.
- Touch targets are mobile-safe and forms/modals remain usable with the mobile keyboard.
- PWA manifest + service worker + install flow are added where valid.
- Offline app shell is safe and never falsely reports unsynced server actions as confirmed.
- Customer, Worker, Cooperative Admin and Federation Admin mobile experiences are manually QA-tested.
- No visible mobile control may be a dead button.

Treat the four files as one continuous master prompt.