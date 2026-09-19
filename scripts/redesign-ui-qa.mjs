// Run after npm run build. Requires Playwright and a Chromium executable.
// Local backend-unavailable responses are intentional; no production writes occur.
import {createServer} from 'node:http';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=resolve(new URL('..',import.meta.url).pathname);
const out=process.env.SANPAID_QA_OUTPUT||resolve(root,'qa-output');
mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{
  if(req.url.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local QA: backend unavailable'}));return;}
  const url=new URL(req.url,'http://localhost');
  const path=resolve(root,'dist','.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(resolve(root,'dist')+'/')){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',({'.css':'text/css','.js':'application/javascript','.html':'text/html','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'})[extname(path)]||'application/octet-stream');res.end(readFileSync(path));}catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
  browser=await chromium.launch({executablePath:process.env.SANPAID_CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  for(const width of [1440,768,390]){
    const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#connectedDemoSection').count(),1,'Trust control section is missing');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);
    await page.screenshot({path:resolve(out,`hero-${width}.png`)});
    assert.equal(await page.locator('#operatingModel .role-grid article').count(),4,'Four role cards must remain visible');
    await page.locator('#how').screenshot({path:resolve(out,`workflow-${width}.png`)});
    await page.locator('#runMatchBtn').click();
    await page.locator('#evalRunRanking:not([disabled])').waitFor();
    await page.locator('#evalRunRanking').click();
    for(const id of ['difference','evidence','connectedDemoSection','matching','operatingModel','status','architecture']){
      await page.locator('#'+id).scrollIntoViewIfNeeded();
      await page.locator('#'+id).screenshot({path:resolve(out,`${id}-${width}.png`)});
    }
    if(width===390){
      await page.evaluate(()=>scrollTo(0,0));
      await page.locator('#menuBtn').click();
      assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'true');
      await page.locator('#mobileDrawer a[href="#impact"]').click();
      assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'),'false');
    }
    assert.deepEqual(errors,[],`JS errors at ${width}`);
    console.log(`PASS ${width}px: no overflow, four role entries, matching, trust controls${width===390?', mobile drawer':''}`);
    await page.close();
  }
}finally{await browser?.close();server.close();}
