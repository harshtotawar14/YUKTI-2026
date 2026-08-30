# SANPAID — VOICE REQUEST → WORKER DELIVERY ADDENDUM

This addendum is NON-NEGOTIABLE and must be applied together with `docs/final-research-grounded-frontend-master-prompt.md`.

## Problem found in the current frontend

The current booking flow accepts only text problem description. The current worker Job Offers view shows service, area and estimate, but does not carry a customer voice transcript, source language, structured fields, translated worker message or worker-side playback action. Therefore a customer voice request cannot actually reach the worker as a usable job request.

## Required end-to-end flow

CUSTOMER VOICE / TEXT
→ Browser Speech Recognition where supported
→ Transcript
→ Source Language
→ Structured Job Fields
→ Confidence Evaluation
→ Critical Field Confirmation
→ Booking Record
→ Matching / Eligibility / Ranking
→ Worker Offer Record
→ Worker Preferred Language
→ Safe Translation
→ Worker Job Card
→ Text + Listen Button
→ Worker Accept / Reject
→ Assignment

The request is not complete until the matched worker can actually SEE and, where speech synthesis is supported, HEAR the request.

## Customer booking UI

In the Problem Description step add:

- `Type Problem`
- `Record Voice`
- microphone start/stop state
- recording/listening indicator
- live/final transcript
- detected/selected language
- edit transcript
- retry voice
- use text fallback

Supported demo languages:

- English
- Hindi
- Marathi

Do not claim support for every language.

If `SpeechRecognition` / `webkitSpeechRecognition` is unavailable, show a useful fallback and keep manual text input working.

Do not break booking when microphone permission is denied.

## Voice request data model

Persist voice-derived request data with the booking. Example shape:

```js
booking.requestInput = {
  mode: 'VOICE', // VOICE | TEXT | IMAGE_ASSISTED
  sourceLanguage: 'mr-IN',
  transcript: 'Mala udya sakali plumber pahije. Kitchen sink leak hot aahe.',
  structured: {
    service: 'Plumber',
    dateText: 'Tomorrow',
    timeText: 'Morning',
    locationText: 'Karad Zone 1',
    problemSummary: 'Kitchen sink leakage',
    urgency: 'NORMAL'
  },
  confidence: {
    overall: 0.86,
    service: 0.94,
    date: 0.82,
    time: 0.88,
    problem: 0.91
  },
  confirmedByCustomer: true,
  createdAt: '<timestamp>'
};
```

Do not store only a temporary transcript variable that disappears after the modal closes.

## Critical field confirmation

Critical fields are:

- Service
- Location
- Date
- Time
- Urgency
- Price/estimate where spoken
- Special instruction

If confidence is low, DO NOT silently guess.

Show a confirmation card such as:

`We understood:`

- Service: Plumber
- Time: Tomorrow morning
- Area: Karad Zone 1
- Problem: Kitchen sink leakage

Actions:

- Confirm
- Edit
- Record Again

Only confirmed structured fields should be used for matching.

## Matching integration

Voice booking must use the SAME eligibility-first matching engine as typed bookings.

Never create a separate fake voice-matching path.

The booking generated from voice must proceed through:

Policy Validation
→ Eligibility Gate
→ Eligible Worker Pool
→ Explainable Ranking
→ Worker Offer

Unverified workers must remain excluded.

## Worker preferences

Add worker communication preferences to worker state:

```js
worker.preferredLanguage = 'hi-IN';
worker.voicePlaybackEnabled = true;
```

Allow worker to choose:

- English
- Hindi
- Marathi

The preference must persist.

## Worker offer record

The offer must carry a reference to the voice-derived booking request, not just `bookingId` and `workerId`.

Example:

```js
workerOffer = {
  id,
  bookingId,
  workerId,
  status: 'PENDING',
  preferredLanguage: worker.preferredLanguage,
  requestSummary: {
    sourceLanguage: booking.requestInput.sourceLanguage,
    originalTranscript: booking.requestInput.transcript,
    translatedText: '<worker language text>',
    service: booking.service,
    area: booking.area,
    schedule: booking.schedule,
    urgency: booking.urgent,
    estimatedEarnings: '<derived value>'
  },
  createdAt,
  expiresAt
};
```

## Worker Job Offers UI

Every voice-created offer must display:

- `Voice Request` badge
- Booking ID
- Service
- Customer area
- Approximate distance
- Schedule
- Urgency
- Estimated earnings
- Original language
- Original transcript
- Worker-language summary
- Translation confidence/status
- `Listen` button
- `Show Original` button
- `Accept`
- `Reject`

Do not expose unrelated private customer data.

## Worker Listen button

Use browser `speechSynthesis` when available.

When worker clicks `Listen`:

1. cancel any previous utterance;
2. create a new `SpeechSynthesisUtterance`;
3. use the worker-language translated summary;
4. set a matching language code where possible;
5. show `Playing…` state;
6. restore button state on end/error.

If speech synthesis is unavailable, keep readable translated text visible.

Do not make audio playback mandatory for accepting the job.

## Safe translation behaviour

For the frontend-only prototype, deterministic translation templates may be used for supported structured fields.

Do NOT pretend a production translation API is connected if it is not.

Example:

Customer Marathi:
`Mala udya sakali plumber pahije. Kitchen sink leak hot aahe.`

Worker Hindi summary:
`Aapko kal subah plumbing ki job request mili hai. Customer ke kitchen sink me leakage hai. Location Karad Zone 1 hai.`

Worker English summary:
`You have a plumbing request for tomorrow morning. The customer reports a leaking kitchen sink in Karad Zone 1.`

If translation fails:

- show original transcript;
- show `Translation unavailable — original text shown`;
- allow worker to Accept/Reject based on the available information;
- never lose the offer.

## Notifications

When a voice request is offered to a worker, create a worker-scoped notification:

`New voice service request: Electrician · Karad Zone 1 · Marathi → Hindi`

Do not create only a generic global notification.

Notification should reference:

- workerId
- bookingId
- offerId
- event type
- timestamp
- read status

Worker dashboard should filter notifications for the logged-in worker.

## Cross-role state synchronization

When customer submits a voice request:

Customer Dashboard
→ shows request created

Booking Record
→ contains transcript + structured fields

Matching
→ creates worker offer

Worker Dashboard
→ pending offer count increases

Worker Job Offers
→ voice request card appears

Worker Notification Center
→ new voice request notification appears

Worker accepts
→ offer becomes ACCEPTED
→ booking becomes ASSIGNED
→ customer sees assigned worker
→ admin sees assignment
→ audit log records worker acceptance

This entire chain must update without manual refresh where possible and must remain after refresh through persistent demo state.

## Do not send the request to the wrong worker

The Worker Job Offers view must filter by the logged-in worker ID.

A worker must see only offers where:

```js
offer.workerId === currentWorker.id
```

When the top-ranked worker rejects or times out:

- mark first offer REJECTED / EXPIRED;
- generate a NEW offer for the next eligible worker;
- carry the SAME voice request payload/reference forward;
- update customer state to `Finding another verified worker...`;
- notify only the newly offered worker.

Do not duplicate assignment.

## Worker-side voice acceptance flow

VOICE REQUEST RECEIVED
→ Listen / Read
→ Accept or Reject

ACCEPT
→ server/demo-state confirmation
→ booking assigned
→ customer notified

REJECT
→ optional reason
→ next eligible worker
→ voice request forwarded as a new worker offer

Worker choice remains mandatory.

## Low-connectivity behaviour

If worker is offline:

- cached voice transcript / translated text may remain readable;
- pending accept must show `PENDING SYNC`;
- do not show final `ACCEPTED` until state/server confirms;
- if speech audio cannot play, text remains usable.

## Audit events

Create events such as:

- VOICE_CAPTURE_STARTED
- VOICE_CAPTURE_COMPLETED
- VOICE_TRANSCRIPT_CONFIRMED
- VOICE_REQUEST_BOOKING_CREATED
- VOICE_REQUEST_OFFERED
- VOICE_REQUEST_PLAYED
- OFFER_ACCEPTED
- OFFER_REJECTED
- TRANSLATION_FALLBACK_USED

Do not log sensitive microphone/audio blobs unnecessarily.

## Required QA

Manually test all of these scenarios:

### Scenario A — Marathi customer → Hindi worker

Customer records:
`Mala udya sakali plumber pahije. Kitchen sink leak hot aahe.`

Expected:

- transcript appears;
- customer confirms structured fields;
- plumber booking is created;
- eligible plumber is ranked;
- correct worker receives offer;
- worker sees `Voice Request`;
- worker sees Hindi summary;
- Listen plays Hindi where browser supports it;
- Accept assigns booking;
- customer sees worker assignment.

### Scenario B — Worker rejects

- first worker rejects;
- next eligible worker gets the same voice-request context;
- rejected worker no longer sees it as pending;
- customer sees replacement search state.

### Scenario C — SpeechRecognition unsupported

- text entry remains available;
- booking can still complete;
- no JavaScript crash.

### Scenario D — SpeechSynthesis unsupported

- translated text remains visible;
- worker can still Accept/Reject;
- no JavaScript crash.

### Scenario E — Low confidence

- system asks customer to confirm critical fields;
- no offer is sent before confirmation.

### Scenario F — Refresh

- voice transcript survives refresh;
- worker offer survives refresh;
- worker notification survives refresh;
- accepted assignment survives refresh.

## Definition of done

This feature is NOT complete merely because a microphone button exists.

It is complete only when:

CUSTOMER SPEAKS
→ SYSTEM CAPTURES
→ CUSTOMER CONFIRMS
→ BOOKING STORES VOICE-DERIVED REQUEST
→ MATCHING SELECTS ELIGIBLE WORKER
→ OFFER REACHES THAT WORKER
→ WORKER CAN READ/LISTEN
→ WORKER ACCEPTS/REJECTS
→ ALL DASHBOARDS UPDATE

No dead microphone button.
No transcript that disappears.
No generic notification sent to everyone.
No worker offer missing the request context.
No fake translation claim.
No booking path that bypasses eligibility.
