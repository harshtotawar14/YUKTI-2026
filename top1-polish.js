(() => {
  'use strict';
  const STATUS={
    PENDING_WORKER_ACCEPTANCE:'Waiting for Worker Response',
    FINDING_REPLACEMENT:'Finding Replacement Worker',
    CUSTOMER_CONFIRMED:'Customer Confirmed',
    IDENTITY_VERIFIED:'Identity Verified',
    SERVICE_STARTED:'Service Started',
    COMPLETION_REQUESTED:'Completion Requested',
    PAYMENT_PENDING:'Payment Pending',
    NO_WORKER_AVAILABLE:'No Verified Worker Available',
    WORKERS_OFFERED:'Workers Offered · Consent Pending'
  };
  const ERROR_MAP=[
    [/Request failed \(401\)|not_authenticated|session expired/i,'Your session expired. Please log in again.'],
    [/Request failed \(429\)|too many/i,'Too many requests. Please wait a moment and retry.'],
    [/Request failed \(500\)|booking_failed/i,'The action could not be completed. Please retry.'],
    [/Failed to fetch|NetworkError|backend.*unavailable/i,'Backend temporarily unavailable. Please retry.']
  ];
  const langCode=x=>String(x||'en').startsWith('mr')?'mr-IN':String(x||'en').startsWith('hi')?'hi-IN':'en-IN';
  function friendly(text){let t=String(text||'');for(const [rx,msg] of ERROR_MAP)if(rx.test(t))return msg;return t}
  function humanizeTextNode(node){let t=node.nodeValue||'';let out=t;for(const [raw,label] of Object.entries(STATUS)){out=out.replaceAll(raw,label).replaceAll(raw.replaceAll('_',' '),label)}if(out!==t)node.nodeValue=out}
  function walk(root){if(!root)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode()))humanizeTextNode(n);root.querySelectorAll?.('.connected-error,.judge-error').forEach(el=>{const text=el.textContent||'';const f=friendly(text);if(f!==text)el.textContent=f});cleanWorkerSummaries(root)}
  function currentWorkerLang(){const text=document.querySelector('#connectedContent .connected-live')?.textContent||document.getElementById('connectedContent')?.textContent||'';if(/Amit Connected/i.test(text))return'hi';if(/Suresh Connected/i.test(text))return'mr';return'en'}
  function metaValue(card,label){for(const div of card.querySelectorAll('.connected-meta > div')){const txt=div.textContent||'';if(txt.toLowerCase().startsWith(label.toLowerCase()))return div.querySelector('b')?.textContent?.trim()||txt.replace(new RegExp('^'+label,'i'),'').trim()}return''}
  function structuredSummary(card,lang){const heading=card.querySelector('h4')?.textContent||'Service request';const service=heading.split('·')[0].trim();const zone=metaValue(card,'Zone')||'customer area';if(lang==='mr')return `तुम्हाला ${service} साठी जॉब रिक्वेस्ट मिळाली आहे. परिसर: ${zone}. ग्राहकाची मूळ विनंती खाली स्वतंत्रपणे उपलब्ध आहे.`;if(lang==='hi')return `आपको ${service} की जॉब रिक्वेस्ट मिली है। क्षेत्र: ${zone}। ग्राहक की मूल रिक्वेस्ट नीचे अलग से उपलब्ध है।`;return `You have a ${service} job request in ${zone}. The customer's original request is available separately below.`}
  function cleanWorkerSummaries(root){root.querySelectorAll?.('[data-offer] .connected-voice').forEach(box=>{const card=box.closest('[data-offer]');const first=box.querySelector(':scope > .transcript');if(!card||!first)return;const lang=currentWorkerLang();const clean=structuredSummary(card,lang);if(first.dataset.top1Clean!=='1'){first.textContent=clean;first.dataset.top1Clean='1'}})}
  function speak(text,lang){if(!('speechSynthesis'in window)||!window.SpeechSynthesisUtterance)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=langCode(lang);u.rate=.95;window.speechSynthesis.speak(u)}
  function loadJudgeActions(){if(document.querySelector('script[data-judge-actions]'))return;const s=document.createElement('script');s.src='judge-actions-polish.js';s.async=true;s.dataset.judgeActions='1';document.head.appendChild(s)}
  document.addEventListener('click',e=>{
    const original=e.target.closest?.('[data-listen-original]');if(original){e.preventDefault();e.stopImmediatePropagation();const card=original.closest('[data-offer]');const details=card?.querySelector('details');const text=details?.querySelector('.transcript')?.textContent?.replace(/[“”]/g,'').trim()||'';const summary=details?.querySelector('summary')?.textContent||'';const match=summary.match(/\((mr|hi|en)(?:-[A-Z]{2})?\)/i);speak(text,match?.[1]||'en');return}
    const summaryBtn=e.target.closest?.('[data-listen-offer]');if(summaryBtn){e.preventDefault();e.stopImmediatePropagation();const card=summaryBtn.closest('[data-offer]');speak(structuredSummary(card,currentWorkerLang()),currentWorkerLang())}
  },true);

  document.addEventListener('submit',e=>{if(e.target?.id!=='connectedBookingForm')return;const b=e.target.querySelector('button[type="submit"]');if(!b)return;b.dataset.oldText=b.textContent;b.textContent='Creating booking…';b.disabled=true;setTimeout(()=>{if(document.body.contains(b)){b.disabled=false;b.textContent=b.dataset.oldText||'Create Backend Booking'}},7000)},true);
  const observer=new MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes)if(n.nodeType===1)walk(n);if(m.target?.nodeType===1)walk(m.target)}const form=document.getElementById('connectedBookingForm');const b=form?.querySelector('button[type="submit"]');if(b&&(document.querySelector('#cdBookingError .connected-error')||document.querySelector('#connectedCustomerState .connected-success'))){b.disabled=false;b.textContent=b.dataset.oldText||'Create Backend Booking'}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{walk(document.body);observer.observe(document.body,{subtree:true,childList:true,characterData:true});loadJudgeActions()},{once:true});else{walk(document.body);observer.observe(document.body,{subtree:true,childList:true,characterData:true});loadJudgeActions()}
})();