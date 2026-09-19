import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve(new URL('..',import.meta.url).pathname);
const port=4174;
const server=spawn('python3',['-m','http.server',String(port),'--directory',resolve(root,'dist')],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath)throw new Error('Chrome/Chromium executable not found.');

const SERVICES=[{id:1,name:'Electrician',icon:'⚡',basePrice:499},{id:2,name:'Plumber',icon:'🔧',basePrice:449}];
const USERS={
  CUSTOMER:{id:101,name:'Customer Review',email:'customer.connected@sanpaid.demo',role:'CUSTOMER'},
  WORKER:{id:201,name:'Worker Review',email:'worker1.connected@sanpaid.demo',role:'WORKER',worker_id:1,availability_status:'AVAILABLE',rating:4.9},
  COOPERATIVE_ADMIN:{id:301,name:'Cooperative Admin',email:'admin.connected@sanpaid.demo',role:'COOPERATIVE_ADMIN',cooperative_id:1},
  FEDERATION_ADMIN:{id:401,name:'Federation Admin',email:'federation.connected@sanpaid.demo',role:'FEDERATION_ADMIN'}
};

function assert(condition,message){if(!condition)throw new Error(message);}
async function waitServer(){for(let i=0;i<30;i++){try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok)return;}catch{}await sleep(200);}throw new Error('Local SanPaid build server did not start.');}
function json(route,status,payload){return route.fulfill({status,contentType:'application/json',body:JSON.stringify(payload)});}

async function installMockApi(page,role){
  const user=USERS[role];
  await page.route('**/api/**',async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/^\/api\//,'');
    if(path==='auth/demo-access')return json(route,200,{ok:true,password:'Reviewer@123',accounts:[
      {accessId:'customer',role:'CUSTOMER',persona:'CUSTOMER'},
      {accessId:'worker-a',role:'WORKER',persona:'WORKER_A'},
      {accessId:'worker-b',role:'WORKER',persona:'WORKER_B'},
      {accessId:'cooperative-admin',role:'COOPERATIVE_ADMIN'},
      {accessId:'federation-admin',role:'FEDERATION_ADMIN'}
    ]});
    if(path==='auth/login')return json(route,200,{ok:true,user,demoToken:'mock-role-token'});
    if(path==='auth/me'||path==='connected/auth/me')return json(route,200,{ok:true,user});
    if(path==='auth/session-bridge')return json(route,200,{ok:true,demoToken:'mock-admin-token'});
    if(path==='auth/logout'||path==='connected/auth/logout')return json(route,200,{ok:true});
    if(path==='connected/health')return json(route,200,{ok:true,source:'DATABASE_CONFIGURATION',services:SERVICES.length});
    if(path==='public/services'||path==='connected/customer/services')return json(route,200,{ok:true,source:'DATABASE_CONFIGURATION',services:SERVICES});
    if(path==='connected/snapshot')return json(route,200,role==='CUSTOMER'?{ok:true,role:'CUSTOMER',revision:'1',bookings:[]}:{ok:true,role:'WORKER',revision:'1',offers:[]});
    if(path==='connected/customer/notifications')return json(route,200,{ok:true,notifications:[]});
    if(path==='connected/customer/support')return json(route,200,{ok:true,requests:[]});
    if(path==='connected/worker/offers'||path==='connected/worker/capacity-offers')return json(route,200,[]);
    if(path==='connected/worker/dashboard')return json(route,200,{ok:true,profile:{id:1,name:'Worker Review',available:true,availabilityStatus:'AVAILABLE',identityStatus:'VERIFIED',rating:4.9,cooperative:{id:1,name:'YUKTI Community Services Cooperative'}},jobs:{active:0},earnings:{today:0,week:0,total:0,entries:[]}});
    if(path==='connected/workforce/passport')return json(route,200,{ok:true,passport:{workerId:1,name:'Worker Review',identityVerified:true,identityStatus:'VERIFIED',availabilityStatus:'AVAILABLE',rating:4.9,completedJobs:3,currentEligibility:'ELIGIBLE',skills:[{name:'Electrician',status:'VERIFIED',verified:true}],credentials:[],credentialScope:'SANPAID_SERVICE_HISTORY_NOT_GOVERNMENT_CERTIFICATE'}});
    if(path==='connected/worker/notifications')return json(route,200,{ok:true,notifications:[]});
    if(path.startsWith('connected/worker/schedule'))return json(route,200,{ok:true,date:new Date().toISOString().slice(0,10),slots:[],suggestedSlots:[],empty:true});
    if(path==='connected/judge/readiness')return json(route,200,{ok:true,ready:true,checks:[]});
    if(path==='connected/judge/overview')return json(route,200,{ok:true,source:'MOCK_ISOLATED_BROWSER_AUDIT',metrics:{registeredWorkers:2,verifiedWorkers:2,availableWorkers:2,activeBookings:0,slaBreached:0,recordedPayments:0,pendingVerification:0,openComplaints:0,pendingOffers:0,capacityRequests:0},cooperatives:[],complaints:[],capacityRequests:[],forecasts:[],regions:[]});
    if(path==='connected/judge/planning')return json(route,200,{ok:true,service:'Electrician',observedDemand30d:2,eligibleCapacity:2,capacityGap:0,confidence:'NOT_APPLICABLE_OBSERVED_DATA',services:[],recommendedActions:['MONITOR_DEMAND']});
    if(path==='connected/judge/workforce-intelligence')return json(route,200,{ok:true,passports:[],opportunity:{workers:[]},capacity:{rows:[]},pilot:{metrics:[]},audit:[]});
    if(path==='connected/judge/latest-demo-booking')return json(route,200,{ok:true,booking:null});
    if(path==='cooperative-admin/workspace')return json(route,200,{ok:true,cooperative:{id:1,name:'YUKTI Community Services Cooperative',city:'Indore'},metrics:{totalWorkers:2,verifiedWorkers:2,availableWorkers:2,activeBookings:0,openComplaints:0,recordedPayments:0,pendingVerification:0,documentIssues:0,slaBreaches:0,pendingOffers:0,capacityRequests:0},workers:[],services:[],complaints:[],skills:[],payments:[],capacityRequests:[],trainingRecommendations:[]});
    if(path==='cooperative-admin/complaints')return json(route,200,{ok:true,complaints:[]});
    if(path==='federation/capacity-requests')return json(route,200,{ok:true,requests:[]});
    return json(route,200,{ok:true});
  });
}

async function auditRole(browser,role,{width=1280,height=900}={}){
  const context=await browser.newContext({viewport:{width,height}});
  const page=await context.newPage();page.setDefaultTimeout(7000);
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await installMockApi(page,role);
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.SanPaidAuth?.login&&window.SanPaidAuth?.openRoleWorkspace));
  const identifier={CUSTOMER:'customer',WORKER:'worker-a',COOPERATIVE_ADMIN:'cooperative-admin',FEDERATION_ADMIN:'federation-admin'}[role];
  await page.evaluate(async({role,identifier})=>{
    await window.SanPaidAuth.login({identifier,password:'Reviewer@123',role});
    await window.SanPaidAuth.openRoleWorkspace(role,role==='WORKER'?'WORKER_A':null);
  },{role,identifier});
  await page.waitForTimeout(900);

  if(role==='CUSTOMER'){
    const dash=page.locator('#cwDashboard[data-role="CUSTOMER"]');
    await dash.waitFor({state:'visible'});
    const text=(await dash.innerText()).toLowerCase();
    for(const phrase of ['customer service dashboard','book service','my booking','verify worker','payment & invoice'])assert(text.includes(phrase),`Customer workspace missing: ${phrase}`);
  }else if(role==='WORKER'){
    const dash=page.locator('#cwDashboard[data-role="WORKER"]');
    await dash.waitFor({state:'visible'});
    const text=(await dash.innerText()).toLowerCase();
    for(const phrase of ['worker work dashboard','job requests','schedule & availability','trust passport','earnings'])assert(text.includes(phrase),`Worker workspace missing: ${phrase}`);
  }else{
    const shell=page.locator('#sihJudgeShell:not(.judge-hidden)');
    await shell.waitFor({state:'visible'});
    const text=(await shell.innerText()).toLowerCase();
    if(role==='COOPERATIVE_ADMIN')for(const phrase of ['cooperative operations','verification','complaints','capacity'])assert(text.includes(phrase),`Cooperative workspace missing: ${phrase}`);
    if(role==='FEDERATION_ADMIN')for(const phrase of ['federation','capacity','planning','technical verification'])assert(text.includes(phrase),`Federation workspace missing: ${phrase}`);
  }

  const overflow=await page.locator('html').evaluate(node=>node.scrollWidth<=node.clientWidth+2);
  assert(overflow,`${role} workspace has horizontal overflow at ${width}px`);
  assert(pageErrors.length===0,`${role} workspace page errors: ${pageErrors.join(' | ')}`);
  await context.close();
}

let browser;
try{
  await waitServer();
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  for(const role of ['CUSTOMER','WORKER','COOPERATIVE_ADMIN','FEDERATION_ADMIN'])await auditRole(browser,role);
  await auditRole(browser,'CUSTOMER',{width:390,height:844});
  await auditRole(browser,'WORKER',{width:390,height:844});
  console.log('SanPaid authenticated role UI audit: PASS');
  console.log('Verified Customer, Worker, Cooperative Admin and Federation workspaces plus mobile Customer/Worker rendering with isolated API fixtures.');
}finally{
  if(browser)await browser.close().catch(()=>{});
  server.kill('SIGTERM');
}
