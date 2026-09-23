import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4177;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');

function assert(condition,message){if(!condition)throw new Error(message);}
async function waitServer(){
  for(let attempt=0;attempt<30;attempt+=1){
    try{const response=await fetch(`http://127.0.0.1:${port}/`);if(response.ok)return;}catch{}
    await sleep(200);
  }
  throw new Error('Admin final UI audit server did not start.');
}
async function waitFor(fn,{attempts=60,delay=100,message='Condition did not become true'}={}){
  for(let i=0;i<attempts;i+=1){if(await fn())return;await sleep(delay);}
  throw new Error(message);
}

async function preparePage(context){
  const page=await context.newPage();
  page.setDefaultTimeout(9000);
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error?.stack||error?.message||String(error)));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(500);
  assert(await page.evaluate(()=>window.SanPaidReviewRuntime?.enabled===true),'SIH review runtime is not active.');
  return {page,pageErrors};
}

async function openAdmin(page,{identifier,role}){
  const result=await page.evaluate(async({identifier,role})=>{
    await window.SanPaidAuth.logout({silent:true,keepModal:true}).catch(()=>{});
    await window.SanPaidAuth.login({identifier,password:'admin-final-audit',role,remember:false});
    return window.SanPaidAuth.openRoleWorkspace(role,null);
  },{identifier,role});
  assert(result===true,`${role}: role workspace did not open`);
  await page.locator('#sihJudgeShell:not(.judge-hidden)').waitFor({state:'visible'});
  await page.locator('#adminFinalApp').waitFor({state:'visible'});
  await waitFor(async()=>await page.locator('.af-hero').count()===1,{message:`${role}: final admin hero did not mount`});
  await page.waitForTimeout(500);
}

async function assertNoOverflow(page,selector,label){
  const ok=await page.locator(selector).evaluate(node=>node.scrollWidth<=node.clientWidth+2);
  assert(ok,`${label}: horizontal overflow detected in ${selector}`);
}

async function assertLegacyHidden(page,label){
  const selectors=['#sihJudgeShell>.judge-top','#judgeContent>.judge-hero','#judgeContent>#adminCommandSummary','#judgeContent>#coopSidebar','#judgeContent>#fedSidebar','#judgeContent>.judge-tabs'];
  for(const selector of selectors){
    const node=page.locator(selector);
    if(await node.count())assert(!(await node.isVisible()),`${label}: legacy UI leaked: ${selector}`);
  }
  const visibleDirectSections=await page.locator('#judgeContent>.judge-section:visible').count();
  assert(visibleDirectSections===0,`${label}: ${visibleDirectSections} legacy judge sections leaked below final shell`);
}

async function assertSharedShell(page,label,expectedTitle){
  const required=['.af-topbar','.af-sidebar','.af-hero','.af-attention-grid','.af-network','.af-bottom-grid'];
  for(const selector of required){
    const node=page.locator(selector).first();
    assert(await node.count()===1,`${label}: ${selector} missing`);
    assert(await node.isVisible(),`${label}: ${selector} not visible`);
  }
  assert((await page.locator('.af-hero h1').innerText()).trim()===expectedTitle,`${label}: wrong hero title`);
  assert((await page.locator('.af-stat-card').count())===4,`${label}: expected four attention cards`);
  assert((await page.locator('.af-mini-card').count())===6,`${label}: expected six overview metrics`);
  assert((await page.locator('.af-list-card').count())===2,`${label}: alerts/tasks layout incomplete`);
  assert((await page.locator('.af-nav [data-af-key]').count())>=8,`${label}: sidebar navigation incomplete`);
  await assertLegacyHidden(page,label);
  await assertNoOverflow(page,'#adminFinalApp',label);

  await page.locator('#afProfileButton').click();
  assert(await page.locator('#afProfileMenu').isVisible(),`${label}: profile menu did not open`);
  const menuText=(await page.locator('#afProfileMenu').innerText()).toLowerCase();
  assert(menuText.includes('switch role')&&menuText.includes('logout'),`${label}: profile controls incomplete`);
  await page.locator('#afProfileButton').click();
}

async function assertCooperative(page){
  const label='Cooperative Admin';
  await assertSharedShell(page,label,'Cooperative Operations Dashboard');
  assert((await page.locator('.af-network h2').innerText()).toLowerCase().includes('cooperative'),`${label}: cooperative entity heading missing`);

  await page.locator('.af-nav [data-af-key="workers"]').click();
  await page.locator('#afDetailStage').waitFor({state:'visible'});
  await waitFor(async()=>await page.locator('#afDetailBody #coop-workers').count()===1,{message:`${label}: workers module did not move into final detail stage`});
  assert(await page.locator('#afDetailBody #coop-workers').isVisible(),`${label}: workers detail is not visible`);
  assert((await page.locator('#afDetailTitle').innerText()).trim()==='Workers',`${label}: workers detail heading mismatch`);

  await page.locator('.af-back').click();
  assert(await page.locator('#afDashboard').isVisible(),`${label}: overview did not return`);
  assert(!(await page.locator('#afDetailStage').isVisible()),`${label}: detail stage remained visible after Back`);
}

async function assertFederation(page){
  const label='Federation Admin';
  await assertSharedShell(page,label,'Federation Operations Dashboard');
  assert((await page.locator('.af-network h2').innerText()).toLowerCase().includes('federation'),`${label}: federation entity heading missing`);

  await page.locator('.af-nav [data-af-key="network"]').click();
  await page.locator('#afDetailStage').waitFor({state:'visible'});
  await waitFor(async()=>await page.locator('#afDetailBody #fed-network').count()===1,{message:`${label}: network module did not move into final detail stage`});
  assert(await page.locator('#afDetailBody #fed-network').isVisible(),`${label}: network detail is not visible`);
  await page.locator('.af-back').click();

  await page.locator('.af-nav [data-af-key="assignments"]').click();
  await page.locator('#afDetailStage').waitFor({state:'visible'});
  await waitFor(async()=>await page.locator('#afDetailBody .judge-section').count()===1,{message:`${label}: capacity module did not move into final detail stage`});
  assert(!(await page.locator('#afDetailBody [data-af-fallback="assignments"]').isVisible().catch(()=>false)),`${label}: assignments fell back instead of loading capacity module`);
  await page.locator('.af-back').click();
}

async function assertMobile(page,label){
  await page.locator('#adminFinalApp').waitFor({state:'visible'});
  assert(await page.locator('#afMobileMenu').isVisible(),`${label}: mobile menu button is missing`);
  assert(!(await page.locator('.af-sidebar').isVisible()),`${label}: sidebar should start closed on phone`);
  await page.locator('#afMobileMenu').click();
  assert(await page.locator('.af-sidebar').isVisible(),`${label}: mobile sidebar did not open`);
  await assertNoOverflow(page,'#adminFinalApp',label);
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});

  const desktop=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const coop=await preparePage(desktop);
  await openAdmin(coop.page,{identifier:'cooperative-admin',role:'COOPERATIVE_ADMIN'});
  await assertCooperative(coop.page);
  assert(coop.pageErrors.length===0,`Cooperative Admin page errors: ${coop.pageErrors.join(' | ')}`);
  await coop.page.close();

  const fed=await preparePage(desktop);
  await openAdmin(fed.page,{identifier:'federation-admin',role:'FEDERATION_ADMIN'});
  await assertFederation(fed.page);
  assert(fed.pageErrors.length===0,`Federation Admin page errors: ${fed.pageErrors.join(' | ')}`);
  await desktop.close();

  const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const phone=await preparePage(phoneContext);
  await openAdmin(phone.page,{identifier:'cooperative-admin',role:'COOPERATIVE_ADMIN'});
  await assertMobile(phone.page,'390px Cooperative Admin');
  assert(phone.pageErrors.length===0,`Mobile Admin page errors: ${phone.pageErrors.join(' | ')}`);
  await phoneContext.close();

  console.log('SanPaid final Admin UI audit: PASS');
  console.log('Verified final-only Cooperative/Federation admin shells, real module navigation, profile controls, legacy UI isolation and mobile navigation.');
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
