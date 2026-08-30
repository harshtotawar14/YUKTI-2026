(() => {
  'use strict';

  const LANG = { mr: 'mr-IN', hi: 'hi-IN', en: 'en-IN' };
  let backendOnline = false;

  function speak(text, shortLang = 'en') {
    if (!text || !('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text).trim());
    utterance.lang = LANG[shortLang] || LANG.en;
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function inferSummaryLanguage(text = '') {
    if (/आपको|क्षेत्र|जॉब रिक्वेस्ट/.test(text)) return 'hi';
    if (/तुम्हाला|परिसर|जॉब रिक्वेस्ट/.test(text)) return 'mr';
    return 'en';
  }

  function structuredSummaryOnly(text = '') {
    const markers = ['ग्राहक की रिक्वेस्ट:', 'ग्राहकाची विनंती:', 'Customer request:'];
    let clean = String(text).trim();
    for (const marker of markers) {
      const i = clean.indexOf(marker);
      if (i >= 0) return clean.slice(0, i).trim();
    }
    return clean;
  }

  function requestLanguageFromCard(card) {
    const label = card?.querySelector('details summary')?.textContent || '';
    const match = label.match(/\((mr|hi|en)\)/i);
    return match ? match[1].toLowerCase() : 'en';
  }

  function setStatusRow(label, badgeText, detail, tone = 'orange') {
    document.querySelectorAll('#status tbody tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      if (!cells.length || !cells[0].textContent.includes(label)) return;
      const badge = cells[1]?.querySelector('.badge');
      if (badge) {
        badge.textContent = badgeText;
        badge.className = `badge ${tone === 'green' ? 'b-green' : tone === 'purple' ? 'b-purple' : 'b-orange'}`;
      }
      if (detail && cells[2]) cells[2].textContent = detail;
    });
  }

  function syncLandingTruth(online) {
    backendOnline = online;
    if (online) {
      setStatusRow('Connected two-device booking', 'BACKEND CONNECTED', 'Shared PostgreSQL booking, worker-scoped offer, Accept/Reject fallback and SSE status stream', 'green');
      setStatusRow('Eligibility-first matching', 'CONNECTED DEMO', 'Verified/available/skill-verified workers are gated before deterministic ranking', 'green');
      setStatusRow('Worker accept/reject', 'BACKEND CONNECTED', 'Atomic offer response; Reject creates next eligible worker offer with same booking context', 'green');
      setStatusRow('PostgreSQL backend', 'CONNECTED', 'Shared SanPaid PostgreSQL backend is reachable from this deployment', 'green');
    } else {
      const pending = 'Connected source/database are ready, but the currently served backend deployment has not exposed /api/connected/health yet.';
      setStatusRow('Connected two-device booking', 'DEPLOYMENT PENDING', pending, 'orange');
      setStatusRow('Eligibility-first matching', 'SOURCE READY', 'Eligibility and deterministic ranking are implemented in source/database; live connected deployment still needs verification.', 'orange');
      setStatusRow('Worker accept/reject', 'DEPLOYMENT PENDING', pending, 'orange');
      setStatusRow('Dual service-start verification', 'SANDBOX · PENDING', 'Backend-enforced dual verification exists in source/database; current public deployment must be verified.', 'orange');
      setStatusRow('Payment & invoice', 'SANDBOX · PENDING', 'Sandbox checkout/invoice/rating source is ready; current public deployment must be verified.', 'orange');
      setStatusRow('PostgreSQL backend', 'DATABASE READY', 'PostgreSQL schema/data are ready; connected public API deployment is still pending verification.', 'orange');
    }
  }

  async function checkConnectedHealth() {
    try {
      const r = await fetch('/api/connected/health', { credentials: 'include', cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      syncLandingTruth(Boolean(r.ok && d?.ok));
    } catch {
      syncLandingTruth(false);
    }
  }

  function syncConnectedShellTruth() {
    const top = document.getElementById('connectedTopStatus');
    if (!top) return;
    const offline = /not reachable|unavailable/i.test(top.textContent || '');
    const chooserBadges = document.querySelectorAll('#connectedShell .connected-badge');
    chooserBadges.forEach(badge => {
      if (!/CONNECTED BACKEND|DEPLOYMENT PENDING|BACKEND OFFLINE/.test(badge.textContent || '')) return;
      badge.textContent = offline ? 'DEPLOYMENT PENDING' : 'CONNECTED BACKEND';
      badge.style.color = offline ? '#9a5b00' : '#176b46';
      badge.style.background = offline ? '#fff6e8' : '#eaf8f1';
      badge.style.borderColor = offline ? '#f0d29d' : '#c4e8d5';
    });
  }

  // Correct TTS behavior before the older click handlers run.
  document.addEventListener('click', event => {
    const originalBtn = event.target.closest?.('[data-listen-original]');
    if (originalBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = originalBtn.closest('[data-offer]');
      const original = card?.querySelector('details .transcript')?.textContent?.replace(/[“”]/g, '').trim() || '';
      speak(original, requestLanguageFromCard(card));
      return;
    }

    const summaryBtn = event.target.closest?.('[data-listen-offer]');
    if (summaryBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = summaryBtn.closest('[data-offer]');
      const displayed = card?.querySelector('.connected-voice > .transcript')?.textContent || '';
      const summary = structuredSummaryOnly(displayed);
      speak(summary, inferSummaryLanguage(summary));
    }
  }, true);

  const observer = new MutationObserver(() => syncConnectedShellTruth());

  function start() {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    checkConnectedHealth();
    window.addEventListener('online', checkConnectedHealth);
    window.addEventListener('offline', () => syncLandingTruth(false));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkConnectedHealth(); });
    setInterval(checkConnectedHealth, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
