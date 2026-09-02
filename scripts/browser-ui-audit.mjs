import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4173;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'inherit'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');

async function waitServer(){
  for(let i=0;i<30;i++){
    try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok)return;}catch{}
    await sleep(200);
  }
  throw new Error('Local SanPaid build server did not start.');
}

function assert(condition,message){if(!condition)throw new Error(message);}

async function visibleDialog(page){
  return page.locator('[role="dialog"]:visible, dialog:visible, .modal:visible, .auth-modal:visible, .selector-modal:visible').first();
}

async function closeTransient(page){
  await page.keyboard.press('Escape').catch(()=>{});
  await page.waitForTimeout(120);
  const close=page.locator('button[aria-label*="Close" i]:visible, button[data-close]:visible, .close:visible').first();
  if(await close.count())await close.click({timeout:500}).catch(()=>{});
  await page.waitForTimeout(120);
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.setDefaultTimeout(5000);
  const pageErrors=[];
  const consoleErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});

  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(900);

  assert(await page.locator('#connectedDemoBtn').count()===1,'Golden Demo button missing');
  assert(await page.locator('#getStarted').count()===1,'Role Access button missing');
  assert(await page.locator('#joinWorker').count()===1,'Worker Access button missing');
  assert(await page.locator('#coopLogin').count()===1,'Cooperative Access button missing');

  await page.locator('#getStarted').click();
  await page.waitForTimeout(180);
  assert(await (await visibleDialog(page)).count()>0,'Role Access did not open a visible dialog/workspace');
  await closeTransient(page);

  const quickAccess=page.locator('.quick-booking-details');
  if(await quickAccess.count()&&!(await quickAccess.getAttribute('open')))await quickAccess.locator('summary').click();
  assert(await page.locator('#bookServiceHero').isVisible(),'Quick service and role access did not expand');

  await page.locator('#bookServiceHero').click();
  await page.waitForTimeout(180);
  assert(await (await visibleDialog(page)).count()>0,'Book Verified Service did not open customer access');
  await closeTransient(page);

  await page.locator('#joinWorker').click();
  await page.waitForTimeout(180);
  const workerDialog=await visibleDialog(page);
  assert(await workerDialog.count()>0,'Worker Access did not open a dialog/workspace');
  const workerText=(await workerDialog.textContent()||'').toLowerCase();
  assert(workerText.includes('worker'),'Worker Access opened the wrong role UI');
  await closeTransient(page);

  await page.locator('#coopLogin').click();
  await page.waitForTimeout(180);
  const coopDialog=await visibleDialog(page);
  assert(await coopDialog.count()>0,'Cooperative Access did not open a dialog/workspace');
  const coopText=(await coopDialog.textContent()||'').toLowerCase();
  assert(coopText.includes('cooperative')||coopText.includes('admin'),'Cooperative Access opened the wrong role UI');
  await closeTransient(page);

  await page.locator('#heroArea').fill('Audit Area');
  await page.locator('#heroSearch').click();
  await page.waitForTimeout(180);
  assert(await (await visibleDialog(page)).count()>0,'Find Local Service did not open customer access');
  await closeTransient(page);

  const firstService=page.locator('#serviceGrid [data-service]').first();
  assert(await firstService.count()>0,'Service catalog rendered no clickable service cards');
  await firstService.click();
  await page.waitForTimeout(180);
  assert(await (await visibleDialog(page)).count()>0,'Service card did not open customer access');
  await closeTransient(page);

  await page.setViewportSize({width:390,height:844});
  await page.locator('#menuBtn').click();
  await page.waitForTimeout(100);
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='true','Mobile menu did not expand');
  assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='false','Mobile drawer remained hidden');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='false','Escape did not close mobile menu');

  assert(pageErrors.length===0,`Page errors: ${pageErrors.join(' | ')}`);
  const unexpectedConsole=consoleErrors.filter(text=>!text.includes('/api/')&&!text.includes('404'));
  assert(unexpectedConsole.length===0,`Unexpected console errors: ${unexpectedConsole.join(' | ')}`);

  console.log('SanPaid Chromium UI audit: PASS');
  console.log('Verified: Role Access, quick-access expansion, customer booking entry, Worker Access, Cooperative Access, service search, service cards, mobile drawer + Escape accessibility.');
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
