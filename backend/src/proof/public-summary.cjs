'use strict';

const {query}=require('../../../api/_lib/db.cjs');

function send(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(payload));}

async function handle(req,res,path){
  if(String(path||'').replace(/^\/+|\/+$/g,'')!=='public-proof/summary')return false;
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED',message:'Use GET for this endpoint.'})||true;
  }

  const [counts,workers,capacity]=await Promise.all([
    query(`SELECT
      (SELECT count(*) FROM services WHERE active=true)::int AS services,
      (SELECT count(*) FROM workers WHERE identity_status='VERIFIED')::int AS workers,
      (SELECT count(*) FROM cooperatives)::int AS cooperatives`),
    query(`SELECT w.id,u.name,w.identity_status,w.availability_status,w.rating,w.completed_jobs,w.demo_distance_km,
      c.name AS cooperative_name,c.region AS cooperative_region,
      count(o.id)::int AS offers_received,
      count(o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_offers,
      count(o.id) FILTER(WHERE o.status='REJECTED')::int AS declined_offers
      FROM workers w
      JOIN users u ON u.id=w.user_id
      JOIN cooperatives c ON c.id=w.cooperative_id
      LEFT JOIN booking_offers o ON o.worker_id=w.id
      GROUP BY w.id,u.name,c.name,c.region
      ORDER BY w.rating DESC,w.id ASC`),
    query(`SELECT s.name AS service,c.name AS cooperative,c.region,
      count(b.id) FILTER(WHERE b.created_at>=now()-interval '30 days')::int AS observed_demand_30d,
      count(DISTINCT ws.worker_id) FILTER(WHERE ws.status='VERIFIED' AND w.identity_status='VERIFIED' AND w.availability_status='AVAILABLE')::int AS eligible_capacity
      FROM services s
      CROSS JOIN cooperatives c
      LEFT JOIN bookings b ON b.service_id=s.id AND b.cooperative_id=c.id
      LEFT JOIN worker_skills ws ON ws.service_id=s.id
      LEFT JOIN workers w ON w.id=ws.worker_id AND w.cooperative_id=c.id
      WHERE s.active=true
      GROUP BY s.id,c.id
      ORDER BY observed_demand_30d DESC,s.name,c.name
      LIMIT 12`)
  ]);

  const workerRows=workers.rows.map(row=>({
    id:Number(row.id),
    name:row.name,
    identityVerified:row.identity_status==='VERIFIED',
    availabilityStatus:row.availability_status,
    currentEligibility:row.identity_status==='VERIFIED'&&row.availability_status==='AVAILABLE'?'ELIGIBLE':'REVIEW_REQUIRED',
    completedJobs:Number(row.completed_jobs),
    rating:Number(row.rating),
    demoDistanceKm:Number(row.demo_distance_km),
    offersReceived:Number(row.offers_received),
    acceptedOffers:Number(row.accepted_offers),
    declinedOffers:Number(row.declined_offers),
    cooperative:row.cooperative_name,
    region:row.cooperative_region,
    credential:{id:`identity-${row.id}`,name:'Event Identity Check',status:row.identity_status,scope:'SANPAID_DEMO'}
  }));

  const rows=capacity.rows.map(row=>{
    const observedDemand=Number(row.observed_demand_30d);
    const eligibleCapacity=Number(row.eligible_capacity);
    const observedGap=Math.max(0,observedDemand-eligibleCapacity);
    return {
      cooperative:row.cooperative,
      region:row.region,
      service:row.service,
      observedDemand30d:observedDemand,
      eligibleCapacity,
      observedGap,
      status:observedGap>2?'HIGH_SHORTAGE':observedGap>0?'MODERATE_GAP':'BALANCED',
      recommendedAction:observedGap>0?'Review consent-based capacity or training needs':'Monitor observed demand and capacity'
    };
  });

  send(res,200,{
    ok:true,
    source:'DATABASE_CONFIGURATION',
    ...counts.rows[0],
    capabilities:{
      implemented:['worker-choice','same-booking-reassignment','dual-service-start','audit-evidence'],
      sandbox:['identity-verification','payment','distance'],
      future:['production-kYC','production-payments','maps-routes','government-welfare-integrations']
    },
    fairOpportunity:{workers:workerRows},
    workerTrust:{workers:workerRows},
    capacityMap:{
      dataMeaning:'OBSERVED_DATABASE_DATA_ONLY',
      forecastStatus:'NO_ML_FORECAST_CLAIM_IN_PUBLIC_PROOF',
      rows
    },
    pilot:{metrics:[
      {name:'Booking completion rate',why:'Measure completed connected bookings.'},
      {name:'Worker acceptance rate',why:'Measure opportunity choice without forced assignment.'},
      {name:'Replacement continuity',why:'Measure same-booking reassignment after decline.'},
      {name:'Customer trust confirmation',why:'Measure dual service-start completion.'}
    ]}
  });
  return true;
}

module.exports={handle};
