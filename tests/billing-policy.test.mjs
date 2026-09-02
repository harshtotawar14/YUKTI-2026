import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const require=createRequire(import.meta.url);
const {DEFAULT_POLICY,money}=require('../backend/src/billing/routes.cjs');
const {migrationSql}=require('../api/_lib/db.cjs');
const root=new URL('..',import.meta.url).pathname;

test('default billing policy makes no unsupported worker deduction',()=>{
  assert.equal(DEFAULT_POLICY.cooperativeChargePercent,0);
  assert.equal(DEFAULT_POLICY.platformChargePercent,0);
  assert.equal(DEFAULT_POLICY.source,'PROTOTYPE_ZERO_DEDUCTION_DEFAULT');
});

test('money normalization is deterministic to paise precision',()=>{
  assert.equal(money(499.999),500);
  assert.equal(money(50.125),50.13);
});

test('billing module requires admin review above configured routine limit',()=>{
  const source=readFileSync(join(root,'backend/src/billing/routes.cjs'),'utf8');
  assert.match(source,/amount>policy\.routineExtraLimit/);
  assert.match(source,/ADMIN_REVIEW/);
  assert.match(source,/customerApprovalRequired/);
  assert.match(source,/c\.status='PENDING'/,'Customer decision must require an admin-cleared/routine pending charge.');
});

test('payment is idempotent by booking and creates worker ledger',()=>{
  const source=readFileSync(join(root,'backend/src/billing/routes.cjs'),'utf8');
  assert.match(source,/SELECT \* FROM payments WHERE booking_id=\$1/);
  assert.match(source,/worker_earnings_ledger/);
  assert.match(source,/idempotentReplay/);
  const migration=readFileSync(join(root,'database/migrations/003_billing_ledger.sql'),'utf8');
  assert.match(migration,/booking_id BIGINT NOT NULL UNIQUE/);
  assert.match(migration,/payment_id BIGINT NOT NULL UNIQUE/);
});

test('billing policy stores configurable cooperative and platform charges',()=>{
  const source=readFileSync(join(root,'backend/src/billing/routes.cjs'),'utf8');
  assert.match(source,/cooperative_charge_percent/);
  assert.match(source,/platform_charge_percent/);
  assert.match(source,/routine_extra_limit/);
});

test('worker dashboard reads net earnings ledger rather than gross customer payments',()=>{
  const source=readFileSync(join(root,'backend/src/worker/profile-routes.cjs'),'utf8');
  assert.match(source,/sum\(net_earnings\)/);
  assert.match(source,/WORKER_EARNINGS_LEDGER/);
  assert.doesNotMatch(source,/sum\(p\.amount\)/);
});

test('database compatibility bootstrap loads numbered migrations in sorted order',()=>{
  const migrations=migrationSql();
  const names=migrations.map(x=>x.name);
  assert.deepEqual(names,[...names].sort());
  assert.ok(names.includes('002_complaints_sla.sql'));
  assert.ok(names.includes('003_billing_ledger.sql'));
});
