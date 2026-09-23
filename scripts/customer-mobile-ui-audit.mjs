import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
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
  throw new Error('Customer UI audit server did not start.');
}

async function openCustomer(context){
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  const user={id:101,role:'CUSTOMER',fullName:'Shreya Patil',name:'Shreya Patil',email:'shreya.customer@sanpaid.demo'};

  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let payload={ok:true};
    if(path==='/api/auth/demo-access')payload={ok:true,accounts:[]};
    else if(path==='/api/auth/me'||path==='/api/connected/auth/me')payload={ok:true,user};
    else if(path==='/api/connected/health')payload={ok:true};
    else if(path==='/api/public/services'||path==='/api/connected/customer/services')payload={ok:true,source:'DATABASE_CONFIGURATION',services:[{name:'Electrician',basePrice:499,icon:'⚡'},{name:'Plumbing',basePrice:399,icon:'🔧'}]};
    else if(path==='/api/connected/snapshot')payload={role:'CUSTOMER',bookings:[]};
    else if(path==='/api/connected/customer/notifications')payload={ok:true,notifications:[]};
    else if(path==='/api/connected/customer/support')payload={ok:true,requests:[]};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });

  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(350);
  await page.evaluate(()=>window.SanPaidBootstrap?.loadCustomerWorker?.());
  await page.waitForTimeout(350);

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
  await page.waitForTimeout(260);
  return page;
}

async function assertNoOverflow(page,selector,label){
  const ok=await page.locator(selector).evaluate(node=>node.scrollWidth<=node.clientWidth+2);
  assert(ok,`${label}: horizontal overflow detected in ${selector}`);
}

async function assertMobile(page,label){
  const shell=page.locator('#connectedShell');
  await shell.waitFor({state:'visible'});
  await page.locator('#connectedShell.customer-mobile-ready').waitFor({state:'attached'});
  assert(await shell.getAttribute('data-customer-mobile-mode')==='true',`${label}: mobile mode not active`);
  assert(await page.locator('#connectedContent').isVisible(),`${label}: connected content is hidden/blank`);

  const required=['.cm-mobile-header','.cm-mobile-home','.cm-mobile-greeting','.cm-book-cta','.cm-quick-grid','.cm-booking-card','.cm-next-card','.cm-mobile-metrics','.cm-support-card','.cm-bottom-nav'];
  for(const selector of required){
    const node=page.locator(selector).first();
    assert(await node.count()===1,`${label}: ${selector} missing`);
    assert(await node.isVisible(),`${label}: ${selector} not visible`);
  }
  assert(!(await page.locator('#connectedShell .connected-top').isVisible()),`${label}: desktop product header leaked into mobile`);
  assert(!(await page.locator('.cw-dashboard.customer .cw-nav').isVisible()),`${label}: desktop sidebar leaked into mobile`);
  assert(!(await page.locator('[data-cw-view="overview"]>.cw-role-head').isVisible()),`${label}: legacy overview is visible behind mobile home`);
  assert((await page.locator('.cm-quick-grid>button').count())===3,`${label}: quick actions must contain three cards`);
  assert((await page.locator('.cm-bottom-nav>button').count())===4,`${label}: bottom navigation must contain four actions`);
  assert((await page.locator('.cm-book-cta').innerText()).toLowerCase().includes('book a service'),`${label}: Book a Service CTA missing`);
  await assertNoOverflow(page,'#connectedShell',label);

  await page.locator('.cm-bottom-nav [data-cm-view="book"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('[data-cw-view="book"]').isVisible(),`${label}: Book Service real view did not open`);
  assert(await page.locator('.cm-mobile-header').isVisible(),`${label}: mobile header disappeared on Book Service`);
  assert(await page.locator('.cm-bottom-nav').isVisible(),`${label}: bottom nav disappeared on Book Service`);

  await page.locator('.cm-bottom-nav [data-cm-view="overview"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('.cm-mobile-home').isVisible(),`${label}: mobile Home did not return`);

  await page.locator('.cm-bottom-nav [data-cm-profile]').click();
  await page.waitForTimeout(70);
  assert(await page.locator('.cm-profile-layer').isVisible(),`${label}: Profile sheet did not open`);
  const profileText=(await page.locator('.cm-profile-sheet').innerText()).toLowerCase();
  assert(profileText.includes('shreya patil')&&profileText.includes('switch role')&&profileText.includes('logout'),`${label}: Profile sheet actions incomplete`);
  await page.locator('.cm-profile-sheet [data-cm-profile-close]').click();
  await page.waitForTimeout(50);
  assert(!(await page.locator('.cm-profile-layer').isVisible()),`${label}: Profile sheet did not close`);
}

async function assertDesktop(page,label){
  const shell=page.locator('#connectedShell');
  assert(await shell.evaluate(node=>node.classList.contains('customer-reference-page')),`${label}: customer reference scope missing`);
  assert(!(await shell.evaluate(node=>node.classList.contains('customer-mobile-bootstrap'))),`${label}: mobile mode incorrectly active on desktop`);

  const required=['.cr-header-tools','.cr-nav-motto','.cr-desktop-home','.cr-hero','.cr-current-card','.cr-shortcuts-card','.cr-home-side','.cr-worker-card','.cr-amount-card','.cr-help-card','.cr-safety-card'];
  for(const selector of required){
    const node=page.locator(selector).first();
    assert(await node.count()===1,`${label}: ${selector} missing`);
    assert(await node.isVisible(),`${label}: ${selector} not visible`);
  }
  assert(await page.locator('#connectedShell .connected-top').isVisible(),`${label}: desktop header is missing`);
  assert(await page.locator('.cw-dashboard.customer .cw-nav').isVisible(),`${label}: customer sidebar is missing`);
  assert(!(await page.locator('[data-cw-view="overview"]>.cw-role-head').isVisible()),`${label}: legacy overview visible behind enhanced home`);
  assert((await page.locator('.cr-hero').innerText()).includes('Shreya Patil'),`${label}: dynamic customer name not shown`);
  assert((await page.locator('.cr-shortcuts>button').count())===4,`${label}: service shortcuts incomplete`);
  await assertNoOverflow(page,'#connectedShell',label);

  await page.locator('.cw-nav [data-cw-view-btn="book"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('[data-cw-view="book"]').isVisible(),`${label}: desktop Book Service view did not open`);
  await page.locator('.cw-nav [data-cw-view-btn="overview"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('.cr-desktop-home').isVisible(),`${label}: enhanced desktop Home did not return`);
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});

  const desktopContext=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const desktopPage=await openCustomer(desktopContext);
  await assertDesktop(desktopPage,'1440px desktop');
  await desktopContext.close();

  const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const phonePage=await openCustomer(phoneContext);
  await assertMobile(phonePage,'390px phone');
  await phoneContext.close();

  const wideTouchContext=await browser.newContext({viewport:{width:1280,height:900},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const wideTouchPage=await openCustomer(wideTouchContext);
  assert((await wideTouchPage.evaluate(()=>window.innerWidth))>1100,'Wide-touch fixture did not simulate a desktop-site viewport');
  await assertMobile(wideTouchPage,'1280px touch handset');
  await wideTouchContext.close();

  console.log('SanPaid Customer desktop + mobile UI audit: PASS');
  console.log('Verified Worker-style Customer desktop, 390px phone, and wide touch handset without hiding connected content.');
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}