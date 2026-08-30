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

      /* Final evaluator hero balance: strong, readable and calm rather than tiny. */
      @media (min-width:961px){
        #landing .eval-nav .navin{height:64px!important}
        #landing .eval-nav.nav-compact .navin{height:58px!important}
        #landing .eval-nav .navlinks{gap:22px!important}
        #landing .eval-nav .navlinks a{font-size:12.5px!important}
        #landing .eval-sih-chip,#landing #getStarted{display:none!important}
        #landing .eval-nav .actions{gap:8px!important}
        #landing .eval-nav .actions .btn.primary{min-height:42px!important;padding:9px 17px!important;font-size:11.5px!important}

        #landing #home.eval-hero{
          padding:46px 0 0!important;
          background:linear-gradient(180deg,#fbfcfd 0%,#f6f9fb 100%)!important;
        }
        #landing #home .eval-hero-grid{
          grid-template-columns:minmax(0,1fr) minmax(430px,.92fr)!important;
          gap:50px!important;
          align-items:center!important;
          max-width:1180px!important;
        }
        #landing #home .eval-hero-copy{align-self:center!important}
        #landing #home .eval-badge{
          padding:6px 10px!important;
          font-size:9.5px!important;
          letter-spacing:.055em!important;
          border-color:#bddfd8!important;
          background:#eaf7f4!important;
          color:#14726c!important;
        }
        #landing #home h1{
          max-width:650px!important;
          margin:15px 0 14px!important;
          font-size:clamp(44px,4.35vw,60px)!important;
          line-height:1.02!important;
          letter-spacing:-.046em!important;
        }
        #landing #home .lead{
          max-width:620px!important;
          font-size:15px!important;
          line-height:1.56!important;
          color:#4f6376!important;
        }
        #landing #home .hero-master-flow{
          margin-top:18px!important;
          gap:6px!important;
          flex-wrap:nowrap!important;
        }
        #landing #home .hero-master-flow span{
          padding:6px 9px!important;
          border-radius:999px!important;
          background:#fff!important;
          border:1px solid #d5e0e8!important;
          color:#29455a!important;
          font-size:10px!important;
          font-weight:750!important;
          white-space:nowrap;
        }
        #landing #home .hero-master-flow i{font-size:10px!important;color:#8599a9!important}
        #landing #home .hero-ctas{
          margin:19px 0 7px!important;
          gap:9px!important;
          flex-wrap:nowrap!important;
        }
        #landing #home .hero-ctas .btn{
          min-height:43px!important;
          padding:9px 14px!important;
          font-size:10.5px!important;
          white-space:nowrap;
        }
        #landing #home .hero-ctas .btn.primary{min-width:176px!important}
        #landing #home .hero-ctas .btn.secondary{min-width:170px!important}
        #landing #home #selectorResearchBtn{
          color:#49677c!important;
          font-weight:750!important;
          opacity:1!important;
        }
        #landing #home #selectorResearchBtn:hover{color:#0b7a75!important}
        #landing #home .eval-hero-principle{
          margin-top:8px!important;
          gap:7px!important;
          font-size:10px!important;
          color:#526879!important;
        }
        #landing #home .eval-hero-principle b{color:#2f4a5f!important}
        #landing #home .selector-home-note{margin:5px 0 0!important}
        #landing #home .selector-proof-line{
          font-size:10px!important;
          line-height:1.35!important;
          color:#667b8c!important;
        }

        /* Make the live system visual readable even while the sequence is animating. */
        #landing .eval-hero-system{
          padding:18px!important;
          border:1px solid #c7d5df!important;
          border-radius:22px!important;
          background:#fff!important;
          box-shadow:0 20px 55px rgba(28,55,77,.10)!important;
        }
        #landing .eval-hero-system::before{height:3px!important}
        #landing .eval-system-top{margin-bottom:11px!important}
        #landing .eval-system-label{font-size:9px!important;color:#39596f!important}
        #landing .eval-system-demo{background:#edf5fa!important;color:#2f6c93!important}
        #landing .eval-mini-request,
        #landing .eval-mini-gate,
        #landing .eval-mini-rank,
        #landing .eval-mini-offer,
        #landing .eval-mini-audit{
          background:#fbfdff!important;
          border-color:#ccd9e2!important;
        }
        #landing .eval-mini-request{padding:10px 12px!important}
        #landing .eval-mini-request small,
        #landing .eval-mini-gate small,
        #landing .eval-mini-offer small,
        #landing .eval-mini-audit small{color:#65798a!important}
        #landing .eval-mini-request b{font-size:12px!important;color:#17344b!important}
        #landing .eval-mini-request span{font-size:8.5px!important;color:#647b8d!important}
        #landing .eval-mini-workers{gap:7px!important;margin:8px 0!important}
        #landing .hero-worker{
          min-height:46px!important;
          font-size:10px!important;
          color:#506a7e!important;
          background:#f7fafc!important;
          border-color:#d3dee6!important;
        }
        #landing .hero-worker span{font-size:7.5px!important;color:#718697!important}
        #landing .hero-worker.bad.hero-remove{opacity:.55!important;transform:scale(.97)!important;background:#fbf7f7!important;border-color:#e4caca!important}
        #landing .hero-worker.good.hero-pass{background:#eaf7f0!important;border-color:#9fd6bb!important;color:#146f47!important}
        #landing .eval-mini-gate{padding:9px!important;gap:6px!important}
        #landing .eval-mini-gate strong{font-size:15px!important}
        #landing .eval-mini-rank{margin-top:8px!important;padding:9px!important}
        #landing .eval-mini-rank span{padding:6px 7px!important;font-size:9px!important;color:#294f6b!important;background:#eef5fa!important}
        #landing .eval-mini-rank small{color:#667c8e!important}
        #landing .eval-mini-offer{margin-top:8px!important;padding:9px 11px!important}
        #landing .eval-mini-offer b{margin:2px 0 6px!important;font-size:11px!important;color:#17344b!important}
        #landing .eval-mini-offer div span{color:#50687a!important;background:#fff!important}
        #landing .eval-mini-offer div .accept{background:#eaf7f0!important;color:#146f47!important}
        #landing .eval-mini-audit{margin-top:8px!important;padding:9px 11px!important}
        #landing .eval-mini-audit b{font-size:9.5px!important;color:#365367!important}
        #landing .hero-seq{opacity:.72!important;transform:translateY(1px)!important}
        #landing .hero-seq.hero-active{opacity:1!important;transform:none!important;border-color:#8fb3c8!important}
        #landing .eval-system-progress{margin-top:10px!important}

        /* Attach the trust proof to the hero instead of making it look like a separate banner. */
        #landing #home>.eval-trust{
          margin-top:30px!important;
          background:#f8fbfc!important;
          border-top:1px solid #dce5eb!important;
          border-bottom:1px solid #dce5eb!important;
        }
        #landing #home>.eval-trust .trustin{
          min-height:46px!important;
          gap:12px!important;
        }
        #landing #home>.eval-trust span{
          font-size:10.5px!important;
          color:#405b6f!important;
          font-weight:650!important;
        }
      }

      /* Common laptop heights: keep the complete hero visible without making it microscopic. */
      @media (min-width:961px) and (max-height:780px){
        #landing #home.eval-hero{padding-top:30px!important}
        #landing #home .eval-hero-grid{gap:40px!important;grid-template-columns:minmax(0,1fr) minmax(405px,.9fr)!important}
        #landing #home h1{margin:11px 0 10px!important;font-size:clamp(40px,4vw,52px)!important}
        #landing #home .lead{font-size:13.5px!important;line-height:1.46!important}
        #landing #home .hero-master-flow{margin-top:13px!important}
        #landing #home .hero-master-flow span{padding:5px 7px!important;font-size:9px!important}
        #landing #home .hero-ctas{margin:14px 0 5px!important}
        #landing #home .hero-ctas .btn{min-height:39px!important;padding:7px 11px!important;font-size:9.8px!important}
        #landing #home .eval-hero-principle{margin-top:5px!important;font-size:9.3px!important}
        #landing #home .selector-proof-line{font-size:9.2px!important}
        #landing .eval-hero-system{padding:14px!important}
        #landing .eval-mini-request{padding:8px 10px!important}
        #landing .hero-worker{min-height:40px!important}
        #landing .eval-mini-gate{padding:7px!important}
        #landing .eval-mini-rank{margin-top:6px!important;padding:7px!important}
        #landing .eval-mini-offer,#landing .eval-mini-audit{margin-top:6px!important;padding:7px 9px!important}
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