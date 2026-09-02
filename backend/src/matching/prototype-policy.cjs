'use strict';

const PROTOTYPE_WEIGHTS=Object.freeze({
  skillFit:0.35,
  distance:0.25,
  reliability:0.20,
  workloadBalance:0.10,
  opportunityFairness:0.10
});

function clamp(value,min=0,max=100){return Math.max(min,Math.min(max,Number(value)||0));}
function round(value){return Math.round((Number(value)||0)*100)/100;}

function distanceScore(distanceKm,{preferredRadiusKm=20}={}){
  const distance=Math.max(0,Number(distanceKm)||0);
  const radius=Math.max(1,Number(preferredRadiusKm)||20);
  if(distance>radius)return 0;
  return round(clamp(100-(distance/radius)*70));
}

function reliabilityScore(rating){
  const normalized=(Math.max(0,Math.min(5,Number(rating)||0))/5)*100;
  return round(normalized);
}

function inversePeerScore(value,maxValue){
  const current=Math.max(0,Number(value)||0);
  const max=Math.max(0,Number(maxValue)||0);
  if(max===0)return 100;
  return round(clamp(100-(current/max)*70));
}

function eligibilityReasons(candidate,{preferredRadiusKm=20}={}){
  const reasons=[];
  if(candidate.user_active===false)reasons.push('WORKER_INACTIVE');
  if(String(candidate.identity_status||'').toUpperCase()!=='VERIFIED')reasons.push('IDENTITY_NOT_VERIFIED');
  if(String(candidate.skill_status||'').toUpperCase()!=='VERIFIED')reasons.push('SKILL_NOT_VERIFIED');
  if(String(candidate.availability_status||'').toUpperCase()!=='AVAILABLE')reasons.push('WORKER_NOT_AVAILABLE');
  if(Number(candidate.demo_distance_km)>Number(preferredRadiusKm))reasons.push('OUTSIDE_DEMO_POLICY_RADIUS');
  return reasons;
}

function scoreCandidates(rows,{preferredRadiusKm=20}={}){
  const eligible=rows.filter(row=>eligibilityReasons(row,{preferredRadiusKm}).length===0);
  const maxCompleted=Math.max(0,...eligible.map(row=>Number(row.completed_jobs)||0));
  const maxRecentOffers=Math.max(0,...eligible.map(row=>Number(row.recent_offers)||0));

  return eligible.map(row=>{
    const factors={
      skillFit:100,
      distance:distanceScore(row.demo_distance_km,{preferredRadiusKm}),
      reliability:reliabilityScore(row.rating),
      workloadBalance:inversePeerScore(row.completed_jobs,maxCompleted),
      opportunityFairness:inversePeerScore(row.recent_offers,maxRecentOffers)
    };
    const score=round(Object.entries(PROTOTYPE_WEIGHTS).reduce((sum,[key,weight])=>sum+(factors[key]*weight),0));
    const reasonCodes=[
      'ELIGIBILITY_VERIFIED',
      `DISTANCE_${factors.distance>=70?'STRONG':'ACCEPTABLE'}`,
      `RELIABILITY_${factors.reliability>=90?'STRONG':'ELIGIBLE'}`,
      `WORKLOAD_BALANCE_${factors.workloadBalance>=70?'FAVORED':'NEUTRAL'}`,
      `OPPORTUNITY_FAIRNESS_${factors.opportunityFairness>=70?'FAVORED':'NEUTRAL'}`
    ];
    return {...row,score,factors,reasonCodes};
  }).sort((a,b)=>b.score-a.score||Number(a.demo_distance_km)-Number(b.demo_distance_km)||Number(a.id)-Number(b.id));
}

module.exports={PROTOTYPE_WEIGHTS,distanceScore,reliabilityScore,eligibilityReasons,scoreCandidates};
