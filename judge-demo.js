(() => {
  'use strict';

  const TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const TABS=[
    ['golden','System Status'],
    ['matching','Assignment Policy'],
    ['trust','Trust & Verification'],
    ['overview','Operations Overview'],
    ['capacity','Capacity Exchange'],
    ['complaint','Complaints & SLA'],
    ['planning','Demand & Capacity Planning'],
    ['research','Architecture & Research'],
    ['security','Security & Privacy'],
    ['welfare','Workforce Development'],
    ['control','System Controls']
  ];

  let token='';
  let user=null;

  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const human=s=>String(s||'—').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase());
  const getToken=()=>{try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return ''}};
  const clearToken=()=>{token='';try{sessionStorage.removeItem(TOKEN_KEY)}catch{}};
  const isAdminRole=role=>['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(String(role||'').toUpperCase());

  function friendlyError(status){
    if(status===401)return 'Your administration session has expired. Sign in again.';
    if(status===403)return 'This action is not authorized for the current role.';
    if(status===404)return 'The requested record is not available.';
    if(status===409)return 'The record changed. Refresh and retry.';
    if(status===429)return 'Too many requests. Please wait and retry.';
    if(status>=500)return 'The connected service is temporarily unavailable. Please retry.';
    return 'The request could not be completed. Please retry.';
  }

  async function api(path,opt={}){
    const headers=new Headers(opt.headers||{});
    const activeToken=token||getToken();
    if(activeToken)headers.set('Authorization',`Bearer ${activeToken}`);
    if(opt.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    const response=await fetch(path,{...opt,headers,credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const error=new Error(data.message||data.error||friendlyError(response.status));
      error.status=response.status;
      throw error;
    }
    return data;
  }

  function shell(){
    let root=$('#sihJudgeShell');
    if(root)return root;
    root=document.createElement('section');
    root.id='sihJudgeShell';
    root.className='judge-hidden';
    root.innerHTML=`<header class="judge-top">
      <div><div class="brand">San<span>Paid</span></div><small>Authorized Administration Workspace</small></div>
      <div class="judge-top-actions">
        <span id="judgeHealth" class="judge-live">Checking service…</span>
        <button class="btn ghost small" id="judgeClose" type="button" aria-label="Close administration workspace">✕</button>
      </div>
    </header><main class="judge-main" id="judgeContent"></main>`;
    document.body.appendChild(root);
    $('#judgeClose',root).addEventListener('click',close);
    return root;
  }

  async function health(){
    const el=$('#judgeHealth',shell());
    try{
      const result=await api('/api/connected/health');
      el.textContent=result.ok?'● Service Online':'● Service Unavailable';
      el.classList.toggle('ok',!!result.ok);
    }catch{
      el.textContent='● Service Offline';
      el.classList.remove('ok');
    }
  }

  async function verifyAdminSession(){
    token=getToken();
    try{
      const result=await api('/api/connected/auth/me');
      if(!isAdminRole(result?.user?.role))return null;
      user=result.user;
      return user;
    }catch(error){
      if([401,403].includes(Number(error?.status)))clearToken();
      return null;
    }
  }

  function renderAccessRequired(){
    const c=$('#judgeContent',shell());
    c.innerHTML=`<section class="judge-login judge-card" aria-labelledby="adminAccessTitle">
      <span class="judge-badge">AUTHORIZED ACCESS REQUIRED</span>
      <h2 id="adminAccessTitle" style="margin-top:12px">Administration session required</h2>
      <p>Cooperative and Federation workspaces open only through the unified role-based sign-in flow. No embedded or automatic administrative credentials are used.</p>
      <div class="judge-actions">
        <button type="button" class="btn primary" id="adminAccessLogin">Open Role Access</button>
        <button type="button" class="btn secondary" id="adminAccessClose">Return to Public Site</button>
      </div>
    </section>`;
    $('#adminAccessClose',c)?.addEventListener('click',close);
    $('#adminAccessLogin',c)?.addEventListener('click',()=>{
      close();
      const existing=String(window.SanPaidAuth?.getRole?.()||'').toUpperCase();
      const role=isAdminRole(existing)?existing:'COOPERATIVE_ADMIN';
      window.SanPaidAuth?.open?.(role,'login');
    });
  }

  async function open(){
    const root=shell();
    root.classList.remove('judge-hidden');
    document.body.style.overflow='hidden';
    await health();
    if(!await verifyAdminSession()){
      renderAccessRequired();
      return false;
    }
    renderDashboard();
    return true;
  }

  function close(){
    const root=shell();
    root.classList.add('judge-hidden');
    document.body.style.overflow='';
    document.body.classList.remove('judge-presentation','admin-mobile-nav-open');
    $('#judgeContent',root)?.classList.remove('coop-nav-open','fed-nav-open');
  }

  async function logout(){
    if(window.SanPaidAuth?.logout){
      await window.SanPaidAuth.logout();
      return;
    }
    try{await api('/api/connected/auth/logout',{method:'POST',body:'{}'});}catch{}
    clearToken();
    user=null;
    close();
  }

  function renderDashboard(){
    const c=$('#judgeContent',shell());
    const role=String(user?.role||'').toUpperCase();
    const cooperative=role==='COOPERATIVE_ADMIN';
    c.innerHTML=`<section class="judge-hero">
      <span class="judge-badge">${cooperative?'AUTHORIZED COOPERATIVE OPERATIONS':'FEDERATION OVERSIGHT'}</span>
      <h1>${cooperative?'Cooperative Administration':'Federation Oversight & Coordination'}</h1>
      <p>${cooperative?'Verified workforce, services, complaints, capacity and local outcomes in one governed workspace.':'Regional cooperative visibility, capacity coordination, escalation oversight and workforce planning in one governed workspace.'}</p>
      <div class="judge-actions"><button class="btn danger small" id="judgeLogout" type="button">Logout</button></div>
    </section>
    <div class="judge-tabs" aria-label="Administration workspace sections">
      ${TABS.map(([id,label],i)=>`<button type="button" class="judge-tab ${i===0?'active':''}" data-judge-tab="${id}">${esc(label)}</button>`).join('')}
    </div>
    ${TABS.map(([id],i)=>`<section class="judge-section ${i===0?'active':''}" id="judge-${id}"><div class="judge-card">Loading…</div></section>`).join('')}`;

    $('#judgeLogout',c)?.addEventListener('click',logout);
    c.querySelectorAll('[data-judge-tab]').forEach(button=>button.addEventListener('click',()=>switchTab(button.dataset.judgeTab)));
    loadTab('golden');
    queueMicrotask(()=>window.dispatchEvent(new CustomEvent('sanpaid:admin-shell-ready',{detail:{role}})));
  }

  function switchTab(id){
    const c=$('#judgeContent',shell());
    if(!c)return;
    c.querySelectorAll('.judge-tab').forEach(x=>x.classList.toggle('active',x.dataset.judgeTab===id));
    c.querySelectorAll('.judge-section').forEach(x=>x.classList.toggle('active',x.id===`judge-${id}`));
    loadTab(id);
  }

  async function loadTab(id){
    const loaders={
      golden:loadSystemStatus,
      matching:loadMatching,
      trust:loadTrust,
      overview:loadOverview,
      capacity:loadCapacity,
      complaint:loadComplaint,
      planning:loadPlanning,
      research:loadResearch,
      security:loadSecurity,
      welfare:loadWelfare,
      control:loadControl
    };
    return loaders[id]?.();
  }

  function errorBox(root,error,retry){
    if(!root)return;
    root.innerHTML=`<div class="judge-error">${esc(error?.message||friendlyError(error?.status||500))} <button class="btn secondary small" type="button" data-retry>Retry</button></div>`;
    root.querySelector('[data-retry]')?.addEventListener('click',retry);
  }

  async function loadSystemStatus(){
    const root=$('#judge-golden');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Checking connected service readiness…</div>';
    try{
      const d=await api('/api/connected/judge/readiness');
      const checks=d.checks||{};
      const labels={customerActive:'Customer Account',workerAReady:'Worker Availability A',workerBReady:'Worker Availability B',cooperativeAdminActive:'Cooperative Administration',federationAdminActive:'Federation Oversight',unverifiedProofReady:'Verification Boundary',noStalePendingOffers:'Offer State Integrity'};
      root.innerHTML=`<div class="judge-card">
        <span class="judge-badge ${d.ok?'':'demo'}">${d.ok?'CONNECTED SERVICES READY':'SERVICE ATTENTION REQUIRED'}</span>
        <h2 style="margin-top:10px">Runtime readiness</h2>
        <p>These checks come from the connected backend state. They do not represent a production certification or government approval.</p>
        <div class="judge-checks">${Object.entries(checks).map(([key,value])=>`<div class="judge-check ${value?'ok':'no'}">${esc(labels[key]||human(key))}</div>`).join('')}</div>
      </div>`;
    }catch(error){errorBox(root,error,loadSystemStatus);}
  }

  async function loadOverview(){
    const root=$('#judge-overview');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading operational data…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const m=d.metrics||{};
      root.innerHTML=`<div class="judge-grid" style="margin-top:12px">
        <div class="judge-card judge-kpi"><span>Registered Workers</span><b>${Number(m.totalWorkers||0)}</b><p>Connected records</p></div>
        <div class="judge-card judge-kpi"><span>Verified Workers</span><b>${Number(m.verifiedWorkers||0)}</b><p>Eligibility source</p></div>
        <div class="judge-card judge-kpi"><span>Available Workforce</span><b>${Number(m.availableWorkers||0)}</b><p>Current availability</p></div>
        <div class="judge-card judge-kpi"><span>Open Complaints</span><b>${Number(m.openComplaints||0)}</b><p>SLA-governed</p></div>
      </div>
      <div class="judge-grid two" style="margin-top:12px">
        <div class="judge-card"><h3>Cooperative Network</h3><div class="judge-coop-list">${(d.cooperatives||[]).map(x=>`<div class="judge-row"><span><b>${esc(x.name)}</b><br><small>${esc(x.city||'—')}</small></span><span>${Number(x.available||0)} available / ${Number(x.workers||0)} workers</span></div>`).join('')||'<p>No cooperative records are available.</p>'}</div></div>
        <div class="judge-card"><h3>Operational Snapshot</h3><div class="judge-row"><span>Active bookings</span><b>${Number(m.activeBookings||0)}</b></div><div class="judge-row"><span>SLA breached</span><b>${Number(m.slaBreached||0)}</b></div><div class="judge-row"><span>Recorded payments</span><b>₹${Number(m.recordedPayments||0).toLocaleString('en-IN')}</b></div></div>
      </div>`;
    }catch(error){errorBox(root,error,loadOverview);}
  }

  async function loadMatching(){
    const root=$('#judge-matching');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading assignment policy evidence…</div>';
    try{
      const latest=await api('/api/connected/judge/latest-demo-booking');
      if(!latest.booking){
        root.innerHTML='<div class="judge-card"><h3>No active booking available</h3><p>Create a customer booking first, then return here to inspect eligibility and ranking.</p></div>';
        return;
      }
      const d=await api(`/api/connected/judge/match/${latest.booking.id}`);
      const checkLabel=k=>({identityVerified:'Identity Verified',skillVerified:'Skill Verified',available:'Available',withinRadius:'Within Service Radius',documentsValid:'Documents Valid',noScheduleConflict:'Schedule Compatible'}[k]||human(k));
      const eligible=(d.eligible||[]).slice(0,3).map(x=>`<div class="judge-card"><div class="judge-row"><span><span class="judge-badge">#${x.rank||'—'} ELIGIBLE</span><h3 style="margin-top:8px">${esc(x.name)}</h3><small>${esc(x.cooperative||'Cooperative')} · ${Number(x.distance||0)} km</small></span><b>${x.score??'—'}%</b></div><div class="judge-checks">${Object.entries(x.checks||{}).map(([k,v])=>`<div class="judge-check ${v?'ok':'no'}">${esc(checkLabel(k))}</div>`).join('')}</div></div>`).join('');
      root.innerHTML=`<div class="judge-card"><span class="judge-badge">ELIGIBILITY FIRST</span><h2 style="margin-top:10px">${esc(d.booking?.bookingCode||'Booking')} · ${esc(d.booking?.service||'Service')}</h2><p>Only eligible workers proceed to explainable ranking. Worker acceptance remains a separate choice.</p></div><div class="judge-grid two" style="margin-top:12px">${eligible||'<div class="judge-card">No eligible candidates currently meet the configured policy.</div>'}</div>`;
    }catch(error){errorBox(root,error,loadMatching);}
  }

  function loadTrust(){
    const root=$('#judge-trust');
    if(!root)return;
    root.innerHTML=`<div class="judge-grid two">
      <div class="judge-card"><span class="judge-badge">SERVICE-START TRUST</span><h2 style="margin-top:10px">Two independent checks before service starts</h2><div class="trust-flow"><div><b>1</b><span>Worker arrives</span></div><div><b>2</b><span>Identity check</span></div><div><b>3</b><span>Booking-specific customer confirmation</span></div><div><b>4</b><span>Backend unlocks service start</span></div></div><div class="judge-note">Current identity/liveness verification remains a controlled prototype capability; production KYC is not claimed.</div></div>
      <div class="judge-card"><span class="judge-badge">CONTINUOUS WORKER TRUST</span><h3 style="margin-top:10px">Identity, skill and document state remain separate</h3><div class="verification-cycle"><span>Registration</span><span>Identity</span><span>Skill</span><span>Documents</span><span>Availability</span><span>Service History</span><span>Ratings / Complaints</span><span>Re-verification</span></div></div>
    </div>`;
  }

  async function loadCapacity(){
    const root=$('#judge-capacity');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading capacity records…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const rows=d.capacityRequests||[];
      root.innerHTML=`<div class="judge-card"><span class="judge-badge">CROSS-COOPERATIVE CAPACITY</span><h2 style="margin-top:10px">Governed capacity exchange</h2><p>Capacity may be requested across cooperatives, but worker consent and authorized approval remain required.</p></div><div class="judge-card" style="margin-top:12px"><h3>Recent capacity records</h3>${rows.length?rows.slice(0,8).map(x=>`<div class="judge-row"><span><b>${esc(x.requestCode||`Request ${x.id}`)}</b><br><small>${esc(x.requestingCooperative||x.requesting_cooperative||'Requesting cooperative')} → ${esc(x.providingCooperative||x.providing_cooperative||'Provider cooperative')}</small></span><b>${esc(human(x.status))}</b></div>`).join(''):'<p>No capacity requests are currently recorded.</p>'}</div>`;
    }catch(error){errorBox(root,error,loadCapacity);}
  }

  async function loadComplaint(){
    const root=$('#judge-complaint');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading complaint and SLA records…</div>';
    try{
      const d=await api('/api/connected/judge/overview');
      const complaints=d.complaints||[];
      root.innerHTML=`<div class="judge-card"><span class="judge-badge">GRIEVANCE & SLA OVERSIGHT</span><h2 style="margin-top:10px">Complaint escalation remains traceable</h2><p>L1 support, L2 cooperative review and L3 federation oversight remain visible in the complaint lifecycle.</p></div><div class="judge-card" style="margin-top:12px"><h3>Open complaint records</h3>${complaints.length?complaints.slice(0,8).map(x=>`<div class="judge-row"><span><b>${esc(x.ticketNumber||x.ticket_number||`Complaint ${x.id}`)}</b><br><small>${esc(x.category||'Service complaint')}</small></span><b>L${Number(x.escalationLevel||x.escalation_level||1)} · ${esc(human(x.status))}</b></div>`).join(''):'<p>No open complaints are currently recorded.</p>'}</div>`;
    }catch(error){errorBox(root,error,loadComplaint);}
  }

  async function loadPlanning(){
    const root=$('#judge-planning');
    if(!root)return;
    root.innerHTML='<div class="judge-card">Loading planning data…</div>';
    try{
      const d=await api('/api/connected/judge/planning');
      const gap=Number(d.capacityGap||0);
      root.innerHTML=`<div class="judge-card"><span class="judge-badge">ADVISORY PLANNING</span><h2 style="margin-top:10px">Demand → eligible capacity → governed action</h2><p>Planning output remains advisory and confidence-aware. Human roles retain the final decision.</p></div><div class="judge-grid" style="margin-top:12px"><div class="judge-card judge-kpi"><span>Observed Demand</span><b>${Number(d.historicalDemand30d||0)}</b><p>Recent booking history</p></div><div class="judge-card judge-kpi"><span>Expected Demand</span><b>${Number(d.expectedDemand||0)}</b><p>${esc(d.forecastMethod||'Baseline')}</p></div><div class="judge-card judge-kpi"><span>Eligible Capacity</span><b>${Number(d.eligibleCapacity||0)}</b><p>Verified + skilled + available</p></div><div class="judge-card judge-kpi"><span>Capacity Gap</span><b>${gap}</b><p>Confidence: ${esc(d.confidence||'—')}</p></div></div>`;
    }catch(error){errorBox(root,error,loadPlanning);}
  }

  function loadResearch(){
    const root=$('#judge-research');
    if(!root)return;
    root.innerHTML=`<div class="judge-grid two"><div class="judge-card"><span class="judge-badge">SYSTEM ARCHITECTURE</span><h2 style="margin-top:10px">Separated responsibilities</h2><div class="architecture-stack"><div><b>Users</b><span>Customer · Worker · Cooperative · Federation</span></div><i>↓</i><div><b>Access</b><span>Authentication · role authorization · validation</span></div><i>↓</i><div><b>Core Services</b><span>Booking · matching · trust · complaint · payment · capacity</span></div><i>↓</i><div><b>Data</b><span>PostgreSQL · audit history · integration-ready storage</span></div></div></div><div class="judge-card"><span class="judge-badge">RESEARCH FOUNDATION</span><h3 style="margin-top:10px">Evidence informs product rules</h3><div class="research-grid"><a href="https://owasp.org/API-Security/" target="_blank" rel="noopener"><b>OWASP API Security</b><span>Authorization and API design guidance.</span></a><a href="https://www.postgresql.org/docs/" target="_blank" rel="noopener"><b>PostgreSQL</b><span>Transactions and reliable persistence.</span></a><a href="https://developers.google.com/maps/documentation/routes" target="_blank" rel="noopener"><b>Maps / Routes</b><span>Future route and ETA integration.</span></a></div></div></div>`;
  }

  function loadSecurity(){
    const root=$('#judge-security');
    if(!root)return;
    root.innerHTML=`<div class="judge-grid two"><div class="judge-card"><span class="judge-badge">SECURITY CONTROLS</span><h2 style="margin-top:10px">Connected workflow protections</h2><div class="judge-checks">${['HTTPS/TLS transport','Role-based access','Server-side authorization','Password hashing','Session expiry','Transactional workflow updates','Audit history','One-time service verification tokens'].map(x=>`<div class="judge-check ok">${esc(x)}</div>`).join('')}</div><div class="judge-note">This is a prototype security architecture, not an external compliance certification.</div></div><div class="judge-card"><span class="judge-badge">PRIVACY BY DESIGN</span><h3 style="margin-top:10px">Purpose-based access and data minimization</h3><div class="judge-row"><span>Worker visibility</span><b>Restricted by role and lifecycle</b></div><div class="judge-row"><span>Customer records</span><b>Booking-scoped access</b></div><div class="judge-row"><span>Administrative data</span><b>Authorized scope only</b></div><div class="judge-note">No legal certification is claimed.</div></div></div>`;
  }

  function loadWelfare(){
    const root=$('#judge-welfare');
    if(!root)return;
    root.innerHTML=`<div class="judge-card"><span class="judge-badge">WORKFORCE DEVELOPMENT</span><h2 style="margin-top:10px">Verified work history can support future worker development</h2><div class="welfare-grid"><div><b>Work History</b><span>Recorded completed service history.</span><em>Connected foundation</em></div><div><b>Training Recommendations</b><span>Human-reviewed workforce development.</span><em>Prototype</em></div><div><b>Certificate Renewal</b><span>Expiry-aware re-verification workflow.</span><em>Future integration</em></div><div><b>Welfare / Insurance</b><span>Authorized integration only.</span><em>Future integration</em></div></div><div class="judge-note">No live welfare, insurance or government-scheme integration is claimed.</div></div>`;
  }

  function loadControl(){
    const root=$('#judge-control');
    if(!root)return;
    root.innerHTML=`<div class="judge-card"><span class="judge-badge">SYSTEM CONTROLS</span><h2 style="margin-top:10px">Operational controls are intentionally limited</h2><p>Destructive demo reset controls are not exposed in the government-handover administration workspace. Dataset maintenance remains an internal development responsibility.</p></div>`;
  }

  function install(){
    window.SanPaidJudgeMode={open,close,switchTab};
    window.SanPaidRuntimeStatus=Object.assign({},window.SanPaidRuntimeStatus,{legacyJudgeLogin:'RETIRED',administrationAuth:'UNIFIED_ROLE_ACCESS'});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();