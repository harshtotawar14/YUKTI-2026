'use strict';

const handler=require('./[...path].js');
const matchingRoutes=require('../backend/src/matching/connected-routes.cjs');
const publicProof=require('../backend/src/proof/public-summary.cjs');
const judgeTruth=require('../backend/src/judge/truth-routes.cjs');
const workerProfile=require('../backend/src/worker/profile-routes.cjs');

module.exports=async function stableApiEntrypoint(req,res){
  const requestUrl=new URL(req.url,'https://sanpaid.local');
  const rawPath=String(requestUrl.searchParams.get('path')||'').replace(/^\/+|\/+$/g,'');
  requestUrl.searchParams.delete('path');
  const suffix=requestUrl.searchParams.toString();
  req.url=`/api/${rawPath}${suffix?`?${suffix}`:''}`;
  try{
    if(await publicProof.handle(req,res,rawPath))return;
    if(await matchingRoutes.handle(req,res,rawPath))return;
    if(await judgeTruth.handle(req,res,rawPath))return;
    if(await workerProfile.handle(req,res,rawPath))return;
  }catch(error){
    console.error('[sanpaid-api-adapter]',rawPath,error.code||error.message);
    const status=Number(error.status)||500;
    res.statusCode=status;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    return res.end(JSON.stringify({ok:false,error:error.code||'INTERNAL_ERROR',message:status>=500&&process.env.NODE_ENV==='production'?'Service temporarily unavailable.':error.message}));
  }
  return handler(req,res);
};
