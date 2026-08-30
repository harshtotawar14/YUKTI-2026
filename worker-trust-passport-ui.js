(() => {
  'use strict';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cls=s=>/ELIGIBLE|VALID|VERIFIED|CURRENT/i.test(String(s))?'good':/EXPIRED|NOT_ELIGIBLE|REJECTED/i.test(String(s))?'bad':'warn';

  async function getPassport(){
    const r=await fetch('/api/connected/workforce/passport',{credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json'}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok)throw new Error(d.message||'Trust Passport unavailable');
    return d.passport;
  }

  function render(p){
    const credential=(p.credentials||[])[0]||null;
    const skills=(p.skills||[]).filter(s=>s.verified).map(s=>s.name).slice(0,3);
    return `<div class="wi-head"><div><span class="wi-kicker">WORKER TRUST PASSPORT</span><h3>Verification, work history & renewal status</h3><p>Safe worker-facing record. No government ID, document number, phone, address or authentication data is exposed.</p></div><span class="wi-status ${cls(p.currentEligibility)}">${esc(p.currentEligibility)}</span></div>
      <div class="wi-passport"><div class="wi-passport-main"><span class="wi-kicker">VERIFIED COOPERATIVE WORKER</span><h3>${esc(p.name)}</h3><p>${esc(p.cooperative||'Cooperative Worker')}</p>${credential?`<p style="margin-top:9px">${esc(credential.name)} · ${esc(credential.status)}${credential.daysUntilExpiry===null?'':credential.daysUntilExpiry>=0?` · ${credential.daysUntilExpiry} days remaining`:' · Expired'}</p>`:''}</div>
      <div class="wi-checks"><div class="wi-check"><b>Identity</b><span>${p.identityVerified?'VERIFIED':'REVIEW REQUIRED'}</span></div><div class="wi-check"><b>Verified Skill</b><span>${esc(skills.join(', ')||'No verified skill')}</span></div><div class="wi-check"><b>Required Credential</b><span>${esc(credential?.status||'NOT CONFIGURED')}</span></div><div class="wi-check"><b>Completed Work</b><span>${Number(p.completedJobs||0)} recorded jobs</span></div><div class="wi-check"><b>Rating</b><span>${Number(p.rating||0).toFixed(1)} / 5</span></div><div class="wi-check"><b>Training</b><span>${Number(p.trainingRecommendations||0)} recommendation(s)</span></div></div></div>
      <div class="wi-lifecycle" style="margin-top:12px"><span>Verified</span><i>→</i><span>Credential Active</span><i>→</i><span>Expiry Alert</span><i>→</i><span>Cooperative Review</span><i>→</i><span>Re-verification</span><i>→</i><span>Eligibility Restored / Paused</span></div>
      <div class="wi-note">Required credential validity is checked before ranking. Worker choice remains separate from eligibility.</div>`;
  }

  async function enhance(){
    const shell=document.getElementById('connectedShell');
    const content=document.getElementById('connectedContent');
    if(!shell||shell.classList.contains('hidden')||!content||content.dataset.connectedRole!=='WORKER')return;
    let slot=content.querySelector('[data-wi-connected-passport]');
    if(!slot){slot=document.createElement('section');slot.className='wi-block';slot.dataset.wiConnectedPassport='1';content.appendChild(slot);}
    if(slot.dataset.wiPassportLoaded==='1')return;
    slot.innerHTML='<div class="wi-loading">Loading Worker Trust Passport…</div>';
    try{const p=await getPassport();slot.innerHTML=render(p);slot.dataset.wiPassportLoaded='1';}
    catch{slot.innerHTML='<div class="wi-error">Trust Passport will appear after the connected worker session is ready.</div>';}
  }

  function schedule(){setTimeout(enhance,250);setTimeout(enhance,900);}
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-connected-persona],#connectedLoginBtn,#connectedSwitch,[data-connected-action]'))schedule();},true);
  window.addEventListener('sanpaid:connected-sync',()=>setTimeout(enhance,120));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();