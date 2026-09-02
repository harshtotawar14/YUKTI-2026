(() => {
  'use strict';

  const CONNECTED_TOKEN_KEY='sanpaid_connected_demo_token_v1';
  const ADMIN_TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const subscribers=new Set();
  let syncTimer=0;
  let syncInFlight=false;
  let lastSignature='';
  let lastSnapshot=null;
  const DEFAULT_TIMEOUT_MS=10000;

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
    const controller=new AbortController();
    const timeoutMs=Number.isFinite(Number(options.timeoutMs))?Number(options.timeoutMs):DEFAULT_TIMEOUT_MS;
    const timeout=timeoutMs>0?setTimeout(()=>controller.abort(new DOMException('Request timed out','TimeoutError')),timeoutMs):0;
    const relayAbort=()=>controller.abort(options.signal?.reason);
    if(options.signal){
      if(options.signal.aborted)relayAbort();
      else options.signal.addEventListener('abort',relayAbort,{once:true});
    }
    try{
      const {timeoutMs:_timeoutMs,bearer:_bearer,token:_token,signal:_signal,...fetchOptions}=options;
      const response=await fetch(path,{...fetchOptions,headers,signal:controller.signal,credentials:options.credentials||'include',cache:options.cache||'no-store'});
      if(response.status===401)clearRoleToken(path);
      return response;
    }finally{
      if(timeout)clearTimeout(timeout);
      options.signal?.removeEventListener?.('abort',relayAbort);
    }
  }

  async function request(input,options={}){
    const method=String(options.method||'GET').toUpperCase();
    const canRetry=method==='GET'&&options.retry!==false;
    for(let attempt=0;attempt<(canRetry?2:1);attempt++){
      try{
        const response=await raw(input,options);
        const data=await response.json().catch(()=>({}));
        if(response.ok)return data;
        if(canRetry&&attempt===0&&[502,503,504].includes(response.status))continue;
        if(response.status===401){
          try{window.dispatchEvent(new CustomEvent('sanpaid:session-expired'));}catch{}
        }
        throw makeError(response,data);
      }catch(error){
        if(canRetry&&attempt===0&&(error?.name==='AbortError'||error?.name==='TimeoutError'||error instanceof TypeError))continue;
        throw error;
      }
    }
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

  const readinessState={running:null,prompt:null,last:null};
  const readinessChecks=[
    {id:'backend',label:'Connected backend',run:()=>get('/api/connected/health',{bearer:false,timeoutMs:12000})},
    {id:'catalog',label:'Database service catalog',run:()=>get('/api/public/services',{bearer:false,timeoutMs:12000})}
  ];
  function readinessRoot(){
    let root=document.getElementById('sanpaidReadiness');
    if(root)return root;
    root=document.createElement('div');root.id='sanpaidReadiness';root.className='readiness-backdrop';root.hidden=true;
    root.innerHTML='<section class="readiness-dialog" role="dialog" aria-modal="true" aria-labelledby="readinessTitle"><span class="connected-step-label">GOLDEN DEMO PREFLIGHT</span><h2 id="readinessTitle">Checking connected services</h2><p id="readinessSummary">The live workflow opens only after its critical dependencies respond.</p><div id="readinessChecks" class="readiness-checks" aria-live="polite"></div><div class="readiness-actions"><button type="button" class="btn secondary" data-readiness-close>Close</button><button type="button" class="btn secondary" data-readiness-retry hidden>Retry checks</button><button type="button" class="btn primary" data-readiness-continue hidden>Continue to role access</button></div></section>';
    document.body.appendChild(root);return root;
  }
  function renderReadiness(results=[]){
    const root=readinessRoot(),list=root.querySelector('#readinessChecks');
    list.innerHTML=readinessChecks.map(check=>{const result=results.find(item=>item.id===check.id);const state=!result?'checking':result.ok?'ready':'blocked';return `<div class="readiness-row ${state}"><span aria-hidden="true">${state==='ready'?'✓':state==='blocked'?'!':'…'}</span><div><b>${check.label}</b><small>${!result?'Checking…':result.ok?result.detail:result.detail||'Unavailable'}</small></div></div>`;}).join('');
  }
  async function runReadiness(){
    if(readinessState.running)return readinessState.running;
    renderReadiness();
    readinessState.running=Promise.all(readinessChecks.map(async check=>{
      const started=performance.now();
      try{
        const data=await check.run();
        const valid=check.id==='catalog'?data?.ok===true&&Array.isArray(data.services)&&data.services.length>0:data?.ok===true;
        return {id:check.id,ok:valid,detail:valid?`${Math.round(performance.now()-started)} ms · ready`:'Unexpected response contract'};
      }catch(error){return {id:check.id,ok:false,detail:error?.message||'Connection failed'};}
    })).then(results=>{readinessState.last={ok:results.every(item=>item.ok),results,checkedAt:Date.now()};return readinessState.last;}).finally(()=>{readinessState.running=null;});
    return readinessState.running;
  }
  function requireReadiness(){
    if(readinessState.prompt)return readinessState.prompt;
    readinessState.prompt=(async()=>{
      const root=readinessRoot(),summary=root.querySelector('#readinessSummary'),retry=root.querySelector('[data-readiness-retry]'),proceed=root.querySelector('[data-readiness-continue]'),close=root.querySelector('[data-readiness-close]'),lastFocus=document.activeElement;
      root.hidden=false;document.body.classList.add('readiness-open');renderReadiness();retry.hidden=true;proceed.hidden=true;summary.textContent='The live workflow opens only after its critical dependencies respond.';
      const result=await runReadiness();renderReadiness(result.results);
      summary.textContent=result.ok?'Connected services are ready. Continue to secure role access.':'Connected demo is unavailable. No write action or fake success will be shown.';
      retry.hidden=result.ok;proceed.hidden=!result.ok;
      return new Promise(resolve=>{
        let settled=false;
        const finish=value=>{if(settled)return;settled=true;root.hidden=true;document.body.classList.remove('readiness-open');if(!value&&lastFocus?.isConnected)lastFocus.focus();resolve(value);};
        close.onclick=()=>finish(false);
        proceed.onclick=()=>finish(true);
        retry.onclick=async()=>{retry.disabled=true;const next=await runReadiness();renderReadiness(next.results);summary.textContent=next.ok?'Connected services are ready. Continue to secure role access.':'Connected demo is still unavailable. Retry after the backend is ready.';retry.hidden=next.ok;proceed.hidden=!next.ok;retry.disabled=false;(next.ok?proceed:retry).focus();};
        root.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();finish(false);return;}if(event.key!=='Tab')return;const buttons=[close,retry,proceed].filter(button=>!button.hidden&&!button.disabled);if(!buttons.length)return;const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};
        (result.ok?proceed:retry).focus();
      });
    })().finally(()=>{readinessState.prompt=null;});
    return readinessState.prompt;
  }
  window.SanPaidReadiness=Object.freeze({run:runReadiness,require:requireReadiness,getLastResult:()=>readinessState.last});

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
