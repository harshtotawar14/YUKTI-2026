(() => {
  'use strict';

  const BACKEND='https://sanpaid-sih-2026.onrender.com';
  const TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const PASSWORD='Demo@2026';
  const ACCOUNTS={
    COOPERATIVE_ADMIN:{email:'admin.connected@sanpaid.demo',label:'Karad Cooperative Admin'},
    FEDERATION_ADMIN:{email:'federation.connected@sanpaid.demo',label:'Federation Admin'}
  };
  const TABS=[
    ['golden','Golden Demo'],
    ['matching','Fair Matching'],
    ['trust','Trust & Verification'],
    ['overview','Command Center'],
    ['capacity','Capacity Exchange'],
    ['complaint','Complaint / SLA'],
    ['planning','Demand & Skill Planning'],
    ['research','Research & Architecture'],
    ['security','Security & Scale'],
    ['welfare','Welfare & Business'],
    ['control','Demo Control']
  ];

  let token='';
  let user=null;
  let activeComplaintId=null;
  let activeCapacityId=null;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const human=s=>({
    PENDING_WORKER_ACCEPTANCE:'Waiting for Worker Response',
    FINDING_REPLACEMENT:'Finding Replacement Worker',
    CUSTOMER_CONFIRMED:'Customer Confirmed',
    IDENTITY_VERIFIED:'Identity Verified',
    WORKERS_OFFERED:'Workers Offered · Consent Pending',
    IN_REVIEW:'Under Review'
  }[String(s||'')]||String(s||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase()));

  const getToken=()=>{try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return ''}};
  const setToken=v=>{token=v||'';try{v?sessionStorage.setItem(TOKEN_KEY,v):sessionStorage.removeItem(TOKEN_KEY)}catch{}};

  function friendlyError(status){
    if(status===401)return 'Judge demo session expired. Please log in again.';
    if(status===403)return 'This action is not available for this demo role.';
    if(status===404)return 'The requested demo proof is not available yet.';
    if(status===409)return 'The demo state changed. Refresh this proof and retry.';
    if(status===429)return 'Too many requests. Please wait a moment and retry.';
    if(status>=500)return 'The connected service is temporarily unavailable. Please retry.';
    return 'This demo action could not be completed. Please retry.';
  }

  async function api(path,opt={}){
    const headers=new Headers(opt.headers||{});
    if(opt.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    if(token||getToken())headers.set('Authorization',`Bearer ${token||getToken()}`);
    const r=await fetch(BACKEND+path,{...opt,headers,mode:'cors',credentials:'omit',cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){
      const e=new Error(data.message||friendlyError(r.status));
      e.status=r.status;
      throw e;
    }
    return data;
  }

  const post=(path,body={})=>api(path,{method:'POST',body:JSON.stringify(body)});

  function shell(){
    let root=document.getElementById('sihJudgeShell');
    if(root)return root;
    root=document.createElement('section');
    root.id='sihJudgeShell';
    root.className='judge-hidden';
    root.innerHTML=`<header class="judge-top">
      <div><div class="brand">San<span>Paid</span></div><small>SIH Judge Mode · Working Proof + Research</small></div>
      <div class="judge-top-actions">
        <span id="judgeHealth" class="judge-live">Checking backend…</span>
        <button class="btn ghost small" id="judgeClose" aria-label="Close SIH Judge Mode">✕</button>
      </div>
    </header><main class="judge-main" id="judgeContent"></main>`;
    document.body.appendChild(root);
    root.querySelector('#judgeClose').onclick=close;
    return root;
  }

  async function open(){
    const root=shell();
    root.classList.remove('judge-hidden');
    document.body.style.overflow='hidden';
    await health();
    token=getToken();
    if(token){
      try{
        const me=await api('/api/connected/auth/me');
        user=me.user;
        return renderDashboard();
      }catch{
        setToken('');
      }
    }
    renderLogin();
  }

  function close(){
    shell().classList.add('judge-hidden');
    document.body.style.overflow='';
    document.body.classList.remove('judge-presentation');
  }

  async function health(){
    const el=shell().querySelector('#judgeHealth');
    try{
      const h=await api('/api/connected/health');
      el.textContent=h.ok?'● Backend Online':'● Backend Unavailable';
      el.style.color=h.ok?'#91e6b8':'#ffb0b0';
    }catch{
      el.textContent='● Backend Offline';
      el.style.color='#ffb0b0';
    }
  }

  function renderLogin(){
    const c=shell().querySelector('#judgeContent');
    c.innerHTML=`<div class="judge-login judge-card">
      <span class="judge-badge">ISOLATED DEMO AUTH</span>
      <h2 style="margin-top:12px">Open SIH Judge Mode</h2>
      <p>Use a dedicated cooperative or federation identity. Technical proof stays here so Customer and Worker screens remain simple.</p>
      <div class="judge-grid two" style="margin:16px 0">
        ${Object.entries(ACCOUNTS).map(([role,a])=>`<button class="judge-card" data-judge-role="${role}" style="text-align:left;cursor:pointer">
          <h3>${role==='COOPERATIVE_ADMIN'?'🏢':'🌐'} ${esc(a.label)}</h3>
          <p>${role==='COOPERATIVE_ADMIN'?'Workforce operations, trust, matching, SLA and capacity.':'Regional governance, cross-cooperative coordination and planning.'}</p>
          <div class="judge-account">${esc(a.email)}</div>
        </button>`).join('')}
      </div>
      <div id="judgeLoginError" aria-live="polite"></div>
      <div class="judge-note">Password for isolated SIH demo identities: <b>${PASSWORD}</b></div>
    </div>`;
    c.querySelectorAll('[data-judge-role]').forEach(b=>b.onclick=()=>login(b.dataset.judgeRole));
  }

  async function login(role){
    const c=shell().querySelector('#judgeContent');
    const error=c.querySelector('#judgeLoginError');
    if(error)error.innerHTML='<div class="judge-note">Authenticating with connected backend…</div>';
    try{
      const a=ACCOUNTS[role];
      const r=await fetch(BACKEND+'/api/connected/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({identifier:a.email,password:PASSWORD,role,remember:false}),
        mode:'cors',
        credentials:'omit',
        cache:'no-store'
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw Object.assign(new Error(d.message||friendlyError(r.status)),{status:r.status});
      setToken(d.demoToken);
      user=d.user;
      renderDashboard();
    }catch(e){
      if(error)error.innerHTML=`<div class="judge-error">${esc(e.message||friendlyError(e.status||500))}</div>`;
    }
  }

  async function logout(){
    try{await post('/api/connected/auth/logout')}catch{}
    setToken('');
    user=null;
    renderLogin();
  }

  function renderDashboard(){
    const c=shell().querySelector('#judgeContent');
    c.innerHTML=`<section class="judge-hero">
      <span class="judge-badge">RESEARCH-BACKED CONNECTED PROTOTYPE</span>
      <h1>SanPaid SIH Research & System Proof</h1>
      <p>Customer Demand → Verified Eligibility → Fair Allocation → Worker Choice → Trusted Service → Governance → Capacity & Skill Planning.</p>
      <div class="judge-actions">
        <button class="btn secondary small" id="judgePresentation">Presentation Focus</button>
        <button class="btn danger small" id="judgeLogout">Logout</button>
      </div>
    </section>
    <div class="judge-tabs" aria-label="SIH Judge Mode sections">
      ${TABS.map(([id,label],i)=>`<button class="judge-tab ${i===0?'active':''}" data-judge-tab="${id}">${label}</button>`).join('')}
    </div>
    ${TABS.map(([id],i)=>`<section class="judge-section ${i===0?'active':''}" id="judge-${id}"><div class="judge-card">Loading ${id} proof…</div></section>`).join('')}`;

    c.querySelector('#judgeLogout').onclick=logout;
    c.querySelector('#judgePresentation').onclick=()=>document.body.classList.toggle('judge-presentation');
    c.querySelectorAll('[data-judge-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.judgeTab));
    loadTab('golden');
  }

  function switchTab(id){
    const c=shell().querySelector('#judgeContent');
    c.querySelectorAll('.judge-tab').forEach(x=>x.classList.toggle('active',x.dataset.judgeTab===id));
    c.querySelectorAll('.judge-section').forEach(x=>x.classList.toggle('active',x.id===`judge-${id}`));
    loadTab(id);
  }

  async function loadTab(id){
    if(id==='golden')return loadGolden();
    if(id==='matching')return loadMatching();
    if(id==='trust')return loadTrust();
    if(id==='overview')return loadOverview();
    if(id==='capacity')return loadCapacity();
    if(id==='complaint')return loadComplaint();
    if(id==='planning')return loadPlanning();
    if(id==='research')return loadResearch();
    if(id==='security')return loadSecurity();
    if(id==='welfare')return loadWelfare();
    if(id==='control')return loadControl();
  }

  function errorBox(root,e){
    root.innerHTML=`<div class="judge-error">${esc(e.message||friendlyError(e.status||500))} <button class="btn secondary small" data-retry>Retry</button></div>`;
    root.querySelector('[data-retry]')?.addEventListener('click',()=>loadTab(root.id.replace('judge-','')));
  }

  function checklistHtml(checks={}){
    const labels={
      customerActive:'Customer Account',
      workerAReady:'Worker A Available',
      workerBReady:'Worker B Available',
      cooperativeAdminActive:'Cooperative Admin',
      federationAdminActive:'Federation Admin',
      unverifiedProofReady:'Unverified Worker Proof',
      noStalePendingOffers:'No Stale Pending Offers'
    };
    return `<div class="judge-checks">${Object.entries(checks).map(([k,v])=>`<div class="judge-check ${v?'ok':'no'}">${esc(labels[k]||human(k))}</div>`).join('')}</div>`;
  }

  async function loadGolden(){
    const root=document.getElementById('judge-golden');
    root.innerHTML='<div class="judge-card">Checking Golden Demo readiness…</div>';
    try{
      const d=await api('/api/connected/judge/readiness');
      root.innerHTML=`<div class="judge-grid two">
        <div class="judge-card">
          <span class="judge-badge ${d.ok?'':'demo'}">${d.ok?'GOLDEN DEMO READY':'READINESS ATTENTION'}</span>
          <h2 style="margin-top:10px">3-Device Demo Readiness</h2>
          <p>Checks come from the connected backend/demo dataset — not hardcoded green ticks.</p>
          <div class="judge-readiness-box">${checklistHtml(d.checks||{})}</div>
          <div class="judge-actions">
            <button class="btn primary" data-open-connected-role="CUSTOMER">Open Customer</button>
            <button class="btn secondary" data-open-connected-role="WORKER_A">Open Worker A</button>
            <button class="btn secondary" data-open-connected-role="WORKER_B">Open Worker B</button>
          </div>
        </div>
        <div class="judge-card">
          <span class="judge-badge">3-MINUTE GOLDEN FLOW</span>
          <h3 style="margin-top:10px">Prove the system, not a feature list</h3>
          <div class="judge-sequence">
            <div><b>1</b><span>Customer Marathi/Hindi/English request</span></div>
            <div><b>2</b><span>Eligibility First + closer unverified worker excluded</span></div>
            <div><b>3</b><span>Worker A receives offer and declines</span></div>
            <div><b>4</b><span>Worker B receives the same booking and accepts</span></div>
            <div><b>5</b><span>Dual service-start verification</span></div>
            <div><b>6</b><span>Command Center + Capacity Exchange</span></div>
          </div>
          <div class="judge-note">Connected Demo is primary proof. Browser-local demo remains fallback/rehearsal only.</div>
        </div>
      </div>
      <div class="judge-card" style="margin-top:12px">
        <h3>What the Golden Demo proves</h3>
        <div class="judge-grid three">
          <div class="mini-proof"><b>Trust</b><p>Eligibility and service-start checks before work begins.</p></div>
          <div class="mini-proof"><b>Fair Opportunity</b><p>Ranking happens after eligibility, with worker choice preserved.</p></div>
          <div class="mini-proof"><b>Governance</b><p>Cooperative/federation operations continue after booking.</p></div>
        </div>
      </div>`;
      root.querySelectorAll('[data-open-connected-role]').forEach(btn=>btn.onclick=()=>{
        const role=btn.dataset.openConnectedRole;
        close();
        window.ConnectedSanPaid?.open?.(role);
      });
    }catch(e){errorBox(root,e)}
  }

  async function loadOverview(){
    const root=document.getElementById('judge-overview');
    root.innerHTML='<div class="judge-card">Loading database-derived Command Center data…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const m=d.metrics||{};
      root.innerHTML=`<div class="judge-card judge-section-intro">
        <span class="judge-badge">COOPERATIVE COMMAND CENTER</span>
        <h2 style="margin-top:10px">Workforce Operations · Trust · Capacity · Service Delivery</h2>
        <p>Operational values below are queried from the connected backend. No random judge metrics are generated.</p>
      </div>
      <div class="judge-grid" style="margin-top:12px">
        <div class="judge-card judge-kpi"><span>Registered Workers</span><b>${Number(m.totalWorkers||0)}</b><p>Database-derived</p></div>
        <div class="judge-card judge-kpi"><span>Verified Workers</span><b>${Number(m.verifiedWorkers||0)}</b><p>Eligibility source</p></div>
        <div class="judge-card judge-kpi"><span>Available Now</span><b>${Number(m.availableWorkers||0)}</b><p>Verified + available</p></div>
        <div class="judge-card judge-kpi"><span>Open Complaints</span><b>${Number(m.openComplaints||0)}</b><p>SLA-governed</p></div>
      </div>
      <div class="judge-grid two" style="margin-top:12px">
        <div class="judge-card"><h3>Cooperative Network</h3><div class="judge-coop-list">${(d.cooperatives||[]).map(x=>`<div class="judge-row"><span><b>${esc(x.name)}</b><br><small>${esc(x.city||'Maharashtra')}</small></span><span>${Number(x.available||0)} available / ${Number(x.workers||0)} workers</span></div>`).join('')||'<p>No cooperative data.</p>'}</div></div>
        <div class="judge-card"><h3>Governance Snapshot</h3><div class="judge-row"><span>Active bookings</span><b>${Number(m.activeBookings||0)}</b></div><div class="judge-row"><span>SLA breached</span><b>${Number(m.slaBreached||0)}</b></div><div class="judge-row"><span>Recorded payments</span><b>₹${Number(m.recordedPayments||0).toLocaleString('en-IN')}</b></div><div class="judge-note" style="margin-top:12px">Cooperatives use this layer for operations; Federation focuses on regional capacity, escalation and planning.</div></div>
      </div>`;
    }catch(e){errorBox(root,e)}
  }

  async function loadMatching(){
    const root=document.getElementById('judge-matching');
    root.innerHTML='<div class="judge-card">Finding latest Connected Customer booking…</div>';
    try{
      const latest=await api('/api/connected/judge/latest-demo-booking');
      if(!latest.booking){
        root.innerHTML='<div class="judge-card"><h3>No connected booking yet</h3><p>Create a Customer Connected Demo booking first, then return here to inspect eligibility and ranking.</p></div>';
        return;
      }
      const d=await api(`/api/connected/judge/match/${latest.booking.id}`);
      const checkLabel=k=>({identityVerified:'Identity Verified',skillVerified:'Correct Skill Verified',available:'Worker Available',withinRadius:'Within Policy Radius',documentsValid:'No Blocking Document',noScheduleConflict:'No Schedule Conflict'}[k]||k);
      const card=x=>`<div class="judge-card"><div class="judge-row"><span><span class="judge-badge">#${x.rank||'—'} ELIGIBLE</span><h3 style="margin-top:8px">${esc(x.name)}</h3><small>${esc(x.cooperative||'Cooperative')} · ${x.distance} KM · Rating ${x.rating}</small></span><b>${x.score??'—'}%</b></div><div class="judge-checks">${Object.entries(x.checks||{}).map(([k,v])=>`<div class="judge-check ${v?'ok':'no'}">${esc(checkLabel(k))}</div>`).join('')}</div></div>`;
      const excluded=(d.excluded||[])[0];
      root.innerHTML=`<div class="judge-card">
        <span class="judge-badge">${esc(d.policy.principle)}</span>
        <h2 style="margin-top:10px">${esc(d.booking.bookingCode)} · ${esc(d.booking.service)}</h2>
        <p>Stage 1 removes ineligible workers. Stage 2 ranks only the eligible pool. Stage 3 preserves worker Accept / Decline choice.</p>
        <div class="judge-note">Ranking weights in this deterministic demo: Distance 45% · Rating 35% · Fairness / workload 20%. Default demo radius: ${d.policy.defaultRadiusKm} KM.</div>
      </div>
      <div class="judge-grid two" style="margin-top:12px">
        ${(d.eligible||[]).slice(0,2).map(card).join('')||'<div class="judge-card">No eligible candidates.</div>'}
        ${excluded?`<div class="judge-card"><span class="judge-badge exclude">EXCLUDED BEFORE RANKING</span><h3 style="margin-top:10px">${esc(excluded.name)}</h3><p><b>${excluded.distance} KM away</b> — closer distance cannot override verification or safety.</p><div class="judge-checks">${Object.entries(excluded.checks||{}).map(([k,v])=>`<div class="judge-check ${v?'ok':'no'}">${esc(checkLabel(k))}</div>`).join('')}</div><div class="judge-note" style="margin-top:10px">Reason: ${esc((excluded.reasons||[]).join(', ')||'Eligibility requirement not met')}</div></div>`:''}
      </div>`;
    }catch(e){errorBox(root,e)}
  }

  function loadTrust(){
    const root=document.getElementById('judge-trust');
    root.innerHTML=`<div class="judge-grid two">
      <div class="judge-card">
        <span class="judge-badge">TRUSTED SERVICE START</span>
        <h2 style="margin-top:10px">Two independent checks before work begins</h2>
        <div class="trust-flow">
          <div><b>1</b><span>Worker arrives</span></div>
          <div><b>2</b><span>Booking / location validation</span></div>
          <div><b>3</b><span>Sandbox identity/liveness check</span></div>
          <div><b>4</b><span>One-time booking verification code</span></div>
          <div><b>5</b><span>Customer confirms booked worker</span></div>
          <div><b>6</b><span>Backend enables Start Service only when both checks are complete</span></div>
        </div>
        <div class="judge-note"><b>Rule:</b> Verified Identity + Customer Confirmation are both required. Frontend button state is not the only enforcement; backend start logic checks the same rule.</div>
      </div>
      <div class="judge-card">
        <span class="judge-badge demo">CONTINUOUS TRUST ROADMAP</span>
        <h3 style="margin-top:10px">Worker verification is not treated as a one-time badge</h3>
        <div class="verification-cycle">
          <span>Registration</span><span>Identity</span><span>Documents</span><span>Skill</span><span>Cooperative Approval</span><span>Verified Worker ID</span><span>Job History</span><span>Ratings / Complaints</span><span>Re-verification</span>
        </div>
        <div class="judge-row"><span>Current prototype</span><b>Identity / skill / document eligibility</b></div>
        <div class="judge-row"><span>Future Integration Ready</span><b>Document-expiry monitoring + renewal alerts</b></div>
        <div class="judge-note">No production biometric/KYC provider is claimed. Identity/liveness remains explicitly sandboxed.</div>
      </div>
    </div>
    <div class="judge-card" style="margin-top:12px">
      <h3>Trust data boundaries</h3>
      <div class="judge-grid three">
        <div class="mini-proof"><b>Before Verification</b><p>Worker public visibility should remain restricted until authorized cooperative approval.</p></div>
        <div class="mini-proof"><b>During Service</b><p>Booked worker identity and one-time verification are tied to the booking.</p></div>
        <div class="mini-proof"><b>After Service</b><p>Rating, complaint and service history update the long-term trust profile.</p></div>
      </div>
    </div>`;
  }

  async function loadCapacity(){
    const root=document.getElementById('judge-capacity');
    root.innerHTML='<div class="judge-card">Loading capacity exchange state…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const latest=(d.capacityRequests||[])[0];
      activeCapacityId=latest?.id||null;
      root.innerHTML=`<div class="judge-grid two">
        <div class="judge-card">
          <span class="judge-badge demo">DEMO GOVERNANCE SCENARIO</span>
          <h2 style="margin-top:10px">Cross-Cooperative Capacity Exchange</h2>
          <p>When one cooperative has shortage, it can request nearby capacity. Approval creates eligible worker offers — it never silently transfers a worker.</p>
          <div class="capacity-story">
            <span>Karad Shortage</span><b>→</b><span>Capacity Request</span><b>→</b><span>Satara Approval</span><b>→</b><span>Worker Offer</span><b>→</b><span>Worker Choice</span>
          </div>
          <div class="judge-actions">
            <button class="btn primary" id="judgeCapacityCreate">Request Capacity</button>
            ${latest&&latest.status==='REQUESTED'?'<button class="btn secondary" id="judgeCapacityApprove">Approve Request</button>':''}
          </div>
          <div id="judgeCapacityMsg" aria-live="polite"></div>
        </div>
        <div class="judge-card">
          <h3>Latest Capacity Request</h3>
          ${latest?`<div class="judge-row"><span>Request</span><b>${esc(latest.requestCode)}</b></div><div class="judge-row"><span>Status</span><b>${esc(human(latest.status))}</b></div><div class="judge-row"><span>Workers requested</span><b>${Number(latest.requestedWorkers||0)}</b></div><div class="judge-note">After approval, open Worker B Connected Demo. Worker consent remains visible through Accept / Reject.</div>`:'<p>No active demo capacity request.</p>'}
        </div>
      </div>`;
      root.querySelector('#judgeCapacityCreate')?.addEventListener('click',async()=>{
        const msg=root.querySelector('#judgeCapacityMsg');
        msg.innerHTML='<div class="judge-note">Creating governed capacity request…</div>';
        try{
          const r=await post('/api/connected/judge/capacity/request',{service:'Electrician',requestingCooperativeName:'Karad',providingCooperativeName:'Satara',requestedWorkers:1,zone:'Karad Zone 1'});
          activeCapacityId=r.request.id;
          msg.innerHTML='<div class="judge-success">Capacity request created. Provider/federation approval is now required.</div>';
          setTimeout(loadCapacity,500);
        }catch(e){msg.innerHTML=`<div class="judge-error">${esc(e.message)}</div>`}
      });
      root.querySelector('#judgeCapacityApprove')?.addEventListener('click',async()=>{
        const msg=root.querySelector('#judgeCapacityMsg');
        msg.innerHTML='<div class="judge-note">Checking eligible Satara capacity…</div>';
        try{
          const r=await post(`/api/connected/judge/capacity/${latest.id}/approve`);
          msg.innerHTML=`<div class="judge-success">${esc(r.message)}</div>`;
          setTimeout(loadCapacity,700);
        }catch(e){msg.innerHTML=`<div class="judge-error">${esc(e.message)}</div>`}
      });
    }catch(e){errorBox(root,e)}
  }

  async function loadComplaint(){
    const root=document.getElementById('judge-complaint');
    root.innerHTML='<div class="judge-card">Loading complaint and SLA proof…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const cp=(d.complaints||[])[0];
      activeComplaintId=cp?.id||null;
      let timeline=[];
      if(activeComplaintId)timeline=await api(`/api/connected/judge/complaints/${activeComplaintId}/timeline`);
      root.innerHTML=`<div class="judge-grid two">
        <div class="judge-card">
          <span class="judge-badge demo">DEMO SIMULATION</span>
          <h2 style="margin-top:10px">Complaint SLA Escalation</h2>
          <p>Operational SLA logic is demonstrated without pretending that real hours elapsed.</p>
          <div class="sla-flow"><span>L1 Support</span><b>→</b><span>L2 Cooperative</span><b>→</b><span>L3 Federation</span></div>
          <div class="judge-actions">
            <button class="btn primary" id="judgeComplaintCreate">Create Demo Complaint</button>
            ${cp&&Number(cp.escalationLevel||1)<3?'<button class="btn secondary" id="judgeSlaBreach">Simulate SLA Breach</button>':''}
          </div>
          <div id="judgeComplaintMsg" aria-live="polite"></div>
        </div>
        <div class="judge-card">
          <h3>Current SLA State</h3>
          ${cp?`<div class="judge-row"><span>Status</span><b>${esc(human(cp.status))}</b></div><div class="judge-row"><span>Escalation</span><b>L${Number(cp.escalationLevel||1)}</b></div><div class="judge-row"><span>SLA breached</span><b>${cp.slaBreached?'YES':'NO'}</b></div><div class="judge-timeline" style="margin-top:12px">${timeline.map(x=>`<div class="judge-event"><b>${esc(x.eventType)}</b><p>${esc(x.message)}</p></div>`).join('')}</div>`:'<p>Create a demo complaint after a connected booking exists.</p>'}
        </div>
      </div>`;
      root.querySelector('#judgeComplaintCreate')?.addEventListener('click',async()=>{
        const msg=root.querySelector('#judgeComplaintMsg');
        msg.innerHTML='<div class="judge-note">Creating L1 demo complaint…</div>';
        try{
          await post('/api/connected/judge/complaint-demo');
          msg.innerHTML='<div class="judge-success">Demo complaint created at L1.</div>';
          setTimeout(loadComplaint,500);
        }catch(e){msg.innerHTML=`<div class="judge-error">${esc(e.message)}</div>`}
      });
      root.querySelector('#judgeSlaBreach')?.addEventListener('click',async()=>{
        const msg=root.querySelector('#judgeComplaintMsg');
        msg.innerHTML='<div class="judge-note">Advancing DEMO SLA state…</div>';
        try{
          const r=await post(`/api/connected/judge/complaints/${cp.id}/simulate-breach`);
          msg.innerHTML=`<div class="judge-success">DEMO SIMULATION: escalated to ${esc(r.label)}.</div>`;
          setTimeout(loadComplaint,500);
        }catch(e){msg.innerHTML=`<div class="judge-error">${esc(e.message)}</div>`}
      });
    }catch(e){errorBox(root,e)}
  }

  async function loadPlanning(){
    const root=document.getElementById('judge-planning');
    root.innerHTML='<div class="judge-card">Calculating demand and eligible capacity…</div>';
    try{
      const d=await api('/api/connected/judge/planning');
      const gap=Number(d.capacityGap||0);
      root.innerHTML=`<div class="judge-card judge-section-intro">
        <span class="judge-badge">AI-ASSISTED · ADVISORY</span>
        <h2 style="margin-top:10px">Demand → Capacity → Skill Gap → Governed Action</h2>
        <p>AI output is useful only when it leads to an operational decision and remains confidence-aware.</p>
      </div>
      <div class="judge-grid" style="margin-top:12px">
        <div class="judge-card judge-kpi"><span>30-day Demand</span><b>${Number(d.historicalDemand30d||0)}</b><p>Observed bookings</p></div>
        <div class="judge-card judge-kpi"><span>Expected Demand</span><b>${Number(d.expectedDemand||0)}</b><p>${esc(d.forecastMethod)}</p></div>
        <div class="judge-card judge-kpi"><span>Eligible Capacity</span><b>${Number(d.eligibleCapacity||0)}</b><p>Verified + skill + available</p></div>
        <div class="judge-card judge-kpi"><span>Capacity Gap</span><b>${gap>0?'-'+gap:Math.abs(gap)}</b><p>${gap>0?'Shortage':'No shortage detected'}</p></div>
      </div>
      <div class="judge-grid two" style="margin-top:12px">
        <div class="judge-card">
          <span class="judge-badge">Confidence: ${esc(d.confidence)}</span>
          <h3 style="margin-top:10px">Recommended Operational Actions</h3>
          <div class="judge-checks">${(d.recommendedActions||[]).map(x=>`<div class="judge-check ok">${esc(human(x))}</div>`).join('')||'<div class="judge-check">No action required</div>'}</div>
          <div class="judge-note" style="margin-top:10px">${esc(d.claim)} No fake model accuracy is shown.</div>
        </div>
        <div class="judge-card">
          <span class="judge-badge demo">HUMAN APPROVAL REQUIRED</span>
          <h3 style="margin-top:10px">Skill-Gap → Training Recommendation</h3>
          <p>Recommendation never auto-verifies a skill. Cooperative/human approval remains required before any future skill verification.</p>
          <button class="btn primary" id="judgeRecommendTraining">Recommend Training</button>
          <div id="judgeTrainingMsg" aria-live="polite"></div>
        </div>
      </div>`;
      const btn=root.querySelector('#judgeRecommendTraining');
      btn.onclick=async()=>{
        if(btn.disabled)return;
        btn.disabled=true;
        btn.textContent='Creating Recommendation…';
        const msg=root.querySelector('#judgeTrainingMsg');
        try{
          const out=await post('/api/connected/judge/training/recommend-default');
          msg.innerHTML=`<div class="judge-success"><b>${esc(out.candidate?.name||'Worker')}</b>: ${esc(out.message||'Training recommendation created.')}</div>`;
        }catch(e){msg.innerHTML=`<div class="judge-error">${esc(e.message)}</div>`}
        finally{btn.disabled=false;btn.textContent='Recommend Training'}
      };
    }catch(e){errorBox(root,e)}
  }

  function loadResearch(){
    const root=document.getElementById('judge-research');
    root.innerHTML=`<div class="judge-grid two">
      <div class="judge-card">
        <span class="judge-badge">SYSTEM ARCHITECTURE</span>
        <h2 style="margin-top:10px">Simple layers, clear responsibilities</h2>
        <div class="architecture-stack">
          <div><b>Users</b><span>Customer · Worker · Cooperative · Federation</span></div>
          <i>↓</i>
          <div><b>Edge / Security</b><span>HTTPS · WAF/DDoS-ready architecture · Rate Limiting</span></div>
          <i>↓</i>
          <div><b>API & Core Services</b><span>Auth · Worker · Booking · Matching · Payment · Complaint · Capacity · Planning · Voice · Audit</span></div>
          <i>↓</i>
          <div><b>Data</b><span>PostgreSQL · cache/object-storage/backup integration readiness</span></div>
          <i>↓</i>
          <div><b>Integrations</b><span>Payments · Maps · OTP · Welfare/Insurance · Notifications</span></div>
        </div>
        <div class="judge-note">Only infrastructure actually connected in the prototype is labelled Implemented. WAF, replicas, Redis, object storage and external integrations remain production-readiness architecture where not live.</div>
      </div>

      <div class="judge-card">
        <span class="judge-badge">DATABASE & AUDIT PROOF</span>
        <h3 style="margin-top:10px">Persistent domains behind the demo</h3>
        <div class="domain-cloud">
          ${['Users','Workers','Skills','Documents','Bookings','Offers','Verifications','Payments','Complaints','Capacity Requests','Forecasts','Training Recommendations','Audit History'].map(x=>`<span>${x}</span>`).join('')}
        </div>
        <div class="judge-row"><span>Worker acceptance</span><b>Transaction protected</b></div>
        <div class="judge-row"><span>Worker fallback</span><b>Same booking preserved</b></div>
        <div class="judge-row"><span>Service token</span><b>Booking-bound + hashed + expiring</b></div>
        <div class="judge-row"><span>Rating</span><b>Unique per booking</b></div>
        <div class="judge-row"><span>Sandbox payment</span><b>Idempotent successful-payment check</b></div>
      </div>
    </div>

    <div class="judge-card" style="margin-top:12px">
      <span class="judge-badge">RESEARCH & BEST PRACTICES</span>
      <h2 style="margin-top:10px">Research translated into system decisions</h2>
      <div class="research-grid">
        <a href="https://owasp.org/API-Security/" target="_blank" rel="noopener"><b>OWASP API Security</b><span>Authentication, authorization and secure API design → role checks and protected connected actions.</span></a>
        <a href="https://developers.google.com/maps/documentation/routes" target="_blank" rel="noopener"><b>Google Maps Routes</b><span>Location, distance and route/ETA architecture → local matching and future route integration.</span></a>
        <a href="https://www.postgresql.org/docs/" target="_blank" rel="noopener"><b>PostgreSQL Documentation</b><span>Transactions, indexing and reliable persistence → booking/offer/payment governance.</span></a>
        <a href="https://arxiv.org/abs/1810.04040" target="_blank" rel="noopener"><b>Person–Job Fit Research</b><span>Matching should consider fit, not only proximity → eligibility + explainable multi-factor ranking.</span></a>
        <div><b>Government / Cooperative Reports</b><span>Cooperative workforce governance, welfare and digital administration shape the operating model and roadmap.</span></div>
        <div><b>Workforce Planning Research</b><span>Forecasting is treated as confidence-aware advisory input that leads to capacity/training actions.</span></div>
      </div>
    </div>

    <div class="judge-card" style="margin-top:12px">
      <span class="judge-badge">PROTOTYPE TRUTH MATRIX</span>
      <div class="judge-table-wrap">
        <table class="judge-table">
          <thead><tr><th>Capability</th><th>Status</th><th>Proof / Boundary</th></tr></thead>
          <tbody>
            <tr><td>Connected Customer → Worker</td><td><span class="judge-badge">IMPLEMENTED</span></td><td>Shared backend booking and offer state</td></tr>
            <tr><td>Worker Accept / Decline</td><td><span class="judge-badge">IMPLEMENTED</span></td><td>Transaction-protected worker choice and fallback</td></tr>
            <tr><td>Fair Matching</td><td><span class="judge-badge">IMPLEMENTED</span></td><td>Eligibility gate before deterministic ranking</td></tr>
            <tr><td>Dual Verification</td><td><span class="judge-badge demo">PROTOTYPE-DEMO</span></td><td>Sandbox identity + customer confirmation + backend lock</td></tr>
            <tr><td>Payment</td><td><span class="judge-badge demo">SANDBOX</span></td><td>No real money movement claimed</td></tr>
            <tr><td>SLA Breach</td><td><span class="judge-badge demo">DEMO SIMULATION</span></td><td>Time advancement is explicitly simulated and audited</td></tr>
            <tr><td>Insurance / ESIC</td><td><span class="judge-badge future">FUTURE INTEGRATION READY</span></td><td>Worker identity/history foundation; no live insurer claimed</td></tr>
            <tr><td>Production biometric KYC</td><td><span class="judge-badge future">FUTURE INTEGRATION</span></td><td>Current identity proof remains sandboxed</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function loadSecurity(){
    const root=document.getElementById('judge-security');
    root.innerHTML=`<div class="judge-grid two">
      <div class="judge-card">
        <span class="judge-badge">SECURITY & PRIVACY BY DESIGN</span>
        <h2 style="margin-top:10px">Controls that protect the connected workflow</h2>
        <div class="judge-checks">
          ${['HTTPS / TLS transport','Role-based Customer / Worker / Admin separation','Server-side authorization','Password hashing + session validation','PostgreSQL transaction protection','Audit history for important workflow changes','Hashed one-time service-start token','Token expiry and one-use enforcement'].map(x=>`<div class="judge-check ok">${x}</div>`).join('')}
        </div>
        <div class="judge-note">This is a prototype security architecture, not a claim of external certification or production compliance audit.</div>
      </div>
      <div class="judge-card">
        <span class="judge-badge demo">PRIVACY-BY-DESIGN</span>
        <h3 style="margin-top:10px">DPDP-aligned design principles</h3>
        <div class="judge-row"><span>Data minimization</span><b>Collect only what the workflow needs</b></div>
        <div class="judge-row"><span>Purpose-based access</span><b>Role-scoped visibility</b></div>
        <div class="judge-row"><span>Worker privacy</span><b>Restricted visibility before verification</b></div>
        <div class="judge-row"><span>Accountability</span><b>Audit important actions</b></div>
        <div class="judge-row"><span>Lifecycle</span><b>Session expiration + future retention/consent readiness</b></div>
        <div class="judge-note">No legal certification is claimed. These are privacy-by-design prototype principles.</div>
      </div>
    </div>

    <div class="judge-card" style="margin-top:12px">
      <span class="judge-badge future">RELIABILITY & SCALE ARCHITECTURE</span>
      <h2 style="margin-top:10px">Production-readiness path without pretending everything is live</h2>
      <div class="scale-grid">
        <div><b>Implemented / Current</b><span>Shared backend · PostgreSQL · bounded DB pool · server auth · critical PWA assets network-first</span></div>
        <div><b>Architecture Ready</b><span>CDN · WAF/DDoS · rate limiting · load balancing · autoscaling · Redis/cache · read replicas</span></div>
        <div><b>Data Resilience Roadmap</b><span>Object storage · backups · disaster recovery · monitoring / metrics / alerting</span></div>
      </div>
      <div class="judge-note">Scale components are shown as architecture/future integration unless the current deployment actually uses them.</div>
    </div>`;
  }

  function loadWelfare(){
    const root=document.getElementById('judge-welfare');
    root.innerHTML=`<div class="judge-grid two">
      <div class="judge-card">
        <span class="judge-badge">WORKER WELFARE & GROWTH</span>
        <h2 style="margin-top:10px">From jobs to a verifiable worker career record</h2>
        <div class="welfare-grid">
          <div><b>Verified Work History</b><span>Service history can become a portable proof of experience.</span><em>Prototype foundation</em></div>
          <div><b>Earnings Visibility</b><span>Transparent service/payment history supports worker financial visibility.</span><em>Prototype foundation</em></div>
          <div><b>Training Recommendations</b><span>Demand/capacity gaps can create human-approved upskilling recommendations.</span><em>Working Judge proof</em></div>
          <div><b>Certificate Renewal Alerts</b><span>Expiry-aware re-verification keeps trust current.</span><em>Future Integration Ready</em></div>
          <div><b>Government Scheme Readiness</b><span>Verified identity and work history create a foundation for scheme discovery/support.</span><em>Future Integration Ready</em></div>
          <div><b>Insurance / ESIC Readiness</b><span>Cooperative worker data can support future policy eligibility integrations.</span><em>Future Integration Ready</em></div>
        </div>
        <div class="judge-note">No live insurer, government scheme API or ESIC integration is claimed in the current prototype.</div>
      </div>
      <div class="judge-card">
        <span class="judge-badge">SUSTAINABILITY & BUSINESS MODEL</span>
        <h3 style="margin-top:10px">Cooperative/federation SaaS first</h3>
        <div class="judge-row"><span>Primary model</span><b>Cooperative / Federation SaaS</b></div>
        <div class="judge-row"><span>Platform value</span><b>Admin tools · analytics · capacity · governance</b></div>
        <div class="judge-row"><span>Optional</span><b>Policy-configurable transaction fee</b></div>
        <div class="judge-row"><span>Future</span><b>Partner / integration APIs</b></div>
        <div class="judge-note">Exact commercial policy is configurable and subject to cooperative governance. No fake revenue projection is shown.</div>
      </div>
    </div>

    <div class="judge-card" style="margin-top:12px">
      <span class="judge-badge">PROTECT & GROW LOOP</span>
      <div class="growth-flow">
        <span>Demand Forecast</span><b>→</b><span>Capacity Gap</span><b>→</b><span>Skill Gap</span><b>→</b><span>Training Recommendation</span><b>→</b><span>Human Approval</span><b>→</b><span>Future Skill Verification</span>
      </div>
      <p>AI recommendation never automatically grants a skill or verified badge.</p>
    </div>`;
  }

  function loadControl(){
    const root=document.getElementById('judge-control');
    root.innerHTML=`<div class="judge-grid two">
      <div class="judge-card">
        <h2>Reset Connected SIH Demo</h2>
        <p>Cancels unfinished demo-only bookings, expires demo offers, clears demo SLA/capacity artifacts and restores Worker A / Worker B availability. Real users are not modified.</p>
        <button class="btn danger" id="judgeResetOpen">Reset Demo Dataset</button>
        <div id="judgeResetConfirmBox" class="judge-confirm-box hidden" role="group" aria-label="Confirm demo reset">
          <p><b>Reset isolated SIH demo data?</b><br>Real users will not be affected.</p>
          <div class="judge-actions">
            <button class="btn secondary" id="judgeResetCancel">Cancel</button>
            <button class="btn danger" id="judgeResetConfirm">Confirm Reset</button>
          </div>
        </div>
        <div id="judgeResetMsg" aria-live="polite"></div>
      </div>
      <div class="judge-card">
        <h3>5-Minute Extended Demo</h3>
        <div class="judge-row"><span>1</span><b>Customer Voice + Fair Matching</b></div>
        <div class="judge-row"><span>2</span><b>Worker A Reject → Worker B Accept</b></div>
        <div class="judge-row"><span>3</span><b>Dual Verification + Service Start</b></div>
        <div class="judge-row"><span>4</span><b>Extra Charge + Sandbox Payment + Invoice</b></div>
        <div class="judge-row"><span>5</span><b>Capacity + SLA + Planning + Training</b></div>
      </div>
    </div>`;

    const box=root.querySelector('#judgeResetConfirmBox');
    const openBtn=root.querySelector('#judgeResetOpen');
    const cancelBtn=root.querySelector('#judgeResetCancel');
    const confirmBtn=root.querySelector('#judgeResetConfirm');
    const msg=root.querySelector('#judgeResetMsg');

    openBtn.onclick=()=>{
      box.classList.remove('hidden');
      openBtn.disabled=true;
      cancelBtn.focus();
    };
    cancelBtn.onclick=()=>{
      box.classList.add('hidden');
      openBtn.disabled=false;
      openBtn.focus();
    };
    confirmBtn.onclick=async()=>{
      if(confirmBtn.disabled)return;
      confirmBtn.disabled=true;
      cancelBtn.disabled=true;
      confirmBtn.textContent='Resetting…';
      msg.innerHTML='<div class="judge-note">Resetting demo-only state…</div>';
      try{
        const r=await post('/api/connected/judge/reset');
        try{localStorage.removeItem('sanpaid_connected_booking_id')}catch{}
        msg.innerHTML=`<div class="judge-success">${esc(r.message||'SIH demo reset complete.')}</div>`;
        box.classList.add('hidden');
        openBtn.disabled=false;
        setTimeout(()=>switchTab('golden'),600);
      }catch(e){
        msg.innerHTML=`<div class="judge-error">${esc(e.message)}</div>`;
      }finally{
        confirmBtn.disabled=false;
        cancelBtn.disabled=false;
        confirmBtn.textContent='Confirm Reset';
      }
    };
  }

  function install(){
    const ctas=document.querySelector('.hero-ctas');
    if(ctas&&!document.getElementById('sihJudgeModeBtn')){
      const b=document.createElement('button');
      b.id='sihJudgeModeBtn';
      b.type='button';
      b.className='btn secondary';
      b.textContent='🏆 SIH Judge Mode';
      b.onclick=open;
      ctas.appendChild(b);
    }

    const research=document.querySelector('#status .head');
    if(research&&!document.getElementById('judgeModeStatusBtn')){
      const b=document.createElement('button');
      b.id='judgeModeStatusBtn';
      b.className='btn primary';
      b.textContent='Open Research & System Proof';
      b.style.marginTop='10px';
      b.onclick=open;
      research.appendChild(b);
    }
  }

  window.SanPaidJudgeMode={open,close,switchTab};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();