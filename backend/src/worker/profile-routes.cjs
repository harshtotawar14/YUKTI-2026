'use strict';

const {query}=require('../../../api/_lib/db.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');

const ACTIVE_STATES=['OFFERING','FINDING_REPLACEMENT','ACCEPTED','ON_THE_WAY','ARRIVED','IDENTITY_VERIFIED','CUSTOMER_CONFIRMED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION','COMPLETED','PAYMENT_PENDING'];
const DEFAULT_SLOT_GUIDANCE=[['09:00','12:00'],['12:00','15:00'],['15:00','18:00'],['18:00','21:00']].map(([startTime,endTime],index)=>({id:`suggested-${index+1}`,startTime,endTime,status:'SUGGESTED',persisted:false}));

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}
function clean(value,max=500){return String(value??'').trim().slice(0,max);}

async function dashboard(req,res,user){
  method(req,'GET');
  const [jobs,earnings,ledger,coop]=await Promise.all([
    query(`SELECT count(*) FILTER(WHERE status=ANY($2))::int AS active FROM bookings WHERE assigned_worker_id=$1`,[user.worker_id,ACTIVE_STATES]),
    query(`SELECT coalesce(sum(net_earnings),0) AS total,coalesce(sum(net_earnings) FILTER(WHERE created_at::date=current_date),0) AS today,coalesce(sum(net_earnings) FILTER(WHERE created_at>=now()-interval '7 days'),0) AS week FROM worker_earnings_ledger WHERE worker_id=$1`,[user.worker_id]),
    query(`SELECT l.*,s.name AS service,b.booking_code FROM worker_earnings_ledger l JOIN bookings b ON b.id=l.booking_id JOIN services s ON s.id=b.service_id WHERE l.worker_id=$1 ORDER BY l.created_at DESC LIMIT 20`,[user.worker_id]),
    query(`SELECT c.id,c.name,c.region FROM workers w JOIN cooperatives c ON c.id=w.cooperative_id WHERE w.id=$1`,[user.worker_id])
  ]);
  const earning=earnings.rows[0],cooperative=coop.rows[0]||null;
  return send(res,200,{ok:true,profile:{id:Number(user.worker_id),name:user.name,available:user.availability_status==='AVAILABLE',availabilityStatus:user.availability_status,rating:Number(user.rating),identityStatus:user.identity_status,cooperative:cooperative?{id:Number(cooperative.id),name:cooperative.name,region:cooperative.region}:null},jobs:{active:jobs.rows[0].active},earnings:{source:'WORKER_EARNINGS_LEDGER',today:Number(earning.today),week:Number(earning.week),total:Number(earning.total),entries:ledger.rows.map(x=>({id:Number(x.id),bookingCode:x.booking_code,service:x.service,grossServiceAmount:Number(x.gross_service_amount),approvedAdditions:Number(x.approved_additions),cooperativeCharge:Number(x.cooperative_charge),platformCharge:Number(x.platform_charge),netEarnings:Number(x.net_earnings),createdAt:x.created_at}))}});
}

async function availability(req,res,user){
  method(req,'POST');const available=Boolean(body(req).available);
  await query('UPDATE workers SET availability_status=$2,updated_at=now() WHERE id=$1',[user.worker_id,available?'AVAILABLE':'OFF_DUTY']);
  return send(res,200,{ok:true,available});
}

async function schedule(req,res,user){
  if(req.method==='GET'){
    const date=clean(new URL(req.url,'https://sanpaid.local').searchParams.get('date'),10)||new Date().toISOString().slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw httpError(422,'Date must be YYYY-MM-DD.','SCHEDULE_DATE');
    const rows=(await query('SELECT * FROM worker_schedule WHERE worker_id=$1 AND work_date=$2 ORDER BY start_time',[user.worker_id,date])).rows;
    return send(res,200,{ok:true,date,slots:rows.map(x=>({id:Number(x.id),startTime:String(x.start_time).slice(0,5),endTime:String(x.end_time).slice(0,5),status:x.status,note:x.note,persisted:true})),suggestedSlots:rows.length?[]:DEFAULT_SLOT_GUIDANCE,empty:rows.length===0});
  }
  method(req,'POST');const data=body(req),date=clean(data.date,10),start=clean(data.startTime,8),end=clean(data.endTime,8),status=clean(data.status,20).toUpperCase();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}/.test(start)||!/^\d{2}:\d{2}/.test(end)||!['AVAILABLE','UNAVAILABLE'].includes(status))throw httpError(422,'Date, times and schedule status are invalid.','SCHEDULE_INPUT');
  await query(`INSERT INTO worker_schedule(worker_id,work_date,start_time,end_time,status,note) VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(worker_id,work_date,start_time,end_time) DO UPDATE SET status=EXCLUDED.status,note=EXCLUDED.note,updated_at=now()`,[user.worker_id,date,start,end,status,clean(data.note,300)||null]);
  return send(res,200,{ok:true,date,startTime:start,endTime:end,status});
}

async function passport(req,res,user){
  method(req,'GET');
  const [skills,completed,coop]=await Promise.all([
    query(`SELECT s.name,ws.status FROM worker_skills ws JOIN services s ON s.id=ws.service_id WHERE ws.worker_id=$1 ORDER BY s.name`,[user.worker_id]),
    query("SELECT count(*)::int AS count FROM bookings WHERE assigned_worker_id=$1 AND status='PAID'",[user.worker_id]),
    query(`SELECT c.id,c.name,c.region FROM workers w JOIN cooperatives c ON c.id=w.cooperative_id WHERE w.id=$1`,[user.worker_id])
  ]);
  const cooperative=coop.rows[0]||null,eligible=user.identity_status==='VERIFIED'&&user.availability_status==='AVAILABLE';
  return send(res,200,{ok:true,passport:{workerId:Number(user.worker_id),name:user.name,cooperative:cooperative?{id:Number(cooperative.id),name:cooperative.name,region:cooperative.region}:null,identityVerified:user.identity_status==='VERIFIED',identityStatus:user.identity_status,availabilityStatus:user.availability_status,rating:Number(user.rating),completedJobs:Number(completed.rows[0].count),currentEligibility:eligible?'ELIGIBLE':'REVIEW REQUIRED',skills:skills.rows.map(x=>({name:x.name,status:x.status,verified:x.status==='VERIFIED'})),credentials:[{id:`identity-${user.worker_id}`,name:'SanPaid Event Identity Check',status:user.identity_status,daysUntilExpiry:null,sandbox:true}],credentialScope:'SANPAID_SERVICE_HISTORY_NOT_GOVERNMENT_CERTIFICATE'}});
}

async function handle(req,res,path){
  const supported=['connected/worker/dashboard','connected/worker/availability','connected/worker/schedule','connected/workforce/passport'].includes(path);
  if(!supported)return false;
  const user=await authenticate(req);allow(user,['WORKER']);
  if(path==='connected/worker/dashboard')return dashboard(req,res,user),true;
  if(path==='connected/worker/availability')return availability(req,res,user),true;
  if(path==='connected/worker/schedule')return schedule(req,res,user),true;
  if(path==='connected/workforce/passport')return passport(req,res,user),true;
  return false;
}

module.exports={handle,DEFAULT_SLOT_GUIDANCE};
