'use strict';

const {query}=require('../../../api/_lib/db.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');

const ACTIVE_BOOKING_STATES=['OFFERING','FINDING_REPLACEMENT','ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAYMENT_PENDING'];
const OPEN_COMPLAINT_STATES=['OPEN','IN_REVIEW','ESCALATED'];

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}

async function workspace(req,res,user){
  method(req,'GET');
  const cooperativeId=Number(user.cooperative_id);
  if(!cooperativeId)throw httpError(403,'This administrator is not assigned to a cooperative.','COOPERATIVE_SCOPE');

  const [coop,workerRows,skillRows,skillCapacity,services,complaints,payments,capacityRequests,training,summary]=await Promise.all([
    query('SELECT id,name,code,region FROM cooperatives WHERE id=$1',[cooperativeId]),
    query(`SELECT w.id,u.name,u.email,w.identity_status,w.availability_status,w.rating,w.completed_jobs,c.region,
      (SELECT count(*)::int FROM bookings b WHERE b.assigned_worker_id=w.id AND b.status=ANY($2::text[])) AS current_jobs,
      (SELECT count(*)::int FROM support_requests sr JOIN bookings cb ON cb.id=sr.booking_id WHERE cb.assigned_worker_id=w.id AND sr.status=ANY($3::text[])) AS complaint_count
      FROM workers w JOIN users u ON u.id=w.user_id JOIN cooperatives c ON c.id=w.cooperative_id
      WHERE w.cooperative_id=$1 ORDER BY u.name`,[cooperativeId,ACTIVE_BOOKING_STATES,OPEN_COMPLAINT_STATES]),
    query(`SELECT ws.worker_id,s.name AS service,ws.status FROM worker_skills ws JOIN workers w ON w.id=ws.worker_id JOIN services s ON s.id=ws.service_id WHERE w.cooperative_id=$1 ORDER BY ws.worker_id,s.name`,[cooperativeId]),
    query(`SELECT s.name AS service,
      (SELECT count(DISTINCT ws.worker_id)::int FROM worker_skills ws JOIN workers w ON w.id=ws.worker_id WHERE ws.service_id=s.id AND w.cooperative_id=$1 AND ws.status='VERIFIED' AND w.identity_status='VERIFIED') AS verified_workers,
      (SELECT count(DISTINCT ws.worker_id)::int FROM worker_skills ws JOIN workers w ON w.id=ws.worker_id WHERE ws.service_id=s.id AND w.cooperative_id=$1 AND ws.status='VERIFIED' AND w.identity_status='VERIFIED' AND w.availability_status='AVAILABLE') AS available_workers,
      (SELECT count(*)::int FROM bookings b WHERE b.service_id=s.id AND b.cooperative_id=$1 AND b.created_at>=now()-interval '30 days') AS demand_30d
      FROM services s WHERE s.active=true ORDER BY s.name`,[cooperativeId]),
    query(`SELECT b.id,b.booking_code,s.name AS service,wu.name AS worker,b.scheduled_at,b.zone,b.status,b.created_at
      FROM bookings b JOIN services s ON s.id=b.service_id LEFT JOIN workers w ON w.id=b.assigned_worker_id LEFT JOIN users wu ON wu.id=w.user_id
      WHERE b.cooperative_id=$1 ORDER BY b.created_at DESC LIMIT 100`,[cooperativeId]),
    query(`SELECT sr.id,sr.booking_id,sr.reference_code,sr.status,sr.severity,sr.sla_due_at,sr.escalated_at,sr.created_at,b.booking_code,s.name AS service
      FROM support_requests sr LEFT JOIN bookings b ON b.id=sr.booking_id LEFT JOIN services s ON s.id=b.service_id
      WHERE sr.cooperative_id=$1 ORDER BY sr.created_at DESC LIMIT 100`,[cooperativeId]),
    query(`SELECT p.booking_id,p.amount,p.status,p.created_at,b.booking_code,s.name AS service
      FROM payments p JOIN bookings b ON b.id=p.booking_id JOIN services s ON s.id=b.service_id
      WHERE b.cooperative_id=$1 ORDER BY p.created_at DESC LIMIT 100`,[cooperativeId]),
    query(`SELECT r.id,r.request_code,r.requesting_cooperative_id,r.providing_cooperative_id,r.zone,r.workers_required,r.status,r.created_at,s.name AS service,
      count(DISTINCT a.id)::int AS approved_workers
      FROM capacity_requests r JOIN services s ON s.id=r.service_id
      LEFT JOIN cross_cooperative_assignments a ON a.capacity_request_id=r.id
      WHERE r.requesting_cooperative_id=$1 OR r.providing_cooperative_id=$1
      GROUP BY r.id,s.name ORDER BY r.created_at DESC LIMIT 50`,[cooperativeId]),
    query(`SELECT tr.id,tr.reason,tr.status,tr.created_at,s.name AS service FROM training_recommendations tr JOIN services s ON s.id=tr.service_id WHERE tr.cooperative_id=$1 ORDER BY tr.created_at DESC LIMIT 50`,[cooperativeId]),
    query(`SELECT
      (SELECT coalesce(sum(p.amount),0) FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.cooperative_id=$1)::numeric AS recorded_payments,
      (SELECT count(*)::int FROM bookings b WHERE b.cooperative_id=$1 AND b.status=ANY($2::text[])) AS active_bookings,
      (SELECT count(*)::int FROM bookings b WHERE b.cooperative_id=$1 AND b.status IN ('COMPLETED','PAYMENT_PENDING','PAID')) AS completed_services,
      (SELECT coalesce(avg(r.stars),0) FROM ratings r JOIN bookings b ON b.id=r.booking_id WHERE b.cooperative_id=$1)::numeric AS average_rating,
      (SELECT count(*)::int FROM capacity_worker_offers o JOIN capacity_requests r ON r.id=o.capacity_request_id WHERE (r.requesting_cooperative_id=$1 OR r.providing_cooperative_id=$1) AND o.status='OFFERED') AS pending_offers`,[cooperativeId,ACTIVE_BOOKING_STATES])
  ]);

  const cooperative=coop.rows[0];
  if(!cooperative)throw httpError(404,'Cooperative not found.','COOPERATIVE_NOT_FOUND');
  const skillsByWorker=new Map();
  for(const row of skillRows.rows){
    const list=skillsByWorker.get(Number(row.worker_id))||[];
    list.push({service:row.service,verified:row.status==='VERIFIED',status:row.status});
    skillsByWorker.set(Number(row.worker_id),list);
  }

  const workers=workerRows.rows.map(row=>({
    id:Number(row.id),name:row.name,email:row.email,
    verificationStatus:row.identity_status,availability:row.availability_status,
    jobsCompleted:Number(row.completed_jobs||0),rating:Number(row.rating||0),
    pendingDocuments:0,expiredDocuments:0,currentJobs:Number(row.current_jobs||0),
    complaintCount:Number(row.complaint_count||0),zone:cooperative.region,
    skills:skillsByWorker.get(Number(row.id))||[]
  }));
  const complaintsOut=complaints.rows.map(row=>{
    const open=OPEN_COMPLAINT_STATES.includes(row.status),due=row.sla_due_at?new Date(row.sla_due_at):null;
    return {id:Number(row.id),bookingId:row.booking_id?Number(row.booking_id):null,bookingCode:row.booking_code||row.reference_code,service:row.service||null,status:row.status,severity:row.severity,escalationLevel:row.status==='ESCALATED'?3:row.status==='IN_REVIEW'?2:1,slaDueAt:row.sla_due_at,slaBreached:Boolean(open&&due&&due.getTime()<Date.now()),createdAt:row.created_at};
  });
  const activeComplaints=complaintsOut.filter(row=>OPEN_COMPLAINT_STATES.includes(row.status));
  const metricsRow=summary.rows[0]||{};
  const capacityOut=capacityRequests.rows.map(row=>({id:Number(row.id),requestCode:row.request_code,role:Number(row.requesting_cooperative_id)===cooperativeId?'REQUESTER':'PROVIDER',service:row.service,zone:row.zone,requestedWorkers:Number(row.workers_required||0),approvedWorkers:Number(row.approved_workers||0),status:row.status,requestedAt:row.created_at}));

  return send(res,200,{
    ok:true,source:'DATABASE_AGGREGATION',
    cooperative:{id:cooperativeId,name:cooperative.name,code:cooperative.code,city:String(cooperative.region||'').split(',')[0].trim()||cooperative.region,region:cooperative.region},
    metrics:{
      totalWorkers:workers.length,
      verifiedWorkers:workers.filter(w=>w.verificationStatus==='VERIFIED').length,
      availableWorkers:workers.filter(w=>w.verificationStatus==='VERIFIED'&&w.availability==='AVAILABLE').length,
      activeBookings:Number(metricsRow.active_bookings||0),openComplaints:activeComplaints.length,
      recordedPayments:Number(metricsRow.recorded_payments||0),
      pendingVerification:workers.filter(w=>w.verificationStatus!=='VERIFIED').length,
      documentIssues:0,slaBreaches:activeComplaints.filter(x=>x.slaBreached).length,
      capacityRequests:capacityOut.length,pendingOffers:Number(metricsRow.pending_offers||0),
      completedServices:Number(metricsRow.completed_services||0),averageRating:Number(metricsRow.average_rating||0)
    },
    workers,
    skills:skillCapacity.rows.map(row=>({service:row.service,verifiedWorkers:Number(row.verified_workers||0),availableWorkers:Number(row.available_workers||0),demand30d:Number(row.demand_30d||0)})),
    services:services.rows.map(row=>({id:Number(row.id),bookingCode:row.booking_code,service:row.service,worker:row.worker||null,scheduledAt:row.scheduled_at,zone:row.zone,status:row.status,createdAt:row.created_at,delayed:Boolean(row.scheduled_at&&new Date(row.scheduled_at)<new Date()&&!['COMPLETED','PAYMENT_PENDING','PAID','CANCELLED'].includes(row.status))})),
    complaints:complaintsOut,
    capacityRequests:capacityOut,
    payments:payments.rows.map(row=>({bookingId:Number(row.booking_id),bookingCode:row.booking_code,service:row.service,amount:Number(row.amount||0),status:row.status,createdAt:row.created_at})),
    trainingRecommendations:training.rows.map(row=>({id:Number(row.id),worker:'Cooperative workforce',service:row.service,trainingName:'Training / onboarding review',reason:row.reason,status:row.status,createdAt:row.created_at})),
    documentEvidence:{source:'NO_DOCUMENT_REGISTRY_CONNECTED',issuesReported:0}
  });
}

async function verification(req,res,user,workerId){
  method(req,'POST');
  const data=body(req),status=clean(data.status,30).toUpperCase(),reason=clean(data.reason,500);
  if(!['VERIFIED','REJECTED','PENDING'].includes(status)||reason.length<4)throw httpError(422,'Verification status and review note are required.','VERIFICATION_INPUT');
  const result=await query('UPDATE workers SET identity_status=$1,updated_at=now() WHERE id=$2 AND cooperative_id=$3 RETURNING id',[status,workerId,user.cooperative_id]);
  if(!result.rows[0])throw httpError(404,'Worker not found in this cooperative.','WORKER_NOT_FOUND');
  await query('INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,$2,$3)',[user.id,'WORKER_IDENTITY_REVIEWED',JSON.stringify({workerId:Number(workerId),status,reason})]);
  return send(res,200,{ok:true,worker:{id:Number(workerId),identityStatus:status,verificationStatus:status}});
}

async function trustLifecycle(req,res,user){
  method(req,'GET');
  const rows=(await query(`SELECT w.id,u.name,w.identity_status,w.availability_status,w.rating,w.completed_jobs FROM workers w JOIN users u ON u.id=w.user_id WHERE w.cooperative_id=$1 ORDER BY u.name`,[user.cooperative_id])).rows;
  return send(res,200,{ok:true,workers:rows.map(row=>({id:Number(row.id),name:row.name,verificationStatus:row.identity_status,identityStatus:row.identity_status,availability:row.availability_status,availabilityStatus:row.availability_status,rating:Number(row.rating||0),jobsCompleted:Number(row.completed_jobs||0),completedJobs:Number(row.completed_jobs||0)}))});
}

async function handle(req,res,path){
  const workspacePath=path==='cooperative-admin/workspace';
  const trustPath=path==='cooperative-admin/trust-lifecycle';
  const verifyMatch=path.match(/^cooperative-admin\/workers\/(\d+)\/verification$/);
  if(!workspacePath&&!trustPath&&!verifyMatch)return false;
  const user=await authenticate(req);allow(user,['COOPERATIVE_ADMIN']);
  if(workspacePath){await workspace(req,res,user);return true;}
  if(trustPath){await trustLifecycle(req,res,user);return true;}
  if(verifyMatch){await verification(req,res,user,Number(verifyMatch[1]));return true;}
  return false;
}

module.exports={handle,ACTIVE_BOOKING_STATES,OPEN_COMPLAINT_STATES};
