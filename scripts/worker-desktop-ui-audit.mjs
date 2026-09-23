import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4178;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');
function assert(condition,message){if(!condition)throw new Error(message);}
async function waitServer(){for(let i=0;i<30;i+=1){try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok)return;}catch{}await sleep(200);}throw new Error('Worker desktop UI audit server did not start.');}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error?.stack||error?.message||String(error)));
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(450);
  const opened=await page.evaluate(async()=>{
    await window.SanPaidAuth.logout({silent:true,keepModal:true}).catch(()=>{});
    await window.SanPaidAuth.login({identifier:'worker-a',password:'review-runtime-password',role:'WORKER',remember:false});
    return window.SanPaidAuth.openRoleWorkspace('WORKER','WORKER_A');
  });
  assert(opened===true,'Worker desktop workspace did not open.');
  await page.locator('#connectedShell:not(.hidden)').waitFor({state:'visible'});
  await page.locator('.cw-dashboard.worker').waitFor({state:'attached'});
  await page.locator('.wd-desktop-home').waitFor({state:'visible'});
  await page.waitForTimeout(300);

  const shell=page.locator('#connectedShell');
  assert(await shell.evaluate(node=>node.classList.contains('worker-desktop-final-page')),'Worker final desktop scope missing');
  assert(!(await shell.evaluate(node=>node.classList.contains('worker-mobile-final'))),'Worker mobile mode leaked into desktop');
  const required=['.wd-header-tools','.wd-nav-motto','.wd-desktop-home','.wd-hero','.wd-current','.wd-requests','.wd-profile-card','.wd-earning-card','.wd-safety'];
  for(const selector of required){const node=page.locator(selector).first();assert(await node.count()===1,`Worker desktop: ${selector} missing`);assert(await node.isVisible(),`Worker desktop: ${selector} not visible`);}
  assert((await page.locator('.wd-hero').innerText()).toLowerCase().includes('asha'),'Worker desktop identity missing from greeting');
  assert(await page.locator('.cw-dashboard.worker .cw-nav').isVisible(),'Worker desktop sidebar missing');
  assert(!(await page.locator('.cw-dashboard.worker [data-cw-view="overview"]>.cw-role-head').isVisible()),'Legacy Worker overview visible behind final desktop home');
  assert(await shell.evaluate(node=>node.scrollWidth<=node.clientWidth+2),'Worker desktop has horizontal overflow');

  await page.locator('.cw-nav [data-cw-view-btn="offers"]').click();await page.waitForTimeout(100);
  assert(await page.locator('[data-cw-view="offers"]').isVisible(),'Worker Job Requests real view did not open');
  await page.locator('.cw-nav [data-cw-view-btn="overview"]').click();await page.waitForTimeout(100);
  assert(await page.locator('.wd-desktop-home').isVisible(),'Worker final desktop Home did not return');
  assert(pageErrors.length===0,`Worker desktop page errors: ${pageErrors.join(' | ')}`);

  console.log('SanPaid final Worker desktop UI audit: PASS');
  console.log('Verified premium desktop shell, working navigation, dynamic identity and zero legacy overview leakage.');
  await context.close();
} finally {if(browser)await browser.close().catch(()=>{});server.kill('SIGTERM');}
