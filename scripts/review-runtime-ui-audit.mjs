import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4176;
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
  throw new Error('Review runtime audit server did not start.');
}
async function waitFor(fn,{attempts=50,delay=100,message='Condition did not become true'}={}){
  for(let i=0;i<attempts;i+=1){if(await fn())return;await sleep(delay);}throw new Error(message);
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();
  page.setDefaultTimeout(9000);
  const apiRequests=[];
  page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/'))apiRequests.push(new URL(request.url()).pathname);});
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(500);

  assert(await page.evaluate(()=>window.SanPaidReviewRuntime?.enabled===true),'Review runtime was not installed.');
  assert(await page.evaluate(()=>document.documentElement.dataset.sanpaidRuntime==='review'),'Review runtime marker missing.');

  const loginAndOpen=async({identifier,role,persona,target})=>{
    const result=await page.evaluate(async({identifier,role,persona})=>{
      await window.SanPaidAuth.logout({silent:true,keepModal:true}).catch(()=>{});
      await window.SanPaidAuth.login({identifier,password:'review-runtime-password',role,remember:false});
      const opened=await window.SanPaidAuth.openRoleWorkspace(role,persona||null);
      return {opened,user:window.SanPaidAuth.getCurrentUser?.(),runtime:window.SanPaidReviewRuntime?.mode};
    },{identifier,role,persona});
    assert(result.opened===true,`${role}: workspace did not open`);
    assert(result.user?.role===role,`${role}: local session role mismatch`);
    assert(result.runtime==='SIH_REVIEW_RUNTIME',`${role}: review runtime mode missing`);
    if(target==='connected'){
      await page.locator('#connectedShell:not(.hidden)').waitFor({state:'visible'});
      assert(await page.locator('#connectedContent').getAttribute('data-connected-role')===role,`${role}: connected role surface mismatch`);
      await page.locator(`.cw-dashboard.${role==='CUSTOMER'?'customer':'worker'}`).waitFor({state:'attached'});
      const text=(await page.locator('#connectedContent').innerText()).toLowerCase();
      assert(!text.includes('workspace temporarily unavailable'),`${role}: fallback unavailable screen rendered`);
      assert(!text.includes('authentication is temporarily unavailable'),`${role}: auth outage leaked into workspace`);
    }else{
      await page.locator('#sihJudgeShell:not(.judge-hidden)').waitFor({state:'visible'});
      await waitFor(async()=>await page.locator('#judgeContent').innerText().then(t=>t.length>80).catch(()=>false),{message:`${role}: administration content did not render`});
      const text=(await page.locator('#judgeContent').innerText()).toLowerCase();
      assert(!text.includes('administration session required'),`${role}: admin session was rejected`);
      assert(!text.includes('authentication is temporarily unavailable'),`${role}: auth outage leaked into admin workspace`);
    }
  };

  await loginAndOpen({identifier:'customer',role:'CUSTOMER',persona:'CUSTOMER',target:'connected'});
  assert(await page.locator('.cr-desktop-home').isVisible(),'Customer enhanced desktop home is not visible in review runtime.');
  assert((await page.locator('#connectedContent').innerText()).includes('Shreya Patil'),'Customer review identity was not applied.');

  await loginAndOpen({identifier:'worker-a',role:'WORKER',persona:'WORKER_A',target:'connected'});
  const workerText=(await page.locator('#connectedContent').innerText()).toLowerCase();
  assert(workerText.includes('asha verma'),'Worker review identity was not applied.');
  assert(workerText.includes('job requests'),'Worker dashboard did not load job requests.');

  await loginAndOpen({identifier:'cooperative-admin',role:'COOPERATIVE_ADMIN',persona:null,target:'judge'});
  await waitFor(async()=>await page.locator('#sihJudgeShell').evaluate(node=>node.classList.contains('cooperative-govtech')).catch(()=>false),{message:'Cooperative portal enhancement did not activate'});

  await loginAndOpen({identifier:'federation-admin',role:'FEDERATION_ADMIN',persona:null,target:'judge'});
  await waitFor(async()=>await page.locator('#sihJudgeShell').evaluate(node=>node.classList.contains('federation-govtech')).catch(()=>false),{message:'Federation portal enhancement did not activate'});

  const state=await page.evaluate(()=>window.SanPaidReviewRuntime.state());
  assert(state?.booking?.bookingCode,'Review runtime booking state missing.');
  assert(state?.workers?.length>=2,'Review runtime workforce state missing.');

  const serverApiRequests=apiRequests.filter(path=>path!=='/api/auth/demo-access');
  assert(serverApiRequests.length===0,`Review runtime leaked API requests to unavailable server: ${serverApiRequests.join(', ')}`);

  console.log('SanPaid SIH review runtime audit: PASS');
  console.log('Verified DB-independent Customer, Worker, Cooperative Admin and Federation Admin access with zero server API dependency beyond optional demo-access credential discovery.');
  await context.close();
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
