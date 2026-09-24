(() => {
  'use strict';

  if (!window.SanPaidReviewRuntime?.enabled || !window.SanPaidSelectionDemo?.enabled) return;

  const previousFetch = window.fetch.bind(window);
  const LEGACY_STATE_KEY = 'sanpaid_sih_review_state_v1';
  const SHARED_STATE_KEY = 'sanpaid_sih_selection_shared_state_v2';
  const MODE = 'SELECTION_INTEGRITY_V1';
  let renderQueued = false;

  const clone = value => JSON.parse(JSON.stringify(value));
  const safeParse = (value, fallback = null) => {
    try { return JSON.parse(value) ?? fallback; }
    catch { return fallback; }
  };
  const nowIso = () => new Date().toISOString();
  const norm = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function readEnvelope() {
    try {
      const envelope = safeParse(localStorage.getItem(SHARED_STATE_KEY), null);
      return envelope?.state ? envelope : null;
    } catch { return null; }
  }

  function readState() {
    const envelope = readEnvelope();
    if (envelope?.state) return clone(envelope.state);
    try {
      const legacy = safeParse(sessionStorage.getItem(LEGACY_STATE_KEY), null);
      if (legacy?.booking) return clone(legacy);
    } catch {}
    try { return clone(window.SanPaidSelectionDemo.state?.() || null); }
    catch { return null; }
  }

  function ensureMeta(next) {
    if (!next || typeof next !== 'object') return null;
    if (!next.selectionMeta || typeof next.selectionMeta !== 'object') {
      next.selectionMeta = {
        version: 1,
        shortageSignals: [],
        serviceOutcomes: [],
        workerFeedback: [],
        crossCoopAssignments: [],
        onboarding: { workerId: 13, stage: 'COOPERATIVE_REVIEW', updatedAt: nowIso() }
      };
    }
    for (const key of ['shortageSignals', 'serviceOutcomes', 'workerFeedback', 'crossCoopAssignments']) {
      if (!Array.isArray(next.selectionMeta[key])) next.selectionMeta[key] = [];
    }
    if (!next.selectionMeta.onboarding) next.selectionMeta.onboarding = { workerId: 13, stage: 'COOPERATIVE_REVIEW', updatedAt: nowIso() };
    if (!Array.isArray(next.complaints)) next.complaints = [];
    if (!Array.isArray(next.trainingRecommendations)) next.trainingRecommendations = [];
    if (!Array.isArray(next.capacityRequests)) next.capacityRequests = [];
    if (!Array.isArray(next.capacityOffers)) next.capacityOffers = [];
    if (!Array.isArray(next.notifications)) next.notifications = [];
    if (!Array.isArray(next.timeline)) next.timeline = [];
    return next.selectionMeta;
  }

  function writeState(next, source = 'selection-integrity') {
    if (!next?.booking) return null;
    ensureMeta(next);
    next.revision = Number(next.revision || 0) + 1;
    const envelope = {
      version: 2,
      mode: 'SELECTION_DEMO_BACKEND',
      revision: next.revision,
      updatedAt: nowIso(),
      source,
      state: clone(next)
    };
    try { sessionStorage.setItem(LEGACY_STATE_KEY, JSON.stringify(next)); } catch {}
    try { localStorage.setItem(SHARED_STATE_KEY, JSON.stringify(envelope)); } catch {}
    const detail = { source, mode: MODE, at: Date.now(), revision: next.revision };
    try { window.dispatchEvent(new CustomEvent('sanpaid:selection-demo-sync', { detail })); } catch {}
    try { window.dispatchEvent(new CustomEvent('sanpaid:connected-sync', { detail })); } catch {}
    try { window.SanPaidCustomerWorkerDashboard?.requestRefresh?.({ detail }); } catch {}
    scheduleRender();
    return next;
  }

  function bookingHistorySync(next) {
    const booking = next.booking;
    if (!booking || !Array.isArray(next.history)) return;
    const found = next.history.find(item => Number(item.id) === Number(booking.id));
    if (found) Object.assign(found, clone(booking));
    else next.history.unshift(clone(booking));
  }

  function addTimeline(next, status, note) {
    const at = nowIso();
    next.timeline.push({ status, note, at });
    if (next.booking) next.booking.updatedAt = at;
  }

  function serviceWorkerCapacity(next, service) {
    return (next.workers || []).filter(worker =>
      worker.verificationStatus === 'VERIFIED' &&
      worker.availability === 'AVAILABLE' &&
      (worker.skills || []).some(skill => skill.service === service && skill.verified)
    ).length;
  }

  function derivePlanning(next) {
    ensureMeta(next);
    const meta = next.selectionMeta;
    const latestShortage = meta.shortageSignals.at(-1);
    const latestOutcome = meta.serviceOutcomes.at(-1);
    const service = latestShortage?.service || latestOutcome?.service || next.booking?.service || 'Electrician';
    const shortages = meta.shortageSignals.filter(item => item.service === service).length;
    const outcomes = meta.serviceOutcomes.filter(item => item.service === service).length;
    const verifiedSkillWorkers = serviceWorkerCapacity(next, service);
    const historicalDemand30d = 32 + outcomes;
    const expectedDemand = 36 + Math.min(4, outcomes) + shortages * 2;
    const eligibleCapacity = 30 + verifiedSkillWorkers + Math.min(2, meta.crossCoopAssignments.filter(item => item.service === service).length);
    const capacityGap = Math.max(0, expectedDemand - eligibleCapacity);
    const recommendedActions = capacityGap > 0
      ? ['CAPACITY_EXCHANGE', 'TRAINING_REVIEW', 'ONBOARDING_REVIEW']
      : ['MONITOR_DEMAND', 'MAINTAIN_LOCAL_CAPACITY'];
    return {
      ok: true,
      service,
      historicalDemand30d,
      expectedDemand,
      eligibleCapacity,
      capacityGap,
      confidence: shortages > 0 ? 'MEDIUM-HIGH' : 'MEDIUM',
      forecastMethod: 'Human-reviewed forecasting (pilot)',
      recommendedActions,
      evidence: {
        shortageSignals: shortages,
        completedServiceOutcomes: outcomes,
        verifiedSkillWorkers,
        source: 'Shared selection journey ledger'
      }
    };
  }

  function ensureTrainingRecommendation(next, signal) {
    const service = signal.service || next.booking?.service || 'Service';
    const existing = next.trainingRecommendations.find(item => item.selectionSignalId === signal.id);
    if (existing) return existing;
    const recommendation = {
      worker: 'Cooperative workforce pool',
      service,
      trainingName: `${service} capacity readiness`,
      reason: `Local shortage recorded from ${signal.bookingCode || 'the current booking'}; review training, onboarding and nearby capacity before scaling.`,
      status: 'HUMAN_REVIEW_REQUIRED',
      selectionSignalId: signal.id,
      createdAt: nowIso()
    };
    next.trainingRecommendations.unshift(recommendation);
    return recommendation;
  }

  function ensureShortageCapacity(next) {
    if (String(next.booking?.status || '').toUpperCase() !== 'NO_WORKER_AVAILABLE') return false;
    ensureMeta(next);
    const bookingId = Number(next.booking.id || 0);
    let request = next.capacityRequests.find(item => Number(item.bookingId || 0) === bookingId && item.trigger === 'LOCAL_CAPACITY_EXHAUSTED');
    if (request) return false;

    const id = Number(next.nextCapacityId || 1);
    next.nextCapacityId = id + 1;
    request = {
      id,
      requestCode: `CAP-2026-${String(id).padStart(3, '0')}`,
      bookingId,
      bookingCode: next.booking.bookingCode,
      service: next.booking.service,
      zone: next.booking.zone || 'Kolhapur',
      workersRequired: 1,
      requestingCooperative: 'YUKTI Kolhapur Services Cooperative',
      providingCooperative: null,
      status: 'REQUESTED',
      offeredWorkers: 0,
      acceptedWorkers: 0,
      approvedAssignments: 0,
      requestedAt: nowIso(),
      trigger: 'LOCAL_CAPACITY_EXHAUSTED',
      complaintOwnership: 'Home Cooperative: YUKTI Kolhapur Services Cooperative'
    };
    next.capacityRequests.unshift(request);
    const signal = {
      id: `SHORTAGE-${bookingId}-${Date.now()}`,
      bookingId,
      bookingCode: next.booking.bookingCode,
      service: next.booking.service,
      zone: next.booking.zone || 'Kolhapur',
      reason: 'All current local eligible offers exhausted',
      at: nowIso()
    };
    next.selectionMeta.shortageSignals.push(signal);
    ensureTrainingRecommendation(next, signal);
    next.booking.capacityExchange = {
      requestId: id,
      requestCode: request.requestCode,
      status: 'REQUESTED',
      localFirst: true,
      customerChoiceRequired: true,
      workerConsentRequired: true,
      authorizationRequired: true
    };
    next.notifications.unshift({
      id: Date.now(),
      title: 'Nearby cooperative capacity requested',
      message: 'Local eligible capacity is currently unavailable. The same booking is being kept open while governed nearby capacity is checked.',
      priority: 'NORMAL',
      createdAt: nowIso()
    });
    addTimeline(next, 'CAPACITY_EXCHANGE_REQUESTED', 'Local eligible capacity was exhausted. The same booking opened a governed nearby-cooperative capacity request.');
    bookingHistorySync(next);
    return true;
  }

  function syncProviderOffer(next, requestId) {
    const request = next.capacityRequests.find(item => Number(item.id) === Number(requestId));
    if (!request) return false;
    if (Number(request.bookingId || 0) === Number(next.booking?.id || 0) && next.booking?.capacityExchange) {
      next.booking.capacityExchange.status = request.status;
      next.booking.capacityExchange.providingCooperative = request.providingCooperative || null;
    }
    const newestOffer = [...next.capacityOffers].reverse().find(item => Number(item.requestId) === Number(requestId));
    if (newestOffer && request.providingCooperative === 'YUKTI Panhala Worker Cooperative') newestOffer.workerPersona = 'WORKER_B';
    bookingHistorySync(next);
    return true;
  }

  function syncWorkerConsent(next, requestId) {
    const request = next.capacityRequests.find(item => Number(item.id) === Number(requestId));
    if (!request) return false;
    if (Number(request.bookingId || 0) === Number(next.booking?.id || 0) && next.booking?.capacityExchange) {
      next.booking.capacityExchange.status = request.status;
      next.booking.capacityExchange.workerConsentRecorded = Number(request.acceptedWorkers || 0) > 0;
      addTimeline(next, 'CROSS_COOP_WORKER_CONSENT', 'A nearby cooperative worker voluntarily accepted the capacity offer. Federation authorization is still required.');
      bookingHistorySync(next);
    }
    return true;
  }

  function authorizeCrossCoopBooking(next, requestId) {
    const request = next.capacityRequests.find(item => Number(item.id) === Number(requestId));
    if (!request || Number(request.bookingId || 0) !== Number(next.booking?.id || 0)) return false;
    const acceptedOffer = next.capacityOffers.find(item => Number(item.requestId) === Number(requestId) && item.offerStatus === 'ACCEPTED');
    const persona = acceptedOffer?.workerPersona || 'WORKER_B';
    const worker = (next.workers || []).find(item => item.persona === persona) || next.workers?.[1] || next.workers?.[0];
    if (!worker) return false;
    const assignmentId = `XCOOP-${String(next.booking.id).padStart(6, '0')}`;
    next.booking.workerId = worker.id;
    next.booking.workerName = worker.name;
    next.booking.workerVerification = 'VERIFIED';
    next.booking.distance = persona === 'WORKER_B' ? 6.4 : 3.2;
    next.booking.cooperative = request.providingCooperative || 'YUKTI Panhala Worker Cooperative';
    next.booking.crossCoop = true;
    next.booking.assignmentId = assignmentId;
    next.booking.status = 'ACCEPTED';
    next.booking.capacityExchange = {
      ...(next.booking.capacityExchange || {}),
      requestId: request.id,
      requestCode: request.requestCode,
      status: 'APPROVED',
      assignmentId,
      homeCooperative: request.requestingCooperative,
      servingCooperative: request.providingCooperative,
      workerConsentRecorded: true,
      authorized: true,
      complaintOwnership: 'Home Cooperative first · Federation escalation for cross-cooperative disputes'
    };
    next.selectionMeta.crossCoopAssignments.push({
      assignmentId,
      bookingId: next.booking.id,
      bookingCode: next.booking.bookingCode,
      service: next.booking.service,
      workerId: worker.id,
      workerName: worker.name,
      homeCooperative: request.requestingCooperative,
      servingCooperative: request.providingCooperative,
      authorizedAt: nowIso()
    });
    next.notifications.unshift({
      id: Date.now(),
      title: 'Nearby cooperative worker authorized',
      message: `${worker.name} accepted and the cross-cooperative assignment was authorized. Your original booking continues.`,
      priority: 'NORMAL',
      createdAt: nowIso()
    });
    addTimeline(next, 'CROSS_COOP_AUTHORIZED', `Worker consent + federation authorization recorded. Assignment ${assignmentId} continues the original booking.`);
    bookingHistorySync(next);
    return true;
  }

  function syncSupportToComplaint(next, request) {
    if (!request?.id) return false;
    if (next.complaints.some(item => Number(item.supportRequestId || 0) === Number(request.id))) return false;
    const crossCoop = Boolean(next.booking?.crossCoop);
    const id = Math.max(72, ...next.complaints.map(item => Number(item.id || 0) + 1));
    const complaint = {
      id,
      supportRequestId: request.id,
      ticketNumber: `CMP-2026-${String(id).padStart(3, '0')}`,
      bookingId: request.bookingId || next.booking?.id || null,
      bookingCode: next.booking?.bookingCode || null,
      category: request.category || 'Service Support',
      description: request.description || '',
      status: 'OPEN',
      escalationLevel: crossCoop ? 2 : 1,
      slaBreached: false,
      slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      owner: crossCoop ? 'YUKTI Kolhapur Services Cooperative · Federation escalation available' : 'YUKTI Kolhapur Services Cooperative',
      createdAt: request.createdAt || nowIso()
    };
    next.complaints.unshift(complaint);
    return true;
  }

  function syncPaymentOutcome(next) {
    if (!next.payment || !next.booking?.id) return false;
    ensureMeta(next);
    if (next.selectionMeta.serviceOutcomes.some(item => Number(item.bookingId) === Number(next.booking.id))) return false;
    const worker = (next.workers || []).find(item => Number(item.id) === Number(next.booking.workerId));
    if (worker) worker.jobsCompleted = Number(worker.jobsCompleted || 0) + 1;
    next.selectionMeta.serviceOutcomes.push({
      bookingId: next.booking.id,
      bookingCode: next.booking.bookingCode,
      service: next.booking.service,
      zone: next.booking.zone,
      crossCoop: Boolean(next.booking.crossCoop),
      amount: Number(next.payment.amount || 0),
      completedAt: next.payment.createdAt || nowIso()
    });
    return true;
  }

  function syncRating(next) {
    if (!next.rating || !next.booking?.workerId) return false;
    ensureMeta(next);
    if (next.selectionMeta.workerFeedback.some(item => Number(item.bookingId) === Number(next.booking.id))) return false;
    const worker = (next.workers || []).find(item => Number(item.id) === Number(next.booking.workerId));
    const feedback = {
      bookingId: next.booking.id,
      bookingCode: next.booking.bookingCode,
      workerId: next.booking.workerId,
      workerName: next.booking.workerName,
      stars: Number(next.rating.stars || 5),
      feedback: String(next.rating.feedback || ''),
      createdAt: next.rating.createdAt || nowIso()
    };
    next.selectionMeta.workerFeedback.unshift(feedback);
    if (worker) {
      const completed = Math.max(1, Number(worker.jobsCompleted || 1));
      const previousCount = Math.max(0, completed - 1);
      worker.rating = Number((((Number(worker.rating || 0) * previousCount) + feedback.stars) / Math.max(1, completed)).toFixed(1));
    }
    return true;
  }

  function syncOnboarding(next, workerId) {
    ensureMeta(next);
    const worker = (next.workers || []).find(item => Number(item.id) === Number(workerId));
    if (!worker) return false;
    next.selectionMeta.onboarding = {
      workerId: worker.id,
      workerName: worker.name,
      stage: worker.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'COOPERATIVE_REVIEW',
      steps: ['PROFILE_CREATED', 'DOCUMENTS_SUBMITTED', 'SKILL_CHECK_RECORDED', worker.verificationStatus === 'VERIFIED' ? 'COOPERATIVE_VERIFIED' : 'COOPERATIVE_REVIEW'],
      updatedAt: nowIso()
    };
    return true;
  }

  function requestUrl(input) {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url || '';
    try { return new URL(raw, location.href); }
    catch { return null; }
  }

  function requestMethod(input, options = {}) {
    return String(options.method || input?.method || 'GET').toUpperCase();
  }

  function requestPayload(options = {}) {
    if (!options.body || typeof options.body !== 'string') return {};
    return safeParse(options.body, {}) || {};
  }

  function jsonResponse(data, original) {
    const headers = new Headers(original?.headers || {});
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'no-store');
    headers.set('X-SanPaid-Selection-Integrity', 'shared-ledger');
    return new Response(JSON.stringify(data), { status: original?.status || 200, statusText: original?.statusText || 'OK', headers });
  }

  function patchOverview(data, next) {
    ensureMeta(next);
    const meta = next.selectionMeta;
    const verified = (next.workers || []).filter(worker => worker.verificationStatus === 'VERIFIED').length;
    const available = (next.workers || []).filter(worker => worker.availability === 'AVAILABLE').length;
    const openComplaints = next.complaints.filter(item => item.status !== 'RESOLVED').length;
    const approvedAssignments = next.capacityRequests.filter(item => item.status === 'APPROVED').reduce((sum, item) => sum + Number(item.approvedAssignments || 0), 0);
    const unfulfilled = next.capacityRequests.filter(item => item.status !== 'APPROVED').length;
    return {
      ...data,
      metrics: {
        ...(data.metrics || {}),
        totalWorkers: next.workers.length,
        verifiedWorkers: verified,
        availableWorkers: available,
        activeBookings: ['PAID', 'CLOSED', 'CANCELLED'].includes(String(next.booking?.status || '')) ? 0 : 1,
        openComplaints,
        slaBreached: next.complaints.filter(item => item.slaBreached).length,
        pendingVerification: next.workers.filter(item => item.verificationStatus !== 'VERIFIED').length,
        recordedPayments: next.payment ? 1 : 0,
        capacityRequests: unfulfilled,
        connectedCooperatives: Array.isArray(data.cooperatives) ? data.cooperatives.length : 3,
        crossCoopAssignments: approvedAssignments,
        shortageSignals: meta.shortageSignals.length,
        escalatedComplaints: next.complaints.filter(item => item.status !== 'RESOLVED' && Number(item.escalationLevel || 0) > 1).length,
        recordedSettlements: next.payment && next.booking?.crossCoop ? 1 : 0
      },
      capacityRequests: clone(next.capacityRequests),
      complaints: clone(next.complaints)
    };
  }

  function patchWorkspace(data, next) {
    const overview = patchOverview({ metrics: data.metrics || {}, cooperatives: [] }, next);
    return {
      ...data,
      metrics: { ...(data.metrics || {}), ...overview.metrics, capacityRequests: next.capacityRequests.length },
      complaints: clone(next.complaints),
      capacityRequests: clone(next.capacityRequests).map(item => ({ ...item, role: item.requestingCooperative === 'YUKTI Kolhapur Services Cooperative' ? 'REQUESTING' : 'PROVIDING' })),
      trainingRecommendations: clone(next.trainingRecommendations),
      onboarding: clone(next.selectionMeta.onboarding),
      selectionEvidence: {
        shortageSignals: next.selectionMeta.shortageSignals.length,
        completedOutcomes: next.selectionMeta.serviceOutcomes.length,
        crossCoopAssignments: next.selectionMeta.crossCoopAssignments.length
      }
    };
  }

  function patchWorkerDashboard(data, next) {
    const workerId = Number(data?.profile?.id || 0);
    const feedback = next.selectionMeta.workerFeedback.filter(item => Number(item.workerId) === workerId).slice(0, 3);
    return { ...data, recentFeedback: clone(feedback), profile: { ...(data.profile || {}), rating: (next.workers || []).find(item => Number(item.id) === workerId)?.rating ?? data?.profile?.rating } };
  }

  async function integrityFetch(input, options = {}) {
    const url = requestUrl(input);
    if (!url || url.origin !== location.origin || !url.pathname.startsWith('/api/')) return previousFetch(input, options);
    const method = requestMethod(input, options);
    const payload = requestPayload(options);
    const response = await previousFetch(input, options);
    if (!response.ok) return response;

    const path = url.pathname;
    let responseData = null;
    if (method !== 'GET' || ['/api/connected/judge/planning', '/api/connected/judge/overview', '/api/cooperative-admin/workspace', '/api/connected/worker/dashboard'].includes(path)) {
      responseData = await response.clone().json().catch(() => null);
    }

    if (method === 'POST') {
      const next = readState();
      if (next?.booking) {
        ensureMeta(next);
        let changed = false;

        if (path === '/api/connected/customer/support') changed = syncSupportToComplaint(next, responseData?.request) || changed;
        if (/^\/api\/connected\/customer\/bookings\/\d+\/pay$/.test(path)) changed = syncPaymentOutcome(next) || changed;
        if (/^\/api\/connected\/customer\/bookings\/\d+\/rating$/.test(path)) changed = syncRating(next) || changed;

        let match = path.match(/^\/api\/connected\/worker\/offers\/(\d+)\/respond$/);
        if (match) changed = ensureShortageCapacity(next) || changed;

        match = path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/offer-provider$/);
        if (match) changed = syncProviderOffer(next, Number(match[1])) || changed;

        match = path.match(/^\/api\/connected\/worker\/capacity-offers\/(\d+)\/respond$/);
        if (match) {
          const offer = next.capacityOffers.find(item => Number(item.offerId) === Number(match[1]));
          if (offer) changed = syncWorkerConsent(next, offer.requestId) || changed;
        }

        match = path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/approve$/);
        if (match) changed = authorizeCrossCoopBooking(next, Number(match[1])) || changed;

        match = path.match(/^\/api\/cooperative-admin\/workers\/(\d+)\/verification$/);
        if (match) changed = syncOnboarding(next, Number(match[1])) || changed;

        if (changed) writeState(next, `POST ${path}`);
      }
      return response;
    }

    const next = readState();
    if (!next?.booking) return response;
    ensureMeta(next);

    if (path === '/api/connected/judge/planning') return jsonResponse(derivePlanning(next), response);
    if (path === '/api/connected/judge/overview' && responseData) return jsonResponse(patchOverview(responseData, next), response);
    if (path === '/api/cooperative-admin/workspace' && responseData) return jsonResponse(patchWorkspace(responseData, next), response);
    if (path === '/api/connected/worker/dashboard' && responseData) return jsonResponse(patchWorkerDashboard(responseData, next), response);
    return response;
  }

  function setAdminCard(label, value) {
    const root = document.getElementById('adminFinalApp');
    if (!root) return;
    const wanted = norm(label);
    for (const card of root.querySelectorAll('article,button,.admin-attention-card')) {
      const labelNode = card.querySelector('span');
      if (norm(labelNode?.textContent) !== wanted) continue;
      const valueNode = card.querySelector('strong,b');
      if (valueNode) valueNode.textContent = String(value);
    }
  }

  function currentAdminRole() {
    const auth = String(window.SanPaidAuth?.getRole?.() || '').toUpperCase();
    if (auth) return auth;
    const shell = document.getElementById('sihJudgeShell');
    if (shell?.classList.contains('federation-govtech')) return 'FEDERATION_ADMIN';
    if (shell?.classList.contains('cooperative-govtech')) return 'COOPERATIVE_ADMIN';
    return '';
  }

  function renderAdminConsistency(next) {
    const root = document.getElementById('adminFinalApp');
    if (!root) return;
    const role = currentAdminRole();
    const verified = next.workers.filter(worker => worker.verificationStatus === 'VERIFIED').length;
    const available = next.workers.filter(worker => worker.availability === 'AVAILABLE').length;
    const openComplaints = next.complaints.filter(item => item.status !== 'RESOLVED').length;
    const pending = next.workers.filter(worker => worker.verificationStatus !== 'VERIFIED').length;
    const unfulfilled = next.capacityRequests.filter(item => item.status !== 'APPROVED').length;
    const assignments = next.capacityRequests.filter(item => item.status === 'APPROVED').reduce((sum, item) => sum + Number(item.approvedAssignments || 0), 0);
    const escalated = next.complaints.filter(item => item.status !== 'RESOLVED' && Number(item.escalationLevel || 0) > 1).length;

    if (role === 'COOPERATIVE_ADMIN') {
      setAdminCard('Verification Attention', pending);
      setAdminCard('Open Complaints', openComplaints);
      setAdminCard('SLA Breaches', next.complaints.filter(item => item.slaBreached).length);
      setAdminCard('Capacity Requests', unfulfilled);
      setAdminCard('Total Workers', next.workers.length);
      setAdminCard('Verified Workers', verified);
      setAdminCard('Available Workers', available);
      setAdminCard('Active Services', ['PAID', 'CLOSED', 'CANCELLED'].includes(String(next.booking.status)) ? 0 : 1);
      setAdminCard('Recorded Payments', next.payment ? 1 : 0);
    } else if (role === 'FEDERATION_ADMIN') {
      setAdminCard('Connected Cooperatives', 3);
      setAdminCard('Cross-Coop Assignments', assignments);
      setAdminCard('Escalated Complaints', escalated);
      setAdminCard('Repeated Shortage Signals', next.selectionMeta.shortageSignals.length);
      setAdminCard('Verified Workers', verified);
      setAdminCard('Active Cross-Coop Jobs', assignments);
      setAdminCard('Open Escalations', escalated);
      setAdminCard('Unfulfilled Requests', unfulfilled);
      setAdminCard('Recorded Settlements', next.payment && next.booking.crossCoop ? 1 : 0);
    }
  }

  function renderCapacityBanner(next) {
    const host = document.getElementById('connectedCustomerState');
    if (!host) return;
    let banner = document.getElementById('selectionCapacityBanner');
    const exchange = next.booking?.capacityExchange;
    if (!exchange) { banner?.remove(); return; }
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'selectionCapacityBanner';
      banner.className = 'selection-integrity-banner';
      host.prepend(banner);
    }
    const approved = exchange.status === 'APPROVED';
    banner.innerHTML = approved
      ? `<b>Nearby cooperative assignment authorized</b><span>${exchange.assignmentId || 'Cross-cooperative assignment'} · Worker consent recorded · Original booking continues.</span>`
      : `<b>Local capacity shortage detected</b><span>${exchange.requestCode || 'Capacity request'} · Nearby cooperative capacity is being checked with worker consent and authorization controls.</span>`;
  }

  function renderWorkerFeedback(next) {
    const content = document.querySelector('#connectedContent[data-connected-role="WORKER"]');
    if (!content) return;
    const user = window.SanPaidAuth?.getCurrentUser?.() || {};
    const worker = next.workers.find(item => item.persona === user.persona || String(item.name) === String(user.fullName || user.name));
    const feedback = next.selectionMeta.workerFeedback.find(item => Number(item.workerId) === Number(worker?.id));
    let card = document.getElementById('selectionWorkerFeedback');
    if (!feedback) { card?.remove(); return; }
    const host = content.querySelector('.cw-dashboard.worker [data-cw-view="overview"]') || content.querySelector('.cw-dashboard.worker');
    if (!host) return;
    if (!card) {
      card = document.createElement('section');
      card.id = 'selectionWorkerFeedback';
      card.className = 'selection-integrity-card';
      host.appendChild(card);
    }
    card.innerHTML = `<span>CUSTOMER FEEDBACK</span><b>${'★'.repeat(Math.max(1, Math.min(5, Number(feedback.stars || 5))))} ${Number(feedback.stars || 5)}/5</b><p>${feedback.feedback ? String(feedback.feedback).replace(/[<>]/g, '') : 'Service completed successfully.'}</p><small>${feedback.bookingCode || ''} · Visible to the assigned worker</small>`;
  }

  function renderOnboarding(next) {
    const role = currentAdminRole();
    const root = document.getElementById('adminFinalApp');
    let strip = document.getElementById('selectionOnboardingProof');
    if (role !== 'COOPERATIVE_ADMIN' || !root) { strip?.remove(); return; }
    const onboarding = next.selectionMeta.onboarding;
    const worker = next.workers.find(item => Number(item.id) === Number(onboarding?.workerId));
    if (!worker) return;
    if (!strip) {
      strip = document.createElement('section');
      strip.id = 'selectionOnboardingProof';
      strip.className = 'selection-integrity-card selection-onboarding';
      const dashboard = root.querySelector('.af-dashboard');
      dashboard?.insertBefore(strip, dashboard.children[1] || null);
    }
    const verified = worker.verificationStatus === 'VERIFIED';
    strip.innerHTML = `<span>WORKER ONBOARDING PROOF</span><b>${worker.name} · ${verified ? 'Verified' : 'Cooperative review'}</b><p>Profile Created → Documents Submitted → Skill Check → Cooperative Review${verified ? ' → Verified Worker' : ''}</p>`;
  }

  function renderSelectorTruth() {
    const shell = document.getElementById('selectorModeShell');
    if (!shell) return;
    const top = shell.querySelector('.selector-top-actions');
    if (top && !document.getElementById('selectionFreshReview')) {
      const button = document.createElement('button');
      button.id = 'selectionFreshReview';
      button.type = 'button';
      button.className = 'selection-fresh-review';
      button.textContent = '↻ Start Fresh Review';
      button.addEventListener('click', () => {
        window.SanPaidSelectionDemo?.reset?.();
        const notice = document.getElementById('selectorNotice');
        if (notice) {
          notice.textContent = 'Fresh shared review journey restored across role tabs.';
          notice.classList.remove('hidden');
          setTimeout(() => notice.classList.add('hidden'), 3200);
        }
        scheduleRender();
      });
      top.insertBefore(button, top.querySelector('#selectorClose') || null);
    }

    const content = shell.querySelector('#selectorContent');
    if (!content) return;
    for (const node of content.querySelectorAll('b,h1,p,span,small')) {
      const text = node.textContent.trim();
      if (text === 'Karad Cooperative') node.textContent = 'YUKTI Kolhapur Services Cooperative';
      else if (text === 'Satara Approval') node.textContent = 'YUKTI Panhala Worker Cooperative';
      else if (text === 'AI advises. Cooperative decides.') node.textContent = 'Human-reviewed forecasting. Cooperative decides.';
      else if (text === 'AI can recommend. It cannot automatically certify a worker.') node.textContent = 'Pilot forecasting can recommend. Cooperative approval remains required.';
    }
  }

  function injectStyles() {
    if (document.getElementById('selectionIntegrityStyles')) return;
    const style = document.createElement('style');
    style.id = 'selectionIntegrityStyles';
    style.textContent = `
      .selection-fresh-review{border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:10px;padding:8px 12px;font:700 12px/1.2 inherit;cursor:pointer;white-space:nowrap}
      .selection-fresh-review:hover{background:#f8fafc}
      .selection-integrity-banner,.selection-integrity-card{border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:14px 16px;margin:0 0 14px;display:grid;gap:5px;color:#0f172a}
      .selection-integrity-banner b,.selection-integrity-card b{font-size:14px}.selection-integrity-banner span,.selection-integrity-card p,.selection-integrity-card small{margin:0;color:#475569;font-size:12px;line-height:1.45}
      .selection-integrity-card>span{font-size:10px;font-weight:800;letter-spacing:.09em;color:#0369a1}
      .selection-onboarding{margin:14px 20px 0;background:#f8fafc;border-color:#e2e8f0}
      @media(max-width:720px){.selection-fresh-review{padding:7px 9px;font-size:11px}.selection-onboarding{margin:10px 12px 0}}
    `;
    document.head.appendChild(style);
  }

  function renderIntegrity() {
    renderQueued = false;
    injectStyles();
    const next = readState();
    if (!next?.booking) return;
    ensureMeta(next);
    renderAdminConsistency(next);
    renderCapacityBanner(next);
    renderWorkerFeedback(next);
    renderOnboarding(next);
    renderSelectorTruth();
  }

  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(renderIntegrity);
  }

  window.fetch = integrityFetch;
  window.addEventListener('sanpaid:selection-demo-sync', scheduleRender);
  window.addEventListener('sanpaid:connected-sync', scheduleRender);
  window.addEventListener('storage', event => { if (event.key === SHARED_STATE_KEY) scheduleRender(); });
  window.addEventListener('focus', scheduleRender);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRender(); });
  new MutationObserver(scheduleRender).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'data-connected-role'] });

  const seed = readState();
  if (seed?.booking) {
    const before = JSON.stringify(seed.selectionMeta || null);
    ensureMeta(seed);
    if (JSON.stringify(seed.selectionMeta) !== before) writeState(seed, 'selection-integrity-initialized');
  }
  scheduleRender();
  document.documentElement.dataset.selectionIntegrity = 'closed-loop-v1';
})();