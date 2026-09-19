import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const require=createRequire(import.meta.url);
const auth=require('../backend/src/auth/routes.cjs');
const demo=require('../api/_lib/demo-access.cjs');
const root=new URL('..',import.meta.url).pathname;

test('login throttle hashes address and identifier instead of storing them raw',()=>{
  const req={headers:{'x-forwarded-for':'203.0.113.42, 10.0.0.1'}};
  assert.equal(auth.clientAddress(req),'203.0.113.42');
  const key=auth.throttleKey(req,'Person@Example.com');
  assert.match(key,/^[a-f0-9]{64}$/);
  assert.ok(!key.includes('example.com'));
  assert.ok(!key.includes('203.0.113.42'));
});

test('login throttle contract is bounded and durable',()=>{
  assert.equal(auth.MAX_FAILURES,8);
  assert.equal(auth.WINDOW_MINUTES,15);
  assert.equal(auth.BLOCK_MINUTES,15);
  const source=readFileSync(join(root,'backend/src/auth/routes.cjs'),'utf8');
  assert.match(source,/auth_login_throttle/);
  assert.doesNotMatch(source,/new Map\(/);
});

test('auth throttle schema stores only hashed key and counters',()=>{
  const sql=readFileSync(join(root,'database/migrations/004_auth_throttle.sql'),'utf8');
  assert.match(sql,/key_hash TEXT PRIMARY KEY/);
  assert.doesNotMatch(sql,/email TEXT/);
  assert.doesNotMatch(sql,/ip_address/);
});

test('stable API adapter owns authentication before legacy catch-all',()=>{
  const index=readFileSync(join(root,'api/index.js'),'utf8');
  assert.match(index,/auth\.handle\(req,res,rawPath\)/);
  assert.ok(index.indexOf('auth.handle')<index.indexOf('return handler(req,res)'));
  assert.match(index,/Retry-After/);
});

test('normal browser session cookie remains HttpOnly Secure SameSite Lax',()=>{
  const security=readFileSync(join(root,'api/_lib/security.cjs'),'utf8');
  assert.match(security,/HttpOnly; Secure; SameSite=Lax/);
});

test('public SIH demo credential is limited to the five isolated demo accounts',()=>{
  assert.equal(demo.DEMO_ACCOUNTS.length,5);
  for(const account of demo.DEMO_ACCOUNTS)assert.equal(demo.isPublicDemoCredential(account.email,demo.PUBLIC_DEMO_PASSWORD),true);
  assert.equal(demo.isPublicDemoCredential('someone@example.com',demo.PUBLIC_DEMO_PASSWORD),false);
  assert.equal(demo.isPublicDemoCredential('admin.connected@sanpaid.demo','wrong-password'),false);
});

test('demo seeding never upgrades arbitrary worker accounts or arbitrary skills',()=>{
  const source=readFileSync(join(root,'api/_lib/db.cjs'),'utf8');
  assert.match(source,/DEMO_WORKER_EMAILS/);
  assert.match(source,/email=ANY\(\$1::text\[\]\)/);
  assert.doesNotMatch(source,/WHERE role='WORKER' ORDER BY email/);
  assert.match(source,/WHERE u\.email=ANY\(\$1::text\[\]\)/);
});

test('stable auth is the only login implementation',()=>{
  const legacy=readFileSync(join(root,'api/[...path].js'),'utf8');
  assert.doesNotMatch(legacy,/async function authRoutes/);
  assert.doesNotMatch(legacy,/loginAttempts=new Map/);
  const stable=readFileSync(join(root,'backend/src/auth/routes.cjs'),'utf8');
  assert.match(stable,/auth\/demo-access/);
  assert.match(stable,/isPublicDemoCredential/);
});

test('login UI obtains public demo credentials from backend instead of embedding them',()=>{
  const ui=readFileSync(join(root,'auth-unified.js'),'utf8');
  assert.match(ui,/\/api\/auth\/demo-access/);
  assert.match(ui,/spuUseDemo/);
  assert.doesNotMatch(ui,/SanPaid@26089/);
});

test('worker demo selector uses an explicit DOM collection before forEach',()=>{
  const ui=readFileSync(join(root,'auth-unified.js'),'utf8');
  assert.match(ui,/querySelectorAll\('\[data-spu-worker-demo\]'\)/);
  assert.doesNotMatch(ui,/\$\('\[data-spu-worker-demo\]'[^\n]*\.forEach/);
});
