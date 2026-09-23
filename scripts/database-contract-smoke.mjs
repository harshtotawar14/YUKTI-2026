import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {ensureDatabase,query}=require('../api/_lib/db.cjs');
const {sha256}=require('../api/_lib/security.cjs');
const cooperativeWorkspace=require('../backend/src/cooperative/workspace-routes.cjs');

await ensureDatabase();

const services=await query("SELECT count(*)::int AS count FROM services WHERE active=true");
assert.ok(Number(services.rows[0]?.count)>=12,'Expected seeded active service catalog.');

const cooperatives=await query("SELECT code,name,region FROM cooperatives WHERE code=ANY($1::text[]) ORDER BY code",[['YUKTI-01','NARMADA-02']]);
assert.equal(cooperatives.rows.length,2,'Expected both seeded cooperative records.');
assert.ok(cooperatives.rows.some(row=>row.code==='YUKTI-01'&&/Kolhapur/i.test(row.region)&&/YUKTI Kolhapur/i.test(row.name)),'Primary cooperative is not aligned with Kolhapur.');
assert.ok(cooperatives.rows.some(row=>row.code==='NARMADA-02'&&/Panhala/i.test(row.region)&&/YUKTI Panhala/i.test(row.name)),'Secondary cooperative is not aligned with Panhala.');

const admin=(await query("SELECT id FROM users WHERE role='COOPERATIVE_ADMIN' ORDER BY id LIMIT 1")).rows[0];
assert.ok(admin?.id,'Seeded Cooperative Admin account is missing.');
const token='sanpaid-ci-cooperative-workspace-token';
await query("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '30 minutes')",[admin.id,sha256(token)]);

let responseBody='';
const responseHeaders=new Map();
const req={method:'GET',headers:{authorization:`Bearer ${token}`},url:'/api/cooperative-admin/workspace'};
const res={
  statusCode:200,
  setHeader(name,value){responseHeaders.set(String(name).toLowerCase(),String(value));},
  end(value=''){responseBody+=String(value);}
};
const handled=await cooperativeWorkspace.handle(req,res,'cooperative-admin/workspace');
assert.equal(handled,true,'Cooperative workspace route did not claim its path.');
assert.equal(res.statusCode,200,'Cooperative workspace route did not return HTTP 200.');
assert.match(responseHeaders.get('content-type')||'',/application\/json/i,'Workspace response is not JSON.');
const payload=JSON.parse(responseBody);
assert.equal(payload.ok,true,'Cooperative workspace response is not ok.');
assert.equal(payload.source,'DATABASE_AGGREGATION','Workspace must identify database-backed aggregation.');
assert.match(payload.cooperative?.region||'',/Kolhapur/i,'Workspace cooperative scope is not Kolhapur-aligned.');
for(const field of ['metrics','workers','skills','services','complaints','capacityRequests','payments','trainingRecommendations']){
  assert.ok(Object.hasOwn(payload,field),`Workspace payload is missing ${field}.`);
}
for(const metric of ['totalWorkers','verifiedWorkers','availableWorkers','activeBookings','openComplaints','recordedPayments','pendingVerification','slaBreaches','capacityRequests','completedServices','averageRating']){
  assert.ok(Object.hasOwn(payload.metrics||{},metric),`Workspace metrics are missing ${metric}.`);
}
assert.ok(Array.isArray(payload.workers)&&payload.workers.length>=2,'Expected seeded workers in Cooperative Admin workspace.');
assert.ok(payload.workers.every(worker=>Array.isArray(worker.skills)),'Worker skill arrays are missing from workspace contract.');
assert.equal(payload.documentEvidence?.source,'NO_DOCUMENT_REGISTRY_CONNECTED','Workspace must not fabricate document-registry evidence.');

console.log(`SanPaid PostgreSQL contract smoke passed: ${payload.workers.length} workers, ${payload.skills.length} skills, ${services.rows[0].count} services.`);
