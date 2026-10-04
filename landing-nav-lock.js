(() => {
  'use strict';

  const ALLOWED_SECTIONS = new Set(['home', 'services', 'how', 'difference', 'evidence', 'operatingModel']);
  const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);

  function isEditable(target) {
    return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }

  function install() {
    const landing = document.querySelector('#landing.reference-home');
    if (!landing || landing.dataset.navOnlyLock === '1') return;

    const nav = landing.querySelector('.sp-ref-nav');
    if (!nav) return;

    landing.dataset.navOnlyLock = '1';
    document.documentElement.classList.add('sanpaid-landing-nav-locked');
    document.body.classList.add('sanpaid-landing-nav-locked');

    const style = document.createElement('style');
    style.id = 'sanpaidLandingNavLockStyles';
    style.textContent = `
      html.sanpaid-landing-nav-locked{scrollbar-width:none;overscroll-behavior:none}
      html.sanpaid-landing-nav-locked::-webkit-scrollbar{display:none}
      body.sanpaid-landing-nav-locked{overscroll-behavior:none}
      #landing.reference-home .sp-ref-navlinks a:first-child:not(.sp-nav-current){color:#17375f!important}
      #landing.reference-home .sp-ref-navlinks a:first-child:not(.sp-nav-current)::after{display:none!important}
      #landing.reference-home .sp-ref-navlinks a.sp-nav-current{color:var(--sp-blue)!important}
      #landing.reference-home .sp-ref-navlinks a.sp-nav-current::after{content:"";position:absolute;left:0;right:0;bottom:16px;height:3px;border-radius:99px;background:var(--sp-blue);display:block!important}
    `;
    document.head.appendChild(style);

    const setActive = id => {
      landing.querySelectorAll('.sp-ref-nav a[href^="#"]').forEach(link => {
        const current = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('sp-nav-current', current);
        if (current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };

    const closeMobileDrawer = () => {
      const drawer = landing.querySelector('#mobileDrawer');
      const menu = landing.querySelector('#menuBtn');
      if (!drawer || !menu) return;
      drawer.classList.add('hidden');
      drawer.setAttribute('aria-hidden', 'true');
      menu.setAttribute('aria-expanded', 'false');
    };

    const openSection = (id, updateHistory = true) => {
      if (!ALLOWED_SECTIONS.has(id)) return false;
      const target = document.getElementById(id);
      if (!target || !landing.contains(target)) return false;

      const navHeight = Math.ceil(nav.getBoundingClientRect().height || 0);
      const top = Math.max(0, Math.round(window.scrollY + target.getBoundingClientRect().top - navHeight));
      window.scrollTo({ top, left: 0, behavior: 'auto' });
      setActive(id);
      closeMobileDrawer();

      if (updateHistory) {
        const hash = `#${id}`;
        if (location.hash !== hash) history.pushState({ sanpaidSection: id }, '', hash);
      }
      return true;
    };

    const preventManualScroll = event => {
      if (!(event.target instanceof Node) || !landing.contains(event.target)) return;
      event.preventDefault();
    };

    landing.addEventListener('wheel', preventManualScroll, { passive: false });
    landing.addEventListener('touchmove', preventManualScroll, { passive: false });

    document.addEventListener('keydown', event => {
      if (!SCROLL_KEYS.has(event.key) || isEditable(event.target)) return;
      const target = event.target instanceof Node ? event.target : null;
      if (target && landing.contains(target)) event.preventDefault();
    }, true);

    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('#landing.reference-home .sp-ref-nav a[href^="#"]') : null;
      if (!link) return;
      const id = (link.getAttribute('href') || '').slice(1);
      if (!ALLOWED_SECTIONS.has(id)) return;
      event.preventDefault();
      event.stopPropagation();
      openSection(id, true);
    }, true);

    window.addEventListener('popstate', () => {
      const id = location.hash.slice(1) || 'home';
      openSection(ALLOWED_SECTIONS.has(id) ? id : 'home', false);
    });

    const initial = location.hash.slice(1);
    setTimeout(() => openSection(ALLOWED_SECTIONS.has(initial) ? initial : 'home', false), 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
