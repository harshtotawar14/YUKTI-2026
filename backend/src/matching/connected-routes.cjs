'use strict';

const {query,transaction}=require('../../../api/_lib/db.cjs');
const {sha256,bearerToken}=require('../../../api/_lib/security.cjs');
const {normalizeRole}=require('../../../api/_lib/policy.cjs');
const {scoreCandidates,PROTOTYPE_WEIGHTS}=require('./prototype-policy.cjs');

function httpError(status,message,code){return Object.assign(new Error(message),{status,code});}
function send(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(payload));}
function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function allow(user,roles){if(!roles.includes(normalizeRole(user.role)))throw httpError(403,'This action is not available for this role.','ROLE_FORBIDDEN');}
function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}

async function authenticate(req){
  const token=bearerToken(req);
  if(!token)throw httpError(401,'Please log in to continue.','AUTH_REQUIRED');
  const result=await query(`SELECT u.*,w.id AS worker_id FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN workers w ON w.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[sha256(token)]);
  if(!result.rows[0])throw httpError(401,'Your session expired. Please log in again.','SESSION_EXPIRED');
  return result.rows[0];
}

async function history(client,bookingId,status,note,user){await client.query('INSERT INTO booking_history(booking_id,status,note,actor_user_id) VALUES($1,$2,$3,$4)',[bookingId,status,note,user?.id||null]);}
async function audit(client,user,eventType,{bookingId=null,details={}}={}){await client.query('INSERT INTO audit_events(actor_user_id,booking_id,event_type,details) VALUES($1,$2,$3,$4)',[user?.id||null,bookingId,eventType,JSON.stringify(details)]);}
async function notify(client,userId,title,message){await client.query('INSERT INTO notifications(user_id,title,message,priority) VALUES($1,$2,$3,$4)',[userId,title,message,'NORMAL']);}

async function rankedCandidates(client,{serviceId,cooperativeId,preferredRadiusKm=20}){
  const rows=(await client.query(`SELECT w.id,w.identity_status,w.availability_status,w.rating,w.completed_jobs,w.demo_distance_km,u.active AS user_active,ws.status AS skill_status,
    COALESCE(stats.recent_offers,0)::int AS recent_offers
    FROM workers w JOIN users u ON u.id=w.user_id JOIN worker_skills ws ON ws.worker_id=w.id AND ws.service_id=$1
    LEFT JOIN LATERAL (SELECT count(*)::int AS recent_offers FROM booking_offers o WHERE o.worker_id=w.id AND o.created_at>=now()-interval '30 days') stats ON true
    WHERE w.cooperative_id=$2`,[serviceId,cooperativeId])).rows;
  return scoreCandidates(rows,{preferredRadiusKm});
}

async function insertRankedOffers(client,bookingId,candidates){
  for(let i=0;i<candidates.length;i++){
    const candidate=candidates[i];
    await client.query(`INSERT INTO booking_offers(booking_id,worker_id,rank,status,matching_score,factor_scores,reason_codes)
      VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,[bookingId,candidate.id,i+1,i===0?'PENDING':'QUEUED',candidate.score,JSON.stringify(candidate.factors),JSON.stringify(candidate.reasonCodes)]);
  }
}

async function createBooking(req,res,user){
  method(req,'POST');allow(user,['CUSTOMER']);
  const data=body(req),serviceName=clean(data.service,120),zone=clean(data.zone,160),address=clean(data.address,300),problem=clean(data.problem,1200),scheduledAt=new Date(data.scheduledAt);
  if(!serviceName||!zone||!address||problem.length<3||Number.isNaN(scheduledAt.getTime()))throw httpError(422,'Service, location, problem and schedule are required.','BOOKING_INPUT');
  if(scheduledAt.getTime()<Date.now()-60000)throw httpError(422,'Choose a current or future service time.','PAST_SCHEDULE');
  const preferredRadiusKm=Math.max(2,Math.min(50,Number(data.preferredRadiusKm)||20));
  const id=await transaction(async client=>{
    const service=(await client.query('SELECT * FROM services WHERE lower(name)=lower($1) AND active=true',[serviceName])).rows[0];
    if(!service)throw httpError(422,'The selected service is unavailable.','SERVICE_UNAVAILABLE');
    const fallback=(await client.query('SELECT id FROM cooperatives ORDER BY id LIMIT 1')).rows[0];
    const coopId=user.cooperative_id||fallback?.id;if(!coopId)throw httpError(503,'No cooperative is configured.','COOPERATIVE_NOT_CONFIGURED');
    const inserted=(await client.query(`INSERT INTO bookings(customer_id,service_id,cooperative_id,status,zone,address,problem,request_source,request_language,voice_transcript,scheduled_at,emergency,base_amount)
      VALUES($1,$2,$3,'OFFERING',$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[user.id,service.id,coopId,zone,address,problem,clean(data.requestSource||'TEXT',20),clean(data.requestLanguage,40)||null,clean(data.voiceTranscript,1200)||null,scheduledAt.toISOString(),Boolean(data.emergency),service.base_price])).rows[0];
    const code=`SP-${new Date().getUTCFullYear()}-${String(inserted.id).padStart(6,'0')}`;await client.query('UPDATE bookings SET booking_code=$2 WHERE id=$1',[inserted.id,code]);
    const candidates=await rankedCandidates(client,{serviceId:service.id,cooperativeId:coopId,preferredRadiusKm});
    if(candidates.length)await insertRankedOffers(client,inserted.id,candidates);else await client.query("UPDATE bookings SET status='NO_WORKER_AVAILABLE' WHERE id=$1",[inserted.id]);
    const status=candidates.length?'OFFERING':'NO_WORKER_AVAILABLE';
    await history(client,inserted.id,status,candidates.length?`Explainable matching ranked ${candidates.length} eligible worker(s); rank 1 received the opportunity.`:'No eligible worker is currently available.',user);
    await audit(client,user,'BOOKING_CREATED',{bookingId:inserted.id,details:{service:service.name,matchingPolicy:'PROTOTYPE_EXPLAINABLE_V1',preferredRadiusKm,weights:PROTOTYPE_WEIGHTS,eligibleCandidates:candidates.length}});
    return inserted.id;
  });
  const row=(await query(`SELECT b.*,s.name AS service,s.icon AS service_icon,c.name AS cooperative FROM bookings b JOIN services s ON s.id=b.service_id JOIN cooperatives c ON c.id=b.cooperative_id WHERE b.id=$1`,[id])).rows[0];
  return send(res,201,{id:Number(row.id),bookingCode:row.booking_code,customerId:Number(row.customer_id),service:row.service,serviceIcon:row.service_icon,status:row.status,zone:row.zone,address:row.address,problem:row.problem,requestSource:row.request_source,requestLanguage:row.request_language,voiceTranscript:row.voice_transcript,scheduledAt:row.scheduled_at,emergency:row.emergency,total:Number(row.base_amount),workerId:null,workerName:null,workerVerification:null,distance:null,cooperative:row.cooperative,createdAt:row.created_at,updatedAt:row.updated_at,matchingPolicy:'PROTOTYPE_EXPLAINABLE_V1'});
}

function offerJson(row){return {offerId:Number(row.offer_id),offerStatus:row.offer_status,bookingId:Number(row.booking_id),bookingCode:row.booking_code,status:row.booking_status,service:row.service,zone:row.zone,problem:row.problem,voiceTranscript:row.voice_transcript,scheduledAt:row.scheduled_at,emergency:row.emergency,total:Number(row.base_amount),distance:Number(row.distance),cooperative:row.cooperative,rank:Number(row.rank),matching:{policy:'PROTOTYPE_EXPLAINABLE_V1',score:Number(row.matching_score),factors:row.factor_scores||{},reasonCodes:row.reason_codes||[]}};}

async function workerOffers(req,res,user){
  method(req,'GET');allow(user,['WORKER']);
  const rows=(await query(`SELECT o.id AS offer_id,o.status AS offer_status,o.rank,o.matching_score,o.factor_scores,o.reason_codes,b.id AS booking_id,b.booking_code,b.status AS booking_status,b.zone,b.problem,b.voice_transcript,b.scheduled_at,b.emergency,b.base_amount,s.name AS service,w.demo_distance_km AS distance,c.name AS cooperative
    FROM booking_offers o JOIN bookings b ON b.id=o.booking_id JOIN services s ON s.id=b.service_id JOIN workers w ON w.id=o.worker_id JOIN cooperatives c ON c.id=b.cooperative_id
    WHERE o.worker_id=$1 AND o.status IN ('PENDING','ACCEPTED') ORDER BY CASE o.status WHEN 'ACCEPTED' THEN 0 ELSE 1 END,o.created_at DESC`,[user.worker_id])).rows;
  return send(res,200,rows.map(offerJson));
}

async function respondOffer(req,res,user,offerId){
  method(req,'POST');allow(user,['WORKER']);const data=body(req),action=clean(data.action,20).toUpperCase();
  if(!['ACCEPT','REJECT'].includes(action))throw httpError(422,'Action must be ACCEPT or REJECT.','INVALID_OFFER_ACTION');
  const result=await transaction(async client=>{
    const offer=(await client.query(`SELECT o.*,b.customer_id,b.status AS booking_status FROM booking_offers o JOIN bookings b ON b.id=o.booking_id WHERE o.id=$1 AND o.worker_id=$2 FOR UPDATE OF o,b`,[offerId,user.worker_id])).rows[0];
    if(!offer)throw httpError(404,'Worker opportunity not found.','OFFER_NOT_FOUND');if(offer.status!=='PENDING')throw httpError(409,'This opportunity already has a response.','OFFER_ALREADY_RESPONDED');
    if(action==='ACCEPT'){
      if(!['OFFERING','FINDING_REPLACEMENT'].includes(offer.booking_status))throw httpError(409,'This booking is no longer accepting worker responses.','BOOKING_STATE');
      await client.query("UPDATE booking_offers SET status='ACCEPTED',responded_at=now() WHERE id=$1",[offer.id]);
      await client.query("UPDATE booking_offers SET status='CANCELLED',responded_at=now() WHERE booking_id=$1 AND id<>$2 AND status IN ('PENDING','QUEUED')",[offer.booking_id,offer.id]);
      await client.query("UPDATE bookings SET assigned_worker_id=$2,status='ACCEPTED',updated_at=now() WHERE id=$1 AND assigned_worker_id IS NULL",[offer.booking_id,user.worker_id]);
      const locked=(await client.query('SELECT assigned_worker_id FROM bookings WHERE id=$1',[offer.booking_id])).rows[0];if(Number(locked.assigned_worker_id)!==Number(user.worker_id))throw httpError(409,'Another worker already accepted this booking.','ASSIGNMENT_ALREADY_TAKEN');
      await history(client,offer.booking_id,'ACCEPTED','Worker accepted the ranked opportunity.',user);await notify(client,offer.customer_id,'Worker accepted','A verified worker accepted your service request.');await audit(client,user,'WORKER_OFFER_ACCEPTED',{bookingId:offer.booking_id,details:{rank:Number(offer.rank),matchingScore:Number(offer.matching_score)}});return {nextWorker:false,accepted:true,bookingId:Number(offer.booking_id)};
    }
    await client.query("UPDATE booking_offers SET status='REJECTED',decline_reason=$2,responded_at=now() WHERE id=$1",[offer.id,clean(data.reason,200)||'Not specified']);
    const next=(await client.query("SELECT * FROM booking_offers WHERE booking_id=$1 AND status='QUEUED' ORDER BY rank ASC,id ASC LIMIT 1 FOR UPDATE",[offer.booking_id])).rows[0];
    if(next){await client.query("UPDATE booking_offers SET status='PENDING' WHERE id=$1",[next.id]);await client.query("UPDATE bookings SET status='FINDING_REPLACEMENT',updated_at=now() WHERE id=$1",[offer.booking_id]);await history(client,offer.booking_id,'FINDING_REPLACEMENT',`Worker declined; rank ${next.rank} is now offered the same booking.`,user);}
    else{await client.query("UPDATE bookings SET status='NO_WORKER_AVAILABLE',updated_at=now() WHERE id=$1",[offer.booking_id]);await history(client,offer.booking_id,'NO_WORKER_AVAILABLE','Worker declined; no further eligible ranked worker is available.',user);}
    await audit(client,user,'WORKER_OFFER_DECLINED',{bookingId:offer.booking_id,details:{reason:clean(data.reason,200),nextRank:next?Number(next.rank):null}});return {nextWorker:Boolean(next),accepted:false,bookingId:Number(offer.booking_id)};
  });
  return send(res,200,{ok:true,...result});
}

async function handle(req,res,path){
  const normalized=String(path||'').replace(/^\/+|\/+$/g,'');
  if(normalized==='connected/bookings'){const user=await authenticate(req);await createBooking(req,res,user);return true;}
  if(normalized==='connected/worker/offers'){const user=await authenticate(req);await workerOffers(req,res,user);return true;}
  const offerMatch=normalized.match(/^connected\/worker\/offers\/(\d+)\/respond$/);
  if(offerMatch){const user=await authenticate(req);await respondOffer(req,res,user,Number(offerMatch[1]));return true;}
  return false;
}

module.exports={handle,rankedCandidates,insertRankedOffers};
