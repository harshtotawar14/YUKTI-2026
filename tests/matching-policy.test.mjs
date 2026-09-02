import test from 'node:test';
import assert from 'node:assert/strict';
import policy from '../backend/src/matching/prototype-policy.cjs';

const {scoreCandidates,eligibilityReasons,distanceScore,PROTOTYPE_WEIGHTS}=policy;

function worker(overrides={}){
  return {id:1,user_active:true,identity_status:'VERIFIED',skill_status:'VERIFIED',availability_status:'AVAILABLE',rating:4.8,completed_jobs:4,demo_distance_km:4,recent_offers:3,...overrides};
}

test('matching weights sum to one',()=>{
  const total=Object.values(PROTOTYPE_WEIGHTS).reduce((sum,x)=>sum+x,0);
  assert.equal(Number(total.toFixed(6)),1);
});

test('ineligible workers are excluded before ranking',()=>{
  const rows=[worker({id:1}),worker({id:2,identity_status:'PENDING'}),worker({id:3,skill_status:'EXPIRED'}),worker({id:4,availability_status:'OFFLINE'}),worker({id:5,demo_distance_km:40})];
  const ranked=scoreCandidates(rows,{preferredRadiusKm:20});
  assert.deepEqual(ranked.map(x=>x.id),[1]);
  assert.ok(eligibilityReasons(rows[1]).includes('IDENTITY_NOT_VERIFIED'));
  assert.ok(eligibilityReasons(rows[2]).includes('SKILL_NOT_VERIFIED'));
  assert.ok(eligibilityReasons(rows[3]).includes('WORKER_NOT_AVAILABLE'));
  assert.ok(eligibilityReasons(rows[4]).includes('OUTSIDE_DEMO_POLICY_RADIUS'));
});

test('closer equally reliable worker ranks higher',()=>{
  const ranked=scoreCandidates([worker({id:1,demo_distance_km:3}),worker({id:2,demo_distance_km:12})]);
  assert.equal(ranked[0].id,1);
  assert.ok(ranked[0].factors.distance>ranked[1].factors.distance);
});

test('lower recent workload/opportunity concentration improves fairness factors',()=>{
  const ranked=scoreCandidates([
    worker({id:1,completed_jobs:20,recent_offers:20,demo_distance_km:5,rating:4.8}),
    worker({id:2,completed_jobs:2,recent_offers:2,demo_distance_km:5,rating:4.8})
  ]);
  assert.equal(ranked[0].id,2);
  assert.ok(ranked[0].factors.workloadBalance>ranked[1].factors.workloadBalance);
  assert.ok(ranked[0].factors.opportunityFairness>ranked[1].factors.opportunityFairness);
});

test('ranking emits persisted explanation-ready factors and reason codes',()=>{
  const [ranked]=scoreCandidates([worker()]);
  assert.ok(ranked.score>0&&ranked.score<=100);
  assert.equal(typeof ranked.factors.distance,'number');
  assert.ok(ranked.reasonCodes.includes('ELIGIBILITY_VERIFIED'));
});

test('distance score is bounded and respects prototype radius',()=>{
  assert.equal(distanceScore(25,{preferredRadiusKm:20}),0);
  assert.ok(distanceScore(2,{preferredRadiusKm:20})>distanceScore(15,{preferredRadiusKm:20}));
});
