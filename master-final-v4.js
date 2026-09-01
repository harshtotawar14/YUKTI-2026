(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function removeLegacyAuth(){
    $('#sanpaidAuthRoot')?.remove();
    /* Short-lived safety guard for users arriving with an old cached runtime. */
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(!(node instanceof HTMLElement))continue;
          if(node.id==='sanpaidAuthRoot')node.remove();
          node.querySelector?.('#sanpaidAuthRoot')?.remove();
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),8000);
  }

  function installSectionRhythm(){
    $$('#landing main>.section, #landing #researchBackedUpgrades, #landing #top1Readiness').forEach(section=>section.classList.add('sp-v4-section'));
    $$('#landing main>.section .head, #landing #researchBackedUpgrades .head, #landing #top1Readiness .head').forEach(head=>head.classList.add('sp-section-head'));
  }

  function installScrollState(){
    const nav=$('#landing .eval-nav');
    if(!nav)return;
    const sync=()=>nav.classList.toggle('sp-v4-scrolled',window.scrollY>14);
    sync();
    window.addEventListener('scroll',sync,{passive:true});

    const links=$$('#landing .navlinks a[href^="#"],#landing .mobile-drawer a[href^="#"]');
    const sections=[...new Set(links.map(a=>a.getAttribute('href')).filter(Boolean))].map(id=>$(id)).filter(Boolean);
    if(!('IntersectionObserver' in window)||!sections.length)return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      const id=`#${visible.target.id}`;
      links.forEach(link=>{
        const active=link.getAttribute('href')===id;
        link.classList.toggle('is-active',active);
        active?link.setAttribute('aria-current','page'):link.removeAttribute('aria-current');
      });
    },{rootMargin:'-28% 0px -58% 0px',threshold:[0,.12,.3,.55]});
    sections.forEach(section=>observer.observe(section));
  }

  function installSafeReveal(){
    const targets=$$('#landing [data-reveal]');
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||!('IntersectionObserver' in window)){
      targets.forEach(node=>node.classList.add('sp-v4-reveal','sp-v4-visible'));
      return;
    }
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('sp-v4-visible');
        observer.unobserve(entry.target);
      });
    },{threshold:.08,rootMargin:'0px 0px -5% 0px'});
    targets.forEach(node=>{
      node.classList.add('sp-v4-reveal');
      if(node.closest('#researchBackedUpgrades,#top1Readiness'))node.classList.add('sp-v4-visible');
      else observer.observe(node);
    });
  }

  function installMatchingProgress(){
    const match=$('#matching .eval-match');
    const body=$('#matching .eval-proof-body');
    if(!match||!body||$('#spV4DemoProgress'))return;
    $('#spDemoProgress')?.remove();
    const rail=document.createElement('div');
    rail.id='spV4DemoProgress';
    rail.className='sp-v4-demo-progress';
    rail.setAttribute('aria-label','Matching proof progress');
    rail.innerHTML=`
      <div class="sp-v4-stage" id="spV4Eligibility" data-state="active"><i>1</i><div><b>Eligibility Gate</b><small>Only verified, skilled and available workers continue</small></div></div>
      <div class="sp-v4-stage" id="spV4Ranking" data-state="locked"><i>2</i><div><b>Fair Ranking</b><small>Eligible workers are ranked using visible factors</small></div></div>
      <div class="sp-v4-stage" id="spV4Choice" data-state="locked"><i>3</i><div><b>Worker Choice</b><small>The worker can accept or decline without forced assignment</small></div></div>`;
    body.insertAdjacentElement('beforebegin',rail);

    const eligibilityBadge=$('#evalEligibilityBadge');
    const rankingBadge=$('#evalRankingBadge');
    const offerRoot=$('#evalOfferRoot');
    const s1=$('#spV4Eligibility'),s2=$('#spV4Ranking'),s3=$('#spV4Choice');
    const derive=()=>{
      const e=(eligibilityBadge?.textContent||'').trim().toUpperCase();
      const r=(rankingBadge?.textContent||'').trim().toUpperCase();
      const offer=(offerRoot?.textContent||'').trim().toUpperCase();
      const eligibilityDone=e.length>0&&!/WAITING|RUN|CHECKING|ACTIVE/.test(e);
      const rankingUnlocked=eligibilityDone||!/LOCKED/.test(r);
      const rankingDone=rankingUnlocked&&r.length>0&&!/LOCKED|WAITING|RUN|READY/.test(r);
      const choiceReady=rankingDone||/ACCEPT|DECLINE|OFFER/.test(offer);
      s1.dataset.state=eligibilityDone?'done':'active';s1.querySelector('i').textContent=eligibilityDone?'✓':'1';
      s2.dataset.state=rankingDone?'done':rankingUnlocked?'active':'locked';s2.querySelector('i').textContent=rankingDone?'✓':'2';
      s3.dataset.state=choiceReady?'active':'locked';s3.querySelector('i').textContent='3';
    };
    derive();
    const mo=new MutationObserver(derive);
    [eligibilityBadge,rankingBadge,offerRoot].filter(Boolean).forEach(n=>mo.observe(n,{subtree:true,childList:true,characterData:true,attributes:true}));
    $('#evalResetMatch')?.addEventListener('click',()=>setTimeout(derive,20));
  }

  function simplifyPrimaryJourney(){
    const live=$('#home [data-eval-open-connected]');
    if(live)live.textContent='TRY LIVE PROTOTYPE';

    const overview=$('#selectorResearchBtn');
    if(overview){
      overview.textContent='3-MINUTE SIH OVERVIEW';
      overview.classList.remove('tertiary');
      overview.classList.add('secondary','sp-ux-overview');
    }

    const matching=$('#heroMatchingCta');
    if(matching){
      matching.textContent='See matching logic';
      matching.classList.remove('secondary','eval-secondary');
      matching.classList.add('tertiary','sp-ux-text-link');
    }

    const ctas=$('#home .hero-ctas');
    if(ctas&&overview&&matching){ctas.appendChild(overview);ctas.appendChild(matching);}

    const access=$('#getStarted');
    if(access&&!/^CONTINUE/i.test(access.textContent.trim()))access.textContent='ACCESS ROLES';

    const mobileOverview=$('#mobileDrawer [data-open-selector="0"]');
    if(mobileOverview)mobileOverview.textContent='GUIDED OVERVIEW';

    const proof=$('#matching .eval-proof-bridge');
    if(proof){
      const title=$('b',proof),copy=$('span',proof),btn=$('button',proof);
      if(title)title.textContent='Want to verify the live workflow?';
      if(copy)copy.textContent='Open the same request across separate customer and worker sessions.';
      if(btn)btn.textContent='OPEN LIVE PROTOTYPE';
    }
  }

  function normalizeQuickActions(){
    const details=$('#home .quick-booking-details');
    if(!details)return;
    details.open=false;
    const summary=$('summary',details);
    if(summary)summary.textContent='Need a service or role? Quick actions';
    const service=$('#bookServiceHero');if(service)service.textContent='I NEED A SERVICE';
    const worker=$('#joinWorker');if(worker)worker.textContent='I AM A WORKER';
    const coop=$('#coopLogin');if(coop)coop.textContent='COOPERATIVE ACCESS';
  }

  function standardizeDemoTerminology(root=document){
    const exact=new Map([
      ['GUIDED DEMO','GUIDED OVERVIEW'],
      ['OPEN ROLE DEMOS','ACCESS ROLES'],
      ['ROLE DEMOS','ACCESS ROLES'],
      ['OPEN CONNECTED PROOF','OPEN LIVE PROTOTYPE'],
      ['VERIFY WITH CONNECTED PROTOTYPE','OPEN LIVE PROTOTYPE'],
      ['CONNECTED PROTOTYPE','LIVE PROTOTYPE']
    ]);
    $$('button',root).forEach(button=>{
      const raw=button.textContent.trim();
      const replacement=exact.get(raw.toUpperCase());
      if(replacement)button.textContent=replacement;
    });
  }

  function installValidationProof(){
    const card=$('#stakeholderValidationReadiness');
    if(!card||$('.sp-validation-proof-row',card))return;
    const row=document.createElement('div');
    row.className='sp-validation-proof-row';
    row.setAttribute('aria-label','Stakeholder validation status');
    row.innerHTML=`
      <div class="sp-validation-proof done"><b>Customer Validation</b><span>Collected</span></div>
      <div class="sp-validation-proof done"><b>Worker Validation</b><span>Collected</span></div>
      <div class="sp-validation-proof pending"><b>Cooperative/Admin Validation</b><span>Pending</span></div>`;
    const title=card.querySelector('h3');
    title?.insertAdjacentElement('afterend',row);
  }

  function installFooterMeta(){
    const footer=$('#landing .footer .wrap');
    if(!footer||$('.sp-v4-footer-meta'))return;
    const meta=document.createElement('div');
    meta.className='sp-v4-footer-meta';
    meta.innerHTML='<span><b>SIH 2026 · PS ID 26089</b> · Selection Build v4</span><span>Updated 01 Sep 2026 · Prototype / Sandbox / Future integrations explicitly labeled</span>';
    $('#landing .footer')?.appendChild(meta);
  }

  function closeMobileDrawer(){
    $$('#mobileDrawer a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{
      const drawer=$('#mobileDrawer'),menu=$('#menuBtn');
      drawer?.classList.add('hidden');
      drawer?.setAttribute('aria-hidden','true');
      menu?.setAttribute('aria-expanded','false');
    }));
  }

  async function openRole(role,mode='login',persona=null){
    for(let i=0;i<25&&!window.SanPaidAuth?.open;i++)await new Promise(r=>setTimeout(r,60));
    if(window.SanPaidAuth?.open){window.SanPaidAuth.open(role,mode,persona);return true;}
    return false;
  }

  function installUnifiedEntryGuards(){
    document.addEventListener('click',event=>{
      const t=event.target;
      if(!(t instanceof Element))return;
      let request=null;
      if(t.closest('[data-eval-open-connected],#evalOpenConnected,#evalFinalPrototype,#bookServiceHero'))request=['CUSTOMER','login','CUSTOMER'];
      else if(t.closest('#joinWorker'))request=['WORKER','signup','WORKER_A'];
      else if(t.closest('#evalAdminPrototype,#evalCapacityConnected'))request=['COOPERATIVE_ADMIN','login',null];
      if(!request)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openRole(...request);
    },true);
  }

  function installSectionTargetButtons(){
    $$('[data-scroll-target]').forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.scrollTarget;
      if(!id)return;
      document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
    }));
    $('#heroMatchingCta')?.addEventListener('click',()=>$('#matching')?.scrollIntoView({behavior:'smooth',block:'start'}));
    $('#evalFinalArchitecture')?.addEventListener('click',()=>$('#architecture')?.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  function installA11yLabels(){
    $$('#landing button').forEach(btn=>{
      if(!btn.getAttribute('aria-label')&&btn.textContent.trim())btn.setAttribute('aria-label',btn.textContent.trim().replace(/\s+/g,' '));
    });
    const radius=$('#evalRadius');
    radius?.setAttribute('aria-describedby','spV4RadiusHelp');
    const copy=$('#matching .eval-radius-copy');
    if(copy)copy.id='spV4RadiusHelp';
  }

  function roleNextCopy(role,text){
    const upper=text.toUpperCase();
    if(role==='CUSTOMER'){
      if(/NO ACTIVE BOOKING/.test(upper))return ['Ready to request a service','Describe what you need, then find a verified worker.'];
      if(/FINDING ANOTHER|FINDING VERIFIED|WAITING FOR WORKER|WORKER RESPONSE/.test(upper))return ['Request sent','Your request is active. Wait for an eligible worker response; this page updates automatically.'];
      if(/WORKER ARRIVED|ARRIVED/.test(upper)&&!/IDENTITY VERIFIED/.test(upper))return ['Worker arrived','Verify the worker identity before allowing the service to start.'];
      if(/IDENTITY VERIFIED/.test(upper)&&!/CUSTOMER CONFIRMED|SERVICE STARTED/.test(upper))return ['Worker identity verified','Confirm the worker for this booking to unlock service start.'];
      if(/SERVICE STARTED|IN PROGRESS/.test(upper))return ['Service in progress','Follow the service status. Confirm completion before payment.'];
      if(/PAYMENT PENDING|SERVICE COMPLETED|COMPLETED/.test(upper)&&!/PAID/.test(upper))return ['Service completed','Review the service and complete the payment step.'];
      if(/PAID|PAYMENT COMPLETED|CLOSED/.test(upper))return ['Service complete','Review the outcome and provide feedback when available.'];
      if(/WORKER ASSIGNED|ON THE WAY|TRAVELING/.test(upper))return ['Worker assigned','Track the worker and wait for arrival before verification.'];
      return ['Service request active','Follow the current status and complete the next highlighted action.'];
    }
    if(role==='WORKER'){
      if(/LOADING JOB OFFERS/.test(upper))return ['Checking opportunities','SanPaid is loading eligible opportunities for this worker.'];
      if(/NO JOB OFFERS/.test(upper))return ['No eligible opportunity right now','Stay available. New eligible opportunities will appear automatically.'];
      if(/JOB ACCEPTED|ACCEPTED/.test(upper))return ['Opportunity accepted','Follow the assigned booking steps and travel/service instructions.'];
      if(/NEW JOB OFFER|DECLINE|ACCEPT JOB/.test(upper))return ['New eligible opportunity','Review why you received it, earnings and distance, then choose Accept or Decline.'];
      return ['Worker workspace ready','Review current eligible opportunities and choose the next action.'];
    }
    return null;
  }

  function syncRoleNextAction(){
    const content=$('#connectedContent');
    if(!content)return;
    const role=content.dataset.connectedRole;
    if(!['CUSTOMER','WORKER'].includes(role)){content.querySelector('#spRoleNextAction')?.remove();return;}
    const appHeading=$('.connected-app-heading',content);
    if(!appHeading)return;
    let banner=$('#spRoleNextAction',content);
    if(!banner){
      banner=document.createElement('div');
      banner.id='spRoleNextAction';
      banner.className='connected-progress-note';
      banner.setAttribute('role','status');
      banner.setAttribute('aria-live','polite');
      appHeading.insertAdjacentElement('afterend',banner);
    }
    const source=role==='CUSTOMER'?($('#connectedCustomerState',content)?.textContent||content.textContent):($('#connectedWorkerOffers',content)?.textContent||content.textContent);
    const copy=roleNextCopy(role,source);
    if(!copy)return;
    const signature=copy.join('|');
    if(banner.dataset.signature===signature)return;
    banner.dataset.signature=signature;
    banner.innerHTML=`<b>CURRENT STATUS — ${copy[0]}</b><span>NEXT STEP — ${copy[1]}</span>`;
  }

  function installRoleNextAction(){
    let contentObserver=null;
    let timer=0;
    const attach=()=>{
      const content=$('#connectedContent');
      if(!content||content.dataset.spNextActionObserved==='1')return false;
      content.dataset.spNextActionObserved='1';
      const schedule=()=>{clearTimeout(timer);timer=setTimeout(syncRoleNextAction,30);};
      contentObserver=new MutationObserver(schedule);
      contentObserver.observe(content,{childList:true,subtree:true,characterData:true});
      schedule();
      return true;
    };
    if(attach())return;
    const bodyObserver=new MutationObserver(()=>{if(attach())bodyObserver.disconnect();});
    bodyObserver.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>bodyObserver.disconnect(),15000);
  }

  function polishDynamicSections(){
    installSectionRhythm();
    installValidationProof();
    standardizeDemoTerminology($('#landing')||document);
    $('#researchBackedUpgrades')?.querySelectorAll('[data-reveal]').forEach(n=>n.classList.add('sp-v4-reveal','sp-v4-visible'));
    $('#top1Readiness')?.querySelectorAll('[data-reveal]').forEach(n=>n.classList.add('sp-v4-reveal','sp-v4-visible'));
  }

  function ensureDynamicPolish(){
    const landing=$('#landing');
    if(!landing)return;
    let timer=0;
    const observer=new MutationObserver(records=>{
      const relevant=records.some(record=>Array.from(record.addedNodes).some(node=>node instanceof HTMLElement&&(
        node.id==='researchBackedUpgrades'||node.id==='top1Readiness'||node.querySelector?.('#researchBackedUpgrades,#top1Readiness')
      )));
      if(!relevant)return;
      clearTimeout(timer);
      timer=setTimeout(()=>{
        polishDynamicSections();
        if($('#researchBackedUpgrades')&&$('#top1Readiness'))observer.disconnect();
      },40);
    });
    observer.observe(landing,{childList:true,subtree:true});
    setTimeout(()=>{
      polishDynamicSections();
      if($('#researchBackedUpgrades')&&$('#top1Readiness'))observer.disconnect();
    },1200);
    setTimeout(()=>observer.disconnect(),10000);
  }

  function start(){
    if(!$('#landing'))return;
    removeLegacyAuth();
    installSectionRhythm();
    installScrollState();
    installSafeReveal();
    installMatchingProgress();
    simplifyPrimaryJourney();
    normalizeQuickActions();
    standardizeDemoTerminology($('#landing'));
    installValidationProof();
    installFooterMeta();
    closeMobileDrawer();
    installUnifiedEntryGuards();
    installSectionTargetButtons();
    installA11yLabels();
    installRoleNextAction();
    ensureDynamicPolish();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
