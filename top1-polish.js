(() => {
  'use strict';

  let declineReturnFocus=null;

  function injectStyles(){
    if(document.getElementById('sanpaidFinalPolishStyles'))return;
    const style=document.createElement('style');
    style.id='sanpaidFinalPolishStyles';
    style.textContent=`
      .ribbon{display:none!important}
      .connected-trust-checks{display:grid;gap:8px;margin:12px 0}
      .connected-trust-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid #ead8a8;background:#fff9ea;border-radius:11px}
      .connected-trust-row.done{border-color:#c4e8d5;background:#eef9f3}
      .connected-payment-success{line-height:1.65}

      /* Keep the complete evaluator message visible together on laptop/desktop screens. */
      @media (min-width:961px){
        #landing .eval-nav .navin{height:62px!important}
        #landing .eval-nav.nav-compact .navin{height:56px!important}
        #landing #home.eval-hero{padding:34px 0 0!important}
        #landing #home .eval-hero-grid{
          grid-template-columns:minmax(0,1.08fr) minmax(370px,.92fr)!important;
          gap:44px!important;
          align-items:center!important;
        }
        #landing #home .eval-badge{padding:5px 8px!important;font-size:9px!important}
        #landing #home h1{
          margin:12px 0 10px!important;
          font-size:clamp(40px,4.25vw,56px)!important;
          line-height:1.02!important;
          letter-spacing:-.045em!important;
        }
        #landing #home .lead{
          max-width:650px!important;
          font-size:14px!important;
          line-height:1.5!important;
        }
        #landing #home .hero-master-flow{margin-top:15px!important;gap:6px!important;flex-wrap:nowrap!important}
        #landing #home .hero-master-flow span{padding:5px 7px!important;font-size:9.5px!important;white-space:nowrap}
        #landing #home .hero-master-flow i{font-size:10px!important}
        #landing #home .hero-ctas{margin:16px 0 7px!important;gap:7px!important;flex-wrap:nowrap!important}
        #landing #home .hero-ctas .btn{
          min-height:40px!important;
          padding:8px 12px!important;
          font-size:10.5px!important;
          white-space:nowrap;
        }
        #landing #home .eval-hero-principle{margin-top:7px!important;gap:6px!important;font-size:9.5px!important}
        #landing #home .selector-home-note{margin:5px 0 0!important}
        #landing #home .selector-proof-line{font-size:9.5px!important;line-height:1.3!important}

        #landing .eval-hero-system{padding:15px!important;border-radius:20px!important}
        #landing .eval-system-top{margin-bottom:9px!important}
        #landing .eval-mini-request{padding:9px 10px!important}
        #landing .eval-mini-request b{font-size:11.5px!important}
        #landing .eval-mini-workers{gap:6px!important;margin:7px 0!important}
        #landing .hero-worker{min-height:44px!important;font-size:10px!important}
        #landing .eval-mini-gate{padding:8px!important;gap:5px!important}
        #landing .eval-mini-gate strong{font-size:14px!important}
        #landing .eval-mini-rank{margin-top:7px!important;padding:8px!important}
        #landing .eval-mini-rank span{padding:5px!important;font-size:9px!important}
        #landing .eval-mini-offer{margin-top:7px!important;padding:8px 10px!important}
        #landing .eval-mini-offer b{margin:2px 0 5px!important;font-size:10.5px!important}
        #landing .eval-mini-audit{margin-top:7px!important;padding:8px 10px!important}
        #landing .eval-system-progress{margin-top:9px!important}
        #landing #home>.eval-trust{margin-top:28px!important}
        #landing #home>.eval-trust .trustin{min-height:44px!important}
      }

      @media (min-width:961px) and (max-height:760px){
        #landing #home.eval-hero{padding-top:24px!important}
        #landing #home .eval-hero-grid{gap:36px!important}
        #landing #home h1{margin:9px 0 8px!important;font-size:clamp(37px,3.9vw,49px)!important}
        #landing #home .lead{font-size:13px!important;line-height:1.42!important}
        #landing #home .hero-master-flow{margin-top:11px!important}
        #landing #home .hero-ctas{margin:12px 0 5px!important}
        #landing #home .hero-ctas .btn{min-height:37px!important;padding:7px 10px!important;font-size:10px!important}
        #landing #home .eval-hero-principle{margin-top:5px!important;font-size:9px!important}
        #landing #home .selector-proof-line{font-size:9px!important}
        #landing .eval-hero-system{padding:12px!important}
        #landing .hero-worker{min-height:40px!important}
        #landing #home>.eval-trust{margin-top:20px!important}
        #landing #home>.eval-trust .trustin{min-height:40px!important}
      }

      @media print{
        body>*{display:none!important}
        #connectedShell{display:block!important;position:static!important;background:#fff!important}
        #connectedShell .connected-top,#connectedShell .connected-actions,#connectedModalRoot{display:none!important}
        .connected-shell,.connected-main{overflow:visible!important;width:100%!important;max-width:none!important;padding:0!important}
        .connected-card{box-shadow:none!important;break-inside:avoid}
      }
    `;
    document.head.appendChild(style);
  }

  function loadHeroViewportFix(){
    if(document.getElementById('sanpaidHeroViewportFix'))return;
    const link=document.createElement('link');
    link.id='sanpaidHeroViewportFix';
    link.rel='stylesheet';
    link.href='hero-viewport-fix.css';
    document.head.appendChild(link);
  }

  function polishLandingHero(){
    const landing=document.getElementById('landing');
    const hero=document.getElementById('home');
    if(!landing||!hero)return;

    const ribbon=landing.querySelector('.ribbon');
    if(ribbon)ribbon.remove();

    const productBadge=hero.querySelector('.hero-grid>div:first-child>.eyebrow');
    if(productBadge){
      productBadge.textContent='SIH 2026 • Cooperative Workforce Network';
      productBadge.classList.add('eval-badge');
    }

    const research=hero.querySelector('#selectorResearchBtn');
    if(research){
      research.textContent='3-Minute SIH Overview →';
      research.classList.add('hero-tertiary-link');
      research.classList.remove('ghost');
    }

    const note=hero.querySelector('.selector-home-note');
    if(note)note.innerHTML='<span class="selector-proof-line">✓ Guided overview needs no login · Connected prototype uses isolated demo accounts</span>';

    const loopCard=hero.querySelector('.loop-card');
    if(loopCard){
      const title=loopCard.querySelector(':scope > .eyebrow, :scope > .loop-title');
      if(title){title.textContent='SANPAID DECISION LOGIC';title.classList.remove('eyebrow');title.classList.add('loop-title');}
      const labels=['Service Request','Eligibility Gate','Fair & Explainable Ranking','Worker Choice','Service Verification','Payment','Audit & Outcome'];
      loopCard.querySelectorAll('.loop-step').forEach((step,index)=>{
        const number=String(index+1).padStart(2,'0');
        step.classList.remove('active');
        step.setAttribute('aria-label',`${number} ${labels[index]||''}`.trim());
        step.innerHTML=`<span class="loop-no">${number}</span><span class="loop-label">${labels[index]||''}</span>`;
      });
      const message=loopCard.querySelector('.loop-message');
      if(message)message.textContent='Only eligible workers reach ranking. Opportunities are offered, not forced. Service outcomes remain traceable.';
    }

    const trust=landing.querySelector('#trust');
    if(trust){
      const trustLabels=['Cooperative Governance','Eligibility Gate','Worker Choice','Cross-Cooperative Capacity'];
      trust.querySelectorAll('span').forEach((node,index)=>{if(trustLabels[index])node.textContent=trustLabels[index];});
      if(trust.parentElement!==hero)hero.appendChild(trust);
    }
  }

  function loadCredibilityLayer(){
    if(!document.getElementById('sanpaidCredibilityStyles')){
      const link=document.createElement('link');link.id='sanpaidCredibilityStyles';link.rel='stylesheet';link.href='credibility-layer.css';document.head.appendChild(link);
    }
    if(!document.getElementById('sanpaidCredibilityScript')){
      const script=document.createElement('script');script.id='sanpaidCredibilityScript';script.src='credibility-layer.js';script.defer=true;document.body.appendChild(script);
    }
  }

  function loadWorkforceIntelligence(){
    if(!document.getElementById('sanpaidWorkforceIntelligenceStyles')){
      const link=document.createElement('link');link.id='sanpaidWorkforceIntelligenceStyles';link.rel='stylesheet';link.href='workforce-intelligence.css';document.head.appendChild(link);
    }
    if(!document.getElementById('sanpaidWorkforceIntelligenceScript')){
      const script=document.createElement('script');script.id='sanpaidWorkforceIntelligenceScript';script.src='workforce-intelligence.js';script.defer=true;document.body.appendChild(script);
    }
    if(!document.getElementById('sanpaidWorkerTrustPassportScript')){
      const script=document.createElement('script');script.id='sanpaidWorkerTrustPassportScript';script.src='worker-trust-passport-ui.js';script.defer=true;document.body.appendChild(script);
    }
  }

  function scheduleJudgeCredibility(){
    [1200,3000].forEach(delay=>setTimeout(()=>{
      const shell=document.getElementById('sihJudgeShell');
      if(!shell||shell.classList.contains('judge-hidden'))return;
      if(!shell.querySelector('.judge-tabs')||shell.querySelector('[data-judge-tab="credibility"]'))return;
      window.SanPaidJudgeMode?.open?.();
    },delay));
  }

  function focusable(root){return [...root.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&el.getClientRects().length);}
  function trapFocus(event,root){if(event.key!=='Tab')return;const nodes=focusable(root);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}

  function start(){
    injectStyles();
    loadHeroViewportFix();
    polishLandingHero();
    loadCredibilityLayer();
    loadWorkforceIntelligence();

    document.addEventListener('keydown',event=>{
      const connectedDialog=document.querySelector('#connectedModalRoot [role="dialog"]');
      if(event.key==='Tab'&&connectedDialog){trapFocus(event,connectedDialog);return;}
      if(event.key!=='Escape')return;
      const connectedCancel=document.querySelector('#connectedModalRoot [data-modal-cancel]');
      if(connectedCancel)connectedCancel.click();
    });

    document.addEventListener('click',event=>{
      if(event.target.closest?.('[data-judge-role]'))scheduleJudgeCredibility();
      const decline=event.target.closest?.('[data-reject-offer]');
      if(decline){declineReturnFocus=decline;setTimeout(()=>{document.querySelector('#connectedModalRoot input[name="declineReason"]')?.focus();},0);return;}
      const connectedCancel=event.target.closest?.('#connectedModalRoot [data-modal-cancel]');
      if(connectedCancel&&declineReturnFocus){const target=declineReturnFocus;declineReturnFocus=null;setTimeout(()=>{if(target.isConnected)target.focus();},0);}
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();