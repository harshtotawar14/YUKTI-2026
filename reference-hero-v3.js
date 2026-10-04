(() => {
  'use strict';

  // Every new visit starts at the branded home screen. Section links still
  // work normally when the visitor uses the navigation after opening the site.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  const showHome = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  showHome();
  window.addEventListener('load', showHome, { once: true });
  window.addEventListener('pageshow', showHome, { once: true });

  const icon=(name)=>({
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="m10 8 6 4-6 4Z" fill="currentColor"/></svg>',
    shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m9 12 2 2 4-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    people:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 19c.5-4 2.3-6 5.5-6s5 2 5.5 6M16 7.5a2.5 2.5 0 0 1 0 5M15.5 14c3 0 4.5 1.7 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9" r="2.4" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    network:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m9 9.4 1.8 4M15 9.4l-1.8 4M9.5 16h-4M18.5 16h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    community:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="5" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="19" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 19c.4-4 2-6 5-6s4.6 2 5 6M1.5 18c.4-3 1.6-4.5 3.5-4.5 1 0 1.8.3 2.5.9M22.5 18c-.4-3-1.6-4.5-3.5-4.5-1 0-1.8.3-2.5.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    document:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 3v5h5M9 12h6M9 16h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    bars:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V11h4v9M10 20V5h4v15M16 20V8h4v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    globe:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21M12 3C9.7 5.5 8.5 8.5 8.5 12s1.2 6.5 3.5 9" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
  }[name]||'');

  const navMarkup=()=>`
    <nav class="sp-ref-nav" aria-label="SanPaid navigation">
      <div class="sp-nav-inner">
        <a class="sp-ref-brand" href="#home" aria-label="SanPaid home">
          <img src="app-icon.svg" alt="" aria-hidden="true">
          <span class="sp-ref-brand-copy"><b>San<span>Paid</span></b><small>Cooperative Workforce Network</small></span>
        </a>
        <div class="sp-ref-navlinks">
          <a href="#home">Home</a><a href="#services">Services</a><a href="#how">How it Works</a><a href="#difference">Why SanPaid</a><a href="#evidence">Field Proof</a>
        </div>
        <div class="sp-ref-actions">
          <details class="sp-language"><summary>${icon('globe')}<span class="sp-language-long">English</span><span class="sp-language-short">EN</span><span aria-hidden="true">⌄</span></summary><div class="sp-language-pop"><b>English</b><span>Language options are available inside the platform workspace.</span></div></details>
          <button class="sp-open-platform" id="getStarted" type="button">Open Platform&nbsp; →</button>
          <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileDrawer">☰</button>
        </div>
      </div>
      <div id="mobileDrawer" class="mobile-drawer hidden" aria-hidden="true">
        <a href="#home">Home</a><a href="#services">Services</a><a href="#how">How it Works</a><a href="#difference">Why SanPaid</a><a href="#evidence">Field Proof</a><a href="#operatingModel">Roles</a>
        <button type="button" class="btn primary" id="spMobileAccess">OPEN PLATFORM</button><button type="button" class="btn secondary" data-open-selector="0">PLATFORM TOUR</button>
      </div>
    </nav>`;

  const heroMarkup=()=>`
    <header class="sp-reference-hero" id="home">
      <div class="sp-hero-grid">
        <div class="sp-hero-copy">
          <div class="sp-kickers"><span class="sp-kicker-primary"><i aria-hidden="true"></i>A Cooperative Initiative</span><span class="sp-kicker-secondary">Stronger Communities&nbsp;&nbsp; | &nbsp;&nbsp;Skilled Local Workers&nbsp;&nbsp; | &nbsp;&nbsp;Trusted Services</span></div>
          <h1 class="sp-hero-title">Trusted Local Services<br>Through <span class="sp-blue">Cooperatives</span></h1>
          <p class="sp-mobile-lead">Book verified local workers through your cooperative.</p>
          <p class="sp-hero-lead">SanPaid connects households and institutions with verified local workers through labour cooperative societies and federations for reliable, transparent and safe services.</p>
          <div class="sp-hero-actions">
            <button class="sp-hero-primary" type="button" data-open-connected="CUSTOMER">${icon('calendar')}<span>Book a Service</span><span aria-hidden="true">→</span></button>
            <button class="sp-hero-secondary" id="heroTourCta" type="button" data-open-selector="0">${icon('play')}<span>Explore Platform</span></button>
          </div>
          <div class="sp-trust-row" aria-label="SanPaid trust principles">
            <div class="sp-trust-item"><span class="sp-trust-icon green">${icon('shield')}</span><span class="sp-trust-text"><b>Verified Workers</b><small>Identity &amp; skill checked</small></span></div>
            <div class="sp-trust-item"><span class="sp-trust-icon blue">${icon('people')}</span><span class="sp-trust-text"><b>Skilled &amp; Local</b><small>From your community</small></span></div>
            <div class="sp-trust-item"><span class="sp-trust-icon gold">${icon('pin')}</span><span class="sp-trust-text"><b>Local-First Matching</b><small>Within 20 km by default</small></span></div>
            <div class="sp-trust-item"><span class="sp-trust-icon pink">${icon('network')}</span><span class="sp-trust-text"><b>Cooperative Network</b><small>People helping people</small></span></div>
          </div>
        </div>
        <div class="sp-hero-visual">
          <div class="sp-mobile-worker" role="img" aria-label="SanPaid verified worker — Skilled, Local, Reliable"></div>
          <img src="/assets/sanpaid-reference-hero-right.webp" width="1128" height="555" fetchpriority="high" decoding="async" alt="SanPaid customer app beside a verified cooperative service worker helping a local household">
        </div>
      </div>
      <div class="sp-proof-strip" aria-label="SanPaid field validation summary">
        <div class="sp-proof-item"><span class="sp-proof-icon">${icon('community')}</span><span class="sp-proof-text"><b>Stakeholder-informed design</b><small>Built with community and cooperative input</small></span></div>
        <div class="sp-proof-item"><span class="sp-proof-icon">${icon('pin')}</span><span class="sp-proof-text"><b>Kolhapur field validation</b><small>~50-minute stakeholder discussion</small></span></div>
        <div class="sp-proof-item"><span class="sp-proof-icon">${icon('document')}</span><span class="sp-proof-text"><b>Signed &amp; stamped acknowledgement</b><small>From cooperative stakeholders</small></span></div>
        <div class="sp-proof-item"><span class="sp-proof-icon">${icon('bars')}</span><span class="sp-proof-text"><b>Field findings mapped to product controls</b><small>Backed by real community insights</small></span></div>
      </div>
    </header>`;

  function lockLandingPages(landing){
    const nav=landing.querySelector('.sp-ref-nav');
    const viewport=document.createElement('div');
    viewport.className='sp-landing-viewport';
    const canvas=document.createElement('div');
    canvas.className='sp-landing-canvas';
    [...landing.children].filter(node=>node!==nav).forEach(node=>canvas.appendChild(node));
    viewport.appendChild(canvas);landing.appendChild(viewport);
    landing.classList.add('sp-page-locked');
    let active='home',frame=0;
    function fitHome(){
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        canvas.style.transform='none';
        if(active!=='home')return;
        const scale=Math.min(1,viewport.clientHeight/Math.max(1,canvas.scrollHeight));
        canvas.style.transform=`scale(${scale})`;
      });
    }
    function openPage(id){
      const target=canvas.querySelector(`[id="${id}"]`);
      if(!target)return;
      active=id;landing.dataset.landingPage=id;
      canvas.querySelectorAll('.sp-current-panel').forEach(node=>node.classList.remove('sp-current-panel'));
      target.classList.add('sp-current-panel');
      landing.querySelectorAll('.sp-ref-navlinks a').forEach(link=>{
        const selected=link.getAttribute('href')===`#${id}`;
        link.classList.toggle('sp-page-active',selected);
        if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
      });
      viewport.scrollTop=0;canvas.style.transform='none';
      window.SanPaidLanding?.closeMobileDrawer?.(false);
      fitHome();
    }
    landing.addEventListener('click',event=>{
      const link=event.target.closest('a[href^="#"]');
      if(!link)return;
      const id=link.getAttribute('href').slice(1);
      if(!canvas.querySelector(`[id="${id}"]`))return;
      event.preventDefault();event.stopImmediatePropagation();openPage(id);
    },true);
    window.addEventListener('resize',fitHome,{passive:true});
    if('ResizeObserver' in window)new ResizeObserver(fitHome).observe(viewport);
    document.fonts?.ready.then(fitHome);
    openPage('home');
  }

  function install(){
    const landing=document.querySelector('#landing.reference-home');
    if(!landing||landing.dataset.referenceHeroV3==='1')return;
    const nav=landing.querySelector('nav.eval-nav, nav.sp-ref-nav');
    const hero=landing.querySelector('header#home');
    if(!nav||!hero)return;
    landing.dataset.referenceHeroV3='1';
    nav.insertAdjacentHTML('beforebegin',navMarkup());
    nav.remove();
    hero.insertAdjacentHTML('beforebegin',heroMarkup());
    hero.remove();

    const servicePaths={
      Electrician:'M13 2 4 14h7l-1 8 10-13h-7Z',
      Plumber:'M15 3a6 6 0 0 0-7 8L2 17a3 3 0 0 0 4 4l7-7a6 6 0 0 0 8-7l-4 4-4-4 4-4Z',
      Carpenter:'m3 19 10-10 3 3L6 22Zm9-15 5-2 6 6-4 5-3-3-3-3-3-1Z',
      Cleaner:'m14 2 3 1-4 11-3-1ZM6 12l9 3 3 6-5 1-1-5-2 5-4-1 1-5-3 4-3-2Z',
      Gardener:'M21 2C8 2 2 7 5 15c3 7 15 5 16-13ZM3 22 16 9',
      Caregiver:'M12 21 3 12C-3 5 6-1 12 6c6-7 15-1 9 6Z'
    };
    const mobileServices=document.createElement('div');
    mobileServices.className='sp-mobile-services';
    mobileServices.innerHTML=`<h2>Find your service</h2><div class="sp-mobile-service-grid">${Object.entries(servicePaths).map(([name,path])=>`<button type="button" data-mobile-service="${name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="currentColor" stroke="currentColor" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"/></svg><b>${name}</b></button>`).join('')}</div><a class="sp-mobile-field-proof" href="#evidence"><span class="sp-mobile-proof-icon">${icon('document')}</span><span><b>Field-informed in Kolhapur</b><small>Stakeholder interaction</small><small>Signed &amp; stamped acknowledgement</small><strong>View Field Proof <span aria-hidden="true">→</span></strong></span></a>`;
    landing.querySelector('#services .wrap').prepend(mobileServices);
    mobileServices.addEventListener('click',event=>{
      const button=event.target.closest('[data-mobile-service]');
      if(button)window.SanPaidLanding?.startBooking?.(button.dataset.mobileService);
    });
    lockLandingPages(landing);

  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
