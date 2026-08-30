(() => {
  'use strict';

  let loaded = false;
  let loading = false;

  function connectedOpen() {
    const shell = document.getElementById('connectedShell');
    return !!(shell && !shell.classList.contains('hidden'));
  }

  function loadVoiceModule() {
    if (loaded || loading || connectedOpen()) return;
    loading = true;
    const script = document.createElement('script');
    script.src = 'voice-request.js';
    script.async = true;
    script.dataset.lazyVoice = '1';
    script.onload = () => { loaded = true; loading = false; };
    script.onerror = () => { loading = false; };
    document.head.appendChild(script);
  }

  document.addEventListener('click', event => {
    if (connectedOpen()) return;
    const target = event.target.closest?.(
      '#bookServiceHero,#heroSearch,#quickBook,#getStarted,#resumeDemo,#joinWorker,#coopLogin,[data-service],[data-app-service]'
    );
    if (target) loadVoiceModule();
  }, true);

  function watchAppShell() {
    const shell = document.getElementById('appShell');
    if (!shell) return;
    const maybeLoad = () => {
      if (!shell.classList.contains('hidden') && !connectedOpen()) loadVoiceModule();
    };
    maybeLoad();
    new MutationObserver(maybeLoad).observe(shell, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchAppShell, { once: true });
  } else {
    watchAppShell();
  }

  window.SanPaidVoiceModule = { load: loadVoiceModule, isLoaded: () => loaded };
})();