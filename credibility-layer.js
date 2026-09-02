(() => {
  'use strict';

  const API_ROOT='';
  let proofCache=null;
  let proofPromise=null;
  let judgeWrapped=false;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  const RESEARCH=[
    {title:'OWASP API Security Top 10',year:'Current guidance',url:'https://owasp.org/API-Security/',insight:'API authorization and access control must be explicit.',decision:'Server-side role checks and protected connected actions.'},
    {title:'PostgreSQL Documentation — Transactions',year:'Current documentation',url:'https://www.postgresql.org/docs/current/tutorial-transactions.html',insight:'Critical multi-step workflow updates should be atomic.',decision:'Booking, offer and payment-critical operations use transaction boundaries.'},
    {title:'Google Maps Routes API Overview',year:'Current documentation',url:'https://developers.google.com/maps/documentation/routes/overview',insight:'Distance, routes and ETA should come from geospatial routing services.',decision:'20 KM demo policy today; production route/ETA remains integration-ready.'},
    {title:'Person–Job Fit Research (arXiv:1810.04040)',year:'2018',url:'https://arxiv.org/abs/1810.04040',insight:'Matching quality depends on multiple fit factors, not proximity alone.',decision:'Eligibility gate first, explainable multi-factor ranking second.'},
    {title:'Ministry of Cooperation — Annual Report 2024–25',year:'2024–25',url:'https://cooperation.gov.in/sites/default/files/2026-03/511_Annual%20Report%202024-25%20%28Final%29.pdf',insight:'Digital transformation, cooperative data and stronger governance are policy priorities.',decision:'Cooperative/federation roles, command center and accountable workforce records.'},
    {title:'ILO — Skills Anticipation & Labour Market Information in India',year:'2012',url:'https://www.ilo.org/publications/review-institutional-arrangements-labour-market-information-and-skills',insight:'Skills planning depends on structured labour-market information and institutional coordination.',decision:'Demand → eligible capacity → skill-gap → training recommendation workflow.'}
  ];

  const PILOT_METRICS=[
    ['Booking Fulfilment Rate','Can verified capacity satisfy valid local demand?'],
    ['Average Match Time','How quickly does a request reach an accepted eligible worker?'],
    ['Worker Opportunity Distribution','Are opportunities concentrated among too few workers?'],
    ['Worker Acceptance Rate','Are offered jobs relevant and workable for workers?'],
    ['Complaint SLA Compliance','Are service issues resolved within cooperative accountability windows?'],
    ['Capacity Gap','Where does expected demand exceed eligible workforce capacity?'],
    ['Worker Utilization','How effectively is available verified capacity used?'],
    ['Customer Rating','How do customers rate completed services?'],
    ['Repeat Booking Rate','Do served customers return to the network?'],
    ['Verification Renewal Compliance','Are workers with required renewals kept current?']
  ];

  async function fetchProof(force=false){
    if(proofCache&&!force)return proofCache;
    if(proofPromise&&!force)return proofPromise;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8500);
    proofPromise=fetch(`${API_ROOT}/api/public-proof/summary`,{method:'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal})
      .then(async response=>{
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.ok)throw new Error(data.message||'Interactive proof is starting.');
        proofCache=data;
        return data;
      })
      .finally(()=>{clearTimeout(timer);proofPromise=null;});
    return proofPromise;
  }

  function originBadge(){return '<span class="cred-origin">● BACKEND-DERIVED DEMO DATA</span>';}

  function proofButton(kind,label){
    return `<div class="cred-verify" data-cred-block="${kind}">
      <div><b>Understand → Verify</b><span>Optional read-only system evidence. No login and no database mutation.</span></div>
      <button type="button" class="btn secondary small" data-cred-load="${kind}">${esc(label)}</button>
      <div class="cred-proof-result" data-cred-result="${kind}" aria-live="polite"></div>
    </div>`;
  }

  function validationCard(){
    return `<div class="cred-validation">
      <div><span class="cred-status planned">NEEDS TEAM VALIDATION</span><b>Real-world problem validation</b><p>No interview counts, testimonials or pilot results are claimed because verified field evidence has not been entered into the project.</p></div>
      <details><summary>Validation plan</summary><div class="cred-mini-grid"><span>Labour Cooperative Admin</span><span>Verified Worker</span><span>Local Customer</span><span>Federation / Society Representative</span></div><p>Validate worker verification, job assignment, complaint tracking, availability, skill gaps, welfare tracking and local capacity shortages.</p></details>
    </div>`;
  }

  function aiMap(){
    return `<div class="cred-ai-map">
      <div><span class="cred-ai-type rules">RULE-BASED SAFETY & POLICY</span><b>Deterministic</b><p>Verification · skill eligibility · availability · radius · document validity · service-start enforcement · worker consent · SLA timers.</p></div>
      <div><span class="cred-ai-type rank">EXPLAINABLE RANKING</span><b>Algorithmic</b><p>Distance · rating · workload · recent opportunity · schedule fit.</p></div>
      <div><span class="cred-ai-type ai">AI-ASSISTED</span><b>Advisory</b><p>Demand forecasting · capacity insight · skill-gap/training recommendations · multilingual voice assistance.</p></div>
      <strong>AI ADVISES. POLICY CONTROLS. HUMANS DECIDE.</strong>
    </div>`;
  }

  function sustainabilityAndKpis(){
    return `<div class="cred-final-grid">
      <article><span class="cred-kicker">SUSTAINABILITY MODEL</span><h3>Cooperative / Federation SaaS first</h3><p>Worker administration · verification · booking operations · complaint governance · capacity coordination · analytics · planning.</p><small>Optional policy-configurable service fee · future partner APIs. No fake pricing or revenue.</small></article>
      <article><span class="cred-kicker">PILOT SUCCESS METRICS</span><h3>Measure outcomes before claiming impact</h3><p>Fulfilment · match time · opportunity distribution · acceptance · SLA compliance · capacity gap · utilization · ratings · repeat use · renewal compliance.</p><small>Current numeric pilot results: <b>NOT CLAIMED</b>. Baseline, sample size and date range should appear only after a real pilot.</small></article>
    </div>`;
  }

  function researchExact(){
    return `<details class="cred-research-details"><summary>Exact reviewed research sources</summary><div class="cred-research-grid">${RESEARCH.map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener"><b>${esc(r.title)}</b><small>${esc(r.year)}</small><p><strong>Insight:</strong> ${esc(r.insight)}</p><p><strong>SanPaid decision:</strong> ${esc(r.decision)}</p></a>`).join('')}</div></details>`;
  }

  function selectorStep(){
    const shell=document.getElementById('selectorModeShell');
    if(!shell||shell.classList.contains('hidden'))return null;
    const active=shell.querySelector('[data-selector-step].active');
    if(active)return Number(active.dataset.selectorStep)+1;
    const text=shell.querySelector('#selectorMobileProgress b')?.textContent||'';
    const match=text.match(/Step\s+(\d+)/i);
    return match?Number(match[1]):null;
  }

  function appendOnce(root,key,html){
    if(!root||root.querySelector(`[data-cred-added="${key}"]`))return;
    const wrap=document.createElement('div');
    wrap.dataset.credAdded=key;
    wrap.innerHTML=html;
    while(wrap.firstChild)root.appendChild(wrap.firstChild);
  }

  function enhanceSelector(){
    const shell=document.getElementById('selectorModeShell');
    const content=shell?.querySelector('#selectorContent');
    const step=selectorStep();
    if(!content||!step)return;
    if(step===1)appendOnce(content,'validation',validationCard());
    if(step===3){
      appendOnce(content,'geo',`<div class="cred-geo-story"><span class="cred-status prototype">GEO MATCHING PROTOTYPE</span><b>20 KM policy radius</b><div class="cred-radius"><i style="left:9%">Rahul<br><small>1.8 KM · excluded</small></i><i style="left:12%">Amit<br><small>2.3 KM · eligible</small></i><i style="left:21%">Suresh<br><small>4.1 KM · eligible</small></i><em>0 KM</em><em>20 KM</em></div><small>Uses demo distance fields for proof. Production Routes/ETA is Future Integration Ready — no fake GPS/ETA is shown.</small></div>`);
      appendOnce(content,'matching-proof',proofButton('matching','Verify with Connected Data'));
    }
    if(step===4)appendOnce(content,'fallback-proof',proofButton('fallback','View Same-Booking Evidence'));
    if(step===6)appendOnce(content,'command-proof',proofButton('command','View Backend-Derived Preview'));
    if(step===7)appendOnce(content,'capacity-proof',proofButton('capacity','Verify Capacity Exchange'));
    if(step===8)appendOnce(content,'ai-map',aiMap());
    if(step===9)appendOnce(content,'exact-research',researchExact());
    if(step===10)appendOnce(content,'business-kpi',sustainabilityAndKpis());
  }

  function renderMatching(data){
    const m=data.matching;
    if(!m?.available)return `<div class="cred-unavailable">${esc(m?.message||'Matching proof is not available yet.')}</div>`;
    const first=m.rankedEligible?.[0];
    const excluded=m.closestExcluded;
    return `${originBadge()}<div class="cred-live-grid">
      <span><b>${esc(m.service)}</b><small>${esc(m.location)} · ${m.policyRadiusKm} KM policy</small></span>
      <span><b>${m.totalCandidates}</b><small>Candidates</small></span><span><b>${m.excludedBeforeRanking}</b><small>Excluded first</small></span><span><b>${m.verifiedEligible}</b><small>Eligible</small></span>
    </div><div class="cred-live-compare"><span class="bad"><b>${esc(excluded?.name||'—')} · ${Number(excluded?.distanceKm||0).toFixed(1)} KM</b><small>${esc(excluded?.reasons?.[0]||'Excluded')}</small></span><i>→</i><span class="good"><b>${esc(first?.name||'—')} · ${Number(first?.distanceKm||0).toFixed(1)} KM</b><small>Rank #${first?.rank||1} after eligibility</small></span></div>`;
  }

  function renderFallback(data){
    const f=data.fallback;
    if(!f?.available)return `<div class="cred-unavailable">${esc(f?.message||'Run the Connected Demo to create fallback evidence.')}</div>`;
    const offers=f.offers||[];
    const first=offers[0],second=offers[1];
    return `${originBadge()}<div class="cred-booking-code">Booking: <b>${esc(f.bookingCode)}</b> · preserved across offers</div><div class="cred-device-flow"><span><b>Customer Device</b><small>One service request</small></span><i>→</i><span><b>Shared Backend</b><small>${esc(f.bookingCode)}</small></span><i>→</i><span><b>${esc(first?.worker||'Worker A')}</b><small>${esc(first?.status||'Offer')}</small></span><i>→</i><span><b>Same Backend Booking</b><small>No new booking created</small></span><i>→</i><span><b>${esc(second?.worker||'Worker B')}</b><small>${esc(second?.status||'Second offer')}</small></span></div><div class="cred-event-list">${offers.map(o=>`<div><span>Attempt ${o.attempt}</span><b>${esc(o.worker)}</b><strong class="${o.status==='REJECTED'?'bad-text':o.status==='ACCEPTED'?'good-text':''}">${esc(o.status)}</strong>${o.rejectionReason?`<small>${esc(o.rejectionReason)}</small>`:''}</div>`).join('')}</div><div class="cred-proof-message">SAME BOOKING. NEW ELIGIBLE OFFER.</div>`;
  }

  function renderWorkerGrowth(data){
    const w=data.workerGrowth;
    if(!w?.available)return '<div class="cred-unavailable">Worker growth proof is unavailable.</div>';
    return `${originBadge()}<div class="cred-live-grid"><span><b>${esc(w.worker)}</b><small>${esc(w.verificationStatus)}</small></span><span><b>${Number(w.completedJobs||0)}</b><small>Recorded completed jobs</small></span><span><b>₹${Number(w.recordedDemoEarnings||0).toFixed(0)}</b><small>Recorded demo earnings</small></span><span><b>${Number(w.trainingRecommendations||0)}</b><small>Training recommendations</small></span></div><div class="cred-worker-roadmap"><span>Verified work history <b>Implemented</b></span><span>Training recommendation <b>Prototype-Demo</b></span><span>Certificate expiry automation <b>${esc(w.certificateExpiryAutomation)}</b></span><span>Insurance / welfare APIs <b>${esc(w.insuranceIntegration)}</b></span></div>`;
  }

  function renderCommand(data){
    const c=data.commandCenter;
    if(!c?.available)return '<div class="cred-unavailable">Command Center proof is unavailable.</div>';
    return `${originBadge()}<div class="cred-live-grid six"><span><b>${c.registeredWorkers}</b><small>Demo workers</small></span><span><b>${c.verifiedWorkers}</b><small>Verified</small></span><span><b>${c.availableWorkers}</b><small>Available</small></span><span><b>${c.pendingVerification}</b><small>Pending verification</small></span><span><b>${c.openDemoComplaints}</b><small>Open demo complaints</small></span><span><b>${c.openCapacityRequests}</b><small>Open capacity requests</small></span></div>`;
  }

  function renderCapacity(data){
    const c=data.capacity;
    if(!c?.available)return `<div class="cred-unavailable">${esc(c?.message||'Capacity proof is not available yet.')}</div>`;
    return `${originBadge()}<div class="cred-capacity-live"><span><b>${esc(c.requestingCooperative)}</b><small>Requests ${c.requestedWorkers} · ${esc(c.service)}</small></span><i>→</i><span><b>${esc(c.providingCooperative||'Provider cooperative')}</b><small>${esc(c.status)} · approved ${c.approvedWorkers}</small></span></div><div class="cred-worker-offers">${(c.workerOffers||[]).map(o=>`<span>${esc(o.worker)} <b>${esc(o.status)}</b></span>`).join('')||'<span>No worker offer recorded yet.</span>'}</div><div class="cred-proof-message">CAPACITY IS SHARED. WORKER CONSENT REMAINS REQUIRED.</div>`;
  }

  async function loadProof(kind,result,button){
    if(!result||!button)return;
    const original=button.textContent;
    button.disabled=true;
    button.textContent='Checking…';
    result.innerHTML='<div class="cred-loading">Connecting to sanitized read-only proof…</div>';
    try{
      const data=await fetchProof();
      if(kind==='matching')result.innerHTML=renderMatching(data);
      else if(kind==='fallback')result.innerHTML=renderFallback(data);
      else if(kind==='command')result.innerHTML=renderCommand(data);
      else if(kind==='capacity')result.innerHTML=renderCapacity(data);
    }catch(error){
      result.innerHTML='<div class="cred-unavailable"><b>Guided proof available.</b><br>Interactive proof is starting. Retry in a moment; the Selector Mode remains fully usable.</div>';
    }finally{
      button.disabled=false;
      button.textContent=original;
    }
  }

  function credibilityHtml(){
    return `<div class="judge-card cred-hero"><span class="judge-badge">TOP-1 CREDIBILITY CENTER</span><h2>Why should a selector believe this system?</h2><p>SanPaid separates backend-derived demo proof, explanatory scenarios, sandbox flows, planned validation and future integrations instead of blending them together.</p><div class="cred-legend"><span class="live">Implemented / backend-derived</span><span class="connected">Connected prototype</span><span class="sandbox">Sandbox / simulation</span><span class="future">Future integration</span><span class="risk">Excluded / needs validation</span></div></div>
    <div class="judge-grid two" style="margin-top:12px">
      <div class="judge-card">${validationCard()}<div class="cred-team-note"><b>Current status:</b> no fake interview/pilot counts. Replace “planned” only after real evidence exists.</div></div>
      <div class="judge-card"><span class="judge-badge">LIVE SYSTEM PROOF</span><h3>Public, sanitized and read-only</h3><p>Matching, fallback, demo command-center metrics and capacity proof can be checked without exposing admin mutation actions.</p><button class="btn primary small" type="button" data-cred-judge-proof>Load Backend Proof</button><div id="credJudgeProof" aria-live="polite"></div></div>
    </div>
    <div class="judge-card" style="margin-top:12px"><span class="judge-badge">PILOT SUCCESS METRICS</span><h3>What a real pilot should measure</h3><div class="cred-kpi-table">${PILOT_METRICS.map(([m,w])=>`<div><b>${esc(m)}</b><span>${esc(w)}</span></div>`).join('')}</div><div class="judge-note">No numeric pilot result is claimed. Add baseline, sample size and date range only after a real pilot.</div></div>
    <div class="judge-card" style="margin-top:12px"><span class="judge-badge">AI RESPONSIBILITY MAP</span>${aiMap()}</div>
    <div class="judge-grid two" style="margin-top:12px">
      <div class="judge-card"><span class="judge-badge">WORKER WELFARE & CONTINUOUS TRUST</span><h3>Career record can grow without faking integrations</h3><div class="cred-trust-life"><span>Registration <b>Implemented</b></span><i>→</i><span>Identity / Skill Verification <b>Implemented</b></span><i>→</i><span>Cooperative Approval <b>Implemented</b></span><i>→</i><span>Service History / Ratings <b>Implemented</b></span><i>→</i><span>Expiry Monitoring <b>Future Integration Ready</b></span><i>→</i><span>Re-verification <b>Roadmap</b></span></div><p>Before verification: hidden from matching. After verification: eligible. Expired required credentials should pause eligibility pending review when expiry automation is implemented.</p></div>
      <div class="judge-card"><span class="judge-badge">SUSTAINABILITY</span><h3>Cooperative / Federation SaaS first</h3><p>Primary value: administration, verification, booking operations, complaints, capacity, analytics and planning.</p><div class="judge-note">Optional policy-configurable service fee · future partner/welfare/insurance APIs. No fake pricing or revenue projection.</div></div>
    </div>
    <div class="judge-card" style="margin-top:12px"><span class="judge-badge">ROLLOUT STRATEGY</span><div class="cred-rollout"><span><b>Phase 1</b>Single Labour Cooperative</span><i>→</i><span><b>Phase 2</b>District Multi-Cooperative Capacity</span><i>→</i><span><b>Phase 3</b>Federation Planning & Governance</span><i>→</i><span><b>Phase 4</b>Multi-District / Multi-State Policy Network</span></div><div class="judge-note">Current prototype: Vercel frontend + shared backend + PostgreSQL. CDN/WAF/load balancing/Redis/read replicas/object storage/backup-DR/monitoring remain production architecture, not live claims.</div></div>
    <div class="judge-card" style="margin-top:12px"><span class="judge-badge">COMPETITIVE POSITIONING</span><h3>Category comparison — not unsupported competitor claims</h3><div class="cred-compare-table"><div><b>Capability</b><b>Typical service marketplace focus</b><b>SanPaid focus</b></div><div><span>Service booking</span><span>Core</span><span>Core</span></div><div><span>Verified eligibility before ranking</span><span>Varies by platform</span><span>Core</span></div><div><span>Worker Accept / Decline</span><span>Varies by operating model</span><span>Core</span></div><div><span>Cooperative / federation governance</span><span>Not core cooperative-governance focus</span><span>Core</span></div><div><span>Cross-cooperative capacity</span><span>Not core cooperative-governance focus</span><span>Core</span></div><div><span>Demand → skill planning</span><span>Not core customer-marketplace focus</span><span>Core planning layer</span></div></div></div>
    <div class="judge-card" style="margin-top:12px"><span class="judge-badge">RESEARCH SOURCES</span>${researchExact()}</div>
    <div class="judge-card" style="margin-top:12px"><span class="judge-badge">RELEASE DEVICE QA</span><h3>Manual evidence still required</h3><p>Required widths: 360 · 375 · 390 · 412 · 430 · 768 · 1024 · 1440. Browsers: Chrome desktop/Android, Edge desktop and Safari/iPhone if available.</p><span class="cred-status planned">NEEDS TEAM VALIDATION</span><div class="judge-note">Do not mark PASS until a real device/browser test is performed and recorded with device, browser, date, tester and result.</div></div>`;
  }

  async function renderJudgeProof(root,button){
    root.innerHTML='<div class="cred-loading">Loading public read-only proof…</div>';
    button.disabled=true;
    try{
      const data=await fetchProof(true);
      root.innerHTML=`<div class="cred-judge-proof-grid"><div><b>Fair Matching</b>${renderMatching(data)}</div><div><b>Same Booking / Cross-Device Flow</b>${renderFallback(data)}</div><div><b>Command Center</b>${renderCommand(data)}</div><div><b>Capacity Exchange</b>${renderCapacity(data)}</div><div><b>Worker Welfare / Growth Record</b>${renderWorkerGrowth(data)}</div></div>`;
    }catch{
      root.innerHTML='<div class="cred-unavailable">Public proof is temporarily starting. No guided content is blocked.</div>';
    }finally{button.disabled=false;}
  }

  function installJudgeTab(){
    const shell=document.getElementById('sihJudgeShell');
    const tabs=shell?.querySelector('.judge-tabs');
    const content=shell?.querySelector('#judgeContent');
    if(!tabs||!content||tabs.querySelector('[data-judge-tab="credibility"]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='judge-tab';
    button.dataset.judgeTab='credibility';
    button.textContent='Credibility & Validation';
    tabs.appendChild(button);
    const section=document.createElement('section');
    section.className='judge-section';
    section.id='judge-credibility';
    section.innerHTML=credibilityHtml();
    content.appendChild(section);
    button.addEventListener('click',()=>{
      content.querySelectorAll('.judge-tab').forEach(x=>x.classList.toggle('active',x===button));
      content.querySelectorAll('.judge-section').forEach(x=>x.classList.toggle('active',x===section));
    });
    section.querySelector('[data-cred-judge-proof]')?.addEventListener('click',event=>renderJudgeProof(section.querySelector('#credJudgeProof'),event.currentTarget));
  }

  function wrapJudgeOpen(){
    if(judgeWrapped||!window.SanPaidJudgeMode?.open)return;
    const original=window.SanPaidJudgeMode.open.bind(window.SanPaidJudgeMode);
    window.SanPaidJudgeMode.open=async(...args)=>{
      const result=await original(...args);
      scheduleJudgeInstall();
      return result;
    };
    judgeWrapped=true;
  }

  function scheduleJudgeInstall(){
    [0,450,1200,2600].forEach(ms=>setTimeout(installJudgeTab,ms));
  }

  function onClick(event){
    if(event.target.closest?.('#sihJudgeShell'))scheduleJudgeInstall();
    const load=event.target.closest?.('[data-cred-load]');
    if(load){
      event.preventDefault();
      const kind=load.dataset.credLoad;
      const result=load.closest('[data-cred-block]')?.querySelector(`[data-cred-result="${kind}"]`);
      loadProof(kind,result,load);
      return;
    }
    if(event.target.closest?.('#selectorModeShell'))setTimeout(enhanceSelector,0);
  }

  function start(){
    wrapJudgeOpen();
    document.addEventListener('click',onClick);
    document.addEventListener('keydown',event=>{if(event.target.closest?.('#selectorModeShell'))setTimeout(enhanceSelector,0);});
    setTimeout(()=>{enhanceSelector();scheduleJudgeInstall();},180);
    window.SanPaidCredibility={enhanceSelector,installJudgeTab,fetchProof};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
