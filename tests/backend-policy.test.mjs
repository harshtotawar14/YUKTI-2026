import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {transition,normalizeRole,publicUser}=require('../api/_lib/policy.cjs');
const {hashPassword,verifyPassword,sha256}=require('../api/_lib/security.cjs');

test('canonical booking lifecycle accepts only valid transitions',()=>{
  assert.equal(transition('travel','ACCEPTED'),'ON_THE_WAY');
  assert.equal(transition('arrive','ON_THE_WAY'),'ARRIVED');
  assert.equal(transition('identity','ARRIVED'),'IDENTITY_VERIFIED');
  assert.equal(transition('confirmWorker','IDENTITY_VERIFIED'),'CUSTOMER_CONFIRMED');
  assert.equal(transition('start','CUSTOMER_CONFIRMED'),'IN_PROGRESS');
  assert.equal(transition('completionRequest','IN_PROGRESS'),'AWAITING_CUSTOMER_CONFIRMATION');
  assert.equal(transition('complete','AWAITING_CUSTOMER_CONFIRMATION'),'COMPLETED');
  assert.equal(transition('pay','COMPLETED'),'PAID');
  assert.throws(()=>transition('start','ARRIVED'),error=>error.status===409);
});

test('roles and public session user are normalized',()=>{
  assert.equal(normalizeRole('admin'),'COOPERATIVE_ADMIN');
  assert.deepEqual(publicUser({id:'7',email:'a@example.com',name:'A',role:'WORKER',cooperative_id:'2'}),{id:7,email:'a@example.com',name:'A',role:'WORKER',cooperativeId:2});
});

test('demo passwords use salted scrypt and tokens are hashed',async()=>{
  const first=await hashPassword('correct horse battery staple');
  const second=await hashPassword('correct horse battery staple');
  assert.notEqual(first,second);
  assert.equal(await verifyPassword('correct horse battery staple',first),true);
  assert.equal(await verifyPassword('wrong',first),false);
  assert.equal(sha256('token').length,64);
});
