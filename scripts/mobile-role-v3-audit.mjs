import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('.',import.meta.url).pathname,'..');
const dist=resolve(root,'dist');
const port=4193;
const server=spawn('python3',['-m','http.server',String(port),'--directory',dist],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(existsSync);
if(!chrome)throw new Error('Chrome/Chromium executable not found');
const assert=(v,m)=>{if(!v)throw new Error(m)};
async function waitServer(){for(let i=0;i<30;i++){try{if((await fetch(`http://127.0.0.1:${port}/`)).ok)return}catch{}await sleep(200)}throw new Error('audit server did not start')}

async function apiFallback(page,user,role){
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let payload={ok:true};
    if(path==='/api/auth/demo-access')payload={ok:true,accounts:[]};
    else if(path==='/api/auth/me'||path==='/api/connected/auth/me')payload={ok:true,user};
    else if(path==='/api/connected/health')payload={ok:true};
    else if(path==='/api/public/services'||path==='/api/connected/customer/services')payload={ok:true,services:[{name:'Electrician',basePrice:499,icon:'⚡'}]};
    else if(path==='/api/connected/snapshot')payload={role,bookings:[],offers:[]};
    else if(path.includes('/notifications'))payload={ok:true,notifications:[]};
    else if(path==='/api/connected/customer/support')payload={ok:true,requests:[]};
    else if(path==='/api/connected/worker/offers')payload=[];
    else if(path==='/api/connected/worker/dashboard')payload={ok:true,profile:{name:user.fullName,available:true,availabilityStatus:'AVAILABLE',rating:4.9},jobs:{active:0},earnings:{today:0,week:0,total:0,payments:[]}};
    else if(path==='/api/connected/workforce/passport')payload={ok:true,passport:null};
    else if(path==='/api/connected/worker/schedule')payload={ok:true,date:new Date().toISOString().slice(0,10),slots:[]};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
}
async function prep(context,user,role){
  const page=await context.newPage();page.setDefaultTimeout(9000);await apiFallback(page,user,role);
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(300);
  await page.evaluate(()=>window.SanPaidBootstrap?.loadCustomerWorker?.());await page.waitForTimeout(250);return page;
}
async function openRole(context,kind){
  const worker=kind==='worker';
  const user=worker?{id:11,role:'WORKER',persona:'WORKER_A',fullName:'Asha Verma',name:'Asha Verma',email:'worker1.connected@sanpaid.demo'}:{id:101,role:'CUSTOMER',fullName:'Shreya Patil',name:'Shreya Patil',email:'shreya.customer@sanpaid.demo'};
  const page=await prep(context,user,worker?'WORKER':'CUSTOMER');
  const ok=await page.evaluate(async ({worker,user})=>{
    if(window.SanPaidReviewRuntime?.enabled){
      await window.SanPaidAuth.logout({silent:true,keepModal:true}).catch(()=>{});
      await window.SanPaidAuth.login({identifier:worker?'worker-a':'customer',password:'mobile-v3-audit',role:worker?'WORKER':'CUSTOMER',remember:false});
      return window.SanPaidAuth.openRoleWorkspace(worker?'WORKER':'CUSTOMER',worker?'WORKER_A':'CUSTOMER');
    }
    window.SanPaidAuth.restoreSession=async()=>user;window.SanPaidAuth.getCurrentUser=()=>user;
    return window.ConnectedSanPaid.open(worker?'WORKER_A':'CUSTOMER');
  },{worker,user});
  assert(ok===true,`${kind} workspace did not open`);
  await page.locator('#connectedShell:not(.hidden)').waitFor({state:'visible'});await page.waitForTimeout(350);return page;
}
async function noOverflow(page,label){
  const result=await page.evaluate(()=>{
    const shell=document.getElementById('connectedShell');
    const shellBox={scrollWidth:shell.scrollWidth,clientWidth:shell.clientWidth};
    const visible=[...shell.querySelectorAll('*')].filter(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0});
    const bad=visible.filter(n=>{
      const overflow=getComputedStyle(n).overflowX;
      if(['auto','scroll','hidden','clip'].includes(overflow))return false;
      if(n.closest('.cm-home-journey,.wm-home-journey'))return false;
      return n.scrollWidth>n.clientWidth+3;
    }).slice(0,8).map(n=>({tag:n.tagName,cls:n.className,sw:n.scrollWidth,cw:n.clientWidth}));
    return{shellBox,bad};
  });
  assert(result.shellBox.scrollWidth<=result.shellBox.clientWidth+2,`${label}: shell overflows viewport (${result.shellBox.scrollWidth}/${result.shellBox.clientWidth})`);
  assert(!result.bad.length,`${label}: unexpected horizontal overflow ${JSON.stringify(result.bad)}`);
}
async function fontFloor(page,selectors,min,label){
  for(const sel of selectors){
    const nodes=page.locator(sel);const c=await nodes.count();
    for(let i=0;i<c;i++){if(!(await nodes.nth(i).isVisible()))continue;const px=await nodes.nth(i).evaluate(n=>parseFloat(getComputedStyle(n).fontSize));assert(px>=min,`${label}: ${sel} font ${px}px < ${min}px`)}
  }
}
async function assertRole(page,kind,label){
  const c=kind==='customer';
  const prefix=c?'cm':'wm';
  await page.locator(`#connectedShell.${c?'customer-mobile-ready':'worker-mobile-ready'}`).waitFor({state:'attached'});
  assert(await page.locator(`.${prefix}-mobile-header`).isVisible(),`${label}: header missing`);
  assert(await page.locator(`.${prefix}-mobile-home`).isVisible(),`${label}: home missing`);
  assert(await page.locator(`.${prefix}-bottom-nav`).isVisible(),`${label}: bottom nav missing`);
  await noOverflow(page,label);
  const theme=await page.locator('#connectedShell').evaluate(node=>({
    scheme:getComputedStyle(node).colorScheme,
    navy:getComputedStyle(node).getPropertyValue('--sp-navy').trim().toLowerCase(),
    green:getComputedStyle(node).getPropertyValue('--sp-green').trim().toLowerCase(),
    bg:getComputedStyle(node).backgroundImage
  }));
  assert(theme.scheme.includes('light'),`${label}: mobile shell is not locked to light color scheme`);
  assert(theme.navy==='#07386f',`${label}: mobile navy does not match public site (${theme.navy})`);
  assert(theme.green==='#0b987d',`${label}: mobile green does not match public site (${theme.green})`);
  assert(!/rgb\(1[0-9],\s*4[0-9],\s*6[0-9]\)/i.test(theme.bg),`${label}: unexpected dark shell background`);
  const quick=c?'.cm-quick-grid>button':'.wm-quick-grid>button';
  assert((await page.locator(quick).count())===3,`${label}: quick actions incomplete`);
  const grid=await page.locator(c?'.cm-quick-grid':'.wm-quick-grid').evaluate(n=>getComputedStyle(n).gridTemplateColumns);
  assert(!grid.includes(' '),`${label}: quick actions are still multi-column (${grid})`);
  await fontFloor(page,c?['.cm-quick-grid b','.cm-quick-grid small','.cm-next-card p','.cm-mobile-metrics small','.cm-support-card small']:['.wm-quick-grid b','.wm-quick-grid small','.wm-next-card p','.wm-metrics small','.wm-trust-card small'],10.5,label);
  const controls=page.locator(`#connectedShell.${c?'customer-mobile-bootstrap':'worker-mobile-final'} button:visible`);
  for(let i=0;i<Math.min(await controls.count(),30);i++){
    const r=await controls.nth(i).boundingBox();if(r)assert(r.height>=40,`${label}: touch control ${i} is ${r.height}px high`);
  }
  const input=page.locator('#connectedShell input:visible, #connectedShell textarea:visible, #connectedShell select:visible').first();
  if(await input.count()){await input.focus();await page.waitForTimeout(60);const nav=page.locator(`.${prefix}-bottom-nav`);const op=parseFloat(await nav.evaluate(n=>getComputedStyle(n).opacity));assert(op<.2,`${label}: bottom nav stays visible over keyboard form focus`);}
}

let browser;
try{
  await waitServer();browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  for(const kind of ['customer','worker']){
    for(const f of[{w:320,h:720},{w:360,h:780},{w:375,h:812},{w:390,h:844},{w:414,h:896},{w:430,h:860},{w:844,h:390}]){
      const context=await browser.newContext({viewport:{width:f.w,height:f.h},isMobile:true,hasTouch:true,deviceScaleFactor:3});
      const page=await openRole(context,kind);await assertRole(page,kind,`${f.w}x${f.h} ${kind}`);await context.close();
    }
  }
  console.log('SanPaid mobile role v3 deep audit: PASS');
}finally{await browser?.close().catch(()=>{});server.kill('SIGTERM')}
