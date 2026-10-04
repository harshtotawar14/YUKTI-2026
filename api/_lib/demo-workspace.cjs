'use strict';

const {sha256,randomToken}=require('./security.cjs');
const {DEMO_ACCOUNTS,DEMO_EMAILS}=require('./demo-access.cjs');

const DEMO_WORKSPACE_COOKIE='sanpaid_demo_workspace';
const WORKSPACE_TOKEN_PATTERN=/^[a-f0-9]{64}$/i;
const CURRENT_SCOPED_EMAIL_PATTERN=/\.w2-([a-f0-9]{20})@/i;
const RETIRED_SCOPED_EMAIL_PATTERN=/\.w-([a-f0-9]{20})@/i;
const ANY_SCOPED_EMAIL_PATTERN=/\.w(?:2)?-([a-f0-9]{20})@/i;
const WORKSPACE_GENERATION='v2';

function parseCookies(header=''){
  return Object.fromEntries(String(header).split(';').map(x=>x.trim()).filter(Boolean).map(pair=>{
    const i=pair.indexOf('=');
    return [decodeURIComponent(i<0?pair:pair.slice(0,i)),decodeURIComponent(i<0?'':pair.slice(i+1))];
  }));
}

function appendSetCookie(res,cookie){
  const existing=res.getHeader?.('Set-Cookie');
  if(!existing)return res.setHeader('Set-Cookie',cookie);
  const values=Array.isArray(existing)?existing:[existing];
  res.setHeader('Set-Cookie',[...values,cookie]);
}

function workspaceCookie(token){
  return `${DEMO_WORKSPACE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function clearWorkspaceCookie(){
  return `${DEMO_WORKSPACE_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`;
}

function ensureWorkspaceToken(req,res){
  const current=parseCookies(req.headers?.cookie||'')[DEMO_WORKSPACE_COOKIE]||'';
  if(WORKSPACE_TOKEN_PATTERN.test(current))return current.toLowerCase();
  const token=randomToken(32);
  appendSetCookie(res,workspaceCookie(token));
  return token;
}

function workspaceKeyFromToken(token){
  if(!WORKSPACE_TOKEN_PATTERN.test(String(token||'')))return '';
  return sha256(`${WORKSPACE_GENERATION}:${String(token).toLowerCase()}`).slice(0,20);
}

function scopedDemoEmail(canonicalEmail,workspaceKey){
  const email=String(canonicalEmail||'').toLowerCase();
  const at=email.lastIndexOf('@');
  if(at<1||!/^[a-f0-9]{20}$/i.test(String(workspaceKey||'')))return email;
  return `${email.slice(0,at)}.w2-${String(workspaceKey).toLowerCase()}${email.slice(at)}`;
}

function canonicalDemoEmail(email){
  const value=String(email||'').trim().toLowerCase();
  if(DEMO_EMAILS.includes(value))return value;
  const canonical=value.replace(ANY_SCOPED_EMAIL_PATTERN,'@');
  return DEMO_EMAILS.includes(canonical)?canonical:null;
}

function workspaceKeyFromEmail(email){
  const match=String(email||'').match(ANY_SCOPED_EMAIL_PATTERN);
  return match?match[1].toLowerCase():'';
}

function isLegacySharedDemoEmail(email){return DEMO_EMAILS.includes(String(email||'').trim().toLowerCase());}
function isScopedDemoEmail(email){return Boolean(canonicalDemoEmail(email)&&workspaceKeyFromEmail(email));}
function isCurrentDemoWorkspaceEmail(email){return CURRENT_SCOPED_EMAIL_PATTERN.test(String(email||''));}
function isRetiredDemoWorkspaceEmail(email){return RETIRED_SCOPED_EMAIL_PATTERN.test(String(email||''));}
function demoAccountForEmail(email){
  const canonical=canonicalDemoEmail(email);
  return canonical?DEMO_ACCOUNTS.find(account=>account.email===canonical)||null:null;
}

module.exports={
  DEMO_WORKSPACE_COOKIE,
  ensureWorkspaceToken,
  workspaceKeyFromToken,
  scopedDemoEmail,
  canonicalDemoEmail,
  workspaceKeyFromEmail,
  isLegacySharedDemoEmail,
  isScopedDemoEmail,
  isCurrentDemoWorkspaceEmail,
  isRetiredDemoWorkspaceEmail,
  demoAccountForEmail,
  appendSetCookie,
  clearWorkspaceCookie
};
