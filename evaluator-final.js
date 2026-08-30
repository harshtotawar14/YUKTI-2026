(() => {
  'use strict';

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  const MATCH_CANDIDATES = [
    {id:'rahul',name:'Rahul',distance:1.8,skill:'Electrician',verified:false,available:true,workload:'Low'},
    {id:'amit',name:'Amit',distance:2.3,skill:'Electrician',verified:true,available:true,workload:'Lower recent workload'},
    {id:'suresh',name:'Suresh',distance:3.1,skill:'Electrician',verified:true,available:false,workload:'Balanced'},
    {id:'priya',name:'Priya',distance:4.0,skill:'Electrician',verified:true,available:true,workload:'Balanced recent workload'},
    {id:'sanjay',name:'Sanjay',distance:6.2,skill:'Plumber',verified:true,available:true,workload:'Low'}
  ];

  const demoState = {radius:20,ranked:[],offeredIndex:-1,audit:[]};
  const clock = () => new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false});
  function addAudit(label){demoState.audit.push({time:clock(),label});renderAudit();}

  function eligibility(worker){
    if(!worker.verified)return {ok:false,reason:'Verification incomplete'};
    if(worker.skill!=='Electrician')return {ok:false,reason:'Required skill missing'};
    if(!worker.available)return {ok:false,reason:'Not currently available'};
    if(worker.distance>demoState.radius)return {ok:false,reason:'Outside configured service area'};
    return {ok:true,reason:'Verified + required skill + available + within configured service area'};
  }

  function renderCandidates(){
    const root=$('#evalCandidateList');if(!root)return [];
    const eligible=[];
    root.innerHTML=MATCH_CANDIDATES.map(worker=>{
      const gate=eligibility(worker);if(gate.ok)eligible.push(worker);
      return `<article class="eval-candidate" data-eval-candidate="${esc(worker.id)}">
        <div><strong>${esc(worker.name)} · ${worker.distance.toFixed(1)} km · ${esc(worker.skill)}</strong>
        <small>${worker.verified?'Verified':'Verification Pending'} · ${worker.available?'Available':'Unavailable'} · Demo-safe identity</small>
        <button class="eval-why" type="button" data-eval-why>${gate.ok?'WHY ELIGIBLE?':'WHY NOT ELIGIBLE?'}</button></div>
        <span class="eval-status ${gate.ok?'good':'bad'}">${gate.ok?'ELIGIBLE':'INELIGIBLE'}</span>
        <div class="eval-reason">${esc(gate.reason)}</div>
      </article>`;
    }).join('');
    const summary=$('#evalEligibilitySummary');
    if(summary)summary.innerHTML=`<span>${MATCH_CANDIDATES.length} Candidates</span><i>→</i><span>Eligibility Gate</span><i>→</i><span>${eligible.length} Eligible</span>`;
    return eligible;
  }

  function rankEligible(eligible){
    const workloadRank=w=>/lower/i.test(w.workload)?0:1;
    return eligible.slice().sort((a,b)=>workloadRank(a)-workloadRank(b)||a.distance-b.distance||a.name.localeCompare(b.name));
  }

  function renderRanking(){
    const root=$('#evalRankingList');if(!root)return;
    if(!demoState.ranked.length){root.innerHTML='<div class="eval-candidate"><div><strong>No ranked worker yet</strong><small>Run the Eligibility Gate first. If no worker qualifies, change schedule/service area or notify Cooperative Admin.</small></div><span class="eval-status pending">READY</span></div>';return;}
    root.innerHTML=demoState.ranked.map((worker,index)=>`<article class="eval-ranked">
      <div class="eval-ranked-top"><b>${index+1}. ${esc(worker.name)} · ${worker.distance.toFixed(1)} km</b><span class="eval-rank-badge">RANK #${index+1}</span></div>
      <div class="eval-factor-row"><span>Verified</span><span>Required Skill</span><span>Available</span><span>Within Service Area</span><span>${esc(worker.workload)}</span></div>
      <button class="eval-why" type="button" data-eval-rank-why="${esc(worker.id)}">WHY THIS RANK?</button>
      <div class="eval-reason" data-eval-rank-reason="${esc(worker.id)}">Eligible + Available + Correct Skill + Within Service Area + Workload Balance Considered. Distance is used only after eligibility.</div>
    </article>`).join('');
  }

  function renderOffer(){
    const root=$('#evalOfferRoot');if(!root)return;
    if(demoState.offeredIndex<0||!demoState.ranked[demoState.offeredIndex]){root.innerHTML='<div class="eval-offer-card"><h4>Opportunity not offered yet</h4><p>Run the Eligibility Gate and Fair & Explainable Ranking first.</p></div>';return;}
    const worker=demoState.ranked[demoState.offeredIndex];
    root.innerHTML=`<div class="eval-offer-card"><h4>OPPORTUNITY RECEIVED — ${esc(worker.name)}</h4>
      <p>Electrician · ${worker.distance.toFixed(1)} km · Expected demo earnings shown in worker flow · Schedule: Today · Cooperative: Demo Cooperative</p>
      <p style="margin-top:7px"><b>Why you received this:</b> Verified · Skill Match · Available · Service Area Match</p>
      <div class="eval-offer-actions"><button class="btn primary" type="button" data-eval-accept>ACCEPT</button><button class="btn secondary" type="button" data-eval-decline>DECLINE</button></div></div>`;
  }

  function renderAudit(){
    const root=$('#evalAudit');if(!root)return;
    if(!demoState.audit.length){root.innerHTML='<div class="eval-audit-row"><time>—</time><span>Run the demo to create a traceable audit trail.</span></div>';return;}
    root.innerHTML=demoState.audit.map(item=>`<div class="eval-audit-row"><time>${esc(item.time)}</time><span>${esc(item.label)}</span></div>`).join('');
  }

  function startMatchingDemo(){
    demoState.audit=[];demoState.offeredIndex=-1;
    addAudit('Service Request Created — Electrician');
    const eligible=renderCandidates();
    addAudit(`Eligibility Gate Applied — ${eligible.length} eligible worker${eligible.length===1?'':'s'} identified`);
    demoState.ranked=rankEligible(eligible);renderRanking();
    addAudit('Fair & Explainable Ranking Generated');
    if(demoState.ranked.length){demoState.offeredIndex=0;addAudit(`Opportunity Offered — ${demoState.ranked[0].name}`);}
    renderOffer();
    const state=$('#evalMatchState');if(state)state.textContent=demoState.ranked.length?'Eligibility passed → ranking complete → worker choice active':'No eligible worker — change schedule/service area or notify Cooperative Admin';
  }

  function declineOffer(){
    const current=demoState.ranked[demoState.offeredIndex];if(!current)return;
    addAudit(`${current.name} Declined Opportunity — worker choice respected`);
    const message=$('#evalWorkerMessage');if(message){message.hidden=false;message.textContent='Worker choice respected. Offering opportunity to next eligible worker…';}
    demoState.offeredIndex+=1;
    if(demoState.ranked[demoState.offeredIndex]){addAudit(`Opportunity Offered — ${demoState.ranked[demoState.offeredIndex].name}`);setTimeout(renderOffer,220);}
    else{addAudit('Eligible list exhausted — Cooperative Admin review required');const root=$('#evalOfferRoot');if(root)root.innerHTML='<div class="eval-offer-card"><h4>No eligible worker accepted</h4><p>Change schedule, expand the configured service area under cooperative policy, or notify Cooperative Admin.</p></div>';}
  }

  function acceptOffer(){
    const current=demoState.ranked[demoState.offeredIndex];if(!current)return;
    addAudit(`${current.name} Accepted Opportunity`);addAudit('Booking Ready for Service-Start Verification');
    const root=$('#evalOfferRoot');if(root)root.innerHTML=`<div class="eval-offer-card"><h4>OPPORTUNITY ACCEPTED — ${esc(current.name)}</h4><p>The same service request now continues to Service-Start Verification. No forced assignment was used.</p><div class="eval-worker-message">Next gate: worker identity/booking check + customer confirmation before service starts.</div></div>`;
  }

  function resetMatching(radius=20){
    demoState.radius=Number(radius)||20;demoState.ranked=[];demoState.offeredIndex=-1;demoState.audit=[];
    const radiusSelect=$('#evalRadius');if(radiusSelect)radiusSelect.value=String(demoState.radius);
    renderCandidates();renderRanking();renderOffer();renderAudit();
    const state=$('#evalMatchState');if(state)state.textContent=`Ready — configured demo service radius: ${demoState.radius} km`;
    const msg=$('#evalWorkerMessage');if(msg){msg.hidden=true;msg.textContent='';}
  }

  function wireCapacity(){
    const status=$('#evalCapacityStatus'),action=$('#evalCapacityAction');if(!action)return;
    let step=0;
    const messages=['Capacity Exchange Suggested — no worker is moved automatically.','Authorized Cooperative / Federation Approval recorded for this demo scenario.','Worker acceptance required — consent remains explicit.','Cross-Cooperative Assignment Confirmed — accountability fields remain visible.'];
    const labels=['Suggest Capacity Exchange','Record Authorized Approval','Request Worker Acceptance','Confirm Governed Assignment','Restart Scenario'];
    action.addEventListener('click',()=>{
      if(step>=4){step=0;if(status){status.hidden=true;status.textContent='';}action.textContent=labels[0];return;}
      if(status){status.hidden=false;status.textContent=messages[step];}
      step+=1;action.textContent=labels[step]||labels[4];
    });
  }

  function openConnected(persona=null){
    if(window.ConnectedSanPaid?.open){window.ConnectedSanPaid.open(persona);return;}
    document.getElementById('getStarted')?.click();
  }

  function normalizeText(root=document){
    const replacements=[
      ['20 KM policy radius','Current demo configuration: 20 km'],
      ['20 KM demo policy today','Current demo configuration: 20 km'],
      ['20 KM configurable default','Current demo configuration: 20 km'],
      ['Within Radius','Within Configured Service Area'],
      ['FAIR RANKING','FAIR & EXPLAINABLE RANKING'],
      ['Fair Worker Offer','Fair & Explainable Ranking'],
      ['Auto Assign','Offer Eligible Worker'],
      ['Auto Reassign','Offer Next Eligible Worker'],
      ['Auto-reassignment','Offer next eligible worker'],
      ['Forced Assignment','Worker Choice Required']
    ];
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{let value=node.nodeValue;replacements.forEach(([from,to])=>{if(value.includes(from))value=value.split(from).join(to);});if(value!==node.nodeValue)node.nodeValue=value;});
    root.querySelectorAll?.('.match-results .score').forEach(score=>{score.hidden=true;score.setAttribute('aria-hidden','true');});
  }

  function installTerminologyObserver(){
    let queued=false;
    const run=()=>{
      queued=false;
      ['landing','selectorModeShell','sihJudgeShell','connectedShell','appShell','modalBackdrop'].forEach(id=>{const root=document.getElementById(id);if(root)normalizeText(root);});
    };
    const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run);});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});run();
  }

  function wire(){
    $('#connectedDemoBtn')?.addEventListener('click',()=>openConnected());
    $('#heroMatchingCta')?.addEventListener('click',()=>$('#matching')?.scrollIntoView({behavior:'smooth',block:'start'}));
    $$('[id="evalOpenConnected"]').forEach((button,index)=>{
      if(index>0)button.id=`evalOpenConnected${index+1}`;
      button.addEventListener('click',()=>openConnected());
    });
    $('#evalFinalPrototype')?.addEventListener('click',()=>openConnected());
    $('#evalFinalMatching')?.addEventListener('click',()=>$('#matching')?.scrollIntoView({behavior:'smooth',block:'start'}));
    $('#evalCapacityConnected')?.addEventListener('click',()=>openConnected());
    $('#evalAdminPrototype')?.addEventListener('click',()=>window.SanPaidDemo?.showRoles?.());
    $('#evalResearch')?.addEventListener('click',()=>window.SanPaidSelectorMode?.open?.(8));
    $('#runMatchBtn')?.addEventListener('click',event=>{event.preventDefault();startMatchingDemo();});
    $('#evalResetMatch')?.addEventListener('click',()=>resetMatching(demoState.radius));
    $('#evalResetLocal')?.addEventListener('click',()=>window.SanPaidDemo?.reset?.());
    $('#evalRadius')?.addEventListener('change',event=>resetMatching(Number(event.target.value||20)));

    document.addEventListener('click',event=>{
      const why=event.target.closest('[data-eval-why]');if(why){why.closest('.eval-candidate')?.classList.toggle('open');return;}
      const rankWhy=event.target.closest('[data-eval-rank-why]');
      if(rankWhy){const id=rankWhy.dataset.evalRankWhy;const reason=document.querySelector(`[data-eval-rank-reason="${id}"]`);if(reason)reason.style.display=reason.style.display==='block'?'none':'block';return;}
      if(event.target.closest('[data-eval-decline]')){declineOffer();return;}
      if(event.target.closest('[data-eval-accept]')){acceptOffer();return;}
    });

    wireCapacity();resetMatching(20);installTerminologyObserver();
  }

  window.SanPaidEvaluatorFinal={startMatchingDemo,resetMatching};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();
