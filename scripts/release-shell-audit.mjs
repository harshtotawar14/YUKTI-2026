import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4184;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const executablePath=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
async function waitServer(){for(let i=0;i<30;i++){try{if((await fetch(`http://127.0.0.1:${port}/`)).ok)return;}catch{}await sleep(200);}throw new Error('Release audit server did not start.');}
async function noOverflow(page,selector,label){const ok=await page.locator(selector).evaluate(n=>n.scrollWidth<=n.clientWidth+2);assert(ok,`${label} has horizontal overflow`);}
async function closeTransient(page){await page.keyboard.press('Escape').catch(()=>{});await page.waitForTimeout(100);}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(700);

  assert(await page.evaluate(()=>window.SanPaidReviewRuntime?.enabled===true),'Review runtime missing from release shell.');
  assert(await page.evaluate(()=>document.documentElement.dataset.judgeIntegrity==='closed-loop-v3'),'Judge integrity v3 marker missing.');
  const body=(await page.locator('body').innerText()).toLowerCase();
  for(const phrase of ['cooperative capacity exchange','demand-to-workforce loop','stakeholder-informed design','field findings mapped to product controls'])assert(body.includes(phrase),`Landing missing judge-facing phrase: ${phrase}`);
  for(const forbidden of ['human-reviewed ai','digital service passport with welfare status','postgresql-backed operations','postgresql + audit','controlled sandbox functions'])assert(!body.includes(forbidden),`Visible release copy still exposes overclaim/stale wording: ${forbidden}`);
  assert(body.includes('human-reviewed forecasting (pilot)'),'Truth-safe forecasting label is missing.');
  await noOverflow(page,'html','1440px landing');

  const platformButtons=page.locator('[data-platform-access]:visible');
  assert(await platformButtons.count()>0,'Open Platform CTA missing.');
  await platformButtons.first().click();
  await page.locator('#sanpaidUnifiedAuthRoot:not([hidden]) .spu-shell').waitFor({state:'visible'});
  const access=(await page.locator('#sanpaidUnifiedAuthRoot .spu-shell').innerText()).toLowerCase();
  for(const role of ['customer','worker','cooperative','federation'])assert(access.includes(role),`Role Access missing ${role}.`);
  assert(!/\bprototype\b|\bdemo\b/i.test(access),'Role Access exposes prototype/demo wording.');
  await closeTransient(page);

  await page.locator('#heroTourCta').click();
  const selector=page.locator('#selectorModeShell');
  await selector.waitFor({state:'visible'});
  assert((await page.locator('#selectorMobileProgress').innerText()).includes('Step 1 of 10'),'Platform Tour did not start at step 1 of 10.');
  for(let step=1;step<10;step++){
    await page.locator('#selectorNext').click();
    await page.waitForTimeout(35);
  }
  const final=(await page.locator('#selectorContent').innerText()).toLowerCase();
  for(const phrase of ['baseline','measure kpis','validate impact','better access to local work opportunities'])assert(final.includes(phrase),`Final Platform Tour step missing: ${phrase}`);
  await closeTransient(page);
  assert(!(await selector.isVisible()),'Platform Tour did not close with Escape.');

  await page.locator('.navlinks a[href="#how"]').click();
  await page.waitForTimeout(250);
  assert((await page.evaluate(()=>window.scrollY))>100,'How it works navigation did not move to the flow section.');

  for(const [width,height] of [[1000,900],[430,932],[390,844],[360,800]]){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(120);
    await noOverflow(page,'html',`${width}px landing`);
    const menu=page.locator('#menuBtn');
    assert(await menu.isVisible(),`${width}px menu button is not visible.`);
    await menu.click();
    await page.waitForTimeout(60);
    assert(await menu.getAttribute('aria-expanded')==='true',`${width}px mobile menu did not expand.`);
    assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='false',`${width}px drawer is hidden after opening.`);
    const drawer=(await page.locator('#mobileDrawer').innerText()).toLowerCase();
    assert(drawer.includes('open platform')&&drawer.includes('platform tour'),`${width}px drawer lacks primary entry points.`);
    await noOverflow(page,'#mobileDrawer',`${width}px mobile drawer`);
    await page.locator('#mobileDrawer [data-open-selector]').click();
    await selector.waitFor({state:'visible'});
    assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='true',`${width}px drawer stayed open behind Platform Tour.`);
    await noOverflow(page,'#selectorModeShell',`${width}px Platform Tour`);
    assert(await page.locator('#selectorClose').isVisible(),`${width}px Platform Tour close button missing.`);
    await page.locator('#selectorClose').click();
    await page.waitForTimeout(60);
    assert(!(await selector.isVisible()),`${width}px Platform Tour did not close.`);
  }

  assert(pageErrors.length===0,`Page errors detected: ${pageErrors.join(' | ')}`);
  console.log('SanPaid judge-facing release shell audit: PASS');
  console.log('Verified truth-safe landing copy, role access, all 10 walkthrough steps, navigation, mobile drawer and responsive overflow from 360px to desktop.');
  await context.close();
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
