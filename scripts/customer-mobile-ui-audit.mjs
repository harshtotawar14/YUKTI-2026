import {spawn} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4174;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');

function assert(condition,message){if(!condition)throw new Error(message);}
async function waitServer(){
  for(let attempt=0;attempt<30;attempt++){
    try{const response=await fetch(`http://127.0.0.1:${port}/`);if(response.ok)return;}catch{}
    await sleep(200);
  }
  throw new Error('Role UI audit server did not start.');
}

const deployedRoleCss=readFileSync(resolve(root,'dist','customer-worker-dashboard.css'),'utf8');
const legacyRoleMedia=/@media[^\{]*max-width\s*:\s*(?:900|768|720|520|480|340)px/i;
assert(!legacyRoleMedia.test(deployedRoleCss),'Legacy Customer/Worker mobile media fallback is still shipped in the deploy artifact.');
assert(existsSync(resolve(root,'dist','worker-mobile-final.css')),'Final Worker mobile stylesheet missing from deploy artifact.');
assert(existsSync(resolve(root,'dist','worker-mobile-final.js')),'Final Worker mobile runtime missing from deploy artifact.');

async function installApiFallback(page,user,role){
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let payload={ok:true};
    if(path==='/api/auth/demo-access')payload={ok:true,accounts:[]};
    else if(path==='/api/auth/me'||path==='/api/connected/auth/me')payload={ok:true,user};
    else if(path==='/api/connected/health')payload={ok:true};
    else if(path==='/api/public/services'||path==='/api/connected/customer/services')payload={ok:true,source:'DATABASE_CONFIGURATION',services:[{name:'Electrician',basePrice:499,icon:'⚡'},{name:'Plumbing',basePrice:399,icon:'🔧'}]};
    else if(path==='/api/connected/snapshot')payload={role,bookings:[],offers:[]};
    else if(path==='/api/connected/customer/notifications'||path==='/api/connected/worker/notifications')payload={ok:true,notifications:[]};
    else if(path==='/api/connected/customer/support')payload={ok:true,requests:[]};
    else if(path==='/api/connected/worker/offers')payload=[];
    else if(path==='/api/connected/worker/dashboard')payload={ok:true,profile:{name:user.fullName,available:true,availabilityStatus:'AVAILABLE',rating:4.9},jobs:{active:0},earnings:{today:0,week:0,total:0,payments:[]}};
    else if(path==='/api/connected/workforce/passport')payload={ok:true,passport:null};
    else if(path==='/api/connected/worker/schedule')payload={ok:true,date:new Date().toISOString().slice(0,10),slots:[]};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
}

async function preparePage(context,user,role){
  const page=await context.newPage();
  page.setDefaultTimeout(9000);
  await installApiFallback(page,user,role);
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(350);
  await page.evaluate(()=>window.SanPaidBootstrap?.loadCustomerWorker?.());
  await page.waitForTimeout(350);
  return page;
}

async function openCustomer(context){
  const user={id:101,role:'CUSTOMER',fullName:'Shreya Patil',name:'Shreya Patil',email:'shreya.customer@sanpaid.demo'};
  const page=await preparePage(context,user,'CUSTOMER');
  const opened=await page.evaluate(async user=>{
    if(window.SanPaidReviewRuntime?.enabled){
      await window.SanPaidAuth.logout({silent:true,keepModal:true}).catch(()=>{});
      await window.SanPaidAuth.login({identifier:'customer',password:'customer-ui-audit',role:'CUSTOMER',remember:false});
      return window.SanPaidAuth.openRoleWorkspace('CUSTOMER','CUSTOMER');
    }
    window.SanPaidAuth.restoreSession=async()=>user;
    window.SanPaidAuth.getCurrentUser=()=>user;
    return window.ConnectedSanPaid.open('CUSTOMER');
  },user);
  assert(opened===true,'Customer workspace did not open.');
  await page.locator('#connectedShell:not(.hidden)').waitFor({state:'visible'});
  await page.locator('.cw-dashboard.customer').waitFor({state:'attached'});
  await page.waitForTimeout(300);
  return page;
}

async function openWorker(context){
  const user={id:11,role:'WORKER',persona:'WORKER_A',fullName:'Asha Verma',name:'Asha Verma',email:'worker1.connected@sanpaid.demo'};
  const page=await preparePage(context,user,'WORKER');
  const opened=await page.evaluate(async user=>{
    if(window.SanPaidReviewRuntime?.enabled){
      await window.SanPaidAuth.logout({silent:true,keepModal:true}).catch(()=>{});
      await window.SanPaidAuth.login({identifier:'worker-a',password:'worker-ui-audit',role:'WORKER',remember:false});
      return window.SanPaidAuth.openRoleWorkspace('WORKER','WORKER_A');
    }
    window.SanPaidAuth.restoreSession=async()=>user;
    window.SanPaidAuth.getCurrentUser=()=>user;
    return window.ConnectedSanPaid.open('WORKER_A');
  },user);
  assert(opened===true,'Worker workspace did not open.');
  await page.locator('#connectedShell:not(.hidden)').waitFor({state:'visible'});
  await page.locator('.cw-dashboard.worker').waitFor({state:'attached'});
  await page.waitForTimeout(300);
  return page;
}

async function assertNoOverflow(page,selector,label){
  const ok=await page.locator(selector).evaluate(node=>node.scrollWidth<=node.clientWidth+2);
  assert(ok,`${label}: horizontal overflow detected in ${selector}`);
}

async function assertCustomerMobile(page,label){
  const shell=page.locator('#connectedShell');
  await shell.waitFor({state:'visible'});
  await page.locator('#connectedShell.customer-mobile-ready').waitFor({state:'attached'});
  assert(await shell.getAttribute('data-customer-mobile-mode')==='true',`${label}: Customer mobile mode not active`);
  assert(await shell.evaluate(node=>node.classList.contains('role-mobile-final')),`${label}: final-only mobile marker missing`);
  assert(await page.locator('#connectedContent').isVisible(),`${label}: connected content is hidden/blank`);

  const required=['.cm-mobile-header','.cm-mobile-home','.cm-mobile-greeting','.cm-book-cta','.cm-quick-grid','.cm-booking-card','.cm-next-card','.cm-mobile-metrics','.cm-support-card','.cm-bottom-nav'];
  for(const selector of required){const node=page.locator(selector).first();assert(await node.count()===1,`${label}: ${selector} missing`);assert(await node.isVisible(),`${label}: ${selector} not visible`);}
  assert(!(await page.locator('#connectedShell .connected-top').isVisible()),`${label}: desktop header leaked into Customer mobile`);
  assert(!(await page.locator('.cw-dashboard.customer .cw-nav').isVisible()),`${label}: old Customer navigation leaked into mobile`);
  assert(!(await page.locator('[data-cw-view="overview"]>.cw-role-head').isVisible()),`${label}: legacy Customer overview visible behind final mobile home`);
  assert((await page.locator('.cm-quick-grid>button').count())===3,`${label}: Customer quick actions must contain three cards`);
  assert((await page.locator('.cm-bottom-nav>button').count())===4,`${label}: Customer bottom navigation must contain four actions`);
  assert((await page.locator('.cm-book-cta').innerText()).toLowerCase().includes('book a service'),`${label}: Book a Service CTA missing`);
  await assertNoOverflow(page,'#connectedShell',label);

  await page.locator('.cm-bottom-nav [data-cm-view="book"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('[data-cw-view="book"]').isVisible(),`${label}: Book Service real view did not open`);
  assert(await page.locator('.cm-mobile-header').isVisible(),`${label}: Customer mobile header disappeared on Book Service`);
  assert(await page.locator('.cm-bottom-nav').isVisible(),`${label}: Customer bottom nav disappeared on Book Service`);
  await page.locator('.cm-bottom-nav [data-cm-view="overview"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('.cm-mobile-home').isVisible(),`${label}: Customer mobile Home did not return`);

  await page.locator('.cm-bottom-nav [data-cm-profile]').click();
  await page.waitForTimeout(70);
  assert(await page.locator('.cm-profile-layer').isVisible(),`${label}: Customer Profile sheet did not open`);
  const profileText=(await page.locator('.cm-profile-sheet').innerText()).toLowerCase();
  assert(profileText.includes('shreya patil')&&profileText.includes('switch role')&&profileText.includes('logout'),`${label}: Customer Profile sheet actions incomplete`);
  await page.locator('.cm-profile-sheet [data-cm-profile-close]').click();
}

async function assertWorkerMobile(page,label){
  const shell=page.locator('#connectedShell');
  await shell.waitFor({state:'visible'});
  await page.locator('#connectedShell.worker-mobile-ready').waitFor({state:'attached'});
  assert(await shell.getAttribute('data-worker-mobile-mode')==='true',`${label}: Worker mobile mode not active`);
  assert(await shell.evaluate(node=>node.classList.contains('role-mobile-final')),`${label}: final-only Worker mobile marker missing`);
  assert(await page.locator('#connectedContent').isVisible(),`${label}: Worker connected content is hidden/blank`);

  const required=['.wm-mobile-header','.wm-mobile-home','.wm-greeting','.wm-primary-cta','.wm-quick-grid','.wm-work-card','.wm-next-card','.wm-metrics','.wm-trust-card','.wm-bottom-nav'];
  for(const selector of required){const node=page.locator(selector).first();assert(await node.count()===1,`${label}: ${selector} missing`);assert(await node.isVisible(),`${label}: ${selector} not visible`);}
  assert(!(await page.locator('#connectedShell .connected-top').isVisible()),`${label}: desktop header leaked into Worker mobile`);
  assert(!(await page.locator('.cw-dashboard.worker .cw-nav').isVisible()),`${label}: old Worker horizontal navigation leaked into mobile`);
  assert(!(await page.locator('.cw-dashboard.worker [data-cw-view="overview"]>.cw-role-head').isVisible()),`${label}: legacy Worker overview visible behind final home`);
  assert((await page.locator('.wm-quick-grid>button').count())===3,`${label}: Worker quick actions must contain three cards`);
  assert((await page.locator('.wm-bottom-nav>button').count())===4,`${label}: Worker bottom navigation must contain four actions`);
  assert((await page.locator('.wm-primary-cta').innerText()).toLowerCase().includes('view job requests'),`${label}: Worker primary jobs CTA missing`);
  assert((await page.locator('.wm-greeting').innerText()).toLowerCase().includes('asha'),`${label}: Worker identity not shown in final mobile home`);
  await assertNoOverflow(page,'#connectedShell',label);

  await page.locator('.wm-bottom-nav [data-wm-view="offers"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('[data-cw-view="offers"]').isVisible(),`${label}: real Worker Job Requests view did not open`);
  assert(await page.locator('.wm-mobile-header').isVisible(),`${label}: Worker mobile header disappeared on Jobs`);
  assert(await page.locator('.wm-bottom-nav').isVisible(),`${label}: Worker bottom nav disappeared on Jobs`);
  await page.locator('.wm-bottom-nav [data-wm-view="overview"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('.wm-mobile-home').isVisible(),`${label}: Worker final mobile Home did not return`);

  await page.locator('.wm-bottom-nav [data-wm-profile]').click();
  await page.waitForTimeout(70);
  assert(await page.locator('.wm-profile-layer').isVisible(),`${label}: Worker Profile sheet did not open`);
  const profileText=(await page.locator('.wm-profile-sheet').innerText()).toLowerCase();
  assert(profileText.includes('asha verma')&&profileText.includes('trust passport')&&profileText.includes('switch role')&&profileText.includes('logout'),`${label}: Worker Profile sheet actions incomplete`);
  await page.locator('.wm-profile-sheet [data-wm-profile-close]').click();
}

async function assertCustomerDesktop(page,label){
  const shell=page.locator('#connectedShell');
  assert(await shell.evaluate(node=>node.classList.contains('customer-reference-page')),`${label}: customer reference scope missing`);
  assert(!(await shell.evaluate(node=>node.classList.contains('customer-mobile-bootstrap'))),`${label}: Customer mobile mode incorrectly active on desktop`);
  assert(!(await shell.evaluate(node=>node.classList.contains('worker-mobile-final'))),`${label}: Worker mobile mode leaked into Customer desktop`);
  const required=['.cr-header-tools','.cr-nav-motto','.cr-desktop-home','.cr-hero','.cr-current-card','.cr-shortcuts-card','.cr-home-side','.cr-worker-card','.cr-amount-card','.cr-help-card','.cr-safety-card'];
  for(const selector of required){const node=page.locator(selector).first();assert(await node.count()===1,`${label}: ${selector} missing`);assert(await node.isVisible(),`${label}: ${selector} not visible`);}
  assert(await page.locator('#connectedShell .connected-top').isVisible(),`${label}: desktop header is missing`);
  assert(await page.locator('.cw-dashboard.customer .cw-nav').isVisible(),`${label}: customer desktop sidebar is missing`);
  assert(!(await page.locator('[data-cw-view="overview"]>.cw-role-head').isVisible()),`${label}: legacy Customer overview visible behind enhanced desktop home`);
  assert((await page.locator('.cr-hero').innerText()).includes('Shreya Patil'),`${label}: dynamic customer name not shown`);
  assert((await page.locator('.cr-shortcuts>button').count())===4,`${label}: service shortcuts incomplete`);
  await assertNoOverflow(page,'#connectedShell',label);
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const desktopPage=await openCustomer(desktopContext);
  await assertCustomerDesktop(desktopPage,'1440px Customer desktop');
  await desktopContext.close();

  for(const fixture of[
    {label:'390px Customer phone',viewport:{width:390,height:844},dpr:3},
    {label:'1280px Customer touch handset',viewport:{width:1280,height:900},dpr:3}
  ]){
    const context=await browser.newContext({viewport:fixture.viewport,isMobile:true,hasTouch:true,deviceScaleFactor:fixture.dpr});
    const page=await openCustomer(context);
    if(fixture.viewport.width>1100)assert((await page.evaluate(()=>window.innerWidth))>1100,'Customer wide-touch fixture did not simulate a desktop-site viewport');
    await assertCustomerMobile(page,fixture.label);
    await context.close();
  }

  for(const fixture of[
    {label:'390px Worker phone',viewport:{width:390,height:844},dpr:3},
    {label:'1280px Worker touch handset',viewport:{width:1280,height:900},dpr:3}
  ]){
    const context=await browser.newContext({viewport:fixture.viewport,isMobile:true,hasTouch:true,deviceScaleFactor:fixture.dpr});
    const page=await openWorker(context);
    if(fixture.viewport.width>1100)assert((await page.evaluate(()=>window.innerWidth))>1100,'Worker wide-touch fixture did not simulate a desktop-site viewport');
    await assertWorkerMobile(page,fixture.label);
    await context.close();
  }

  console.log('SanPaid final-only Customer + Worker role UI audit: PASS');
  console.log('Verified desktop Customer, 390px and wide-touch Customer, 390px and wide-touch Worker, with legacy role mobile media removed from the deploy artifact.');
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
