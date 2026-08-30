(() => {
  'use strict';

  // Final polish is intentionally event-light. Core loading, speech, modal and
  // status behavior now lives in the feature modules themselves so we do not
  // duplicate handlers or reintroduce DOM-observer performance regressions.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const cancel = document.querySelector('#connectedModalRoot [data-modal-cancel]');
    if (cancel) cancel.click();
  });
})();