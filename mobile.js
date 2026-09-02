(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 768;
  let deferredInstallPrompt = null;
  let reloadingForSW = false;

  function isMobile(){
    return window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
  }

  function showConnection(message, offline=false, autoHide=true){
    let banner = document.getElementById('connectionBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'connectionBanner';
      banner.className = 'connection-banner';
      banner.setAttribute('role','status');
      banner.setAttribute('aria-live','polite');
      document.body.appendChild(banner);
    }
    banner.textContent = message;
    banner.classList.toggle('offline',offline);
    banner.classList.remove('hidden');
    clearTimeout(banner._hideTimer);
    if (autoHide) banner._hideTimer = setTimeout(() => banner.classList.add('hidden'),2600);
  }

  function setupConnectivity(){
    const update = () => {
      if (navigator.onLine) showConnection('Online · Connection restored',false,true);
      else showConnection('Offline · Reconnect to use connected SanPaid features.',true,false);
    };
    window.addEventListener('online',update);
    window.addEventListener('offline',update);
    if (!navigator.onLine) update();
  }

  function setupVisualViewport(){
    const apply = () => {
      const h = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--visual-height',`${Math.round(h)}px`);
      document.documentElement.style.setProperty('--mobile-vw',`${Math.round(window.innerWidth)}px`);
    };
    apply();
    window.visualViewport?.addEventListener('resize',apply,{passive:true});
    window.visualViewport?.addEventListener('scroll',apply,{passive:true});
    window.addEventListener('orientationchange',() => setTimeout(apply,150),{passive:true});
    window.addEventListener('resize',debounce(apply,100),{passive:true});

    document.addEventListener('focusin',event => {
      if (!isMobile() || !event.target.matches('input,textarea,select')) return;
      setTimeout(() => event.target.scrollIntoView({block:'center',behavior:'smooth'}),180);
    });
  }

  async function installPwa(){
    if (!deferredInstallPrompt) return false;
    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      return true;
    } catch (_) {
      return false;
    }
  }

  function setupInstallPrompt(){
    window.addEventListener('beforeinstallprompt',event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      window.dispatchEvent(new CustomEvent('sanpaid:pwa-install-ready'));
    });
    window.addEventListener('appinstalled',() => {
      deferredInstallPrompt = null;
      showConnection('SanPaid installed successfully',false,true);
    });
  }

  function showSWUpdate(registration){
    if (!registration?.waiting || document.getElementById('pwaUpdateBanner')) return;
    const bar = document.createElement('div');
    bar.id = 'pwaUpdateBanner';
    bar.className = 'pwa-install-banner';
    bar.innerHTML = `<div class="pwa-copy"><b>New SanPaid version available</b><span>Refresh the mobile app shell to use the latest fixes.</span></div><div class="actions"><button class="btn secondary small" id="laterUpdate" type="button">Later</button><button class="btn primary small" id="applyUpdate" type="button">Update</button></div>`;
    document.body.appendChild(bar);
    document.getElementById('laterUpdate')?.addEventListener('click',() => bar.remove());
    document.getElementById('applyUpdate')?.addEventListener('click',() => registration.waiting?.postMessage({type:'SKIP_WAITING'}));
  }

  function setupServiceWorker(){
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost')) return;

    window.addEventListener('load',async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
        await registration.update().catch(() => undefined);
        if (registration.waiting) showSWUpdate(registration);
        registration.addEventListener('updatefound',() => {
          const worker = registration.installing;
          worker?.addEventListener('statechange',() => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) showSWUpdate(registration);
          });
        });
        navigator.serviceWorker.addEventListener('controllerchange',() => {
          if (reloadingForSW) return;
          reloadingForSW = true;
          location.reload();
        });
      } catch (error) {
        console.warn('SanPaid service worker registration failed:',error);
      }
    },{once:true});
  }

  function clearStaleDrawerLock(){
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer || drawer.classList.contains('hidden')) {
      document.body.classList.remove('mobile-drawer-open');
      document.getElementById('mobileDrawerScrim')?.classList.add('hidden');
      document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
    }
  }

  function setupLifecycleRecovery(){
    window.addEventListener('pageshow',clearStaleDrawerLock);
    window.addEventListener('orientationchange',() => setTimeout(clearStaleDrawerLock,120),{passive:true});
    document.addEventListener('visibilitychange',() => {
      if (!document.hidden) clearStaleDrawerLock();
    });
  }

  function debounce(fn,wait){
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args),wait);
    };
  }

  function init(){
    clearStaleDrawerLock();
    setupConnectivity();
    setupVisualViewport();
    setupInstallPrompt();
    setupServiceWorker();
    setupLifecycleRecovery();
  }

  window.SanPaidMobile = {
    isMobile,
    installPwa,
    hasInstallPrompt:() => !!deferredInstallPrompt,
    clearStaleDrawerLock
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
