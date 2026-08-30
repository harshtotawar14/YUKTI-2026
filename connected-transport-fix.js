(() => {
  'use strict';

  const BACKEND = 'https://sanpaid-sih-2026.onrender.com';
  const TOKEN_KEY = 'sanpaid_connected_demo_token_v1';
  const DEMO_EMAILS = new Set([
    'customer.connected@sanpaid.demo',
    'worker1.connected@sanpaid.demo',
    'worker2.connected@sanpaid.demo'
  ]);
  const nativeFetch = window.fetch.bind(window);

  function token(){
    try{return sessionStorage.getItem(TOKEN_KEY)||'';}catch{return '';}
  }
  function saveToken(value){
    try{if(value)sessionStorage.setItem(TOKEN_KEY,value);else sessionStorage.removeItem(TOKEN_KEY);}catch{}
  }
  function rawUrl(input){return typeof input==='string'?input:(input?.url||'');}
  function bodyJson(init){
    try{return typeof init?.body==='string'?JSON.parse(init.body):{};}catch{return {};}
  }
  function direct(path){return `${BACKEND}${path}`;}
  function withHeaders(init,useToken=true){
    const headers=new Headers(init?.headers||{});
    if(!headers.has('Content-Type')&&init?.body)headers.set('Content-Type','application/json');
    const t=token();
    if(useToken&&t)headers.set('Authorization',`Bearer ${t}`);
    return headers;
  }

  window.fetch = async function sanPaidConnectedFetch(input, init={}){
    const url=rawUrl(input);
    let target=null;
    let login=false;
    let logout=false;

    if(url==='/api/auth/login'){
      const payload=bodyJson(init);
      const identifier=String(payload.identifier||'').trim().toLowerCase();
      if(DEMO_EMAILS.has(identifier)){
        target=direct('/api/connected/auth/login');
        login=true;
      }
    }else if(url==='/api/auth/me'){
      target=direct('/api/connected/auth/me');
    }else if(url==='/api/auth/logout'){
      target=direct('/api/connected/auth/logout');
      logout=true;
    }else if(url.startsWith('/api/connected/')){
      target=direct(url);
    }

    if(!target)return nativeFetch(input,init);

    const response=await nativeFetch(target,{
      ...init,
      headers:withHeaders(init,!login),
      credentials:'omit',
      mode:'cors',
      cache:'no-store'
    });

    if(login&&response.ok){
      response.clone().json().then(data=>{
        if(data?.demoToken)saveToken(data.demoToken);
      }).catch(()=>{});
    }
    if(logout&&response.ok)saveToken('');
    return response;
  };

  // Vercel rewrites can be unreliable for long-lived EventSource streams.
  // Keep the EventSource API shape expected by connected-demo.js, but back it
  // with a short authenticated snapshot request every 3 seconds instead.
  class PollingEventSource {
    constructor(){
      this.listeners=new Map();
      this.onerror=null;
      this.readyState=0;
      this.closed=false;
      this.timer=null;
      this.tick=this.tick.bind(this);
      setTimeout(this.tick,50);
      this.timer=setInterval(this.tick,3000);
    }
    addEventListener(type,handler){
      if(!this.listeners.has(type))this.listeners.set(type,new Set());
      this.listeners.get(type).add(handler);
    }
    removeEventListener(type,handler){this.listeners.get(type)?.delete(handler);}
    emit(type,data){
      const event={type,data:JSON.stringify(data)};
      this.listeners.get(type)?.forEach(fn=>{try{fn(event);}catch{}});
    }
    async tick(){
      if(this.closed||!token())return;
      try{
        const r=await window.fetch('/api/connected/snapshot',{method:'GET'});
        if(!r.ok)throw new Error(`snapshot ${r.status}`);
        const data=await r.json();
        this.readyState=1;
        this.emit('snapshot',data);
        const top=document.getElementById('connectedTopStatus');
        if(top){top.textContent='● Backend + Live Polling';top.style.color='#8ee2b5';}
      }catch(e){
        this.readyState=0;
        if(typeof this.onerror==='function'){try{this.onerror(e);}catch{}}
      }
    }
    close(){
      this.closed=true;
      this.readyState=2;
      if(this.timer)clearInterval(this.timer);
      this.timer=null;
    }
  }

  window.EventSource=PollingEventSource;
  window.SanPaidConnectedTransport={backend:BACKEND,mode:'DIRECT_RENDER_BEARER_POLLING',clear:()=>saveToken('')};
})();
