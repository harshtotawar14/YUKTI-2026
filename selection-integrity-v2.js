(() => {
  'use strict';

  if (!window.SanPaidReviewRuntime?.enabled || !window.SanPaidSelectionDemo?.enabled) return;

  const baseFetch = window.fetch.bind(window);
  const STATE_KEY = 'sanpaid_sih_review_state_v1';
  const SHARED_KEY = 'sanpaid_sih_selection_shared_state_v2';
  let queued = false;

  const clone = v => JSON.parse(JSON.stringify(v));
  const parse = (v, fallback = null) => { try { return JSON.parse(v) ?? fallback; } catch { return fallback; } };
  const iso = () => new Date().toISOString();
  const norm = v => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function readState() {
    try {
      const env = parse(localStorage.getItem(SHARED_KEY), null);
      if (env?.state?.booking) return clone(env.state);
    } catch {}
    try {
      const state = parse(sessionStorage.getItem(STATE_KEY), null);
      if (state?.booking) return clone(state);
    } catch {}
    try { return clone(window.SanPaidSelectionDemo.state?.() || null); } catch { return null; }
  }

  function meta(state) {
    if (!state.selectionMeta || typeof state.selectionMeta !== 'object') state.selectionMeta = {};
    const m = state.selectionMeta;
    for (const key of ['shortageSignals','serviceOutcomes','workerFeedback','crossCoopAssignments']) if (!Array.isArray(m[key])) m[key] = [];
    if (!m.onboarding) m.onboarding = { workerId: 13, stage: 'COOPERATIVE_REVIEW', updatedAt: iso() };
    for (const key of ['complaints','capacityRequests','capacityOffers','notifications','timeline','trainingRecommendations','history','workers']) if (!Array.isArray(state[key])) state[key] = [];
    m.version = 2;
    return m;
  }

  function write(state, source) {
    if (!state?.booking) return;
    meta(state);
    state.revision = Number(state.revision || 0) + 1;
    const env = { version: 2, mode: 'SELECTION_DEMO_BACKEND', revision: state.revision, updatedAt: iso(), source, state: clone(state) };
    try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
    try { localStorage.setItem(SHARED_KEY, JSON.stringify(env)); } catch {}
    const detail = { source, mode: 'SELECTION_INTEGRITY_V2', at: Date.now(), revision: state.revision };
    try { window.dispatchEvent(new CustomEvent('sanpaid:selection-demo-sync', { detail })); } catch {}
    try { window.dispatchEvent(new CustomEvent('sanpaid:connected-sync', { detail })); } catch {}
    try { window.SanPaidCustomerWorkerDashboard?.requestRefresh?.({ detail }); } catch {}
    schedule();
  }

  function syncHistory(state) {
    const existing = state.history.find(x => Number(x.id) === Number(state.booking.id));
    if (existing) Object.assign(existing, clone(state.booking)); else state.history.unshift(clone(state.booking));
  }

  function timeline(state, status, note) {
    const at = iso();
    state.timeline.push({ status, note, at });
    state.booking.updatedAt = at;
    syncHistory(state);
  }

  function workerCapacity(state, service) {
    return state.workers.filter(w => w.verificationStatus === 'VERIFIED' && w.availability === 'AVAILABLE' && (w.skills || []).some(s => s.service === service && s.verified)).length;
  }

  function planning(state) {
    const m = meta(state);
    const latest = m.shortageSignals.at(-1) || m.serviceOutcomes.at(-1) || {};
    const service = latest.service || state.booking.service || 'Electrician';
    const shortages = m.shortageSignals.filter(x => x.service === service).length;
    const outcomes = m.serviceOutcomes.filter(x => x.service === service).length;
    const skillWorkers = workerCapacity(state, service);
    const historicalDemand30d = 32 + outcomes;
    const expectedDemand = 36 + Math.min(4, outcomes) + shortages * 2;
    const eligibleCapacity = 30 + skillWorkers + Math.min(2, m.crossCoopAssignments.filter(x => x.service === service).length);
    const capacityGap = Math.max(0, expectedDemand - eligibleCapacity);
    return {
      ok: true, service, historicalDemand30d, expectedDemand, eligibleCapacity, capacityGap,
      confidence: shortages ? 'MEDIUM-HIGH' : 'MEDIUM',
      forecastMethod: 'Human-reviewed forecasting (pilot)',
      recommendedActions: capacityGap ? ['CAPACITY_EXCHANGE','TRAINING_REVIEW','ONBOARDING_REVIEW'] : ['MONITOR_DEMAND','MAINTAIN_LOCAL_CAPACITY'],
      evidence: { shortageSignals: shortages, completedServiceOutcomes: outcomes, verifiedSkillWorkers: skillWorkers, source: 'Shared selection journey ledger' }
    };
  }

  function trainingFromShortage(state, signal) {
    if (state.trainingRecommendations.some(x => x.selectionSignalId === signal.id)) return;
    state.trainingRecommendations.unshift({
      worker: 'Cooperative workforce pool', service: signal.service,
      trainingName: `${signal.service} capacity readiness`,
      reason: `Recorded local shortage from ${signal.bookingCode}; cooperative review can choose training, onboarding or nearby capacity.`,
      status: 'HUMAN_REVIEW_REQUIRED', selectionSignalId: signal.id, createdAt: iso()
    });
  }

  function closeShortageLoop(state) {
    if (String(state.booking.status).toUpperCase() !== 'NO_WORKER_AVAILABLE') return false;
    const m = meta(state), bookingId = Number(state.booking.id);
    if (state.capacityRequests.some(x => Number(x.bookingId) === bookingId && x.trigger === 'LOCAL_CAPACITY_EXHAUSTED')) return false;
    const id = Number(state.nextCapacityId || 1); state.nextCapacityId = id + 1;
    const request = {
      id, requestCode: `CAP-2026-${String(id).padStart(3,'0')}`, bookingId, bookingCode: state.booking.bookingCode,
      service: state.booking.service, zone: state.booking.zone || 'Kolhapur', workersRequired: 1,
      requestingCooperative: 'YUKTI Kolhapur Services Cooperative', providingCooperative: null,
      status: 'REQUESTED', offeredWorkers: 0, acceptedWorkers: 0, approvedAssignments: 0,
      requestedAt: iso(), trigger: 'LOCAL_CAPACITY_EXHAUSTED', complaintOwnership: 'Home Cooperative: YUKTI Kolhapur Services Cooperative'
    };
    state.capacityRequests.unshift(request);
    const signal = { id: `SHORTAGE-${bookingId}-${Date.now()}`, bookingId, bookingCode: state.booking.bookingCode, service: state.booking.service, zone: state.booking.zone || 'Kolhapur', reason: 'All current local eligible offers exhausted', at: iso() };
    m.shortageSignals.push(signal); trainingFromShortage(state, signal);
    state.booking.capacityExchange = { requestId: id, requestCode: request.requestCode, status: 'REQUESTED', localFirst: true, customerChoiceRequired: true, workerConsentRequired: true, authorizationRequired: true };
    state.notifications.unshift({ id: Date.now(), title: 'Nearby cooperative capacity requested', message: 'Local eligible capacity is unavailable. The same booking remains open while governed nearby capacity is checked.', priority: 'NORMAL', createdAt: iso() });
    timeline(state, 'CAPACITY_EXCHANGE_REQUESTED', 'Local eligible capacity was exhausted. The same booking opened a governed nearby-cooperative capacity request.');
    return true;
  }

  function providerLinked(state, requestId) {
    const req = state.capacityRequests.find(x => Number(x.id) === Number(requestId));
    if (!req) return false;
    if (Number(req.bookingId) === Number(state.booking.id) && state.booking.capacityExchange) {
      state.booking.capacityExchange.status = req.status;
      state.booking.capacityExchange.providingCooperative = req.providingCooperative;
    }
    const offer = [...state.capacityOffers].reverse().find(x => Number(x.requestId) === Number(requestId));
    if (offer && req.providingCooperative === 'YUKTI Panhala Worker Cooperative') offer.workerPersona = 'WORKER_B';
    syncHistory(state); return true;
  }

  function consentLinked(state, requestId) {
    const req = state.capacityRequests.find(x => Number(x.id) === Number(requestId));
    if (!req) return false;
    if (Number(req.bookingId) === Number(state.booking.id) && state.booking.capacityExchange) {
      state.booking.capacityExchange.status = req.status;
      state.booking.capacityExchange.workerConsentRecorded = Number(req.acceptedWorkers || 0) > 0;
      timeline(state, 'CROSS_COOP_WORKER_CONSENT', 'Nearby cooperative worker consent recorded. Federation authorization is still required.');
    }
    return true;
  }

  function authorizeLinked(state, requestId) {
    const req = state.capacityRequests.find(x => Number(x.id) === Number(requestId));
    if (!req || Number(req.bookingId) !== Number(state.booking.id)) return false;
    const accepted = state.capacityOffers.find(x => Number(x.requestId) === Number(requestId) && x.offerStatus === 'ACCEPTED');
    const persona = accepted?.workerPersona || 'WORKER_B';
    const worker = state.workers.find(x => x.persona === persona) || state.workers[1] || state.workers[0];
    if (!worker) return false;
    const assignmentId = `XCOOP-${String(state.booking.id).padStart(6,'0')}`;
    Object.assign(state.booking, { workerId: worker.id, workerName: worker.name, workerVerification: 'VERIFIED', distance: persona === 'WORKER_B' ? 6.4 : 3.2, cooperative: req.providingCooperative || 'YUKTI Panhala Worker Cooperative', crossCoop: true, assignmentId, status: 'ACCEPTED' });
    state.booking.capacityExchange = { ...(state.booking.capacityExchange || {}), requestId: req.id, requestCode: req.requestCode, status: 'APPROVED', assignmentId, homeCooperative: req.requestingCooperative, servingCooperative: req.providingCooperative, workerConsentRecorded: true, authorized: true, complaintOwnership: 'Home Cooperative first · Federation escalation for cross-cooperative disputes' };
    const m = meta(state);
    if (!m.crossCoopAssignments.some(x => x.assignmentId === assignmentId)) m.crossCoopAssignments.push({ assignmentId, bookingId: state.booking.id, bookingCode: state.booking.bookingCode, service: state.booking.service, workerId: worker.id, workerName: worker.name, homeCooperative: req.requestingCooperative, servingCooperative: req.providingCooperative, authorizedAt: iso() });
    state.notifications.unshift({ id: Date.now(), title: 'Nearby cooperative worker authorized', message: `${worker.name} consented and the cross-cooperative assignment was authorized. The original booking continues.`, priority: 'NORMAL', createdAt: iso() });
    timeline(state, 'CROSS_COOP_AUTHORIZED', `Worker consent and federation authorization recorded. Assignment ${assignmentId} continues the original booking.`);
    return true;
  }

  function complaintFromSupport(state, request) {
    if (!request?.id || state.complaints.some(x => Number(x.supportRequestId) === Number(request.id))) return false;
    const cross = Boolean(state.booking.crossCoop);
    const id = Math.max(72, ...state.complaints.map(x => Number(x.id || 0) + 1));
    state.complaints.unshift({ id, supportRequestId: request.id, ticketNumber: `CMP-2026-${String(id).padStart(3,'0')}`, bookingId: request.bookingId || state.booking.id, bookingCode: state.booking.bookingCode, category: request.category || 'Service Support', description: request.description || '', status: 'OPEN', escalationLevel: cross ? 2 : 1, slaBreached: false, slaDueAt: new Date(Date.now() + 86400000).toISOString(), owner: cross ? 'YUKTI Kolhapur Services Cooperative · Federation escalation available' : 'YUKTI Kolhapur Services Cooperative', createdAt: request.createdAt || iso() });
    return true;
  }

  function outcomeFromPayment(state) {
    const m = meta(state);
    if (!state.payment || m.serviceOutcomes.some(x => Number(x.bookingId) === Number(state.booking.id))) return false;
    const worker = state.workers.find(x => Number(x.id) === Number(state.booking.workerId));
    if (worker) worker.jobsCompleted = Number(worker.jobsCompleted || 0) + 1;
    m.serviceOutcomes.push({ bookingId: state.booking.id, bookingCode: state.booking.bookingCode, service: state.booking.service, zone: state.booking.zone, crossCoop: Boolean(state.booking.crossCoop), amount: Number(state.payment.amount || 0), completedAt: state.payment.createdAt || iso() });
    return true;
  }

  function feedbackFromRating(state) {
    const m = meta(state);
    if (!state.rating || !state.booking.workerId || m.workerFeedback.some(x => Number(x.bookingId) === Number(state.booking.id))) return false;
    const worker = state.workers.find(x => Number(x.id) === Number(state.booking.workerId));
    const item = { bookingId: state.booking.id, bookingCode: state.booking.bookingCode, workerId: state.booking.workerId, workerName: state.booking.workerName, stars: Number(state.rating.stars || 5), feedback: String(state.rating.feedback || ''), createdAt: state.rating.createdAt || iso() };
    m.workerFeedback.unshift(item);
    if (worker) {
      const completed = Math.max(1, Number(worker.jobsCompleted || 1)), prior = Math.max(0, completed - 1);
      worker.rating = Number((((Number(worker.rating || 0) * prior) + item.stars) / completed).toFixed(1));
    }
    return true;
  }

  function onboarding(state, workerId) {
    const worker = state.workers.find(x => Number(x.id) === Number(workerId));
    if (!worker) return false;
    meta(state).onboarding = { workerId: worker.id, workerName: worker.name, stage: worker.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'COOPERATIVE_REVIEW', steps: ['PROFILE_CREATED','DOCUMENTS_SUBMITTED','SKILL_CHECK_RECORDED',worker.verificationStatus === 'VERIFIED' ? 'COOPERATIVE_VERIFIED' : 'COOPERATIVE_REVIEW'], updatedAt: iso() };
    return true;
  }

  function overview(data, state) {
    const m = meta(state), verified = state.workers.filter(x => x.verificationStatus === 'VERIFIED').length, available = state.workers.filter(x => x.availability === 'AVAILABLE').length;
    const open = state.complaints.filter(x => x.status !== 'RESOLVED').length, unfulfilled = state.capacityRequests.filter(x => x.status !== 'APPROVED').length;
    const assignments = state.capacityRequests.filter(x => x.status === 'APPROVED').reduce((n,x) => n + Number(x.approvedAssignments || 0), 0);
    return { ...data, metrics: { ...(data.metrics || {}), totalWorkers: state.workers.length, verifiedWorkers: verified, availableWorkers: available, activeBookings: ['PAID','CLOSED','CANCELLED'].includes(String(state.booking.status)) ? 0 : 1, openComplaints: open, slaBreached: state.complaints.filter(x => x.slaBreached).length, pendingVerification: state.workers.filter(x => x.verificationStatus !== 'VERIFIED').length, recordedPayments: state.payment ? 1 : 0, capacityRequests: unfulfilled, connectedCooperatives: Array.isArray(data.cooperatives) ? data.cooperatives.length : 3, crossCoopAssignments: assignments, shortageSignals: m.shortageSignals.length, escalatedComplaints: state.complaints.filter(x => x.status !== 'RESOLVED' && Number(x.escalationLevel || 0) > 1).length, recordedSettlements: state.payment && state.booking.crossCoop ? 1 : 0 }, capacityRequests: clone(state.capacityRequests), complaints: clone(state.complaints) };
  }

  function workspace(data, state) {
    const o = overview({ metrics: data.metrics || {}, cooperatives: [] }, state);
    return { ...data, metrics: { ...(data.metrics || {}), ...o.metrics, capacityRequests: state.capacityRequests.length }, complaints: clone(state.complaints), capacityRequests: clone(state.capacityRequests).map(x => ({ ...x, role: x.requestingCooperative === 'YUKTI Kolhapur Services Cooperative' ? 'REQUESTING' : 'PROVIDING' })), trainingRecommendations: clone(state.trainingRecommendations), onboarding: clone(meta(state).onboarding), selectionEvidence: { shortageSignals: meta(state).shortageSignals.length, completedOutcomes: meta(state).serviceOutcomes.length, crossCoopAssignments: meta(state).crossCoopAssignments.length } };
  }

  function workerDashboard(data, state) {
    const id = Number(data?.profile?.id || 0), worker = state.workers.find(x => Number(x.id) === id);
    return { ...data, profile: { ...(data.profile || {}), rating: worker?.rating ?? data?.profile?.rating }, recentFeedback: clone(meta(state).workerFeedback.filter(x => Number(x.workerId) === id).slice(0,3)) };
  }

  function json(data, response) {
    const headers = new Headers(response.headers); headers.set('Content-Type','application/json; charset=utf-8'); headers.set('Cache-Control','no-store'); headers.set('X-SanPaid-Selection-Integrity','closed-loop-v2');
    return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers });
  }

  function urlOf(input) { try { return new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url || '', location.href); } catch { return null; } }
  function methodOf(input, options) { return String(options.method || input?.method || 'GET').toUpperCase(); }

  async function fetchWithIntegrity(input, options = {}) {
    const url = urlOf(input);
    if (!url || url.origin !== location.origin || !url.pathname.startsWith('/api/')) return baseFetch(input, options);
    const method = methodOf(input, options), response = await baseFetch(input, options);
    if (!response.ok) return response;
    const path = url.pathname;
    const needsJson = method !== 'GET' || ['/api/connected/judge/planning','/api/connected/judge/overview','/api/cooperative-admin/workspace','/api/connected/worker/dashboard'].includes(path);
    const data = needsJson ? await response.clone().json().catch(() => null) : null;

    if (method === 'POST') {
      const state = readState(); if (!state?.booking) return response; meta(state); let changed = false;
      if (path === '/api/connected/customer/support') changed = complaintFromSupport(state, data?.request) || changed;
      if (/^\/api\/connected\/customer\/bookings\/\d+\/pay$/.test(path)) changed = outcomeFromPayment(state) || changed;
      if (/^\/api\/connected\/customer\/bookings\/\d+\/rating$/.test(path)) changed = feedbackFromRating(state) || changed;
      if (/^\/api\/connected\/worker\/offers\/\d+\/respond$/.test(path)) changed = closeShortageLoop(state) || changed;
      let match = path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/offer-provider$/); if (match) changed = providerLinked(state, Number(match[1])) || changed;
      match = path.match(/^\/api\/connected\/worker\/capacity-offers\/(\d+)\/respond$/); if (match) { const offer = state.capacityOffers.find(x => Number(x.offerId) === Number(match[1])); if (offer) changed = consentLinked(state, offer.requestId) || changed; }
      match = path.match(/^\/api\/federation\/capacity-requests\/(\d+)\/approve$/); if (match) changed = authorizeLinked(state, Number(match[1])) || changed;
      match = path.match(/^\/api\/cooperative-admin\/workers\/(\d+)\/verification$/); if (match) changed = onboarding(state, Number(match[1])) || changed;
      if (changed) write(state, `POST ${path}`);
      return response;
    }

    const state = readState(); if (!state?.booking) return response; meta(state);
    if (path === '/api/connected/judge/planning') return json(planning(state), response);
    if (path === '/api/connected/judge/overview' && data) return json(overview(data, state), response);
    if (path === '/api/cooperative-admin/workspace' && data) return json(workspace(data, state), response);
    if (path === '/api/connected/worker/dashboard' && data) return json(workerDashboard(data, state), response);
    return response;
  }

  function cardValue(label, value) {
    const root = document.getElementById('adminFinalApp'); if (!root) return;
    const wanted = norm(label), out = String(value);
    for (const card of root.querySelectorAll('article,button,.admin-attention-card')) {
      if (norm(card.querySelector('span')?.textContent) !== wanted) continue;
      const node = card.querySelector('strong,b'); if (node && node.textContent !== out) node.textContent = out;
    }
  }

  function adminRole() {
    const auth = String(window.SanPaidAuth?.getRole?.() || '').toUpperCase(); if (auth) return auth;
    const shell = document.getElementById('sihJudgeShell');
    return shell?.classList.contains('federation-govtech') ? 'FEDERATION_ADMIN' : shell?.classList.contains('cooperative-govtech') ? 'COOPERATIVE_ADMIN' : '';
  }

  function renderAdmin(state) {
    if (!document.getElementById('adminFinalApp')) return;
    const role = adminRole(), verified = state.workers.filter(x => x.verificationStatus === 'VERIFIED').length, available = state.workers.filter(x => x.availability === 'AVAILABLE').length;
    const open = state.complaints.filter(x => x.status !== 'RESOLVED').length, pending = state.workers.filter(x => x.verificationStatus !== 'VERIFIED').length;
    const unfulfilled = state.capacityRequests.filter(x => x.status !== 'APPROVED').length, assignments = state.capacityRequests.filter(x => x.status === 'APPROVED').reduce((n,x)=>n+Number(x.approvedAssignments||0),0), escalated = state.complaints.filter(x => x.status !== 'RESOLVED' && Number(x.escalationLevel || 0) > 1).length;
    if (role === 'COOPERATIVE_ADMIN') {
      [['Verification Attention',pending],['Open Complaints',open],['SLA Breaches',state.complaints.filter(x=>x.slaBreached).length],['Capacity Requests',unfulfilled],['Total Workers',state.workers.length],['Verified Workers',verified],['Available Workers',available],['Active Services',['PAID','CLOSED','CANCELLED'].includes(String(state.booking.status))?0:1],['Recorded Payments',state.payment?1:0]].forEach(x=>cardValue(...x));
    } else if (role === 'FEDERATION_ADMIN') {
      [['Connected Cooperatives',3],['Cross-Coop Assignments',assignments],['Escalated Complaints',escalated],['Repeated Shortage Signals',meta(state).shortageSignals.length],['Verified Workers',verified],['Active Cross-Coop Jobs',assignments],['Open Escalations',escalated],['Unfulfilled Requests',unfulfilled],['Recorded Settlements',state.payment&&state.booking.crossCoop?1:0]].forEach(x=>cardValue(...x));
    }
  }

  function setMarkup(node, signature, html) {
    if (!node || node.dataset.selectionSignature === signature) return false;
    node.dataset.selectionSignature = signature; node.innerHTML = html; return true;
  }

  function renderCapacity(state) {
    const host = document.getElementById('connectedCustomerState'); if (!host) return;
    let node = document.getElementById('selectionCapacityBanner'), x = state.booking.capacityExchange;
    if (!x) { node?.remove(); return; }
    if (!node) { node = document.createElement('div'); node.id='selectionCapacityBanner'; node.className='selection-integrity-banner'; host.prepend(node); }
    const signature = [x.status,x.requestCode,x.assignmentId].join('|');
    setMarkup(node, signature, x.status === 'APPROVED' ? `<b>Nearby cooperative assignment authorized</b><span>${x.assignmentId || 'Cross-cooperative assignment'} · Worker consent recorded · Original booking continues.</span>` : `<b>Local capacity shortage detected</b><span>${x.requestCode || 'Capacity request'} · Nearby cooperative capacity is being checked with worker consent and authorization controls.</span>`);
  }

  function renderFeedback(state) {
    const content = document.querySelector('#connectedContent[data-connected-role="WORKER"]'); if (!content) return;
    const user = window.SanPaidAuth?.getCurrentUser?.() || {}, worker = state.workers.find(x => x.persona === user.persona || String(x.name) === String(user.fullName || user.name));
    const item = meta(state).workerFeedback.find(x => Number(x.workerId) === Number(worker?.id));
    let node = document.getElementById('selectionWorkerFeedback'); if (!item) { node?.remove(); return; }
    const host = content.querySelector('.cw-dashboard.worker [data-cw-view="overview"]') || content.querySelector('.cw-dashboard.worker'); if (!host) return;
    if (!node) { node=document.createElement('section'); node.id='selectionWorkerFeedback'; node.className='selection-integrity-card'; host.appendChild(node); }
    const safeFeedback = String(item.feedback || 'Service completed successfully.').replace(/[<>]/g,'');
    setMarkup(node, `${item.bookingId}|${item.stars}|${safeFeedback}`, `<span>CUSTOMER FEEDBACK</span><b>${'★'.repeat(Math.max(1,Math.min(5,Number(item.stars||5))))} ${Number(item.stars||5)}/5</b><p>${safeFeedback}</p><small>${item.bookingCode || ''} · Visible to the assigned worker</small>`);
  }

  function renderOnboarding(state) {
    const root=document.getElementById('adminFinalApp'); let node=document.getElementById('selectionOnboardingProof');
    if (!root || adminRole() !== 'COOPERATIVE_ADMIN') { node?.remove(); return; }
    const o=meta(state).onboarding, worker=state.workers.find(x=>Number(x.id)===Number(o.workerId)); if(!worker)return;
    if(!node){node=document.createElement('section');node.id='selectionOnboardingProof';node.className='selection-integrity-card selection-onboarding';const dash=root.querySelector('.af-dashboard');dash?.insertBefore(node,dash.children[1]||null);}
    const verified=worker.verificationStatus==='VERIFIED';
    setMarkup(node, `${worker.id}|${worker.verificationStatus}`, `<span>WORKER ONBOARDING PROOF</span><b>${worker.name} · ${verified?'Verified':'Cooperative review'}</b><p>Profile Created → Documents Submitted → Skill Check → Cooperative Review${verified?' → Verified Worker':''}</p>`);
  }

  function renderSelector() {
    const shell=document.getElementById('selectorModeShell');if(!shell)return;
    const top=shell.querySelector('.selector-top-actions');
    if(top&&!document.getElementById('selectionFreshReview')){
      const btn=document.createElement('button');btn.id='selectionFreshReview';btn.type='button';btn.className='selection-fresh-review';btn.textContent='↻ Start Fresh Review';
      btn.addEventListener('click',()=>{window.SanPaidSelectionDemo?.reset?.();const notice=document.getElementById('selectorNotice');if(notice){notice.textContent='Fresh shared review journey restored across role tabs.';notice.classList.remove('hidden');setTimeout(()=>notice.classList.add('hidden'),3200);}schedule();});
      top.insertBefore(btn,top.querySelector('#selectorClose')||null);
    }
    const content=shell.querySelector('#selectorContent');if(!content)return;
    for(const node of content.querySelectorAll('b,h1,p,span,small')){
      const t=node.textContent.trim(), replacement=t==='Karad Cooperative'?'YUKTI Kolhapur Services Cooperative':t==='Satara Approval'?'YUKTI Panhala Worker Cooperative':t==='AI advises. Cooperative decides.'?'Human-reviewed forecasting. Cooperative decides.':t==='AI can recommend. It cannot automatically certify a worker.'?'Pilot forecasting can recommend. Cooperative approval remains required.':'';
      if(replacement&&node.textContent!==replacement)node.textContent=replacement;
    }
  }

  function styles(){
    if(document.getElementById('selectionIntegrityV2Styles'))return;
    const s=document.createElement('style');s.id='selectionIntegrityV2Styles';s.textContent=`.selection-fresh-review{border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:10px;padding:8px 12px;font:700 12px/1.2 inherit;cursor:pointer;white-space:nowrap}.selection-fresh-review:hover{background:#f8fafc}.selection-integrity-banner,.selection-integrity-card{border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:14px 16px;margin:0 0 14px;display:grid;gap:5px;color:#0f172a}.selection-integrity-banner b,.selection-integrity-card b{font-size:14px}.selection-integrity-banner span,.selection-integrity-card p,.selection-integrity-card small{margin:0;color:#475569;font-size:12px;line-height:1.45}.selection-integrity-card>span{font-size:10px;font-weight:800;letter-spacing:.09em;color:#0369a1}.selection-onboarding{margin:14px 20px 0;background:#f8fafc;border-color:#e2e8f0}@media(max-width:720px){.selection-fresh-review{padding:7px 9px;font-size:11px}.selection-onboarding{margin:10px 12px 0}}`;document.head.appendChild(s);
  }

  function render(){queued=false;styles();const state=readState();if(!state?.booking)return;meta(state);renderAdmin(state);renderCapacity(state);renderFeedback(state);renderOnboarding(state);renderSelector();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(render);}

  window.fetch=fetchWithIntegrity;
  window.addEventListener('sanpaid:selection-demo-sync',schedule);
  window.addEventListener('sanpaid:connected-sync',schedule);
  window.addEventListener('storage',e=>{if(e.key===SHARED_KEY)schedule();});
  window.addEventListener('focus',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','data-connected-role']});

  const seed=readState();if(seed?.booking&&!seed.selectionMeta){meta(seed);write(seed,'selection-integrity-v2-initialized');}
  schedule();document.documentElement.dataset.selectionIntegrity='closed-loop-v2';
})();