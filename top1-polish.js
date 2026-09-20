(() => {
  'use strict';

  const loaded=new Set();
  let administrationLoaded=false;
  let customerWorkerLoaded=false;
  let roleShellLoaded=false;
  let enhancementsLoaded=false;
  let authLoaded=false;
  let landingPolishLoaded=false;

  function stylesheet(id,href){
    if(document.getElementById(id)||loaded.has(href))return;
    loaded.add(href);
    const link=document.createElement('link');
    link.id=id;link.rel='stylesheet';link.href=href;
    document.head.appendChild(link);
  }

  function script(id,src){
    if(document.getElementById(id)||loaded.has(src))return;
    loaded.add(src);
    const node=document.createElement('script');
    node.id=id;node.src=src;node.defer=true;
    document.body.appendChild(node);
  }


  const LANDING_PREMIUM_CSS = String.raw`
/* SanPaid landing premium polish — additive, dependency-free, mobile-first. */
#landing.landing-v3{
  --lp-ink:#10243b;
  --lp-muted:#5d7187;
  --lp-blue:#123d73;
  --lp-blue-2:#1b5f9e;
  --lp-blue-soft:#edf5fc;
  --lp-line:#dbe7f2;
  --lp-surface:rgba(255,255,255,.88);
  --lp-shadow:0 24px 70px rgba(20,55,92,.10);
  background:
    radial-gradient(circle at 78% 7%,rgba(45,111,174,.10),transparent 29rem),
    radial-gradient(circle at 12% 18%,rgba(82,151,205,.065),transparent 25rem),
    linear-gradient(180deg,#fbfdff 0,#f7faff 31rem,#fff 31rem,#fff 100%);
}
#landing.landing-v3 .wrap{width:min(1210px,calc(100% - 44px))}
#landing.landing-v3 .ribbon{
  padding:7px 18px;
  background:#0c2e56;
  color:#dbeafb;
  font-size:10px;
  font-weight:700;
  letter-spacing:.065em;
  text-transform:uppercase;
}
#landing.landing-v3 .nav{
  background:rgba(252,254,255,.88);
  border-bottom-color:rgba(205,220,235,.72);
  box-shadow:none;
  backdrop-filter:blur(18px) saturate(135%);
}
#landing.landing-v3 .nav.nav-compact{
  background:rgba(255,255,255,.95);
  box-shadow:0 12px 34px rgba(25,53,85,.075);
}
#landing.landing-v3 .navin{min-height:70px}
#landing.landing-v3 .brand{font-size:25px}
#landing.landing-v3 .navlinks{gap:23px}
#landing.landing-v3 .navlinks a{
  color:#53677d;
  font-size:12px;
  font-weight:750;
}
#landing.landing-v3 .navlinks a:hover,
#landing.landing-v3 .navlinks a.is-active{color:var(--lp-blue)}
#landing.landing-v3 .btn{
  min-height:46px;
  border-radius:14px;
  padding:0 19px;
  letter-spacing:.02em;
}
#landing.landing-v3 .btn.primary{
  background:linear-gradient(135deg,#123d73,#1a5790);
  box-shadow:0 13px 30px rgba(18,61,115,.20);
}
#landing.landing-v3 .btn.primary:hover{background:linear-gradient(135deg,#0f345f,#174f83)}
#landing.landing-v3 .btn.secondary{
  border-color:#bfd3e7;
  background:rgba(255,255,255,.86);
}
#landing.landing-v3 .hero{
  position:relative;
  isolation:isolate;
  padding:74px 0 30px;
}
#landing.landing-v3 .hero:before{
  content:"";
  position:absolute;
  z-index:-2;
  inset:0 0 auto;
  height:min(760px,100%);
  background-image:
    linear-gradient(rgba(36,84,130,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(36,84,130,.045) 1px,transparent 1px);
  background-size:44px 44px;
  mask-image:linear-gradient(to bottom,rgba(0,0,0,.64),transparent 92%);
  pointer-events:none;
}
#landing.landing-v3 .hero:after{
  content:"";
  position:absolute;
  z-index:-1;
  width:520px;
  height:520px;
  right:max(-170px,calc((100vw - 1210px)/2 - 240px));
  top:46px;
  border-radius:50%;
  background:radial-gradient(circle,rgba(70,139,199,.13),rgba(70,139,199,0) 67%);
  pointer-events:none;
}
#landing.landing-v3 .hero-grid{
  grid-template-columns:minmax(0,1.02fr) minmax(430px,.98fr);
  gap:68px;
  align-items:center;
}
#landing.landing-v3 .hero-copy{position:relative;z-index:3}
#landing.landing-v3 .eyebrow{
  background:rgba(235,244,252,.84);
  border-color:#cadff1;
  color:#174e82;
  padding:8px 11px;
  font-size:9px;
  box-shadow:inset 0 1px rgba(255,255,255,.75);
}
#landing.landing-v3 .hero-kicker{
  margin:19px 0 8px;
  color:#557896;
  font-size:11px;
  letter-spacing:.095em;
}
#landing.landing-v3 h1{
  max-width:720px;
  color:var(--lp-ink);
  font-size:clamp(49px,5.15vw,74px);
  line-height:.97;
  letter-spacing:-.058em;
  text-wrap:balance;
}
#landing.landing-v3 h1 em{
  position:relative;
  display:inline-block;
  color:var(--lp-blue);
}
#landing.landing-v3 h1 em:after{
  content:"";
  position:absolute;
  left:2px;
  right:3%;
  bottom:-7px;
  height:7px;
  border-radius:999px;
  background:linear-gradient(90deg,rgba(40,101,161,.22),rgba(40,101,161,.04));
}
#landing.landing-v3 .lead{
  max-width:660px;
  margin-top:25px;
  color:#536a81;
  font-size:15.5px;
  line-height:1.7;
}
#landing.landing-v3 .lead b{color:#263e58}
#landing.landing-v3 .hero-ctas{margin-top:27px;gap:10px}
#landing.landing-v3 .hero-proof-chips{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-top:17px;
}
#landing.landing-v3 .hero-proof-chips span{
  display:inline-flex;
  align-items:center;
  min-height:31px;
  padding:6px 10px;
  border:1px solid #d8e5f0;
  border-radius:999px;
  background:rgba(255,255,255,.68);
  color:#60758a;
  font-size:8.5px;
  font-weight:720;
  box-shadow:0 6px 22px rgba(24,59,94,.035);
}
#landing.landing-v3 .hero-usp-row{
  gap:9px;
  margin-top:18px;
}
#landing.landing-v3 .hero-usp{
  position:relative;
  overflow:hidden;
  border-color:#d4e2ef;
  border-radius:15px;
  padding:13px 14px 13px 17px;
  background:rgba(255,255,255,.76);
  box-shadow:0 9px 28px rgba(23,57,91,.045);
}
#landing.landing-v3 .hero-usp:before{
  content:"";
  position:absolute;
  inset:0 auto 0 0;
  width:3px;
  background:linear-gradient(#2a6ba8,#86afd2);
}
#landing.landing-v3 .hero-usp small{font-size:7.5px}
#landing.landing-v3 .hero-usp b{font-size:10.7px}
#landing.landing-v3 .hero-usp span{font-size:8.7px}
#landing.landing-v3 .hero-visual{
  --sp-pointer-x:0px;
  --sp-pointer-y:0px;
  position:relative;
  min-height:548px;
  padding:19px;
  overflow:hidden;
  border:1px solid rgba(191,211,231,.88);
  border-radius:32px;
  background:
    radial-gradient(circle at 76% 18%,rgba(93,155,207,.13),transparent 16rem),
    linear-gradient(150deg,rgba(255,255,255,.94),rgba(242,248,253,.90));
  box-shadow:
    0 32px 90px rgba(20,55,92,.13),
    inset 0 1px rgba(255,255,255,.9);
}
#landing.landing-v3 .hero-visual:before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
  background:
    linear-gradient(rgba(74,122,168,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(74,122,168,.045) 1px,transparent 1px);
  background-size:34px 34px;
  mask-image:linear-gradient(145deg,#000,transparent 78%);
}
#landing.landing-v3 .phone-stage{
  translate:var(--sp-pointer-x) var(--sp-pointer-y);
  transition:translate .22s ease-out;
}
#landing.landing-v3 .phone-shell{
  filter:drop-shadow(0 28px 38px rgba(24,55,87,.13));
}
#landing.landing-v3 .float-card{
  border-color:rgba(186,207,227,.9);
  background:rgba(255,255,255,.88);
  box-shadow:0 20px 46px rgba(18,61,115,.13);
}
#landing.landing-v3 .visual-caption{
  margin:4px 5px 0;
  border-top-color:#d9e6f1;
}
#landing.landing-v3 .evidence-strip{margin-top:36px}
#landing.landing-v3 .evidence-strip-inner{
  border-color:#dce7f1;
  border-radius:20px;
  background:rgba(255,255,255,.82);
  box-shadow:0 18px 48px rgba(24,57,91,.065);
  backdrop-filter:blur(12px);
}
#landing.landing-v3 .evidence-main,
#landing.landing-v3 .evidence-stat{padding:17px 19px}
#landing.landing-v3 .evidence-main b,
#landing.landing-v3 .evidence-stat b{color:#223b55}
#landing.landing-v3 .section{padding:82px 0}
#landing.landing-v3 .section.alt{
  background:linear-gradient(180deg,#f7faff,#f4f8fc);
  border-color:#eaf0f6;
}
#landing.landing-v3 .compact-head{max-width:780px;margin-bottom:31px}
#landing.landing-v3 .compact-head .tag{
  display:inline-flex;
  align-items:center;
  min-height:25px;
  padding:5px 9px;
  border:1px solid #d2e1ef;
  border-radius:999px;
  background:#f4f9fd;
  color:#315f89;
  font-size:8px;
}
#landing.landing-v3 .compact-head h2{
  margin-top:11px;
  color:#152b42;
  font-size:clamp(31px,3.25vw,45px);
  line-height:1.08;
  letter-spacing:-.045em;
  text-wrap:balance;
}
#landing.landing-v3 .compact-head p{
  max-width:690px;
  color:#667b90;
  font-size:13.5px;
  line-height:1.65;
}
#landing.landing-v3 .problem-card,
#landing.landing-v3 .story-card,
#landing.landing-v3 .diff-card,
#landing.landing-v3 .role-card,
#landing.landing-v3 .evidence-card,
#landing.landing-v3 .impact-card,
#landing.landing-v3 .technical-details{
  border-color:#dbe6f0;
  background:rgba(255,255,255,.90);
  box-shadow:0 10px 30px rgba(23,54,85,.045);
}
#landing.landing-v3 .problem-card:hover,
#landing.landing-v3 .story-card:hover,
#landing.landing-v3 .diff-card:hover,
#landing.landing-v3 .role-card:hover,
#landing.landing-v3 .impact-card:hover{
  border-color:#bfd5e8;
  box-shadow:0 22px 48px rgba(22,58,94,.095);
}
#landing.landing-v3 .visual-card-grid .problem-card{
  min-height:190px;
  padding:18px;
}
#landing.landing-v3 .card-icon,
#landing.landing-v3 .impact-icon,
#landing.landing-v3 .role-avatar{
  border-color:#d1e2f0;
  background:linear-gradient(145deg,#f4f9fd,#e8f3fb);
  box-shadow:inset 0 1px #fff;
}
#landing.landing-v3 .story-card{min-height:272px}
#landing.landing-v3 .story-art{
  background:
    radial-gradient(circle at 50% 45%,rgba(76,141,194,.11),transparent 54%),
    linear-gradient(145deg,#f7fbff,#edf6fd);
}
#landing.landing-v3 .visual-workflow{
  border-color:#d8e5f0;
  background:rgba(255,255,255,.9);
  box-shadow:0 18px 46px rgba(22,55,89,.055);
}
#landing.landing-v3 .flow-line{
  overflow:hidden;
  background:#d5e4f1;
}
#landing.landing-v3 .flow-line:before{
  content:"";
  position:absolute;
  inset:0;
  width:42%;
  background:linear-gradient(90deg,transparent,#2b70ad,transparent);
  animation:lpFlowSignal 2.8s ease-in-out infinite;
}
#landing.landing-v3 .workflow-guardrails span{
  background:#fbfdff;
  border-color:#dfe8f1;
}
#landing.landing-v3 .usp-visual-grid .usp-card{
  border-top-width:1px;
  border-color:#c8dceb;
  border-radius:22px;
  background:
    radial-gradient(circle at 86% 8%,rgba(76,141,194,.08),transparent 13rem),
    linear-gradient(145deg,#fff,#f7fbff);
}
#landing.landing-v3 .usp-visual-grid .usp-card small{color:#426a8f}
#landing.landing-v3 .usp-scene{
  border-color:#d7e5f1;
  background:linear-gradient(145deg,#f6fbff,#edf6fd);
}
#landing.landing-v3 .supporting-control{
  background:#fbfdff;
  border-style:dashed;
}
#landing.landing-v3 .evidence-v3 .evidence-card{
  border-radius:16px;
}
#landing.landing-v3 .evidence-v3 .evidence-card .decision{
  border-left-color:#8eb7d8;
}
#landing.landing-v3 .impact-v3 .impact-card{min-height:205px}
#landing.landing-v3 .pilot-loop{
  border-color:#d9e6f0;
  border-radius:18px;
  background:#fbfdff;
}
#landing.landing-v3 .pilot-loop span{
  border:1px solid #d3e4f2;
  background:#eef6fc;
}
#landing.landing-v3 .technical-details{
  box-shadow:none;
}
#landing.landing-v3 .final-cta{
  padding:72px 0;
  background:
    radial-gradient(circle at 82% 35%,rgba(128,181,226,.17),transparent 23rem),
    linear-gradient(135deg,#0b2b50,#123d73 58%,#174d80);
}
#landing.landing-v3 .final-cta h2{max-width:790px}
#landing.landing-v3 .footer{background:#092640}
@keyframes lpFlowSignal{
  0%{transform:translateX(-130%);opacity:0}
  25%{opacity:.85}
  70%{opacity:.65}
  100%{transform:translateX(340%);opacity:0}
}
@media (max-width:1020px){
  #landing.landing-v3 .hero-grid{grid-template-columns:1fr;gap:31px}
  #landing.landing-v3 .hero-copy{max-width:790px}
  #landing.landing-v3 .hero-visual{max-width:790px}
}
@media (max-width:720px){
  #landing.landing-v3 .wrap{width:min(100% - 28px,1210px)}
  #landing.landing-v3 .ribbon{font-size:8px;padding:6px 12px}
  #landing.landing-v3 .navin{min-height:62px}
  #landing.landing-v3 .brand{font-size:22px}
  #landing.landing-v3 .hero{padding:38px 0 18px}
  #landing.landing-v3 .hero:before{background-size:32px 32px}
  #landing.landing-v3 .hero:after{width:330px;height:330px;right:-170px;top:90px}
  #landing.landing-v3 .hero-kicker{margin-top:13px}
  #landing.landing-v3 h1{
    font-size:clamp(40px,12.2vw,52px);
    letter-spacing:-.052em;
  }
  #landing.landing-v3 h1 em:after{bottom:-4px;height:5px}
  #landing.landing-v3 .lead{
    margin-top:19px;
    font-size:13.2px;
    line-height:1.58;
  }
  #landing.landing-v3 .hero-ctas{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    margin-top:20px;
  }
  #landing.landing-v3 .hero-ctas .btn{
    min-height:45px;
    padding:0 10px;
    font-size:9.5px;
  }
  #landing.landing-v3 .hero-proof-chips{
    display:grid;
    grid-template-columns:1fr;
    gap:6px;
    margin-top:13px;
  }
  #landing.landing-v3 .hero-proof-chips span{
    min-height:30px;
    width:max-content;
    max-width:100%;
    font-size:8px;
  }
  #landing.landing-v3 .hero-usp-row{
    grid-template-columns:1fr 1fr;
    gap:7px;
    margin-top:13px;
  }
  #landing.landing-v3 .hero-usp{
    padding:10px 9px 10px 12px;
    border-radius:13px;
  }
  #landing.landing-v3 .hero-usp span{display:none}
  #landing.landing-v3 .hero-visual{
    min-height:482px;
    padding:10px;
    border-radius:26px;
    box-shadow:0 22px 58px rgba(20,55,92,.12);
  }
  #landing.landing-v3 .phone-stage{translate:0 0!important}
  #landing.landing-v3 .visual-caption{margin-inline:0}
  #landing.landing-v3 .evidence-strip{margin-top:18px}
  #landing.landing-v3 .section{padding:56px 0}
  #landing.landing-v3 .compact-head{margin-bottom:22px}
  #landing.landing-v3 .compact-head h2{font-size:30px}
  #landing.landing-v3 .compact-head p{font-size:12px}
  #landing.landing-v3 .visual-card-grid .problem-card{min-height:188px}
  #landing.landing-v3 .final-cta{padding:58px 0}
}
@media (max-width:430px){
  #landing.landing-v3 .hero-ctas{grid-template-columns:1fr}
  #landing.landing-v3 .hero-usp-row{grid-template-columns:1fr 1fr}
  #landing.landing-v3 .hero-usp b{font-size:8.7px}
  #landing.landing-v3 .hero-visual{min-height:458px}
}
@media (prefers-reduced-motion:reduce){
  #landing.landing-v3 .flow-line:before{animation:none}
  #landing.landing-v3 .phone-stage{translate:0 0!important;transition:none}
}
`;

  function loadLandingPolish(){
    landingPolishLoaded=true;
  }

  function wireLandingDepth(){
    const visual=document.querySelector('#landing .hero-visual');
    if(!visual||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||window.matchMedia?.('(pointer: coarse)')?.matches)return;
    const reset=()=>{
      visual.style.setProperty('--sp-pointer-x','0px');
      visual.style.setProperty('--sp-pointer-y','0px');
    };
    visual.addEventListener('pointermove',event=>{
      const rect=visual.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const x=((event.clientX-rect.left)/rect.width-.5)*8;
      const y=((event.clientY-rect.top)/rect.height-.5)*6;
      visual.style.setProperty('--sp-pointer-x',x.toFixed(2)+'px');
      visual.style.setProperty('--sp-pointer-y',y.toFixed(2)+'px');
    },{passive:true});
    visual.addEventListener('pointerleave',reset,{passive:true});
  }

  function loadEnhancements(){
    if(enhancementsLoaded)return;
    enhancementsLoaded=true;
    stylesheet('sanpaidCredibilityStyles','credibility-layer.css');
    stylesheet('sanpaidWorkforceIntelligenceStyles','workforce-intelligence.css');
    script('sanpaidCredibilityScript','credibility-layer.js');
    script('sanpaidWorkforceIntelligenceScript','workforce-intelligence.js');
  }

  function loadAuth(){
    if(authLoaded)return;
    authLoaded=true;
    stylesheet('sanpaidAuthStyles','auth-unified.css');
    script('sanpaidAuthRuntime','auth-unified.js');
  }

  function loadRoleShell(){
    if(roleShellLoaded)return;
    roleShellLoaded=true;
    loadAuth();
    stylesheet('sanpaidDesignTokens','design-tokens.css');
    stylesheet('sanpaidSelectionStyles','selection-ready-v3.css');
    stylesheet('sanpaidWorkspaceStyles','workspace-ui.css');
    stylesheet('sanpaidColorSystem','color-system-v5.css');
    loadEnhancements();
  }

  function loadCustomerWorker(){
    if(customerWorkerLoaded)return;
    customerWorkerLoaded=true;
    loadRoleShell();
    stylesheet('sanpaidCustomerWorkerStyles','customer-worker-dashboard.css?v=worker-mobile-1');
    script('sanpaidCustomerWorkerRuntime','customer-worker-dashboard.js');
  }

  function loadAdministration(){
    if(administrationLoaded)return;
    administrationLoaded=true;
    loadRoleShell();
    stylesheet('sanpaidAdminCommandStyles','admin-command-center.css');
    stylesheet('sanpaidFederationGovtechStyles','federation-govtech.css');
    stylesheet('sanpaidFederationPortalStyles','federation-portal.css');
    stylesheet('sanpaidCooperativePortalStyles','cooperative-portal.css');
    stylesheet('sanpaidHandoverEvidenceStyles','handover-evidence.css');

    script('sanpaidAdminCommandRuntime','admin-command-center.js');
    script('sanpaidFederationPortalRuntime','federation-portal.js');
    script('sanpaidCooperativePortalRuntime','cooperative-portal.js');
    script('sanpaidCooperativeAvailabilityRuntime','cooperative-deploy-guard.js');
    script('sanpaidHandoverEvidenceRuntime','handover-evidence.js');
  }

  function closeAdminDrawers(){
    const content=document.getElementById('judgeContent');
    if(!content)return;
    content.classList.remove('coop-nav-open','fed-nav-open');
    document.getElementById('coopNavToggle')?.setAttribute('aria-expanded','false');
    document.getElementById('fedNavToggle')?.setAttribute('aria-expanded','false');
    document.body.classList.remove('admin-mobile-nav-open');
  }

  function wireIntentLoading(){
    document.addEventListener('pointerdown',event=>{
      const target=event.target.closest?.('[data-eval-open-connected],[data-eval-connected-persona],[data-open-connected],[data-platform-access],#connectedDemoBtn,#getStarted,#evalOpenConnected,#evalFinalPrototype');
      if(target)loadCustomerWorker();
      const admin=event.target.closest?.('[data-eval-open-admin],[data-open-role="COOPERATIVE_ADMIN"],[data-open-role="FEDERATION_ADMIN"],[data-judge-role="COOPERATIVE_ADMIN"],[data-judge-role="FEDERATION_ADMIN"]');
      if(admin)loadAdministration();
    },{capture:true,passive:true});

    document.addEventListener('focusin',event=>{
      const target=event.target.closest?.('[data-eval-open-connected],[data-eval-connected-persona],[data-open-connected],[data-platform-access],#connectedDemoBtn,#getStarted,#evalOpenConnected,#evalFinalPrototype');
      if(target)loadCustomerWorker();
      const admin=event.target.closest?.('[data-eval-open-admin],[data-open-role="COOPERATIVE_ADMIN"],[data-open-role="FEDERATION_ADMIN"],[data-judge-role="COOPERATIVE_ADMIN"],[data-judge-role="FEDERATION_ADMIN"]');
      if(admin)loadAdministration();
    });
  }

  function wireAccessibility(){
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape')closeAdminDrawers();
    });
    document.addEventListener('click',event=>{
      const content=document.getElementById('judgeContent');
      if(!content||!content.contains(event.target))return;
      const selected=event.target.closest?.('[data-coop-target],[data-fed-target]');
      if(selected)queueMicrotask(closeAdminDrawers);
    });
  }

  function exposeRuntimeStatus(){
    window.SanPaidBootstrap=Object.freeze({
      version:'handover-bootstrap-v1',
      story:'Problem Details → Eligible Recommended Workers → Customer Selects → Worker Accepts → Call/Inspection → Estimate → Customer Approval → QR-Verified Start → Service → Worker Marks Complete → Customer Confirms → Itemized Bill → Payment → Invoice → Rating/Feedback',
      refreshEvidence:()=>window.SanPaidHandoverEvidence?.refresh?.(),
      loadCustomerWorker,
      loadAdministration,
      closeAdminDrawers
    });
  }

  function start(){
    loadLandingPolish();
    wireLandingDepth();
    loadAuth();
    wireIntentLoading();
    wireAccessibility();
    exposeRuntimeStatus();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
