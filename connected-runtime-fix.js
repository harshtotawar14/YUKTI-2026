(() => {
  'use strict';

  const TOKEN_KEY='sanpaid_connected_demo_token_v1';
  const DEMO_EMAILS=new Set(['customer.connected@sanpaid.demo','worker1.connected@sanpaid.demo','worker2.connected@sanpaid.demo']);
  const nativeFetch=window.fetch.bind(window);
  const NativeEventSource=window.EventSource;
  let healthTimer=null;

  function getToken(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return''}}
  function setToken(value){try{value?sessionStorage.setItem(TOKEN_KEY,value):sessionStorage.removeItem(TOKEN_KEY)}catch{}}
  function rawUrl(input){if(typeof input==='string')return input;if(input instanceof URL)return input.href;return input?.url||'';}
  function parsed(url){try{return new URL(url,location.href)}catch{return null}}
  function pathname(url){return parsed(url)?.pathname||String(url||'').split('?')[0]}
  function pathWithQuery(url){const u=parsed(url);return u?u.pathname+u.search:String(url||'')}
  function parseBody(init){try{return typeof init?.body==='string'?JSON.parse(init.body):{}}catch{return{}}}
  function connectedPath(url){const p=pathWithQuery(url);return p.startsWith('/api/connected/')?p:'';}
  function normalizedApiInput(input){
    const url=rawUrl(input),u=parsed(url);
    if(!u||!u.pathname.startsWith('/api/'))return input;
    if(u.origin===location.origin)return input;
    return `${u.pathname}${u.search}`;
  }
  function signalSync(snapshot){try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{snapshot,at:Date.now()}}));}catch{}}
  function jsonResponse(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}

  async function fetchWithConnectedAuth(path,init={}){
    const headers=new Headers(init.headers||{}),token=getToken();
    if(init.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
    if(token)headers.set('Authorization',`Bearer ${token}`);
    return nativeFetch(path,{...init,headers,credentials:'include',cache:'no-store'});
  }

  async function compatibilityFallback(path,init,response){
    if(response.status!==404)return response;
    const method=String(init.method||'GET').toUpperCase();
    let legacy='';
    if(method==='GET'&&path.startsWith('/api/connected/customer/services'))legacy='/api/services';
    if(method==='GET'&&path.startsWith('/api/connected/worker/dashboard'))legacy='/api/worker/dashboard';
    if(method==='POST'&&path.startsWith('/api/connected/worker/availability'))legacy='/api/worker/availability';
    if(!legacy)return response;
    const r=await fetchWithConnectedAuth(legacy,init);
    if(!r.ok)return r;
    const data=await r.clone().json().catch(()=>null);
    if(legacy==='/api/services'&&Array.isArray(data))return jsonResponse({ok:true,services:data});
    if(legacy==='/api/worker/dashboard'&&data){
      const raw=data.earnings||{};
      return jsonResponse({ok:true,profile:data.profile||{},jobs:data.jobs||{},earnings:{total:Number(raw.total||0),today:Number(raw.today||0),week:Number(raw.week||0),payments:Array.isArray(raw.payments)?raw.payments:[]}});
    }
    return r;
  }

  window.fetch=async function sanPaidFetch(input,init={}){
    input=normalizedApiInput(input);
    const url=rawUrl(input),path=pathname(url);

    if(path==='/api/auth/login'){
      const response=await nativeFetch(input,{...init,credentials:'include',cache:'no-store'});
      if(response.ok){
        try{const payload=parseBody(init),identifier=String(payload.identifier||'').trim().toLowerCase(),data=await response.clone().json();if(DEMO_EMAILS.has(identifier)&&data?.demoToken)setToken(data.demoToken);}catch{}
      }
      return response;
    }

    if(path==='/api/auth/logout'){
      const response=await nativeFetch(input,{...init,credentials:'include',cache:'no-store'}).catch(()=>jsonResponse({ok:true}));
      setToken('');return response;
    }

    if(path==='/api/auth/me'&&getToken()){
      const response=await fetchWithConnectedAuth('/api/connected/auth/me',{...init,method:'GET'});
      if(response.status===401)setToken('');
      return response;
    }

    const cpath=connectedPath(url);
    if(!cpath)return nativeFetch(input,{...init,credentials:init.credentials||'same-origin'});

    let response=await fetchWithConnectedAuth(cpath,init);
    response=await compatibilityFallback(cpath,init,response);
    if(response.status===401)setToken('');
    return response;
  };

  function setTop(text,color){const top=document.getElementById('connectedTopStatus');if(!top)return;top.textContent=text;top.style.color=color;}

  class ConnectedPollingSource{
    constructor(url){this.url=String(url||'');this.listeners=new Map();this.onerror=null;this.onopen=null;this.readyState=0;this.closed=false;this.timer=null;this.opened=false;this.lastSignature='';this.tick=this.tick.bind(this);this.schedule(150);}
    addEventListener(type,handler){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(handler);}
    removeEventListener(type,handler){this.listeners.get(type)?.delete(handler);}
    emit(type,payload){const event={type,data:JSON.stringify(payload)};this.listeners.get(type)?.forEach(fn=>{try{fn(event)}catch{}});}
    schedule(delay=3200){if(this.closed)return;clearTimeout(this.timer);this.timer=setTimeout(this.tick,delay);}
    signature(snapshot){return JSON.stringify({role:snapshot?.role||'',revision:snapshot?.revision||'0',bookings:snapshot?.bookings||[],offers:snapshot?.offers||[]});}
    async tick(){
      if(this.closed)return;
      const shell=document.getElementById('connectedShell');
      if(document.hidden||!shell||shell.classList.contains('hidden')){this.schedule(1800);return;}
      try{
        const response=await window.fetch('/api/connected/snapshot',{method:'GET',cache:'no-store'});
        if(!response.ok)throw new Error(`snapshot_${response.status}`);
        const snapshot=await response.json(),sig=this.signature(snapshot);this.readyState=1;
        if(!this.opened){this.opened=true;try{this.onopen?.({type:'open'});}catch{}}
        if(sig!==this.lastSignature){this.lastSignature=sig;this.emit('snapshot',snapshot);signalSync(snapshot);}
        setTop('● Live','#8ee2b5');this.schedule(3200);
      }catch(error){this.readyState=0;setTop('● Reconnecting…','#ffb66e');try{this.onerror?.(error);}catch{}this.schedule(4500);}
    }
    close(){this.closed=true;this.readyState=2;clearTimeout(this.timer);this.timer=null;}
  }

  if(NativeEventSource){
    window.EventSource=function SanPaidEventSource(url,options){if(String(url||'')==='/api/connected/events')return new ConnectedPollingSource(url,options);return new NativeEventSource(url,options);};
    window.EventSource.CONNECTING=NativeEventSource.CONNECTING??0;window.EventSource.OPEN=NativeEventSource.OPEN??1;window.EventSource.CLOSED=NativeEventSource.CLOSED??2;window.EventSource.prototype=NativeEventSource.prototype;
  }else window.EventSource=ConnectedPollingSource;

  window.SanPaidConnectedTransport={backend:'same-origin',mode:'SAME_ORIGIN_AUTHENTICATED_API',hasSession:()=>!!getToken(),clearSession:()=>setToken('')};

  function setStatusRow(label,badgeText,detail,tone='orange'){
    document.querySelectorAll('#status tbody tr').forEach(row=>{const cells=row.querySelectorAll('td');if(!cells.length||!cells[0].textContent.includes(label))return;const badge=cells[1]?.querySelector('.badge');if(badge){badge.textContent=badgeText;badge.className=`badge ${tone==='green'?'b-green':'b-orange'}`;}if(detail&&cells[2])cells[2].textContent=detail;});
  }
  function syncLandingTruth(online){
    if(online){setStatusRow('Connected two-device booking','BACKEND CONNECTED','Customer and worker devices share the same booking and offer state.','green');setStatusRow('Worker accept/reject','BACKEND CONNECTED','Worker choice and same-booking fallback are connected.','green');setStatusRow('PostgreSQL backend','CONNECTED','Shared backend database is reachable.','green');}
    else{const text='Connected service is temporarily unavailable. Retry when the connection is restored.';setStatusRow('Connected two-device booking','BACKEND OFFLINE',text);setStatusRow('Worker accept/reject','BACKEND OFFLINE',text);setStatusRow('PostgreSQL backend','OFFLINE',text);}
  }
  async function checkHealth(){if(document.hidden)return;try{const r=await window.fetch('/api/connected/health',{cache:'no-store'}),d=await r.json().catch(()=>({}));syncLandingTruth(Boolean(r.ok&&d?.ok));}catch{syncLandingTruth(false);}}
  function scheduleHealth(delay=45000){clearTimeout(healthTimer);healthTimer=setTimeout(async()=>{await checkHealth();scheduleHealth(document.hidden?90000:45000);},delay);}
  function start(){checkHealth();scheduleHealth();window.addEventListener('online',checkHealth);window.addEventListener('offline',()=>syncLandingTruth(false));document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkHealth();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();