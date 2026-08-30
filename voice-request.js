(() => {
  'use strict';

  const APP_STORAGE_KEY = 'sanpaid_demo_state_v2';
  const PENDING_VOICE_KEY = 'sanpaid_pending_voice_request_v1';
  const SUPPORTED_LANGS = {
    'en-IN': { label: 'English', short: 'EN' },
    'hi-IN': { label: 'Hindi', short: 'HI' },
    'mr-IN': { label: 'Marathi', short: 'MR' }
  };

  const DEFAULT_WORKER_LANGS = {
    W001: 'hi-IN',
    W002: 'mr-IN',
    W003: 'hi-IN',
    W004: 'mr-IN',
    W005: 'hi-IN',
    W006: 'mr-IN',
    W007: 'hi-IN'
  };

  function state() {
    try {
      return window.SanPaidDemo && typeof window.SanPaidDemo.state === 'function'
        ? window.SanPaidDemo.state()
        : null;
    } catch (_) {
      return null;
    }
  }

  function persist() {
    const s = state();
    if (!s) return;
    try { localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(s)); } catch (_) {}
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function toast(message, type = 'success') {
    let wrap = document.getElementById('toastWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toastWrap';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }

  function getPendingVoice() {
    try {
      const raw = sessionStorage.getItem(PENDING_VOICE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function setPendingVoice(data) {
    try { sessionStorage.setItem(PENDING_VOICE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function clearPendingVoice() {
    try { sessionStorage.removeItem(PENDING_VOICE_KEY); } catch (_) {}
  }

  function ensureWorkerLanguages() {
    const s = state();
    if (!s || !Array.isArray(s.workers)) return;
    let changed = false;
    s.workers.forEach(worker => {
      if (!worker.preferredLanguage) {
        worker.preferredLanguage = DEFAULT_WORKER_LANGS[worker.id] || 'hi-IN';
        changed = true;
      }
    });
    if (changed) persist();
  }

  function languageLabel(code) {
    return SUPPORTED_LANGS[code]?.label || code || 'Unknown';
  }

  function scheduleText(booking, lang) {
    const now = booking.schedule === 'NOW';
    if (lang === 'hi-IN') return now ? 'अभी / जितनी जल्दी संभव हो' : 'निर्धारित समय पर';
    if (lang === 'mr-IN') return now ? 'आत्ता / शक्य तितक्या लवकर' : 'नियोजित वेळेनुसार';
    return now ? 'Now / as soon as possible' : 'Scheduled time';
  }

  function buildWorkerSummary(booking, workerLang) {
    const service = booking.service || 'service';
    const area = booking.area || 'customer area';
    const urgent = !!booking.urgent;
    const problem = booking.problem || booking.voiceRequest?.originalTranscript || 'No additional description';

    if (workerLang === 'hi-IN') {
      return `आपको ${service} की जॉब रिक्वेस्ट मिली है। क्षेत्र: ${area}। समय: ${scheduleText(booking, workerLang)}। ${urgent ? 'यह अर्जेंट रिक्वेस्ट है। ' : ''}ग्राहक की समस्या: ${problem}`;
    }
    if (workerLang === 'mr-IN') {
      return `तुम्हाला ${service} साठी जॉब रिक्वेस्ट मिळाली आहे. परिसर: ${area}. वेळ: ${scheduleText(booking, workerLang)}. ${urgent ? 'ही तातडीची रिक्वेस्ट आहे. ' : ''}ग्राहकाची समस्या: ${problem}`;
    }
    return `You have a ${service} job request. Area: ${area}. Time: ${scheduleText(booking, workerLang)}. ${urgent ? 'This is an urgent request. ' : ''}Customer problem: ${problem}`;
  }

  function injectStyles() {
    if (document.getElementById('sanpaidVoiceStyles')) return;
    const style = document.createElement('style');
    style.id = 'sanpaidVoiceStyles';
    style.textContent = `
      .voice-capture-box{margin-top:12px;border:1px solid #d9e2dc;border-radius:14px;padding:12px;background:#f8fbf9}
      .voice-capture-head,.voice-offer-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .voice-capture-actions,.voice-offer-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
      .voice-lang-select{min-height:38px;border:1px solid #cbd7d0;border-radius:9px;padding:7px 9px;background:white;color:#18342b}
      .voice-status{font-size:12px;color:#5f716a;margin-top:8px}
      .voice-status.listening{color:#9a5b00;font-weight:700}
      .voice-transcript{margin-top:10px;padding:10px;border-radius:10px;background:white;border:1px solid #e0e8e3;font-size:13px;line-height:1.55}
      .voice-offer-panel{margin-top:10px;padding:12px;border:1px solid #d7e2db;border-left:4px solid #1f7a55;border-radius:10px;background:#f7fbf8;max-width:720px}
      .voice-offer-panel .voice-title{font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-weight:800;color:#1f7a55}
      .voice-offer-panel .voice-summary{font-size:13px;line-height:1.55;margin-top:8px;color:#233b33}
      .voice-offer-panel details{margin-top:8px;font-size:12px;color:#53675f}
      .voice-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;background:#e8f5ed;color:#17623f;font-size:11px;font-weight:800}
      .voice-active-card{margin-top:14px}
      @media(max-width:700px){.voice-capture-actions,.voice-offer-actions{align-items:stretch}.voice-lang-select{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function decorateBookingVoiceStep() {
    const textarea = document.getElementById('bkProblem');
    if (!textarea || document.getElementById('voiceCaptureBox')) return;

    const pending = getPendingVoice();
    const box = document.createElement('div');
    box.id = 'voiceCaptureBox';
    box.className = 'voice-capture-box';
    box.innerHTML = `
      <div class="voice-capture-head">
        <div><strong>🎙 Voice Request</strong><div class="voice-status" id="voiceStatus">Speak in English, Hindi or Marathi.</div></div>
        <span class="voice-badge">Cross-language worker delivery</span>
      </div>
      <div class="voice-capture-actions">
        <select id="voiceSourceLang" class="voice-lang-select" aria-label="Voice language">
          <option value="mr-IN">Marathi</option>
          <option value="hi-IN">Hindi</option>
          <option value="en-IN">English</option>
        </select>
        <button type="button" class="btn secondary small" id="startVoiceCapture">🎙 Start Voice</button>
        <button type="button" class="btn secondary small" id="clearVoiceCapture">Clear Voice</button>
      </div>
      <div id="voiceTranscriptPreview" class="voice-transcript" ${pending?.originalTranscript ? '' : 'hidden'}></div>
    `;

    textarea.parentElement.appendChild(box);

    const langSelect = document.getElementById('voiceSourceLang');
    const preview = document.getElementById('voiceTranscriptPreview');
    const status = document.getElementById('voiceStatus');

    if (pending?.sourceLanguage && SUPPORTED_LANGS[pending.sourceLanguage]) {
      langSelect.value = pending.sourceLanguage;
    }
    if (pending?.originalTranscript) {
      textarea.value = pending.originalTranscript;
      preview.hidden = false;
      preview.textContent = `Captured: “${pending.originalTranscript}”`;
      status.textContent = `Voice captured in ${languageLabel(pending.sourceLanguage)}. You can edit the text before continuing.`;
    }

    document.getElementById('startVoiceCapture').onclick = () => {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        toast('Voice recognition is not supported in this browser. Please type the request instead.', 'warn');
        status.textContent = 'Browser voice recognition unavailable — text input still works.';
        return;
      }

      const recognition = new Recognition();
      recognition.lang = langSelect.value;
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      status.textContent = 'Listening… speak your complete service request.';
      status.classList.add('listening');

      recognition.onresult = event => {
        const result = event.results?.[0]?.[0];
        const transcript = String(result?.transcript || '').trim();
        const confidence = typeof result?.confidence === 'number' ? result.confidence : null;
        if (!transcript) {
          toast('No voice text was captured. Please try again.', 'warn');
          return;
        }

        textarea.value = transcript;
        const meta = {
          source: 'VOICE',
          originalTranscript: transcript,
          sourceLanguage: langSelect.value,
          recognitionConfidence: confidence,
          capturedAt: new Date().toISOString()
        };
        setPendingVoice(meta);
        preview.hidden = false;
        preview.textContent = `Captured: “${transcript}”`;
        status.textContent = `Voice captured in ${languageLabel(langSelect.value)}. Confirm or edit the text, then continue.`;
        status.classList.remove('listening');
        toast('Voice request captured');
      };

      recognition.onerror = event => {
        status.classList.remove('listening');
        status.textContent = 'Voice capture failed. You can retry or type the request.';
        toast(`Voice capture error: ${event.error || 'unknown error'}`, 'warn');
      };

      recognition.onend = () => status.classList.remove('listening');

      try { recognition.start(); }
      catch (_) { toast('Voice capture could not start. Please retry.', 'warn'); }
    };

    document.getElementById('clearVoiceCapture').onclick = () => {
      clearPendingVoice();
      textarea.value = '';
      preview.hidden = true;
      preview.textContent = '';
      status.textContent = 'Voice request cleared. You can speak again or type manually.';
    };
  }

  function attachVoiceToNewBooking(beforeIds, voiceMeta) {
    if (!voiceMeta?.originalTranscript) return;
    const attempt = () => {
      const s = state();
      if (!s?.bookings) return false;
      const booking = s.bookings.find(b => !beforeIds.has(b.id));
      if (!booking) return false;

      booking.voiceRequest = {
        source: 'VOICE',
        originalTranscript: voiceMeta.originalTranscript,
        sourceLanguage: voiceMeta.sourceLanguage || 'mr-IN',
        recognitionConfidence: voiceMeta.recognitionConfidence ?? null,
        capturedAt: voiceMeta.capturedAt || new Date().toISOString(),
        deliveryStatus: 'WAITING_FOR_WORKER_OFFER',
        deliveryHistory: []
      };
      booking.customerLanguage = voiceMeta.sourceLanguage || 'mr-IN';
      booking.problem = booking.problem || voiceMeta.originalTranscript;
      booking.history = booking.history || [];
      booking.history.push({
        old: booking.status,
        new: booking.status,
        at: new Date().toISOString(),
        reason: 'Customer voice request attached to booking'
      });
      persist();
      clearPendingVoice();
      toast('Voice request attached to booking and ready for worker delivery.');
      syncVoiceDelivery();
      return true;
    };

    if (attempt()) return;
    setTimeout(attempt, 50);
    setTimeout(attempt, 250);
    setTimeout(attempt, 700);
  }

  function syncVoiceDelivery() {
    ensureWorkerLanguages();
    const s = state();
    if (!s?.offers || !s?.bookings || !s?.workers) return;
    let changed = false;

    s.offers.filter(o => o.status === 'PENDING').forEach(offer => {
      const booking = s.bookings.find(b => b.id === offer.bookingId);
      if (!booking?.voiceRequest?.originalTranscript) return;
      const worker = s.workers.find(w => w.id === offer.workerId);
      if (!worker) return;

      const history = booking.voiceRequest.deliveryHistory || (booking.voiceRequest.deliveryHistory = []);
      if (!history.some(d => d.offerId === offer.id)) {
        const lang = worker.preferredLanguage || DEFAULT_WORKER_LANGS[worker.id] || 'hi-IN';
        history.push({
          offerId: offer.id,
          workerId: worker.id,
          workerLanguage: lang,
          deliveredAt: new Date().toISOString(),
          status: 'DELIVERED'
        });
        booking.voiceRequest.deliveryStatus = 'DELIVERED_TO_WORKER_OFFER';
        booking.voiceRequest.currentWorkerId = worker.id;
        booking.voiceRequest.currentWorkerLanguage = lang;
        booking.voiceRequest.workerSummary = buildWorkerSummary(booking, lang);
        booking.history = booking.history || [];
        booking.history.push({
          old: booking.status,
          new: booking.status,
          at: new Date().toISOString(),
          reason: `Voice request delivered to worker ${worker.id}`
        });
        changed = true;
      }
    });

    if (changed) persist();
    decorateWorkerOffers();
    decorateWorkerActiveJob();
  }

  function createVoicePanel(booking, worker, offerId, compact = false) {
    const vr = booking.voiceRequest;
    if (!vr) return null;
    const lang = worker?.preferredLanguage || vr.currentWorkerLanguage || 'hi-IN';
    const summary = buildWorkerSummary(booking, lang);
    const panel = document.createElement('div');
    panel.className = compact ? 'voice-offer-panel voice-active-card' : 'voice-offer-panel';
    panel.dataset.voicePanel = offerId || booking.id;
    panel.innerHTML = `
      <div class="voice-offer-head">
        <span class="voice-title">🎙 Customer Voice Request</span>
        <span class="voice-badge">${esc(languageLabel(vr.sourceLanguage))} → ${esc(languageLabel(lang))}</span>
      </div>
      <div class="voice-summary"><strong>Worker-language job summary:</strong><br>${esc(summary)}</div>
      <details>
        <summary>Show original voice transcript</summary>
        <div style="margin-top:6px">“${esc(vr.originalTranscript)}”</div>
      </details>
      <div class="voice-offer-actions">
        <button type="button" class="btn secondary small" data-voice-listen="${esc(offerId || booking.id)}">🔊 Listen Summary</button>
        <button type="button" class="btn secondary small" data-voice-original="${esc(offerId || booking.id)}">▶ Original Voice Text</button>
        ${worker ? `<select class="voice-lang-select" data-worker-lang="${esc(worker.id)}" aria-label="Worker preferred language">
          <option value="hi-IN" ${lang === 'hi-IN' ? 'selected' : ''}>Hindi</option>
          <option value="mr-IN" ${lang === 'mr-IN' ? 'selected' : ''}>Marathi</option>
          <option value="en-IN" ${lang === 'en-IN' ? 'selected' : ''}>English</option>
        </select>` : ''}
      </div>
    `;
    return panel;
  }

  function decorateWorkerOffers() {
    const s = state();
    if (!s || s.currentRole !== 'WORKER') return;

    document.querySelectorAll('[data-accept]').forEach(acceptButton => {
      const offerId = acceptButton.dataset.accept;
      const offer = s.offers?.find(o => o.id === offerId);
      const booking = s.bookings?.find(b => b.id === offer?.bookingId);
      if (!offer || !booking?.voiceRequest) return;

      const item = acceptButton.closest('.list-item');
      if (!item || item.querySelector(`[data-voice-panel="${CSS.escape(offerId)}"]`)) return;
      const info = item.firstElementChild || item;
      const worker = s.workers?.find(w => w.id === offer.workerId);
      info.appendChild(createVoicePanel(booking, worker, offerId));
    });
  }

  function decorateWorkerActiveJob() {
    const s = state();
    if (!s || s.currentRole !== 'WORKER') return;
    const content = document.getElementById('appContent');
    if (!content || content.querySelector('[data-voice-active]')) return;
    const heading = content.querySelector('h1');
    if (!heading || heading.textContent.trim() !== 'Active Job') return;

    const workerId = s.currentUser?.workerId;
    const booking = s.bookings?.find(b => b.assignedWorkerId === workerId && !['CLOSED', 'CANCELLED'].includes(b.status));
    if (!booking?.voiceRequest) return;
    const panel = content.querySelector('.panel');
    if (!panel) return;
    const worker = s.workers?.find(w => w.id === workerId);
    const voicePanel = createVoicePanel(booking, worker, booking.id, true);
    voicePanel.dataset.voiceActive = 'true';
    panel.insertBefore(voicePanel, panel.querySelector('.modal-foot'));
  }

  function resolveBookingForVoiceKey(key) {
    const s = state();
    if (!s) return null;
    const offer = s.offers?.find(o => o.id === key);
    if (offer) return s.bookings?.find(b => b.id === offer.bookingId) || null;
    return s.bookings?.find(b => b.id === key) || null;
  }

  function speak(text, lang) {
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
      toast('Voice playback is not supported in this browser. Readable text remains available.', 'warn');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || 'hi-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function installEventBridge() {
    document.addEventListener('click', event => {
      const startTarget = event.target.closest('#bookServiceHero,#heroSearch,#quickBook,[data-service],[data-app-service]');
      if (startTarget && !event.target.closest('#modalBackdrop')) clearPendingVoice();

      const next = event.target.closest('#bkNext');
      if (next) {
        const textarea = document.getElementById('bkProblem');
        const pending = getPendingVoice();
        if (textarea && pending?.source === 'VOICE') {
          pending.originalTranscript = textarea.value.trim() || pending.originalTranscript;
          pending.sourceLanguage = document.getElementById('voiceSourceLang')?.value || pending.sourceLanguage;
          setPendingVoice(pending);
        }

        if (/Confirm Booking/i.test(next.textContent || '')) {
          const s = state();
          const beforeIds = new Set((s?.bookings || []).map(b => b.id));
          const voiceMeta = getPendingVoice();
          if (voiceMeta?.originalTranscript) {
            setTimeout(() => attachVoiceToNewBooking(beforeIds, voiceMeta), 0);
          }
        }
      }

      const listen = event.target.closest('[data-voice-listen]');
      if (listen) {
        const booking = resolveBookingForVoiceKey(listen.dataset.voiceListen);
        if (!booking?.voiceRequest) return;
        const s = state();
        const workerId = s?.currentUser?.workerId || booking.voiceRequest.currentWorkerId;
        const worker = s?.workers?.find(w => w.id === workerId);
        const lang = worker?.preferredLanguage || booking.voiceRequest.currentWorkerLanguage || 'hi-IN';
        speak(buildWorkerSummary(booking, lang), lang);
      }

      const original = event.target.closest('[data-voice-original]');
      if (original) {
        const booking = resolveBookingForVoiceKey(original.dataset.voiceOriginal);
        if (!booking?.voiceRequest) return;
        speak(booking.voiceRequest.originalTranscript, booking.voiceRequest.sourceLanguage || 'mr-IN');
      }
    }, true);

    document.addEventListener('change', event => {
      const select = event.target.closest('[data-worker-lang]');
      if (!select) return;
      const s = state();
      const worker = s?.workers?.find(w => w.id === select.dataset.workerLang);
      if (!worker) return;
      worker.preferredLanguage = select.value;
      persist();
      toast(`Worker language set to ${languageLabel(select.value)}`);
      document.querySelectorAll('[data-voice-panel]').forEach(p => p.remove());
      document.querySelectorAll('[data-voice-active]').forEach(p => p.remove());
      syncVoiceDelivery();
    });
  }

  function startObserver() {
    const observer = new MutationObserver(() => {
      decorateBookingVoiceStep();
      syncVoiceDelivery();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // A light periodic sync also covers offer changes that update state before DOM repaint.
    setInterval(syncVoiceDelivery, 1200);
  }

  function init() {
    injectStyles();
    ensureWorkerLanguages();
    installEventBridge();
    startObserver();
    decorateBookingVoiceStep();
    syncVoiceDelivery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();