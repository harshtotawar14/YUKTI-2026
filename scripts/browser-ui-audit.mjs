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

async function openMockRoleWorkspace(context,role){
  const rolePage=await context.newPage();rolePage.setDefaultTimeout(5000);
  const user=role==='CUSTOMER'
    ?{id:101,role:'CUSTOMER',fullName:'Review Customer',name:'Review Customer'}
    :{id:201,role:'WORKER',fullName:'Amit Worker',name:'Amit Worker',worker_id:11};
  await rolePage.route('**/api/**',async route=>{
    const u=new URL(route.request().url()),path=u.pathname;
    let payload={ok:true};
    if(path==='/api/auth/demo-access')payload={ok:true,accounts:[]};
    else if(path==='/api/auth/me')payload={ok:true,user};
    else if(path==='/api/connected/health')payload={ok:true};
    else if(path==='/api/public/services'||path==='/api/connected/customer/services')payload={ok:true,source:'DATABASE_CONFIGURATION',services:[{name:'Electrician',basePrice:499,icon:'⚡'},{name:'Plumber',basePrice:399,icon:'🔧'}]};
    else if(path==='/api/connected/snapshot')payload={role,bookings:[]};
    else if(path==='/api/connected/customer/notifications')payload={ok:true,notifications:[]};
    else if(path==='/api/connected/customer/support')payload={ok:true,requests:[]};
    else if(path==='/api/connected/worker/offers')payload=[];
    else if(path==='/api/connected/worker/dashboard')payload={ok:true,profile:{name:'Amit Worker',available:true,availabilityStatus:'AVAILABLE',rating:4.8,identityStatus:'VERIFIED'},jobs:{active:0},earnings:{today:0,week:0,total:0,payments:[]}};
    else if(path==='/api/connected/workforce/passport')payload={ok:true,passport:{workerId:11,name:'Amit Worker',cooperative:{id:1,name:'Local Cooperative',region:'Kolhapur'},identityVerified:true,identityStatus:'VERIFIED',availabilityStatus:'AVAILABLE',rating:4.8,completedJobs:3,currentEligibility:'ELIGIBLE',skills:[{name:'Electrician',status:'VERIFIED',verified:true}],credentials:[],credentialScope:'SANPAID_SERVICE_HISTORY_NOT_GOVERNMENT_CERTIFICATE'}};
    else if(path==='/api/connected/worker/notifications')payload={ok:true,notifications:[]};
    else if(path==='/api/connected/worker/schedule')payload={ok:true,date:'2026-09-19',slots:[],suggestedSlots:[],empty:true};
    else if(path==='/api/connected/worker/capacity-offers')payload=[];
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
  await rolePage.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});await rolePage.waitForTimeout(450);
  const opened=await rolePage.evaluate(async({role,user})=>{
    window.SanPaidAuth.restoreSession=async()=>user;
    window.SanPaidAuth.getCurrentUser=()=>user;
    const result=await window.ConnectedSanPaid.open(role==='CUSTOMER'?'CUSTOMER':'WORKER_A');
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'browser-role-audit'}}));
    return result;
  },{role,user});
  assert(opened===true,`${role} connected workspace did not open in the role audit fixture`);
  await rolePage.locator('#connectedShell:not(.hidden)').waitFor({state:'visible'});
  await rolePage.waitForTimeout(2300);
  await rolePage.evaluate(()=>window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'browser-role-audit-refresh'}})));
  await rolePage.waitForTimeout(250);
  return rolePage;
}

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
  const heroText=(await page.locator('.hero').innerText()).toLowerCase();
  for(const phrase of ['cooperative capacity exchange','demand-to-workforce loop','stakeholder-informed design','5 findings mapped'])assert(heroText.includes(phrase),`Hero is missing evaluator-critical phrase: ${phrase}`);
  assert(await page.locator('.hero-usp').count()===2,'Hero must expose exactly two core USP cards');
  await assertNoHorizontalOverflow(page,'.hero','Desktop hero');

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
  await page.locator('#selectorNext').click();await page.waitForTimeout(90);
  const desktopUspText=(await page.locator('#selectorContent').innerText()).toLowerCase();
  for(const phrase of ['cooperative capacity exchange','demand-to-workforce loop'])assert(desktopUspText.includes(phrase),`Platform Tour step two is missing: ${phrase}`);
  await page.evaluate(()=>window.SanPaidSelectorMode.go(0));await page.waitForTimeout(60);
  await page.keyboard.press('Escape');await page.waitForTimeout(120);
  assert(!(await desktopSelector.isVisible()),'Escape did not close desktop Platform Tour');

  const matchingBefore=await page.locator('#matching').boundingBox();
  await page.locator('.navlinks a[href="#matching"]').click();await page.waitForTimeout(450);
  const matchingAfter=await page.locator('#matching').boundingBox();
  assert(Boolean(matchingBefore&&matchingAfter),'Matching section missing');
  assert(await page.evaluate(()=>window.scrollY)>100,'Workflow navigation did not navigate toward matching proof');

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
  const tabletRoleDialog=page.locator('#sanpaidUnifiedAuthRoot:not([hidden]) .spu-shell');
  await tabletRoleDialog.waitFor({state:'visible'});
  assertProfessionalCopy(await tabletRoleDialog.innerText(),'Tablet Role Access');
  await assertNoHorizontalOverflow(page,'#sanpaidUnifiedAuthRoot .spu-shell','Tablet Role Access');
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
  const mobileRoleDialog=page.locator('#sanpaidUnifiedAuthRoot:not([hidden]) .spu-shell');
  await mobileRoleDialog.waitFor({state:'visible'});
  const mobileRoleText=(await mobileRoleDialog.innerText()).toLowerCase();
  for(const role of ['customer','worker','cooperative','federation'])assert(mobileRoleText.includes(role),`Mobile Role Access is missing ${role}`);
  await assertNoHorizontalOverflow(page,'#sanpaidUnifiedAuthRoot .spu-shell','Mobile Role Access');
  await closeTransient(page);

  await page.setViewportSize({width:360,height:800});await page.waitForTimeout(120);
  await page.evaluate(()=>window.SanPaidSelectorMode.open(4));await page.waitForTimeout(120);
  assert(await selector.isVisible(),'Platform Tour failed to reopen at 360px viewport');
  await assertNoHorizontalOverflow(page,'#selectorModeShell','360px Platform Tour');
  assert(await page.locator('#selectorClose').isVisible(),'Platform Tour close control is not visible at 360px');
  await page.locator('#selectorClose').click();await page.waitForTimeout(140);
  assert(!(await selector.isVisible()),'Close button did not dismiss Platform Tour at 360px');

  // Release viewport sweep: cover the widths used in the evaluator/device QA checklist.
  for(const [width,height] of [[375,812],[412,915],[430,932],[768,1024],[1024,900],[1440,1000]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(80);
    await assertNoHorizontalOverflow(page,'html',`${width}px release viewport`);
    const menuShouldShow=width<=1000;
    assert((await page.locator('#menuBtn').isVisible())===menuShouldShow,`${width}px navigation breakpoint is incorrect`);
    if(menuShouldShow){
      await page.evaluate(()=>window.SanPaidSelectorMode.open(1));await page.waitForTimeout(70);
      await assertNoHorizontalOverflow(page,'#selectorModeShell',`${width}px Platform Tour`);
      assert(await page.locator('#selectorClose').isVisible(),`Platform Tour close control is missing at ${width}px`);
      await page.locator('#selectorClose').click();await page.waitForTimeout(60);
    }
  }

  // Authenticated Customer/Worker workspace release audit with deterministic API fixtures.
  const customerPage=await openMockRoleWorkspace(context,'CUSTOMER');
  await customerPage.setViewportSize({width:390,height:844});await customerPage.waitForTimeout(120);
  const customerDashboard=customerPage.locator('.cw-dashboard.customer');
  await customerDashboard.waitFor({state:'visible'});
  const customerText=(await customerDashboard.innerText()).toLowerCase();
  for(const phrase of ['book service','payment & invoice','verify worker','support'])assert(customerText.includes(phrase),`Customer workspace missing: ${phrase}`);
  assertProfessionalCopy(customerText,'Customer workspace');
  await assertNoHorizontalOverflow(customerPage,'#connectedShell','390px Customer workspace');
  await customerPage.close();

  const workerPage=await openMockRoleWorkspace(context,'WORKER');
  await workerPage.setViewportSize({width:390,height:844});await workerPage.waitForTimeout(120);
  const workerDashboard=workerPage.locator('.cw-dashboard.worker');
  await workerDashboard.waitFor({state:'visible'});
  const workerText=(await workerDashboard.innerText()).toLowerCase();
  for(const phrase of ['job requests','availability','trust passport','earnings'])assert(workerText.includes(phrase),`Worker workspace missing: ${phrase}`);
  await workerPage.locator('[data-cw-view-btn="schedule"]').first().click();await workerPage.waitForTimeout(100);
  const scheduleText=(await workerPage.locator('[data-cw-view="schedule"]').innerText()).toLowerCase();
  for(const phrase of ['quick schedule update','review update','working slots'])assert(scheduleText.includes(phrase),`Worker schedule UX missing: ${phrase}`);
  assertProfessionalCopy(workerText,'Worker workspace');
  await assertNoHorizontalOverflow(workerPage,'#connectedShell','390px Worker workspace');
  await workerPage.close();

  assert(pageErrors.length===0,`Page errors: ${pageErrors.join(' | ')}`);
  const unexpectedConsole=consoleErrors.filter(text=>!text.includes('/api/')&&!text.includes('404'));
  assert(unexpectedConsole.length===0,`Unexpected console errors: ${unexpectedConsole.join(' | ')}`);
  console.log('SanPaid Chromium UI audit: PASS');
  console.log('Verified landing/Platform Tour release widths plus authenticated Customer and Worker workspaces at 390px, including role navigation, schedule UX, overflow and close-state recovery.');
} finally {if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');}
