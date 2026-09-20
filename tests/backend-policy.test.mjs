import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';

const require=createRequire(import.meta.url);
const {transition,normalizeRole,publicUser}=require('../api/_lib/policy.cjs');
const {hashPassword,verifyPassword,sha256}=require('../api/_lib/security.cjs');

test('canonical booking lifecycle accepts only valid transitions',()=>{
  assert.equal(transition('travel','ACCEPTED'),'ON_THE_WAY');
  assert.equal(transition('arrive','ON_THE_WAY'),'ARRIVED');
  assert.equal(transition('identity','ARRIVED'),'IDENTITY_VERIFIED');
  assert.equal(transition('confirmWorker','IDENTITY_VERIFIED'),'CUSTOMER_CONFIRMED');
  assert.equal(transition('start','CUSTOMER_CONFIRMED'),'IN_PROGRESS');
  assert.equal(transition('completionRequest','IN_PROGRESS'),'AWAITING_CUSTOMER_CONFIRMATION');
  assert.equal(transition('complete','AWAITING_CUSTOMER_CONFIRMATION'),'COMPLETED');
  assert.equal(transition('pay','COMPLETED'),'PAID');
  assert.throws(()=>transition('start','ARRIVED'),error=>error.status===409);
});

test('roles and public session user are normalized',()=>{
  assert.equal(normalizeRole('admin'),'COOPERATIVE_ADMIN');
  assert.deepEqual(publicUser({id:'7',email:'a@example.com',name:'A',role:'WORKER',cooperative_id:'2'}),{id:7,email:'a@example.com',name:'A',role:'WORKER',cooperativeId:2});
});

test('demo passwords use salted scrypt and tokens are hashed',async()=>{
  const first=await hashPassword('correct horse battery staple');
  const second=await hashPassword('correct horse battery staple');
  assert.notEqual(first,second);
  assert.equal(await verifyPassword('correct horse battery staple',first),true);
  assert.equal(await verifyPassword('wrong',first),false);
  assert.equal(sha256('token').length,64);
});

test('booking voice messages are bounded, persisted, and worker-offer scoped',()=>{
  const routes=readFileSync(new URL('../backend/src/matching/connected-routes.cjs',import.meta.url),'utf8');
  const migration=readFileSync(new URL('../database/migrations/006_booking_voice_messages.sql',import.meta.url),'utf8');
  assert.match(routes,/MAX_VOICE_BYTES=1572864/,'Voice messages need a strict payload limit.');
  assert.match(routes,/MAX_VOICE_DURATION_MS=60000/,'Voice messages need a strict recording-duration limit.');
  assert.match(routes,/VOICE_MIME_TYPES/,'Voice message MIME types must be allowlisted.');
  assert.match(routes,/o\.worker_id=\$2 AND o\.status IN \('PENDING','ACCEPTED'\)/,'Only the worker holding the offer may fetch its audio.');
  assert.match(routes,/Cache-Control/,'Voice audio responses must define private caching behavior.');
  for(const column of ['voice_audio BYTEA','voice_audio_mime TEXT','voice_audio_duration_ms INTEGER','voice_audio_size INTEGER'])assert.ok(migration.includes(column),`Voice migration missing ${column}`);
});
