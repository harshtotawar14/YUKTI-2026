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
page.setDefaultTimeout(18000);

await page.goto(target,{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForLoadState('networkidle',{timeout:30000}).catch(()=>{});
await page.waitForTimeout(2000);

await page.addStyleTag({content:`
#demoCursor{position:fixed;width:22px;height:22px;border-radius:50%;border:3px solid #0f2d5c;background:rgba(255,255,255,.95);box-shadow:0 4px 15px rgba(0,0,0,.22);z-index:2147483647;pointer-events:none;left:50%;top:50%;transform:translate(-50%,-50%);transition:left .38s cubic-bezier(.2,.8,.2,1),top .38s cubic-bezier(.2,.8,.2,1),transform .12s ease}
#demoCursor.clicking{transform:translate(-50%,-50%) scale(.72)}
.demo-ripple{position:fixed;width:18px;height:18px;border:2px solid #0f2d5c;border-radius:50%;z-index:2147483646;pointer-events:none;animation:demoRipple .52s ease-out forwards}
@keyframes demoRipple{from{transform:translate(-50%,-50%) scale(.7);opacity:.9}to{transform:translate(-50%,-50%) scale(3.2);opacity:0}}
`});
await page.evaluate(()=>{
  const c=document.createElement('div');c.id='demoCursor';document.body.appendChild(c);
  window.__demoMove=(x,y)=>{c.style.left=x+'px';c.style.top=y+'px'};
  window.__demoTap=(x,y)=>{c.classList.add('clicking');const r=document.createElement('div');r.className='demo-ripple';r.style.left=x+'px';r.style.top=y+'px';document.body.appendChild(r);setTimeout(()=>c.classList.remove('clicking'),160);setTimeout(()=>r.remove(),560)};
});

async function move(locator){
  const el=locator.first();await el.scrollIntoViewIfNeeded().catch(()=>{});
  const box=await el.boundingBox();if(!box)return null;
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.evaluate(([x,y])=>window.__demoMove?.(x,y),[x,y]);
  await page.mouse.move(x,y,{steps:14});await page.waitForTimeout(420);return{x,y};
}
async function click(locator){
  const pt=await move(locator);if(pt)await page.evaluate(([x,y])=>window.__demoTap?.(x,y),[pt.x,pt.y]);
  await locator.first().click();await page.waitForTimeout(500);
}
const hold=ms=>page.waitForTimeout(ms);

const demo=await page.evaluate(async()=>{
  const r=await fetch('/api/auth/demo-access',{cache:'no-store'});return r.json();
});
if(!demo?.ok||!demo?.password)throw new Error('Demo access unavailable');
const accountFor=(role,persona=null)=>{
  const list=Array.isArray(demo.accounts)?demo.accounts:[];
  return list.find(a=>a.role===role&&(!persona||a.persona===persona));
};
async function loginRole(role,persona=null){
  const account=accountFor(role,persona);if(!account)throw new Error('Demo account missing for '+role);
  await page.evaluate(async ({identifier,password,role,persona})=>{
    try{await window.SanPaidAuth?.logout?.({silent:true});}catch{}
    await window.SanPaidAuth.login({identifier,password,role,remember:false});
    await window.SanPaidAuth.openRoleWorkspace(role,persona);
  },{identifier:account.accessId,password:demo.password,role,persona});
}

await page.evaluate(()=>window.scrollTo({top:0,behavior:'auto'}));
await hold(6000);

await click(page.locator('[data-platform-access]').first());
await page.waitForSelector('#sanpaidUnifiedAuthRoot:not([hidden])');
await hold(3400);
await click(page.locator('#sanpaidUnifiedAuthRoot .spu-close'));
await hold(400);

await loginRole('CUSTOMER','CUSTOMER');
await page.waitForSelector('#connectedShell:not(.hidden)');
await page.waitForSelector('#cdService option:nth-child(2)',{timeout:20000}).catch(()=>{});
await hold(2800);
await page.evaluate(()=>{
  const s=document.getElementById('cdService');if(s&&s.options.length>1){s.selectedIndex=1;s.dispatchEvent(new Event('change',{bubbles:true}))}
  const z=document.getElementById('cdZone');if(z)z.value='Kolhapur';
  const a=document.getElementById('cdAddress');if(a)a.value='Shivaji Peth, Kolhapur';
  const l=document.getElementById('cdLang');if(l)l.value='en';
  const p=document.getElementById('cdProblem');if(p)p.value='Switch board is sparking and needs inspection.';
});
await move(page.locator('#cdProblem'));await hold(4200);
await click(page.locator('#cdSubmit'));
await hold(6800);

await loginRole('WORKER','WORKER_A');
await page.waitForSelector('#connectedShell:not(.hidden)');
await page.waitForSelector('#connectedWorkerOffers',{timeout:15000});
await hold(6200);
const accept=page.locator('[data-accept-offer]').first();
if(await accept.count()){await click(accept);await hold(5500)}else await hold(6000);
await hold(2600);

await page.evaluate(()=>{try{window.ConnectedSanPaid?.close?.()}catch{};window.SanPaidSelectorMode?.open?.(4)});
await page.waitForSelector('#selectorModeShell:not(.hidden)');
await hold(10000);
await page.evaluate(()=>window.SanPaidSelectorMode?.close?.({noHistory:true,restoreScroll:false}));

await loginRole('COOPERATIVE_ADMIN');
await page.waitForSelector('#sihJudgeShell:not(.judge-hidden)',{timeout:20000});
await hold(1800);
await click(page.locator('[data-judge-tab="overview"]'));await hold(6000);
await click(page.locator('[data-judge-tab="complaint"]'));await hold(5600);

await loginRole('FEDERATION_ADMIN');
await page.waitForSelector('#sihJudgeShell:not(.judge-hidden)',{timeout:20000});
await hold(1900);
await click(page.locator('[data-judge-tab="overview"]'));await hold(10500);

await click(page.locator('[data-judge-tab="capacity"]'));await hold(13500);
await click(page.locator('[data-judge-tab="planning"]'));await hold(13500);

await page.evaluate(()=>{try{window.SanPaidJudgeMode?.close?.()}catch{}});
await page.locator('#evidence').scrollIntoViewIfNeeded();await hold(7000);
await page.locator('.final-cta').scrollIntoViewIfNeeded();await hold(5000);

const elapsed=Date.now()-started;if(elapsed<120500)await hold(120500-elapsed);

await page.close();await context.close();await browser.close();
fs.copyFileSync(await video.path(),'output/SanPaid-120s-raw.webm');
