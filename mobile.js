(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 768;
  let deferredInstallPrompt = null;
  let lastNavSignature = '';
  let reloadingForSW = false;

  if (!window.CSS) window.CSS = {};
  if (!window.CSS.escape) {
    window.CSS.escape = value => String(value).replace(/[^a-zA-Z0-9_-]/g, ch => `\\${ch}`);
  }

  const ICONS = {
    customerHome:'⌂', bookService:'＋', activeBooking:'●', history:'↺', payments:'₹', customerComplaints:'!',
    workerHome:'⌂', offers:'◉', workerJob:'▶', earnings:'₹', workerProfile:'✓',
    adminHome:'⌂', verification:'✓', bookings:'▣', complaints:'!', capacity:'⇄', audit:'◎',
    fedHome:'⌂', forecast:'⌁'
  };

  function demoState(){
    try {
      return window.SanPaidDemo && typeof window.SanPaidDemo.state === 'function'
        ? window.SanPaidDemo.state()
        : null;
    } catch (_) { return null; }
  }

  function isMobile(){ return window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches; }

  function sideButtons(){
    return Array.from(document.querySelectorAll('#sideNav [data-view]'));
  }

  function currentRole(){
    const s = demoState();
    return s?.currentRole || s?.currentUser?.role || '';
  }

  function currentView(){
    return document.querySelector('#sideNav [data-view].active')?.dataset.view || '';
  }

  function makeScrim(){
    let scrim = document.getElementById('mobileDrawerScrim');
    if (!scrim) {
      scrim = document.createElement('div');
      scrim.id = 'mobileDrawerScrim';
      scrim.className = 'mobile-drawer-scrim hidden';
      scrim.setAttribute('aria-hidden','true');
      document.body.appendChild(scrim);
      scrim.addEventListener('click', closeAllDrawers);
    }
    return scrim;
  }

  function openDrawer(drawer, trigger){
    if (!drawer) return;
    closeAllDrawers(drawer);
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden','false');
    if (trigger) trigger.setAttribute('aria-expanded','true');
    const scrim = makeScrim();
    scrim.classList.remove('hidden');
    document.body.classList.add('mobile-drawer-open');
    requestAnimationFrame(() => drawer.querySelector('button,a')?.focus());
  }

  function closeAllDrawers(except){
    ['mobileDrawer','mobileAppDrawer'].forEach(id => {
      const drawer = document.getElementById(id);
      if (!drawer || drawer === except) return;
      drawer.classList.add('hidden');
      drawer.setAttribute('aria-hidden','true');
    });
    document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
    document.getElementById('appMenuBtn')?.setAttribute('aria-expanded','false');
    document.getElementById('mobileDrawerScrim')?.classList.add('hidden');
    if (!except) document.body.classList.remove('mobile-drawer-open');
  }

  function drawerHeader(title){
    return `<div class="drawer-title"><strong>${title}</strong><button type="button" class="drawer-close" data-close-mobile-drawer aria-label="Close menu">✕</button></div>`;
  }

  function enhanceLandingDrawer(){
    const drawer = document.getElementById('mobileDrawer');
    const trigger = document.getElementById('menuBtn');
    if (!drawer || !trigger) return;

    trigger.setAttribute('aria-controls','mobileDrawer');
    trigger.setAttribute('aria-expanded','false');
    trigger.onclick = () => {
      if (!drawer.classList.contains('hidden')) { closeAllDrawers(); return; }
      populateLandingDrawer();
      openDrawer(drawer, trigger);
    };
  }

  function populateLandingDrawer(){
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    const hasSession = !!demoState()?.currentUser;
    const installSupported = !!deferredInstallPrompt;
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    drawer.innerHTML = `${drawerHeader('SanPaid')}
      <div class="drawer-section">
        <div class="drawer-label">Explore</div>
        <a class="drawer-action" href="#home">⌂ Home</a>
        <a class="drawer-action" href="#services">▣ Services</a>
        <a class="drawer-action" href="#matching">◎ Fair Matching</a>
        <a class="drawer-action" href="#how">→ How It Works</a>
        <a class="drawer-action" href="#trust">✓ Trust & Safety</a>
      </div>
      <div class="drawer-section">
        <div class="drawer-label">Actions</div>
        <button class="drawer-action primary-mobile" type="button" data-mobile-action="book">＋ Book a Service</button>
        <button class="drawer-action" type="button" data-mobile-action="worker">🛠 Join as Worker</button>
        <button class="drawer-action" type="button" data-mobile-action="roles">👤 Login / Choose Role</button>
        ${hasSession ? '<button class="drawer-action" type="button" data-mobile-action="resume">▶ Resume Dashboard</button>' : ''}
      </div>
      <div class="drawer-section">
        <div class="drawer-label">Mobile App</div>
        ${installSupported ? '<button class="drawer-action" type="button" data-mobile-action="install">⇩ Install SanPaid</button>' : ''}
        ${!installSupported && isiOS ? '<div class="demo-note">On iPhone/iPad: Safari → Share → Add to Home Screen.</div>' : ''}
      </div>`;

    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeAllDrawers));
    drawer.querySelector('[data-close-mobile-drawer]')?.addEventListener('click', closeAllDrawers);
    drawer.querySelector('[data-mobile-action="book"]')?.addEventListener('click', () => { closeAllDrawers(); document.getElementById('bookServiceHero')?.click(); });
    drawer.querySelector('[data-mobile-action="worker"]')?.addEventListener('click', () => { closeAllDrawers(); document.getElementById('joinWorker')?.click(); });
    drawer.querySelector('[data-mobile-action="roles"]')?.addEventListener('click', () => { closeAllDrawers(); window.SanPaidDemo?.showRoles?.(); });
    drawer.querySelector('[data-mobile-action="resume"]')?.addEventListener('click', () => { closeAllDrawers(); document.getElementById('resumeDemo')?.click(); });
    drawer.querySelector('[data-mobile-action="install"]')?.addEventListener('click', installPwa);
  }

  function populateAppDrawer(){
    const drawer = document.getElementById('mobileAppDrawer');
    if (!drawer) return;
    const role = currentRole().replaceAll('_',' ') || 'Dashboard';
    const active = currentView();
    const items = sideButtons().map(btn => {
      const id = btn.dataset.view;
      const label = btn.textContent.trim();
      return `<button type="button" class="drawer-action ${id===active?'active':''}" data-mobile-view="${id}"><span>${ICONS[id]||'•'}</span><span>${label}</span></button>`;
    }).join('');

    drawer.innerHTML = `${drawerHeader(role)}
      <div class="drawer-section"><div class="drawer-label">Dashboard</div>${items}</div>
      <div class="drawer-section">
        <div class="drawer-label">Account</div>
        <button type="button" class="drawer-action" data-mobile-app-action="landing">⌂ Landing Page</button>
        <button type="button" class="drawer-action danger-mobile" data-mobile-app-action="logout">↪ Logout</button>
      </div>`;

    drawer.querySelector('[data-close-mobile-drawer]')?.addEventListener('click', closeAllDrawers);
    drawer.querySelectorAll('[data-mobile-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        activateView(btn.dataset.mobileView);
        closeAllDrawers();
      });
    });
    drawer.querySelector('[data-mobile-app-action="landing"]')?.addEventListener('click', () => { closeAllDrawers(); document.getElementById('homeFromApp')?.click(); });
    drawer.querySelector('[data-mobile-app-action="logout"]')?.addEventListener('click', () => { closeAllDrawers(); document.getElementById('logoutBtn')?.click(); });
  }

  function enhanceAppDrawer(){
    const drawer = document.getElementById('mobileAppDrawer');
    const trigger = document.getElementById('appMenuBtn');
    if (!drawer || !trigger) return;
    trigger.setAttribute('aria-controls','mobileAppDrawer');
    trigger.setAttribute('aria-expanded','false');
    trigger.onclick = () => {
      if (!drawer.classList.contains('hidden')) { closeAllDrawers(); return; }
      populateAppDrawer();
      openDrawer(drawer, trigger);
    };
  }

  function activateView(viewId){
    const original = sideButtons().find(btn => btn.dataset.view === viewId);
    if (!original) return;
    original.click();
    window.scrollTo({top:0,behavior:'smooth'});
    syncMobileActive();
  }

  function bottomConfig(role){
    if (role === 'CUSTOMER') return ['customerHome','bookService','activeBooking','history'];
    if (role === 'WORKER') return ['workerHome','offers','workerJob','earnings'];
    return [];
  }

  function buildBottomNav(force=false){
    const role = currentRole();
    const desired = bottomConfig(role);
    let nav = document.getElementById('mobileBottomNav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'mobileBottomNav';
      nav.className = 'mobile-bottom-nav hidden';
      nav.setAttribute('aria-label','Mobile dashboard navigation');
      document.body.appendChild(nav);
    }

    if (!desired.length) {
      nav.classList.add('hidden');
      nav.innerHTML = '';
      return;
    }

    const available = new Map(sideButtons().map(b => [b.dataset.view,b.textContent.trim()]));
    const items = desired.filter(id => available.has(id));
    const signature = `${role}|${items.join('|')}|${Array.from(available.keys()).join('|')}`;
    if (!force && signature === lastNavSignature) { syncMobileActive(); return; }
    lastNavSignature = signature;

    nav.innerHTML = items.map(id => `<button type="button" data-bottom-view="${id}"><span class="nav-icon">${ICONS[id]||'•'}</span><span>${shortLabel(available.get(id))}</span></button>`).join('') +
      `<button type="button" data-bottom-more><span class="nav-icon">☰</span><span>More</span></button>`;

    nav.querySelectorAll('[data-bottom-view]').forEach(btn => btn.addEventListener('click', () => activateView(btn.dataset.bottomView)));
    nav.querySelector('[data-bottom-more]')?.addEventListener('click', () => {
      populateAppDrawer();
      openDrawer(document.getElementById('mobileAppDrawer'), document.getElementById('appMenuBtn'));
    });
    nav.classList.toggle('hidden', !isMobile() || document.getElementById('appShell')?.classList.contains('hidden'));
    syncMobileActive();
  }

  function shortLabel(label=''){
    const map = {'Active Booking':'Active','Service History':'History','Job Offers':'Offers','Active Job':'Active','Command Center':'Home','Federation Overview':'Home'};
    return map[label] || label.split(' ')[0] || 'View';
  }

  function syncMobileActive(){
    const active = currentView();
    document.querySelectorAll('[data-bottom-view]').forEach(b => b.classList.toggle('active', b.dataset.bottomView === active));
    document.querySelectorAll('#mobileAppDrawer [data-mobile-view]').forEach(b => b.classList.toggle('active', b.dataset.mobileView === active));
  }

  function syncMobileShell(){
    const appShell = document.getElementById('appShell');
    const nav = document.getElementById('mobileBottomNav');
    if (!appShell) return;
    if (nav) nav.classList.toggle('hidden', !isMobile() || appShell.classList.contains('hidden') || !bottomConfig(currentRole()).length);
    if (!appShell.classList.contains('hidden')) {
      buildBottomNav();
      syncMobileActive();
    } else {
      closeAllDrawers();
    }
  }

  function setupObservers(){
    const side = document.getElementById('sideNav');
    const shell = document.getElementById('appShell');
    if (side) {
      new MutationObserver(() => {
        buildBottomNav();
        syncMobileActive();
      }).observe(side,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
    if (shell) new MutationObserver(syncMobileShell).observe(shell,{attributes:true,attributeFilter:['class']});
    const content = document.getElementById('appContent');
    if (content) new MutationObserver(() => { syncMobileActive(); humanizeMobileStatus(); }).observe(content,{childList:true,subtree:true});
  }

  function humanizeMobileStatus(){
    if (!isMobile()) return;
    document.querySelectorAll('#appContent .badge').forEach(badge => {
      if (badge.dataset.mobileHumanized) return;
      const text = badge.textContent.trim();
      if (text.includes('_')) badge.textContent = text.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
      badge.dataset.mobileHumanized = '1';
    });
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
      else showConnection('Offline Mode · Saved demo data remains available on this device',true,false);
    };
    window.addEventListener('online',update);
    window.addEventListener('offline',update);
    if (!navigator.onLine) update();
  }

  function setupVisualViewport(){
    const apply = () => {
      const h = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--visual-height',`${Math.round(h)}px`);
    };
    apply();
    window.visualViewport?.addEventListener('resize',apply);
    window.addEventListener('orientationchange',() => setTimeout(apply,150));
    document.addEventListener('focusin', e => {
      if (isMobile() && e.target.matches('input,textarea,select')) setTimeout(() => e.target.scrollIntoView({block:'center',behavior:'smooth'}),180);
    });
  }

  async function installPwa(){
    if (!deferredInstallPrompt) return;
    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch (_) {}
    deferredInstallPrompt = null;
    closeAllDrawers();
  }

  function setupInstallPrompt(){
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      if (!document.getElementById('landing')?.classList.contains('hidden')) populateLandingDrawer();
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
    bar.innerHTML = `<div class="pwa-copy"><b>New SanPaid version available</b><span>Update the cached mobile app shell.</span></div><div class="actions"><button class="btn secondary small" id="laterUpdate">Later</button><button class="btn primary small" id="applyUpdate">Update</button></div>`;
    document.body.appendChild(bar);
    document.getElementById('laterUpdate').onclick = () => bar.remove();
    document.getElementById('applyUpdate').onclick = () => registration.waiting?.postMessage({type:'SKIP_WAITING'});
  }

  function setupServiceWorker(){
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost')) return;
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js',{scope:'./'});
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
        console.warn('SanPaid service worker registration failed:', error);
      }
    });
  }

  function setupKeyboardAndEscape(){
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeAllDrawers();
    });
  }

  function onResize(){
    if (!window.matchMedia('(max-width:960px)').matches) closeAllDrawers();
    buildBottomNav(true);
    syncMobileShell();
  }

  function init(){
    makeScrim();
    enhanceLandingDrawer();
    enhanceAppDrawer();
    setupObservers();
    setupConnectivity();
    setupVisualViewport();
    setupInstallPrompt();
    setupServiceWorker();
    setupKeyboardAndEscape();
    buildBottomNav(true);
    syncMobileShell();
    humanizeMobileStatus();
    window.addEventListener('resize',debounce(onResize,120));
  }

  function debounce(fn,wait){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args),wait); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
