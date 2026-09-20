import { chromium } from 'playwright';
import fs from 'fs';

const started=Date.now();
const marks={};
const mark=n=>{marks[n]=Math.max(0,(Date.now()-started)/1000)};
const hold=ms=>page.waitForTimeout(ms);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:1920,height:1080},
  deviceScaleFactor:1,
  colorScheme:'light',
  recordVideo:{dir:'output/raw',size:{width:1920,height:1080}}
});
const page=await context.newPage();
const video=page.video();
page.setDefaultTimeout(20000);

await page.goto(process.env.TARGET_URL||'https://yukti-2026-brown.vercel.app/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{});
await hold(1800);

async function exists(sel,timeout=20000){
  await page.waitForFunction(s=>!!document.querySelector(s),sel,{timeout});
}
async function roleLogin(role,persona=null){
  await page.evaluate(async ()=>{
    try{window.ConnectedSanPaid?.close?.()}catch{}
    try{window.SanPaidJudgeMode?.close?.()}catch{}
    try{await window.SanPaidAuth?.logout?.({silent:true})}catch{}
    window.SanPaidAuth?.openRoleChooser?.();
  });
  await exists('#sanpaidUnifiedAuthRoot:not([hidden])');
  await page.evaluate(r=>document.querySelector('[data-spu-entry-role="'+r+'"]')?.click(),role);
  await exists('#spuLoginForm');
  await page.waitForFunction(()=>!!document.querySelector('#spuUseDemo'),null,{timeout:16000});
  await page.evaluate(()=>document.querySelector('#spuUseDemo')?.click());
  await hold(250);
  await page.evaluate(()=>document.querySelector('#spuLoginSubmit')?.click());
  await page.waitForFunction(()=>window.SanPaidAuth?.isAuthenticated?.()===true,null,{timeout:20000});
  if(role==='CUSTOMER'||role==='WORKER'){
    await page.evaluate(async p=>{
      window.SanPaidBootstrap?.loadCustomerWorker?.();
      await new Promise(r=>setTimeout(r,1200));
      await window.ConnectedSanPaid?.open?.(p);
    },persona);
    await exists('#connectedShell:not(.hidden)');
    await page.waitForFunction(()=>!!document.querySelector('#cwDashboard'),null,{timeout:20000});
    await hold(1200);
  }else{
    await page.evaluate(async ()=>{
      window.SanPaidBootstrap?.loadAdministration?.();
      await new Promise(r=>setTimeout(r,1200));
      await window.SanPaidJudgeMode?.open?.();
    });
    await exists('#sihJudgeShell:not(.judge-hidden)');
    await hold(1200);
  }
}

// 0-7s intro
mark('intro');
await page.evaluate(()=>window.scrollTo({top:0,behavior:'auto'}));
await hold(7000);

// 7-11s role access
await page.evaluate(()=>window.SanPaidAuth?.openRoleChooser?.());
await exists('#sanpaidUnifiedAuthRoot:not([hidden])');
await hold(4000);
await page.evaluate(()=>window.SanPaidAuth?.close?.());

// 11-28s NEW CUSTOMER DASHBOARD
await roleLogin('CUSTOMER','CUSTOMER');
mark('customer');
await page.evaluate(()=>{
  const host=document.getElementById('cwDashboard');
  host?.querySelector('[data-cw-view-btn="book"]')?.click();
});
await hold(7000);
await page.evaluate(()=>{
  const host=document.getElementById('cwDashboard');
  host?.querySelector('[data-cw-view-btn="overview"]')?.click();
  const main=host?.querySelector('.cw-main'); if(main) main.scrollTop=0;
});
await hold(9000);

// 28-45s NEW WORKER DASHBOARD
await roleLogin('WORKER','WORKER_A');
mark('worker');
await page.evaluate(()=>{
  const host=document.getElementById('cwDashboard');
  host?.querySelector('[data-cw-view-btn="offers"]')?.click();
});
await hold(8000);
await page.evaluate(()=>{
  const host=document.getElementById('cwDashboard');
  host?.querySelector('[data-cw-view-btn="overview"]')?.click();
});
await hold(9000);

// 45-57s trust
await page.evaluate(()=>{
  try{window.ConnectedSanPaid?.close?.()}catch{}
  window.SanPaidSelectorMode?.open?.(4);
});
await exists('#selectorModeShell:not(.hidden)');
mark('trust');
await hold(12000);
await page.evaluate(()=>window.SanPaidSelectorMode?.close?.({noHistory:true,restoreScroll:false}));

// 57-72s cooperative admin
await roleLogin('COOPERATIVE_ADMIN');
mark('cooperative');
await page.evaluate(()=>{
  window.SanPaidJudgeMode?.switchTab?.('overview');
  setTimeout(()=>document.querySelector('#sihJudgeShell .judge-section.active')?.scrollIntoView({block:'start',behavior:'auto'}),120);
});
await hold(8000);
await page.evaluate(()=>{
  window.SanPaidJudgeMode?.switchTab?.('complaint');
  setTimeout(()=>document.querySelector('#sihJudgeShell .judge-section.active')?.scrollIntoView({block:'start',behavior:'auto'}),120);
});
await hold(7000);

// 72-84s federation
await roleLogin('FEDERATION_ADMIN');
mark('federation');
await page.evaluate(()=>{
  window.SanPaidJudgeMode?.switchTab?.('overview');
  setTimeout(()=>document.querySelector('#sihJudgeShell .judge-section.active')?.scrollIntoView({block:'start',behavior:'auto'}),120);
});
await hold(12000);

// 84-96s capacity
await page.evaluate(()=>{
  window.SanPaidJudgeMode?.switchTab?.('capacity');
  setTimeout(()=>document.querySelector('#sihJudgeShell .judge-section.active')?.scrollIntoView({block:'start',behavior:'auto'}),160);
});
await hold(350); mark('capacity'); await hold(11650);

// 96-108s planning
await page.evaluate(()=>{
  window.SanPaidJudgeMode?.switchTab?.('planning');
  setTimeout(()=>document.querySelector('#sihJudgeShell .judge-section.active')?.scrollIntoView({block:'start',behavior:'auto'}),160);
});
await hold(350); mark('planning'); await hold(11650);

// 108-116s evidence
await page.evaluate(()=>{
  try{window.SanPaidJudgeMode?.close?.()}catch{}
  document.body.style.overflow='';
  document.getElementById('evidence')?.scrollIntoView({block:'start',behavior:'auto'});
});
mark('evidence');
await hold(8000);

// 116-120s end
await page.evaluate(()=>document.querySelector('.final-cta')?.scrollIntoView({block:'center',behavior:'auto'}));
mark('end');
await hold(4000);

const elapsed=Date.now()-started;
if(elapsed<121000)await hold(121000-elapsed);
fs.writeFileSync('output/timings-new-dash.json',JSON.stringify(marks,null,2));

await page.close();
await context.close();
await browser.close();
fs.copyFileSync(await video.path(),'output/SanPaid-new-dash-raw.webm');
