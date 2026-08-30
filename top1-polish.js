(() => {
  'use strict';

  const JUDGE_BACKEND='https://sanpaid-sih-2026.onrender.com';
  const JUDGE_TOKEN_KEY='sanpaid_judge_demo_token_v1';
  let lastReadinessAt=0;
  let readinessBusy=false;
  let resetReturnFocus=null;
  let declineReturnFocus=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function judgeToken(){try{return sessionStorage.getItem(JUDGE_TOKEN_KEY)||'';}catch{return '';}}
  function judgeVisible(){const shell=document.getElementById('sihJudgeShell');return !!(shell&&!shell.classList.contains('judge-hidden'));}
  function friendlyJudgeError(status){if(status===401)return 'Judge demo session expired. Please log in again.';if(status===403)return 'This action is not available for this demo role.';if(status===409)return 'The demo state changed. Refresh this proof and retry.';if(status===429)return 'Too many requests. Please wait a moment and retry.';return 'This demo action could not be completed. Please retry.';}
  async function judgeApi(path,opt={}){const headers=new Headers(opt.headers||{});if(opt.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');const token=judgeToken();if(token)headers.set('Authorization',`Bearer ${token}`);const r=await fetch(JUDGE_BACKEND+path,{...opt,headers,mode:'cors',credentials:'omit',cache:'no-store'});const data=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(data.message||friendlyJudgeError(r.status));e.status=r.status;throw e;}return data;}

  function injectStyles(){
    if(document.getElementById('sanpaidFinalPolishStyles'))return;
    const style=document.createElement('style');style.id='sanpaidFinalPolishStyles';style.textContent=`
      .connected-trust-checks{display:grid;gap:8px;margin:12px 0}.connected-trust-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid #ead8a8;background:#fff9ea;border-radius:11px}.connected-trust-row.done{border-color:#c4e8d5;background:#eef9f3}.connected-payment-success{line-height:1.65}.why-different-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.why-different-card{padding:16px;border:1px solid var(--line);border-radius:15px;background:#fff;box-shadow:var(--shadow)}.why-different-card b{display:block;color:var(--navy2);margin-bottom:6px}.why-different-card p{margin:0;color:var(--muted);font-size:13px;line-height:1.5}.judge-reset-backdrop{position:fixed;inset:0;z-index:950;background:rgba(6,18,35,.56);display:grid;place-items:center;padding:16px}.judge-reset-dialog{width:min(460px,100%);background:#fff;color:#14213a;border-radius:16px;padding:20px;box-shadow:0 24px 60px rgba(0,0,0,.28)}.judge-reset-dialog h3{margin:0 0 8px}.judge-reset-dialog p{color:#65758a;line-height:1.55}.judge-readiness-box{margin-top:12px}.judge-readiness-box .judge-checks{margin-top:8px}.judge-training-actions{margin-top:14px}.judge-training-actions .judge-badge{align-self:center}@media(max-width:980px){.why-different-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.why-different-grid{grid-template-columns:1fr}.judge-reset-dialog{padding:17px}.judge-reset-dialog .judge-actions{display:grid}.judge-reset-dialog .btn{width:100%;min-height:48px}}
      @media print{body>*{display:none!important}#connectedShell{display:block!important;position:static!important;background:#fff!important}#connectedShell .connected-top,#connectedShell .connected-actions,#connectedModalRoot{display:none!important}.connected-shell,.connected-main{overflow:visible!important;width:100%!important;max-width:none!important;padding:0!important}.connected-card{box-shadow:none!important;break-inside:avoid}}
    `;document.head.appendChild(style);
  }

  function polishLanding(){
    document.getElementById('bookServiceHero')?.replaceChildren(document.createTextNode('Book Verified Service'));
    const connected=document.getElementById('connectedDemoBtn');if(connected)connected.textContent='▶ Watch Connected Demo';
    const trust=document.querySelector('#trust .trustin');if(trust)trust.innerHTML='<span>✅ Verified Workforce</span><span>⚖️ Fair Allocation</span><span>🤝 Worker Choice</span><span>🏢 Cooperative Governance</span>';
    const problem=document.getElementById('problem');if(problem&&!document.getElementById('whyDifferent')){const section=document.createElement('section');section.id='whyDifferent';section.className='section white';section.innerHTML='<div class="wrap"><div class="head"><span class="tag">Why SanPaid Is Different</span><h2>Built for cooperative workforce operations — not only service booking</h2><p>SanPaid combines worker trust, fair opportunity and cooperative planning in one connected operating network.</p></div><div class="why-different-grid"><div class="why-different-card"><b>Cooperative Governance</b><p>Verification, complaints, capacity and workforce operations stay accountable to the cooperative.</p></div><div class="why-different-card"><b>Fair Opportunity Allocation</b><p>Eligibility comes first, then explainable fair ranking and worker choice.</p></div><div class="why-different-card"><b>Cross-Cooperative Capacity</b><p>Nearby cooperatives can share approved capacity without silently transferring workers.</p></div><div class="why-different-card"><b>Trusted Service Start</b><p>Worker identity and customer confirmation are both required before service begins.</p></div><div class="why-different-card"><b>Workforce Planning</b><p>Demand, capacity and skill gaps lead to governed operational actions.</p></div></div></div>';problem.insertAdjacentElement('afterend',section);}
  }

  function focusable(root){return [...root.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&el.getClientRects().length);}
  function trapFocus(event,root){if(event.key!=='Tab')return;const nodes=focusable(root);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}

  function closeJudgeResetModal(){document.getElementById('judgeResetModal')?.remove();const target=resetReturnFocus;resetReturnFocus=null;if(target?.isConnected)setTimeout(()=>target.focus(),0);}
  function showJudgeResetModal(trigger=null){
    closeJudgeResetModal();resetReturnFocus=trigger||document.activeElement;
    const modal=document.createElement('div');modal.id='judgeResetModal';modal.className='judge-reset-backdrop';modal.innerHTML=`<div class="judge-reset-dialog" role="dialog" aria-modal="true" aria-labelledby="judgeResetTitle"><h3 id="judgeResetTitle">Reset isolated SIH demo data?</h3><p>This cancels unfinished demo-only bookings, expires demo offers and clears demo governance artifacts. Real users are not affected.</p><div id="judgeResetModalMsg" aria-live="polite"></div><div class="judge-actions"><button class="btn secondary" data-judge-reset-cancel>Cancel</button><button class="btn danger" data-judge-reset-confirm>Reset SIH Demo</button></div></div>`;document.body.appendChild(modal);const dialog=modal.querySelector('.judge-reset-dialog');const cancel=modal.querySelector('[data-judge-reset-cancel]');const confirm=modal.querySelector('[data-judge-reset-confirm]');cancel.onclick=closeJudgeResetModal;modal.addEventListener('click',e=>{if(e.target===modal)closeJudgeResetModal();});dialog.addEventListener('keydown',e=>trapFocus(e,dialog));confirm.onclick=async()=>{if(confirm.disabled)return;confirm.disabled=true;confirm.textContent='Resetting…';const msg=modal.querySelector('#judgeResetModalMsg');try{const result=await judgeApi('/api/connected/judge/reset',{method:'POST',body:'{}'});try{localStorage.removeItem('sanpaid_connected_booking_id');}catch{}msg.innerHTML=`<div class="judge-success">${esc(result.message||'SIH demo reset complete.')}</div>`;document.getElementById('judgeResetMsg')?.replaceChildren();lastReadinessAt=0;setTimeout(()=>{closeJudgeResetModal();enhanceJudge(true);},650);}catch(e){msg.innerHTML=`<div class="judge-error">${esc(e.message||'Reset failed. Please retry.')}</div>`;confirm.disabled=false;confirm.textContent='Reset SIH Demo';}};setTimeout(()=>cancel.focus(),0);
  }

  async function refreshReadiness(force=false){
    if(!judgeVisible()||!judgeToken()||readinessBusy)return;
    const hero=document.querySelector('#sihJudgeShell .judge-hero');if(!hero)return;
    const now=Date.now();if(!force&&now-lastReadinessAt<10000&&document.getElementById('judgeReadiness'))return;
    readinessBusy=true;lastReadinessAt=now;
    let box=document.getElementById('judgeReadiness');if(!box){box=document.createElement('div');box.id='judgeReadiness';box.className='judge-note judge-readiness-box';box.setAttribute('aria-live','polite');hero.appendChild(box);}box.textContent='Checking Golden Demo readiness…';
    try{const d=await judgeApi('/api/connected/judge/readiness');const labels={customerActive:'Customer Account',workerAReady:'Worker A Ready',workerBReady:'Worker B Ready',cooperativeAdminActive:'Cooperative Admin',federationAdminActive:'Federation Admin',unverifiedProofReady:'Unverified Worker Proof',noStalePendingOffers:'No Stale Pending Offers'};box.innerHTML=`<b>${d.ok?'Golden Demo Ready':'Readiness Attention Required'}</b><div class="judge-checks">${Object.entries(d.checks||{}).map(([k,v])=>`<div class="judge-check ${v?'ok':'no'}">${esc(labels[k]||k)}</div>`).join('')}</div>`;}catch(e){box.innerHTML=`<b>Readiness check unavailable</b><br>${esc(e.message)}`;}finally{readinessBusy=false;}
  }

  function injectTrainingAction(){
    if(!judgeVisible()||!judgeToken())return;
    const root=document.getElementById('judge-planning');if(!root||root.querySelector('#judgeRecommendTraining')||!/AI-Assisted Planning/i.test(root.textContent||''))return;
    const card=[...root.querySelectorAll('.judge-card')].find(x=>/AI-Assisted Planning/i.test(x.textContent||''));if(!card)return;
    const actions=document.createElement('div');actions.className='judge-actions judge-training-actions';actions.innerHTML='<button class="btn primary" id="judgeRecommendTraining">Recommend Training</button><span class="judge-badge demo">HUMAN APPROVAL REQUIRED</span><div id="judgeTrainingMsg" style="flex-basis:100%" aria-live="polite"></div>';card.appendChild(actions);const btn=actions.querySelector('#judgeRecommendTraining');btn.onclick=async()=>{if(btn.disabled)return;btn.disabled=true;const old=btn.textContent;btn.textContent='Creating Recommendation…';const msg=actions.querySelector('#judgeTrainingMsg');try{const d=await judgeApi('/api/connected/judge/training/recommend-default',{method:'POST',body:'{}'});msg.innerHTML=`<div class="judge-success"><b>${esc(d.candidate?.name||'Worker')}</b>: ${esc(d.message||'Training recommendation created.')}</div>`;}catch(e){msg.innerHTML=`<div class="judge-error">${esc(e.message)}</div>`;}finally{btn.disabled=false;btn.textContent=old;}};
  }

  function enhanceJudge(force=false){if(!judgeVisible())return;refreshReadiness(force);injectTrainingAction();}
  function scheduleJudgeEnhance(force=false){setTimeout(()=>enhanceJudge(force),250);setTimeout(()=>enhanceJudge(force),850);}

  function start(){
    injectStyles();polishLanding();
    document.addEventListener('keydown',event=>{if(event.key==='Tab'){const reset=document.querySelector('#judgeResetModal .judge-reset-dialog');if(reset){trapFocus(event,reset);return;}}if(event.key!=='Escape')return;const connectedCancel=document.querySelector('#connectedModalRoot [data-modal-cancel]');if(connectedCancel){connectedCancel.click();return;}if(document.getElementById('judgeResetModal'))closeJudgeResetModal();});
    document.addEventListener('click',event=>{
      const decline=event.target.closest?.('[data-reject-offer]');if(decline){declineReturnFocus=decline;setTimeout(()=>{const first=document.querySelector('#connectedModalRoot input[name="declineReason"]');first?.focus();},0);}
      const connectedCancel=event.target.closest?.('#connectedModalRoot [data-modal-cancel]');if(connectedCancel&&declineReturnFocus){const target=declineReturnFocus;declineReturnFocus=null;setTimeout(()=>{if(target.isConnected)target.focus();},0);}
      const reset=event.target.closest?.('#judgeReset');
      if(reset){event.preventDefault();event.stopImmediatePropagation();showJudgeResetModal(reset);return;}
      if(event.target.closest?.('#sihJudgeModeBtn,#judgeModeStatusBtn,[data-judge-role],[data-judge-tab],#judgePresentation'))scheduleJudgeEnhance(event.target.closest?.('[data-judge-role]')!=null);
      if(event.target.closest?.('[data-judge-tab="planning"]'))setTimeout(injectTrainingAction,500);
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();