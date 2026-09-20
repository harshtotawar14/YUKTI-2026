import { chromium } from 'playwright';
import fs from 'fs';

const started=Date.now();
const marks={};
const mark=name=>{marks[name]=Math.max(0,(Date.now()-started)/1000);};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:1920,height:1080},
  deviceScaleFactor:1,
  colorScheme:'light',
  recordVideo:{dir:'output/raw',size:{width:1920,height:1080}}
});
const page=await context.newPage();
const video=page.video();
page.setDefaultTimeout(16000);

await page.goto(process.env.TARGET_URL||'https://yukti-2026-brown.vercel.app/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{});
await page.waitForTimeout(1500);

const hold=ms=>page.waitForTimeout(ms);
async function exists(sel,timeout=16000){
  await page.waitForFunction(s=>!!document.querySelector(s),sel,{timeout});
}
async function uiLogin(role,persona=null){
  await page.evaluate(async ()=>{
    try{window.ConnectedSanPaid?.close?.()}catch{}
    try{window.SanPaidJudgeMode?.close?.()}catch{}
    try{window.SanPaidAuth?.close?.()}catch{}
    try{await window.SanPaidAuth?.logout?.({silent:true})}catch{}
    window.SanPaidAuth?.openRoleChooser?.();
  });
  await exists('#sanpaidUnifiedAuthRoot:not([hidden])');
  await page.evaluate(r=>document.querySelector('[data-spu-entry-role="'+r+'"]')?.click(),role);
  await exists('#spuLoginForm');
  await page.waitForFunction(()=>!!document.querySelector('#spuUseDemo'),null,{timeout:16000});
  await page.evaluate(()=>document.querySelector('#spuUseDemo')?.click());
  await hold(220);
  await page.evaluate(()=>document.querySelector('#spuLoginSubmit')?.click());
  await page.waitForFunction(()=>window.SanPaidAuth?.isAuthenticated?.()===true,null,{timeout:20000});
  if(role==='CUSTOMER'||role==='WORKER'){
    await page.evaluate(async p=>{await window.ConnectedSanPaid?.open?.(p)},persona);
    await exists('#connectedShell:not(.hidden)');
  }else{
    await page.evaluate(async ()=>{await window.SanPaidJudgeMode?.open?.()});
    await exists('#sihJudgeShell:not(.judge-hidden)');
  }
}

// Intro
mark('intro');
await page.evaluate(()=>window.scrollTo({top:0,behavior:'auto'}));
await hold(5000);

// Role access
await page.evaluate(()=>window.SanPaidAuth?.openRoleChooser?.());
await exists('#sanpaidUnifiedAuthRoot:not([hidden])');
await hold(4000);
await page.evaluate(()=>window.SanPaidAuth?.close?.());

// Customer
await uiLogin('CUSTOMER','CUSTOMER');
mark('customer');
await exists('#cdService');
await hold(3000);
await page.evaluate(()=>{
  const s=document.getElementById('cdService');
  if(s&&s.options.length>1){s.selectedIndex=1;s.dispatchEvent(new Event('change',{bubbles:true}))}
  const z=document.getElementById('cdZone');if(z)z.value='Kolhapur';
  const a=document.getElementById('cdAddress');if(a)a.value='Shivaji Peth, Kolhapur';
  const l=document.getElementById('cdLang');if(l)l.value='en';
  const p=document.getElementById('cdProblem');if(p)p.value='Switch board is sparking and needs inspection.';
});
await hold(3000);
await page.evaluate(()=>{
  const shell=document.getElementById('connectedShell');
  const p=document.getElementById('cdProblem');
  if(shell&&p)shell.scrollTop=Math.max(0,p.offsetTop-180);
});
await hold(3000);
await page.evaluate(()=>document.getElementById('connectedBookingForm')?.requestSubmit());
await hold(4000);

// Worker
await uiLogin('WORKER','WORKER_A');
mark('worker');
await exists('#connectedWorkerOffers');
await hold(5000);
await page.evaluate(()=>{
  const shell=document.getElementById('connectedShell');
  const offer=document.querySelector('.connected-offer');
  if(shell&&offer)shell.scrollTop=Math.max(0,offer.offsetTop-130);
});
await hold(3000);
await page.evaluate(()=>document.querySelector('[data-accept-offer]')?.click());
await hold(4000);

// Trust
await page.evaluate(()=>{
  try{window.ConnectedSanPaid?.close?.()}catch{}
  window.SanPaidSelectorMode?.open?.(4);
});
await exists('#selectorModeShell:not(.hidden)');
mark('trust');
await hold(10000);
await page.evaluate(()=>window.SanPaidSelectorMode?.close?.({noHistory:true,restoreScroll:false}));

// Cooperative admin
await uiLogin('COOPERATIVE_ADMIN');
mark('cooperative');
await hold(1000);
await page.evaluate(()=>{
  window.SanPaidJudgeMode?.switchTab?.('overview');
  setTimeout(()=>document.querySelector('#sihJudgeShell .judge-section.active')?.scrollIntoView({block:'start',behavior:'auto'}),120);
});
await hold(5000);
await page.evaluate(()=>{
  window.SanPaidJudgeMode?.switchTab?.('complaint');
  setTimeout(()=>document.querySelector('#sihJudgeShell .judge-section.active')?.scrollIntoView({block:'start',behavior:'auto'}),120);
});
await hold(5000);

// Federation admin
await uiLogin('FEDERATION_ADMIN');
mark('federation');
await page.evaluate(()=>{
  window.SanPaidJudgeMode?.switchTab?.('overview');
  setTimeout(()=>document.querySelector('#sihJudgeShell .judge-section.active')?.scrollIntoView({block:'start',behavior:'auto'}),120);
});
await hold(9000);

// Capacity Exchange — dedicated visual proof
await page.evaluate(()=>{
  try{window.SanPaidJudgeMode?.close?.()}catch{}
  window.SanPaidSelectorMode?.open?.(6);
});
await exists('#selectorModeShell:not(.hidden)');
mark('capacity');
await hold(7500);
await page.evaluate(()=>window.SanPaidSelectorMode?.close?.({noHistory:true,restoreScroll:false}));

// Demand-to-Workforce — dedicated visual proof
await page.evaluate(()=>window.SanPaidSelectorMode?.open?.(7));
await exists('#selectorModeShell:not(.hidden)');
mark('planning');
await hold(7500);
await page.evaluate(()=>window.SanPaidSelectorMode?.close?.({noHistory:true,restoreScroll:false}));

// Field evidence
await page.evaluate(()=>{
  document.body.style.overflow='';
  document.getElementById('evidence')?.scrollIntoView({block:'start',behavior:'auto'});
});
mark('evidence');
await hold(11000);

// Final close
await page.evaluate(()=>{
  document.querySelector('.final-cta')?.scrollIntoView({block:'center',behavior:'auto'});
});
mark('end');
await hold(8000);

// Pad so the final artifact can be trimmed to exactly 120s.
const elapsed=Date.now()-started;
if(elapsed<121000)await hold(121000-elapsed);

fs.writeFileSync('output/timings.json',JSON.stringify(marks,null,2));
await page.close();
await context.close();
await browser.close();
fs.copyFileSync(await video.path(),'output/SanPaid-120s-raw.webm');
