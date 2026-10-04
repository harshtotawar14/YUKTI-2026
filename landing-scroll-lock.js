(() => {
  'use strict';

  const SECTION_IDS = new Set(['home', 'services', 'how', 'difference', 'evidence', 'operatingModel']);
  const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);

  function install() {
    const landing = document.querySelector('#landing.reference-home');
    if (!landing || landing.dataset.scrollLockInstalled === '1') return;
    landing.dataset.scrollLockInstalled = '1';

    const style = document.createElement('style');
    style.id = 'sanpaidLandingManualScrollLock';
    style.textContent = `
      html.sanpaid-landing-manual-lock{scrollbar-width:none;overscroll-behavior:none}
      html.sanpaid-landing-manual-lock::-webkit-scrollbar{display:none}
      body.sanpaid-landing-manual-lock{overscroll-behavior:none}
      #landing.reference-home.sanpaid-manual-scroll-locked{touch-action:pan-x pinch-zoom}
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('sanpaid-landing-manual-lock');
    document.body.classList.add('sanpaid-landing-manual-lock');
    landing.classList.add('sanpaid-manual-scroll-locked');

    const isLandingVisible = () => {
      if (!landing.isConnected || landing.hidden) return false;
      const cs = getComputedStyle(landing);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };

    const isEditable = target => target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable="true"]'));

    const closeMobileDrawer = () => {
      const drawer = landing.querySelector('#mobileDrawer');
      const menu = landing.querySelector('#menuBtn');
      if (drawer) {
        drawer.classList.add('hidden');
        drawer.setAttribute('aria-hidden', 'true');
      }
      if (menu) menu.setAttribute('aria-expanded', 'false');
    };

    const goToSection = id => {
      if (!SECTION_IDS.has(id)) return;
      const target = document.getElementById(id);
      if (!target || !landing.contains(target)) return;
      const nav = landing.querySelector('.sp-ref-nav');
      const offset = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
      const top = Math.max(0, Math.round(window.scrollY + target.getBoundingClientRect().top - offset));
      window.scrollTo({ top, left: 0, behavior: 'auto' });
      closeMobileDrawer();
    };

    document.addEventListener('wheel', event => {
      if (!isLandingVisible()) return;
      const target = event.target instanceof Node ? event.target : null;
      if (target && landing.contains(target)) event.preventDefault();
    }, { passive: false, capture: true });

    document.addEventListener('touchmove', event => {
      if (!isLandingVisible()) return;
      const target = event.target instanceof Node ? event.target : null;
      if (target && landing.contains(target)) event.preventDefault();
    }, { passive: false, capture: true });

    document.addEventListener('keydown', event => {
      if (!isLandingVisible() || !SCROLL_KEYS.has(event.key) || isEditable(event.target)) return;
      const target = event.target instanceof Node ? event.target : null;
      if (!target || landing.contains(target)) event.preventDefault();
    }, true);

    document.addEventListener('click', event => {
      const link = event.target instanceof Element
        ? event.target.closest('#landing.reference-home .sp-ref-nav a[href^="#"]')
        : null;
      if (!link) return;
      const id = (link.getAttribute('href') || '').slice(1);
      if (!SECTION_IDS.has(id)) return;
      event.preventDefault();
      event.stopPropagation();
      goToSection(id);
    }, true);

    // Always open the approved hero first; no markup, styling or content is changed.
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
