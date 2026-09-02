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
async function closeTransient(page){await page.keyboard.press('Escape').catch(()=>{});await page.waitForTimeout(120);const close=page.locator('button[aria-label*="Close" i]:visible, button[data-close]:visible, .close:visible').first();if(await close.count())await close.click({timeout:500}).catch(()=>{});await page.waitForTimeout(120);}

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

  for(const id of ['connectedDemoBtn','getStarted','heroMatchingCta','menuBtn']){
    const node=page.locator(`#${id}`);assert(await node.count()===1,`#${id} missing`);assert(await node.isVisible(),`#${id} is not visible on desktop`);
  }

  await page.locator('#getStarted').click();await page.waitForTimeout(200);
  const roleDialog=await visibleDialog(page);assert(await roleDialog.count()>0,'Role Access did not open a visible dialog/workspace');
  const roleText=(await roleDialog.textContent()||'').toLowerCase();
  for(const role of ['customer','worker','cooperative','federation'])assert(roleText.includes(role),`Role Access does not expose ${role} access`);
  await closeTransient(page);

  const matchingBefore=await page.locator('#matching').boundingBox();
  await page.locator('#heroMatchingCta').click();await page.waitForTimeout(350);
  const matchingAfter=await page.locator('#matching').boundingBox();
  assert(Boolean(matchingBefore&&matchingAfter),'Matching section missing');
  assert(await page.evaluate(()=>window.scrollY)>100,'SEE HOW MATCHING WORKS did not navigate toward matching proof');

  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(200);
  await page.locator('#connectedDemoBtn').click();await page.waitForTimeout(350);
  const demoFeedback=page.locator('[role="dialog"]:visible, .toast:visible, [role="status"]:visible, .modal:visible').first();
  assert(await demoFeedback.count()>0,'START GOLDEN DEMO produced no visible feedback when local API readiness is unavailable');
  await closeTransient(page);

  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(180);
  assert(await page.locator('#menuBtn').isVisible(),'Mobile menu button must be visible');
  await page.locator('#menuBtn').click();await page.waitForTimeout(120);
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='true','Mobile menu did not expand');
  assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='false','Mobile drawer remained hidden');
  const mobileText=(await page.locator('#mobileDrawer').textContent()||'').toLowerCase();
  assert(mobileText.includes('golden demo')&&mobileText.includes('guided demo'),'Mobile drawer is missing demo entry points');
  await page.keyboard.press('Escape');await page.waitForTimeout(120);
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='false','Escape did not close mobile menu');

  assert(pageErrors.length===0,`Page errors: ${pageErrors.join(' | ')}`);
  const unexpectedConsole=consoleErrors.filter(text=>!text.includes('/api/')&&!text.includes('404'));
  assert(unexpectedConsole.length===0,`Unexpected console errors: ${unexpectedConsole.join(' | ')}`);
  console.log('SanPaid Chromium UI audit: PASS');
  console.log('Verified visible desktop CTAs, all role choices, matching navigation, Golden Demo feedback, mobile drawer and Escape accessibility.');
} finally {if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');}
