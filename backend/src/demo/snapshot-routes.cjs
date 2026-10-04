'use strict';

const {query}=require('../../../api/_lib/db.cjs');
const {normalizeRole}=require('../../../api/_lib/policy.cjs');
const {authenticate,send}=require('../shared/auth-context.cjs');
const {isScopedDemoEmail}=require('../../../api/_lib/demo-workspace.cjs');

const bookingSelect=`SELECT b.*,s.name AS service,s.icon AS service_icon,u.name AS customer_name,
  wu.name AS worker_name,w.identity_status AS worker_verification,w.demo_distance_km AS distance,c.name AS cooperative
  FROM bookings b JOIN services s ON s.id=b.service_id JOIN users u ON u.id=b.customer_id
  JOIN cooperatives c ON c.id=b.cooperative_id LEFT JOIN workers w ON w.id=b.assigned_worker_id LEFT JOIN users wu ON wu.id=w.user_id`;

function bookingJson(row){return {id:Number(row.id),bookingCode:row.booking_code,customerId:Number(row.customer_id),service:row.service,serviceIcon:row.service_icon,status:row.status,zone:row.zone,address:row.address,problem:row.problem,requestSource:row.request_source,requestLanguage:row.request_language,voiceTranscript:row.voice_transcript,scheduledAt:row.scheduled_at,emergency:row.emergency,total:Number(row.base_amount),workerId:row.assigned_worker_id?Number(row.assigned_worker_id):null,workerName:row.worker_name||null,workerVerification:row.worker_verification||null,distance:row.distance==null?null:Number(row.distance),cooperative:isScopedDemoEmail(row.customer_email)?'YUKTI Community Services Cooperative':String(row.cooperative||'').replace(/ · [a-f0-9]{20}$/i,''),createdAt:row.created_at,updatedAt:row.updated_at};}

async function snapshot(req,res,user){
  if(req.method!=='GET')return send(res,405,{ok:false,error:'METHOD_NOT_ALLOWED',message:'Use GET for this endpoint.'});
  const role=normalizeRole(user.role);let result;
  if(role==='CUSTOMER')result=await query(`${bookingSelect} WHERE b.customer_id=$1 ORDER BY b.created_at DESC LIMIT 20`,[user.id]);
  else if(role==='WORKER')result=await query(`${bookingSelect} WHERE b.assigned_worker_id=$1 OR EXISTS(SELECT 1 FROM booking_offers o WHERE o.booking_id=b.id AND o.worker_id=$1 AND o.status='PENDING') ORDER BY b.created_at DESC LIMIT 20`,[user.worker_id]);
  else if(role==='COOPERATIVE_ADMIN')result=await query(`${bookingSelect} WHERE b.cooperative_id=$1 ORDER BY b.created_at DESC LIMIT 50`,[user.cooperative_id]);
  else if(role==='FEDERATION_ADMIN'&&isScopedDemoEmail(user.email))result=await query(`${bookingSelect} WHERE b.cooperative_id=$1 ORDER BY b.created_at DESC LIMIT 50`,[user.cooperative_id]);
  else result=await query(`${bookingSelect} ORDER BY b.created_at DESC LIMIT 50`);
  return send(res,200,{ok:true,role,bookings:result.rows.map(bookingJson),syncedAt:new Date().toISOString()});
}

async function handle(req,res,path){
  if(path!=='connected/snapshot')return false;
  const user=await authenticate(req);
  await snapshot(req,res,user);
  return true;
}

module.exports={handle};
