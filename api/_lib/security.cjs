'use strict';

const crypto=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken=(bytes=32)=>crypto.randomBytes(bytes).toString('hex');

async function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){
  const derived=await scrypt(String(password),salt,64);
  return `scrypt:${salt}:${Buffer.from(derived).toString('hex')}`;
}

async function verifyPassword(password,stored){
  const [algorithm,salt,expected]=String(stored||'').split(':');
  if(algorithm!=='scrypt'||!salt||!expected)return false;
  const actual=await scrypt(String(password),salt,64);
  const a=Buffer.from(actual),b=Buffer.from(expected,'hex');
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}

function parseCookies(header=''){
  return Object.fromEntries(String(header).split(';').map(x=>x.trim()).filter(Boolean).map(pair=>{const i=pair.indexOf('=');return [decodeURIComponent(i<0?pair:pair.slice(0,i)),decodeURIComponent(i<0?'':pair.slice(i+1))];}));
}

function bearerToken(req){
  const header=String(req.headers.authorization||'');
  if(/^Bearer\s+/i.test(header))return header.replace(/^Bearer\s+/i,'').trim();
  return parseCookies(req.headers.cookie||'').sanpaid_session||'';
}

function sessionCookie(token,maxAge){
  return `sanpaid_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

const clearSessionCookie=()=> 'sanpaid_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

module.exports={sha256,randomToken,hashPassword,verifyPassword,bearerToken,sessionCookie,clearSessionCookie};

