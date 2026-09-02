'use strict';

const handler=require('./[...path].js');

module.exports=async function stableApiEntrypoint(req,res){
  const requestUrl=new URL(req.url,'https://sanpaid.local');
  const rawPath=requestUrl.searchParams.get('path')||'';
  requestUrl.searchParams.delete('path');
  const suffix=requestUrl.searchParams.toString();
  req.url=`/api/${String(rawPath).replace(/^\/+|\/+$/g,'')}${suffix?`?${suffix}`:''}`;
  return handler(req,res);
};
