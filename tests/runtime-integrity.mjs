import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=file=>readFileSync(resolve(root,file),'utf8');
const files=readdirSync(root,{withFileTypes:true}).filter(entry=>entry.isFile()).map(entry=>entry.name);
const jsFiles=files.filter(file=>extname(file)==='.js');

for(const file of jsFiles){
  execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'pipe'});
}

const html=read('index.html');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,'index.html contains duplicate IDs');

const localAssets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match=>match[1])
  .filter(value=>!value.startsWith('#')&&!value.startsWith('http:')&&!value.startsWith('https:'));
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
assert.match(vercel,/connect-src 'self'/,'CSP must keep browser API calls same-origin');
assert.match(vercel,/sanpaid-sih-2026\.onrender\.com\/api/,'Vercel must proxy /api to the backend');

const runtime=read('connected-runtime-fix.js');
assert.match(runtime,/window\.SanPaidApi=Object\.freeze/,'Canonical API client is missing');
assert.match(runtime,/window\.SanPaidReadiness=Object\.freeze/,'Golden Demo readiness gate is missing');
assert.match(runtime,/DEFAULT_TIMEOUT_MS/,'Canonical API timeout is missing');
assert.match(read('evaluator-final.js'),/SanPaidReadiness\?\.require/,'Evaluator connected entry bypasses readiness');
assert.match(read('selector-mode.js'),/SanPaidReadiness\?\.require/,'Guided connected entry bypasses readiness');

const serviceWorker=read('service-worker.js');
assert.match(serviceWorker,/sanpaid-runtime-v68/,'Expected service-worker runtime v68');
assert.match(serviceWorker,/Promise\.allSettled/,'Service-worker precache must tolerate individual asset failure');
assert.match(serviceWorker,/pathname\.startsWith\('\/api\/'\)/,'Service worker must not cache API requests');

assert.ok(html.includes('START GOLDEN DEMO'),'Primary Golden Demo CTA is missing');
assert.ok(!html.includes('TRY CONNECTED DEMO'),'Legacy competing demo CTA remains');

console.log(`SanPaid runtime integrity passed: ${jsFiles.length} JavaScript files, ${localAssets.length} local assets, ${ids.length} unique IDs.`);
