import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {extname, join, relative} from 'node:path';

const root=new URL('..',import.meta.url).pathname;
const html=readFileSync(join(root,'index.html'),'utf8');

function walk(dir){
  const out=[];
  for(const name of readdirSync(dir)){
    if(['node_modules','dist','.git'].includes(name))continue;
    const path=join(dir,name);
    const stat=statSync(path);
    if(stat.isDirectory())out.push(...walk(path));
    else out.push(path);
  }
  return out;
}
const files=walk(root);
const scripts=files.filter(file=>extname(file)==='.js'||extname(file)==='.mjs'||extname(file)==='.cjs');
const scriptText=scripts.map(file=>readFileSync(file,'utf8')).join('\n');

function attrs(tag){
  const out={};
  for(const match of tag.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)){
    const key=match[1].toLowerCase();
    if(key==='button'||key==='a'||key==='input'||key==='select'||key==='textarea'||key==='form'||key==='label')continue;
    out[key]=match[2]??match[3]??match[4]??'';
  }
  return out;
}

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const buttons=[...html.matchAll(/<button\b[^>]*>/gi)].map(m=>({tag:m[0],a:attrs(m[0])}));
const controls=[...html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)].map(m=>({kind:m[1].toLowerCase(),tag:m[0],a:attrs(m[0])}));
const links=[...html.matchAll(/<a\b[^>]*>/gi)].map(m=>({tag:m[0],a:attrs(m[0])}));

const delegatedButtonAttrs=new Set([
  'data-eval-open-connected','data-open-selector','data-service','data-role','data-action','data-tab','data-demo-action',
  'data-booking-action','data-workspace-action','data-portal-action','data-close','data-open-role','data-auth-action','data-capacity-action'
]);

function idReferenced(id){
  const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`(?:#${escaped}\\b|getElementById\\(["']${escaped}["']\\)|querySelector\\(["']#${escaped}["']\\))`).test(scriptText);
}
function delegated(a){return Object.keys(a).some(key=>delegatedButtonAttrs.has(key)||key.startsWith('data-eval-')||key.startsWith('data-open-'));}

test('index has no duplicate ids',()=>{
  const duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  assert.deepEqual(duplicates,[],`Duplicate DOM ids: ${duplicates.join(', ')}`);
});

test('all buttons declare type and have an interaction owner',()=>{
  const failures=[];
  for(const {tag,a} of buttons){
    if(!a.type)failures.push(`Missing type: ${tag}`);
    const interactive=Boolean(a.id&&idReferenced(a.id))||delegated(a)||a.disabled!==undefined;
    if(!interactive)failures.push(`No JS owner/data action: ${tag}`);
  }
  assert.deepEqual(failures,[],failures.join('\n'));
});

test('form controls have accessible names',()=>{
  const failures=[];
  for(const {tag,a} of controls){
    const named=Boolean(a['aria-label']||a['aria-labelledby']||a.title||a.placeholder||a.id&&new RegExp(`<label\\b[^>]*for=["']${a.id}["']`,'i').test(html));
    if(!named)failures.push(tag);
  }
  assert.deepEqual(failures,[],`Unnamed controls:\n${failures.join('\n')}`);
});

test('aria-controls targets exist',()=>{
  const failures=[];
  for(const match of html.matchAll(/aria-controls="([^"]+)"/g))if(!ids.includes(match[1]))failures.push(match[1]);
  assert.deepEqual(failures,[],`Missing aria-controls targets: ${failures.join(', ')}`);
});

test('local stylesheet/script/image/manifest assets referenced by index exist',()=>{
  const refs=[];
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const value=match[1];
    if(!value||value.startsWith('#')||/^https?:\/\//.test(value)||value.startsWith('data:')||value.startsWith('mailto:')||value.startsWith('tel:'))continue;
    refs.push(value.split(/[?#]/)[0]);
  }
  const missing=[...new Set(refs.filter(ref=>!existsSync(join(root,ref))) )];
  assert.deepEqual(missing,[],`Missing local assets: ${missing.join(', ')}`);
});

test('navigation does not contain empty or javascript pseudo-links',()=>{
  const bad=links.filter(({a})=>!a.href||/^javascript:/i.test(a.href)).map(({tag})=>tag);
  assert.deepEqual(bad,[],`Invalid links:\n${bad.join('\n')}`);
});

test('visible evaluator-critical controls are present and wired',()=>{
  const critical=['connectedDemoBtn','getStarted','menuBtn','heroMatchingCta','runMatchBtn','evalRunRanking','evalResetMatch','evalOpenConnected','evalAdminPrototype','evalCapacityAction','evalFinalPrototype','evalFinalArchitecture'];
  const missing=critical.filter(id=>!ids.includes(id));
  const unwired=critical.filter(id=>ids.includes(id)&&!idReferenced(id)&&!new RegExp(`id=["']${id}["'][^>]*(?:data-eval-|data-open-)`).test(html));
  assert.deepEqual(missing,[],`Missing critical controls: ${missing.join(', ')}`);
  assert.deepEqual(unwired,[],`Unwired critical controls: ${unwired.join(', ')}`);
});

test('deploy build explicitly strips the permanently hidden legacy quick-access block',()=>{
  const build=readFileSync(join(root,'scripts/build.mjs'),'utf8');
  assert.match(build,/quick-booking-details/,'Build must remove the permanently hidden duplicate quick-access block from dist.');
});

test('public runtime has no obvious dead placeholder actions',()=>{
  const suspicious=[];
  for(const file of scripts){
    const rel=relative(root,file);
    if(rel.startsWith('tests/')||rel.startsWith('scripts/'))continue;
    const text=readFileSync(file,'utf8');
    if(/TODO[:\s]|FIXME[:\s]|alert\(\s*["'](?:TODO|Coming soon|Not implemented)/i.test(text))suspicious.push(rel);
  }
  assert.deepEqual(suspicious,[],`Placeholder runtime code found: ${suspicious.join(', ')}`);
});
