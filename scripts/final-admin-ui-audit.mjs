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
async function waitServer(){for(let i=0;i<30;i+=1){try{const response=await fetch(`http://127.0.0.1:${port}/`);if(response.ok)return;}catch{}await sleep(200);}throw new Error('Final admin UI audit server did not start.');}
async function noOverflow(page,selector,label){const ok=await page.locator(selector).evaluate(node=>node.scrollWidth<=node.clientWidth+2);assert(ok,`${label}: horizontal overflow detected`);}

async function loginAdmin(page,identifier,role){
  const opened=await page.evaluate(async({identifier,role})=>{
    await window.SanPaidAuth.logout({silent:true,keepModal:true}).catch(()=>{});
    await window.SanPaidAuth.login({identifier,password:'review-runtime-password',role,remember:false});
    return window.SanPaidAuth.openRoleWorkspace(role,null);
  },{identifier,role});
  assert(opened===true,`${role}: admin workspace did not open`);
  await page.locator('#sihJudgeShell:not(.judge-hidden)').waitFor({state:'visible'});
  await page.locator('#adminFinalApp').waitFor({state:'visible'});
  await page.waitForTimeout(900);
}

async function assertFinalShell(page,{role,title,entity}){
  const app=page.locator('#adminFinalApp');
  assert(await app.isVisible(),`${role}: final admin app missing`);
  assert((await page.locator('.af-hero h1').innerText()).includes(title),`${role}: hero title mismatch`);
  assert((await page.locator('.af-network h2').innerText()).includes(entity),`${role}: overview entity mismatch`);
  assert(await page.locator('.af-attention-grid .af-stat-card').count()===4,`${role}: attention cards must be four`);
  assert(await page.locator('.af-overview-grid .af-mini-card').count()===6,`${role}: overview metrics must be six`);
  assert(await page.locator('.af-bottom-grid .af-list-card').count()===2,`${role}: alerts/tasks panels missing`);
  assert(!(await page.locator('#sihJudgeShell>.judge-top').isVisible()),`${role}: legacy judge top bar leaked`);
  assert(!(await page.locator('#judgeContent>#adminCommandSummary').isVisible()),`${role}: legacy admin summary leaked`);
  assert(!(await page.locator('#judgeContent>.judge-section').first().isVisible()),`${role}: legacy judge section leaked`);
  await noOverflow(page,'#adminFinalApp',role);
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error?.stack||error?.message||String(error)));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(500);

  const buildInfo=await page.evaluate(()=>fetch('/build-info.json',{cache:'no-store'}).then(r=>r.json()));
  assert(buildInfo.adminUi==='REFERENCE_FINAL','Build does not identify final admin UI.');
  assert(buildInfo.uiCleanup==='CONSOLIDATED_V1','Build does not identify consolidated UI cleanup.');

  await loginAdmin(page,'cooperative-admin','COOPERATIVE_ADMIN');
  await assertFinalShell(page,{role:'Cooperative Admin',title:'Cooperative Operations Dashboard',entity:'YUKTI Kolhapur Services Cooperative'});
  assert(await page.locator('.af-nav [data-af-key="workers"]').count()===1,'Cooperative Admin: Workers nav missing');
  await page.locator('.af-nav [data-af-key="workers"]').click();
  await page.locator('#afDetailStage:not([hidden])').waitFor({state:'visible'});
  await page.locator('#afDetailBody #coop-workers').waitFor({state:'visible'});
  assert(!(await page.locator('#afDashboard').isVisible()),'Cooperative Admin: overview remained visible behind detail stage');
  await page.locator('.af-back').click();
  assert(await page.locator('#afDashboard').isVisible(),'Cooperative Admin: overview did not return');

  await page.locator('.af-profile').click();
  assert(await page.locator('.af-profile-menu').isVisible(),'Cooperative Admin: profile menu did not open');
  assert(await page.locator('.af-profile-menu [data-af-profile-action]').count()===2,'Cooperative Admin: profile menu actions incomplete');
  await page.keyboard.press('Escape');
  assert(!(await page.locator('.af-profile-menu').isVisible()),'Cooperative Admin: profile menu did not close with Escape');

  await page.locator('.af-nav [data-af-key="workers"]').click();
  await page.locator('#afDetailBody #coop-workers').waitFor({state:'visible'});
  await page.evaluate(()=>window.SanPaidAuth.logout({silent:true}));
  await page.waitForTimeout(250);
  assert(await page.locator('#adminFinalApp').count()===0,'Cooperative Admin: final app did not clean up after logout');
  assert(await page.locator('#coopPortal #coop-workers').count()===1,'Cooperative Admin: moved module was not restored to its source after close');

  await loginAdmin(page,'federation-admin','FEDERATION_ADMIN');
  await assertFinalShell(page,{role:'Federation Admin',title:'Federation Operations Dashboard',entity:'Kolhapur Regional Federation'});
  assert(await page.locator('.af-nav [data-af-key="network"]').count()===1,'Federation Admin: Connected Cooperatives nav missing');
  await page.locator('.af-nav [data-af-key="network"]').click();
  await page.locator('#afDetailBody #fed-network').waitFor({state:'visible'});
  assert(!(await page.locator('#afDashboard').isVisible()),'Federation Admin: overview remained visible behind detail stage');
  await page.locator('.af-back').click();
  assert(await page.locator('#afDashboard').isVisible(),'Federation Admin: overview did not return');

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(150);
  assert(await page.locator('.af-mobile-menu').isVisible(),'Federation Admin mobile menu button missing');
  await page.locator('.af-mobile-menu').click();
  assert(await page.locator('#adminFinalApp').evaluate(node=>node.classList.contains('nav-open')),'Federation Admin mobile sidebar did not open');
  await noOverflow(page,'#adminFinalApp','Federation Admin mobile');
  await page.locator('.af-nav [data-af-key="overview"]').click();
  assert(!(await page.locator('#adminFinalApp').evaluate(node=>node.classList.contains('nav-open'))),'Federation Admin mobile sidebar did not close after navigation');

  assert(pageErrors.length===0,`Admin UI page errors: ${pageErrors.join(' | ')}`);
  console.log('SanPaid final Cooperative + Federation admin UI audit: PASS');
  console.log('Verified final-only shell, detail navigation, module restoration, profile actions, mobile sidebar and zero legacy admin leakage.');
  await context.close();
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
