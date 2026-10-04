import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4187;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');
function assert(condition,message){if(!condition)throw new Error(message);}
async function waitServer(){for(let i=0;i<30;i+=1){try{const response=await fetch(`http://127.0.0.1:${port}/`);if(response.ok)return;}catch{}await sleep(200);}throw new Error('Local SanPaid build server did not start.');}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.setDefaultTimeout(6000);
  const user={id:9101,role:'CUSTOMER',fullName:'Fresh Review Customer',name:'Fresh Review Customer',email:'fresh.review@sanpaid.test'};

  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let payload={ok:true};
    if(path==='/api/auth/demo-access')payload={ok:true,accounts:[]};
    else if(path==='/api/auth/me'||path==='/api/connected/auth/me')payload={ok:true,user};
    else if(path==='/api/connected/health')payload={ok:true};
    else if(path==='/api/public/services'||path==='/api/connected/customer/services')payload={ok:true,services:[{name:'Electrician',basePrice:499,icon:'⚡'}]};
    else if(path==='/api/connected/snapshot')payload={ok:true,role:'CUSTOMER',bookings:[]};
    else if(path==='/api/connected/customer/notifications')payload={ok:true,notifications:[]};
    else if(path==='/api/connected/customer/support')payload={ok:true,requests:[]};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });

  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(500);
  await page.evaluate(()=>window.SanPaidBootstrap?.loadCustomerWorker?.());
  await page.waitForTimeout(500);
  const opened=await page.evaluate(async user=>{
    window.SanPaidAuth.restoreSession=async()=>user;
    window.SanPaidAuth.getCurrentUser=()=>user;
    const result=await window.ConnectedSanPaid.open('CUSTOMER');
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'fresh-state-audit'}}));
    return result;
  },user);
  assert(opened===true,'Fresh Customer workspace did not open.');
  await page.locator('#connectedShell:not(.hidden)').waitFor({state:'visible'});
  await page.locator('.cw-dashboard.customer').waitFor({state:'visible'});
  await page.waitForTimeout(1500);

  const debugState=await page.evaluate(()=>{
    const dashboard=document.querySelector('.cw-dashboard.customer');
    const overview=dashboard?.querySelector('[data-cw-view="overview"]');
    const read=window.SanPaidCustomerReference?.readDashboard?.(dashboard)||null;
    return {
      read:read?{status:read.status,bookingCode:read.bookingCode,activeBooking:read.activeBooking,nextTitle:read.nextTitle}:null,
      currentStatus:overview?.querySelector('.cw-next>div:first-child h3')?.textContent?.trim()||'',
      activeMetric:overview?.querySelector('.cw-metrics>article:first-child strong')?.textContent?.trim()||'',
      cardCount:document.querySelectorAll('.cr-current-card').length
    };
  });
  console.log('FRESH_CUSTOMER_DEBUG',JSON.stringify(debugState));

  assert(await page.locator('.cr-current-card').count()===0,'Fresh desktop Customer shows a Current Booking card.');
  assert(await page.locator('.cr-worker-card').count()===0,'Fresh desktop Customer shows an Assigned Worker card.');
  assert(await page.locator('.cr-amount-card').count()===0,'Fresh desktop Customer shows a Current Amount card.');
  assert(await page.locator('.cr-bell i').count()===0,'Fresh desktop Customer shows a false notification badge.');
  const actionCopy=(await page.locator('.cr-shortcuts-card .cr-section-top span').textContent()||'').trim();
  assert(!/this booking/i.test(actionCopy),'Fresh desktop action copy falsely implies an existing booking.');

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(700);
  assert(await page.locator('.cm-mobile-home').count()===1,'Fresh Customer mobile home did not render.');
  assert(await page.locator('.cm-booking-card').count()===0,'Fresh mobile Customer shows a booking card.');
  assert(await page.locator('.cm-mobile-metrics').count()===0,'Fresh mobile Customer shows booking-specific metrics.');
  assert(await page.locator('.cm-bell i').count()===0,'Fresh mobile Customer shows a false notification badge.');

  // Exercise the existing notification badge renderer without coupling this UI-truth
  // regression to the intentionally offline fallback transport used by this fixture.
  await page.evaluate(()=>{
    const dash=document.querySelector('.cw-dashboard.customer');
    if(!dash)return;
    let support=dash.querySelector('[data-cw-view="support"]');
    if(!support){
      support=document.createElement('section');
      support.className='cw-view';
      support.dataset.cwView='support';
      support.hidden=true;
      dash.querySelector('.cw-main')?.appendChild(support);
    }
    support.querySelector('.cw-notification-list')?.remove();
    const list=document.createElement('div');
    list.className='cw-notification-list';
    list.innerHTML='<article>Update one</article><article>Update two</article>';
    support.appendChild(list);
  });
  await page.waitForTimeout(400);
  assert((await page.locator('.cm-bell i').textContent()||'').trim()==='2','Mobile notification badge is not derived from rendered notification rows.');

  await page.setViewportSize({width:1440,height:1000});
  await page.waitForTimeout(500);
  assert((await page.locator('.cr-bell i').textContent()||'').trim()==='2','Desktop notification badge is not derived from rendered notification rows.');

  await page.evaluate(()=>sessionStorage.setItem('sanpaid_connected_booking_id','999999'));
  assert(await page.evaluate(()=>sessionStorage.getItem('sanpaid_connected_booking_id'))==='999999','Audit setup could not seed the stale booking pointer.');
  await page.evaluate(()=>document.getElementById('connectedLogout')?.click());
  await page.waitForTimeout(100);
  assert(await page.evaluate(()=>sessionStorage.getItem('sanpaid_connected_booking_id'))===null,'Logout did not clear the Customer booking pointer.');

  console.log('SanPaid fresh Customer truth/state audit: PASS');
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
