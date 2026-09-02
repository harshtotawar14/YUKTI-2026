'use strict';

const {query,transaction}=require('../../../api/_lib/db.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}
function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function integer(value,label,{min=0,max=100}={}){const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw httpError(422,`${label} must be an integer from ${min} to ${max}.`,'INVALID_INTEGER');return n;}

async function createRequest(req,res,user){
  method(req,'POST');allow(user,['COOPERATIVE_ADMIN']);const data=body(req),serviceName=clean(data.service,120),zone=clean(data.zone,160),workersRequired=integer(data.workersRequired??1,'workersRequired',{min:1,max:100});
  if(!serviceName||!zone)throw httpError(422,'Service and zone are required.','CAPACITY_INPUT');
  const result=await transaction(async client=>{
    const service=(await client.query('SELECT id,name FROM services WHERE lower(name)=lower($1) AND active=true',[serviceName])).rows[0];if(!service)throw httpError(422,'Service is unavailable.','SERVICE_UNAVAILABLE');
    const code=`CAP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const row=(await client.query(`INSERT INTO capacity_requests(request_code,requesting_cooperative_id,service_id,zone,workers_required,status,created_by)
      VALUES($1,$2,$3,$4,$5,'REQUESTED',$6) RETURNING *`,[code,user.cooperative_id,service.id,zone,workersRequired,user.id])).rows[0];
    await client.query(`INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,'CAPACITY_REQUEST_CREATED',$2)`,[user.id,JSON.stringify({capacityRequestId:Number(row.id),requestCode:code,service:service.name,zone,workersRequired,requestingCooperativeId:Number(user.cooperative_id)})]);
    return {row,service};
  });
  return send(res,201,{ok:true,request:{id:Number(result.row.id),requestCode:result.row.request_code,service:result.service.name,zone:result.row.zone,workersRequired:Number(result.row.workers_required),status:result.row.status,automaticTransfer:false}});
}

async function listCooperative(req,res,user){
  method(req,'GET');allow(user,['COOPERATIVE_ADMIN']);
  const rows=(await query(`SELECT r.*,s.name AS service,rc.name AS requesting_cooperative,pc.name AS providing_cooperative,
    count(o.id)::int AS offered_workers,count(o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_workers
    FROM capacity_requests r JOIN services s ON s.id=r.service_id JOIN cooperatives rc ON rc.id=r.requesting_cooperative_id
    LEFT JOIN cooperatives pc ON pc.id=r.providing_cooperative_id LEFT JOIN capacity_worker_offers o ON o.capacity_request_id=r.id
    WHERE r.requesting_cooperative_id=$1 OR r.providing_cooperative_id=$1
    GROUP BY r.id,s.name,rc.name,pc.name ORDER BY r.created_at DESC`,[user.cooperative_id])).rows;
  return send(res,200,{ok:true,requests:rows.map(x=>({id:Number(x.id),requestCode:x.request_code,service:x.service,zone:x.zone,workersRequired:Number(x.workers_required),status:x.status,requestingCooperative:x.requesting_cooperative,providingCooperative:x.providing_cooperative,offeredWorkers:Number(x.offered_workers),acceptedWorkers:Number(x.accepted_workers),automaticTransfer:false}))});
}

async function listFederation(req,res,user){
  method(req,'GET');allow(user,['FEDERATION_ADMIN']);
  const rows=(await query(`SELECT r.*,s.name AS service,rc.name AS requesting_cooperative,pc.name AS providing_cooperative,
    count(DISTINCT o.id)::int AS offered_workers,count(DISTINCT o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_workers,
    count(DISTINCT a.id)::int AS approved_assignments
    FROM capacity_requests r JOIN services s ON s.id=r.service_id JOIN cooperatives rc ON rc.id=r.requesting_cooperative_id
    LEFT JOIN cooperatives pc ON pc.id=r.providing_cooperative_id LEFT JOIN capacity_worker_offers o ON o.capacity_request_id=r.id
    LEFT JOIN cross_cooperative_assignments a ON a.capacity_request_id=r.id
    GROUP BY r.id,s.name,rc.name,pc.name ORDER BY r.created_at DESC`)).rows;
  return send(res,200,{ok:true,scope:'FEDERATION_CAPACITY_GOVERNANCE',requests:rows.map(x=>({id:Number(x.id),requestCode:x.request_code,service:x.service,zone:x.zone,workersRequired:Number(x.workers_required),status:x.status,requestingCooperative:x.requesting_cooperative,providingCooperative:x.providing_cooperative,offeredWorkers:Number(x.offered_workers),acceptedWorkers:Number(x.accepted_workers),approvedAssignments:Number(x.approved_assignments)}))});
}

async function offerProvider(req,res,user,requestId){
  method(req,'POST');allow(user,['FEDERATION_ADMIN']);const data=body(req),providerId=integer(data.providingCooperativeId,'providingCooperativeId',{min:1,max:Number.MAX_SAFE_INTEGER});
  const result=await transaction(async client=>{
    const request=(await client.query('SELECT * FROM capacity_requests WHERE id=$1 FOR UPDATE',[requestId])).rows[0];if(!request)throw httpError(404,'Capacity request not found.','CAPACITY_NOT_FOUND');
    if(!['REQUESTED','AWAITING_WORKER_CONSENT','CONSENT_PARTIAL'].includes(request.status))throw httpError(409,'Capacity request is not open for provider coordination.','CAPACITY_STATE');
    if(Number(request.requesting_cooperative_id)===providerId)throw httpError(422,'Providing cooperative must be different from requesting cooperative.','CAPACITY_SAME_COOPERATIVE');
    const provider=(await client.query('SELECT id,name FROM cooperatives WHERE id=$1',[providerId])).rows[0];if(!provider)throw httpError(404,'Providing cooperative not found.','PROVIDER_NOT_FOUND');
    const workers=(await client.query(`SELECT w.id FROM workers w JOIN worker_skills ws ON ws.worker_id=w.id
      WHERE w.cooperative_id=$1 AND ws.service_id=$2 AND ws.status='VERIFIED' AND w.identity_status='VERIFIED' AND w.availability_status='AVAILABLE'
      AND NOT EXISTS(SELECT 1 FROM capacity_worker_offers o WHERE o.capacity_request_id=$3 AND o.worker_id=w.id)
      ORDER BY w.rating DESC,w.completed_jobs ASC,w.id LIMIT $4`,[providerId,request.service_id,requestId,Math.max(Number(request.workers_required)*2,Number(request.workers_required))])).rows;
    if(!workers.length)throw httpError(409,'No eligible available workers were found in the providing cooperative.','NO_PROVIDER_CAPACITY');
    for(const worker of workers)await client.query("INSERT INTO capacity_worker_offers(capacity_request_id,worker_id,status) VALUES($1,$2,'OFFERED') ON CONFLICT(capacity_request_id,worker_id) DO NOTHING",[requestId,worker.id]);
    await client.query("UPDATE capacity_requests SET providing_cooperative_id=$2,status='AWAITING_WORKER_CONSENT',updated_at=now() WHERE id=$1",[requestId,providerId]);
    await client.query(`INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,'CAPACITY_PROVIDER_OFFERED',$2)`,[user.id,JSON.stringify({capacityRequestId:requestId,providingCooperativeId:providerId,workerOffers:workers.length})]);
    return {provider,offers:workers.length};
  });
  return send(res,200,{ok:true,providingCooperative:result.provider.name,workerOffersCreated:result.offers,status:'AWAITING_WORKER_CONSENT',automaticTransfer:false});
}

async function workerOffers(req,res,user){
  method(req,'GET');allow(user,['WORKER']);const rows=(await query(`SELECT o.id AS offer_id,o.status AS offer_status,o.consented_at,r.request_code,r.zone,s.name AS service,rc.name AS requesting_cooperative,pc.name AS providing_cooperative
    FROM capacity_worker_offers o JOIN capacity_requests r ON r.id=o.capacity_request_id JOIN services s ON s.id=r.service_id
    JOIN cooperatives rc ON rc.id=r.requesting_cooperative_id LEFT JOIN cooperatives pc ON pc.id=r.providing_cooperative_id
    WHERE o.worker_id=$1 AND o.status IN ('OFFERED','ACCEPTED') ORDER BY o.created_at DESC`,[user.worker_id])).rows;
  return send(res,200,rows.map(x=>({offerId:Number(x.offer_id),offerStatus:x.offer_status,requestCode:x.request_code,service:x.service,zone:x.zone,requestingCooperative:x.requesting_cooperative,providingCooperative:x.providing_cooperative,workerConsentRequired:true,consentedAt:x.consented_at,automaticTransfer:false})));
}

async function workerRespond(req,res,user,offerId){
  method(req,'POST');allow(user,['WORKER']);const data=body(req),action=clean(data.action,20).toUpperCase();if(!['ACCEPT','REJECT'].includes(action))throw httpError(422,'Action must be ACCEPT or REJECT.','CAPACITY_ACTION');
  const result=await transaction(async client=>{
    const offer=(await client.query(`SELECT o.*,r.id AS request_id,r.workers_required,r.status AS request_status FROM capacity_worker_offers o JOIN capacity_requests r ON r.id=o.capacity_request_id WHERE o.id=$1 AND o.worker_id=$2 FOR UPDATE OF o,r`,[offerId,user.worker_id])).rows[0];
    if(!offer)throw httpError(404,'Capacity offer not found.','CAPACITY_OFFER_NOT_FOUND');if(offer.status!=='OFFERED')throw httpError(409,'Capacity offer already has a response.','CAPACITY_OFFER_RESPONDED');
    if(action==='REJECT'){
      await client.query("UPDATE capacity_worker_offers SET status='REJECTED',decline_reason=$2,responded_at=now() WHERE id=$1",[offerId,clean(data.reason,300)||'Worker declined']);
      await client.query(`INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,'CAPACITY_WORKER_DECLINED',$2)`,[user.id,JSON.stringify({capacityRequestId:Number(offer.request_id),offerId})]);
      return {status:'REJECTED',message:'Capacity offer declined. No transfer or penalty was applied.'};
    }
    await client.query("UPDATE capacity_worker_offers SET status='ACCEPTED',consented_at=now(),responded_at=now() WHERE id=$1",[offerId]);
    const accepted=Number((await client.query("SELECT count(*)::int AS count FROM capacity_worker_offers WHERE capacity_request_id=$1 AND status='ACCEPTED'",[offer.request_id])).rows[0].count),requestStatus=accepted>=Number(offer.workers_required)?'CONSENT_READY':'CONSENT_PARTIAL';
    await client.query('UPDATE capacity_requests SET status=$2,updated_at=now() WHERE id=$1',[offer.request_id,requestStatus]);
    await client.query(`INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,'CAPACITY_WORKER_CONSENTED',$2)`,[user.id,JSON.stringify({capacityRequestId:Number(offer.request_id),offerId,acceptedCount:accepted})]);
    return {status:'ACCEPTED',message:'Capacity offer accepted voluntarily. Authorized approval is still required.',requestStatus};
  });
  return send(res,200,{ok:true,...result,authorizedApprovalRequired:action==='ACCEPT'});
}

async function approve(req,res,user,requestId){
  method(req,'POST');allow(user,['FEDERATION_ADMIN']);const data=body(req),homeShare=integer(data.homeCooperativeSharePercent,'homeCooperativeSharePercent'),servingShare=integer(data.servingCooperativeSharePercent,'servingCooperativeSharePercent');
  if(homeShare+servingShare!==100)throw httpError(422,'Home and serving cooperative responsibility shares must total 100%.','CAPACITY_SPLIT');
  const result=await transaction(async client=>{
    const request=(await client.query('SELECT * FROM capacity_requests WHERE id=$1 FOR UPDATE',[requestId])).rows[0];if(!request)throw httpError(404,'Capacity request not found.','CAPACITY_NOT_FOUND');
    if(request.status!=='CONSENT_READY')throw httpError(409,'Required worker consent is not complete.','CAPACITY_CONSENT_REQUIRED');
    const accepted=(await client.query(`SELECT o.worker_id,o.consented_at,w.cooperative_id AS home_cooperative_id FROM capacity_worker_offers o JOIN workers w ON w.id=o.worker_id WHERE o.capacity_request_id=$1 AND o.status='ACCEPTED' ORDER BY o.consented_at,o.id LIMIT $2`,[requestId,request.workers_required])).rows;
    if(accepted.length<Number(request.workers_required))throw httpError(409,'Not enough workers have consented.','CAPACITY_INSUFFICIENT_CONSENT');
    const paymentResponsibility={homeCooperativeSharePercent:homeShare,servingCooperativeSharePercent:servingShare,policy:'CAPACITY_ASSIGNMENT_RESPONSIBILITY_NOT_WORKER_WAGE_DEDUCTION'};
    for(const worker of accepted){
      await client.query(`INSERT INTO cross_cooperative_assignments(capacity_request_id,worker_id,home_cooperative_id,serving_cooperative_id,complaint_owner_cooperative_id,worker_consent_at,approved_by,payment_responsibility)
        VALUES($1,$2,$3,$4,$4,$5,$6,$7) ON CONFLICT(capacity_request_id,worker_id) DO NOTHING`,[requestId,worker.worker_id,worker.home_cooperative_id,request.requesting_cooperative_id,worker.consented_at,user.id,JSON.stringify(paymentResponsibility)]);
    }
    await client.query("UPDATE capacity_requests SET status='APPROVED',updated_at=now() WHERE id=$1",[requestId]);
    await client.query(`INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,'CAPACITY_ASSIGNMENT_APPROVED',$2)`,[user.id,JSON.stringify({capacityRequestId:requestId,workers:accepted.map(x=>Number(x.worker_id)),requestingCooperativeId:Number(request.requesting_cooperative_id),providingCooperativeId:Number(request.providing_cooperative_id),paymentResponsibility})]);
    return {workers:accepted.length,paymentResponsibility};
  });
  return send(res,200,{ok:true,status:'APPROVED',approvedWorkers:result.workers,workerConsentVerified:true,complaintOwner:'REQUESTING_COOPERATIVE',paymentResponsibility:result.paymentResponsibility,automaticTransfer:false});
}

async function assignments(req,res,user,requestId){
  method(req,'GET');allow(user,['COOPERATIVE_ADMIN','FEDERATION_ADMIN']);
  const params=[requestId],role=user.role;if(role==='COOPERATIVE_ADMIN')params.push(user.cooperative_id);
  const scope=role==='COOPERATIVE_ADMIN'?' AND (a.home_cooperative_id=$2 OR a.serving_cooperative_id=$2 OR a.complaint_owner_cooperative_id=$2)':'';
  const rows=(await query(`SELECT a.*,u.name AS worker_name,h.name AS home_cooperative,s.name AS serving_cooperative,c.name AS complaint_owner
    FROM cross_cooperative_assignments a JOIN workers w ON w.id=a.worker_id JOIN users u ON u.id=w.user_id JOIN cooperatives h ON h.id=a.home_cooperative_id JOIN cooperatives s ON s.id=a.serving_cooperative_id JOIN cooperatives c ON c.id=a.complaint_owner_cooperative_id
    WHERE a.capacity_request_id=$1${scope} ORDER BY a.created_at`,params)).rows;
  return send(res,200,{ok:true,assignments:rows.map(x=>({id:Number(x.id),workerId:Number(x.worker_id),workerName:x.worker_name,homeCooperative:x.home_cooperative,servingCooperative:x.serving_cooperative,complaintOwner:x.complaint_owner,workerConsentAt:x.worker_consent_at,approvedAt:x.approved_at,paymentResponsibility:x.payment_responsibility,status:x.status}))});
}

async function handle(req,res,path){
  const provider=path.match(/^federation\/capacity-requests\/(\d+)\/offer-provider$/),approval=path.match(/^federation\/capacity-requests\/(\d+)\/approve$/),workerResponse=path.match(/^connected\/worker\/capacity-offers\/(\d+)\/respond$/),assignment=path.match(/^(?:federation|cooperative-admin)\/capacity-requests\/(\d+)\/assignments$/);
  const supported=path==='cooperative-admin/capacity-requests'||path==='federation/capacity-requests'||path==='connected/worker/capacity-offers'||provider||approval||workerResponse||assignment;
  if(!supported)return false;
  const user=await authenticate(req);
  if(path==='cooperative-admin/capacity-requests'){if(req.method==='POST')await createRequest(req,res,user);else await listCooperative(req,res,user);return true;}
  if(path==='federation/capacity-requests'){await listFederation(req,res,user);return true;}
  if(path==='connected/worker/capacity-offers'){await workerOffers(req,res,user);return true;}
  if(provider){await offerProvider(req,res,user,Number(provider[1]));return true;}
  if(approval){await approve(req,res,user,Number(approval[1]));return true;}
  if(workerResponse){await workerRespond(req,res,user,Number(workerResponse[1]));return true;}
  if(assignment){await assignments(req,res,user,Number(assignment[1]));return true;}
  return false;
}

module.exports={handle};
