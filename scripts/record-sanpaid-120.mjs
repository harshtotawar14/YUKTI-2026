import { chromium } from 'playwright';
import fs from 'fs';

const target=process.env.TARGET_URL||'https://yukti-2026-brown.vercel.app/';
const started=Date.now();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:1920,height:1080},deviceScaleFactor:1,colorScheme:'light',
  recordVideo:{dir:'output/raw',size:{width:1920,height:1080}}
});
const page=await context.newPage();
const video=page.video();
page.setDefaultTimeout(20000);

await page.goto(target,{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{});
await page.waitForTimeout(2000);

await page.addStyleTag({content:`
#demoCursor{position:fixed;width:22px;height:22px;border-radius:50%;border:3px solid #0f2d5c;background:rgba(255,255,255,.95);box-shadow:0 4px 15px rgba(0,0,0,.22);z-index:2147483647;pointer-events:none;left:50%;top:50%;transform:translate(-50%,-50%);transition:left .38s cubic-bezier(.2,.8,.2,1),top .38s cubic-bezier(.2,.8,.2,1)}
`});
await page.evaluate(()=>{const c=document.createElement('div');c.id='demoCursor';document.body.appendChild(c);window.__demoMove=(x,y)=>{c.style.left=x+'px';c.style.top=y+'px'};});

const hold=ms=>page.waitForTimeout(ms);
async function point(selector){
  const el=page.locator(selector).first();
  try{
    await el.scrollIntoViewIfNeeded();
    const b=await el.boundingBox();
    if(b){const x=b.x+b.width/2,y=b.y+b.height/2;await page.evaluate(([x,y])=>window.__demoMove?.(x,y),[x,y]);await page.mouse.move(x,y,{steps:12});}
  }catch{}
}
async function safeClick(selector){
  try{
    const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();await point(selector);await el.click({timeout:6000});return true;
  }catch{return false;}
}
async function loginRole(role,persona=null){
  const demo=await page.evaluate(async()=>{const r=await fetch('/api/auth/demo-access',{cache:'no-store'});return r.json();});
  if(!demo?.ok||!demo?.password)throw new Error('Demo access unavailable');
  const list=Array.isArray(demo.accounts)?demo.accounts:[];
  const account=list.find(a=>a.role===role&&(!persona||a.persona===persona));
  if(!account)throw new Error('Demo account missing for '+role);
  await page.evaluate(async ({identifier,password,role,persona})=>{
    try{await window.SanPaidAuth?.logout?.({silent:true});}catch{}
    await window.SanPaidAuth.login({identifier,password,role,remember:false});
    await window.SanPaidAuth.openRoleWorkspace(role,persona);
  },{identifier:account.accessId,password:demo.password,role,persona});
}

// 0–7 sec — homepage identity
await page.evaluate(()=>window.scrollTo({top:0,behavior:'auto'}));
await hold(7000);

// 7–13 sec — show four-role access
await safeClick('[data-platform-access]');
await page.waitForSelector('#sanpaidUnifiedAuthRoot:not([hidden])',{timeout:12000}).catch(()=>{});
await hold(5500);
await safeClick('#sanpaidUnifiedAuthRoot .spu-close');
await hold(500);

// 13–31 sec — Customer workspace
await loginRole('CUSTOMER','CUSTOMER');
await page.waitForSelector('#connectedShell:not(.hidden)',{timeout:20000});
await hold(5000);
await page.evaluate(()=>{const m=document.querySelector('#connectedShell:not(.hidden) .connected-main');if(m)m.scrollTo({top:420,behavior:'smooth'});});
await hold(7000);
await page.evaluate(()=>{const m=document.querySelector('#connectedShell:not(.hidden) .connected-main');if(m)m.scrollTo({top:0,behavior:'smooth'});});
await hold(5000);

// 31–47 sec — Worker workspace
await loginRole('WORKER','WORKER_A');
await page.waitForSelector('#connectedShell:not(.hidden)',{timeout:20000});
await hold(6000);
await page.evaluate(()=>{const m=document.querySelector('#connectedShell:not(.hidden) .connected-main');if(m)m.scrollTo({top:500,behavior:'smooth'});});
await hold(6000);
await page.evaluate(()=>{const m=document.querySelector('#connectedShell:not(.hidden) .connected-main');if(m)m.scrollTo({top:0,behavior:'smooth'});});
await hold(3500);

// 47–58 sec — trusted service start
await page.evaluate(()=>{try{window.ConnectedSanPaid?.close?.()}catch{};window.SanPaidSelectorMode?.open?.(4);});
await page.waitForSelector('#selectorModeShell:not(.hidden)',{timeout:12000}).catch(()=>{});
await hold(10500);
await page.evaluate(()=>window.SanPaidSelectorMode?.close?.({noHistory:true,restoreScroll:false}));

// 58–74 sec — Cooperative Admin
await loginRole('COOPERATIVE_ADMIN');
await page.waitForSelector('#sihJudgeShell:not(.judge-hidden)',{timeout:20000});
await hold(3500);
await page.evaluate(()=>document.querySelector('[data-judge-tab="overview"]')?.click());
await hold(6500);
await page.evaluate(()=>document.querySelector('[data-judge-tab="complaint"]')?.click());
await hold(5500);

// 74–88 sec — Federation Admin
await loginRole('FEDERATION_ADMIN');
await page.waitForSelector('#sihJudgeShell:not(.judge-hidden)',{timeout:20000});
await hold(3500);
await page.evaluate(()=>document.querySelector('[data-judge-tab="overview"]')?.click());
await hold(10000);

// 88–101 sec — Capacity Exchange
await page.evaluate(()=>document.querySelector('[data-judge-tab="capacity"]')?.click());
await hold(12500);

// 101–113 sec — Demand & Capacity Planning
await page.evaluate(()=>document.querySelector('[data-judge-tab="planning"]')?.click());
await hold(11500);

// 113–118 sec — Field validation
await page.evaluate(()=>{try{window.SanPaidJudgeMode?.close?.()}catch{};document.querySelector('#evidence')?.scrollIntoView({behavior:'auto',block:'start'});});
await hold(5000);

// 118–120+ sec — close
await page.evaluate(()=>document.querySelector('.final-cta')?.scrollIntoView({behavior:'auto',block:'center'}));
await hold(3500);

const elapsed=Date.now()-started;if(elapsed<121000)await hold(121000-elapsed);
await page.close();await context.close();await browser.close();
fs.copyFileSync(await video.path(),'output/SanPaid-120s-raw.webm');
