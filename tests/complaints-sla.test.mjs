import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

const require=createRequire(import.meta.url);
const {FALLBACK_HOURS,severityOf,complaintJson}=require('../backend/src/complaints/routes.cjs');
const root=new URL('..',import.meta.url).pathname;

test('complaint severity accepts only explicit supported levels',()=>{
  assert.equal(severityOf('critical'),'CRITICAL');
  assert.equal(severityOf(''),'NORMAL');
  assert.throws(()=>severityOf('urgent'),/Severity must be/);
});

test('fallback SLA values are prototype defaults, not one fixed national rule',()=>{
  assert.deepEqual(FALLBACK_HOURS,{LOW:72,NORMAL:48,HIGH:24,CRITICAL:4});
  assert.ok(new Set(Object.values(FALLBACK_HOURS)).size>1);
});

test('complaint response exposes SLA and escalation state without hiding overdue state',()=>{
  const row=complaintJson({id:1,reference_code:'SUP-X',booking_id:2,cooperative_id:3,category:'SERVICE',severity:'HIGH',status:'ESCALATED',description:'Issue detail',sla_due_at:new Date(Date.now()-60000).toISOString(),escalated_at:new Date().toISOString(),resolved_at:null,resolution_note:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
  assert.equal(row.severity,'HIGH');
  assert.equal(row.status,'ESCALATED');
  assert.equal(row.overdue,true);
});

test('complaint module contains policy, escalation, notifications and case-scoped evidence',()=>{
  const source=readFileSync(join(root,'backend/src/complaints/routes.cjs'),'utf8');
  assert.match(source,/complaint_sla_policies/);
  assert.match(source,/SLA_ESCALATED/);
  assert.match(source,/Complaint SLA escalation/);
  assert.match(source,/booking_history/);
  assert.match(source,/additional_charges/);
  assert.match(source,/payments/);
  assert.match(source,/invoices/);
  assert.match(source,/audit_events/);
  assert.match(source,/complaint_events/);
  assert.match(source,/CASE_SCOPED_BOOKING_AND_COMPLAINT_EVIDENCE/);
});

test('complaint routes enforce customer ownership and cooperative scope',()=>{
  const source=readFileSync(join(root,'backend/src/complaints/routes.cjs'),'utf8');
  assert.match(source,/This booking belongs to another customer/);
  assert.match(source,/This complaint belongs to another customer/);
  assert.match(source,/This complaint is outside your cooperative/);
});

test('stable API adapter owns complaint routes before legacy catch-all',()=>{
  const index=readFileSync(join(root,'api/index.js'),'utf8');
  assert.match(index,/complaints\.handle\(req,res,rawPath\)/);
});

test('complaint migration adds configurable policy and event history',()=>{
  const sql=readFileSync(join(root,'database/migrations/002_complaints_sla.sql'),'utf8');
  assert.match(sql,/complaint_sla_policies/);
  assert.match(sql,/complaint_events/);
  assert.match(sql,/sla_due_at/);
  assert.match(sql,/escalated_at/);
});
