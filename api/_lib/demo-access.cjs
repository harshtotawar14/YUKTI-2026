'use strict';

const PUBLIC_DEMO_PASSWORD='SanPaid@26089';

const DEMO_ACCOUNTS=Object.freeze([
  Object.freeze({email:'customer.connected@sanpaid.demo',name:'Demo Customer',role:'CUSTOMER',persona:'CUSTOMER'}),
  Object.freeze({email:'worker1.connected@sanpaid.demo',name:'Asha Verma',role:'WORKER',persona:'WORKER_A'}),
  Object.freeze({email:'worker2.connected@sanpaid.demo',name:'Ravi Kumar',role:'WORKER',persona:'WORKER_B'}),
  Object.freeze({email:'admin.connected@sanpaid.demo',name:'Cooperative Admin',role:'COOPERATIVE_ADMIN',persona:null}),
  Object.freeze({email:'federation.connected@sanpaid.demo',name:'Federation Admin',role:'FEDERATION_ADMIN',persona:null})
]);

const DEMO_EMAILS=Object.freeze(DEMO_ACCOUNTS.map(account=>account.email));
const DEMO_WORKER_EMAILS=Object.freeze(DEMO_ACCOUNTS.filter(account=>account.role==='WORKER').map(account=>account.email));

function normalizeIdentifier(value){return String(value||'').trim().toLowerCase();}

function isPublicDemoCredential(identifier,password){
  const email=normalizeIdentifier(identifier);
  return DEMO_EMAILS.includes(email)&&String(password||'')===PUBLIC_DEMO_PASSWORD;
}

function publicDemoPayload(){
  return {
    ok:true,
    mode:'PUBLIC_SIH_DEMO',
    password:PUBLIC_DEMO_PASSWORD,
    accounts:DEMO_ACCOUNTS.map(({email,name,role,persona})=>({email,name,role,persona})),
    warning:'Public prototype credentials only. No production account or secret is exposed.'
  };
}

module.exports={PUBLIC_DEMO_PASSWORD,DEMO_ACCOUNTS,DEMO_EMAILS,DEMO_WORKER_EMAILS,isPublicDemoCredential,publicDemoPayload};
