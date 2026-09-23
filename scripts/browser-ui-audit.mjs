import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4173;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');

function assert(condition,message){if(!condition)throw new Error(message);}
function assertProfessionalCopy(text,where){assert(!/\b(?:prototype|demo)\b/i.test(String(text||'')),`${where} still exposes prototype/demo wording`);}
async function waitServer(){for(let i=0;i<30;i+=1){try{const response=await fetch(`http://127.0.0.1:${port}/`);if(response.ok)return;}catch{}await sleep(200);}throw new Error('Local SanPaid build server did not start.');}
async function noOverflow(page,selector,label){const ok=await page.locator(selector).evaluate(node=>node.scrollWidth<=node.clientWidth+2);assert(ok,`${label}: horizontal overflow detected`);}
async function visibleDialog(page){return page.locator('[role="dialog"]:visible, dialog:visible, .auth-modal:visible, .selector-modal:visible').first();}
async function closeTransient(page){
  await page.keyboard.press('Escape').catch(()=>{});await page.waitForTimeout(100);
  const close=page.locator('button[aria-label*="Close" i]:visible, button[data-close]:visible, .close:visible').first();
  if(await close.count())await close.click({timeout:500}).catch(()=>{});
  await page.waitForTimeout(80);
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();page.setDefaultTimeout(7000);
  const pageErrors=[],consoleErrors=[];
  page.on('pageerror',error=>pageErrors.push(error?.message||String(error)));
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});

  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(700);
  assertProfessionalCopy(await page.locator('#landing').innerText(),'Landing page');
  const hero=(await page.locator('.hero').innerText()).toLowerCase();
  for(const phrase of ['cooperative capacity exchange','demand-to-workforce loop','stakeholder-informed design'])assert(hero.includes(phrase),`Hero missing: ${phrase}`);
  assert((await page.locator('.hero-usp').count())===2,'Hero must expose two core USP cards');
  await noOverflow(page,'.hero','Desktop hero');

  const access=page.locator('#getStarted');
  assert(await access.isVisible(),'Desktop OPEN PLATFORM button missing');
  await access.click();await page.waitForTimeout(160);
  const roleDialog=await visibleDialog(page);
  assert(await roleDialog.count()>0,'Role Access did not open');
  const roleText=(await roleDialog.innerText()).toLowerCase();
  for(const role of ['customer','worker','cooperative','federation'])assert(roleText.includes(role),`Role Access missing ${role}`);
  assertProfessionalCopy(roleText,'Role Access');
  await noOverflow(page,'#sanpaidUnifiedAuthRoot .spu-shell','Desktop Role Access');
  await closeTransient(page);

  await page.locator('#heroTourCta').click();await page.waitForTimeout(150);
  const tour=page.locator('#selectorModeShell');
  assert(await tour.isVisible(),'Platform Tour did not open');
  assertProfessionalCopy(await tour.innerText(),'Platform Tour');
  await noOverflow(page,'#selectorModeShell','Desktop Platform Tour');
  await page.locator('#selectorNext').click();await page.waitForTimeout(60);
  const stepTwo=(await page.locator('#selectorContent').innerText()).toLowerCase();
  for(const phrase of ['cooperative capacity exchange','demand-to-workforce loop'])assert(stepTwo.includes(phrase),`Platform Tour missing ${phrase}`);
  await page.keyboard.press('Escape');await page.waitForTimeout(90);
  assert(!(await tour.isVisible()),'Escape did not close Platform Tour');

  for(const [width,height] of [[360,800],[375,812],[390,844],[412,915],[430,932],[768,1024],[1000,900],[1024,900],[1440,1000]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(70);
    await noOverflow(page,'html',`${width}px landing`);
    const mobileNav=width<=1000;
    assert((await page.locator('#menuBtn').isVisible())===mobileNav,`${width}px menu breakpoint incorrect`);
    if(!mobileNav)continue;
    const menu=page.locator('#menuBtn');await menu.click();await page.waitForTimeout(55);
    assert(await menu.getAttribute('aria-expanded')==='true',`${width}px menu did not open`);
    assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='false',`${width}px drawer remained hidden`);
    await noOverflow(page,'#mobileDrawer',`${width}px mobile drawer`);
    await page.locator('#mobileDrawer [data-open-selector]').click();await page.waitForTimeout(90);
    assert(await tour.isVisible(),`${width}px Platform Tour did not open from drawer`);
    assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='true',`${width}px drawer stayed open behind tour`);
    await noOverflow(page,'#selectorModeShell',`${width}px Platform Tour`);
    await page.keyboard.press('Escape');await page.waitForTimeout(70);
  }

  await page.setViewportSize({width:390,height:844});
  await page.locator('#menuBtn').click();await page.waitForTimeout(55);
  await page.locator('#spMobileAccess').click();await page.waitForTimeout(120);
  const mobileAuth=page.locator('#sanpaidUnifiedAuthRoot:not([hidden]) .spu-shell');
  await mobileAuth.waitFor({state:'visible'});
  const mobileRoleText=(await mobileAuth.innerText()).toLowerCase();
  for(const role of ['customer','worker','cooperative','federation'])assert(mobileRoleText.includes(role),`Mobile Role Access missing ${role}`);
  await noOverflow(page,'#sanpaidUnifiedAuthRoot .spu-shell','Mobile Role Access');
  await closeTransient(page);

  assert(pageErrors.length===0,`Page errors: ${pageErrors.join(' | ')}`);
  const unexpectedConsole=consoleErrors.filter(text=>!text.includes('/api/')&&!text.includes('404'));
  assert(unexpectedConsole.length===0,`Unexpected console errors: ${unexpectedConsole.join(' | ')}`);
  console.log('SanPaid broader shell UI audit: PASS');
  console.log('Verified landing, role access, Platform Tour, responsive navigation and release viewport overflow. Role-specific Customer/Worker/Admin contracts are covered by dedicated blocking audits.');
  await context.close();
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
