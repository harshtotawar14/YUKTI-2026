(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 768;
  let deferredInstallPrompt = null;
  let reloadingForSW = false;

  function isMobile(){
    return window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
  }

  function prefersReducedMotion(){
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
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

  function revealElement(el,index=0){
    if (!el || el.classList.contains('is-visible')) return;
    el.style.transitionDelay = `${Math.min(index*55,165)}ms`;
    el.classList.add('is-visible');
  }

  function setupMobileMotionRecovery(){
    if (!isMobile()) return;
    const landing = document.getElementById('landing');
    if (!landing) return;
    const elements = Array.from(landing.querySelectorAll('[data-reveal]'));
    if (!elements.length) return;

    if (prefersReducedMotion()) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    landing.classList.add('eval-motion-ready');

    const revealVisibleNow = () => {
      const viewport = window.visualViewport?.height || window.innerHeight || 700;
      elements.forEach((el,index) => {
        if (el.classList.contains('is-visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < viewport*1.08 && rect.bottom > -40) revealElement(el,index%4);
      });
    };

    revealVisibleNow();
    requestAnimationFrame(() => requestAnimationFrame(revealVisibleNow));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          revealElement(entry.target);
          observer.unobserve(entry.target);
        });
      },{threshold:0.01,rootMargin:'0px 0px 18% 0px'});
      elements.forEach(el => {
        if (!el.classList.contains('is-visible')) observer.observe(el);
      });
    } else {
      const onScroll = debounce(revealVisibleNow,40);
      window.addEventListener('scroll',onScroll,{passive:true});
    }

    window.addEventListener('orientationchange',() => setTimeout(revealVisibleNow,180),{passive:true});
    window.addEventListener('pageshow',revealVisibleNow,{passive:true});
    document.fonts?.ready?.then(revealVisibleNow).catch(()=>{});
    setTimeout(revealVisibleNow,600);
    setTimeout(revealVisibleNow,1600);

    setupHeroSequenceFallback();
  }

  function setupHeroSequenceFallback(){
    const root = document.getElementById('evalHeroSystem');
    if (!root || prefersReducedMotion()) return;
    const nodes = Array.from(root.querySelectorAll('[data-hero-seq]'));
    const workers = Array.from(root.querySelectorAll('.hero-worker'));
    const progress = document.getElementById('evalHeroProgress');
    if (!nodes.length) return;

    const startFallback = () => {
      if (root.dataset.animationOwner === 'evaluator' || root.querySelector('.hero-active')) return;
      root.dataset.animationOwner = 'mobile-fallback';
      const sequence = ['request','workers','gate','rank','offer','audit'];
      const run = () => {
        if (root.dataset.animationOwner !== 'mobile-fallback') return;
        nodes.forEach(node => node.classList.remove('hero-active'));
        workers.forEach(worker => worker.classList.remove('hero-pass','hero-remove'));
        if (progress) progress.style.width = '0%';
        sequence.forEach((name,index) => {
          setTimeout(() => {
            if (root.dataset.animationOwner !== 'mobile-fallback') return;
            const node = root.querySelector(`[data-hero-seq="${name}"]`);
            node?.classList.add('hero-active');
            if (name === 'gate') {
              workers.forEach(worker => worker.classList.add(worker.classList.contains('good')?'hero-pass':'hero-remove'));
            }
            if (progress) progress.style.width = `${Math.round(((index+1)/sequence.length)*100)}%`;
          },120+index*820);
        });
        root._mobileAnimationTimer = setTimeout(run,120+sequence.length*820+700);
      };
      run();
    };

    setTimeout(startFallback,900);
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
    if (window.SanPaidLanding?.recoverDrawerState) {
      window.SanPaidLanding.recoverDrawerState();
      return;
    }
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer || drawer.classList.contains('hidden')) document.body.classList.remove('mobile-drawer-open');
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
    setupMobileMotionRecovery();
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