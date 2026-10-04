'use strict';

const {query}=require('../../../api/_lib/db.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');
const {isScopedDemoEmail}=require('../../../api/_lib/demo-workspace.cjs');

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}

async function readiness(req,res,user){
  method(req,'GET');
  const row=(await query(`SELECT
    (SELECT count(*)::int FROM workers WHERE cooperative_id=$1 AND identity_status='VERIFIED') AS verified_workers,
    (SELECT count(*)::int FROM services WHERE active=true) AS services,
    (SELECT count(*)::int FROM users WHERE cooperative_id=$1) AS users`,[user.cooperative_id])).rows[0];
  return send(res,200,{ok:true,ready:Number(row.users)>=5&&Number(row.verified_workers)>=2&&Number(row.services)>=10,checks:{database:true,authentication:true,serviceCatalog:Number(row.services)>=10,verifiedWorkers:Number(row.verified_workers)>=2},counts:{users:Number(row.users),verified_workers:Number(row.verified_workers),services:Number(row.services)}});
}

async function latestBooking(req,res,user){
  method(req,'GET');
  const row=(await query(`SELECT b.id,b.booking_code,b.status,b.zone,b.address,b.problem,b.scheduled_at,b.emergency,b.base_amount,b.created_at,b.updated_at,s.name AS service,s.icon AS service_icon,u.name AS customer_name,wu.name AS worker_name,w.id AS assigned_worker_id,w.identity_status AS worker_verification,w.demo_distance_km AS distance
    FROM bookings b JOIN services s ON s.id=b.service_id JOIN users u ON u.id=b.customer_id LEFT JOIN workers w ON w.id=b.assigned_worker_id LEFT JOIN users wu ON wu.id=w.user_id
    WHERE b.cooperative_id=$1 ORDER BY b.created_at DESC LIMIT 1`,[user.cooperative_id])).rows[0];
  return send(res,200,{booking:row?{id:Number(row.id),bookingCode:row.booking_code,status:row.status,service:row.service,serviceIcon:row.service_icon,zone:row.zone,address:row.address,problem:row.problem,scheduledAt:row.scheduled_at,emergency:row.emergency,total:Number(row.base_amount),workerId:row.assigned_worker_id?Number(row.assigned_worker_id):null,workerName:row.worker_name||null,workerVerification:row.worker_verification||null,distance:row.distance==null?null:Number(row.distance),cooperative:'YUKTI Community Services Cooperative',createdAt:row.created_at,updatedAt:row.updated_at}:null});
}

async function overview(req,res,user){
  method(req,'GET');const id=Number(user.cooperative_id);
  const [counts,coop,capacityRequests,complaints]=await Promise.all([
    query(`SELECT
      (SELECT count(*)::int FROM workers WHERE cooperative_id=$1) AS workers,
      (SELECT count(*)::int FROM workers WHERE cooperative_id=$1 AND identity_status='VERIFIED') AS verified_workers,
      (SELECT count(*)::int FROM workers WHERE cooperative_id=$1 AND identity_status='VERIFIED' AND availability_status='AVAILABLE') AS available_workers,
      (SELECT count(*)::int FROM workers WHERE cooperative_id=$1 AND identity_status<>'VERIFIED') AS pending_verification,
      (SELECT count(*)::int FROM bookings WHERE cooperative_id=$1) AS bookings,
      (SELECT count(*)::int FROM support_requests WHERE cooperative_id=$1 AND status=ANY(ARRAY['OPEN','IN_REVIEW','ESCALATED'])) AS open_complaints,
      (SELECT count(*)::int FROM support_requests WHERE cooperative_id=$1 AND status=ANY(ARRAY['OPEN','IN_REVIEW','ESCALATED']) AND sla_due_at IS NOT NULL AND sla_due_at<now()) AS sla_breached,
      (SELECT coalesce(sum(p.amount),0)::numeric FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.cooperative_id=$1) AS payments`,[id]),
    query('SELECT id,region FROM cooperatives WHERE id=$1',[id]),
    query(`SELECT r.id,r.request_code,r.zone,r.workers_required,r.status,r.created_at,s.name AS service,
      count(DISTINCT o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_workers,count(DISTINCT a.id)::int AS approved_workers
      FROM capacity_requests r JOIN services s ON s.id=r.service_id LEFT JOIN capacity_worker_offers o ON o.capacity_request_id=r.id LEFT JOIN cross_cooperative_assignments a ON a.capacity_request_id=r.id
      WHERE r.requesting_cooperative_id=$1 OR r.providing_cooperative_id=$1 GROUP BY r.id,s.name ORDER BY r.created_at DESC LIMIT 20`,[id]),
    query(`SELECT id,reference_code,category,severity,status,sla_due_at,escalated_at,created_at FROM support_requests
      WHERE cooperative_id=$1 AND status=ANY(ARRAY['OPEN','IN_REVIEW','ESCALATED']) ORDER BY created_at DESC LIMIT 20`,[id])
  ]);
  const row=counts.rows[0]||{},region=coop.rows[0]?.region||'Kolhapur, Maharashtra';
  return send(res,200,{ok:true,source:'DATABASE_AGGREGATION',metrics:{cooperatives:1,workers:Number(row.workers||0),verifiedWorkers:Number(row.verified_workers||0),availableWorkers:Number(row.available_workers||0),pendingVerification:Number(row.pending_verification||0),bookings:Number(row.bookings||0),openComplaints:Number(row.open_complaints||0),slaBreached:Number(row.sla_breached||0),sandboxPaymentValue:Number(row.payments||0)},regions:[{name:region,cooperatives:1,workers:Number(row.workers||0),bookings:Number(row.bookings||0)}],cooperatives:[{id,name:'YUKTI Community Services Cooperative',city:String(region).split(',')[0],region,workers:Number(row.workers||0),verified:Number(row.verified_workers||0),available:Number(row.available_workers||0),bookings:Number(row.bookings||0)}],capacityRequests:capacityRequests.rows.map(x=>({id:Number(x.id),requestCode:x.request_code,service:x.service,zone:x.zone,requestedWorkers:Number(x.workers_required),acceptedWorkers:Number(x.accepted_workers),approvedWorkers:Number(x.approved_workers),status:x.status,requestedAt:x.created_at})),complaints:complaints.rows.map(x=>({id:Number(x.id),ticketNumber:x.reference_code,category:x.category,severity:x.severity,status:x.status,escalationLevel:x.status==='ESCALATED'?3:x.status==='IN_REVIEW'?2:1,slaDueAt:x.sla_due_at,escalatedAt:x.escalated_at,createdAt:x.created_at})),forecasts:[]});
}

async function planning(req,res,user){
  method(req,'GET');const id=Number(user.cooperative_id);
  const rows=(await query(`SELECT s.id,s.name,
    count(DISTINCT b.id) FILTER(WHERE b.created_at>=now()-interval '30 days')::int AS demand,
    count(DISTINCT ws.worker_id)::int AS skilled_workers
    FROM services s
    LEFT JOIN bookings b ON b.service_id=s.id AND b.cooperative_id=$1
    LEFT JOIN worker_skills ws ON ws.service_id=s.id AND ws.status='VERIFIED' AND EXISTS(SELECT 1 FROM workers w WHERE w.id=ws.worker_id AND w.cooperative_id=$1)
    WHERE s.active=true GROUP BY s.id,s.name ORDER BY demand DESC,s.name`,[id])).rows;
  const services=rows.map(x=>{const observedDemand30d=Number(x.demand||0),eligibleCapacity=Number(x.skilled_workers||0),observedGap=Math.max(0,observedDemand30d-eligibleCapacity);return{service:x.name,observedDemand30d,eligibleCapacity,observedGap,status:observedGap>2?'HIGH_SHORTAGE':observedGap>0?'MODERATE_GAP':'BALANCED',recommendedAction:observedGap>0?'Review consent-based capacity or training':'Monitor observed demand'};});
  const focus=services[0]||{service:'Services',observedDemand30d:0,eligibleCapacity:0,observedGap:0};
  return send(res,200,{ok:true,source:'DATABASE_AGGREGATION',service:focus.service,historicalDemand30d:focus.observedDemand30d,observedDemand30d:focus.observedDemand30d,eligibleCapacity:focus.eligibleCapacity,capacityGap:focus.observedGap,confidence:'NOT_APPLICABLE_OBSERVED_DATA',forecastMethod:'No trained forecast is claimed by this endpoint. Values are observed 30-day demand and verified skill capacity.',recommendedActions:[focus.observedGap>0?'REVIEW_TRAINING_OR_CAPACITY':'MONITOR_DEMAND'],services});
}

async function workforce(req,res,user){
  method(req,'GET');const id=Number(user.cooperative_id);
  const [workers,capacity,audits]=await Promise.all([
    query(`SELECT w.id,u.name,w.identity_status,w.availability_status,w.rating,w.completed_jobs,count(o.id)::int AS offers_received,count(o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_offers,count(o.id) FILTER(WHERE o.status='REJECTED')::int AS declined_offers
      FROM workers w JOIN users u ON u.id=w.user_id LEFT JOIN booking_offers o ON o.worker_id=w.id WHERE w.cooperative_id=$1 GROUP BY w.id,u.name ORDER BY w.rating DESC,u.name`,[id]),
    query(`SELECT s.name,count(DISTINCT b.id) FILTER(WHERE b.created_at>=now()-interval '30 days')::int AS demand,count(DISTINCT ws.worker_id)::int AS capacity
      FROM services s LEFT JOIN bookings b ON b.service_id=s.id AND b.cooperative_id=$1 LEFT JOIN worker_skills ws ON ws.service_id=s.id AND ws.status='VERIFIED' AND EXISTS(SELECT 1 FROM workers w WHERE w.id=ws.worker_id AND w.cooperative_id=$1)
      WHERE s.active=true GROUP BY s.id,s.name ORDER BY demand DESC,s.name LIMIT 8`,[id]),
    query(`SELECT a.event_type,a.created_at,u.name AS actor FROM audit_events a LEFT JOIN users u ON u.id=a.actor_user_id LEFT JOIN bookings b ON b.id=a.booking_id
      WHERE a.actor_user_id IN(SELECT id FROM users WHERE cooperative_id=$1) OR b.cooperative_id=$1 ORDER BY a.created_at DESC LIMIT 20`,[id])
  ]);
  const passports=workers.rows.map(x=>{const eligible=x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE';return{id:Number(x.id),name:x.name,cooperative:'YUKTI Community Services Cooperative',region:'Kolhapur, Maharashtra',identityVerified:x.identity_status==='VERIFIED',currentEligibility:eligible?'ELIGIBLE':'REVIEW REQUIRED',completedJobs:Number(x.completed_jobs),rating:Number(x.rating),credentials:[{id:`identity-${x.id}`,name:'SanPaid Event Identity Check',status:x.identity_status,sandbox:true}]};});
  const opportunity={workers:workers.rows.map(x=>({name:x.name,offersReceived:Number(x.offers_received),acceptedOffers:Number(x.accepted_offers),declinedOffers:Number(x.declined_offers),eligibleForOpportunity:x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE',reason:x.identity_status!=='VERIFIED'?'IDENTITY_REVIEW':x.availability_status}))};
  const capacityRows=capacity.rows.map(x=>{const observedDemand=Number(x.demand||0),eligibleCapacity=Number(x.capacity||0),gap=Math.max(0,observedDemand-eligibleCapacity);return{service:x.name,observedDemand,eligibleCapacity,gap,status:gap>2?'HIGH_SHORTAGE':gap>0?'MODERATE_GAP':'BALANCED',recommendedAction:gap>0?'Review consent-based capacity or training':'Monitor observed demand'};});
  return send(res,200,{ok:true,source:'DATABASE_AGGREGATION',passports,opportunity,capacity:{metric:'OBSERVED_30_DAY_DEMAND_VS_VERIFIED_SKILL_CAPACITY',rows:capacityRows},pilot:{metrics:[{name:'Completion rate',why:'Connected completed bookings.'},{name:'Worker choice',why:'Accept and decline outcomes.'},{name:'Replacement continuity',why:'Same request survives decline.'},{name:'Trust confirmation',why:'Identity plus customer confirmation.'}]},audit:audits.rows.map(x=>({action:x.event_type,actor:x.actor||'System',createdAt:x.created_at}))});
}

async function matchProof(req,res,user,bookingId){
  method(req,'GET');
  const booking=(await query(`SELECT b.id,b.booking_code,b.status,b.service_id,s.name AS service FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.id=$1 AND b.cooperative_id=$2`,[bookingId,user.cooperative_id])).rows[0];
  if(!booking)throw httpError(404,'Booking not found.','BOOKING_NOT_FOUND');
  const offers=(await query(`SELECT o.rank,o.status,o.matching_score,o.factor_scores,o.reason_codes,w.id AS worker_id,u.name,w.identity_status,w.availability_status,w.rating,w.demo_distance_km FROM booking_offers o JOIN workers w ON w.id=o.worker_id JOIN users u ON u.id=w.user_id WHERE o.booking_id=$1 AND w.cooperative_id=$2 ORDER BY o.rank,o.id`,[bookingId,user.cooperative_id])).rows;
  return send(res,200,{ok:true,source:'PERSISTED_MATCHING_EVIDENCE',booking:{id:Number(booking.id),bookingCode:booking.booking_code,status:booking.status,service:booking.service},policy:'ELIGIBILITY_FIRST_CONFIGURABLE_RANKING',candidates:offers.map(x=>({rank:Number(x.rank),workerId:Number(x.worker_id),name:x.name,offerStatus:x.status,matchingScore:x.matching_score==null?null:Number(x.matching_score),factorScores:x.factor_scores||{},reasonCodes:Array.isArray(x.reason_codes)?x.reason_codes:[],identity:x.identity_status,availability:x.availability_status,rating:Number(x.rating),demoDistanceKm:Number(x.demo_distance_km)}))});
}

async function handle(req,res,path){
  const supported=path==='connected/judge/readiness'||path==='connected/judge/latest-demo-booking'||path==='connected/judge/overview'||path==='connected/judge/planning'||path==='connected/judge/workforce-intelligence'||/^connected\/judge\/match\/\d+$/.test(path);
  if(!supported)return false;
  const user=await authenticate(req);allow(user,['COOPERATIVE_ADMIN','FEDERATION_ADMIN']);
  if(!isScopedDemoEmail(user.email))return false;
  if(path==='connected/judge/readiness'){await readiness(req,res,user);return true;}
  if(path==='connected/judge/latest-demo-booking'){await latestBooking(req,res,user);return true;}
  if(path==='connected/judge/overview'){await overview(req,res,user);return true;}
  if(path==='connected/judge/planning'){await planning(req,res,user);return true;}
  if(path==='connected/judge/workforce-intelligence'){await workforce(req,res,user);return true;}
  const match=path.match(/^connected\/judge\/match\/(\d+)$/);if(match){await matchProof(req,res,user,Number(match[1]));return true;}
  return false;
}

module.exports={handle};
