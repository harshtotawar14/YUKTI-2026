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
  'selection-ready-v3.css','workspace-ui.css','color-system-v5.css','auth-unified.css','login-reference.css','customer-worker-dashboard.css','customer-reference-dashboard.css',
  'admin-command-center.css','federation-govtech.css','federation-portal.css','cooperative-portal.css','handover-evidence.css',
  'credibility-layer.css','workforce-intelligence.css',
  'app.js','mobile.js','connected-demo.js','connected-service-ui.js','connected-commerce-ui.js','connected-runtime-fix.js',
  'capacity-worker-ui.js','judge-demo.js','selector-mode.js','top1-polish.js','evaluator-final.js','auth-unified.js','login-reference.js',
  'customer-worker-dashboard.js','customer-reference-dashboard.js','admin-command-center.js','federation-portal.js','cooperative-portal.js',
  'cooperative-deploy-guard.js','handover-evidence.js','credibility-layer.js','workforce-intelligence.js','service-worker.js'
];

function resolveCommit(){
  const fromEnvironment=process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||'';
  if(fromEnvironment)return fromEnvironment.trim();
  try{return execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}
  catch{return 'LOCAL_BUILD';}
}

rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});

for(const file of publicFiles){
  const source=resolve(root,file);
  if(!existsSync(source))throw new Error(`Required public asset is missing: ${file}`);
  cpSync(source,resolve(output,file));
}

const builtIndexPath=resolve(output,'index.html');
const builtIndex=readFileSync(builtIndexPath,'utf8')
  .replaceAll('https://sahkriya.vercel.app',primaryProductionUrl)
  .replace('</head>','<link rel="stylesheet" href="login-reference.css?v=1">\n<link rel="stylesheet" href="customer-reference-dashboard.css?v=1">\n</head>')
  .replace('</body>','<script src="login-reference.js?v=1"></script>\n<script src="customer-reference-dashboard.js?v=1"></script>\n</body>');
writeFileSync(builtIndexPath,builtIndex);

const buildInfo={
  product:'SanPaid',
  version:packageMetadata.version,
  runtime:'v71',
  commitSha:resolveCommit(),
  builtAt:new Date().toISOString(),
  source:'harshtotawar14/YUKTI-2026',
  branch:process.env.VERCEL_GIT_COMMIT_REF||process.env.GITHUB_REF_NAME||'local'
};

writeFileSync(resolve(output,'build-info.json'),`${JSON.stringify(buildInfo,null,2)}\n`);
console.log(`Built SanPaid ${buildInfo.version} (${buildInfo.commitSha}) into dist/ with ${publicFiles.length} allowlisted public assets.`);
