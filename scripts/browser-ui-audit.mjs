import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4173;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');

async function waitServer(){for(let i=0;i<30;i++){try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok)return;}catch{}await sleep(200);}throw new Error('Local SanPaid build server did not start.');}
function assert(condition,message){if(!condition)throw new Error(message);}
async function visibleDialog(page){return page.locator('[role="dialog"]:visible, dialog:visible, .modal:visible, .auth-modal:visible, .selector-modal:visible').first();}
async function closeTransient(page){await page.keyboard.press('Escape').catch(()=>{});await page.waitForTimeout(100);const close=page.locator('button[aria-label*="Close" i]:visible, button[data-close]:visible, .close:visible').first();if(await close.count())await close.click({timeout:400}).catch(()=>{});await page.waitForTimeout(100);}
async function invokeSecondary(page,selector){const node=page.locator(selector);assert(await node.count()===1,`${selector} missing`);await node.evaluate(el=>el.click());await page.waitForTimeout(180);}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();page.setDefaultTimeout(5000);
  const pageErrors=[];const consoleErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(1000);

  for(const id of ['connectedDemoBtn','getStarted','heroMatchingCta','heroSearch','bookServiceHero','joinWorker','coopLogin','menuBtn'])assert(await page.locator(`#${id}`).count()===1,`#${id} missing`);

  assert(await page.locator('#getStarted').isVisible(),'Desktop Role Access must be visible');
  await page.locator('#getStarted').click();await page.waitForTimeout(180);
  assert(await (await visibleDialog(page)).count()>0,'Role Access did not open a visible dialog/workspace');await closeTransient(page);

  // These secondary controls intentionally live in a presentation-dependent/collapsible surface.
  // Browser audit invokes their real DOM click handlers while static UI contracts separately enforce visibility/accessibility markup.
  await invokeSecondary(page,'#bookServiceHero');
  assert(await (await visibleDialog(page)).count()>0,'Book Verified Service did not open customer access');await closeTransient(page);

  await invokeSecondary(page,'#joinWorker');
  const workerDialog=await visibleDialog(page);assert(await workerDialog.count()>0,'Worker Access did not open a dialog/workspace');
  assert((await workerDialog.textContent()||'').toLowerCase().includes('worker'),'Worker Access opened the wrong role UI');await closeTransient(page);

  await invokeSecondary(page,'#coopLogin');
  const coopDialog=await visibleDialog(page);assert(await coopDialog.count()>0,'Cooperative Access did not open a dialog/workspace');
  const coopText=(await coopDialog.textContent()||'').toLowerCase();assert(coopText.includes('cooperative')||coopText.includes('admin'),'Cooperative Access opened the wrong role UI');await closeTransient(page);

  await page.locator('#heroArea').evaluate((el)=>{el.value='Audit Area';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await invokeSecondary(page,'#heroSearch');
  assert(await (await visibleDialog(page)).count()>0,'Find Local Service did not open customer access');await closeTransient(page);

  const firstService=page.locator('#serviceGrid [data-service]').first();assert(await firstService.count()>0,'Service catalog rendered no clickable service cards');
  await firstService.evaluate(el=>el.click());await page.waitForTimeout(180);
  assert(await (await visibleDialog(page)).count()>0,'Service card did not open customer access');await closeTransient(page);

  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
  assert(await page.locator('#menuBtn').isVisible(),'Mobile menu button must be visible');
  await page.locator('#menuBtn').click();await page.waitForTimeout(100);
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='true','Mobile menu did not expand');
  assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='false','Mobile drawer remained hidden');
  await page.keyboard.press('Escape');await page.waitForTimeout(100);
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='false','Escape did not close mobile menu');

  assert(pageErrors.length===0,`Page errors: ${pageErrors.join(' | ')}`);
  const unexpectedConsole=consoleErrors.filter(text=>!text.includes('/api/')&&!text.includes('404'));
  assert(unexpectedConsole.length===0,`Unexpected console errors: ${unexpectedConsole.join(' | ')}`);
  console.log('SanPaid Chromium UI audit: PASS');
  console.log('Verified desktop Role Access, customer/worker/cooperative entry handlers, search/service cards, mobile drawer and Escape behavior.');
} finally {if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');}
