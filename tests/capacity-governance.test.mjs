import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const root=new URL('..',import.meta.url).pathname;
const source=readFileSync(join(root,'backend/src/capacity/routes.cjs'),'utf8');

test('capacity exchange never auto-transfers workers',()=>{
  assert.match(source,/automaticTransfer:false/);
  assert.match(source,/Worker consent/);
  assert.match(source,/Authorized approval is still required/);
});

test('worker consent is persisted before federation approval',()=>{
  assert.match(source,/consented_at=now\(\)/);
  assert.match(source,/request\.status!=='CONSENT_READY'/);
  assert.match(source,/CAPACITY_CONSENT_REQUIRED/);
});

test('cross-cooperative assignment records accountability fields',()=>{
  const sql=readFileSync(join(root,'database/migrations/005_capacity_governance.sql'),'utf8');
  for(const field of ['home_cooperative_id','serving_cooperative_id','complaint_owner_cooperative_id','worker_consent_at','approved_by','payment_responsibility'])assert.match(sql,new RegExp(field));
});

test('responsibility split is explicit and must total 100 percent',()=>{
  assert.match(source,/homeShare\+servingShare!==100/);
  assert.match(source,/CAPACITY_SPLIT/);
  assert.match(source,/CAPACITY_ASSIGNMENT_RESPONSIBILITY_NOT_WORKER_WAGE_DEDUCTION/);
});

test('provider cooperative must differ from requesting cooperative',()=>{
  assert.match(source,/CAPACITY_SAME_COOPERATIVE/);
});

test('worker rejection does not create assignment or penalty',()=>{
  assert.match(source,/No transfer or penalty was applied/);
  const rejectionBlock=source.match(/if\(action==='REJECT'\)\{([\s\S]*?)return \{status:'REJECTED'/);
  assert.ok(rejectionBlock);
  assert.doesNotMatch(rejectionBlock[1],/cross_cooperative_assignments/);
});

test('stable API adapter owns capacity routes before legacy catch-all',()=>{
  const index=readFileSync(join(root,'api/index.js'),'utf8');
  assert.match(index,/capacity\.handle\(req,res,rawPath\)/);
});
