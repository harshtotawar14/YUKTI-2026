import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const require=createRequire(import.meta.url);
const {observedPlanningRow}=require('../backend/src/judge/truth-routes.cjs');
const root=new URL('..',import.meta.url).pathname;

test('observed planning keeps real zero demand as zero',()=>{
  const row=observedPlanningRow({name:'Electrician',demand:0,skilled_workers:2});
  assert.equal(row.observedDemand30d,0);
  assert.equal(row.eligibleCapacity,2);
  assert.equal(row.observedGap,0);
  assert.equal(row.status,'BALANCED');
});

test('observed planning reports shortages without synthetic demand floor',()=>{
  const row=observedPlanningRow({name:'Plumber',demand:5,skilled_workers:2});
  assert.equal(row.observedDemand30d,5);
  assert.equal(row.observedGap,3);
  assert.equal(row.status,'HIGH_SHORTAGE');
});

test('active API adapter owns judge truth routes before legacy catch-all',()=>{
  const index=readFileSync(join(root,'api/index.js'),'utf8');
  assert.match(index,/judgeTruth\.handle\(req,res,rawPath\)/);
});

test('modular judge truth route does not fabricate one unit of demand',()=>{
  const source=readFileSync(join(root,'backend/src/judge/truth-routes.cjs'),'utf8');
  assert.doesNotMatch(source,/Math\.max\(1\s*,/);
  assert.doesNotMatch(source,/expectedDemand\s*:\s*Math\.max\(1/);
  assert.match(source,/No trained forecast is claimed by this endpoint/);
});

test('worker-facing initial opportunity remains address-private',()=>{
  const api=readFileSync(join(root,'api/[...path].js'),'utf8');
  const match=api.match(/function offerJson\(row\)\{([^}]+)\}/);
  assert.ok(match,'offerJson must exist');
  assert.doesNotMatch(match[1],/address/,'Initial worker offer must not expose exact customer address.');
});

test('federation overview contract includes privacy-safe network operations data',()=>{
  const source=readFileSync(join(root,'backend/src/judge/truth-routes.cjs'),'utf8');
  for(const field of ['verifiedWorkers','availableWorkers','pendingVerification','slaBreached','cooperatives:','capacityRequests:','complaints:']){
    assert.ok(source.includes(field),`Federation overview contract is missing ${field}`);
  }
  assert.match(source,/cross_cooperative_assignments/,'Federation capacity summary must include approved cross-cooperative assignments.');
  assert.doesNotMatch(source,/u\.email|customer.*email|worker.*email/i,'Federation overview must not expose individual user email data.');
});
