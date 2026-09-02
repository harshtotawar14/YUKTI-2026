'use strict';

const {query,transaction}=require('../../../api/_lib/db.cjs');
const {authenticate,allow,send,httpError}=require('../shared/auth-context.cjs');
const {normalizeRole}=require('../../../api/_lib/policy.cjs');

const SEVERITIES=new Set(['LOW','NORMAL','HIGH','CRITICAL']);
const OPEN_STATES=['OPEN','IN_REVIEW','ESCALATED'];
const FALLBACK_HOURS=Object.freeze({LOW:72,NORMAL:48,HIGH:24,CRITICAL:4});

function method(req,expected){if(req.method!==expected)throw httpError(405,`Use ${expected} for this endpoint.`,'METHOD_NOT_ALLOWED');}
function body(req){if(req.body&&typeof req.body==='object')return req.body;if(!req.body)return{};try{return JSON.parse(req.body);}catch{throw httpError(400,'Request body must be valid JSON.','INVALID_JSON');}}
function clean(value,max=500){return String(value??'').trim().slice(0,max);}
function severityOf(value){const severity=clean(value||'NORMAL',20).toUpperCase();if(!SEVERITIES.has(severity))throw httpError(422,'Severity must be LOW, NORMAL, HIGH or CRITICAL.','COMPLAINT_SEVERITY');return severity;}

async function resolvePolicy(client,cooperativeId,category,severity){
  const row=(await client.query(`SELECT response_hours,category,severity,cooperative_id
    FROM complaint_sla_policies
    WHERE active=true AND severity=$2 AND (cooperative_id=$1 OR cooperative_id IS NULL) AND (lower(category)=lower($3) OR category='*')
    ORDER BY (cooperative_id=$1) DESC,(lower(category)=lower($3)) DESC,updated_at DESC LIMIT 1`,[cooperativeId,severity,category])).rows[0];
  if(row)return {hours:Number(row.response_hours),source:'CONFIGURED_POLICY',category:row.category,severity:row.severity};
  return {hours:FALLBACK_HOURS[severity],source:'PROTOTYPE_FALLBACK_POLICY',category:'*',severity};
}

async function refreshOverdue(cooperativeId=null){
  return transaction(async client=>{
    const params=[];let scope='';
    if(cooperativeId){params.push(cooperativeId);scope=` AND cooperative_id=$${params.length}`;}
    const overdue=(await client.query(`UPDATE support_requests SET status='ESCALATED',escalated_at=coalesce(escalated_at,now()),updated_at=now()
      WHERE status=ANY($${params.length+1}) AND sla_due_at IS NOT NULL AND sla_due_at<now() AND escalated_at IS NULL${scope}
      RETURNING id,reference_code,cooperative_id`,[...params,['OPEN','IN_REVIEW']])).rows;
    for(const row of overdue){
      await client.query(`INSERT INTO complaint_events(complaint_id,event_type,note,details)
        VALUES($1,'SLA_ESCALATED','SLA threshold crossed; case escalated for cooperative review.',$2)`,[row.id,JSON.stringify({policyDriven:true})]);
      const admins=(await client.query("SELECT id FROM users WHERE cooperative_id=$1 AND role='COOPERATIVE_ADMIN' AND active=true",[row.cooperative_id])).rows;
      for(const admin of admins)await client.query(`INSERT INTO notifications(user_id,title,message,priority) VALUES($1,'Complaint SLA escalation',$2,'HIGH')`,[admin.id,`Case ${row.reference_code} crossed its configured SLA threshold.`]);
    }
    return overdue.length;
  });
}

async function customerBookingScope(client,user,bookingId){
  if(!bookingId){
    if(user.cooperative_id)return {bookingId:null,cooperativeId:Number(user.cooperative_id)};
    const coop=(await client.query('SELECT id FROM cooperatives ORDER BY id LIMIT 1')).rows[0];
    if(!coop)throw httpError(503,'No cooperative is configured.','COOPERATIVE_NOT_CONFIGURED');
    return {bookingId:null,cooperativeId:Number(coop.id)};
  }
  const booking=(await client.query('SELECT id,customer_id,cooperative_id FROM bookings WHERE id=$1',[bookingId])).rows[0];
  if(!booking)throw httpError(404,'Booking not found.','BOOKING_NOT_FOUND');
  if(Number(booking.customer_id)!==Number(user.id))throw httpError(403,'This booking belongs to another customer.','BOOKING_FORBIDDEN');
  return {bookingId:Number(booking.id),cooperativeId:Number(booking.cooperative_id)};
}

function complaintJson(row){
  const due=row.sla_due_at?new Date(row.sla_due_at):null;
  return {id:Number(row.id),referenceCode:row.reference_code,bookingId:row.booking_id?Number(row.booking_id):null,cooperativeId:Number(row.cooperative_id),category:row.category,severity:row.severity,status:row.status,description:row.description,slaDueAt:row.sla_due_at,overdue:Boolean(due&&due.getTime()<Date.now()&&OPEN_STATES.includes(row.status)),escalatedAt:row.escalated_at,resolvedAt:row.resolved_at,resolutionNote:row.resolution_note,createdAt:row.created_at,updatedAt:row.updated_at};
}

async function customerSupport(req,res,user){
  allow(user,['CUSTOMER']);
  if(req.method==='GET'){
    await refreshOverdue();
    const rows=(await query('SELECT * FROM support_requests WHERE customer_id=$1 ORDER BY created_at DESC',[user.id])).rows;
    return send(res,200,{ok:true,requests:rows.map(complaintJson)});
  }
  method(req,'POST');const data=body(req),category=clean(data.category,100),description=clean(data.description,1200),severity=severityOf(data.severity);
  if(!category||description.length<8)throw httpError(422,'Category and at least 8 characters of detail are required.','SUPPORT_INPUT');
  const created=await transaction(async client=>{
    const scope=await customerBookingScope(client,user,data.bookingId?Number(data.bookingId):null);
    const policy=await resolvePolicy(client,scope.cooperativeId,category,severity);
    const reference=`SUP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const inserted=(await client.query(`INSERT INTO support_requests(reference_code,customer_id,booking_id,cooperative_id,category,severity,description,status,sla_due_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,'OPEN',now()+($8||' hours')::interval) RETURNING *`,[reference,user.id,scope.bookingId,scope.cooperativeId,category,severity,description,String(policy.hours)])).rows[0];
    await client.query(`INSERT INTO complaint_events(complaint_id,actor_user_id,event_type,note,details)
      VALUES($1,$2,'COMPLAINT_CREATED',$3,$4)`,[inserted.id,user.id,description,JSON.stringify({category,severity,slaHours:policy.hours,policySource:policy.source})]);
    await client.query(`INSERT INTO audit_events(actor_user_id,booking_id,event_type,details) VALUES($1,$2,'COMPLAINT_CREATED',$3)`,[user.id,scope.bookingId,JSON.stringify({complaintId:Number(inserted.id),referenceCode:reference,severity,slaHours:policy.hours})]);
    return {row:inserted,policy};
  });
  return send(res,201,{ok:true,request:complaintJson(created.row),sla:{hours:created.policy.hours,policySource:created.policy.source,configurable:true}});
}

async function listAdminComplaints(req,res,user){
  method(req,'GET');allow(user,['COOPERATIVE_ADMIN']);await refreshOverdue(user.cooperative_id);
  const rows=(await query('SELECT * FROM support_requests WHERE cooperative_id=$1 ORDER BY CASE status WHEN \'ESCALATED\' THEN 0 WHEN \'OPEN\' THEN 1 ELSE 2 END,created_at DESC',[user.cooperative_id])).rows;
  return send(res,200,{ok:true,complaints:rows.map(complaintJson)});
}

async function scopedComplaint(id,user){
  const row=(await query('SELECT * FROM support_requests WHERE id=$1',[id])).rows[0];
  if(!row)throw httpError(404,'Complaint not found.','COMPLAINT_NOT_FOUND');
  const role=normalizeRole(user.role);
  if(role==='CUSTOMER'&&Number(row.customer_id)!==Number(user.id))throw httpError(403,'This complaint belongs to another customer.','COMPLAINT_FORBIDDEN');
  if(role==='COOPERATIVE_ADMIN'&&Number(row.cooperative_id)!==Number(user.cooperative_id))throw httpError(403,'This complaint is outside your cooperative.','COOPERATIVE_SCOPE');
  return row;
}

async function evidence(req,res,user,id){
  method(req,'GET');allow(user,['CUSTOMER','COOPERATIVE_ADMIN','FEDERATION_ADMIN']);const complaint=await scopedComplaint(id,user);
  const bookingId=complaint.booking_id?Number(complaint.booking_id):null;
  const [caseEvents,history,charges,payment,audits]=await Promise.all([
    query(`SELECT ce.event_type,ce.note,ce.details,ce.created_at,u.name AS actor FROM complaint_events ce LEFT JOIN users u ON u.id=ce.actor_user_id WHERE ce.complaint_id=$1 ORDER BY ce.created_at`,[id]),
    bookingId?query('SELECT status,note,created_at FROM booking_history WHERE booking_id=$1 ORDER BY created_at',[bookingId]):Promise.resolve({rows:[]}),
    bookingId?query('SELECT work_item,reason,amount,status,created_at,decided_at FROM additional_charges WHERE booking_id=$1 ORDER BY created_at',[bookingId]):Promise.resolve({rows:[]}),
    bookingId?query(`SELECT p.amount,p.payment_method,p.transaction_reference,p.status,p.sandbox,p.created_at,i.invoice_number,i.amount AS invoice_amount,i.created_at AS invoice_created_at FROM payments p LEFT JOIN invoices i ON i.payment_id=p.id WHERE p.booking_id=$1`,[bookingId]):Promise.resolve({rows:[]}),
    bookingId?query(`SELECT a.event_type,a.details,a.created_at,u.name AS actor FROM audit_events a LEFT JOIN users u ON u.id=a.actor_user_id WHERE a.booking_id=$1 ORDER BY a.created_at`,[bookingId]):Promise.resolve({rows:[]})
  ]);
  const timeline=[
    ...caseEvents.rows.map(x=>({type:'CASE_EVENT',event:x.event_type,note:x.note,details:x.details,actor:x.actor||'System',at:x.created_at})),
    ...history.rows.map(x=>({type:'BOOKING_STATE',event:x.status,note:x.note,at:x.created_at})),
    ...charges.rows.flatMap(x=>[{type:'PRICE_CHANGE',event:'ADDITIONAL_WORK_REQUESTED',note:x.reason,details:{workItem:x.work_item,amount:Number(x.amount),status:x.status},at:x.created_at},...(x.decided_at?[{type:'PRICE_CHANGE',event:`ADDITIONAL_WORK_${x.status}`,details:{amount:Number(x.amount)},at:x.decided_at}]:[])]),
    ...payment.rows.flatMap(x=>[{type:'PAYMENT',event:x.status,note:x.sandbox?'Sandbox payment':'Payment',details:{amount:Number(x.amount),method:x.payment_method,transactionReference:x.transaction_reference},at:x.created_at},...(x.invoice_number?[{type:'INVOICE',event:'INVOICE_GENERATED',details:{invoiceNumber:x.invoice_number,amount:Number(x.invoice_amount)},at:x.invoice_created_at}]:[])]),
    ...audits.rows.map(x=>({type:'AUDIT',event:x.event_type,details:x.details,actor:x.actor||'System',at:x.created_at}))
  ].sort((a,b)=>new Date(a.at)-new Date(b.at));
  return send(res,200,{ok:true,complaint:complaintJson(complaint),evidenceScope:'CASE_SCOPED_BOOKING_AND_COMPLAINT_EVIDENCE',timeline});
}

async function updateStatus(req,res,user,id){
  method(req,'POST');allow(user,['COOPERATIVE_ADMIN']);const data=body(req),action=clean(data.action,30).toUpperCase(),note=clean(data.note,800);
  if(!['START_REVIEW','RESOLVE','REOPEN'].includes(action))throw httpError(422,'Action must be START_REVIEW, RESOLVE or REOPEN.','COMPLAINT_ACTION');
  if(note.length<4)throw httpError(422,'A review/resolution note is required.','COMPLAINT_NOTE');
  const result=await transaction(async client=>{
    const row=(await client.query('SELECT * FROM support_requests WHERE id=$1 AND cooperative_id=$2 FOR UPDATE',[id,user.cooperative_id])).rows[0];
    if(!row)throw httpError(404,'Complaint not found in this cooperative.','COMPLAINT_NOT_FOUND');
    const next=action==='START_REVIEW'?'IN_REVIEW':action==='RESOLVE'?'RESOLVED':'OPEN';
    const updated=(await client.query(`UPDATE support_requests SET status=$2,resolution_note=CASE WHEN $2='RESOLVED' THEN $3 ELSE resolution_note END,resolved_at=CASE WHEN $2='RESOLVED' THEN now() ELSE NULL END,escalated_at=CASE WHEN $2='OPEN' THEN NULL ELSE escalated_at END,updated_at=now() WHERE id=$1 RETURNING *`,[id,next,note])).rows[0];
    await client.query(`INSERT INTO complaint_events(complaint_id,actor_user_id,event_type,note,details) VALUES($1,$2,$3,$4,$5)`,[id,user.id,`COMPLAINT_${next}`,note,JSON.stringify({action})]);
    await client.query(`INSERT INTO audit_events(actor_user_id,booking_id,event_type,details) VALUES($1,$2,$3,$4)`,[user.id,row.booking_id,`COMPLAINT_${next}`,JSON.stringify({complaintId:Number(id),note})]);
    return updated;
  });
  return send(res,200,{ok:true,complaint:complaintJson(result)});
}

async function policies(req,res,user){
  allow(user,['COOPERATIVE_ADMIN']);
  if(req.method==='GET'){
    const rows=(await query('SELECT * FROM complaint_sla_policies WHERE cooperative_id=$1 AND active=true ORDER BY severity,category',[user.cooperative_id])).rows;
    return send(res,200,{ok:true,policies:rows.map(x=>({id:Number(x.id),category:x.category,severity:x.severity,responseHours:Number(x.response_hours),updatedAt:x.updated_at})) ,fallbackPrototypeHours:FALLBACK_HOURS});
  }
  method(req,'POST');const data=body(req),category=clean(data.category||'*',100),severity=severityOf(data.severity),hours=Number(data.responseHours);
  if(!Number.isInteger(hours)||hours<1||hours>720)throw httpError(422,'responseHours must be an integer from 1 to 720.','SLA_HOURS');
  const row=(await query(`INSERT INTO complaint_sla_policies(cooperative_id,category,severity,response_hours,updated_by)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT(cooperative_id,category,severity) DO UPDATE SET response_hours=EXCLUDED.response_hours,active=true,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *`,[user.cooperative_id,category,severity,hours,user.id])).rows[0];
  await query(`INSERT INTO audit_events(actor_user_id,event_type,details) VALUES($1,'COMPLAINT_SLA_POLICY_UPDATED',$2)`,[user.id,JSON.stringify({category,severity,responseHours:hours,cooperativeId:Number(user.cooperative_id)})]);
  return send(res,200,{ok:true,policy:{id:Number(row.id),category:row.category,severity:row.severity,responseHours:Number(row.response_hours),configurable:true}});
}

async function handle(req,res,path){
  const isCustomerSupport=path==='connected/customer/support';
  const adminList=path==='cooperative-admin/complaints';
  const policy=path==='cooperative-admin/complaint-sla-policies';
  const evidenceMatch=path.match(/^cooperative-admin\/complaints\/(\d+)\/evidence$/)||path.match(/^connected\/customer\/complaints\/(\d+)\/evidence$/);
  const statusMatch=path.match(/^cooperative-admin\/complaints\/(\d+)\/status$/);
  if(!isCustomerSupport&&!adminList&&!policy&&!evidenceMatch&&!statusMatch)return false;
  const user=await authenticate(req);
  if(isCustomerSupport){await customerSupport(req,res,user);return true;}
  if(adminList){await listAdminComplaints(req,res,user);return true;}
  if(policy){await policies(req,res,user);return true;}
  if(evidenceMatch){await evidence(req,res,user,Number(evidenceMatch[1]));return true;}
  if(statusMatch){await updateStatus(req,res,user,Number(statusMatch[1]));return true;}
  return false;
}

module.exports={handle,FALLBACK_HOURS,severityOf,complaintJson};
