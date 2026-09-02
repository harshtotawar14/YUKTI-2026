(() => {
  'use strict';

  const API_ROOT='';
  const JUDGE_TOKEN_KEY='sanpaid_judge_demo_token_v1';
  let publicCache=null;
  let publicPromise=null;
  let judgeCache=null;
  let judgePromise=null;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=v=>{if(!v)return 'Not set';try{return new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});}catch{return String(v)}};
  const statusClass=s=>/ELIGIBLE|VALID|VERIFIED|CURRENT|BALANCED|IMPLEMENTED/i.test(String(s))?'good':/EXPIRED|NOT_ELIGIBLE|REJECTED|HIGH_SHORTAGE/i.test(String(s))?'bad':/FUTURE/i.test(String(s))?'future':'warn';

  async function fetchPublic(force=false){
    if(publicCache&&!force)return publicCache;
    if(publicPromise&&!force)return publicPromise;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    publicPromise=fetch(`${API_ROOT}/api/public-proof/summary`,{credentials:'same-origin',cache:'no-store',signal:controller.signal})
      .then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.message||'Proof unavailable');publicCache=d;return d;})
      .finally(()=>{clearTimeout(timer);publicPromise=null;});
    return publicPromise;
  }

  async function fetchJudge(force=false){
    const token=sessionStorage.getItem(JUDGE_TOKEN_KEY)||'';
    if(!token)throw new Error('Judge login required');
    if(judgeCache&&!force)return judgeCache;
    if(judgePromise&&!force)return judgePromise;
    judgePromise=fetch(`${API_ROOT}/api/connected/judge/workforce-intelligence`,{credentials:'same-origin',cache:'no-store',headers:{Authorization:`Bearer ${token}`}})
      .then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.message||'Workforce intelligence unavailable');judgeCache=d;return d;})
      .finally(()=>{judgePromise=null;});
    return judgePromise;
  }

  async function fetchWorkerPassport(){
    const r=await fetch(`${API_ROOT}/api/connected/workforce/passport`,{credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'}});
    const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.message||'Trust Passport unavailable');return d.passport;
  }

  function block(title,kicker,body,status=''){
    return `<section class="wi-block"><div class="wi-head"><div><span class="wi-kicker">${esc(kicker)}</span><h3>${esc(title)}</h3></div>${status?`<span class="wi-status ${statusClass(status)}">${esc(status)}</span>`:''}</div>${body}</section>`;
  }

  function passportHtml(p,compact=false){
    if(!p)return '<div class="wi-error">Trust Passport is not available.</div>';
    const credential=(p.credentials||[])[0]||p.credential||null;
    const skills=(p.skills||[]).filter(x=>x.verified).map(x=>x.name).slice(0,3);
    const checks=[
      ['Identity',p.identityVerified?'VERIFIED':'REVIEW REQUIRED'],
      ['Skill',skills.length?`VERIFIED · ${skills.join(', ')}`:'VERIFIED'],
      ['Required Credential',credential?.status||'NOT CONFIGURED'],
      ['Cooperative',p.cooperative||'Cooperative verified'],
      ['Work History',`${Number(p.completedJobs||0)} completed`],
      ['Current Eligibility',p.currentEligibility||'—']
    ];
    return `<div class="wi-passport"><div class="wi-passport-main"><span class="wi-kicker">WORKER TRUST PASSPORT</span><h3>${esc(p.name)}</h3><p>${esc(p.cooperative||'Cooperative Worker')}</p><div style="margin-top:10px"><span class="wi-status ${statusClass(p.currentEligibility)}">${esc(p.currentEligibility||'STATUS')}</span></div>${credential?`<p style="margin-top:9px">${esc(credential.name||'Required Credential')} · ${esc(credential.status)} · ${credential.daysUntilExpiry===null?'No expiry':credential.daysUntilExpiry>=0?`${credential.daysUntilExpiry} days remaining`:'Expired'}</p>`:''}</div><div class="wi-checks">${checks.slice(0,compact?6:checks.length).map(([a,b])=>`<div class="wi-check"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div></div>`;
  }

  function lifecycleHtml(){return `<div class="wi-lifecycle"><span>Worker Verified</span><i>→</i><span>Credential Active</span><i>→</i><span>Expiry Approaching</span><i>→</i><span>Worker Alert</span><i>→</i><span>Cooperative Review</span><i>→</i><span>Re-verification</span><i>→</i><span>Eligibility Restored / Paused</span></div><div class="wi-note">Trust is continuously maintained. A required expired credential can pause matching eligibility until cooperative review.</div>`;}

  function fairnessHtml(f){
    const workers=f?.workers||f||[];
    return `<div class="wi-fair-row header"><span>Worker</span><span>Offers</span><span>Accepted</span><span>Declined</span><span>Recent</span><span>Eligibility</span></div>${workers.map(w=>`<div class="wi-fair-row"><b>${esc(w.name)}</b><span>${Number(w.offersReceived||0)}</span><span>${Number(w.acceptedOffers||0)}</span><span>${Number(w.declinedOffers||0)}</span><span>${Number(w.recentOffers||0)}</span><span class="wi-status ${w.eligibleForOpportunity?'good':'bad'}">${w.eligibleForOpportunity?'ELIGIBLE':esc(w.reason||'NOT ELIGIBLE')}</span></div>`).join('')}<div class="wi-note"><b>Eligibility First. Fair Opportunity Second. Worker Choice Always.</b> Fairness never makes an ineligible worker eligible.</div>`;
  }

  function heatmapHtml(capacity){
    const rows=capacity?.rows||capacity||[];
    if(!rows.length)return '<div class="wi-error">No demo forecast rows are available yet.</div>';
    return `<div class="wi-heatmap">${rows.slice(0,6).map(r=>`<article class="wi-heat ${r.status==='HIGH_SHORTAGE'?'high':r.status==='MODERATE_GAP'?'medium':'good'}"><h4>${esc(r.zone)} · ${esc(r.service)}</h4><div class="nums"><span>Demand<b>${Number(r.expectedDemand||0)}</b></span><span>Capacity<b>${Number(r.eligibleCapacity||0)}</b></span><span>Gap<b>${Number(r.gap||0)}</b></span></div><div class="wi-action">${esc(r.status)} → ${esc(r.recommendedAction||'Review capacity')}</div></article>`).join('')}</div><div class="wi-note">AI-assisted demo forecast. Shortage recommendations never transfer workers automatically; cooperative approval and worker choice remain required.</div>`;
  }

  function pilotHtml(pilot){
    const metrics=pilot?.metrics||[];
    return `<div class="wi-pilot">${metrics.slice(0,10).map(m=>`<div><b>${esc(m.name)}</b><span>${esc(m.why||m.definition||'Metric to be measured during a real pilot.')}</span></div>`).join('')}</div><div class="wi-note"><b>PILOT PLAN — RESULTS NOT CLAIMED.</b> Baseline, sample size, date range and verified outcomes appear only after a real pilot.</div>`;
  }

  function auditHtml(audit=[]){
    if(!audit.length)return '<div class="wi-note">Audit framework is active; no recent admin action is required for this view.</div>';
    return `<div class="wi-audit">${audit.slice(0,8).map(a=>`<div><small>${fmtDate(a.created_at)}</small><b>${esc(a.action)}</b><span>${esc(a.actor||'System')}</span></div>`).join('')}</div><div class="wi-note">Operational actions are recorded for accountability and traceability. No blockchain claim is made.</div>`;
  }

  function selectorStep(){
    const shell=document.getElementById('selectorModeShell');if(!shell||shell.classList.contains('hidden'))return null;
    const active=shell.querySelector('[data-selector-step].active');return active?Number(active.dataset.selectorStep)+1:null;
  }

  function appendSelector(key,html){
    const content=document.querySelector('#selectorModeShell #selectorContent');if(!content||content.querySelector(`[data-wi="${key}"]`))return;
    const wrap=document.createElement('div');wrap.dataset.wi=key;wrap.innerHTML=html;content.appendChild(wrap);
  }

  async function enhanceSelector(){
    const step=selectorStep();if(!step)return;
    if(step===6)appendSelector('auditability',block('Governance stays traceable','AUDITABILITY','<div class="wi-grid"><div class="wi-card"><b>Verification changes</b><small>Recorded admin actions</small></div><div class="wi-card"><b>Service lifecycle</b><small>Traceable booking events</small></div><div class="wi-card"><b>Capacity governance</b><small>Request → approval → worker choice</small></div></div>','CONNECTED PROOF'));
    try{
      const data=await fetchPublic();
      if(step===3&&!document.querySelector('[data-wi="fairness"]'))appendSelector('fairness',block('Fair Opportunity Proof','BACKEND-DERIVED DEMO DATA',fairnessHtml(data.fairOpportunity),'IMPLEMENTED'));
      if(step===5&&!document.querySelector('[data-wi="passport"]')){
        const amit=(data.workerTrust?.workers||[]).find(w=>/amit/i.test(w.name))||data.workerTrust?.workers?.[0];
        const normalized=amit?{...amit,credentials:amit.credential?[amit.credential]:[],skills:[{name:'Electrician',verified:true}]}:null;
        appendSelector('passport',block('Worker Trust Passport','CONTINUOUS TRUST',passportHtml(normalized,true)+lifecycleHtml(),'PROTOTYPE-DEMO'));
      }
      if(step===7&&!document.querySelector('[data-wi="capacity-map"]'))appendSelector('capacity-map',block('Workforce Capacity Map','DEMAND → CAPACITY → ACTION',heatmapHtml(data.capacityMap),data.capacityMap?.forecastLabel||'PROTOTYPE-DEMO'));
      if(step===8&&!document.querySelector('[data-wi="skill-gap"]'))appendSelector('skill-gap',block('Skill-Gap Action','AI-ASSISTED ADVISORY',heatmapHtml(data.capacityMap),'PROTOTYPE-DEMO'));
      if(step===10&&!document.querySelector('[data-wi="pilot"]'))appendSelector('pilot',block('How Success Will Be Measured','PILOT READINESS',pilotHtml(data.pilot),'PILOT PLAN'));
    }catch{}
  }

  async function enhanceConnected(){
    const shell=document.getElementById('connectedShell');const content=document.getElementById('connectedContent');
    if(!shell||shell.classList.contains('hidden')||!content||content.dataset.connectedRole!=='WORKER'||content.querySelector('[data-wi-connected-passport]'))return;
    const slot=document.createElement('div');slot.dataset.wiConnectedPassport='1';slot.className='wi-block';slot.innerHTML='<div class="wi-loading">Loading Worker Trust Passport…</div>';content.appendChild(slot);
    try{const p=await fetchWorkerPassport();slot.innerHTML=`<div class="wi-head"><div><span class="wi-kicker">WORKER TRUST PASSPORT</span><h3>Verification, work history & renewal status</h3><p>Safe worker-facing trust record. No sensitive KYC fields are exposed.</p></div><span class="wi-status ${statusClass(p.currentEligibility)}">${esc(p.currentEligibility)}</span></div>${passportHtml(p)}${lifecycleHtml()}`;}catch{slot.innerHTML='<div class="wi-error">Trust Passport will appear after the connected worker session is ready.</div>';}
  }

  function riskHtml(data){
    const flags=[];
    (data.passports||[]).forEach(p=>(p.credentials||[]).forEach(c=>{if(c.status==='EXPIRING_SOON')flags.push(`${p.name}: DOCUMENT EXPIRING`);if(c.status==='EXPIRED')flags.push(`${p.name}: REVIEW REQUIRED`);}));
    if(!flags.length)flags.push('No credential risk flags in the current demo view.');
    return `<div class="wi-risk">${flags.map(f=>`<span>${esc(f)}</span>`).join('')}</div><div class="wi-note">These are review flags, not automatic punishment. Human/cooperative review is required.</div>`;
  }

  function onboardingHtml(){return `<div class="wi-lifecycle"><span>Cooperative Registration</span><i>→</i><span>Admin Account</span><i>→</i><span>Service Categories</span><i>→</i><span>Operational Zones</span><i>→</i><span>Worker Import</span><i>→</i><span>Verification Policy</span><i>→</i><span>Capacity Setup</span><i>→</i><span>Ready to Operate</span></div><div class="wi-note"><b>PROTOTYPE-DEMO.</b> This proves the rollout workflow without claiming production onboarding automation.</div>`;}

  function welfareHtml(passports=[]){
    const p=passports.find(x=>/amit/i.test(x.name))||passports[0];
    return `<div class="wi-grid"><div class="wi-card"><b>Verified Work History</b><small>IMPLEMENTED · ${Number(p?.completedJobs||0)} recorded jobs</small></div><div class="wi-card"><b>Training Recommendation</b><small>PROTOTYPE-DEMO · ${Number(p?.trainingRecommendations||0)} recommendations</small></div><div class="wi-card"><b>Certificate Renewal</b><small>PROTOTYPE-DEMO · expiry lifecycle enabled</small></div><div class="wi-card"><b>Insurance Integration</b><small>FUTURE INTEGRATION READY</small></div><div class="wi-card"><b>Government Welfare APIs</b><small>FUTURE INTEGRATION READY</small></div><div class="wi-card"><b>Earnings / Service Record</b><small>Connected demo ledger where available</small></div></div>`;
  }

  async function enhanceJudge(){
    const shell=document.getElementById('sihJudgeShell');if(!shell||shell.classList.contains('judge-hidden'))return;
    const active=shell.querySelector('.judge-section.active');if(!active||active.querySelector('[data-wi-judge]'))return;
    const id=active.id.replace('judge-','');
    if(!['trust','planning','welfare','security','capacity','overview'].includes(id))return;
    const slot=document.createElement('div');slot.dataset.wiJudge='1';slot.innerHTML='<div class="wi-block"><div class="wi-loading">Loading workforce intelligence proof…</div></div>';active.appendChild(slot);
    try{
      const data=await fetchJudge();
      if(id==='trust'){
        const rahul=data.passports?.find(p=>/rahul/i.test(p.name));
        slot.innerHTML=block('Worker Trust Passport + Continuous Re-verification','TRUST & WORKER LIFECYCLE',`${(data.passports||[]).map(p=>passportHtml(p,true)).join('<div style="height:10px"></div>')}${lifecycleHtml()}${rahul?`<div class="wi-actions">${(rahul.credentials||[]).map(c=>`<button class="wi-btn" data-wi-renew="${c.id}">Approve Demo Renewal · ${esc(rahul.name)}</button><button class="wi-btn" data-wi-reject="${c.id}">Reject Renewal</button>`).join('')}</div><div class="wi-note">Rahul remains identity-unverified, so reviewing this demo credential cannot make him eligible by itself.</div>`:''}`,'CONNECTED PROOF');
      }else if(id==='planning')slot.innerHTML=block('Fair Opportunity Monitor','FAIRNESS & WORKFORCE INTELLIGENCE',fairnessHtml(data.opportunity),'IMPLEMENTED')+block('Skill-Gap / Capacity Heatmap','AI-ASSISTED DEMO FORECAST',heatmapHtml(data.capacity),'PROTOTYPE-DEMO');
      else if(id==='welfare')slot.innerHTML=block('Worker Welfare & Growth','WORKER GROWTH',welfareHtml(data.passports),'MIXED STATUS')+block('Pilot Readiness Center','VALIDATION & PILOT',pilotHtml(data.pilot),'PILOT PLAN');
      else if(id==='security')slot.innerHTML=block('Governance Audit Trail','ACCOUNTABILITY',auditHtml(data.audit),'IMPLEMENTED')+block('Service Quality Watch','HUMAN REVIEW ONLY',riskHtml(data),'REVIEW FLAGS');
      else if(id==='capacity')slot.innerHTML=block('Federation Regional Workforce View','FEDERATION COORDINATION',heatmapHtml(data.capacity)+`<div class="wi-note"><b>Federation coordinates. Cooperative approves. Worker chooses.</b></div>`,'PROTOTYPE-DEMO');
      else if(id==='overview')slot.innerHTML=block('Cooperative Onboarding','GOVERNANCE & SCALE',onboardingHtml(),'PROTOTYPE-DEMO');
    }catch(e){slot.innerHTML=`<div class="wi-block"><div class="wi-error">${esc(e.message||'Workforce intelligence is temporarily unavailable.')}</div></div>`;}
  }

  async function reverify(credentialId,action,button){
    const token=sessionStorage.getItem(JUDGE_TOKEN_KEY)||'';if(!token)return;
    const original=button.textContent;button.disabled=true;button.textContent='Updating…';
    try{
      const body={action};if(action==='APPROVE')body.expiresAt=new Date(Date.now()+365*86400000).toISOString();
      const r=await fetch(`${API_ROOT}/api/connected/judge/credentials/${credentialId}/reverify`,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.message||'Re-verification failed');
      judgeCache=null;publicCache=null;const active=document.querySelector('#sihJudgeShell .judge-section.active [data-wi-judge]');active?.remove();await enhanceJudge();
    }catch(e){button.disabled=false;button.textContent=original;}
  }

  function schedule(){setTimeout(enhanceSelector,80);setTimeout(enhanceConnected,450);setTimeout(enhanceJudge,700);}

  document.addEventListener('click',e=>{
    const renew=e.target.closest?.('[data-wi-renew]');if(renew){reverify(Number(renew.dataset.wiRenew),'APPROVE',renew);return;}
    const reject=e.target.closest?.('[data-wi-reject]');if(reject){reverify(Number(reject.dataset.wiReject),'REJECT',reject);return;}
    if(e.target.closest?.('[data-selector-step],[data-selector-next],[data-selector-prev],[data-open-selector],[data-judge-tab],[data-judge-role],[data-connected-persona],#connectedLoginBtn,#connectedSwitch'))schedule();
  },true);
  window.addEventListener('sanpaid:connected-sync',()=>setTimeout(enhanceConnected,100));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
