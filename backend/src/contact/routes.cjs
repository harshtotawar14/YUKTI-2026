'use strict';

const {query,transaction}=require('../../../api/_lib/db.cjs');
const {normalizeRole}=require('../../../api/_lib/policy.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');

const CALLABLE_STATES=new Set([
  'ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION'
]);
let schemaPromise=null;

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}
function normalizePhone(value){
  const raw=String(value??'').trim();
  let digits=raw.replace(/\D/g,'');
  if(digits.length===10)digits=`91${digits}`;
  if(digits.length<8||digits.length>15||digits.startsWith('0'))throw httpError(422,'Enter a valid mobile number with country code.','INVALID_PHONE');
  return `+${digits}`;
}
function maskPhone(phone){const value=String(phone||'');if(!value)return'';const tail=value.slice(-4);return `${value.slice(0,Math.min(3,value.length-4))}••••${tail}`;}

async function ensureContactSchema(){
  if(!schemaPromise){
    schemaPromise=query(`CREATE TABLE IF NOT EXISTS user_contacts (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      phone_e164 TEXT NOT NULL CHECK (phone_e164 ~ '^\\+[1-9][0-9]{7,14}$'),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`).catch(error=>{schemaPromise=null;throw error;});
  }
  return schemaPromise;
}

async function ownContact(req,res,user){
  allow(user,['CUSTOMER','WORKER']);
  await ensureContactSchema();
  if(req.method==='GET'){
    const row=(await query('SELECT phone_e164,updated_at FROM user_contacts WHERE user_id=$1',[user.id])).rows[0];
    return send(res,200,{ok:true,configured:Boolean(row?.phone_e164),phone:row?.phone_e164||null,maskedPhone:maskPhone(row?.phone_e164),updatedAt:row?.updated_at||null});
  }
  method(req,'PATCH');
  const phone=normalizePhone(body(req).phone);
  await transaction(async client=>{
    await client.query(`INSERT INTO user_contacts(user_id,phone_e164,updated_at) VALUES($1,$2,now())
      ON CONFLICT(user_id) DO UPDATE SET phone_e164=EXCLUDED.phone_e164,updated_at=now()`,[user.id,phone]);
    await client.query('INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,$2,$3)',[user.id,'CONTACT_PHONE_UPDATED',JSON.stringify({channel:'PHONE'})]);
  });
  return send(res,200,{ok:true,configured:true,phone,maskedPhone:maskPhone(phone)});
}

async function bookingContact(req,res,user,bookingId){
  method(req,'GET');allow(user,['CUSTOMER','WORKER']);await ensureContactSchema();
  const row=(await query(`SELECT b.id,b.status,b.customer_id,b.assigned_worker_id,
      cu.name AS customer_name,cc.phone_e164 AS customer_phone,
      w.user_id AS worker_user_id,wu.name AS worker_name,wc.phone_e164 AS worker_phone
    FROM bookings b
    JOIN users cu ON cu.id=b.customer_id
    LEFT JOIN workers w ON w.id=b.assigned_worker_id
    LEFT JOIN users wu ON wu.id=w.user_id
    LEFT JOIN user_contacts cc ON cc.user_id=cu.id
    LEFT JOIN user_contacts wc ON wc.user_id=wu.id
    WHERE b.id=$1`,[bookingId])).rows[0];
  if(!row)throw httpError(404,'Booking not found.','BOOKING_NOT_FOUND');
  const role=normalizeRole(user.role),status=String(row.status||'').toUpperCase();
  if(role==='CUSTOMER'&&Number(row.customer_id)!==Number(user.id))throw httpError(403,'This booking belongs to another customer.','BOOKING_FORBIDDEN');
  if(role==='WORKER'&&Number(row.assigned_worker_id)!==Number(user.worker_id))throw httpError(403,'This job is not assigned to this worker.','JOB_FORBIDDEN');
  if(!row.assigned_worker_id||!CALLABLE_STATES.has(status)){
    return send(res,200,{ok:true,available:false,locked:true,status,message:'Calling unlocks only after a worker accepts the booking and remains available during the active service journey.'});
  }
  const counterpart=role==='CUSTOMER'
    ? {role:'WORKER',name:row.worker_name||'Assigned worker',phone:row.worker_phone||null}
    : {role:'CUSTOMER',name:row.customer_name||'Customer',phone:row.customer_phone||null};
  return send(res,200,{ok:true,available:Boolean(counterpart.phone),locked:false,status,counterpart:{role:counterpart.role,name:counterpart.name,phone:counterpart.phone,maskedPhone:maskPhone(counterpart.phone)}});
}

async function handle(req,res,path){
  const normalized=String(path||'').replace(/^\/+|\/+$/g,'');
  if(normalized==='connected/contact/me'){
    const user=await authenticate(req);await ownContact(req,res,user);return true;
  }
  const match=normalized.match(/^connected\/bookings\/(\d+)\/contact$/);
  if(match){const user=await authenticate(req);await bookingContact(req,res,user,Number(match[1]));return true;}
  return false;
}

module.exports={handle,normalizePhone,CALLABLE_STATES};
