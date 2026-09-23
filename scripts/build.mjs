import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const output=resolve(root,'dist');
const packageMetadata=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
const primaryProductionUrl='https://yukti-2026-brown.vercel.app';

const publicFiles=[
  'index.html',
  'app-icon.svg','manifest.webmanifest','robots.txt','sitemap.xml','social-preview.svg',
  'design-tokens.css','styles.css','mobile.css','connected-demo.css','judge-demo.css','selector-mode.css','master-v2.css','landing-pro.css','dossier-redesign.css',
  'selection-ready-v3.css','workspace-ui.css','color-system-v5.css','auth-unified.css','login-reference.css','customer-worker-dashboard.css','customer-reference-dashboard.css','customer-mobile-reference.css','worker-mobile-final.css',
  'admin-command-center.css','federation-govtech.css','federation-portal.css','cooperative-portal.css','admin-final.css','admin-final-guard.css','handover-evidence.css',
  'credibility-layer.css','workforce-intelligence.css',
  'app.js','mobile.js','connected-demo.js','connected-service-ui.js','connected-commerce-ui.js','connected-runtime-fix.js','review-runtime.js','review-runtime-bridge.js',
  'capacity-worker-ui.js','judge-demo.js','selector-mode.js','selector-final-polish.js','top1-polish.js','evaluator-final.js','auth-unified.js','login-reference.js',
  'customer-worker-dashboard.js','customer-reference-dashboard.js','customer-mobile-bootstrap.js','customer-mobile-reference.js','worker-mobile-final.js','admin-command-center.js','federation-portal.js','cooperative-portal.js','admin-final.js',
  'handover-evidence.js','credibility-layer.js','workforce-intelligence.js','service-worker.js'
];

function sourceText(file){return readFileSync(resolve(root,file),'utf8');}
function assertFinalRoleSources(){
  const customer=sourceText('customer-reference-dashboard.js');
  const worker=sourceText('worker-mobile-final.js');
  const admin=sourceText('admin-final.js');
  const login=sourceText('login-reference.js');
  const selector=sourceText('selector-final-polish.js');
  if(!customer.includes('SanPaidCustomerReference'))throw new Error('Canonical Customer renderer is missing.');
  if(worker.includes(`'\"':'&quot',`)||!worker.includes(`'\"':'&quot;',`))throw new Error('Worker mobile HTML escaping contract is incomplete.');
  if(!admin.includes('restoreMovedNodes')||!admin.includes('movedNodes'))throw new Error('Final Admin UI must restore borrowed operational modules during role changes.');
  if(login.includes('<b>Demo:</b>'))throw new Error('Selector-facing login must use review access wording, not a visible Demo label.');
  if(!selector.includes('data-selector-finding')||!selector.includes('WHAT YOU CAN EXPLORE NOW')||!selector.includes('sanpaidCustomerBootGuard'))throw new Error('Selector-facing evidence, implementation truth, or Customer placeholder neutralization is incomplete.');
}

function resolveCommit(){
  const fromEnvironment=process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||'';
  if(fromEnvironment)return fromEnvironment.trim();
  try{return execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8').trim();}
  catch{return 'LOCAL_BUILD';}
}

const buildCommit=resolveCommit();
const assetVersion=buildCommit==='LOCAL_BUILD'?'local':buildCommit.slice(0,12);

assertFinalRoleSources();
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});

for(const file of publicFiles){
  const source=resolve(root,file);
  if(!existsSync(source))throw new Error(`Required public asset is missing: ${file}`);
  cpSync(source,resolve(output,file));
}

function findCssBlockEnd(css,openIndex){
  let depth=0,quote='',comment=false;
  for(let i=openIndex;i<css.length;i+=1){
    const ch=css[i],next=css[i+1];
    if(comment){if(ch==='*'&&next==='/'){comment=false;i+=1;}continue;}
    if(quote){if(ch==='\\'){i+=1;continue;}if(ch===quote)quote='';continue;}
    if(ch==='/'&&next==='*'){comment=true;i+=1;continue;}
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='{')depth+=1;
    else if(ch==='}'){depth-=1;if(depth===0)return i;}
  }
  return css.length-1;
}
function stripLegacyRoleMobileMedia(css){
  const legacy=/max-width\s*:\s*(?:900|768|720|520|480|340)px/i;
  let out='',cursor=0;
  while(cursor<css.length){
    const start=css.indexOf('@media',cursor);
    if(start<0){out+=css.slice(cursor);break;}
    out+=css.slice(cursor,start);
    const open=css.indexOf('{',start);
    if(open<0){out+=css.slice(start);break;}
    const end=findCssBlockEnd(css,open);
    const header=css.slice(start,open);
    if(!legacy.test(header))out+=css.slice(start,end+1);
    cursor=end+1;
  }
  return out;
}
const roleCssPath=resolve(output,'customer-worker-dashboard.css');
const roleCssSource=readFileSync(roleCssPath,'utf8');
const roleCssFinal=stripLegacyRoleMobileMedia(roleCssSource);
writeFileSync(roleCssPath,roleCssFinal);
if(roleCssFinal===roleCssSource)throw new Error('Legacy role mobile media blocks were not found in Customer/Worker dashboard CSS.');

const dashboardPath=resolve(output,'customer-worker-dashboard.js');
const dashboardSource=readFileSync(dashboardPath,'utf8');
const dashboardEnd=dashboardSource.lastIndexOf('})();');
if(dashboardEnd<0)throw new Error('Customer/Worker dashboard IIFE end marker was not found.');
const dashboardHook=`\n  window.SanPaidCustomerWorkerDashboard=Object.freeze({refresh,requestRefresh});\n`;
writeFileSync(dashboardPath,dashboardSource.slice(0,dashboardEnd)+dashboardHook+dashboardSource.slice(dashboardEnd));

const builtIndexPath=resolve(output,'index.html');
const builtIndex=readFileSync(builtIndexPath,'utf8')
  .replaceAll('https://sahkriya.vercel.app',primaryProductionUrl)
  .replace('</head>',`<meta name="color-scheme" content="light">\n<meta name="supported-color-schemes" content="light">\n<link rel="stylesheet" href="login-reference.css?v=${assetVersion}">\n<link rel="stylesheet" href="customer-reference-dashboard.css?v=${assetVersion}">\n<link rel="stylesheet" href="customer-mobile-reference.css?v=${assetVersion}">\n<link rel="stylesheet" href="worker-mobile-final.css?v=${assetVersion}">\n<link rel="stylesheet" href="admin-final.css?v=${assetVersion}">\n<link rel="stylesheet" href="admin-final-guard.css?v=${assetVersion}">\n</head>`)
  .replace('</body>',`<script src="review-runtime.js?v=${assetVersion}"></script>\n<script src="customer-worker-dashboard.js?v=${assetVersion}"></script>\n<script src="review-runtime-bridge.js?v=${assetVersion}"></script>\n<script src="login-reference.js?v=${assetVersion}"></script>\n<script src="customer-reference-dashboard.js?v=${assetVersion}"></script>\n<script src="customer-mobile-bootstrap.js?v=${assetVersion}"></script>\n<script src="customer-mobile-reference.js?v=${assetVersion}"></script>\n<script src="worker-mobile-final.js?v=${assetVersion}"></script>\n<script src="admin-final.js?v=${assetVersion}"></script>\n<script src="selector-final-polish.js?v=${assetVersion}"></script>\n</body>`);
writeFileSync(builtIndexPath,builtIndex);

const buildInfo={
  product:'SanPaid',
  version:packageMetadata.version,
  runtime:'v71',
  commitSha:buildCommit,
  builtAt:new Date().toISOString(),
  source:'harshtotawar14/YUKTI-2026',
  branch:process.env.VERCEL_GIT_COMMIT_REF||process.env.GITHUB_REF_NAME||'local',
  roleMobileUi:'FINAL_ONLY',
  adminUi:'REFERENCE_FINAL',
  uiArchitecture:'ROLE_SHELLS_FINAL',
  selectorExperience:'SELECTION_READY'
};

writeFileSync(resolve(output,'build-info.json'),`${JSON.stringify(buildInfo,null,2)}\n`);
console.log(`Built SanPaid ${buildInfo.version} (${buildInfo.commitSha}) into dist/ with ${publicFiles.length} allowlisted public assets, final-only role UI, and selector-ready presentation truth.`);
