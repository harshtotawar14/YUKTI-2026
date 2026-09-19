'use strict';

const {query}=require('../../../api/_lib/db.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}

function observedPlanningRow(row){
  const observedDemand30d=Number(row.demand||0);
  const eligibleCapacity=Number(row.skilled_workers||0);
  const observedGap=Math.max(0,observedDemand30d-eligibleCapacity);
  return {
    service:row.name,
    observedDemand30d,
    eligibleCapacity,
    observedGap,
    status:observedGap>2?'HIGH_SHORTAGE':observedGap>0?'MODERATE_GAP':'BALANCED',
    recommendedAction:observedGap>0?'Review consent-based capacity or training':'Monitor observed demand'
  };
}

async function overview(req,res,user){
  method(req,'GET');
  const [counts,regions,cooperatives,capacityRequests,complaints]=await Promise.all([
    query(`SELECT
      (SELECT count(*) FROM cooperatives)::int AS cooperatives,
      (SELECT count(*) FROM workers)::int AS workers,
      (SELECT count(*) FROM workers WHERE identity_status='VERIFIED')::int AS verified_workers,
      (SELECT count(*) FROM workers WHERE identity_status='VERIFIED' AND availability_status='AVAILABLE')::int AS available_workers,
      (SELECT count(*) FROM workers WHERE identity_status<>'VERIFIED')::int AS pending_verification,
      (SELECT count(*) FROM bookings)::int AS bookings,
      (SELECT count(*) FROM support_requests WHERE status=ANY(ARRAY['OPEN','IN_REVIEW','ESCALATED']))::int AS open_complaints,
      (SELECT count(*) FROM support_requests WHERE status=ANY(ARRAY['OPEN','IN_REVIEW','ESCALATED']) AND sla_due_at IS NOT NULL AND sla_due_at<now())::int AS sla_breached,
      (SELECT coalesce(sum(amount),0) FROM payments)::numeric AS payments`),
    query(`SELECT c.region,count(DISTINCT c.id)::int AS cooperatives,count(DISTINCT w.id)::int AS workers,count(DISTINCT b.id)::int AS bookings
      FROM cooperatives c LEFT JOIN workers w ON w.cooperative_id=c.id LEFT JOIN bookings b ON b.cooperative_id=c.id
      GROUP BY c.region ORDER BY c.region`),
    query(`SELECT c.id,c.name,c.region,
      count(DISTINCT w.id)::int AS workers,
      count(DISTINCT w.id) FILTER(WHERE w.identity_status='VERIFIED')::int AS verified,
      count(DISTINCT w.id) FILTER(WHERE w.identity_status='VERIFIED' AND w.availability_status='AVAILABLE')::int AS available,
      count(DISTINCT b.id)::int AS bookings
      FROM cooperatives c
      LEFT JOIN workers w ON w.cooperative_id=c.id
      LEFT JOIN bookings b ON b.cooperative_id=c.id
      GROUP BY c.id,c.name,c.region ORDER BY c.name`),
    query(`SELECT r.id,r.request_code,r.zone,r.workers_required,r.status,r.created_at,
      s.name AS service,rc.name AS requesting_cooperative,pc.name AS providing_cooperative,
      count(DISTINCT o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_workers,
      count(DISTINCT a.id)::int AS approved_workers
      FROM capacity_requests r
      JOIN services s ON s.id=r.service_id
      JOIN cooperatives rc ON rc.id=r.requesting_cooperative_id
      LEFT JOIN cooperatives pc ON pc.id=r.providing_cooperative_id
      LEFT JOIN capacity_worker_offers o ON o.capacity_request_id=r.id
      LEFT JOIN cross_cooperative_assignments a ON a.capacity_request_id=r.id
      GROUP BY r.id,s.name,rc.name,pc.name
      ORDER BY r.created_at DESC LIMIT 20`),
    query(`SELECT id,reference_code,category,severity,status,sla_due_at,escalated_at,created_at
      FROM support_requests
      WHERE status=ANY(ARRAY['OPEN','IN_REVIEW','ESCALATED'])
      ORDER BY CASE status WHEN 'ESCALATED' THEN 0 WHEN 'IN_REVIEW' THEN 1 ELSE 2 END,created_at DESC LIMIT 20`)
  ]);
  const row=counts.rows[0];
  return send(res,200,{
    ok:true,
    source:'DATABASE_AGGREGATION',
    metrics:{
      cooperatives:Number(row.cooperatives||0),
      workers:Number(row.workers||0),
      verifiedWorkers:Number(row.verified_workers||0),
      availableWorkers:Number(row.available_workers||0),
      pendingVerification:Number(row.pending_verification||0),
      bookings:Number(row.bookings||0),
      openComplaints:Number(row.open_complaints||0),
      slaBreached:Number(row.sla_breached||0),
      sandboxPaymentValue:Number(row.payments||0)
    },
    regions:regions.rows.map(x=>({name:x.region,cooperatives:Number(x.cooperatives),workers:Number(x.workers),bookings:Number(x.bookings)})),
    cooperatives:cooperatives.rows.map(x=>({id:Number(x.id),name:x.name,city:x.region,region:x.region,workers:Number(x.workers),verified:Number(x.verified),available:Number(x.available),bookings:Number(x.bookings)})),
    capacityRequests:capacityRequests.rows.map(x=>({id:Number(x.id),requestCode:x.request_code,service:x.service,zone:x.zone,requestedWorkers:Number(x.workers_required),acceptedWorkers:Number(x.accepted_workers),approvedWorkers:Number(x.approved_workers),status:x.status,requestingCooperative:x.requesting_cooperative,providingCooperative:x.providing_cooperative,requestedAt:x.created_at})),
    complaints:complaints.rows.map(x=>({id:Number(x.id),ticketNumber:x.reference_code,category:x.category,severity:x.severity,status:x.status,escalationLevel:x.status==='ESCALATED'?3:x.status==='IN_REVIEW'?2:1,slaDueAt:x.sla_due_at,escalatedAt:x.escalated_at,createdAt:x.created_at})),
    forecasts:[]
  });
}

async function planning(req,res,user){
  method(req,'GET');
  const rows=(await query(`SELECT s.id,s.name,
      count(DISTINCT b.id) FILTER(WHERE b.created_at>=now()-interval '30 days')::int AS demand,
      count(DISTINCT ws.worker_id)::int AS skilled_workers
    FROM services s
    LEFT JOIN bookings b ON b.service_id=s.id
    LEFT JOIN worker_skills ws ON ws.service_id=s.id AND ws.status='VERIFIED'
    WHERE s.active=true
    GROUP BY s.id,s.name ORDER BY demand DESC,s.name`)).rows.map(observedPlanningRow);
  const focus=rows[0]||{service:'Services',observedDemand30d:0,eligibleCapacity:0,observedGap:0,status:'BALANCED',recommendedAction:'Monitor observed demand'};
  return send(res,200,{ok:true,source:'DATABASE_AGGREGATION',service:focus.service,historicalDemand30d:focus.observedDemand30d,observedDemand30d:focus.observedDemand30d,eligibleCapacity:focus.eligibleCapacity,capacityGap:focus.observedGap,confidence:'NOT_APPLICABLE_OBSERVED_DATA',forecastMethod:'No trained forecast is claimed by this endpoint. Values are observed 30-day demand and verified skill capacity.',recommendedActions:[focus.observedGap>0?'REVIEW_TRAINING_OR_CAPACITY':'MONITOR_DEMAND'],services:rows});
}

async function workforce(req,res,user){
  method(req,'GET');
  const [workers,capacity,audits]=await Promise.all([
    query(`SELECT w.id,u.name,c.name AS cooperative,c.region,w.identity_status,w.availability_status,w.rating,w.completed_jobs,
      count(o.id)::int AS offers_received,
      count(o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_offers,
      count(o.id) FILTER(WHERE o.status='REJECTED')::int AS declined_offers
      FROM workers w JOIN users u ON u.id=w.user_id JOIN cooperatives c ON c.id=w.cooperative_id
      LEFT JOIN booking_offers o ON o.worker_id=w.id
      GROUP BY w.id,u.name,c.name,c.region ORDER BY w.rating DESC,u.name`),
    query(`SELECT s.name,
      count(DISTINCT b.id) FILTER(WHERE b.created_at>=now()-interval '30 days')::int AS demand,
      count(DISTINCT ws.worker_id)::int AS capacity
      FROM services s LEFT JOIN bookings b ON b.service_id=s.id
      LEFT JOIN worker_skills ws ON ws.service_id=s.id AND ws.status='VERIFIED'
      WHERE s.active=true GROUP BY s.id,s.name ORDER BY demand DESC,s.name LIMIT 8`),
    query(`SELECT a.event_type,a.created_at,u.name AS actor FROM audit_events a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 20`)
  ]);
  const passports=workers.rows.map(x=>{const eligible=x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE';return{id:Number(x.id),name:x.name,cooperative:x.cooperative,region:x.region,identityVerified:x.identity_status==='VERIFIED',currentEligibility:eligible?'ELIGIBLE':'REVIEW REQUIRED',completedJobs:Number(x.completed_jobs),rating:Number(x.rating),credentials:[{id:`identity-${x.id}`,name:'SanPaid Event Identity Check',status:x.identity_status,sandbox:true}]};});
  const opportunity={workers:workers.rows.map(x=>({name:x.name,offersReceived:Number(x.offers_received),acceptedOffers:Number(x.accepted_offers),declinedOffers:Number(x.declined_offers),eligibleForOpportunity:x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE',reason:x.identity_status!=='VERIFIED'?'IDENTITY_REVIEW':x.availability_status}))};
  const capacityRows=capacity.rows.map(x=>{const observedDemand=Number(x.demand||0),eligibleCapacity=Number(x.capacity||0),gap=Math.max(0,observedDemand-eligibleCapacity);return{service:x.name,observedDemand,eligibleCapacity,gap,status:gap>2?'HIGH_SHORTAGE':gap>0?'MODERATE_GAP':'BALANCED',recommendedAction:gap>0?'Review consent-based capacity or training':'Monitor observed demand'};});
  return send(res,200,{ok:true,source:'DATABASE_AGGREGATION',passports,opportunity,capacity:{metric:'OBSERVED_30_DAY_DEMAND_VS_VERIFIED_SKILL_CAPACITY',rows:capacityRows},pilot:{metrics:[{name:'Completion rate',why:'Connected completed bookings.'},{name:'Worker choice',why:'Accept and decline outcomes.'},{name:'Replacement continuity',why:'Same request survives decline.'},{name:'Trust confirmation',why:'Identity plus customer confirmation.'}]},audit:audits.rows.map(x=>({action:x.event_type,actor:x.actor||'System',createdAt:x.created_at}))});
}

async function matchProof(req,res,user,bookingId){
  method(req,'GET');
  const booking=(await query(`SELECT b.id,b.booking_code,b.status,b.service_id,s.name AS service FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.id=$1`,[bookingId])).rows[0];
  if(!booking)throw httpError(404,'Booking not found.','BOOKING_NOT_FOUND');
  const offers=(await query(`SELECT o.rank,o.status,o.matching_score,o.factor_scores,o.reason_codes,w.id AS worker_id,u.name,w.identity_status,w.availability_status,w.rating,w.demo_distance_km
      FROM booking_offers o JOIN workers w ON w.id=o.worker_id JOIN users u ON u.id=w.user_id
      WHERE o.booking_id=$1 ORDER BY o.rank,o.id`,[bookingId])).rows;
  return send(res,200,{ok:true,source:'PERSISTED_MATCHING_EVIDENCE',booking:{id:Number(booking.id),bookingCode:booking.booking_code,status:booking.status,service:booking.service},policy:'ELIGIBILITY_FIRST_CONFIGURABLE_RANKING',candidates:offers.map(x=>({rank:Number(x.rank),workerId:Number(x.worker_id),name:x.name,offerStatus:x.status,matchingScore:x.matching_score==null?null:Number(x.matching_score),factorScores:x.factor_scores||{},reasonCodes:Array.isArray(x.reason_codes)?x.reason_codes:[],identity:x.identity_status,availability:x.availability_status,rating:Number(x.rating),demoDistanceKm:Number(x.demo_distance_km)}))});
}

async function handle(req,res,path){
  const supported=path==='connected/judge/overview'||path==='connected/judge/planning'||path==='connected/judge/workforce-intelligence'||/^connected\/judge\/match\/\d+$/.test(path);
  if(!supported)return false;
  const user=await authenticate(req);allow(user,['COOPERATIVE_ADMIN','FEDERATION_ADMIN']);
  if(path==='connected/judge/overview')return overview(req,res,user),true;
  if(path==='connected/judge/planning')return planning(req,res,user),true;
  if(path==='connected/judge/workforce-intelligence')return workforce(req,res,user),true;
  const match=path.match(/^connected\/judge\/match\/(\d+)$/);if(match)return matchProof(req,res,user,Number(match[1])),true;
  return false;
}

module.exports={handle,observedPlanningRow};
