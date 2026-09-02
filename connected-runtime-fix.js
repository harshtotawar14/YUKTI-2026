(() => {
  'use strict';

  const CONNECTED_TOKEN_KEY='sanpaid_connected_demo_token_v1';
  const ADMIN_TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const subscribers=new Set();
  let syncTimer=0;
  let syncInFlight=false;
  let lastSignature='';
  let lastSnapshot=null;

  function storageGet(key){try{return sessionStorage.getItem(key)||'';}catch{return '';}}
  function storageSet(key,value){try{value?sessionStorage.setItem(key,String(value)):sessionStorage.removeItem(key);}catch{}}
  function normalizePath(input){
    const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';
    try{
      const url=new URL(raw,location.href);
      if(url.pathname.startsWith('/api/'))return `${url.pathname}${url.search}`;
    }catch{}
    return raw;
  }
  function tokenFor(path){
    if(path.startsWith('/api/cooperative-admin/'))return storageGet(ADMIN_TOKEN_KEY);
    if(path.startsWith('/api/connected/'))return storageGet(CONNECTED_TOKEN_KEY)||storageGet(ADMIN_TOKEN_KEY);
    return '';
  }
  function clearRoleToken(path){
    if(path.startsWith('/api/cooperative-admin/'))storageSet(ADMIN_TOKEN_KEY,'');
    if(path.startsWith('/api/connected/')){storageSet(CONNECTED_TOKEN_KEY,'');storageSet(ADMIN_TOKEN_KEY,'');}
  }
  function makeError(response,data){
    const error=new Error(data?.message||data?.error||`Request failed (${response.status})`);
    error.status=response.status;error.data=data||{};return error;
  }

  async function raw(input,options={}){
    const path=normalizePath(input);
    const headers=new Headers(options.headers||{});
    if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    const bearer=options.bearer===false?'':(options.token||tokenFor(path));
    if(bearer&&!headers.has('Authorization'))headers.set('Authorization',`Bearer ${bearer}`);
    const response=await fetch(path,{...options,headers,credentials:options.credentials||'include',cache:options.cache||'no-store'});
    if(response.status===401)clearRoleToken(path);
    return response;
  }

  async function request(input,options={}){
    const response=await raw(input,options);
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      if(response.status===401){
        try{window.dispatchEvent(new CustomEvent('sanpaid:session-expired'));}catch{}
      }
      throw makeError(response,data);
    }
    return data;
  }
  const get=(path,options={})=>request(path,{...options,method:'GET'});
  const post=(path,body={},options={})=>request(path,{...options,method:'POST',body:JSON.stringify(body)});
  const patch=(path,body={},options={})=>request(path,{...options,method:'PATCH',body:JSON.stringify(body)});

  window.SanPaidApi=Object.freeze({
    request,get,post,patch,raw,
    connectedToken:()=>storageGet(CONNECTED_TOKEN_KEY),
    adminToken:()=>storageGet(ADMIN_TOKEN_KEY),
    clearConnectedToken:()=>storageSet(CONNECTED_TOKEN_KEY,''),
    clearAdminToken:()=>storageSet(ADMIN_TOKEN_KEY,''),
    mode:'EXPLICIT_SAME_ORIGIN_API_CLIENT'
  });

  function connectedVisible(){
    const shell=document.getElementById('connectedShell');
    return !!(shell&&!shell.classList.contains('hidden'));
  }
  function signature(snapshot){
    return JSON.stringify({role:snapshot?.role||'',revision:snapshot?.revision||'0',bookings:snapshot?.bookings||[],offers:snapshot?.offers||[]});
  }
  function emit(snapshot,changed=true){
    lastSnapshot=snapshot;
    for(const listener of subscribers){try{listener(snapshot,{changed});}catch(error){console.error('[SanPaidSync subscriber]',error);}}
    try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source:'snapshot',snapshot,changed,at:Date.now()}}));}catch{}
  }
  function clearTimer(){clearTimeout(syncTimer);syncTimer=0;}
  function schedule(delay){clearTimer();if(!subscribers.size)return;syncTimer=setTimeout(tick,delay);}
  async function tick(force=false){
    if(syncInFlight||!subscribers.size)return;
    if(!connectedVisible()){schedule(document.hidden?45000:5000);return;}
    if(document.hidden&&!force){schedule(45000);return;}
    syncInFlight=true;
    try{
      const snapshot=await get('/api/connected/snapshot');
      const nextSignature=signature(snapshot),changed=nextSignature!==lastSignature;
      if(changed||force){lastSignature=nextSignature;emit(snapshot,changed);}
      setConnectionState('online');
    }catch(error){
      setConnectionState(error?.status===401?'offline':'retry');
      if(error?.status===401){try{window.SanPaidAuth?.handleExpiredSession?.();}catch{}}
    }finally{
      syncInFlight=false;
      schedule(document.hidden?45000:4000);
    }
  }
  function setConnectionState(state){
    const element=document.getElementById('connectedTopStatus');if(!element)return;
    const map={online:['● Live','#8ee2b5'],retry:['● Reconnecting…','#ffb66e'],offline:['● Offline','#ff9b9b']};
    const [text,color]=map[state]||map.retry;element.textContent=text;element.style.color=color;
  }
  function subscribe(listener){
    if(typeof listener!=='function')return()=>{};
    subscribers.add(listener);if(subscribers.size===1)schedule(80);
    if(lastSnapshot)queueMicrotask(()=>{try{listener(lastSnapshot,{changed:false,cached:true});}catch{}});
    return()=>{subscribers.delete(listener);if(!subscribers.size)clearTimer();};
  }
  function refreshNow(){if(!subscribers.size)return Promise.resolve();clearTimer();return tick(true);}
  function stop(){subscribers.clear();clearTimer();lastSignature='';lastSnapshot=null;}

  window.SanPaidSync=Object.freeze({subscribe,refreshNow,stop,getLastSnapshot:()=>lastSnapshot,mode:'ONE_ROLE_AWARE_SNAPSHOT_LOOP'});

  async function checkHealth(){
    if(document.hidden)return;
    try{const data=await get('/api/connected/health',{bearer:false});setConnectionState(data?.ok?'online':'offline');}
    catch{setConnectionState('offline');}
  }

  function start(){
    checkHealth();
    window.addEventListener('online',()=>{checkHealth();refreshNow();});
    window.addEventListener('offline',()=>setConnectionState('offline'));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkHealth();refreshNow();}});
    window.addEventListener('pageshow',()=>{checkHealth();refreshNow();});
    window.addEventListener('sanpaid:connected-sync',event=>{if(event.detail?.source!=='snapshot')refreshNow();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
