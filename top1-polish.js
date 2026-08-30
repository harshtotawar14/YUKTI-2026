(() => {
  'use strict';

  // IMPORTANT: keep this layer event-driven. The Connected Demo updates its DOM
  // from live backend polling, so observing/traversing the whole document on
  // every mutation can saturate the browser main thread.

  const LANG = { mr: 'mr-IN', hi: 'hi-IN', en: 'en-IN' };

  function langCode(value = 'en') {
    const key = String(value).toLowerCase().startsWith('mr') ? 'mr' : String(value).toLowerCase().startsWith('hi') ? 'hi' : 'en';
    return LANG[key];
  }

  function speak(text, lang = 'en') {
    if (!text || !('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text).trim());
    utterance.lang = langCode(lang);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function requestLanguageFromCard(card) {
    const summary = card?.querySelector('details summary')?.textContent || '';
    const match = summary.match(/\((mr|hi|en)(?:-[A-Z]{2})?\)/i);
    return match?.[1]?.toLowerCase() || 'en';
  }

  function workerLanguageFromScreen() {
    const text = document.getElementById('connectedContent')?.textContent || '';
    if (/Amit Connected/i.test(text)) return 'hi';
    if (/Suresh Connected/i.test(text)) return 'mr';
    return 'en';
  }

  function structuredSummary(card, lang) {
    const heading = card?.querySelector('h4')?.textContent || 'Service request';
    const service = heading.split('·')[0].trim();
    let zone = 'customer area';
    card?.querySelectorAll('.connected-meta > div').forEach(div => {
      const text = div.textContent || '';
      if (/^Zone/i.test(text)) zone = div.querySelector('b')?.textContent?.trim() || zone;
    });
    if (lang === 'mr') return `तुम्हाला ${service} साठी जॉब रिक्वेस्ट मिळाली आहे. परिसर: ${zone}. ग्राहकाची मूळ विनंती खाली उपलब्ध आहे.`;
    if (lang === 'hi') return `आपको ${service} की जॉब रिक्वेस्ट मिली है। क्षेत्र: ${zone}। ग्राहक की मूल रिक्वेस्ट नीचे उपलब्ध है।`;
    return `You have a ${service} job request in ${zone}. The customer's original request is available below.`;
  }

  document.addEventListener('click', event => {
    const original = event.target.closest?.('[data-listen-original]');
    if (original) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = original.closest('[data-offer]');
      const text = card?.querySelector('details .transcript')?.textContent?.replace(/[“”]/g, '').trim() || '';
      speak(text, requestLanguageFromCard(card));
      return;
    }

    const summaryButton = event.target.closest?.('[data-listen-offer]');
    if (summaryButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = summaryButton.closest('[data-offer]');
      const lang = workerLanguageFromScreen();
      speak(structuredSummary(card, lang), lang);
    }
  }, true);

  document.addEventListener('submit', event => {
    if (event.target?.id !== 'connectedBookingForm') return;
    const button = event.target.querySelector('button[type="submit"]');
    if (!button || button.disabled) return;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Creating booking…';
    window.setTimeout(() => {
      if (!document.body.contains(button)) return;
      button.disabled = false;
      button.textContent = oldText || 'Create Backend Booking';
    }, 6000);
  }, true);
})();