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
  throw new Error('Customer mobile audit server did not start.');
}

async function openCustomer(context,{seedView='payment'}={}){
  const page=await context.newPage();
  page.setDefaultTimeout(7000);
  const user={id:101,role:'CUSTOMER',fullName:'Review Customer',name:'Review Customer'};

  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let payload={ok:true};
    if(path==='/api/auth/demo-access')payload={ok:true,accounts:[]};
    else if(path==='/api/auth/me'||path==='/api/connected/auth/me')payload={ok:true,user};
    else if(path==='/api/connected/health')payload={ok:true};
    else if(path==='/api/public/services'||path==='/api/connected/customer/services')payload={ok:true,source:'DATABASE_CONFIGURATION',services:[{name:'Electrician',basePrice:499,icon:'⚡'}]};
    else if(path==='/api/connected/snapshot')payload={role:'CUSTOMER',bookings:[]};
    else if(path==='/api/connected/customer/notifications')payload={ok:true,notifications:[]};
    else if(path==='/api/connected/customer/support')payload={ok:true,requests:[]};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });

  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(view=>sessionStorage.setItem('sanpaid_dashboard_view_customer',view),seedView);
  await page.waitForTimeout(450);
  await page.evaluate(()=>window.SanPaidBootstrap?.loadCustomerWorker?.());
  await page.waitForTimeout(450);
  const opened=await page.evaluate(async user=>{
    window.SanPaidAuth.restoreSession=async()=>user;
    window.SanPaidAuth.getCurrentUser=()=>user;
    const result=await window.ConnectedSanPaid.open('CUSTOMER');
    window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'customer-mobile-contract-audit'}}));
    return result;
  },user);
  assert(opened===true,'Customer workspace did not open.');
  await page.locator('#connectedShell:not(.hidden)').waitFor({state:'visible'});
  await page.locator('#connectedShell.customer-mobile-ready').waitFor({state:'attached'});
  await page.waitForTimeout(180);
  return page;
}

async function diagnostic(page,selector){
  const node=page.locator(selector).first();
  if(!(await node.count()))return {missing:true};
  return node.evaluate(element=>{
    const chain=[];
    for(let current=element;current&&chain.length<8;current=current.parentElement){
      const style=getComputedStyle(current);
      chain.push({tag:current.tagName,id:current.id,className:String(current.className||''),hidden:current.hidden,display:style.display,visibility:style.visibility,opacity:style.opacity,background:style.backgroundColor,color:style.color});
    }
    return {innerWidth:window.innerWidth,devicePixelRatio:window.devicePixelRatio,screen:{width:screen.width,height:screen.height},media768:matchMedia('(max-width: 768px)').matches,chain};
  });
}

async function assertHomeIsolation(page,label){
  const shell=page.locator('#connectedShell');
  assert(await shell.evaluate(node=>node.classList.contains('customer-mobile-home-active')),`${label}: mobile Home state is not active`);
  const base=page.locator('#connectedContent');
  assert(!(await base.isVisible()),`${label}: legacy/full customer content is visible behind mobile Home`);
  const saved=await page.evaluate(()=>sessionStorage.getItem('sanpaid_dashboard_view_customer'));
  assert(saved==='overview',`${label}: stale customer sub-view was not reset to overview (got ${saved})`);
}

async function assertLightSurface(page,label){
  const state=await page.evaluate(()=>({
    htmlScheme:getComputedStyle(document.documentElement).colorScheme,
    shellBg:getComputedStyle(document.getElementById('connectedShell')).backgroundColor,
    bodyBg:getComputedStyle(document.body).backgroundColor,
    bootCount:document.querySelectorAll('.cm-mobile-boot-stage').length
  }));
  assert(!/dark/i.test(state.htmlScheme),`${label}: browser is still allowed to use dark color scheme (${state.htmlScheme})`);
  assert(state.shellBg==='rgb(246, 250, 252)',`${label}: customer shell is not light (${state.shellBg})`);
  assert(state.bootCount===0,`${label}: startup safety shell was not removed after mobile app became ready`);
}

async function assertMobileContract(page,label,{expectForced=false}={}){
  const shell=page.locator('#connectedShell');
  assert(await shell.getAttribute('data-customer-mobile-mode')==='true',`${label}: mobile mode was not activated`);
  for(const selector of ['.cm-mobile-header','.cm-mobile-greeting','.cm-book-cta','.cm-quick-grid','.cm-booking-card','.cm-support-card','.cm-bottom-nav']){
    const node=page.locator(selector).first();
    assert(await node.count()===1,`${label}: ${selector} is missing`);
    if(!(await node.isVisible())){
      console.error(`${label} diagnostic for ${selector}:`,JSON.stringify(await diagnostic(page,selector),null,2));
      throw new Error(`${label}: ${selector} is not visible`);
    }
  }
  assert(!(await page.locator('#connectedShell .connected-top').isVisible()),`${label}: old connected header is still visible`);
  assert(!(await page.locator('.cw-dashboard.customer .cw-nav').isVisible()),`${label}: old customer sidebar is still visible`);
  assert((await page.locator('.cm-quick-grid button').count())===3,`${label}: quick-action cards are incomplete`);
  assert((await page.locator('.cm-bottom-nav button').count())===4,`${label}: bottom navigation must have four actions`);
  const ctaText=(await page.locator('.cm-book-cta').innerText()).toLowerCase();
  assert(ctaText.includes('book a service'),`${label}: green Book a Service CTA is missing`);
  const noOverflow=await shell.evaluate(node=>node.scrollWidth<=node.clientWidth+2);
  assert(noOverflow,`${label}: customer shell has horizontal overflow`);
  await assertHomeIsolation(page,label);
  await assertLightSurface(page,label);
  if(expectForced){
    assert(await page.locator('#sanpaidCustomerForcedMobileCss').count()===1,`${label}: forced touch-device mobile CSS was not installed`);
  }

  await page.locator('.cm-bottom-nav [data-cm-view="book"]').click();
  await page.waitForTimeout(100);
  assert(await page.locator('#connectedContent').isVisible(),`${label}: Book Service did not reveal its connected view`);
  assert(await page.locator('.cm-mobile-header').isVisible(),`${label}: mobile header disappeared in Book Service`);
  assert(await page.locator('.cm-bottom-nav').isVisible(),`${label}: mobile bottom nav disappeared in Book Service`);

  await page.locator('.cm-bottom-nav [data-cm-view="overview"]').click();
  await page.waitForTimeout(100);
  await assertHomeIsolation(page,`${label} after returning Home`);
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});

  const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const phonePage=await openCustomer(phoneContext,{seedView:'payment'});
  await assertMobileContract(phonePage,'390px phone with stale Payment state');
  await phoneContext.close();

  const darkPhoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,colorScheme:'dark'});
  const darkPhonePage=await openCustomer(darkPhoneContext,{seedView:'verify'});
  await assertMobileContract(darkPhonePage,'390px dark-browser phone with stale Verify state');
  await darkPhoneContext.close();

  const wideTouchContext=await browser.newContext({viewport:{width:1280,height:900},isMobile:true,hasTouch:true,deviceScaleFactor:3,colorScheme:'dark'});
  const wideTouchPage=await openCustomer(wideTouchContext,{seedView:'payment'});
  const innerWidth=await wideTouchPage.evaluate(()=>window.innerWidth);
  assert(innerWidth>1100&&innerWidth<=1400,`Wide-touch fixture has unexpected innerWidth ${innerWidth}`);
  await assertMobileContract(wideTouchPage,'1280px dark touch handset',{expectForced:true});
  await wideTouchContext.close();

  console.log('SanPaid Customer mobile UI audit: PASS');
  console.log('Verified stale Payment/Verify recovery, dark-browser light surface, 390px phone and 1280px touch mode.');
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
