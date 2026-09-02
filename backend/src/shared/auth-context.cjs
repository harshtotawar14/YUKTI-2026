'use strict';

const {query}=require('../../../api/_lib/db.cjs');
const {sha256,bearerToken}=require('../../../api/_lib/security.cjs');
const {normalizeRole}=require('../../../api/_lib/policy.cjs');

function httpError(status,message,code){return Object.assign(new Error(message),{status,code});}
function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(payload));
}

async function authenticate(req){
  const token=bearerToken(req);
  if(!token)throw httpError(401,'Please log in to continue.','AUTH_REQUIRED');
  const result=await query(`SELECT u.*,w.id AS worker_id,w.identity_status,w.availability_status,w.rating,w.demo_distance_km
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN workers w ON w.user_id=u.id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true`,[sha256(token)]);
  if(!result.rows[0])throw httpError(401,'Your session expired. Please log in again.','SESSION_EXPIRED');
  return result.rows[0];
}

function allow(user,roles){
  if(!roles.includes(normalizeRole(user.role)))throw httpError(403,'This action is not available for this role.','ROLE_FORBIDDEN');
}

module.exports={authenticate,allow,send,httpError};
