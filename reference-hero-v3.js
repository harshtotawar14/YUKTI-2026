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

  function enhanceReferencePages(landing){
    const art=(kind,n)=>`<img class="rp-art" src="assets/landing-reference/${kind}-${n}.webp" alt="" decoding="async">`;
    const heading=(title,subtitle)=>`<header class="rp-heading"><h2>${title}</h2><p>${subtitle}</p></header>`;
    const page=(id,content)=>{
      const section=landing.querySelector(`#${id}`);
      if(!section)return;
      // Preserve the original operational controls, event handlers and evidence.
      const detail=document.createElement('dialog');detail.className='rp-detail';detail.id=`rp-detail-${id}`;
      const close=document.createElement('button');close.type='button';close.className='rp-close';close.textContent='Close';close.addEventListener('click',()=>detail.close());
      detail.append(close);[...section.children].forEach(node=>detail.append(node));document.body.append(detail);
      section.classList.add('sp-reference-page');section.innerHTML=`<div class="rp-page">${content}</div>`;
      detail.addEventListener('click',e=>{if(e.target===detail)detail.close();});
      return section;
    };
    const serviceRows=[
      ['Electrician','Wiring, switches & electrical repairs','Electrician'],['Plumber','Leaks, taps & pipe repairs','Plumber'],['Painter','Interior & exterior painting','Painter'],['Home Cleaning','Routine & deep cleaning','Cleaner'],['AC Service','Servicing & cooling repairs','AC Technician'],['Appliance Repair','Home appliance servicing','Appliance Technician'],['Gardening','Plant care & garden upkeep','Gardener'],['More Services','Explore other service categories','']
    ];
    const services=page('services',heading('Find the service you need','Choose a service to connect with verified local cooperative workers.')+`<div class="rp-search"><label><span aria-hidden="true">⌕</span><input id="rp-service-search" type="search" placeholder="Search for a service…" aria-label="Search services"><button id="rp-service-mic" type="button" aria-label="Search services by voice">${icon('people').replace(/<svg/, '<svg')}</button></label><label class="rp-location">${icon('pin')}<input id="rp-service-location" aria-label="Service location" value="Kolhapur"></label></div><div class="rp-services rp-grid">${serviceRows.map(([title,copy,name],i)=>`<button type="button" class="rp-service" data-rp-service="${name}" data-rp-name="${title.toLowerCase()}" aria-label="${title==='More Services'?'Explore all services':`Book ${title}`}">${art('service',i+1)}<h3>${title}</h3><p>${copy}</p><span class="rp-card-arrow" aria-hidden="true">→</span></button>`).join('')}</div><p id="rp-search-status" class="rp-search-status" role="status"></p><aside class="rp-strip rp-urgent"><b>ϟ &nbsp; Need urgent help?</b><span>Choose <strong>Emergency / On-Demand</strong> when making your request.</span><small>Subject to worker availability.</small></aside><footer class="rp-footer">✓ Verified profiles &nbsp; • &nbsp; Local-first matching &nbsp; • &nbsp; Estimate approval before work</footer>`);
    services?.addEventListener('click',e=>{const b=e.target.closest('[data-rp-service]');if(b){const name=b.dataset.rpService;if(name)window.SanPaidLanding?.startBooking?.(name);else window.SanPaidLanding?.openRoleAccess?.('CUSTOMER');}});
    const search=services?.querySelector('#rp-service-search');
    search?.addEventListener('input',()=>{
      const query=search.value.toLowerCase().trim();let count=0;
      services.querySelectorAll('[data-rp-service]').forEach(card=>{card.hidden=Boolean(query&&!card.textContent.toLowerCase().includes(query));if(!card.hidden)count++;});
      services.querySelector('#rp-search-status').textContent=count?'': 'No matching category. Try another search or open the platform for all services.';
    });
    services?.querySelector('#rp-service-location')?.addEventListener('change',e=>window.SanPaidLanding?.rememberArea?.(e.target.value.trim()));
    const mic=services?.querySelector('#rp-service-mic');
    if(mic){mic.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
      mic.addEventListener('click',()=>{const status=services.querySelector('#rp-search-status');if(!Speech){status.textContent='Voice search is unavailable in this browser. Type your service instead.';search.focus();return;}const speech=new Speech();speech.lang=document.documentElement.lang||'en-IN';speech.onstart=()=>{mic.disabled=true;status.textContent='Listening…';};speech.onresult=e=>{search.value=e.results[0][0].transcript;search.dispatchEvent(new Event('input'));};speech.onerror=()=>status.textContent='Could not hear you. Try again or type your service.';speech.onend=()=>{mic.disabled=false;if(status.textContent==='Listening…')status.textContent='';};try{speech.start();}catch{status.textContent='Voice search could not start. Type your service instead.';}});
    }
    const steps=[['Tell us what you need','Choose a service, location and time. Add a photo or voice note.','Choose service, location & time. Add a photo or voice note.'],['Choose a verified worker','See eligible local workers. Select one and wait for their acceptance.','Select an eligible local worker. Wait for their acceptance.'],['Approve the estimate','Discuss the job and approve the itemized price before work begins.','Discuss the job. Approve the itemized price first.'],['Verify the service start','Confirm your booked worker with QR or OTP when they arrive.','Confirm the arriving worker with QR / OTP.'],['Complete service & pay','Confirm completion, make payment and receive your invoice.','Confirm completion, pay & receive your invoice.'],['Rate & get after-service care','Share your feedback. Request a free fix for an issue with the completed job.','Rate the job. Request a free fix for completed-service issues.']];
    page('how',heading('How SanPaid Works','From booking to after-service care — in 6 simple steps.')+`<ol class="rp-steps rp-grid">${steps.map(([title,copy,short],i)=>`<li class="rp-step"><span class="rp-number">${i+1}</span>${i===0?'<span class="rp-badge urgent">Emergency / On-Demand</span>':''}${art('step',i+1)}<h3>${title}</h3><p class="rp-long">${copy}</p><p class="rp-short">${short}</p>${i===5?'<span class="rp-badge fix">7-Day Free Fix</span><small class="rp-fix-note">For issues with the completed service</small>':''}</li>`).join('')}</ol><aside class="rp-strip rp-exchange"><b>No suitable local worker?</b><span>A nearby cooperative can help, with worker consent and authorized approval.</span></aside>`);
    const why=[['Find trusted local workers','Worker identity and skills are hard to verify.','Verified profiles, skill records and local-first matching.','shield'],['Know the price. Verify the start.','Unclear pricing and service records reduce trust.','Approved estimate, QR / OTP start and digital invoice.','document'],['Know who is accountable','Requests and complaints need clear ownership.','Cooperative oversight and traceable complaint records.','community'],['Keep worker records connected','Skills, job history and support records are fragmented.','Digital Service Passport. Welfare & insurance: planned for pilot.','document']];
    const difference=page('difference',heading('Why SanPaid?','Trusted local services. Accountable cooperatives.')+`<div class="rp-why rp-grid">${why.map(([title,gap,approach,key])=>`<article class="rp-why-card"><h3><i>${icon(key)}</i>${title}</h3><div class="rp-comparison"><div><b>THE GAP</b><p>${gap}</p></div><span aria-hidden="true">→</span><div><b>SANPAID’S APPROACH</b><p>${approach}</p></div></div></article>`).join('')}</div><h3 class="rp-unique-title">Two ideas that make SanPaid different</h3><div class="rp-unique rp-grid"><button type="button" data-rp-detail="capacity" class="rp-feature"><i aria-hidden="true">⇄</i><span><b>Cooperative Capacity Exchange</b><p>When suitable local capacity is unavailable, a nearby cooperative can help.</p><small>Worker consent • Authorized approval • Assignment ID</small></span></button><button type="button" data-rp-detail="demandLoop" class="rp-feature"><i aria-hidden="true">↗</i><span><b>Demand-to-Workforce Loop</b><em>Proposed pilot</em><p>Human-reviewed AI forecasting guides workforce allocation and training.</p></span></button></div><footer class="rp-footer">Informed by Kolhapur field research • 03 Sep 2026 • Recorded interaction • Signed acknowledgement • MoM</footer>`);
    difference?.querySelectorAll('.rp-why-card').forEach(card=>{card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',card.querySelector('h3').textContent+' — read problem and approach');const open=()=>{const d=document.createElement('dialog');d.className='rp-detail';const close=document.createElement('button');close.type='button';close.className='rp-close';close.textContent='Close';close.addEventListener('click',()=>d.close());const copy=card.cloneNode(true);copy.removeAttribute('role');copy.removeAttribute('tabindex');d.append(close,copy);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();};card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
    difference?.addEventListener('click',e=>{const b=e.target.closest('[data-rp-detail]');if(b)document.getElementById('rp-detail-difference').showModal();});
    const player=(id,title)=>`<button type="button" class="rp-video-preview" data-rp-video="${id}" aria-label="Play ${title}"><span class="rp-video-symbol">${icon('play')}</span><b>Recorded interaction</b><small>Original research video</small></button>`;
    const scan=(path,alt)=>`<a href="assets/${path}" target="_blank" rel="noopener" aria-label="Open original ${alt}"><img src="assets/${path}" alt="${alt}" decoding="async" loading="lazy"></a>`;
    const proofs=[['Worker & Public Field Survey','Field interaction documenting service challenges.',player('zRZCWIANW-g','SanPaid field survey interaction')],['Stakeholder Interaction','Cooperative department, Kolhapur • ~50-minute discussion.',player('NMOKz8rl-LQ','SanPaid cooperative stakeholder interaction')],['Signed & Stamped Acknowledgement','Original acknowledgement of the stakeholder interaction.',scan('official-acknowledgement.jpeg','signed and stamped acknowledgement')],['Minutes of Meeting','Discussion findings and recorded follow-up points.',scan('mom-page-1.jpeg','Minutes of Meeting page one')],['Requirement Mapping & Action Items','Recorded next steps and evidence mapping.',scan('mom-page-2.jpeg','Minutes of Meeting page two')],['Institute Review','Institute review recorded on MoM page two.',scan('mom-page-2.jpeg','institute review on Minutes of Meeting page two')]];
    const evidence=page('evidence',heading('Field Proof','Real conversations. Documented insights. A solution shaped by the community.')+`<p class="rp-context">03 Sep 2026 • Kolhapur stakeholder interaction</p><div class="rp-proofs rp-grid">${proofs.map(([title,copy,media])=>`<article class="rp-proof"><div class="rp-proof-media">${media}</div><h3>${title}</h3><p>${copy}</p></article>`).join('')}</div><footer class="rp-footer">Field insights → Registration & verification • Local-first matching • Transparent service records</footer><p class="rp-evidence-note">Acknowledgement records the research interaction; it does not imply product approval. Select a document to read the original.</p>`);
    evidence?.addEventListener('click',e=>{const button=e.target.closest('[data-rp-video]');if(!button)return;const d=document.createElement('dialog');d.className='rp-detail rp-video-dialog';const close=document.createElement('button');close.type='button';close.className='rp-close';close.textContent='Close';close.addEventListener('click',()=>d.close());const iframe=document.createElement('iframe');iframe.src=`https://www.youtube-nocookie.com/embed/${button.dataset.rpVideo}`;iframe.title=button.getAttribute('aria-label');iframe.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';iframe.allowFullscreen=true;const fallback=document.createElement('a');fallback.href=`https://www.youtube.com/watch?v=${button.dataset.rpVideo}`;fallback.target='_blank';fallback.rel='noopener';fallback.textContent='Open original video on YouTube';d.append(close,iframe,fallback);d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal();});
  }

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
        canvas.style.width='100%';
        if(active!=='home')return;
        const mobile=window.matchMedia('(max-width:620px)').matches;
        let scale=Math.min(1,viewport.clientHeight/Math.max(1,canvas.scrollHeight));
        if(mobile){
          // Compensate the layout width before scaling so the mobile screen
          // stays full-width rather than becoming a narrow centered column.
          for(let iteration=0;iteration<10;iteration++){
            canvas.style.width=`${100/scale}%`;
            const next=Math.min(1,viewport.clientHeight/Math.max(1,canvas.scrollHeight));
            if(Math.abs(next-scale)<.002){scale=next;break;}
            scale=(scale+next)/2;
          }
          canvas.style.width=`${100/scale}%`;
          scale=Math.min(scale,viewport.clientHeight/Math.max(1,canvas.scrollHeight));
          canvas.style.width=`${100/scale}%`;
        }
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
      viewport.scrollTop=0;canvas.style.transform='none';canvas.style.width='100%';
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
    window.visualViewport?.addEventListener('resize',fitHome,{passive:true});
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
    const desktopAccess=landing.querySelector('#getStarted.sp-open-platform');
    const mobileHeader=window.matchMedia('(max-width:980px)');
    const syncHeaderAccess=()=>{
      if(!desktopAccess)return;
      if(mobileHeader.matches)desktopAccess.remove();
      else if(!desktopAccess.isConnected)landing.querySelector('.sp-ref-actions #menuBtn')?.before(desktopAccess);
    };
    syncHeaderAccess();
    mobileHeader.addEventListener('change',syncHeaderAccess);
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
    landing.querySelector('#home').appendChild(mobileServices);
    mobileServices.addEventListener('click',event=>{
      const button=event.target.closest('[data-mobile-service]');
      if(button)window.SanPaidLanding?.startBooking?.(button.dataset.mobileService);
    });
    enhanceReferencePages(landing);
    lockLandingPages(landing);

  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
