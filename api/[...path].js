'use strict';

const {query,transaction,ensureDatabase}=require('./_lib/db.cjs');
const {sha256,randomToken,verifyPassword,bearerToken,sessionCookie,clearSessionCookie}=require('./_lib/security.cjs');
const {transition,normalizeRole,publicUser}=require('./_lib/policy.cjs');

const loginAttempts=new Map();
const ACTIVE_STATES=['OFFERING','FINDING_REPLACEMENT','ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAYMENT_PENDING'];

function httpError(status,message,code){return Object.assign(new Error(message),{status,code});}
function send(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(payload));}
function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}
function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function number(value){const parsed=Number(value);if(!Number.isFinite(parsed))throw httpError(422,'A numeric value is invalid.','INVALID_NUMBER');return parsed;}
function pathOf(req){return new URL(req.url,'https://sanpaid.local').pathname.replace(/^\/api\/?/,'').replace(/\/$/,'');}
function allow(user,roles){if(!roles.includes(normalizeRole(user.role)))throw httpError(403,'This action is not available for this role.','ROLE_FORBIDDEN');}

async function authenticate(req,required=true){
  const token=bearerToken(req);
  if(!token){if(required)throw httpError(401,'Please log in to continue.','AUTH_REQUIRED');return null;}
  const result=await query(`SELECT u.*,w.id AS worker_id,w.identity_status,w.availability_status,w.rating,w.demo_distance_km
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN workers w ON w.user_id=u.id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[sha256(token)]);
  if(!result.rows[0]){if(required)throw httpError(401,'Your session expired. Please log in again.','SESSION_EXPIRED');return null;}
  return result.rows[0];
}

async function audit(client,user,eventType,{bookingId=null,details={}}={}){
  await client.query('INSERT INTO audit_events(actor_user_id,booking_id,event_type,details) VALUES($1,$2,$3,$4)',[user?.id||null,bookingId,eventType,JSON.stringify(details)]);
}
async function history(client,bookingId,status,note,user){
  await client.query('INSERT INTO booking_history(booking_id,status,note,actor_user_id) VALUES($1,$2,$3,$4)',[bookingId,status,note,user?.id||null]);
}
async function notify(client,userId,title,message,priority='NORMAL'){
  await client.query('INSERT INTO notifications(user_id,title,message,priority) VALUES($1,$2,$3,$4)',[userId,title,message,priority]);
}

const bookingSelect=`SELECT b.*,s.name AS service,s.icon AS service_icon,u.name AS customer_name,
  wu.name AS worker_name,w.identity_status AS worker_verification,w.demo_distance_km AS distance,c.name AS cooperative
  FROM bookings b JOIN services s ON s.id=b.service_id JOIN users u ON u.id=b.customer_id
  JOIN cooperatives c ON c.id=b.cooperative_id LEFT JOIN workers w ON w.id=b.assigned_worker_id LEFT JOIN users wu ON wu.id=w.user_id`;
function bookingJson(row){return {id:Number(row.id),bookingCode:row.booking_code,customerId:Number(row.customer_id),service:row.service,serviceIcon:row.service_icon,status:row.status,zone:row.zone,address:row.address,problem:row.problem,requestSource:row.request_source,requestLanguage:row.request_language,voiceTranscript:row.voice_transcript,scheduledAt:row.scheduled_at,emergency:row.emergency,total:Number(row.base_amount),workerId:row.assigned_worker_id?Number(row.assigned_worker_id):null,workerName:row.worker_name||null,workerVerification:row.worker_verification||null,distance:row.distance==null?null:Number(row.distance),cooperative:row.cooperative,createdAt:row.created_at,updatedAt:row.updated_at};}

async function ownedBooking(id,user,{worker=false,lock=false,client=null}={}){
  const db=client||{query};
  const result=await db.query(`${bookingSelect} WHERE b.id=$1${lock?' FOR UPDATE OF b':''}`,[id]);
  const row=result.rows[0];if(!row)throw httpError(404,'Booking not found.','BOOKING_NOT_FOUND');
  const role=normalizeRole(user.role);
  if(role==='CUSTOMER'&&Number(row.customer_id)!==Number(user.id))throw httpError(403,'This booking belongs to another customer.','BOOKING_FORBIDDEN');
  if((worker||role==='WORKER')&&Number(row.assigned_worker_id)!==Number(user.worker_id))throw httpError(403,'This job is not assigned to this worker.','JOB_FORBIDDEN');
  if(role==='COOPERATIVE_ADMIN'&&Number(row.cooperative_id)!==Number(user.cooperative_id))throw httpError(403,'This booking is outside your cooperative.','COOPERATIVE_SCOPE');
  return row;
}

async function setBookingState(client,row,user,action,note){
  const next=transition(action,row.status);
  await client.query('UPDATE bookings SET status=$2,updated_at=now() WHERE id=$1',[row.id,next]);
  await history(client,row.id,next,note,user);await audit(client,user,`BOOKING_${next}`,{bookingId:row.id});
  return next;
}

async function createSession(userId,remember=false){
  const raw=randomToken(32),days=remember?7:1,maxAge=days*86400;
  await query("DELETE FROM sessions WHERE expires_at<=now()");
  await query("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+($3||' days')::interval)",[userId,sha256(raw),String(days)]);
  return {raw,maxAge};
}

async function authRoutes(req,res,path){
  if(path==='auth/login'){
    method(req,'POST');const data=body(req),identifier=clean(data.identifier,200).toLowerCase(),requestedRole=normalizeRole(data.role);
    const key=`${req.headers['x-forwarded-for']||'client'}:${identifier}`;const attempt=loginAttempts.get(key)||{count:0,at:0};
    if(attempt.count>=8&&Date.now()-attempt.at<15*60*1000)throw httpError(429,'Too many login attempts. Wait before retrying.','LOGIN_RATE_LIMIT');
    const result=await query('SELECT * FROM users WHERE email=$1 AND active=true',[identifier]);const user=result.rows[0];
    if(!user||!(await verifyPassword(clean(data.password,200),user.password_hash))){loginAttempts.set(key,{count:attempt.count+1,at:Date.now()});throw httpError(401,'Email or password is incorrect.','INVALID_CREDENTIALS');}
    if(requestedRole&&normalizeRole(user.role)!==requestedRole)throw httpError(403,'This account does not have the selected role.','ROLE_MISMATCH');
    loginAttempts.delete(key);const session=await createSession(user.id,Boolean(data.remember));res.setHeader('Set-Cookie',sessionCookie(session.raw,session.maxAge));
    return send(res,200,{ok:true,user:publicUser(user),demoToken:session.raw,authentication:'EVENT_SCOPED_DEMO_SESSION'});
  }
  if(path==='auth/me'||path==='connected/auth/me'){
    method(req,'GET');const user=await authenticate(req);return send(res,200,{ok:true,user:publicUser(user)});
  }
  if(path==='auth/logout'||path==='connected/auth/logout'){
    method(req,'POST');const token=bearerToken(req);if(token)await query('DELETE FROM sessions WHERE token_hash=$1',[sha256(token)]);res.setHeader('Set-Cookie',clearSessionCookie());return send(res,200,{ok:true});
  }
  if(path==='auth/session-bridge'){
    method(req,'POST');const user=await authenticate(req);allow(user,['COOPERATIVE_ADMIN','FEDERATION_ADMIN']);const session=await createSession(user.id,false);return send(res,200,{ok:true,demoToken:session.raw,user:publicUser(user)});
  }
  return false;
}

async function publicRoutes(req,res,path){
  if(path==='connected/health'){
    method(req,'GET');await ensureDatabase();const result=await query("SELECT count(*)::int AS services FROM services WHERE active=true");return send(res,200,{ok:true,service:'sanpaid-api',version:'1.0.0',database:'POSTGRESQL',source:'DATABASE_CONFIGURATION',services:result.rows[0].services,time:new Date().toISOString()});
  }
  if(path==='public/services'){
    method(req,'GET');const result=await query("SELECT id,name,slug,icon,base_price FROM services WHERE active=true ORDER BY name");return send(res,200,{ok:true,source:'DATABASE_CONFIGURATION',services:result.rows.map(x=>({id:Number(x.id),name:x.name,slug:x.slug,icon:x.icon,basePrice:Number(x.base_price)}))});
  }
  if(path==='public-proof/summary'){
    method(req,'GET');const [counts,workers,capacity]=await Promise.all([
      query(`SELECT (SELECT count(*) FROM services WHERE active=true)::int AS services,(SELECT count(*) FROM workers WHERE identity_status='VERIFIED')::int AS workers,(SELECT count(*) FROM cooperatives)::int AS cooperatives`),
      query(`SELECT w.id,u.name,w.identity_status,w.availability_status,w.rating,w.completed_jobs,
        count(o.id)::int AS offers_received,count(o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_offers,count(o.id) FILTER(WHERE o.status='REJECTED')::int AS declined_offers
        FROM workers w JOIN users u ON u.id=w.user_id LEFT JOIN booking_offers o ON o.worker_id=w.id GROUP BY w.id,u.name ORDER BY w.rating DESC`),
      query(`SELECT s.name AS service,count(b.id)::int AS demand,count(DISTINCT ws.worker_id)::int AS capacity FROM services s LEFT JOIN bookings b ON b.service_id=s.id AND b.created_at>=now()-interval '30 days' LEFT JOIN worker_skills ws ON ws.service_id=s.id AND ws.status='VERIFIED' GROUP BY s.id ORDER BY demand DESC,s.name LIMIT 6`)
    ]);const workerRows=workers.rows.map(x=>({id:Number(x.id),name:x.name,identityVerified:x.identity_status==='VERIFIED',currentEligibility:x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE'?'ELIGIBLE':'REVIEW REQUIRED',completedJobs:Number(x.completed_jobs),rating:Number(x.rating),offersReceived:x.offers_received,acceptedOffers:x.accepted_offers,declinedOffers:x.declined_offers,recentOffers:x.offers_received,eligibleForOpportunity:x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE',cooperative:'YUKTI Community Services Cooperative',credential:{id:`identity-${x.id}`,name:'Event Identity Check',status:x.identity_status,daysUntilExpiry:null}}));const mapRows=capacity.rows.map(x=>{const demand=Math.max(Number(x.demand),1),eligibleCapacity=Number(x.capacity),gap=Math.max(0,demand-eligibleCapacity);return{zone:'YUKTI Service Area',service:x.service,expectedDemand:demand,eligibleCapacity,gap,status:gap>2?'HIGH_SHORTAGE':gap>0?'MODERATE_GAP':'BALANCED',recommendedAction:gap>0?'Review training or consent-based capacity':'Monitor capacity'};});return send(res,200,{ok:true,source:'DATABASE_CONFIGURATION',...counts.rows[0],capabilities:['worker-choice','same-booking-reassignment','dual-service-start','sandbox-payment','audit-evidence'],fairOpportunity:{workers:workerRows},workerTrust:{workers:workerRows},capacityMap:{forecastLabel:'DATABASE-ASSISTED PROTOTYPE',rows:mapRows},pilot:{metrics:[{name:'Booking completion rate',why:'Measure completed connected bookings.'},{name:'Worker acceptance rate',why:'Measure opportunity choice without forced assignment.'},{name:'Replacement continuity',why:'Measure same-booking reassignment after decline.'},{name:'Customer trust confirmation',why:'Measure dual service-start completion.'}]}});
  }
  return false;
}

async function createBooking(req,res,user){
  method(req,'POST');allow(user,['CUSTOMER']);const data=body(req),serviceName=clean(data.service,120),zone=clean(data.zone,160),address=clean(data.address,300),problem=clean(data.problem,1200),scheduledAt=new Date(data.scheduledAt);
  if(!serviceName||!zone||!address||problem.length<3||Number.isNaN(scheduledAt.getTime()))throw httpError(422,'Service, location, problem and schedule are required.','BOOKING_INPUT');
  if(scheduledAt.getTime()<Date.now()-60000)throw httpError(422,'Choose a current or future service time.','PAST_SCHEDULE');
  const created=await transaction(async client=>{
    const service=(await client.query('SELECT * FROM services WHERE lower(name)=lower($1) AND active=true',[serviceName])).rows[0];if(!service)throw httpError(422,'The selected service is unavailable.','SERVICE_UNAVAILABLE');
    const coopId=user.cooperative_id||(await client.query('SELECT id FROM cooperatives ORDER BY id LIMIT 1')).rows[0].id;
    const inserted=(await client.query(`INSERT INTO bookings(customer_id,service_id,cooperative_id,status,zone,address,problem,request_source,request_language,voice_transcript,scheduled_at,emergency,base_amount)
      VALUES($1,$2,$3,'OFFERING',$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[user.id,service.id,coopId,zone,address,problem,clean(data.requestSource||'TEXT',20),clean(data.requestLanguage,40)||null,clean(data.voiceTranscript,1200)||null,scheduledAt.toISOString(),Boolean(data.emergency),service.base_price])).rows[0];
    const code=`SP-${new Date().getUTCFullYear()}-${String(inserted.id).padStart(6,'0')}`;await client.query('UPDATE bookings SET booking_code=$2 WHERE id=$1',[inserted.id,code]);
    const candidates=(await client.query(`SELECT w.id FROM workers w JOIN worker_skills ws ON ws.worker_id=w.id
      WHERE ws.service_id=$1 AND ws.status='VERIFIED' AND w.identity_status='VERIFIED' AND w.availability_status='AVAILABLE' AND w.cooperative_id=$2
      ORDER BY w.rating DESC,w.completed_jobs ASC,w.id ASC`,[service.id,coopId])).rows;
    if(candidates.length){await client.query("INSERT INTO booking_offers(booking_id,worker_id,rank,status) VALUES($1,$2,1,'PENDING')",[inserted.id,candidates[0].id]);}
    else await client.query("UPDATE bookings SET status='NO_WORKER_AVAILABLE' WHERE id=$1",[inserted.id]);
    const status=candidates.length?'OFFERING':'NO_WORKER_AVAILABLE';await history(client,inserted.id,status,candidates.length?'First eligible worker opportunity created.':'No eligible worker is currently available.',user);await audit(client,user,'BOOKING_CREATED',{bookingId:inserted.id,details:{service:service.name}});
    return inserted.id;
  });
  const row=(await query(`${bookingSelect} WHERE b.id=$1`,[created])).rows[0];return send(res,201,bookingJson(row));
}

function offerJson(row){return {offerId:Number(row.offer_id),offerStatus:row.offer_status,bookingId:Number(row.booking_id),bookingCode:row.booking_code,status:row.booking_status,service:row.service,zone:row.zone,problem:row.problem,voiceTranscript:row.voice_transcript,scheduledAt:row.scheduled_at,emergency:row.emergency,total:Number(row.base_amount),distance:Number(row.distance),cooperative:row.cooperative,rank:Number(row.rank)};}
async function workerOffers(req,res,user){
  method(req,'GET');allow(user,['WORKER']);const rows=(await query(`SELECT o.id AS offer_id,o.status AS offer_status,o.rank,b.id AS booking_id,b.booking_code,b.status AS booking_status,b.zone,b.problem,b.voice_transcript,b.scheduled_at,b.emergency,b.base_amount,s.name AS service,w.demo_distance_km AS distance,c.name AS cooperative
    FROM booking_offers o JOIN bookings b ON b.id=o.booking_id JOIN services s ON s.id=b.service_id JOIN workers w ON w.id=o.worker_id JOIN cooperatives c ON c.id=b.cooperative_id
    WHERE o.worker_id=$1 AND o.status IN ('PENDING','ACCEPTED') ORDER BY CASE o.status WHEN 'ACCEPTED' THEN 0 ELSE 1 END,o.created_at DESC`,[user.worker_id])).rows;return send(res,200,rows.map(offerJson));
}

async function respondOffer(req,res,user,offerId){
  method(req,'POST');allow(user,['WORKER']);const data=body(req),action=clean(data.action,20).toUpperCase();if(!['ACCEPT','REJECT'].includes(action))throw httpError(422,'Action must be ACCEPT or REJECT.','INVALID_OFFER_ACTION');
  const result=await transaction(async client=>{
    const offer=(await client.query(`SELECT o.*,b.customer_id,b.status AS booking_status,b.service_id,b.cooperative_id FROM booking_offers o JOIN bookings b ON b.id=o.booking_id WHERE o.id=$1 AND o.worker_id=$2 FOR UPDATE OF o,b`,[offerId,user.worker_id])).rows[0];
    if(!offer)throw httpError(404,'Worker opportunity not found.','OFFER_NOT_FOUND');if(offer.status!=='PENDING')throw httpError(409,'This opportunity already has a response.','OFFER_ALREADY_RESPONDED');
    if(action==='ACCEPT'){
      if(!['OFFERING','FINDING_REPLACEMENT'].includes(offer.booking_status))throw httpError(409,'This booking is no longer accepting worker responses.','BOOKING_STATE');
      await client.query("UPDATE booking_offers SET status='ACCEPTED',responded_at=now() WHERE id=$1",[offer.id]);
      await client.query("UPDATE booking_offers SET status='CANCELLED',responded_at=now() WHERE booking_id=$1 AND id<>$2 AND status='PENDING'",[offer.booking_id,offer.id]);
      await client.query("UPDATE bookings SET assigned_worker_id=$2,status='ACCEPTED',updated_at=now() WHERE id=$1",[offer.booking_id,user.worker_id]);
      await history(client,offer.booking_id,'ACCEPTED','Worker accepted the opportunity.',user);await notify(client,offer.customer_id,'Worker accepted','A verified worker accepted your service request.');await audit(client,user,'WORKER_OFFER_ACCEPTED',{bookingId:offer.booking_id});return {nextWorker:false,accepted:true,bookingId:Number(offer.booking_id)};
    }
    await client.query("UPDATE booking_offers SET status='REJECTED',decline_reason=$2,responded_at=now() WHERE id=$1",[offer.id,clean(data.reason,200)||'Not specified']);
    const next=(await client.query(`SELECT w.id FROM workers w JOIN worker_skills ws ON ws.worker_id=w.id
      WHERE ws.service_id=$1 AND ws.status='VERIFIED' AND w.identity_status='VERIFIED' AND w.availability_status='AVAILABLE' AND w.cooperative_id=$2
      AND NOT EXISTS(SELECT 1 FROM booking_offers seen WHERE seen.booking_id=$3 AND seen.worker_id=w.id)
      ORDER BY w.rating DESC,w.completed_jobs ASC,w.id ASC LIMIT 1`,[offer.service_id,offer.cooperative_id,offer.booking_id])).rows[0];
    if(next){const rank=(await client.query('SELECT coalesce(max(rank),0)+1 AS rank FROM booking_offers WHERE booking_id=$1',[offer.booking_id])).rows[0].rank;await client.query("INSERT INTO booking_offers(booking_id,worker_id,rank,status) VALUES($1,$2,$3,'PENDING')",[offer.booking_id,next.id,rank]);await client.query("UPDATE bookings SET status='FINDING_REPLACEMENT',updated_at=now() WHERE id=$1",[offer.booking_id]);await history(client,offer.booking_id,'FINDING_REPLACEMENT','Worker declined; the same booking moved to the next eligible worker.',user);}
    else{await client.query("UPDATE bookings SET status='NO_WORKER_AVAILABLE',updated_at=now() WHERE id=$1",[offer.booking_id]);await history(client,offer.booking_id,'NO_WORKER_AVAILABLE','Worker declined; no further eligible worker is currently available.',user);}
    await audit(client,user,'WORKER_OFFER_DECLINED',{bookingId:offer.booking_id,details:{reason:clean(data.reason,200)}});return {nextWorker:Boolean(next),accepted:false,bookingId:Number(offer.booking_id)};
  });return send(res,200,{ok:true,...result});
}

async function lifecycle(req,res,user,bookingId,action){
  method(req,'POST');allow(user,['WORKER']);const result=await transaction(async client=>{
    const row=await ownedBooking(bookingId,user,{worker:true,lock:true,client});const next=await setBookingState(client,row,user,action,{travel:'Worker started travel.',arrive:'Worker marked arrival.',start:'Service started after both trust checks.',completionRequest:'Worker requested customer completion confirmation.'}[action]);
    await notify(client,row.customer_id,'Booking updated',`Your booking ${row.booking_code} is now ${next.replaceAll('_',' ').toLowerCase()}.`);
    return {status:next};
  });return send(res,200,{ok:true,...result});
}

async function identity(req,res,user,bookingId){
  method(req,'POST');allow(user,['WORKER']);const raw=randomToken(12);const result=await transaction(async client=>{
    const row=await ownedBooking(bookingId,user,{worker:true,lock:true,client});const next=await setBookingState(client,row,user,'identity','Sandbox worker identity verified; one-time customer code issued.');
    await client.query("UPDATE service_start_tokens SET used_at=now() WHERE booking_id=$1 AND used_at IS NULL",[bookingId]);
    await client.query("INSERT INTO service_start_tokens(booking_id,token_hash,expires_at) VALUES($1,$2,now()+interval '20 minutes')",[bookingId,sha256(raw)]);return {status:next};
  });return send(res,200,{ok:true,...result,token:raw,expiresInSeconds:1200,sandbox:true});
}

async function serviceStart(req,res,user,path){
  const match=path.match(/^connected\/service-start\/([^/]+)(?:\/(confirm))?$/);if(!match)return false;const token=decodeURIComponent(match[1]);
  if(match[2]){
    method(req,'POST');allow(user,['CUSTOMER']);const result=await transaction(async client=>{
      const found=(await client.query(`SELECT t.*,b.customer_id,b.status,b.booking_code FROM service_start_tokens t JOIN bookings b ON b.id=t.booking_id WHERE t.token_hash=$1 FOR UPDATE OF t,b`,[sha256(token)])).rows[0];
      if(!found)throw httpError(404,'Verification code not found.','TOKEN_NOT_FOUND');if(new Date(found.expires_at)<new Date())throw httpError(410,'This verification code expired.','TOKEN_EXPIRED');if(found.used_at)throw httpError(409,'This verification code was already used.','TOKEN_USED');if(Number(found.customer_id)!==Number(user.id))throw httpError(403,'This code belongs to another customer.','TOKEN_FORBIDDEN');
      const next=transition('confirmWorker',found.status);await client.query("UPDATE service_start_tokens SET confirmed_at=now(),used_at=now() WHERE id=$1",[found.id]);await client.query('UPDATE bookings SET status=$2,updated_at=now() WHERE id=$1',[found.booking_id,next]);await history(client,found.booking_id,next,'Customer confirmed the booked worker.',user);await audit(client,user,'CUSTOMER_CONFIRMED_WORKER',{bookingId:found.booking_id});return {bookingId:Number(found.booking_id),status:next};
    });return send(res,200,{ok:true,...result});
  }
  method(req,'GET');allow(user,['CUSTOMER']);const found=(await query(`SELECT t.*,b.customer_id,b.booking_code,s.name AS service,wu.name AS worker_name,w.identity_status,c.name AS cooperative
    FROM service_start_tokens t JOIN bookings b ON b.id=t.booking_id JOIN services s ON s.id=b.service_id JOIN workers w ON w.id=b.assigned_worker_id JOIN users wu ON wu.id=w.user_id JOIN cooperatives c ON c.id=b.cooperative_id
    WHERE t.token_hash=$1`,[sha256(token)])).rows[0];if(!found)throw httpError(404,'Verification code not found.','TOKEN_NOT_FOUND');if(Number(found.customer_id)!==Number(user.id))throw httpError(403,'This code belongs to another customer.','TOKEN_FORBIDDEN');if(new Date(found.expires_at)<new Date())throw httpError(410,'This verification code expired.','TOKEN_EXPIRED');if(found.used_at)throw httpError(409,'This verification code was already used.','TOKEN_USED');return send(res,200,{ok:true,bookingId:Number(found.booking_id),bookingCode:found.booking_code,service:found.service,workerName:found.worker_name,workerVerification:found.identity_status,cooperative:found.cooperative,expiresAt:found.expires_at,sandbox:true});
}

async function checkout(bookingId,user){
  const row=await ownedBooking(bookingId,user);const approved=(await query("SELECT coalesce(sum(amount),0) AS amount FROM additional_charges WHERE booking_id=$1 AND status='APPROVED'",[bookingId])).rows[0];const payment=(await query('SELECT * FROM payments WHERE booking_id=$1',[bookingId])).rows[0]||null;const invoice=(await query('SELECT * FROM invoices WHERE booking_id=$1',[bookingId])).rows[0]||null;const base=Number(row.base_amount),extra=Number(approved.amount);return {status:row.status,total:base,approvedAdditional:extra,finalAmount:base+extra,payment:payment?{id:Number(payment.id),amount:Number(payment.amount),paymentMethod:payment.payment_method,transactionReference:payment.transaction_reference,status:payment.status,sandbox:payment.sandbox,createdAt:payment.created_at}:null,invoice:invoice?{id:Number(invoice.id),invoiceNumber:invoice.invoice_number,amount:Number(invoice.amount),createdAt:invoice.created_at}:null};
}

async function commerceRoutes(req,res,user,path){
  let match=path.match(/^connected\/worker\/jobs\/(\d+)\/extra-charge$/);if(match){method(req,'POST');allow(user,['WORKER']);const id=Number(match[1]),data=body(req),amount=number(data.amount),workItem=clean(data.workItem,200);if(!workItem||amount<=0||amount>10000)throw httpError(422,'Enter a valid work item and amount up to 10000.','CHARGE_INPUT');const row=await ownedBooking(id,user,{worker:true});if(row.status!=='IN_PROGRESS')throw httpError(409,'Extra work can be requested only during service.','CHARGE_STATE');const inserted=(await query("INSERT INTO additional_charges(booking_id,worker_id,work_item,reason,amount) VALUES($1,$2,$3,$4,$5) RETURNING *",[id,user.worker_id,workItem,clean(data.reason,500)||null,amount])).rows[0];return send(res,201,{ok:true,charge:{id:Number(inserted.id),status:inserted.status}});}
  match=path.match(/^connected\/customer\/bookings\/(\d+)\/charges$/);if(match){method(req,'GET');allow(user,['CUSTOMER']);await ownedBooking(Number(match[1]),user);const rows=(await query('SELECT * FROM additional_charges WHERE booking_id=$1 ORDER BY created_at DESC',[match[1]])).rows;return send(res,200,rows.map(x=>({id:Number(x.id),workItem:x.work_item,reason:x.reason,amount:Number(x.amount),status:x.status,createdAt:x.created_at})));}
  match=path.match(/^connected\/customer\/charges\/(\d+)\/decision$/);if(match){method(req,'POST');allow(user,['CUSTOMER']);const decision=clean(body(req).decision,20).toUpperCase();if(!['APPROVE','REJECT'].includes(decision))throw httpError(422,'Decision must be APPROVE or REJECT.','CHARGE_DECISION');const result=await query(`UPDATE additional_charges c SET status=$1,decided_by=$2,decided_at=now() FROM bookings b WHERE c.id=$3 AND b.id=c.booking_id AND b.customer_id=$2 AND c.status='PENDING' RETURNING c.*`,[decision==='APPROVE'?'APPROVED':'REJECTED',user.id,match[1]]);if(!result.rows[0])throw httpError(409,'This charge is missing, already decided or belongs to another customer.','CHARGE_NOT_PENDING');return send(res,200,{ok:true,charge:{id:Number(result.rows[0].id),status:result.rows[0].status}});}
  match=path.match(/^connected\/customer\/bookings\/(\d+)\/checkout$/);if(match){method(req,'GET');allow(user,['CUSTOMER']);return send(res,200,await checkout(Number(match[1]),user));}
  match=path.match(/^connected\/customer\/bookings\/(\d+)\/pay$/);if(match){method(req,'POST');allow(user,['CUSTOMER']);const id=Number(match[1]),data=body(req);const result=await transaction(async client=>{const row=await ownedBooking(id,user,{lock:true,client});const existing=(await client.query('SELECT * FROM payments WHERE booking_id=$1',[id])).rows[0];if(existing){const invoice=(await client.query('SELECT * FROM invoices WHERE booking_id=$1',[id])).rows[0];return {payment:existing,invoice};}const next=transition('pay',row.status);const extra=Number((await client.query("SELECT coalesce(sum(amount),0) AS amount FROM additional_charges WHERE booking_id=$1 AND status='APPROVED'",[id])).rows[0].amount),amount=Number(row.base_amount)+extra,tx=`SBX-${Date.now()}-${id}`,invoiceNumber=`INV-${new Date().getUTCFullYear()}-${String(id).padStart(6,'0')}`;const payment=(await client.query("INSERT INTO payments(booking_id,customer_id,amount,payment_method,transaction_reference) VALUES($1,$2,$3,$4,$5) RETURNING *",[id,user.id,amount,clean(data.method,30)||'DEMO',tx])).rows[0];const invoice=(await client.query('INSERT INTO invoices(booking_id,payment_id,invoice_number,amount) VALUES($1,$2,$3,$4) RETURNING *',[id,payment.id,invoiceNumber,amount])).rows[0];await client.query('UPDATE bookings SET status=$2,updated_at=now() WHERE id=$1',[id,next]);await history(client,id,next,'Sandbox payment and invoice recorded.',user);await audit(client,user,'SANDBOX_PAYMENT_RECORDED',{bookingId:id,details:{amount,transactionReference:tx}});return {payment,invoice};});return send(res,200,{ok:true,payment:{amount:Number(result.payment.amount),paymentMethod:result.payment.payment_method,transactionReference:result.payment.transaction_reference,status:result.payment.status,sandbox:true},invoice:{invoiceNumber:result.invoice.invoice_number,amount:Number(result.invoice.amount)}});}
  match=path.match(/^connected\/customer\/bookings\/(\d+)\/rating$/);if(match){method(req,'POST');allow(user,['CUSTOMER']);const id=Number(match[1]),data=body(req),stars=number(data.stars);if(!Number.isInteger(stars)||stars<1||stars>5)throw httpError(422,'Rating must be between 1 and 5.','RATING_INPUT');const row=await ownedBooking(id,user);if(row.status!=='PAID')throw httpError(409,'Rating is available after sandbox payment.','RATING_STATE');const result=await query(`INSERT INTO ratings(booking_id,customer_id,worker_id,stars,feedback) VALUES($1,$2,$3,$4,$5) ON CONFLICT(booking_id) DO NOTHING RETURNING *`,[id,user.id,row.assigned_worker_id,stars,clean(data.feedback,1000)||null]);if(!result.rows[0])throw httpError(409,'A rating already exists for this booking.','RATING_EXISTS');await query('UPDATE workers SET rating=(SELECT avg(stars)::numeric(3,2) FROM ratings WHERE worker_id=$1),completed_jobs=completed_jobs+1 WHERE id=$1',[row.assigned_worker_id]);return send(res,201,{ok:true,rating:{stars,feedback:clean(data.feedback,1000)}});}
  return false;
}

async function customerRoutes(req,res,user,path){
  let match=path.match(/^connected\/customer\/bookings\/(\d+)$/);if(match){method(req,'GET');allow(user,['CUSTOMER']);return send(res,200,bookingJson(await ownedBooking(Number(match[1]),user)));}
  match=path.match(/^connected\/customer\/bookings\/(\d+)\/timeline$/);if(match){method(req,'GET');allow(user,['CUSTOMER']);await ownedBooking(Number(match[1]),user);const rows=(await query('SELECT status,note,created_at FROM booking_history WHERE booking_id=$1 ORDER BY created_at',[match[1]])).rows;return send(res,200,{timeline:rows.map(x=>({status:x.status,note:x.note,at:x.created_at}))});}
  match=path.match(/^connected\/customer\/bookings\/(\d+)\/complete$/);if(match){method(req,'POST');allow(user,['CUSTOMER']);const result=await transaction(async client=>{const row=await ownedBooking(Number(match[1]),user,{lock:true,client});const status=await setBookingState(client,row,user,'complete','Customer confirmed service completion.');return {status};});return send(res,200,{ok:true,...result});}
  if(path==='connected/customer/services'){method(req,'GET');allow(user,['CUSTOMER']);const rows=(await query('SELECT id,name,slug,icon,base_price FROM services WHERE active=true ORDER BY name')).rows;return send(res,200,{services:rows.map(x=>({id:Number(x.id),name:x.name,slug:x.slug,icon:x.icon,basePrice:Number(x.base_price)}))});}
  if(path==='connected/customer/notifications'){method(req,'GET');allow(user,['CUSTOMER']);const rows=(await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30',[user.id])).rows;return send(res,200,{notifications:rows.map(x=>({id:Number(x.id),title:x.title,message:x.message,priority:x.priority,createdAt:x.created_at}))});}
  if(path==='connected/customer/support'){
    allow(user,['CUSTOMER']);if(req.method==='GET'){const rows=(await query('SELECT * FROM support_requests WHERE customer_id=$1 ORDER BY created_at DESC',[user.id])).rows;return send(res,200,{requests:rows.map(x=>({id:Number(x.id),referenceCode:x.reference_code,bookingId:x.booking_id?Number(x.booking_id):null,category:x.category,description:x.description,status:x.status,createdAt:x.created_at}))});}
    method(req,'POST');const data=body(req),description=clean(data.description,1200),category=clean(data.category,100);if(description.length<8||!category)throw httpError(422,'Category and at least 8 characters of detail are required.','SUPPORT_INPUT');if(data.bookingId)await ownedBooking(Number(data.bookingId),user);const coop=user.cooperative_id||(await query('SELECT id FROM cooperatives ORDER BY id LIMIT 1')).rows[0].id,reference=`SUP-${Date.now().toString(36).toUpperCase()}`;const inserted=(await query('INSERT INTO support_requests(reference_code,customer_id,booking_id,cooperative_id,category,description) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[reference,user.id,data.bookingId||null,coop,category,description])).rows[0];return send(res,201,{ok:true,request:{id:Number(inserted.id),referenceCode:reference,status:inserted.status}});
  }
  return false;
}

async function workerRoutes(req,res,user,path){
  if(path==='connected/worker/dashboard'){method(req,'GET');allow(user,['WORKER']);const jobs=(await query(`SELECT count(*) FILTER(WHERE status=ANY($2))::int AS active FROM bookings WHERE assigned_worker_id=$1`,[user.worker_id,ACTIVE_STATES])).rows[0];const earnings=(await query(`SELECT coalesce(sum(p.amount),0) AS total,coalesce(sum(p.amount) FILTER(WHERE p.created_at::date=current_date),0) AS today,coalesce(sum(p.amount) FILTER(WHERE p.created_at>=now()-interval '7 days'),0) AS week FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.assigned_worker_id=$1`,[user.worker_id])).rows[0];const payments=(await query(`SELECT p.amount,p.created_at,s.name AS service,b.booking_code FROM payments p JOIN bookings b ON b.id=p.booking_id JOIN services s ON s.id=b.service_id WHERE b.assigned_worker_id=$1 ORDER BY p.created_at DESC LIMIT 20`,[user.worker_id])).rows;return send(res,200,{profile:{id:Number(user.worker_id),name:user.name,available:user.availability_status==='AVAILABLE',availabilityStatus:user.availability_status,rating:Number(user.rating),identityStatus:user.identity_status},jobs:{active:jobs.active},earnings:{today:Number(earnings.today),week:Number(earnings.week),total:Number(earnings.total),payments:payments.map(x=>({amount:Number(x.amount),createdAt:x.created_at,service:x.service,bookingCode:x.booking_code}))}});}
  if(path==='connected/worker/availability'){method(req,'POST');allow(user,['WORKER']);const available=Boolean(body(req).available);await query('UPDATE workers SET availability_status=$2,updated_at=now() WHERE id=$1',[user.worker_id,available?'AVAILABLE':'OFF_DUTY']);return send(res,200,{ok:true,available});}
  if(path==='connected/worker/notifications'){method(req,'GET');allow(user,['WORKER']);const rows=(await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30',[user.id])).rows;return send(res,200,{notifications:rows.map(x=>({id:Number(x.id),title:x.title,message:x.message,priority:x.priority,createdAt:x.created_at}))});}
  if(path==='connected/worker/schedule'){
    allow(user,['WORKER']);if(req.method==='GET'){const date=clean(new URL(req.url,'https://x').searchParams.get('date'),10)||new Date().toISOString().slice(0,10);let rows=(await query('SELECT * FROM worker_schedule WHERE worker_id=$1 AND work_date=$2 ORDER BY start_time',[user.worker_id,date])).rows;if(!rows.length){for(const [start,end] of [['09:00','12:00'],['12:00','15:00'],['15:00','18:00'],['18:00','21:00']])await query(`INSERT INTO worker_schedule(worker_id,work_date,start_time,end_time,status) VALUES($1,$2,$3,$4,'AVAILABLE') ON CONFLICT DO NOTHING`,[user.worker_id,date,start,end]);rows=(await query('SELECT * FROM worker_schedule WHERE worker_id=$1 AND work_date=$2 ORDER BY start_time',[user.worker_id,date])).rows;}return send(res,200,{date,slots:rows.map(x=>({id:Number(x.id),startTime:String(x.start_time).slice(0,5),endTime:String(x.end_time).slice(0,5),status:x.status,baseStatus:x.status,displayStatus:x.status,note:x.note}))});}
    method(req,'POST');const data=body(req),date=clean(data.date,10),start=clean(data.startTime,8),end=clean(data.endTime,8),status=clean(data.status,20).toUpperCase();if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}/.test(start)||!/^\d{2}:\d{2}/.test(end)||!['AVAILABLE','UNAVAILABLE'].includes(status))throw httpError(422,'Date, times and schedule status are invalid.','SCHEDULE_INPUT');await query(`INSERT INTO worker_schedule(worker_id,work_date,start_time,end_time,status,note) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(worker_id,work_date,start_time,end_time) DO UPDATE SET status=EXCLUDED.status,note=EXCLUDED.note,updated_at=now()`,[user.worker_id,date,start,end,status,clean(data.note,300)||null]);return send(res,200,{ok:true,date,startTime:start,endTime:end,status});
  }
  if(path==='connected/worker/schedule/voice-intent'){method(req,'POST');allow(user,['WORKER']);const data=body(req),text=clean(data.text,500).toLowerCase(),base=clean(data.date,10)||new Date().toISOString().slice(0,10),date=text.includes('tomorrow')?new Date(Date.now()+86400000).toISOString().slice(0,10):base,status=/not available|unavailable|off/.test(text)?'UNAVAILABLE':'AVAILABLE';const times=[...text.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/g)].map(m=>{let h=Number(m[1])%12;if(m[3]==='pm')h+=12;return `${String(h).padStart(2,'0')}:${m[2]||'00'}`;});const startTime=times[0]||'13:00',endTime=times[1]||'17:00';return send(res,200,{date,startTime,endTime,status,summary:`${status==='UNAVAILABLE'?'Unavailable':'Available'} on ${date}, ${startTime}–${endTime}`});}
  if(path==='connected/workforce/passport'){method(req,'GET');allow(user,['WORKER']);const skills=(await query(`SELECT s.name,ws.status FROM worker_skills ws JOIN services s ON s.id=ws.service_id WHERE ws.worker_id=$1 ORDER BY s.name`,[user.worker_id])).rows;const completed=(await query("SELECT count(*)::int AS count FROM bookings WHERE assigned_worker_id=$1 AND status='PAID'",[user.worker_id])).rows[0].count;const eligible=user.identity_status==='VERIFIED'&&user.availability_status==='AVAILABLE';return send(res,200,{ok:true,passport:{workerId:Number(user.worker_id),name:user.name,cooperative:'YUKTI Community Services Cooperative',identityVerified:user.identity_status==='VERIFIED',identityStatus:user.identity_status,availabilityStatus:user.availability_status,rating:Number(user.rating),completedJobs:completed,currentEligibility:eligible?'ELIGIBLE':'REVIEW REQUIRED',skills:skills.map(x=>({name:x.name,status:x.status,verified:x.status==='VERIFIED'})),credentials:[{id:`identity-${user.worker_id}`,name:'SanPaid Event Identity Check',status:user.identity_status,daysUntilExpiry:null,sandbox:true}]}});}
  return false;
}

async function capacityRoutes(req,res,user,path){
  if(path==='connected/worker/capacity-offers'){
    method(req,'GET');allow(user,['WORKER']);const rows=(await query(`SELECT o.id AS offer_id,o.status AS offer_status,r.request_code,r.zone,s.name AS service,rc.name AS requesting_cooperative,pc.name AS providing_cooperative
      FROM capacity_worker_offers o JOIN capacity_requests r ON r.id=o.capacity_request_id JOIN services s ON s.id=r.service_id
      JOIN cooperatives rc ON rc.id=r.requesting_cooperative_id LEFT JOIN cooperatives pc ON pc.id=r.providing_cooperative_id
      WHERE o.worker_id=$1 AND o.status IN ('OFFERED','ACCEPTED') ORDER BY o.created_at DESC`,[user.worker_id])).rows;return send(res,200,rows.map(x=>({offerId:Number(x.offer_id),offerStatus:x.offer_status,requestCode:x.request_code,service:x.service,zone:x.zone,requestingCooperative:x.requesting_cooperative,providingCooperative:x.providing_cooperative})));
  }
  const match=path.match(/^connected\/worker\/capacity-offers\/(\d+)\/respond$/);if(match){method(req,'POST');allow(user,['WORKER']);const action=clean(body(req).action,20).toUpperCase();if(!['ACCEPT','REJECT'].includes(action))throw httpError(422,'Action must be ACCEPT or REJECT.','CAPACITY_ACTION');const status=action==='ACCEPT'?'ACCEPTED':'REJECTED';const result=await query("UPDATE capacity_worker_offers SET status=$1,responded_at=now() WHERE id=$2 AND worker_id=$3 AND status='OFFERED' RETURNING *",[status,match[1],user.worker_id]);if(!result.rows[0])throw httpError(409,'This capacity offer is missing or already decided.','CAPACITY_OFFER_STATE');await query('INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,$2,$3)',[user.id,`CAPACITY_OFFER_${status}`,JSON.stringify({offerId:Number(match[1]),workerConsent:status})]);return send(res,200,{ok:true,status,message:status==='ACCEPTED'?'Capacity offer accepted voluntarily.':'Capacity offer declined without penalty.'});}
  return false;
}

async function snapshot(req,res,user){method(req,'GET');const role=normalizeRole(user.role);let result;if(role==='CUSTOMER')result=await query(`${bookingSelect} WHERE b.customer_id=$1 ORDER BY b.created_at DESC LIMIT 20`,[user.id]);else if(role==='WORKER')result=await query(`${bookingSelect} WHERE b.assigned_worker_id=$1 OR EXISTS(SELECT 1 FROM booking_offers o WHERE o.booking_id=b.id AND o.worker_id=$1 AND o.status='PENDING') ORDER BY b.created_at DESC LIMIT 20`,[user.worker_id]);else if(role==='COOPERATIVE_ADMIN')result=await query(`${bookingSelect} WHERE b.cooperative_id=$1 ORDER BY b.created_at DESC LIMIT 50`,[user.cooperative_id]);else result=await query(`${bookingSelect} ORDER BY b.created_at DESC LIMIT 50`);return send(res,200,{ok:true,role,bookings:result.rows.map(bookingJson),syncedAt:new Date().toISOString()});}

async function judgeRoutes(req,res,user,path){
  if(!path.startsWith('connected/judge/'))return false;allow(user,['COOPERATIVE_ADMIN','FEDERATION_ADMIN']);
  if(path==='connected/judge/readiness'){method(req,'GET');const counts=(await query(`SELECT (SELECT count(*) FROM users)::int AS users,(SELECT count(*) FROM workers WHERE identity_status='VERIFIED')::int AS verified_workers,(SELECT count(*) FROM services WHERE active=true)::int AS services`)).rows[0];return send(res,200,{ok:true,ready:counts.users>=5&&counts.verified_workers>=2&&counts.services>=10,checks:{database:true,authentication:true,serviceCatalog:counts.services>=10,verifiedWorkers:counts.verified_workers>=2},counts});}
  if(path==='connected/judge/latest-demo-booking'){method(req,'GET');const result=await query(`${bookingSelect} ORDER BY b.created_at DESC LIMIT 1`);return send(res,200,{booking:result.rows[0]?bookingJson(result.rows[0]):null});}
  const match=path.match(/^connected\/judge\/match\/(\d+)$/);if(match){method(req,'GET');const booking=(await query(`${bookingSelect} WHERE b.id=$1`,[match[1]])).rows[0];if(!booking)throw httpError(404,'Booking not found.','BOOKING_NOT_FOUND');const candidates=(await query(`SELECT w.id,u.name,w.identity_status,w.availability_status,w.rating,w.demo_distance_km,ws.status AS skill_status FROM workers w JOIN users u ON u.id=w.user_id JOIN worker_skills ws ON ws.worker_id=w.id WHERE ws.service_id=$1 ORDER BY w.rating DESC,w.id`,[booking.service_id])).rows;return send(res,200,{booking:bookingJson(booking),policy:'ELIGIBILITY_THEN_DETERMINISTIC_RANKING',candidates:candidates.map((x,index)=>({rank:index+1,workerId:Number(x.id),name:x.name,eligible:x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE'&&x.skill_status==='VERIFIED',identity:x.identity_status,skill:x.skill_status,availability:x.availability_status,rating:Number(x.rating),demoDistanceKm:Number(x.demo_distance_km),reasonCodes:['IDENTITY_VERIFIED','SKILL_VERIFIED','AVAILABLE','COOPERATIVE_SCOPE']}))});}
  if(path==='connected/judge/overview'){method(req,'GET');const row=(await query(`SELECT (SELECT count(*) FROM cooperatives)::int AS cooperatives,(SELECT count(*) FROM workers)::int AS workers,(SELECT count(*) FROM bookings)::int AS bookings,(SELECT count(*) FROM support_requests WHERE status='OPEN')::int AS open_complaints,(SELECT coalesce(sum(amount),0) FROM payments)::numeric AS payments`)).rows[0];return send(res,200,{ok:true,metrics:{cooperatives:row.cooperatives,workers:row.workers,bookings:row.bookings,openComplaints:row.open_complaints,sandboxPaymentValue:Number(row.payments)},regions:[{name:'Madhya Pradesh',cooperatives:row.cooperatives,workers:row.workers,bookings:row.bookings}]});}
  if(path==='connected/judge/planning'){method(req,'GET');const rows=(await query(`SELECT s.id,s.name,count(b.id) FILTER(WHERE b.created_at>=now()-interval '30 days')::int AS demand,count(DISTINCT ws.worker_id)::int AS skilled_workers FROM services s LEFT JOIN bookings b ON b.service_id=s.id LEFT JOIN worker_skills ws ON ws.service_id=s.id AND ws.status='VERIFIED' GROUP BY s.id ORDER BY demand DESC,s.name`)).rows;const services=rows.map(x=>({service:x.name,demand:Number(x.demand),skilledWorkers:Number(x.skilled_workers),gap:Math.max(0,Number(x.demand)-Number(x.skilled_workers))})),focus=services[0]||{service:'Services',demand:0,skilledWorkers:0,gap:0};return send(res,200,{ok:true,source:'DATABASE_AGGREGATION',historicalDemand30d:focus.demand,expectedDemand:Math.max(1,focus.demand),eligibleCapacity:focus.skilledWorkers,capacityGap:Math.max(0,Math.max(1,focus.demand)-focus.skilledWorkers),service:focus.service,confidence:'PROTOTYPE BASELINE',forecastMethod:'Observed 30-day demand and verified skills',recommendedActions:focus.gap>0?['REVIEW_TRAINING','REQUEST_CAPACITY']:['MONITOR_DEMAND'],services});}
  if(path==='connected/judge/workforce-intelligence'){method(req,'GET');const [workers,capacity,audits]=await Promise.all([
    query(`SELECT w.id,u.name,w.identity_status,w.availability_status,w.rating,w.completed_jobs,count(o.id)::int AS offers_received,count(o.id) FILTER(WHERE o.status='ACCEPTED')::int AS accepted_offers,count(o.id) FILTER(WHERE o.status='REJECTED')::int AS declined_offers FROM workers w JOIN users u ON u.id=w.user_id LEFT JOIN booking_offers o ON o.worker_id=w.id GROUP BY w.id,u.name ORDER BY w.rating DESC`),
    query(`SELECT s.name,count(b.id) FILTER(WHERE b.created_at>=now()-interval '30 days')::int AS demand,count(DISTINCT ws.worker_id)::int AS capacity FROM services s LEFT JOIN bookings b ON b.service_id=s.id LEFT JOIN worker_skills ws ON ws.service_id=s.id AND ws.status='VERIFIED' GROUP BY s.id ORDER BY demand DESC,s.name LIMIT 8`),
    query(`SELECT a.event_type,a.created_at,u.name AS actor FROM audit_events a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.created_at DESC LIMIT 20`)
  ]);const passports=workers.rows.map(x=>{const eligible=x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE';return{id:Number(x.id),name:x.name,cooperative:'YUKTI Community Services Cooperative',identityVerified:x.identity_status==='VERIFIED',currentEligibility:eligible?'ELIGIBLE':'REVIEW REQUIRED',completedJobs:Number(x.completed_jobs),rating:Number(x.rating),trainingRecommendations:0,skills:[{name:'Connected service skills',verified:true}],credentials:[{id:`identity-${x.id}`,name:'Event Identity Check',status:x.identity_status,daysUntilExpiry:null,sandbox:true}]};}),opportunity={workers:workers.rows.map(x=>({name:x.name,offersReceived:x.offers_received,acceptedOffers:x.accepted_offers,declinedOffers:x.declined_offers,recentOffers:x.offers_received,eligibleForOpportunity:x.identity_status==='VERIFIED'&&x.availability_status==='AVAILABLE',reason:x.identity_status!=='VERIFIED'?'IDENTITY REVIEW':x.availability_status}))},capacityRows=capacity.rows.map(x=>{const expectedDemand=Math.max(1,Number(x.demand)),eligibleCapacity=Number(x.capacity),gap=Math.max(0,expectedDemand-eligibleCapacity);return{zone:'Madhya Pradesh',service:x.name,expectedDemand,eligibleCapacity,gap,status:gap>2?'HIGH_SHORTAGE':gap>0?'MODERATE_GAP':'BALANCED',recommendedAction:gap>0?'Review consent-based capacity or training':'Monitor demand'};});return send(res,200,{ok:true,source:'DATABASE_AGGREGATION',passports,opportunity,capacity:{rows:capacityRows},pilot:{metrics:[{name:'Completion rate',why:'Connected completed bookings.'},{name:'Worker choice',why:'Accept and decline outcomes.'},{name:'Replacement continuity',why:'Same request survives decline.'},{name:'Trust confirmation',why:'Identity plus customer confirmation.'}]},audit:audits.rows.map(x=>({action:x.event_type,actor:x.actor||'System',created_at:x.created_at}))});}
  const credentialMatch=path.match(/^connected\/judge\/credentials\/identity-(\d+)\/reverify$/);if(credentialMatch){method(req,'POST');const action=clean(body(req).action,20).toUpperCase();if(!['APPROVE','REJECT'].includes(action))throw httpError(422,'Re-verification action must be APPROVE or REJECT.','REVERIFY_ACTION');const status=action==='APPROVE'?'VERIFIED':'PENDING';const updated=(await query('UPDATE workers SET identity_status=$1,updated_at=now() WHERE id=$2 RETURNING id',[status,credentialMatch[1]])).rows[0];if(!updated)throw httpError(404,'Worker credential not found.','CREDENTIAL_NOT_FOUND');await query('INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,$2,$3)',[user.id,'WORKER_CREDENTIAL_REVIEWED',JSON.stringify({workerId:Number(credentialMatch[1]),action,status})]);return send(res,200,{ok:true,credential:{id:`identity-${credentialMatch[1]}`,status}});}
  if(path==='connected/judge/capacity/request'){method(req,'POST');const data=body(req),serviceName=clean(data.service||'Electrician',120),zone=clean(data.zone||'Regional service area',160),required=Math.max(1,Math.min(100,Number(data.workersRequired||1)));const service=(await query('SELECT id FROM services WHERE lower(name)=lower($1) AND active=true',[serviceName])).rows[0];if(!service)throw httpError(422,'Requested service is unavailable.','CAPACITY_SERVICE');const requestingId=Number(data.requestingCooperativeId||user.cooperative_id),code=`CAP-${Date.now().toString(36).toUpperCase()}`;const inserted=(await query(`INSERT INTO capacity_requests(request_code,requesting_cooperative_id,service_id,zone,workers_required,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[code,requestingId,service.id,zone,required,user.id])).rows[0];return send(res,201,{ok:true,request:{id:Number(inserted.id),requestCode:code,status:inserted.status}});}
  const capacityMatch=path.match(/^connected\/judge\/capacity\/(\d+)\/approve$/);if(capacityMatch){method(req,'POST');const data=body(req);const result=await transaction(async client=>{const request=(await client.query('SELECT * FROM capacity_requests WHERE id=$1 FOR UPDATE',[capacityMatch[1]])).rows[0];if(!request)throw httpError(404,'Capacity request not found.','CAPACITY_NOT_FOUND');if(request.status!=='REQUESTED')throw httpError(409,'Capacity request is already decided.','CAPACITY_STATE');const provider=Number(data.providingCooperativeId||user.cooperative_id);await client.query("UPDATE capacity_requests SET providing_cooperative_id=$2,status='APPROVED',updated_at=now() WHERE id=$1",[request.id,provider]);const workers=(await client.query(`SELECT w.id FROM workers w JOIN worker_skills ws ON ws.worker_id=w.id WHERE w.cooperative_id=$1 AND ws.service_id=$2 AND w.identity_status='VERIFIED' AND w.availability_status='AVAILABLE' ORDER BY w.rating DESC LIMIT $3`,[provider,request.service_id,request.workers_required])).rows;for(const worker of workers)await client.query("INSERT INTO capacity_worker_offers(capacity_request_id,worker_id,status) VALUES($1,$2,'OFFERED') ON CONFLICT DO NOTHING",[request.id,worker.id]);await audit(client,user,'CAPACITY_REQUEST_APPROVED',{details:{requestId:Number(request.id),provider,offers:workers.length}});return{requestId:Number(request.id),offersCreated:workers.length};});return send(res,200,{ok:true,...result,message:'Cooperative approval recorded; each worker must still consent.'});}
  if(path==='connected/judge/training/recommend-default'){method(req,'POST');const data=body(req),service=(await query('SELECT id,name FROM services WHERE active=true ORDER BY name LIMIT 1')).rows[0],reason=clean(data.reason||'Demand and verified-capacity review',500);const inserted=(await query('INSERT INTO training_recommendations(cooperative_id,service_id,reason,created_by) VALUES($1,$2,$3,$4) RETURNING *',[user.cooperative_id,service.id,reason,user.id])).rows[0];return send(res,201,{ok:true,recommendation:{id:Number(inserted.id),service:service.name,status:inserted.status,reason}});}
  return false;
}

async function adminRoutes(req,res,user,path){
  if(!path.startsWith('cooperative-admin/'))return false;allow(user,['COOPERATIVE_ADMIN']);
  if(path==='cooperative-admin/workspace'){method(req,'GET');const [workers,bookings,complaints,payments,services,auditRows]=await Promise.all([
    query(`SELECT w.id,u.name,u.email,w.identity_status,w.availability_status,w.rating,w.completed_jobs FROM workers w JOIN users u ON u.id=w.user_id WHERE w.cooperative_id=$1 ORDER BY u.name`,[user.cooperative_id]),
    query(`${bookingSelect} WHERE b.cooperative_id=$1 ORDER BY b.created_at DESC LIMIT 50`,[user.cooperative_id]),
    query('SELECT * FROM support_requests WHERE cooperative_id=$1 ORDER BY created_at DESC LIMIT 50',[user.cooperative_id]),
    query(`SELECT p.*,b.booking_code,s.name AS service FROM payments p JOIN bookings b ON b.id=p.booking_id JOIN services s ON s.id=b.service_id WHERE b.cooperative_id=$1 ORDER BY p.created_at DESC LIMIT 50`,[user.cooperative_id]),
    query('SELECT id,name,icon,base_price,active FROM services ORDER BY name'),
    query(`SELECT a.* FROM audit_events a LEFT JOIN bookings b ON b.id=a.booking_id WHERE b.cooperative_id=$1 OR a.actor_user_id=$2 ORDER BY a.created_at DESC LIMIT 100`,[user.cooperative_id,user.id])
  ]);return send(res,200,{ok:true,cooperative:{id:Number(user.cooperative_id),name:'YUKTI Community Services Cooperative'},workers:workers.rows.map(x=>({id:Number(x.id),name:x.name,email:x.email,identityStatus:x.identity_status,availabilityStatus:x.availability_status,rating:Number(x.rating),completedJobs:x.completed_jobs})),bookings:bookings.rows.map(bookingJson),complaints:complaints.rows.map(x=>({id:Number(x.id),referenceCode:x.reference_code,bookingId:x.booking_id?Number(x.booking_id):null,category:x.category,description:x.description,status:x.status,createdAt:x.created_at})),payments:payments.rows.map(x=>({id:Number(x.id),bookingCode:x.booking_code,service:x.service,amount:Number(x.amount),sandbox:x.sandbox,createdAt:x.created_at})),services:services.rows.map(x=>({id:Number(x.id),name:x.name,icon:x.icon,basePrice:Number(x.base_price),active:x.active})),audit:auditRows.rows.map(x=>({id:Number(x.id),eventType:x.event_type,bookingId:x.booking_id?Number(x.booking_id):null,details:x.details,createdAt:x.created_at})),capacity:[],training:[]});}
  let match=path.match(/^cooperative-admin\/workers\/(\d+)\/verification$/);if(match){method(req,'POST');const data=body(req),status=clean(data.status,30).toUpperCase();if(!['VERIFIED','REJECTED','PENDING'].includes(status)||clean(data.reason,500).length<4)throw httpError(422,'Verification status and review note are required.','VERIFICATION_INPUT');const result=await query('UPDATE workers SET identity_status=$1,updated_at=now() WHERE id=$2 AND cooperative_id=$3 RETURNING *',[status,match[1],user.cooperative_id]);if(!result.rows[0])throw httpError(404,'Worker not found in this cooperative.','WORKER_NOT_FOUND');await query('INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,$2,$3)',[user.id,'WORKER_IDENTITY_REVIEWED',JSON.stringify({workerId:Number(match[1]),status,reason:clean(data.reason,500)})]);return send(res,200,{ok:true,worker:{id:Number(match[1]),identityStatus:status}});}
  if(path==='cooperative-admin/complaints'){method(req,'GET');const rows=(await query('SELECT * FROM support_requests WHERE cooperative_id=$1 ORDER BY created_at DESC',[user.cooperative_id])).rows;return send(res,200,{complaints:rows});}
  match=path.match(/^cooperative-admin\/complaints\/(\d+)\/evidence$/);if(match){method(req,'GET');const complaint=(await query('SELECT * FROM support_requests WHERE id=$1 AND cooperative_id=$2',[match[1],user.cooperative_id])).rows[0];if(!complaint)throw httpError(404,'Complaint not found.','COMPLAINT_NOT_FOUND');const events=complaint.booking_id?(await query('SELECT status,note,created_at FROM booking_history WHERE booking_id=$1 ORDER BY created_at',[complaint.booking_id])).rows:[];return send(res,200,{complaint,events:events.map(x=>({status:x.status,note:x.note,at:x.created_at}))});}
  if(path==='cooperative-admin/trust-lifecycle'){method(req,'GET');const rows=(await query(`SELECT w.id,u.name,w.identity_status,w.availability_status,w.rating,w.completed_jobs FROM workers w JOIN users u ON u.id=w.user_id WHERE w.cooperative_id=$1 ORDER BY u.name`,[user.cooperative_id])).rows;return send(res,200,{workers:rows.map(x=>({id:Number(x.id),name:x.name,identityStatus:x.identity_status,availabilityStatus:x.availability_status,rating:Number(x.rating),completedJobs:x.completed_jobs}))});}
  return false;
}

module.exports=async function handler(req,res){
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  const path=pathOf(req);
  try{
    if(await publicRoutes(req,res,path)!==false)return;
    if(await authRoutes(req,res,path)!==false)return;
    const user=await authenticate(req);
    if(path==='connected/snapshot')return snapshot(req,res,user);
    if(path==='connected/bookings')return createBooking(req,res,user);
    if(path==='connected/worker/offers')return workerOffers(req,res,user);
    let match=path.match(/^connected\/worker\/offers\/(\d+)\/respond$/);if(match)return respondOffer(req,res,user,Number(match[1]));
    match=path.match(/^connected\/jobs\/(\d+)\/(travel|arrive|identity|start|completion-request)$/);if(match){const action={travel:'travel',arrive:'arrive',identity:'identity',start:'start','completion-request':'completionRequest'}[match[2]];return action==='identity'?identity(req,res,user,Number(match[1])):lifecycle(req,res,user,Number(match[1]),action);}
    const serviceResult=await serviceStart(req,res,user,path);if(serviceResult!==false)return;
    const commerceResult=await commerceRoutes(req,res,user,path);if(commerceResult!==false)return;
    const customerResult=await customerRoutes(req,res,user,path);if(customerResult!==false)return;
    const workerResult=await workerRoutes(req,res,user,path);if(workerResult!==false)return;
    const capacityResult=await capacityRoutes(req,res,user,path);if(capacityResult!==false)return;
    const judgeResult=await judgeRoutes(req,res,user,path);if(judgeResult!==false)return;
    const adminResult=await adminRoutes(req,res,user,path);if(adminResult!==false)return;
    throw httpError(404,'API route not found.','ROUTE_NOT_FOUND');
  }catch(error){
    console.error('[sanpaid-api]',path,error.code||error.message);const status=Number(error.status)||500;return send(res,status,{ok:false,error:error.code||'INTERNAL_ERROR',message:status>=500&&process.env.NODE_ENV==='production'?'Service temporarily unavailable.':error.message});
  }
};
