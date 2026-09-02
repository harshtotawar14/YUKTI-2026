(() => {
  'use strict';

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  const isMobile=()=>window.matchMedia?.('(max-width: 768px)')?.matches===true;

  const MATCH_CANDIDATES=[
    {id:'rahul',name:'Rahul',distance:1.8,skill:'Electrician',verified:false,available:true,workload:'Low'},
    {id:'amit',name:'Amit',distance:2.3,skill:'Electrician',verified:true,available:true,workload:'Lower recent workload'},
    {id:'suresh',name:'Suresh',distance:3.1,skill:'Electrician',verified:true,available:false,workload:'Balanced'},
    {id:'priya',name:'Priya',distance:4.0,skill:'Electrician',verified:true,available:true,workload:'Balanced recent workload'},
    {id:'sanjay',name:'Sanjay',distance:6.2,skill:'Plumber',verified:true,available:true,workload:'Low'}
  ];

  const demoState={radius:20,eligible:[],ranked:[],offerIndex:-1,audit:[],busy:false};
  const clock=()=>new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false});
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,reduceMotion?0:ms));

  function eligibility(worker){
    if(!worker.verified)return {ok:false,reason:'Verification pending'};
    if(worker.skill!=='Electrician')return {ok:false,reason:'Required skill missing'};
    if(!worker.available)return {ok:false,reason:'Not currently available'};
    if(worker.distance>demoState.radius)return {ok:false,reason:'Outside configured service area'};
    return {ok:true,reason:'Verified + required skill + available + within configured service area'};
  }

  function addAudit(label){demoState.audit.push({time:clock(),label});renderAudit();}
  function renderAudit(){
    const root=$('#evalAudit');if(!root)return;
    if(!demoState.audit.length){root.innerHTML='<div class="eval-audit-row"><time>—</time><span>Run the demo to build a reason-coded audit trail.</span></div>';return;}
    root.innerHTML=demoState.audit.slice(-7).map(item=>`<div class="eval-audit-row"><time>${esc(item.time)}</time><span>${esc(item.label)}</span></div>`).join('');
  }

  function candidateCard(worker){
    return `<article class="eval-candidate" data-eval-candidate="${esc(worker.id)}">
      <div><strong>${esc(worker.name)} · ${worker.distance.toFixed(1)} km · ${esc(worker.skill)}</strong><small>${worker.verified?'Verified':'Verification Pending'} · ${worker.available?'Available':'Unavailable'} · Demo-safe identity</small><button class="eval-why" type="button" data-eval-why>WHY?</button></div>
      <span class="eval-status pending" data-eval-status>PENDING</span>
      <div class="eval-reason" data-eval-reason>Waiting for Eligibility Gate.</div>
    </article>`;
  }

  function renderCandidates(){const root=$('#evalCandidateList');if(root)root.innerHTML=MATCH_CANDIDATES.map(candidateCard).join('');}
  function renderRankingPlaceholder(message='Run the Eligibility Gate first.'){const root=$('#evalRankingList');if(root)root.innerHTML=`<div class="eval-candidate"><div><strong>Ranking locked</strong><small>${esc(message)}</small></div><span class="eval-status pending">LOCKED</span></div>`;}
  function renderEmptyState(){
    const root=$('#evalRankingList');if(!root)return;
    root.innerHTML='<div class="eval-empty-state"><b>NO ELIGIBLE WORKER</b><p>No verified worker currently meets all eligibility requirements for the selected demo radius.</p><button class="btn secondary" type="button" id="evalExpandRadius">Expand Configured Radius</button></div>';
    const offer=$('#evalOfferRoot');if(offer)offer.innerHTML='';
  }

  function setMatchState(text){const el=$('#evalMatchState');if(el)el.textContent=`PROTOTYPE-DEMO · ${text}`;}
  function setEligibilityBadge(text,kind=''){const el=$('#evalEligibilityBadge');if(el){el.textContent=text;el.className=kind;}}
  function setRankingBadge(text,kind=''){const el=$('#evalRankingBadge');if(el){el.textContent=text;el.className=kind;}}

  function resetMatching({keepRadius=true}={}){
    demoState.busy=false;demoState.eligible=[];demoState.ranked=[];demoState.offerIndex=-1;demoState.audit=[];
    if(!keepRadius)demoState.radius=20;
    const radius=$('#evalRadius');if(radius)radius.value=String(demoState.radius);
    renderCandidates();renderRankingPlaceholder();renderAudit();
    const offer=$('#evalOfferRoot');if(offer)offer.innerHTML='';
    const msg=$('#evalWorkerMessage');if(msg){msg.hidden=true;msg.className='eval-worker-message';msg.textContent='';}
    const summary=$('#evalEligibilitySummary');if(summary)summary.innerHTML='<span>5 Candidates</span><i>→</i><span>Run Eligibility</span>';
    const run=$('#runMatchBtn');if(run){run.disabled=false;run.textContent='RUN ELIGIBILITY CHECK';}
    const rank=$('#evalRunRanking');if(rank){rank.disabled=true;rank.textContent='RUN FAIR RANKING';}
    setEligibilityBadge('WAITING');setRankingBadge('LOCKED');setMatchState(`Ready · configured radius ${demoState.radius} km`);
  }

  async function runEligibility(){
    if(demoState.busy)return;
    demoState.busy=true;demoState.eligible=[];demoState.ranked=[];demoState.offerIndex=-1;demoState.audit=[];
    renderAudit();renderRankingPlaceholder('Eligibility check is running.');
    const offerRoot=$('#evalOfferRoot');if(offerRoot)offerRoot.innerHTML='';
    const run=$('#runMatchBtn'),rank=$('#evalRunRanking');
    if(run){run.disabled=true;run.textContent='CHECKING ELIGIBILITY…';}
    if(rank)rank.disabled=true;
    setEligibilityBadge('CHECKING','active');setRankingBadge('LOCKED');setMatchState('Checking eligibility…');
    const summary=$('#evalEligibilitySummary');if(summary)summary.innerHTML='<span>5 Candidates</span><i>→</i><span>Checking…</span>';
    addAudit(`Service request entered Eligibility Gate · Electrician · radius ${demoState.radius} km`);

    for(const worker of MATCH_CANDIDATES){
      const card=$(`[data-eval-candidate="${worker.id}"]`);if(!card)continue;
      card.classList.add('is-checking');
      const status=$('[data-eval-status]',card),reason=$('[data-eval-reason]',card);
      if(status){status.textContent='CHECKING';status.className='eval-status pending';}
      await wait(isMobile()?90:150);
      const gate=eligibility(worker);
      card.classList.remove('is-checking');card.classList.add(gate.ok?'is-eligible':'is-ineligible','show-reason');
      if(status){status.textContent=gate.ok?'ELIGIBLE':'INELIGIBLE';status.className=`eval-status ${gate.ok?'good':'bad'}`;}
      if(reason)reason.textContent=gate.reason;
      if(gate.ok)demoState.eligible.push(worker);
      addAudit(`${worker.name}: ${gate.ok?'eligible':'excluded'} — ${gate.reason}`);
    }

    if(summary)summary.innerHTML=`<span>5 Candidates</span><i>→</i><span>Eligibility Gate</span><i>→</i><span class="good">${demoState.eligible.length} Eligible</span>`;
    setEligibilityBadge(`${demoState.eligible.length} ELIGIBLE`,'good');
    if(demoState.eligible.length){
      setRankingBadge('READY','active');if(rank)rank.disabled=false;
      renderRankingPlaceholder(`${demoState.eligible.length} eligible workers are ready for explainable ranking.`);
      setMatchState(`${demoState.eligible.length} eligible · ranking ready`);
    }else{
      setRankingBadge('NO ELIGIBLE');renderEmptyState();setMatchState('No eligible worker · review radius/schedule');addAudit('No eligible worker — Cooperative Admin review path available');
    }
    if(run){run.disabled=false;run.textContent='RERUN ELIGIBILITY';}
    demoState.busy=false;
  }

  function rankEligible(){
    const workloadOrder=worker=>/lower/i.test(worker.workload)?0:/balanced/i.test(worker.workload)?1:2;
    return demoState.eligible.slice().sort((a,b)=>workloadOrder(a)-workloadOrder(b)||a.distance-b.distance||a.name.localeCompare(b.name));
  }

  async function runRanking(){
    if(demoState.busy||!demoState.eligible.length)return;
    demoState.busy=true;
    const rankBtn=$('#evalRunRanking');if(rankBtn){rankBtn.disabled=true;rankBtn.textContent='RANKING ELIGIBLE WORKERS…';}
    setRankingBadge('RANKING','active');setMatchState('Ranking eligible workers…');
    await wait(isMobile()?180:280);
    demoState.ranked=rankEligible();
    const root=$('#evalRankingList');
    if(root)root.innerHTML=demoState.ranked.map((worker,index)=>`<article class="eval-ranked">
      <div class="eval-ranked-top"><b>#${index+1} ${esc(worker.name)} · ${worker.distance.toFixed(1)} km</b><span class="eval-rank-badge">RANK #${index+1}</span></div>
      <div class="eval-rank-factors"><span>Eligible</span><span>Distance ${worker.distance.toFixed(1)} km</span><span>${esc(worker.workload)}</span><span>Service Suitability</span><span>Policy Rules</span></div>
      <button class="eval-why" type="button" data-eval-rank-why>WHY THIS RANK?</button>
      <div class="eval-rank-detail" hidden>✓ Eligible · ✓ Required Skill · ✓ Available · ✓ Within Service Area · ${index===0?'✓ Lower recent workload considered':'✓ Balanced workload and distance considered'}</div>
    </article>`).join('');
    setRankingBadge('EXPLAINABLE','good');addAudit(`Fair & Explainable Ranking generated for ${demoState.ranked.length} eligible workers`);
    renderOfferLauncher();setMatchState('Ranking complete · opportunity ready');
    if(rankBtn){rankBtn.textContent='RANKING COMPLETE';rankBtn.disabled=true;}
    demoState.busy=false;
  }

  function renderOfferLauncher(){
    const root=$('#evalOfferRoot');if(!root||!demoState.ranked.length)return;
    root.innerHTML=`<div class="eval-offer-card"><small>NEXT CONTROLLED ACTION</small><h4>Opportunity can now be offered to ${esc(demoState.ranked[0].name)}</h4><p style="margin:0 0 10px;color:#78663e;font-size:8.5px">Ranking does not assign work. The worker still decides.</p><button class="btn primary" type="button" data-eval-offer-start>OFFER OPPORTUNITY</button></div>`;
  }

  function renderOffer(index){
    const root=$('#evalOfferRoot');if(!root)return;
    const worker=demoState.ranked[index];
    if(!worker){root.innerHTML='<div class="eval-empty-state"><b>NO FURTHER ELIGIBLE WORKER</b><p>Cooperative Admin review is required before changing schedule, service radius or capacity strategy.</p></div>';return;}
    demoState.offerIndex=index;
    root.innerHTML=`<div class="eval-offer-card"><small>OPPORTUNITY RECEIVED · WORKER CHOICE</small><h4>${esc(worker.name)} · Electrician Service</h4><div class="eval-offer-meta"><span>Distance<br><b>${worker.distance.toFixed(1)} km</b></span><span>Schedule<br><b>Today · 4:00 PM</b></span><span>Expected Earnings<br><b>Demo estimate</b></span></div><div class="eval-offer-actions"><button type="button" class="accept" data-eval-offer-accept>ACCEPT</button><button type="button" data-eval-offer-decline>DECLINE</button></div></div>`;
    addAudit(`Opportunity offered to ${worker.name} — worker choice required`);
  }

  async function declineOffer(){
    const worker=demoState.ranked[demoState.offerIndex];if(!worker)return;
    const msg=$('#evalWorkerMessage');if(msg){msg.hidden=false;msg.className='eval-worker-message warn';msg.textContent='Worker choice respected. Offering opportunity to the next eligible worker…';}
    addAudit(`${worker.name} declined opportunity — no forced assignment`);
    await wait(isMobile()?220:350);
    const next=demoState.offerIndex+1;
    if(next<demoState.ranked.length){renderOffer(next);addAudit(`Same service request continued to next eligible worker: ${demoState.ranked[next].name}`);if(msg)msg.textContent=`Worker choice respected. Opportunity moved to ${demoState.ranked[next].name}.`;}
    else{renderOffer(next);if(msg)msg.textContent='No additional eligible worker remains. Cooperative Admin review required.';}
  }

  function acceptOffer(){
    const worker=demoState.ranked[demoState.offerIndex];if(!worker)return;
    const root=$('#evalOfferRoot');if(root)root.innerHTML=`<div class="eval-offer-card" style="border-color:#9ecfb6;background:#f1faf5"><small style="color:#18794e">OPPORTUNITY ACCEPTED</small><h4 style="color:#285c42">${esc(worker.name)} accepted the service opportunity</h4><p style="margin:0;color:#557667;font-size:9px">Customer can now proceed to arrival and Service-Start Verification in the connected prototype.</p></div>`;
    const msg=$('#evalWorkerMessage');if(msg){msg.hidden=false;msg.className='eval-worker-message good';msg.textContent='Worker accepted. Customer notification and service lifecycle can continue.';}
    addAudit(`${worker.name} accepted opportunity — customer notified`);addAudit('Audit & Outcome preserved with eligibility and ranking reason codes');
    setMatchState('Worker accepted · auditable outcome recorded');
  }

  function wireMatchingEvents(){
    $('#runMatchBtn')?.addEventListener('click',runEligibility);
    $('#evalRunRanking')?.addEventListener('click',runRanking);
    $('#evalResetMatch')?.addEventListener('click',()=>resetMatching());
    $('#evalRadius')?.addEventListener('change',event=>{
      demoState.radius=Number(event.target.value||20);
      const label=$('.eval-radius-control>span');if(label)label.textContent=`Current demo setting: ${demoState.radius} km`;
      resetMatching();
    });
    document.addEventListener('click',event=>{
      const why=event.target.closest?.('[data-eval-why]');
      if(why){why.closest('.eval-candidate')?.classList.toggle('show-reason');return;}
      const rankWhy=event.target.closest?.('[data-eval-rank-why]');
      if(rankWhy){const detail=rankWhy.parentElement?.querySelector('.eval-rank-detail');if(detail)detail.hidden=!detail.hidden;return;}
      if(event.target.closest?.('[data-eval-offer-start]')){renderOffer(0);return;}
      if(event.target.closest?.('[data-eval-offer-decline]')){declineOffer();return;}
      if(event.target.closest?.('[data-eval-offer-accept]')){acceptOffer();return;}
      if(event.target.closest?.('#evalExpandRadius')){demoState.radius=20;const radius=$('#evalRadius');if(radius)radius.value='20';resetMatching();setMatchState('Radius expanded to demo policy example: 20 km');}
    });
  }

  function openConnected(persona=null){
    window.SanPaidLanding?.closeMobileDrawer?.(false);
    if(window.ConnectedSanPaid?.open){window.ConnectedSanPaid.open(persona||null);return;}
    window.SanPaidDemo?.showRoles?.();
  }

  function wirePrimaryActions(){
    $('#connectedDemoBtn')?.addEventListener('click',()=>openConnected());
    $$('[data-eval-open-connected]').forEach(button=>button.addEventListener('click',()=>openConnected()));
    $$('[data-eval-connected-persona]').forEach(button=>button.addEventListener('click',()=>openConnected(button.dataset.evalConnectedPersona)));
    $('#evalOpenConnected')?.addEventListener('click',()=>openConnected());
    $('#evalFinalPrototype')?.addEventListener('click',()=>openConnected());
    $('#heroMatchingCta')?.addEventListener('click',()=>document.getElementById('matching')?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'}));
    $('#evalFinalArchitecture')?.addEventListener('click',()=>document.getElementById('architecture')?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'}));
    $('#evalAdminPrototype')?.addEventListener('click',()=>window.SanPaidDemo?.showRoles?.());
    $('#evalCapacityConnected')?.addEventListener('click',()=>window.SanPaidSelectorMode?.open?.(6));
    $('#evalResearch')?.addEventListener('click',()=>window.SanPaidSelectorMode?.open?.(8));
    $('#evalResetLocal')?.addEventListener('click',()=>window.SanPaidDemo?.reset?.());
    $$('[data-scroll-target]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'})));
  }

  function wireCapacityDemo(){
    const button=$('#evalCapacityAction'),status=$('#evalCapacityStatus');if(!button||!status)return;
    button.addEventListener('click',async()=>{
      button.disabled=true;button.textContent='CHECKING NETWORK CAPACITY…';status.hidden=false;status.className='eval-worker-message';status.textContent='Checking cooperative network capacity…';
      await wait(isMobile()?180:300);
      status.className='eval-worker-message good';status.textContent='Capacity Exchange Suggested — worker acceptance and authorized cooperative/federation approval are still required.';
      button.textContent='CAPACITY EXCHANGE SUGGESTED';button.disabled=false;
    });
  }

  function wireDashboardTabs(){
    const buttons=$$('[data-eval-dashboard]');if(!buttons.length)return;
    buttons.forEach(button=>button.addEventListener('click',()=>{
      buttons.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
      $$('[data-eval-panel]').forEach(panel=>{const active=panel.dataset.evalPanel===button.dataset.evalDashboard;panel.hidden=!active;panel.classList.toggle('active',active);});
    }));
  }

  function revealElement(el,index=0){
    if(!el||el.classList.contains('is-visible'))return;
    el.style.transitionDelay=`${Math.min(index*60,180)}ms`;
    el.classList.add('is-visible');
  }

  function initScrollReveal(){
    const landing=$('#landing');if(!landing)return;
    const elements=$$('[data-reveal]',landing);
    if(reduceMotion){elements.forEach(el=>el.classList.add('is-visible'));return;}
    landing.classList.add('eval-motion-ready');
    const revealVisible=()=>{
      const viewport=window.visualViewport?.height||window.innerHeight||700;
      elements.forEach((el,index)=>{
        if(el.classList.contains('is-visible'))return;
        const rect=el.getBoundingClientRect();
        if(rect.top<viewport*1.05&&rect.bottom>-40)revealElement(el,index%4);
      });
    };
    revealVisible();
    requestAnimationFrame(()=>requestAnimationFrame(revealVisible));
    if('IntersectionObserver'in window){
      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        revealElement(entry.target);observer.unobserve(entry.target);
      }),{threshold:isMobile()?.02:.08,rootMargin:isMobile()?'0px 0px 12% 0px':'0px 0px -4% 0px'});
      elements.forEach(el=>{if(!el.classList.contains('is-visible'))observer.observe(el);});
    }else{
      const onScroll=()=>revealVisible();window.addEventListener('scroll',onScroll,{passive:true});
    }
    window.addEventListener('pageshow',revealVisible,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(revealVisible,160),{passive:true});
    document.fonts?.ready?.then(revealVisible).catch(()=>{});
    setTimeout(revealVisible,700);
    setTimeout(()=>elements.forEach((el,index)=>{const r=el.getBoundingClientRect();if(r.top<(window.innerHeight||700)*1.2&&r.bottom>-80)revealElement(el,index%4);}),1600);
  }

  function initNav(){
    const nav=$('.eval-nav');if(!nav)return;
    const sync=()=>nav.classList.toggle('nav-compact',window.scrollY>24);
    sync();window.addEventListener('scroll',sync,{passive:true});
  }

  function initHeroSequence(){
    const root=$('#evalHeroSystem');if(!root)return;
    root.dataset.animationOwner='evaluator';
    const seq=['request','workers','gate','rank','offer','audit'];
    const nodes=$$('[data-hero-seq]',root),workers=$$('.hero-worker',root),progress=$('#evalHeroProgress');
    if(reduceMotion){
      nodes.forEach(n=>n.classList.add('hero-active'));
      workers.filter(w=>w.classList.contains('good')).forEach(w=>w.classList.add('hero-pass'));
      workers.filter(w=>w.classList.contains('bad')).forEach(w=>w.classList.add('hero-remove'));
      if(progress)progress.style.width='100%';
      return;
    }
    let timer=null;
    const stepDelay=isMobile()?820:1150;
    const lead=isMobile()?120:260;
    const run=()=>{
      nodes.forEach(n=>n.classList.remove('hero-active'));
      workers.forEach(w=>w.classList.remove('hero-pass','hero-remove'));
      if(progress)progress.style.width='0%';
      seq.forEach((name,index)=>setTimeout(()=>{
        const node=$(`[data-hero-seq="${name}"]`,root);node?.classList.add('hero-active');
        if(name==='gate')workers.forEach(w=>w.classList.add(w.classList.contains('good')?'hero-pass':'hero-remove'));
        if(progress)progress.style.width=`${Math.round(((index+1)/seq.length)*100)}%`;
      },lead+index*stepDelay));
      clearTimeout(timer);timer=setTimeout(run,lead+seq.length*stepDelay+(isMobile()?700:1100));
    };
    run();
  }

  function init(){
    renderCandidates();renderRankingPlaceholder();renderAudit();
    wireMatchingEvents();wirePrimaryActions();wireCapacityDemo();wireDashboardTabs();initScrollReveal();initNav();initHeroSequence();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();