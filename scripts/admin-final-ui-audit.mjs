import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4178;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');

function assert(condition,message){if(!condition)throw new Error(message);}
async function waitServer(){for(let i=0;i<30;i+=1){try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok)return;}catch{}await sleep(200);}throw new Error('Admin UI audit server did not start.');}
async function waitFor(fn,{attempts=60,delay=100,message='Condition did not become true'}={}){for(let i=0;i<attempts;i+=1){if(await fn())return;await sleep(delay);}throw new Error(message);}
async function noOverflow(page,selector,label){const ok=await page.locator(selector).evaluate(node=>node.scrollWidth<=node.clientWidth+2);assert(ok,`${label}: horizontal overflow detected`);}

async function loginAdmin(page,identifier,role){
  const result=await page.evaluate(async({identifier,role})=>{
    await window.SanPaidAuth.logout({silent:true,keepModal:true}).catch(()=>{});
    await window.SanPaidAuth.login({identifier,password:'review-runtime-password',role,remember:false});
    const opened=await window.SanPaidAuth.openRoleWorkspace(role,null);
    return {opened,user:window.SanPaidAuth.getCurrentUser?.()};
  },{identifier,role});
  assert(result.opened===true,`${role}: workspace failed to open`);
  assert(result.user?.role===role,`${role}: session role mismatch`);
  await page.locator('#sihJudgeShell:not(.judge-hidden)').waitFor({state:'visible'});
  await page.locator('#adminFinalApp').waitFor({state:'visible'});
  await waitFor(async()=>await page.locator('#afDashboard').isVisible().catch(()=>false),{message:`${role}: final overview did not render`});
}

async function assertLegacyHidden(page,label){
  for(const selector of ['#sihJudgeShell>.judge-top','#judgeContent>#adminCommandSummary','#judgeContent>#coopSidebar','#judgeContent>#fedSidebar','#judgeContent>.judge-tabs']){
    const node=page.locator(selector);
    if(await node.count())assert(!(await node.isVisible()),`${label}: legacy surface leaked: ${selector}`);
  }
}

async function assertCooperative(page){
  const app=page.locator('#adminFinalApp');
  const text=(await app.innerText()).toLowerCase();
  for(const phrase of ['cooperative operations dashboard','verification attention','open complaints','capacity requests','total workers','verified workers','available workers','recent alerts',"today's tasks"]){
    assert(text.includes(phrase),`Cooperative Admin missing: ${phrase}`);
  }
  assert((await app.locator('.af-stat-card').count())===4,'Cooperative Admin must show four attention cards');
  assert((await app.locator('.af-mini-card').count())===6,'Cooperative Admin must show six overview metrics');
  assert((await app.locator('.af-nav [data-af-key]').count())>=9,'Cooperative Admin navigation is incomplete');
  await assertLegacyHidden(page,'Cooperative Admin');
  await noOverflow(page,'#sihJudgeShell','Cooperative Admin desktop');

  await page.locator('.af-nav [data-af-key="workers"]').click();
  await page.locator('#afDetailStage').waitFor({state:'visible'});
  await waitFor(async()=>await page.locator('#afDetailBody #coop-workers').count()===1,{message:'Cooperative worker directory was not moved into final detail stage'});
  const detail=(await page.locator('#afDetailBody').innerText()).toLowerCase();
  assert(detail.includes('worker directory'),'Cooperative worker detail content missing');
  assert(!(await page.locator('#afDetailBody [data-af-fallback]').count()),'Cooperative worker detail fell back instead of loading real module');

  await page.locator('.af-back').click();
  await page.locator('#afDashboard').waitFor({state:'visible'});
  assert((await page.locator('#afDetailBody #coop-workers').count())===0,'Cooperative worker module was not restored after Back');
  assert((await page.locator('#coopPortal #coop-workers').count())===1,'Cooperative worker module lost its original parent after Back');

  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);
  const menu=page.locator('#afMobileMenu');
  assert(await menu.isVisible(),'Cooperative Admin mobile menu button missing');
  await menu.click();await page.waitForTimeout(60);
  assert(await menu.getAttribute('aria-expanded')==='true','Cooperative Admin mobile menu did not open');
  assert(await app.evaluate(node=>node.classList.contains('nav-open')),'Cooperative Admin mobile sidebar class missing');
  await page.locator('.af-nav [data-af-key="complaints"]').click();await page.waitForTimeout(220);
  assert(await menu.getAttribute('aria-expanded')==='false','Cooperative Admin mobile menu did not close after navigation');
  assert(await page.locator('#afDetailStage').isVisible(),'Cooperative complaints detail did not open on mobile');
  await noOverflow(page,'#sihJudgeShell','Cooperative Admin mobile');
  await page.locator('.af-back').click();
}

async function assertFederation(page){
  await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(120);
  const app=page.locator('#adminFinalApp');
  const text=(await app.innerText()).toLowerCase();
  for(const phrase of ['federation operations dashboard','connected cooperatives','cross-coop assignments','escalated complaints','repeated shortage signals','verified workers','open escalations','recorded settlements']){
    assert(text.includes(phrase),`Federation Admin missing: ${phrase}`);
  }
  assert((await app.locator('.af-stat-card').count())===4,'Federation Admin must show four attention cards');
  assert((await app.locator('.af-mini-card').count())===6,'Federation Admin must show six overview metrics');
  assert((await app.locator('.af-nav [data-af-key]').count())===8,'Federation Admin navigation count is incorrect');
  await assertLegacyHidden(page,'Federation Admin');
  await noOverflow(page,'#sihJudgeShell','Federation Admin desktop');

  await page.locator('.af-nav [data-af-key="network"]').click();
  await page.locator('#afDetailStage').waitFor({state:'visible'});
  await waitFor(async()=>await page.locator('#afDetailBody #fed-network').count()===1,{message:'Federation network module was not moved into final detail stage'});
  assert(!(await page.locator('#afDetailBody [data-af-fallback]').count()),'Federation network detail fell back instead of loading real module');
  await page.locator('.af-back').click();
  assert((await page.locator('#afDetailBody #fed-network').count())===0,'Federation network module was not restored after Back');
  assert((await page.locator('#judgeContent #fed-network').count())===1,'Federation network module disappeared after Back');

  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);
  const menu=page.locator('#afMobileMenu');
  assert(await menu.isVisible(),'Federation Admin mobile menu button missing');
  await menu.click();await page.waitForTimeout(60);
  assert(await menu.getAttribute('aria-expanded')==='true','Federation Admin mobile menu did not open');
  await page.locator('.af-nav [data-af-key="assignments"]').click();await page.waitForTimeout(260);
  assert(await menu.getAttribute('aria-expanded')==='false','Federation Admin mobile menu did not close after navigation');
  assert(await page.locator('#afDetailStage').isVisible(),'Federation capacity detail did not open on mobile');
  assert(!(await page.locator('#afDetailBody [data-af-fallback]').count()),'Federation capacity detail fell back instead of loading real module');
  await noOverflow(page,'#sihJudgeShell','Federation Admin mobile');
  await page.locator('.af-back').click();
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();page.setDefaultTimeout(9000);
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error?.stack||error?.message||String(error)));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(450);
  assert(await page.evaluate(()=>window.SanPaidReviewRuntime?.enabled===true),'Review runtime is required for deterministic Admin audit');
  await page.locator('[data-platform-access]').first().click();
  await page.locator('#spuLoginForm').waitFor({state:'attached'});
  await page.waitForTimeout(300);

  await loginAdmin(page,'cooperative-admin','COOPERATIVE_ADMIN');
  await assertCooperative(page);

  await page.evaluate(()=>window.SanPaidJudgeMode?.close?.());
  await page.waitForTimeout(100);
  assert((await page.locator('#afDetailBody [data-af-moved="1"]').count())===0,'Cooperative borrowed module survived admin cleanup');

  await loginAdmin(page,'federation-admin','FEDERATION_ADMIN');
  await assertFederation(page);

  assert(pageErrors.length===0,`Final Admin page errors: ${pageErrors.join(' | ')}`);
  console.log('SanPaid final Cooperative + Federation Admin UI audit: PASS');
  console.log('Verified reference shell, legacy isolation, real detail-module borrowing/restoration, responsive navigation, role isolation, KPI hierarchy and no horizontal overflow.');
  await context.close();
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
