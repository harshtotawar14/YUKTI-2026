'use strict';

const TRANSITIONS=Object.freeze({
  travel:{from:['ACCEPTED'],to:'ON_THE_WAY'},
  arrive:{from:['ON_THE_WAY'],to:'ARRIVED'},
  identity:{from:['ARRIVED'],to:'IDENTITY_VERIFIED'},
  confirmWorker:{from:['IDENTITY_VERIFIED'],to:'CUSTOMER_CONFIRMED'},
  start:{from:['CUSTOMER_CONFIRMED'],to:'IN_PROGRESS'},
  completionRequest:{from:['IN_PROGRESS'],to:'AWAITING_CUSTOMER_CONFIRMATION'},
  complete:{from:['AWAITING_CUSTOMER_CONFIRMATION'],to:'COMPLETED'},
  pay:{from:['COMPLETED','PAYMENT_PENDING'],to:'PAID'}
});

function transition(action,current){
  const rule=TRANSITIONS[action];
  if(!rule)throw Object.assign(new Error(`Unknown booking action: ${action}`),{status:400});
  if(!rule.from.includes(String(current||'').toUpperCase())){
    throw Object.assign(new Error(`${action} is not allowed while booking is ${current}.`),{status:409});
  }
  return rule.to;
}

function normalizeRole(value){
  const role=String(value||'').trim().toUpperCase();
  return role==='ADMIN'?'COOPERATIVE_ADMIN':role;
}

function publicUser(row){
  return {id:Number(row.id),email:row.email,name:row.name,role:normalizeRole(row.role),cooperativeId:row.cooperative_id?Number(row.cooperative_id):null};
}

module.exports={TRANSITIONS,transition,normalizeRole,publicUser};

