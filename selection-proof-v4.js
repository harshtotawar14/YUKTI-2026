(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);

  function styles(){
    if($('#spSelectionProofV4Styles'))return;
    const style=document.createElement('style');
    style.id='spSelectionProofV4Styles';
    style.textContent=`
      #landing .sp-start-trust{margin-top:22px;padding:19px;border:1px solid rgba(15,148,136,.24);border-radius:18px;background:linear-gradient(135deg,rgba(15,148,136,.06),var(--sp-surface));box-shadow:var(--sp-shadow-sm)}
      #landing .sp-start-trust-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
      #landing .sp-start-trust-top small{display:block;color:var(--sp-teal);font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
      #landing .sp-start-trust-top h3{margin:6px 0 4px;color:var(--sp-text);font-size:20px;letter-spacing:-.025em}
      #landing .sp-start-trust-top p{margin:0;color:var(--sp-muted);font-size:12px;line-height:1.55}
      #landing .sp-start-lock{flex:0 0 auto;padding:7px 10px;border-radius:999px;background:rgba(185,117,18,.09);color:var(--sp-amber);font-size:8px;font-weight:850;letter-spacing:.06em;text-transform:uppercase}
      #landing .sp-start-equation{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:8px;align-items:center;margin-top:16px}
      #landing .sp-start-equation span{min-height:58px;display:grid;place-items:center;text-align:center;padding:10px;border:1px solid var(--sp-border);border-radius:12px;background:var(--sp-surface-2);color:var(--sp-text);font-size:10px;font-weight:850}
      #landing .sp-start-equation i{color:var(--sp-teal);font-style:normal;font-size:18px;font-weight:900}
      #landing .sp-start-flow{display:flex;align-items:center;gap:7px;margin-top:12px;overflow-x:auto;padding-bottom:3px}
      #landing .sp-start-flow span{flex:0 0 auto;padding:7px 9px;border:1px solid var(--sp-border);border-radius:9px;background:var(--sp-surface);color:var(--sp-muted);font-size:9px;font-weight:750}
      #landing .sp-start-flow i{color:var(--sp-teal);font-style:normal;font-weight:900}
      #landing .sp-v4-arch-detail{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px;padding:14px;border:1px solid var(--sp-border);border-radius:16px;background:var(--sp-surface)}
      #landing .sp-v4-arch-detail article{padding:12px;border:1px solid var(--sp-border);border-radius:12px;background:var(--sp-surface-2)}
      #landing .sp-v4-arch-detail small{display:block;color:var(--sp-teal);font-size:8px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}
      #landing .sp-v4-arch-detail b{display:block;margin:5px 0 6px;color:var(--sp-text);font-size:11px}
      #landing .sp-v4-arch-detail p{margin:0;color:var(--sp-muted);font-size:8.5px;line-height:1.45}
      @media(max-width:900px){#landing .sp-v4-arch-detail{grid-template-columns:1fr 1fr}#landing .sp-v4-arch-detail article:last-child{grid-column:1/-1}}
      @media(max-width:600px){#landing .sp-start-equation{grid-template-columns:1fr}#landing .sp-start-equation i{transform:rotate(90deg);text-align:center}#landing .sp-v4-arch-detail{grid-template-columns:1fr}#landing .sp-v4-arch-detail article:last-child{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function serviceTrust(){
    const section=$('#connectedDemoSection .wrap');
    if(!section||$('#spStartTrust'))return;
    const block=document.createElement('div');
    block.id='spStartTrust';
    block.className='sp-start-trust';
    block.innerHTML=`
      <div class="sp-start-trust-top"><div><small>Customer Trust · Service-Start Verification</small><h3>Service cannot start until both sides verify the handoff.</h3><p>Identity verification and booking-specific customer confirmation are treated as a service-start rule, not decorative UI.</p></div><span class="sp-start-lock">START LOCKED UNTIL VERIFIED</span></div>
      <div class="sp-start-equation"><span>Verified Worker Identity</span><i>+</i><span>Customer Confirmation</span><i>=</i><span>Service Start Unlocked</span></div>
      <div class="sp-start-flow"><span>Worker Arrives</span><i>→</i><span>Identity / Liveness Check</span><i>→</i><span>Booking-Specific Token / QR</span><i>→</i><span>Customer Confirms</span><i>→</i><span>Start Service</span></div>`;
    section.appendChild(block);
  }

  function architectureDetail(){
    const preview=$('#architecture .eval-architecture-preview');
    if(!preview||$('#spV4ArchDetail'))return;
    const detail=document.createElement('div');
    detail.id='spV4ArchDetail';
    detail.className='sp-v4-arch-detail';
    detail.setAttribute('aria-label','Architecture implementation layers');
    detail.innerHTML=`
      <article><small>Edge</small><b>Protect & Deliver</b><p>DNS · CDN · TLS · WAF · DDoS · rate limiting</p></article>
      <article><small>API</small><b>Control Access</b><p>Gateway · authentication · role authorization · validation</p></article>
      <article><small>Core</small><b>Run Workflows</b><p>Worker · booking · matching · complaint · SLA · audit</p></article>
      <article><small>Data</small><b>Persist Safely</b><p>PostgreSQL · cache · object storage · backup / DR</p></article>
      <article><small>Integrations</small><b>Connect Services</b><p>Maps · payment sandbox · OTP · future welfare APIs</p></article>`;
    preview.insertAdjacentElement('afterend',detail);
  }

  function finalMessage(){
    const heading=$('#landing .eval-final-cta h2');
    const paragraph=$('#landing .eval-final-cta p');
    if(heading)heading.innerHTML='Trusted Services.<br>Fair Opportunities.<br>Governed Workforce.';
    if(paragraph)paragraph.textContent='Eligibility first. Worker choice protected. Cooperative governance visible.';
  }

  function start(){styles();serviceTrust();architectureDetail();finalMessage();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
