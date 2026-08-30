(() => {
  'use strict';

  let declineReturnFocus=null;

  function injectStyles(){
    if(document.getElementById('sanpaidFinalPolishStyles'))return;
    const style=document.createElement('style');
    style.id='sanpaidFinalPolishStyles';
    style.textContent=`
      .connected-trust-checks{display:grid;gap:8px;margin:12px 0}
      .connected-trust-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid #ead8a8;background:#fff9ea;border-radius:11px}
      .connected-trust-row.done{border-color:#c4e8d5;background:#eef9f3}
      .connected-payment-success{line-height:1.65}
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
    if(ribbon)ribbon.innerHTML='Smart India Hackathon 2026 · PS ID <b>26089</b> · Cooperative Gig Services Platform';

    const productBadge=hero.querySelector('.hero-grid>div:first-child>.eyebrow');
    if(productBadge)productBadge.textContent='AI-Assisted Cooperative Workforce Network';

    const research=hero.querySelector('#selectorResearchBtn');
    if(research){
      research.textContent='Explore Research & Proof →';
      research.classList.add('hero-tertiary-link');
      research.classList.remove('ghost');
    }

    const note=hero.querySelector('.selector-home-note');
    if(note)note.innerHTML='<span class="selector-proof-line">✓ No login required for the guided SIH overview</span>';

    const loopCard=hero.querySelector('.loop-card');
    if(loopCard){
      const title=loopCard.querySelector(':scope > .eyebrow, :scope > .loop-title');
      if(title){title.textContent='SANPAID OPERATING MODEL';title.classList.remove('eyebrow');title.classList.add('loop-title');}
      const labels=['Customer Demand','Verified Eligibility','Fair Allocation','Worker Choice','Trusted Service','Govern & Plan'];
      loopCard.querySelectorAll('.loop-step').forEach((step,index)=>{
        const number=String(index+1).padStart(2,'0');
        step.classList.remove('active');
        step.setAttribute('aria-label',`${number} ${labels[index]||''}`.trim());
        step.innerHTML=`<span class="loop-no">${number}</span><span class="loop-label">${labels[index]||''}</span>`;
      });
      const message=loopCard.querySelector('.loop-message');
      if(message)message.textContent='Service delivery continues into cooperative governance, capacity coordination and workforce planning.';
    }

    const trust=landing.querySelector('#trust');
    if(trust){
      const trustLabels=['Verified Workforce','Eligibility-First','Worker Choice','Cooperative Governance'];
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