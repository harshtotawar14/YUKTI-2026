'use strict';

const {query,transaction}=require('../../../api/_lib/db.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');
const {transition}=require('../../../api/_lib/policy.cjs');

const DEFAULT_POLICY=Object.freeze({routineExtraLimit:1000,cooperativeChargePercent:0,platformChargePercent:0,source:'PROTOTYPE_ZERO_DEDUCTION_DEFAULT'});

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}
function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function numeric(value,label='number'){const parsed=Number(value);if(!Number.isFinite(parsed))throw httpError(422,`${label} is invalid.`,'INVALID_NUMBER');return parsed;}
function money(value){return Math.round(Number(value)*100)/100;}

async function billingPolicy(client,cooperativeId){
  const row=(await client.query('SELECT * FROM billing_policies WHERE cooperative_id=$1',[cooperativeId])).rows[0];
  if(!row)return {...DEFAULT_POLICY};
  return {routineExtraLimit:Number(row.routine_extra_limit),cooperativeChargePercent:Number(row.cooperative_charge_percent),platformChargePercent:Number(row.platform_charge_percent),source:'COOPERATIVE_CONFIGURED_POLICY'};
}

async function bookingFor(client,id,user,{worker=false,lock=false}={}){
  const row=(await client.query(`SELECT b.*,s.name AS service FROM bookings b JOIN services s ON s.id=b.service_id WHERE b.id=$1${lock?' FOR UPDATE OF b':''}`,[id])).rows[0];
  if(!row)throw httpError(404,'Booking not found.','BOOKING_NOT_FOUND');
  if(worker&&Number(row.assigned_worker_id)!==Number(user.worker_id))throw httpError(403,'This job is not assigned to this worker.','JOB_FORBIDDEN');
  if(!worker&&String(user.role)==='CUSTOMER'&&Number(row.customer_id)!==Number(user.id))throw httpError(403,'This booking belongs to another customer.','BOOKING_FORBIDDEN');
  return row;
}

async function createCharge(req,res,user,bookingId){
  method(req,'POST');allow(user,['WORKER']);const data=body(req),amount=money(numeric(data.amount,'Amount')),workItem=clean(data.workItem,200),reason=clean(data.reason,500);
  if(!workItem||reason.length<4||amount<=0||amount>100000)throw httpError(422,'Work item, reason and a valid positive amount are required.','CHARGE_INPUT');
  const result=await transaction(async client=>{
    const booking=await bookingFor(client,bookingId,user,{worker:true,lock:true});
    if(booking.status!=='IN_PROGRESS')throw httpError(409,'Additional work can be requested only while service is in progress.','CHARGE_STATE');
    const policy=await billingPolicy(client,booking.cooperative_id),requiresAdminReview=amount>policy.routineExtraLimit,status=requiresAdminReview?'ADMIN_REVIEW':'PENDING';
    const charge=(await client.query(`INSERT INTO additional_charges(booking_id,worker_id,work_item,reason,amount,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[bookingId,user.worker_id,workItem,reason,amount,status])).rows[0];
    await client.query(`INSERT INTO audit_events(actor_user_id,booking_id,event_type,details) VALUES($1,$2,'ADDITIONAL_CHARGE_REQUESTED',$3)`,[user.id,bookingId,JSON.stringify({chargeId:Number(charge.id),amount,status,routineExtraLimit:policy.routineExtraLimit,policySource:policy.source})]);
    return {charge,policy,requiresAdminReview};
  });
  return send(res,201,{ok:true,charge:{id:Number(result.charge.id),status:result.charge.status,amount:Number(result.charge.amount),requiresAdminReview:result.requiresAdminReview},policy:{routineExtraLimit:result.policy.routineExtraLimit,source:result.policy.source}});
}

async function listCharges(req,res,user,bookingId){
  method(req,'GET');allow(user,['CUSTOMER']);
  await transaction(async client=>bookingFor(client,bookingId,user));
  const rows=(await query('SELECT * FROM additional_charges WHERE booking_id=$1 ORDER BY created_at DESC',[bookingId])).rows;
  return send(res,200,rows.map(x=>({id:Number(x.id),workItem:x.work_item,reason:x.reason,amount:Number(x.amount),status:x.status,requiresAdminReview:x.status==='ADMIN_REVIEW',adminNote:x.admin_note,createdAt:x.created_at})));
}

async function customerDecision(req,res,user,chargeId){
  method(req,'POST');allow(user,['CUSTOMER']);const decision=clean(body(req).decision,20).toUpperCase();if(!['APPROVE','REJECT'].includes(decision))throw httpError(422,'Decision must be APPROVE or REJECT.','CHARGE_DECISION');
  const status=decision==='APPROVE'?'APPROVED':'REJECTED';
  const result=await query(`UPDATE additional_charges c SET status=$1,decided_by=$2,decided_at=now()
    FROM bookings b WHERE c.id=$3 AND b.id=c.booking_id AND b.customer_id=$2 AND c.status='PENDING' RETURNING c.*`,[status,user.id,chargeId]);
  if(!result.rows[0])throw httpError(409,'Charge is not ready for customer decision, is already decided, or belongs to another customer.','CHARGE_NOT_PENDING');
  await query(`INSERT INTO audit_events(actor_user_id,booking_id,event_type,details) SELECT $1,booking_id,$2,$3 FROM additional_charges WHERE id=$4`,[user.id,`ADDITIONAL_CHARGE_${status}`,JSON.stringify({chargeId,status}),chargeId]);
  return send(res,200,{ok:true,charge:{id:Number(chargeId),status}});
}

async function adminDecision(req,res,user,chargeId){
  method(req,'POST');allow(user,['COOPERATIVE_ADMIN']);const data=body(req),decision=clean(data.decision,20).toUpperCase(),note=clean(data.note,600);
  if(!['APPROVE','REJECT'].includes(decision)||note.length<4)throw httpError(422,'Admin decision and review note are required.','ADMIN_CHARGE_DECISION');
  const next=decision==='APPROVE'?'PENDING':'REJECTED';
  const result=await query(`UPDATE additional_charges c SET status=$1,admin_decided_by=$2,admin_decided_at=now(),admin_note=$3
    FROM bookings b WHERE c.id=$4 AND b.id=c.booking_id AND b.cooperative_id=$5 AND c.status='ADMIN_REVIEW' RETURNING c.*,b.id AS scoped_booking_id`,[next,user.id,note,chargeId,user.cooperative_id]);
  const row=result.rows[0];if(!row)throw httpError(409,'Charge is outside your cooperative, missing, or no longer awaiting admin review.','ADMIN_CHARGE_STATE');
  await query(`INSERT INTO audit_events(actor_user_id,booking_id,event_type,details) VALUES($1,$2,$3,$4)`,[user.id,row.scoped_booking_id,`ADDITIONAL_CHARGE_ADMIN_${decision}`,JSON.stringify({chargeId:Number(chargeId),note,nextCustomerState:next})]);
  return send(res,200,{ok:true,charge:{id:Number(chargeId),status:next,adminDecision:decision,customerApprovalRequired:decision==='APPROVE'}});
}

async function policyRoute(req,res,user){
  allow(user,['COOPERATIVE_ADMIN']);
  if(req.method==='GET'){
    const result=await transaction(async client=>billingPolicy(client,user.cooperative_id));return send(res,200,{ok:true,policy:result,configurable:true});
  }
  method(req,'POST');const data=body(req),routineExtraLimit=money(numeric(data.routineExtraLimit,'Routine extra limit')),coop=numeric(data.cooperativeChargePercent??0,'Cooperative charge percent'),platform=numeric(data.platformChargePercent??0,'Platform charge percent');
  if(routineExtraLimit<0||coop<0||platform<0||coop>100||platform>100||coop+platform>100)throw httpError(422,'Billing policy values are outside allowed ranges.','BILLING_POLICY_INPUT');
  const row=(await query(`INSERT INTO billing_policies(cooperative_id,routine_extra_limit,cooperative_charge_percent,platform_charge_percent,updated_by)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT(cooperative_id) DO UPDATE SET routine_extra_limit=EXCLUDED.routine_extra_limit,cooperative_charge_percent=EXCLUDED.cooperative_charge_percent,platform_charge_percent=EXCLUDED.platform_charge_percent,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *`,[user.cooperative_id,routineExtraLimit,coop,platform,user.id])).rows[0];
  await query(`INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,'BILLING_POLICY_UPDATED',$2)`,[user.id,JSON.stringify({routineExtraLimit,cooperativeChargePercent:coop,platformChargePercent:platform})]);
  return send(res,200,{ok:true,policy:{routineExtraLimit:Number(row.routine_extra_limit),cooperativeChargePercent:Number(row.cooperative_charge_percent),platformChargePercent:Number(row.platform_charge_percent),source:'COOPERATIVE_CONFIGURED_POLICY'}});
}

async function checkoutData(client,booking){
  const approved=Number((await client.query("SELECT coalesce(sum(amount),0) AS amount FROM additional_charges WHERE booking_id=$1 AND status='APPROVED'",[booking.id])).rows[0].amount),base=Number(booking.base_amount),finalAmount=money(base+approved);
  const payment=(await client.query('SELECT * FROM payments WHERE booking_id=$1',[booking.id])).rows[0]||null,invoice=(await client.query('SELECT * FROM invoices WHERE booking_id=$1',[booking.id])).rows[0]||null;
  return {status:booking.status,total:base,approvedAdditional:approved,finalAmount,payment:payment?{id:Number(payment.id),amount:Number(payment.amount),paymentMethod:payment.payment_method,transactionReference:payment.transaction_reference,status:payment.status,sandbox:payment.sandbox,createdAt:payment.created_at}:null,invoice:invoice?{id:Number(invoice.id),invoiceNumber:invoice.invoice_number,amount:Number(invoice.amount),createdAt:invoice.created_at}:null};
}

async function ensureLedger(client,booking,payment,approvedAdditional){
  if(!booking.assigned_worker_id)return null;
  const existing=(await client.query('SELECT * FROM worker_earnings_ledger WHERE booking_id=$1',[booking.id])).rows[0];if(existing)return existing;
  const policy=await billingPolicy(client,booking.cooperative_id),grossService=Number(booking.base_amount),grossTotal=money(grossService+approvedAdditional),cooperativeCharge=money(grossTotal*policy.cooperativeChargePercent/100),platformCharge=money(grossTotal*policy.platformChargePercent/100),net=money(Math.max(0,grossTotal-cooperativeCharge-platformCharge));
  return (await client.query(`INSERT INTO worker_earnings_ledger(booking_id,worker_id,payment_id,gross_service_amount,approved_additions,cooperative_charge,platform_charge,net_earnings,policy_snapshot)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(booking_id) DO UPDATE SET payment_id=EXCLUDED.payment_id RETURNING *`,[booking.id,booking.assigned_worker_id,payment.id,grossService,approvedAdditional,cooperativeCharge,platformCharge,net,JSON.stringify(policy)])).rows[0];
}

async function checkout(req,res,user,bookingId){
  method(req,'GET');allow(user,['CUSTOMER']);const data=await transaction(async client=>{const booking=await bookingFor(client,bookingId,user);return checkoutData(client,booking);});return send(res,200,data);
}

async function pay(req,res,user,bookingId){
  method(req,'POST');allow(user,['CUSTOMER']);const data=body(req);
  const result=await transaction(async client=>{
    const booking=await bookingFor(client,bookingId,user,{lock:true});const approved=Number((await client.query("SELECT coalesce(sum(amount),0) AS amount FROM additional_charges WHERE booking_id=$1 AND status='APPROVED'",[bookingId])).rows[0].amount);
    let payment=(await client.query('SELECT * FROM payments WHERE booking_id=$1',[bookingId])).rows[0],invoice;
    if(payment){invoice=(await client.query('SELECT * FROM invoices WHERE booking_id=$1',[bookingId])).rows[0];const ledger=await ensureLedger(client,booking,payment,approved);return {payment,invoice,ledger,idempotent:true};}
    const next=transition('pay',booking.status),amount=money(Number(booking.base_amount)+approved),tx=`SBX-${Date.now()}-${bookingId}`,invoiceNumber=`INV-${new Date().getUTCFullYear()}-${String(bookingId).padStart(6,'0')}`;
    payment=(await client.query(`INSERT INTO payments(booking_id,customer_id,amount,payment_method,transaction_reference) VALUES($1,$2,$3,$4,$5) RETURNING *`,[bookingId,user.id,amount,clean(data.method,30)||'SANDBOX',tx])).rows[0];
    invoice=(await client.query('INSERT INTO invoices(booking_id,payment_id,invoice_number,amount) VALUES($1,$2,$3,$4) RETURNING *',[bookingId,payment.id,invoiceNumber,amount])).rows[0];
    await client.query('UPDATE bookings SET status=$2,updated_at=now() WHERE id=$1',[bookingId,next]);
    await client.query('INSERT INTO booking_history(booking_id,status,note,actor_user_id) VALUES($1,$2,$3,$4)',[bookingId,next,'Sandbox payment and invoice recorded.',user.id]);
    const ledger=await ensureLedger(client,booking,payment,approved);
    await client.query(`INSERT INTO audit_events(actor_user_id,booking_id,event_type,details) VALUES($1,$2,'SANDBOX_PAYMENT_RECORDED',$3)`,[user.id,bookingId,JSON.stringify({amount,transactionReference:tx,ledgerId:ledger?Number(ledger.id):null})]);
    return {payment,invoice,ledger,idempotent:false};
  });
  return send(res,200,{ok:true,idempotentReplay:result.idempotent,payment:{amount:Number(result.payment.amount),paymentMethod:result.payment.payment_method,transactionReference:result.payment.transaction_reference,status:result.payment.status,sandbox:true},invoice:{invoiceNumber:result.invoice.invoice_number,amount:Number(result.invoice.amount)},workerLedger:result.ledger?{grossServiceAmount:Number(result.ledger.gross_service_amount),approvedAdditions:Number(result.ledger.approved_additions),cooperativeCharge:Number(result.ledger.cooperative_charge),platformCharge:Number(result.ledger.platform_charge),netEarnings:Number(result.ledger.net_earnings)}:null});
}

async function workerLedger(req,res,user){
  method(req,'GET');allow(user,['WORKER']);const rows=(await query(`SELECT l.*,b.booking_code,s.name AS service FROM worker_earnings_ledger l JOIN bookings b ON b.id=l.booking_id JOIN services s ON s.id=b.service_id WHERE l.worker_id=$1 ORDER BY l.created_at DESC LIMIT 100`,[user.worker_id])).rows;
  return send(res,200,{ok:true,scope:'SANPAID_RECORDED_SANDBOX_EARNINGS',entries:rows.map(x=>({id:Number(x.id),bookingId:Number(x.booking_id),bookingCode:x.booking_code,service:x.service,grossServiceAmount:Number(x.gross_service_amount),approvedAdditions:Number(x.approved_additions),cooperativeCharge:Number(x.cooperative_charge),platformCharge:Number(x.platform_charge),netEarnings:Number(x.net_earnings),policySnapshot:x.policy_snapshot,createdAt:x.created_at}))});
}

async function handle(req,res,path){
  const workerCharge=path.match(/^connected\/worker\/jobs\/(\d+)\/extra-charge$/),customerCharges=path.match(/^connected\/customer\/bookings\/(\d+)\/charges$/),customerDecisionMatch=path.match(/^connected\/customer\/charges\/(\d+)\/decision$/),adminDecisionMatch=path.match(/^cooperative-admin\/charges\/(\d+)\/decision$/),checkoutMatch=path.match(/^connected\/customer\/bookings\/(\d+)\/checkout$/),payMatch=path.match(/^connected\/customer\/bookings\/(\d+)\/pay$/);
  const policy=path==='cooperative-admin/billing-policy',ledger=path==='connected/worker/earnings-ledger';
  if(!workerCharge&&!customerCharges&&!customerDecisionMatch&&!adminDecisionMatch&&!checkoutMatch&&!payMatch&&!policy&&!ledger)return false;
  const user=await authenticate(req);
  if(workerCharge){await createCharge(req,res,user,Number(workerCharge[1]));return true;}
  if(customerCharges){await listCharges(req,res,user,Number(customerCharges[1]));return true;}
  if(customerDecisionMatch){await customerDecision(req,res,user,Number(customerDecisionMatch[1]));return true;}
  if(adminDecisionMatch){await adminDecision(req,res,user,Number(adminDecisionMatch[1]));return true;}
  if(policy){await policyRoute(req,res,user);return true;}
  if(checkoutMatch){await checkout(req,res,user,Number(checkoutMatch[1]));return true;}
  if(payMatch){await pay(req,res,user,Number(payMatch[1]));return true;}
  if(ledger){await workerLedger(req,res,user);return true;}
  return false;
}

module.exports={handle,DEFAULT_POLICY,money};
