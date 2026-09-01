(() => {
  'use strict';

  const TOKEN_KEY='sanpaid_judge_demo_token_v1';
  let timer=0;
  let lastState='';

  function loadDemoFirstAssets(){
    if(!document.getElementById('sanpaidDemoFirstStableStyles')){const link=document.createElement('link');link.id='sanpaidDemoFirstStableStyles';link.rel='stylesheet';link.href='demo-first-stable.css?v=20260901-1';document.head.appendChild(link);}
    if(!document.getElementById('sanpaidDemoFirstStableScript')){const script=document.createElement('script');script.id='sanpaidDemoFirstStableScript';script.src='demo-first-stable.js?v=20260901-1';script.defer=true;document.body.appendChild(script);}
  }

  function token(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return ''}}
  function isCooperativeOpen(){
    const shell=document.getElementById('sihJudgeShell');
    if(!shell||shell.classList.contains('judge-hidden'))return false;
    const role=String(window.SanPaidAuth?.getRole?.()||shell.dataset.adminRole||'').toUpperCase();
    return role==='COOPERATIVE_ADMIN';
  }
  const badge=(text,tone='info')=>`<span class="demo-fallback-state ${tone}">${text}</span>`;

  function fillSynthetic(){
    const portal=document.getElementById('coopPortal');if(!portal)return;
    portal.dataset.demoProofMode='synthetic';
    const scope=document.getElementById('coopScopeLabel');if(scope)scope.textContent='Synthetic local cooperative scope · Demo proof only';
    const title=document.getElementById('coopTitle');if(title)title.textContent='Demo Cooperative Operations';

    const kpis=document.getElementById('coopKpis');if(kpis)kpis.innerHTML=[['Total Workers','12','Synthetic registered workforce'],['Verified Workers','9','Identity review completed'],['Available Workers','6','Verified + available'],['Active Services','2','Current demo services'],['Open Complaints','1','Local grievance proof'],['Recorded Payments','₹4,850','SANDBOX demonstration']].map(([a,b,c])=>`<article class="coop-kpi"><span>${a}</span><strong>${b}</strong><small>${c}</small></article>`).join('');

    const today=document.getElementById('coopToday');if(today)today.innerHTML=`<div class="coop-mini-head"><b>Today's Operations</b><span>SYNTHETIC DATA · PROTOTYPE-DEMO</span></div><div class="coop-today-grid"><article><strong>1</strong><span>Waiting for Worker</span></article><article><strong>1</strong><span>On The Way</span></article><article><strong>0</strong><span>Arrived</span></article><article><strong>1</strong><span>In Progress</span></article><article><strong>0</strong><span>Awaiting Completion</span></article><article><strong>3</strong><span>Completed</span></article></div>`;

    const workers=document.getElementById('coopWorkerTable');if(workers)workers.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><table class="demo-fallback-table"><thead><tr><th>Worker</th><th>Skill</th><th>Identity</th><th>Availability</th><th>Current Eligibility</th></tr></thead><tbody><tr><td>Demo Worker A</td><td>Electrician</td><td>${badge('Verified','ok')}</td><td>${badge('Available','ok')}</td><td>${badge('Eligible','ok')}</td></tr><tr><td>Demo Worker B</td><td>Plumber</td><td>${badge('Pending','warn')}</td><td>${badge('Available','ok')}</td><td>${badge('Blocked','risk')}</td></tr><tr><td>Demo Worker C</td><td>Electrician</td><td>${badge('Verified','ok')}</td><td>${badge('Busy','info')}</td><td>${badge('Unavailable','warn')}</td></tr></tbody></table></div>`;

    const verification=document.getElementById('coopVerification');if(verification)verification.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">PROTOTYPE-DEMO · NO WRITE SENT</span><div class="demo-fallback-list"><article><div><b>Demo Worker B · Identity Review</b><small>Identity evidence pending authorized cooperative review. Skill verification remains a separate decision.</small></div>${badge('Pending','warn')}</article></div></div>`;

    const skills=document.getElementById('coopSkills');if(skills)skills.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><table class="demo-fallback-table"><thead><tr><th>Worker</th><th>Skill</th><th>Skill State</th><th>Document State</th><th>Matching Impact</th></tr></thead><tbody><tr><td>Demo Worker A</td><td>Electrician</td><td>${badge('Verified','ok')}</td><td>${badge('Valid','ok')}</td><td>Eligible when available</td></tr><tr><td>Demo Worker B</td><td>Plumber</td><td>${badge('Review','warn')}</td><td>${badge('Pending','warn')}</td><td>Blocked until approved</td></tr></tbody></table></div>`;

    const services=document.getElementById('coopServices');if(services)services.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><table class="demo-fallback-table"><thead><tr><th>Booking</th><th>Service</th><th>Worker</th><th>Status</th><th>Trust Rule</th></tr></thead><tbody><tr><td>DEMO-BKG-102</td><td>Electrician</td><td>Demo Worker A</td><td>${badge('In Progress','info')}</td><td>Identity + customer confirmation required</td></tr><tr><td>DEMO-BKG-103</td><td>Plumber</td><td>Finding eligible worker</td><td>${badge('Waiting','warn')}</td><td>No forced assignment</td></tr></tbody></table></div>`;

    const complaints=document.getElementById('coopComplaints');if(complaints)complaints.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><div class="demo-fallback-list"><article><div><b>DEMO-CMP-04 · Service complaint</b><small>Evidence timeline: booking → worker offer → arrival → service-start verification → completion/payment → complaint. AI may summarize; human admin decides.</small></div>${badge('L2 · At Risk','warn')}</article></div></div>`;

    const capacity=document.getElementById('coopCapacity');if(capacity)capacity.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><div class="demo-fallback-metrics"><article><span>Observed Demand</span><strong>8</strong></article><article><span>Eligible Capacity</span><strong>6</strong></article><article><span>Capacity Gap</span><strong>2</strong></article><article><span>Planning Confidence</span><strong>LOW</strong></article></div><div class="demo-first-insufficient"><b>Human-controlled next action:</b> review local availability → request nearby cooperative capacity or recommend training. No automatic worker transfer.</div></div>`;

    const quality=document.getElementById('coopQuality');if(quality)quality.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><div class="demo-fallback-metrics"><article><span>Completed Services</span><strong>7</strong></article><article><span>Recorded Rating</span><strong>4.6</strong></article><article><span>Open Complaint</span><strong>1</strong></article><article><span>NPS</span><strong>Not Claimed</strong></article></div></div>`;

    const payments=document.getElementById('coopPayments');if(payments)payments.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SANDBOX · SYNTHETIC DEMO DATA</span><table class="demo-fallback-table"><thead><tr><th>Booking</th><th>Initial</th><th>Approved Extra</th><th>Final</th><th>Payment</th></tr></thead><tbody><tr><td>DEMO-BKG-097</td><td>₹650</td><td>₹200</td><td>₹850</td><td>${badge('Sandbox Paid','info')}</td></tr></tbody></table></div>`;

    const training=document.getElementById('coopTraining');if(training)training.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">PROTOTYPE-DEMO</span><div class="demo-fallback-list"><article><div><b>Demo Worker B · Plumber assessment</b><small>Training recommendation does not verify the skill. Required path: human approval → training → assessment → authorized skill verification.</small></div>${badge('Human Review','warn')}</article></div></div>`;

    const activity=document.getElementById('coopActivity');if(activity)activity.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">SYNTHETIC DEMO DATA</span><div class="demo-fallback-list"><article><div><b>Worker opportunity declined</b><small>Same booking preserved · next eligible worker considered · no forced assignment.</small></div>${badge('Auditable','ok')}</article><article><div><b>Service start unlocked</b><small>Identity verification + customer confirmation satisfied.</small></div>${badge('Trust Rule','ok')}</article><article><div><b>Complaint moved to Cooperative review</b><small>Evidence timeline retained for human decision.</small></div>${badge('L2','warn')}</article></div></div>`;

    const matrix=document.getElementById('coopFeatureMatrix');if(matrix)matrix.innerHTML=`<div class="demo-fallback-block"><span class="demo-fallback-label">DEMO-FIRST STABILITY</span><table class="demo-fallback-table"><thead><tr><th>Feature</th><th>Current Demo State</th><th>Truth</th></tr></thead><tbody><tr><td>Cooperative connected workspace</td><td>${badge('Unavailable','risk')}</td><td>No connected read/write claimed while backend is unavailable.</td></tr><tr><td>Eligibility / ranking proof</td><td>${badge('Available','ok')}</td><td>Client-side SIH demo logic remains available.</td></tr><tr><td>Worker verification write</td><td>${badge('Not Sent','warn')}</td><td>Displayed as prototype proof only.</td></tr><tr><td>Payment</td><td>${badge('Sandbox','info')}</td><td>No real financial transaction claimed.</td></tr></tbody></table></div>`;
  }

  async function probe(){
    if(!isCooperativeOpen())return;
    const headers={};const t=token();if(t)headers.Authorization=`Bearer ${t}`;
    try{
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),2600);
      const r=await fetch('/api/cooperative-admin/workspace',{credentials:'include',cache:'no-store',headers,signal:controller.signal});clearTimeout(timeout);
      if(r.ok){lastState='ready';document.body.classList.remove('demo-first-fallback');return;}
      if([401,403].includes(r.status))return;
      fallback(`Connected Cooperative workspace is unavailable on the current backend (${r.status}).`);
    }catch{fallback('Connected Cooperative workspace is temporarily unavailable.');}
  }

  function fallback(message){
    lastState='fallback';document.body.classList.add('demo-first-fallback');
    const summary=document.getElementById('adminCommandSummary');if(!summary)return;
    let notice=document.getElementById('coopBackendDeployNotice');
    if(!notice){notice=document.createElement('div');notice.id='coopBackendDeployNotice';notice.className='demo-first-statusbar fallback';summary.insertBefore(notice,summary.firstChild);}
    notice.innerHTML=`<div><strong>Cooperative Demo Proof Mode</strong><span>${message} The researched workflow remains visible using clearly labelled synthetic data; no write action is sent.</span></div><b class="demo-first-badge">SYNTHETIC DATA · PROTOTYPE-DEMO</b>`;
    fillSynthetic();setTimeout(fillSynthetic,700);
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(lastState==='fallback')fillSynthetic();probe();},900);}
  function start(){loadDemoFirstAssets();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-admin-role']});schedule();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
