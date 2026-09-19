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
function assertProfessionalCopy(text,where){assert(!/\b(?:prototype|demo)\b/i.test(String(text||'')),`${where} still exposes prototype/demo wording`);}
async function assertNoHorizontalOverflow(page,selector,where){const ok=await page.locator(selector).evaluate(node=>node.scrollWidth<=node.clientWidth+2);assert(ok,`${where} has horizontal overflow`);}
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
  assertProfessionalCopy(await page.locator('body').innerText(),'Landing page');

  for(const id of ['connectedDemoBtn','getStarted','heroTourCta']){
    const node=page.locator(`#${id}`);assert(await node.count()===1,`#${id} missing`);assert(await node.isVisible(),`#${id} is not visible on desktop`);
  }
  assert(await page.locator('#menuBtn').count()===1,'#menuBtn missing');
  assert(!(await page.locator('#menuBtn').isVisible()),'#menuBtn should stay hidden on desktop');

  await page.locator('#getStarted').click();await page.waitForTimeout(200);
  const roleDialog=await visibleDialog(page);assert(await roleDialog.count()>0,'Role Access did not open a visible dialog/workspace');
  const roleText=(await roleDialog.textContent()||'').toLowerCase();
  for(const role of ['customer','worker','cooperative','federation'])assert(roleText.includes(role),`Role Access does not expose ${role} access`);
  assert(roleText.includes('shared platform access'),'Role Access does not expose shared access guidance');
  assertProfessionalCopy(roleText,'Role Access');
  await closeTransient(page);

  await page.locator('#heroTourCta').click();await page.waitForTimeout(180);
  const desktopSelector=page.locator('#selectorModeShell');
  assert(await desktopSelector.isVisible(),'Hero Platform Tour CTA did not open the walkthrough');
  assertProfessionalCopy(await desktopSelector.innerText(),'Desktop Platform Tour');
  await assertNoHorizontalOverflow(page,'#selectorModeShell','Desktop Platform Tour');
  await page.keyboard.press('Escape');await page.waitForTimeout(120);
  assert(!(await desktopSelector.isVisible()),'Escape did not close desktop Platform Tour');

  const matchingBefore=await page.locator('#matching').boundingBox();
  await page.locator('.navlinks a[href="#matching"]').click();await page.waitForTimeout(350);
  const matchingAfter=await page.locator('#matching').boundingBox();
  assert(Boolean(matchingBefore&&matchingAfter),'Matching section missing');
  assert(await page.evaluate(()=>window.scrollY)>100,'Workflow navigation did not navigate toward matching proof');
  assert((await page.locator('.navlinks a[href="#matching"]').getAttribute('aria-current'))==='location','Active navigation state did not follow the Workflow section');

  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(200);
  await page.locator('#connectedDemoBtn').click();await page.waitForTimeout(350);
  const demoFeedback=page.locator('[role="dialog"]:visible, .toast:visible, [role="status"]:visible, .modal:visible').first();
  assert(await demoFeedback.count()>0,'OPEN PLATFORM produced no visible feedback when local API readiness is unavailable');
  assertProfessionalCopy(await demoFeedback.innerText(),'Platform readiness');
  await closeTransient(page);

  await page.setViewportSize({width:1000,height:900});await page.waitForTimeout(180);
  assert(await page.locator('#menuBtn').isVisible(),'Tablet menu button must be visible at 1000px');
  assert(!(await page.locator('.navlinks').isVisible()),'Desktop navigation links should collapse at 1000px');
  await assertNoHorizontalOverflow(page,'html','1000px landing page');
  await page.locator('#menuBtn').click();await page.waitForTimeout(120);
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='true','Tablet menu did not expand');
  assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='false','Tablet navigation drawer remained hidden');
  assert(await page.locator('#spMobileAccess').isVisible(),'Tablet/mobile drawer is missing generic Role Access');
  await page.locator('#spMobileAccess').click();await page.waitForTimeout(180);
  const tabletRoleDialog=await visibleDialog(page);
  assert(await tabletRoleDialog.count()>0,'Tablet Role Access did not open');
  assertProfessionalCopy(await tabletRoleDialog.innerText(),'Tablet Role Access');
  await assertNoHorizontalOverflow(page,'html','Tablet Role Access viewport');
  await closeTransient(page);

  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(180);
  assert(await page.locator('#menuBtn').isVisible(),'Mobile menu button must be visible');
  await page.locator('#menuBtn').click();await page.waitForTimeout(120);
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='true','Mobile menu did not expand');
  assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='false','Mobile drawer remained hidden');
  const mobileText=(await page.locator('#mobileDrawer').textContent()||'').toLowerCase();
  assert(mobileText.includes('open platform')&&mobileText.includes('platform tour'),'Mobile drawer is missing platform entry points');
  assertProfessionalCopy(mobileText,'Mobile navigation');
  await assertNoHorizontalOverflow(page,'#mobileDrawer','Mobile navigation');

  await page.locator('#mobileDrawer [data-open-selector]').click();await page.waitForTimeout(220);
  const selector=page.locator('#selectorModeShell');
  assert(await selector.isVisible(),'Platform Tour did not open on mobile');
  assert(await page.locator('#mobileDrawer').getAttribute('aria-hidden')==='true','Mobile drawer did not close when Platform Tour opened');
  assert(await page.locator('#menuBtn').getAttribute('aria-expanded')==='false','Menu button remained expanded behind Platform Tour');
  assert(!(await page.locator('body').evaluate(body=>body.classList.contains('mobile-drawer-open'))),'Drawer scroll-lock class remained behind Platform Tour');
  assertProfessionalCopy(await selector.innerText(),'Mobile Platform Tour');
  await assertNoHorizontalOverflow(page,'#selectorModeShell','Mobile Platform Tour');

  const topBox=await page.locator('.selector-top').boundingBox();
  const progressBox=await page.locator('.selector-progress-wrap').boundingBox();
  assert(Boolean(topBox&&progressBox),'Platform Tour mobile header/progress is missing');
  assert(progressBox.y>=topBox.y+topBox.height-2,'Platform Tour progress overlaps the sticky mobile header');
  assert((await page.locator('#selectorMobileProgress').innerText()).includes('Step 1 of 10'),'Mobile Platform Tour progress is incorrect');
  for(const id of ['selectorPrev','selectorNext','selectorAuto'])assert(await page.locator('#'+id).isVisible(),'#'+id+' is not visible on mobile');
  assert(await page.locator('#selectorPrev').isDisabled(),'Previous must be disabled on the first walkthrough step');

  await page.locator('#selectorNext').click();await page.waitForTimeout(80);
  assert((await page.locator('#selectorMobileProgress').innerText()).includes('Step 2 of 10'),'Next did not advance the mobile walkthrough');
  await page.evaluate(()=>window.SanPaidSelectorMode.go(9));await page.waitForTimeout(100);
  const finalTourText=(await page.locator('#selectorContent').innerText()).toLowerCase();
  for(const phrase of ['baseline','measure kpis','validate impact','better access to local work opportunities'])assert(finalTourText.includes(phrase),'Final walkthrough step is missing PPT-aligned phrase: '+phrase);
  await assertNoHorizontalOverflow(page,'#selectorModeShell','Final mobile Platform Tour step');

  await page.keyboard.press('Escape');await page.waitForTimeout(140);
  assert(!(await selector.isVisible()),'Escape did not close Platform Tour');
  assert(!(await page.locator('body').evaluate(body=>body.classList.contains('selector-open')||body.classList.contains('mobile-drawer-open'))),'Mobile scroll-lock state remained after closing Platform Tour');
  await assertNoHorizontalOverflow(page,'html','390px landing page');

  await page.locator('#menuBtn').click();await page.waitForTimeout(100);
  await page.locator('#spMobileAccess').click();await page.waitForTimeout(180);
  const mobileRoleDialog=await visibleDialog(page);
  assert(await mobileRoleDialog.count()>0,'Mobile Role Access did not open');
  const mobileRoleText=(await mobileRoleDialog.innerText()).toLowerCase();
  for(const role of ['customer','worker','cooperative','federation'])assert(mobileRoleText.includes(role),`Mobile Role Access is missing ${role}`);
  await assertNoHorizontalOverflow(page,'html','Mobile Role Access viewport');
  await closeTransient(page);

  await page.setViewportSize({width:360,height:800});await page.waitForTimeout(120);
  await page.evaluate(()=>window.SanPaidSelectorMode.open(4));await page.waitForTimeout(120);
  assert(await selector.isVisible(),'Platform Tour failed to reopen at 360px viewport');
  await assertNoHorizontalOverflow(page,'#selectorModeShell','360px Platform Tour');
  assert(await page.locator('#selectorClose').isVisible(),'Platform Tour close control is not visible at 360px');
  await page.locator('#selectorClose').click();await page.waitForTimeout(140);
  assert(!(await selector.isVisible()),'Close button did not dismiss Platform Tour at 360px');

  assert(pageErrors.length===0,`Page errors: ${pageErrors.join(' | ')}`);
  const unexpectedConsole=consoleErrors.filter(text=>!text.includes('/api/')&&!text.includes('404'));
  assert(unexpectedConsole.length===0,`Unexpected console errors: ${unexpectedConsole.join(' | ')}`);
  console.log('SanPaid Chromium UI audit: PASS');
  console.log('Verified desktop Platform Tour/role access/active navigation, 1000px tablet menu and role access, plus 390/360px mobile Platform Tour, overflow and close-state recovery.');
} finally {if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');}
