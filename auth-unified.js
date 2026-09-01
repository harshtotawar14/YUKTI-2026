(() => {
  'use strict';

  const ROLE_META={
    CUSTOMER:{icon:'👤',label:'Customer',email:'customer.connected@sanpaid.demo',role:'CUSTOMER',target:'connected',persona:'CUSTOMER',help:'Request and track verified local services.'},
    WORKER:{icon:'🛠',label:'Worker',email:'worker1.connected@sanpaid.demo',role:'WORKER',target:'connected',persona:'WORKER_A',help:'Review eligible opportunities and choose Accept or Decline.'},
    COOPERATIVE_ADMIN:{icon:'🏢',label:'Cooperative Admin',email:'admin.connected@sanpaid.demo',role:'COOPERATIVE_ADMIN',target:'judge',persona:null,help:'Manage workforce, SLA, matching and cooperative operations.'},
    FEDERATION_ADMIN:{icon:'🌐',label:'Federation Admin',email:'federation.connected@sanpaid.demo',role:'FEDERATION_ADMIN',target:'judge',persona:null,help:'Review regional governance and cross-cooperative capacity.'}
  };
  const DEMO_PASSWORD='Demo@2026';
  const CONNECTED_TOKEN_KEY='sanpaid_connected_demo_token_v1';
  const JUDGE_TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const WORKSPACE_KEY='sanpaid_active_workspace_v2';
  const PREFILL_SERVICE_KEY='sanpaid_prefill_service_v1';
  const PREFILL_AREA_KEY='sanpaid_prefill_area_v1';
  const state={user:null,checking:false,checked:false,requestedRole:'CUSTOMER',requestedPersona:'CUSTOMER',mode:'login',lastFocus:null,restorePromise:null,resuming:false};
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function storageGet(key){try{return sessionStorage.getItem(key)||''}catch{return''}}
  function storageSet(key,value){try{value?sessionStorage.setItem(key,value):sessionStorage.removeItem(key)}catch{}}
  function saveConnectedToken(token){storageSet(CONNECTED_TOKEN_KEY,token||'')}
  function saveJudgeToken(token){storageSet(JUDGE_TOKEN_KEY,token||'')}
  function readConnectedToken(){return storageGet(CONNECTED_TOKEN_KEY)}
  function readJudgeToken(){return storageGet(JUDGE_TOKEN_KEY)}
  function clearTokens(){saveConnectedToken('');saveJudgeToken('')}
  function saveWorkspace(role,persona,target){try{sessionStorage.setItem(WORKSPACE_KEY,JSON.stringify({role,persona:persona||null,target,active:true,at:Date.now()}))}catch{}}
  function readWorkspace(){try{return JSON.parse(sessionStorage.getItem(WORKSPACE_KEY)||'null')}catch{return null}}
  function clearWorkspace(){try{sessionStorage.removeItem(WORKSPACE_KEY)}catch{}}

  async function jsonFetch(path,opt={}){
    const r=await fetch(path,{cache:'no-store',credentials:'include',...opt,headers:{...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})}});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(data.message||data.error||'Authentication request failed.');e.status=r.status;e.data=data;throw e;}
    return data;
  }
  const post=(path,body={})=>jsonFetch(path,{method:'POST',body:JSON.stringify(body)});

  function roleKeyFromUser(u){
    if(!u)return null;
    const role=String(u.role||'').toUpperCase();
    if(role==='ADMIN')return 'COOPERATIVE_ADMIN';
    return ROLE_META[role]?role:null;
  }
  function toast(message){
    $('.spu-toast')?.remove();
    const n=document.createElement('div');n.className='spu-toast';n.setAttribute('role','status');n.textContent=message;document.body.appendChild(n);setTimeout(()=>n.remove(),2600);
  }

  async function meWithToken(token){
    if(!token)return null;
    try{return (await jsonFetch('/api/connected/auth/me',{credentials:'omit',headers:{Authorization:`Bearer ${token}`}})).user||null}catch{return null}
  }

  async function ensureAdminBridge(){
    const key=roleKeyFromUser(state.user);
    if(!['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(key))return '';
    const existing=readJudgeToken();if(existing)return existing;
    try{const bridged=await post('/api/auth/session-bridge',{});if(bridged?.demoToken){saveJudgeToken(bridged.demoToken);return bridged.demoToken;}}catch{}
    return '';
  }

  async function restoreSession(force=false){
    if(state.user&&!force)return state.user;
    if(state.restorePromise&&!force)return state.restorePromise;
    state.checking=true;
    state.restorePromise=(async()=>{
      let user=null;
      try{user=(await jsonFetch('/api/auth/me')).user||null;}catch(e){
        if(e.status!==401&&e.status!==403)console.warn('[auth restore cookie]',e?.message||e);
      }
      if(!user){
        user=await meWithToken(readConnectedToken());
        if(!user)user=await meWithToken(readJudgeToken());
      }
      state.user=user;
      state.checked=true;
      if(user){
        const role=roleKeyFromUser(user);
        if(['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(role))await ensureAdminBridge();
      }else{
        clearTokens();clearWorkspace();
      }
      return user;
    })();
    try{return await state.restorePromise;}finally{state.restorePromise=null;state.checking=false;updateAccessUI();}
  }

  async function login({identifier,password,role,remember=false}){
    if(state.user&&roleKeyFromUser(state.user)!==role)await logout({silent:true,keepModal:true});
    const result=await post('/api/auth/login',{identifier,password,role,remember});
    state.user=result.user||null;state.checked=true;
    if(result.demoToken){
      if(['CUSTOMER','WORKER'].includes(role)){saveConnectedToken(result.demoToken);saveJudgeToken('');}
      else if(['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(role)){saveJudgeToken(result.demoToken);saveConnectedToken('');}
    }
    updateAccessUI();
    return state.user;
  }

  async function logout({silent=false,keepModal=false}={}){
    try{await post('/api/auth/logout',{});}catch{}
    clearTokens();clearWorkspace();state.user=null;state.checked=true;
    try{window.ConnectedSanPaid?.close?.();}catch{}
    try{window.SanPaidJudgeMode?.close?.();}catch{}
    updateAccessUI();
    if(!keepModal)closeAuth();
    if(!silent)toast('You are logged out.');
  }

  async function waitForWorkspace(kind,attempts=60){
    for(let i=0;i<attempts;i++){
      if(kind==='connected'&&window.ConnectedSanPaid?.open)return true;
      if(kind==='judge'&&window.SanPaidJudgeMode?.open)return true;
      await sleep(80);
    }
    return false;
  }

  async function applyConnectedPrefill(){
    const service=storageGet(PREFILL_SERVICE_KEY),area=storageGet(PREFILL_AREA_KEY);
    if(!service&&!area)return;
    for(let i=0;i<30;i++){
      const select=$('#cdService'),zone=$('#cdZone');
      if(select&&service){const option=[...select.options].find(o=>o.value===service||o.textContent===service);if(option){select.value=option.value;storageSet(PREFILL_SERVICE_KEY,'');}}
      if(zone&&area){zone.value=area;storageSet(PREFILL_AREA_KEY,'');}
      if((!service||!storageGet(PREFILL_SERVICE_KEY))&&(!area||!storageGet(PREFILL_AREA_KEY)))break;
      await sleep(100);
    }
  }

  async function openRoleWorkspace(roleKey=roleKeyFromUser(state.user),persona=null){
    const meta=ROLE_META[roleKey];
    if(!meta){openAuth('CUSTOMER','login');return false;}
    const u=await restoreSession();
    if(!u){clearWorkspace();openAuth(roleKey,'login',persona||meta.persona);return false;}
    const actual=roleKeyFromUser(u);
    if(actual!==roleKey){clearWorkspace();openAuth(roleKey,'login',persona||meta.persona);return false;}

    if(meta.target==='judge'){
      await ensureAdminBridge();
      if(!await waitForWorkspace('judge')){toast('Admin workspace is still loading. Please retry.');return false;}
      saveWorkspace(roleKey,null,'judge');
      window.SanPaidJudgeMode.open();
      return true;
    }

    if(!await waitForWorkspace('connected')){toast('Customer/Worker workspace is still loading. Please retry.');return false;}
    saveWorkspace(roleKey,persona||meta.persona,'connected');
    await window.ConnectedSanPaid.open(persona||meta.persona);
    applyConnectedPrefill();
    return true;
  }

  function root(){
    let r=$('#sanpaidUnifiedAuthRoot');if(r)return r;
    r=document.createElement('div');r.id='sanpaidUnifiedAuthRoot';r.className='spu-root';r.hidden=true;
    r.innerHTML=`<div class="spu-shell" role="dialog" aria-modal="true" aria-labelledby="spuTitle"><aside class="spu-brand"><div class="spu-logo">San<span>Paid</span></div><h2>One login.<br>One governed network.</h2><p>Authenticate once and return to the same authorized workspace after a normal refresh.</p><div class="spu-principles"><span>Role-Based</span><span>Session Restored</span><span>Auditable</span></div><div class="spu-proof">Connected SIH demo identities use isolated backend data. Privileged roles remain authorization-controlled.</div></aside><main class="spu-main"><button class="spu-close" type="button" aria-label="Close authentication">✕</button><div class="spu-tabs" role="tablist"><button class="spu-tab active" data-spu-mode="login" role="tab">Login</button><button class="spu-tab" data-spu-mode="signup" role="tab">Signup Preview</button></div><div id="spuContent"></div></main></div>`;
    document.body.appendChild(r);
    $('.spu-close',r).onclick=closeAuth;
    r.addEventListener('mousedown',e=>{if(e.target===r)closeAuth();});
    r.addEventListener('keydown',trapFocus);
    $$('[data-spu-mode]',r).forEach(b=>b.onclick=()=>{state.mode=b.dataset.spuMode==='signup'?'signup':'login';render();});
    return r;
  }

  function roleGrid(){return `<div class="spu-role-grid" role="group" aria-label="Choose role">${Object.entries(ROLE_META).map(([key,m])=>`<button type="button" class="spu-role ${state.requestedRole===key?'active':''}" data-spu-role="${key}"><span>${m.icon}</span><b>${m.label}</b></button>`).join('')}</div>`;}
  function wireRoleGrid(){$$('[data-spu-role]',root()).forEach(b=>b.onclick=()=>{state.requestedRole=b.dataset.spuRole;state.requestedPersona=ROLE_META[state.requestedRole]?.persona||null;render();});}
  function renderChecking(){const c=$('#spuContent',root());c.innerHTML=`<h2 id="spuTitle">Checking session…</h2><p class="spu-sub">Restoring your authorized SanPaid session.</p><div class="spu-checking"><span class="spu-spinner"></span><b>CHECKING SESSION</b></div>`;}

  function renderCurrent(){
    const key=roleKeyFromUser(state.user),meta=ROLE_META[key]||ROLE_META.CUSTOMER,c=$('#spuContent',root());
    c.innerHTML=`<h2 id="spuTitle">Welcome back</h2><p class="spu-sub">Your valid session is still active.</p><div class="spu-current"><div class="spu-current-top"><span class="spu-current-role">${esc(meta.label)}</span><span class="spu-demo-pill">SESSION RESTORED</span></div><h3>${esc(state.user?.fullName||state.user?.email||'SanPaid user')}</h3><p>${esc(state.user?.email||'')}</p><div class="spu-current-actions"><button class="spu-primary" id="spuContinue" type="button">Continue to ${esc(meta.label)}</button><button class="spu-secondary" id="spuSwitch" type="button">Switch Role</button><button class="spu-secondary spu-danger" id="spuLogout" type="button">Logout</button></div></div>`;
    $('#spuContinue').onclick=()=>{closeAuth();openRoleWorkspace(key,meta.persona);};
    $('#spuSwitch').onclick=async()=>{await logout({silent:true,keepModal:true});state.requestedRole='CUSTOMER';state.mode='login';render();};
    $('#spuLogout').onclick=()=>logout();
  }

  function loginError(e){if(e.status===401)return 'Email, password or selected role did not match.';if(e.status===403)return 'This role is not authorized for this account.';if(e.status===429)return 'Too many attempts. Please wait and retry.';return 'Authentication is temporarily unavailable. Please retry.';}

  function renderLogin(){
    if(state.user)return renderCurrent();
    const meta=ROLE_META[state.requestedRole]||ROLE_META.CUSTOMER,c=$('#spuContent',root());
    c.innerHTML=`<span class="spu-demo-pill">SIH Demo Identity</span><h2 id="spuTitle">Access SanPaid</h2><p class="spu-sub">Choose the correct role and sign in once.</p>${roleGrid()}<form id="spuLoginForm" class="spu-form"><div class="spu-field"><label for="spuEmail">Email</label><input id="spuEmail" type="email" autocomplete="username" value="${esc(meta.email)}" required></div><div class="spu-field spu-password"><label for="spuPassword">Password</label><input id="spuPassword" type="password" autocomplete="current-password" value="${DEMO_PASSWORD}" required><button class="spu-show" id="spuShowPassword" type="button">Show</button></div><label class="spu-remember"><input id="spuRemember" type="checkbox"><span>Remember this device</span></label><div id="spuLoginMessage" aria-live="polite"></div><button class="spu-primary" id="spuLoginSubmit" type="submit">CONTINUE</button></form><div class="spu-helper"><b>${esc(meta.label)}:</b> ${esc(meta.help)}</div>`;
    wireRoleGrid();
    const pw=$('#spuPassword');$('#spuShowPassword').onclick=()=>{const show=pw.type==='password';pw.type=show?'text':'password';$('#spuShowPassword').textContent=show?'Hide':'Show';};
    $('#spuLoginForm').onsubmit=async e=>{e.preventDefault();const btn=$('#spuLoginSubmit'),msg=$('#spuLoginMessage');btn.disabled=true;btn.textContent='SIGNING IN…';msg.innerHTML='';try{await login({identifier:$('#spuEmail').value.trim(),password:pw.value,role:meta.role,remember:$('#spuRemember').checked});closeAuth();toast(`${meta.label} session opened.`);await openRoleWorkspace(meta.role,state.requestedPersona||meta.persona);}catch(err){msg.innerHTML=`<div class="spu-error">${esc(loginError(err))}</div>`;}finally{btn.disabled=false;btn.textContent='CONTINUE';}};
  }

  function renderSignup(){
    const meta=ROLE_META[state.requestedRole]||ROLE_META.CUSTOMER,c=$('#spuContent',root());
    c.innerHTML=`<span class="spu-demo-pill">Onboarding Preview</span><h2 id="spuTitle">${esc(meta.label)} onboarding</h2><p class="spu-sub">This public SIH screen does not create or auto-approve a privileged production account.</p>${roleGrid()}<div class="spu-status-card"><small>Selected role</small><b>${esc(meta.label)}</b></div><div class="spu-note">${state.requestedRole==='WORKER'?'Worker identity, documents and skills require cooperative verification before a verified badge is granted.':state.requestedRole==='CUSTOMER'?'Customer production signup is separate from this evaluator preview.':'Administrative access requires authorized organizational verification.'}</div><button class="spu-primary" id="spuSignupLogin" type="button">GO TO LOGIN</button>`;
    wireRoleGrid();$('#spuSignupLogin').onclick=()=>{state.mode='login';render();};
  }

  function render(){if(state.checking)return renderChecking();state.mode==='signup'?renderSignup():renderLogin();$$('[data-spu-mode]',root()).forEach(b=>b.classList.toggle('active',b.dataset.spuMode===state.mode));}

  async function openAuth(role='CUSTOMER',mode='login',persona=null){
    if(ROLE_META[role])state.requestedRole=role;state.requestedPersona=persona||ROLE_META[state.requestedRole]?.persona||null;state.mode=mode==='signup'?'signup':'login';state.lastFocus=document.activeElement;
    const r=root();r.hidden=false;document.body.style.overflow='hidden';renderChecking();await restoreSession();render();setTimeout(()=>$('.spu-close',r)?.focus(),0);
  }
  function closeAuth(){const r=root();r.hidden=true;document.body.style.overflow='';if(state.lastFocus?.isConnected)state.lastFocus.focus();state.lastFocus=null;}
  function trapFocus(e){if(e.key==='Escape'){closeAuth();return;}if(e.key!=='Tab')return;const nodes=$$('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',root()).filter(n=>n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}

  function roleFromTrigger(t){
    if(t.closest?.('#coopLogin,#sihJudgeModeBtn,#judgeModeStatusBtn'))return ['COOPERATIVE_ADMIN',null];
    const judgeRole=t.closest?.('[data-judge-role]')?.dataset?.judgeRole;if(judgeRole==='FEDERATION_ADMIN')return ['FEDERATION_ADMIN',null];if(judgeRole==='COOPERATIVE_ADMIN')return ['COOPERATIVE_ADMIN',null];
    const source=t.closest?.('[data-open-connected],[data-eval-connected-persona],[data-open-connected-role],[data-connected-persona]');
    const persona=source?.dataset?.openConnected||source?.dataset?.evalConnectedPersona||source?.dataset?.openConnectedRole||source?.dataset?.connectedPersona;
    if(persona==='CUSTOMER')return ['CUSTOMER','CUSTOMER'];if(persona==='WORKER_A'||persona==='WORKER_B')return ['WORKER',persona];
    if(t.closest?.('#connectedDemoBtn,[data-eval-open-connected],#evalFinalPrototype'))return ['CUSTOMER','CUSTOMER'];
    return null;
  }

  function installCaptureGuards(){
    document.addEventListener('click',async e=>{
      const t=e.target;
      if(t.closest?.('#connectedClose,.close-connected,#judgeClose,[data-judge-close]')){clearWorkspace();return;}
      if(t.closest?.('#connectedLogout,#judgeLogout,#logoutBtn')){e.preventDefault();e.stopImmediatePropagation();await logout();return;}
      if(t.closest?.('#connectedSwitch')){e.preventDefault();e.stopImmediatePropagation();await logout({silent:true});openAuth('CUSTOMER','login');return;}
      if(t.closest?.('#getStarted,#spMobileAccess')){e.preventDefault();e.stopImmediatePropagation();openAuth(roleKeyFromUser(state.user)||'CUSTOMER','login');return;}
      const req=roleFromTrigger(t);if(!req)return;
      e.preventDefault();e.stopImmediatePropagation();const [role,persona]=req;const u=await restoreSession();if(u&&roleKeyFromUser(u)===role)openRoleWorkspace(role,persona);else openAuth(role,'login',persona);
    },true);
  }

  function updateAccessUI(){const key=roleKeyFromUser(state.user),meta=ROLE_META[key];const b=$('#getStarted');if(b)b.textContent=meta?`CONTINUE · ${meta.label.toUpperCase()}`:'ACCESS ROLES';}

  async function resumeWorkspace(){
    if(state.resuming)return;const intent=readWorkspace();if(!intent?.active)return;
    const u=state.user||await restoreSession();if(!u)return;
    const role=roleKeyFromUser(u);if(role!==intent.role){clearWorkspace();return;}
    state.resuming=true;try{await sleep(120);await openRoleWorkspace(role,intent.persona||ROLE_META[role]?.persona||null);}finally{state.resuming=false;}
  }

  function publish(){
    window.SanPaidAuth={login,logout,restoreSession,isAuthenticated:()=>!!state.user,getCurrentUser:()=>state.user,getRole:()=>roleKeyFromUser(state.user),openRoleWorkspace,switchRole:async role=>{await logout({silent:true});openAuth(role||'CUSTOMER','login');},handleExpiredSession:async()=>{state.user=null;clearTokens();clearWorkspace();updateAccessUI();openAuth(state.requestedRole||'CUSTOMER','login');},open:openAuth,close:closeAuth,clearWorkspace};
    window.SanPaidAccess={open:openAuth,close:closeAuth};
  }

  async function start(){root();publish();installCaptureGuards();updateAccessUI();await restoreSession();await resumeWorkspace();[400,1000,2200].forEach(ms=>setTimeout(()=>{publish();updateAccessUI();},ms));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();