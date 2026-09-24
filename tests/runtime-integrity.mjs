import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=file=>readFileSync(resolve(root,file),'utf8');
const files=readdirSync(root,{withFileTypes:true}).filter(entry=>entry.isFile()).map(entry=>entry.name);
const jsFiles=files.filter(file=>extname(file)==='.js');
const primaryProductionUrl='https://yukti-2026-brown.vercel.app';

for(const file of jsFiles){
  execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'pipe'});
}

const html=read('index.html');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,'index.html contains duplicate IDs');

const localAssets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match=>match[1])
  .filter(value=>!value.startsWith('#')&&!value.startsWith('http:')&&!value.startsWith('https:'))
  .map(value=>value.split(/[?#]/)[0]);
for(const asset of localAssets){
  assert.ok(existsSync(resolve(root,asset)),`Missing local asset referenced by index.html: ${asset}`);
}

for(const file of jsFiles){
  const source=read(file);
  assert.ok(!source.includes('https://sanpaid-sih-2026.onrender.com'),`${file} bypasses the same-origin API proxy`);
  assert.doesNotMatch(source,/Demo@20\d{2}/,`${file} exposes a shared demo password`);
}
assert.doesNotMatch(read('README.md'),/Demo@20\d{2}/,'README exposes a shared demo password');

const vercel=read('vercel.json');
const vercelConfig=JSON.parse(vercel);
assert.match(vercel,/connect-src 'self'/,'CSP must keep browser API calls same-origin');
assert.ok(!vercel.includes('onrender.com'),'Vercel must not proxy API traffic to the deleted Render service');
assert.ok(existsSync(resolve(root,'api/[...path].js')),'Vercel catch-all API is missing');
assert.ok(existsSync(resolve(root,'database/schema.sql')),'PostgreSQL schema is missing');
assert.ok(existsSync(resolve(root,'api/_lib/demo-access.cjs')),'Public demo credential policy module is missing');
assert.ok(existsSync(resolve(root,'backend/src/cooperative/workspace-routes.cjs')),'Connected Cooperative Admin workspace route is missing');
assert.match(read('api/index.js'),/cooperativeWorkspace\.handle/,'Stable API adapter does not dispatch the Cooperative Admin workspace route');
const databaseBundle=String(vercelConfig.functions?.['api/index.js']?.includeFiles||'');
assert.ok(databaseBundle.includes('database/'),'Vercel API bundle must include the database schema and migrations directory');
assert.ok(existsSync(resolve(root,'database/migrations/008_geography_alignment.sql')),'Kolhapur geography alignment migration is missing');
const databaseSource=read('api/_lib/db.cjs');
assert.match(databaseSource,/Kolhapur, Maharashtra/,'Seed data must align with the Kolhapur field-validation scope');
assert.match(databaseSource,/Panhala, Kolhapur, Maharashtra/,'Seed data must include the Panhala cooperative network scope');
assert.doesNotMatch(databaseSource,/\bIndore\b|\bBhopal\b|Narmada Worker Cooperative/,'Legacy Madhya Pradesh seed geography remains');

const cooperativeRoute=read('backend/src/cooperative/workspace-routes.cjs');
for(const field of ['metrics','workers','skills','services','complaints','capacityRequests','payments','trainingRecommendations']){
  assert.ok(cooperativeRoute.includes(field),`Cooperative workspace contract is missing ${field}`);
}
assert.match(cooperativeRoute,/source:'DATABASE_AGGREGATION'/,'Cooperative workspace must identify database-backed aggregation');
assert.match(cooperativeRoute,/documentEvidence:\{source:'NO_DOCUMENT_REGISTRY_CONNECTED'/,'Cooperative workspace must not invent document-registry evidence');

const runtime=read('connected-runtime-fix.js');
assert.match(runtime,/window\.SanPaidApi=Object\.freeze/,'Canonical API client is missing');
assert.match(runtime,/window\.SanPaidReadiness=Object\.freeze/,'Golden Demo readiness gate is missing');
assert.match(runtime,/DEFAULT_TIMEOUT_MS/,'Canonical API timeout is missing');
assert.match(read('evaluator-final.js'),/SanPaidReadiness\?\.require/,'Evaluator connected entry bypasses readiness');
assert.match(read('selector-mode.js'),/SanPaidReadiness\?\.require/,'Guided connected entry bypasses readiness');

const customerReference=read('customer-reference-dashboard.js');
const workerFinal=read('worker-mobile-final.js');
const adminFinal=read('admin-final.js');
const loginReference=read('login-reference.js');
const selectorPolish=read('selector-final-polish.js');
assert.match(customerReference,/SanPaidCustomerReference/,'Canonical Customer presentation hook is missing');
assert.match(workerFinal,/'"':'&quot;'/,'Worker final UI escaping is incomplete');
assert.match(adminFinal,/restoreMovedNodes/,'Admin final UI does not restore operational modules safely');
assert.doesNotMatch(loginReference,/<b>Demo:<\/b>/,'Selector-facing login still exposes a Demo label');
assert.match(loginReference,/Review Access:/,'Selector-facing login review access helper is missing');
assert.match(selectorPolish,/sanpaidCustomerBootGuard/,'Selector polish does not neutralize the legacy Customer preparation placeholder');
assert.match(selectorPolish,/Field findings mapped to product controls/,'Selector evidence summary must match the displayed field findings');
assert.doesNotMatch(selectorPolish,/data-selector-finding/,'Selector polish must not invent an unsupported fifth research finding');
assert.match(selectorPolish,/WHAT YOU CAN EXPLORE NOW/,'Selector-facing implementation boundary is missing');
assert.match(selectorPolish,/Workspace Ready/,'Admin review workspace must avoid an unsupported live-network claim');

assert.ok(!existsSync(resolve(root,'cooperative-deploy-guard.js')),'Obsolete DB-dependent admin availability guard remains');
const buildSource=read('scripts/build.mjs');
assert.match(buildSource,/roleMobileUi:'FINAL_ONLY'/,'Build does not declare final-only Customer/Worker mobile UI');
assert.match(buildSource,/adminUi:'REFERENCE_FINAL'/,'Build does not declare the final Admin UI');
assert.match(buildSource,/uiArchitecture:'ROLE_SHELLS_FINAL'/,'Build does not identify the final role-shell architecture');
assert.match(buildSource,/selectorExperience:'SELECTION_READY'/,'Build does not identify the selector-ready experience');
assert.doesNotMatch(buildSource,/cooperative-deploy-guard\.js/,'Build still ships the obsolete admin availability guard');
assert.match(buildSource,/admin-final\.js/,'Build does not ship the final Admin runtime');
assert.match(buildSource,/admin-final-guard\.css/,'Build does not ship the Admin legacy-isolation guard');
assert.match(buildSource,/selector-final-polish\.js/,'Build does not ship selector-facing truth polish');

const serviceWorker=read('service-worker.js');
assert.match(serviceWorker,/sanpaid-runtime-v71-selector-final3/,'Expected selector-ready service-worker cache identity');
assert.match(serviceWorker,/Promise\.allSettled/,'Service-worker precache must tolerate individual asset failure');
assert.match(serviceWorker,/pathname\.startsWith\('\/api\/'\)/,'Service worker must not cache API requests');
assert.match(serviceWorker,/build-info\.json/,'Service worker must not cache deployment identity');
for(const asset of ['customer-mobile-reference.js','worker-mobile-final.js','admin-final.js','admin-final.css','selector-final-polish.js']){
  assert.ok(serviceWorker.includes(`./${asset}`),`Service worker does not retire stale UI safely for ${asset}`);
}

const packageJson=JSON.parse(read('package.json'));
assert.equal(packageJson.scripts?.build,'node scripts/build.mjs','Reproducible static build command is missing');
assert.equal(vercelConfig.outputDirectory,'dist','Vercel must publish the verified dist build');
assert.ok(buildSource.includes(primaryProductionUrl),'Build must publish the brown Vercel URL as the primary production identity');
assert.ok(read('sitemap.xml').includes(primaryProductionUrl),'Sitemap must target the brown Vercel production URL');
assert.ok(read('robots.txt').includes(`${primaryProductionUrl}/sitemap.xml`),'Robots file must advertise the brown Vercel sitemap');
assert.ok(read('.github/workflows/production-e2e.yml').includes(primaryProductionUrl),'Production E2E must default to the brown Vercel URL');
assert.ok(read('.github/workflows/production-diagnostics.yml').includes(primaryProductionUrl),'Production diagnostics must default to the brown Vercel URL');
assert.match(runtime,/id:'frontend',label:'Deployed frontend build'/,'Readiness must verify deployed build identity');
assert.match(runtime,/id:'auth',label:'Authentication route'/,'Readiness must verify authentication route availability');
assert.match(runtime,/id:'snapshot',label:'Connected snapshot route'/,'Readiness must verify the connected read route');
assert.ok(html.includes('IMPLEMENTED IN CURRENT BUILD'),'Public status section must identify the connected core as implemented in the source HTML before selector polish');
assert.ok(!html.includes('<h3>WORKING</h3>'),'Public feature truth still makes an unconditional working claim');

assert.ok(html.includes('OPEN PLATFORM'),'Primary platform CTA is missing');
assert.ok(!html.includes('TRY CONNECTED DEMO'),'Legacy competing CTA remains');
const e2e=read('scripts/production-e2e.mjs');
assert.ok(e2e.indexOf('/estimate`')<e2e.indexOf('/identity`'),'Production E2E must approve the estimate before identity/service start.');

console.log(`SanPaid runtime integrity passed: ${jsFiles.length} JavaScript files, ${localAssets.length} local assets, ${ids.length} unique IDs.`);
