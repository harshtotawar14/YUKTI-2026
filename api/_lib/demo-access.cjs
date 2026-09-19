'use strict';

const PUBLIC_DEMO_PASSWORD='SanPaid@26089';

const DEMO_ACCOUNTS=Object.freeze([
  Object.freeze({accessId:'customer',email:'customer.connected@sanpaid.demo',name:'SanPaid Customer',role:'CUSTOMER',persona:'CUSTOMER'}),
  Object.freeze({accessId:'worker-a',email:'worker1.connected@sanpaid.demo',name:'Asha Verma',role:'WORKER',persona:'WORKER_A'}),
  Object.freeze({accessId:'worker-b',email:'worker2.connected@sanpaid.demo',name:'Ravi Kumar',role:'WORKER',persona:'WORKER_B'}),
  Object.freeze({accessId:'cooperative-admin',email:'admin.connected@sanpaid.demo',name:'Cooperative Admin',role:'COOPERATIVE_ADMIN',persona:null}),
  Object.freeze({accessId:'federation-admin',email:'federation.connected@sanpaid.demo',name:'Federation Admin',role:'FEDERATION_ADMIN',persona:null})
]);

const DEMO_EMAILS=Object.freeze(DEMO_ACCOUNTS.map(account=>account.email));
const DEMO_WORKER_EMAILS=Object.freeze(DEMO_ACCOUNTS.filter(account=>account.role==='WORKER').map(account=>account.email));

function normalizeIdentifier(value){return String(value||'').trim().toLowerCase();}

function resolveLoginIdentifier(value){
  const identifier=normalizeIdentifier(value);
  const account=DEMO_ACCOUNTS.find(item=>item.accessId===identifier);
  return account?.email||identifier;
}

function isPublicDemoCredential(identifier,password){
  const email=resolveLoginIdentifier(identifier);
  return DEMO_EMAILS.includes(email)&&String(password||'')===PUBLIC_DEMO_PASSWORD;
}

function publicDemoPayload(){
  return {
    ok:true,
    mode:'SHARED_PLATFORM_ACCESS',
    password:PUBLIC_DEMO_PASSWORD,
    accounts:DEMO_ACCOUNTS.map(({accessId,name,role,persona})=>({accessId,name,role,persona})),
    warning:'Shared access credentials are limited to isolated platform-review accounts.'
  };
}

module.exports={PUBLIC_DEMO_PASSWORD,DEMO_ACCOUNTS,DEMO_EMAILS,DEMO_WORKER_EMAILS,resolveLoginIdentifier,isPublicDemoCredential,publicDemoPayload};
