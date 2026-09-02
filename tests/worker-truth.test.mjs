import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const require=createRequire(import.meta.url);
const {DEFAULT_SLOT_GUIDANCE}=require('../backend/src/worker/profile-routes.cjs');
const root=new URL('..',import.meta.url).pathname;

test('default schedule guidance is suggestion-only and not persisted on read',()=>{
  assert.equal(DEFAULT_SLOT_GUIDANCE.length,4);
  assert.ok(DEFAULT_SLOT_GUIDANCE.every(slot=>slot.persisted===false&&slot.status==='SUGGESTED'));
  const source=readFileSync(join(root,'backend/src/worker/profile-routes.cjs'),'utf8');
  const getBlock=source.match(/if\(req\.method==='GET'\)\{([\s\S]*?)\n  \}/);
  assert.ok(getBlock,'GET schedule block must exist');
  assert.doesNotMatch(getBlock[1],/INSERT INTO worker_schedule/,'GET schedule must never create database rows.');
});

test('worker passport derives cooperative from database and labels credential scope',()=>{
  const source=readFileSync(join(root,'backend/src/worker/profile-routes.cjs'),'utf8');
  assert.match(source,/JOIN cooperatives c ON c\.id=w\.cooperative_id/);
  assert.doesNotMatch(source,/cooperative:'YUKTI Community Services Cooperative'/);
  assert.match(source,/SANPAID_SERVICE_HISTORY_NOT_GOVERNMENT_CERTIFICATE/);
});

test('stable API adapter owns worker profile routes before legacy catch-all',()=>{
  const index=readFileSync(join(root,'api/index.js'),'utf8');
  assert.match(index,/workerProfile\.handle\(req,res,rawPath\)/);
});
