import { chromium } from 'playwright';
import fs from 'fs';

const started=Date.now();
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
await page.waitForTimeout(1800);

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
  await hold(350);
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

// Intro + role model
await page.evaluate(()=>window.scrollTo({top:0,behavior:'auto'}));
await hold(5000);
await page.evaluate(()=>window.SanPaidAuth?.openRoleChooser?.());
await exists('#sanpaidUnifiedAuthRoot:not([hidden])');
await hold(3000);
await page.evaluate(()=>window.SanPaidAuth?.close?.());

// Customer
await uiLogin('CUSTOMER','CUSTOMER');
await exists('#cdService');
await hold(2200);
await page.evaluate(()=>{
  const shell=document.getElementById('connectedShell'); if(shell)shell.scrollTop=0;
  const s=document.getElementById('cdService');
  if(s&&s.options.length>1){s.selectedIndex=1;s.dispatchEvent(new Event('change',{bubbles:true}))}
  const z=document.getElementById('cdZone');if(z)z.value='Kolhapur';
  const a=document.getElementById('cdAddress');if(a)a.value='Shivaji Peth, Kolhapur';
  const l=document.getElementById('cdLang');if(l)l.value='en';
  const p=document.getElementById('cdProblem');if(p)p.value='Switch board is sparking and needs inspection.';
});
await hold(2300);
await page.evaluate(()=>{
  const shell=document.getElementById('connectedShell');
  const p=document.getElementById('cdProblem');
  if(shell&&p)shell.scrollTop=Math.max(0,p.offsetTop-180);
});
await hold(3300);
await page.evaluate(()=>document.getElementById('cdBookingForm')?.requestSubmit());
await hold(5000);

// Worker
await uiLogin('WORKER','WORKER_A');
await exists('#connectedWorkerOffers');
await hold(4700);
await page.evaluate(()=>{
  const shell=document.getElementById('connectedShell');
  const offer=document.querySelector('.connected-offer');
  if(shell&&offer)shell.scrollTop=Math.max(0,offer.offsetTop-130);
});
await hold(3200);
await page.evaluate(()=>document.querySelector('[data-accept-offer]')?.click());
await hold(3900);

// Trust
await page.evaluate(()=>{
  try{window.ConnectedSanPaid?.close?.()}catch{}
  window.SanPaidSelectorMode?.open?.(4);
});
await exists('#selectorModeShell:not(.hidden)');
await hold(8500);
await page.evaluate(()=>window.SanPaidSelectorMode?.close?.({noHistory:true,restoreScroll:false}));

// Cooperative admin
await uiLogin('COOPERATIVE_ADMIN');
await hold(1200);
await page.evaluate(()=>document.querySelector('[data-judge-tab="overview"]')?.click());
await hold(4700);
await page.evaluate(()=>document.querySelector('[data-judge-tab="complaint"]')?.click());
await hold(3900);

// Federation admin
await uiLogin('FEDERATION_ADMIN');
await hold(1200);
await page.evaluate(()=>document.querySelector('[data-judge-tab="overview"]')?.click());
await hold(6500);

// USP 1
await page.evaluate(()=>document.querySelector('[data-judge-tab="capacity"]')?.click());
await hold(9500);

// USP 2
await page.evaluate(()=>document.querySelector('[data-judge-tab="planning"]')?.click());
await hold(9500);

// Evidence
await page.evaluate(()=>{
  try{window.SanPaidJudgeMode?.close?.()}catch{}
  document.getElementById('evidence')?.scrollIntoView({block:'start',behavior:'auto'});
});
await hold(6000);

// End
await page.evaluate(()=>document.querySelector('.final-cta')?.scrollIntoView({block:'center',behavior:'auto'}));
await hold(4000);

const elapsed=Date.now()-started;
if(elapsed<120500)await hold(120500-elapsed);

await page.close();
await context.close();
await browser.close();
fs.copyFileSync(await video.path(),'output/SanPaid-120s-raw.webm');
