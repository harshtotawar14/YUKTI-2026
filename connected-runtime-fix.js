(() => {
  'use strict';

  const BACKEND='https://sanpaid-sih-2026.onrender.com';
  const TOKEN_KEY='sanpaid_connected_demo_token_v1';
  const DEMO_EMAILS=new Set(['customer.connected@sanpaid.demo','worker1.connected@sanpaid.demo','worker2.connected@sanpaid.demo']);
  const SAFE_CONNECTED_LEGACY=new Set(['/api/services','/api/worker/dashboard','/api/worker/availability']);
  const CONNECTED_FALLBACKS=new Map([
    ['/api/connected/customer/services','/api/services'],
    ['/api/connected/worker/dashboard','/api/worker/dashboard'],
    ['/api/connected/worker/availability','/api/worker/availability']
  ]);
  const nativeFetch=window.fetch.bind(window);
  const NativeEventSource=window.EventSource;
  let healthTimer=null;

  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return''}}
  function setToken(value){try{value?sessionStorage.setItem(TOKEN_KEY,value):sessionStorage.removeItem(TOKEN_KEY)}catch{}}
  function connectedShellActive(){const shell=document.getElementById('connectedShell');return !!(shell&&!shell.classList.contains('hidden'));}
  function rawUrl(input){if(typeof input==='string')return input;if(input instanceof URL)return input.pathname+input.search;return input?.url||'';}
  function parseBody(init){try{return typeof init?.body==='string'?JSON.parse(init.body):{}}catch{return{}}}
  function direct(path){return `${BACKEND}${path}`;}
  function connectedPath(url){try{if(url.startsWith('/api/connected/'))return url;const parsed=new URL(url,location.href);if(parsed.origin===location.origin&&parsed.pathname.startsWith('/api/connected/'))return parsed.pathname+parsed.search;}catch{}return'';}
  function safeLegacyPath(url){
    if(!connectedShellActive()||!getToken())return'';
    try{
      const parsed=new URL(url,location.href);
      if(parsed.origin!==location.origin)return'';
      if(SAFE_CONNECTED_LEGACY.has(parsed.pathname))return parsed.pathname+parsed.search;
    }catch{}
    return'';
  }
  function fallbackFor(path){
    try{const parsed=new URL(path,location.href);return CONNECTED_FALLBACKS.get(parsed.pathname)||'';}catch{return'';}
  }
  function signalSync(snapshot){try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{snapshot,at:Date.now()}}));}catch{}}

  window.fetch=async function sanPaidConnectedFetch(input,init={}){
    const url=rawUrl(input);const token=getToken();let targetPath='';let isDemoLogin=false;let isDemoLogout=false;
    if(url==='/api/auth/login'&&connectedShellActive()){
      const payload=parseBody(init);const identifier=String(payload.identifier||'').trim().toLowerCase();
      if(DEMO_EMAILS.has(identifier)){targetPath='/api/connected/auth/login';isDemoLogin=true;}
    }else if(url==='/api/auth/me'&&connectedShellActive()){
      if(!token)return new Response(JSON.stringify({error:'not_authenticated'}),{status:401,headers:{'Content-Type':'application/json'}});
      targetPath='/api/connected/auth/me';
    }else if(url==='/api/auth/logout'&&connectedShellActive()&&token){targetPath='/api/connected/auth/logout';isDemoLogout=true;}
    else targetPath=connectedPath(url)||safeLegacyPath(url);
    if(!targetPath)return nativeFetch(input,init);

    const headers=new Headers(init.headers||{});if(!headers.has('Content-Type')&&init.body)headers.set('Content-Type','application/json');if(!isDemoLogin&&token)headers.set('Authorization',`Bearer ${token}`);
    let response=await nativeFetch(direct(targetPath),{...init,headers,credentials:'omit',mode:'cors',cache:'no-store'});
    const fallback=response.status===404?fallbackFor(targetPath):'';
    if(fallback&&token){
      response=await nativeFetch(direct(fallback),{...init,headers,credentials:'omit',mode:'cors',cache:'no-store'});
      if(response.ok)response.headers.get('x-sanpaid-fallback');
    }
    if(isDemoLogin&&response.ok){try{const data=await response.clone().json();if(data?.demoToken)setToken(data.demoToken);}catch{}}
    if(isDemoLogout&&response.ok)setToken('');
    if(response.status===401&&targetPath.startsWith('/api/connected/')&&!isDemoLogin)setToken('');
    return response;
  };

  function setTop(text,color){const top=document.getElementById('connectedTopStatus');if(!top)return;if(top.textContent!==text)top.textContent=text;if(top.style.color!==color)top.style.color=color;}

  class ConnectedPollingSource{
    constructor(url){this.url=String(url||'');this.listeners=new Map();this.onerror=null;this.onopen=null;this.readyState=0;this.closed=false;this.timer=null;this.opened=false;this.lastSignature='';this.tick=this.tick.bind(this);this.schedule(120);}
    addEventListener(type,handler){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(handler);}
    removeEventListener(type,handler){this.listeners.get(type)?.delete(handler);}
    emit(type,payload){const event={type,data:JSON.stringify(payload)};this.listeners.get(type)?.forEach(fn=>{try{fn(event)}catch{}});}
    schedule(delay=3000){if(this.closed)return;clearTimeout(this.timer);this.timer=setTimeout(this.tick,delay);}
    signature(snapshot){return JSON.stringify({role:snapshot?.role||'',bookings:snapshot?.bookings||[],offers:snapshot?.offers||[]});}
    async tick(){
      if(this.closed)return;
      if(document.hidden||!connectedShellActive()){this.schedule(1800);return;}
      if(!getToken()){this.readyState=0;this.schedule(1800);return;}
      try{
        const response=await window.fetch('/api/connected/snapshot',{method:'GET',cache:'no-store'});
        if(!response.ok)throw new Error(`snapshot_${response.status}`);
        const snapshot=await response.json();const sig=this.signature(snapshot);this.readyState=1;
        if(!this.opened){this.opened=true;if(typeof this.onopen==='function'){try{this.onopen({type:'open'})}catch{}}}
        if(sig!==this.lastSignature){this.lastSignature=sig;this.emit('snapshot',snapshot);signalSync(snapshot);}
        setTop('● Live','#8ee2b5');this.schedule(3000);
      }catch(error){this.readyState=0;setTop('● Reconnecting…','#ffb66e');if(typeof this.onerror==='function'){try{this.onerror(error)}catch{}}this.schedule(4500);}
    }
    close(){this.closed=true;this.readyState=2;clearTimeout(this.timer);this.timer=null;}
  }

  if(NativeEventSource){window.EventSource=function SanPaidEventSource(url,options){if(String(url||'')==='/api/connected/events')return new ConnectedPollingSource(url,options);return new NativeEventSource(url,options);};window.EventSource.CONNECTING=NativeEventSource.CONNECTING??0;window.EventSource.OPEN=NativeEventSource.OPEN??1;window.EventSource.CLOSED=NativeEventSource.CLOSED??2;window.EventSource.prototype=NativeEventSource.prototype;}else window.EventSource=ConnectedPollingSource;

  window.SanPaidConnectedTransport={backend:BACKEND,mode:'DIRECT_RENDER_BEARER_POLLING_COORDINATED',hasSession:()=>!!getToken(),clearSession:()=>setToken('')};

  function setStatusRow(label,badgeText,detail,tone='orange'){document.querySelectorAll('#status tbody tr').forEach(row=>{const cells=row.querySelectorAll('td');if(!cells.length||!cells[0].textContent.includes(label))return;const badge=cells[1]?.querySelector('.badge');const className=`badge ${tone==='green'?'b-green':tone==='purple'?'b-purple':'b-orange'}`;if(badge){if(badge.textContent!==badgeText)badge.textContent=badgeText;if(badge.className!==className)badge.className=className;}if(detail&&cells[2]&&cells[2].textContent!==detail)cells[2].textContent=detail;});}
  function syncLandingTruth(online){if(online){setStatusRow('Connected two-device booking','BACKEND CONNECTED','Customer and worker devices share the same booking and offer state.','green');setStatusRow('Eligibility-first matching','CONNECTED DEMO','Verified, available and skill-eligible workers are gated before fair ranking.','green');setStatusRow('Worker accept/reject','BACKEND CONNECTED','Worker choice and same-booking fallback are connected.','green');setStatusRow('PostgreSQL backend','CONNECTED','Shared backend database is reachable.','green');}else{const text='Connected service is temporarily unavailable. Retry when the connection is restored.';setStatusRow('Connected two-device booking','BACKEND OFFLINE',text,'orange');setStatusRow('Worker accept/reject','BACKEND OFFLINE',text,'orange');setStatusRow('PostgreSQL backend','OFFLINE',text,'orange');}}
  async function checkHealth(){if(document.hidden)return;try{const r=await window.fetch('/api/connected/health',{cache:'no-store'});const d=await r.json().catch(()=>({}));syncLandingTruth(Boolean(r.ok&&d?.ok));}catch{syncLandingTruth(false);}}
  function scheduleHealth(delay=45000){clearTimeout(healthTimer);healthTimer=setTimeout(async()=>{await checkHealth();scheduleHealth(document.hidden?90000:45000);},delay);}
  function start(){checkHealth();scheduleHealth();window.addEventListener('online',checkHealth);window.addEventListener('offline',()=>syncLandingTruth(false));document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkHealth();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();