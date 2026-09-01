(() => {
  'use strict';

  const ROLE_META={
    CUSTOMER:{icon:'👤',label:'Customer',email:'customer.connected@sanpaid.demo',role:'CUSTOMER',target:'connected',persona:'CUSTOMER',help:'Request and track verified local services.'},
    WORKER:{icon:'🛠',label:'Worker',email:'worker1.connected@sanpaid.demo',role:'WORKER',target:'connected',persona:'WORKER_A',help:'Review eligible opportunities and choose Accept or Decline.'},
    COOPERATIVE_ADMIN:{icon:'🏢',label:'Cooperative Admin',email:'admin.connected@sanpaid.demo',role:'COOPERATIVE_ADMIN',target:'judge',help:'Manage workforce, SLA, matching and cooperative operations.'},
    FEDERATION_ADMIN:{icon:'🌐',label:'Federation Admin',email:'federation.connected@sanpaid.demo',role:'FEDERATION_ADMIN',target:'judge',help:'Review regional governance and cross-cooperative capacity.'}
  };
  const DEMO_PASSWORD='Demo@2026';
  const JUDGE_TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const state={user:null,checking:false,checked:false,token:'',requestedRole:'CUSTOMER',requestedPersona:'CUSTOMER',mode:'login',signupStep:1,draft:{},lastFocus:null,restorePromise:null};
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

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
  function userLabel(u){return u?.fullName||u?.email||'SanPaid user';}
  function toast(message){
    $('.spu-toast')?.remove();
    const n=document.createElement('div');n.className='spu-toast';n.setAttribute('role','status');n.textContent=message;document.body.appendChild(n);setTimeout(()=>n.remove(),2600);
  }
  function saveJudgeToken(token){state.token=token||'';try{token?sessionStorage.setItem(JUDGE_TOKEN_KEY,token):sessionStorage.removeItem(JUDGE_TOKEN_KEY);}catch{}}
  function readJudgeToken(){try{return sessionStorage.getItem(JUDGE_TOKEN_KEY)||''}catch{return ''}}

  async function ensureAdminBridge(){
    const key=roleKeyFromUser(state.user);
    if(!['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(key))return '';
    const existing=readJudgeToken();
    if(existing){state.token=existing;return existing;}
    try{
      const bridged=await post('/api/auth/session-bridge',{});
      if(bridged?.demoToken){saveJudgeToken(bridged.demoToken);return bridged.demoToken;}
    }catch{}
    return '';
  }

  async function restoreSession(force=false){
    if(state.restorePromise&&!force)return state.restorePromise;
    state.checking=true;
    state.restorePromise=(async()=>{
      try{
        const data=await jsonFetch('/api/auth/me');
        state.user=data.user||null;
        state.checked=true;
        if(state.user)await ensureAdminBridge();
        return state.user;
      }catch(e){
        if(e.status===401||e.status===403){state.user=null;saveJudgeToken('');}
        state.checked=true;
        return null;
      }finally{
        state.checking=false;
        updateAccessUI();
      }
    })();
    try{return await state.restorePromise;}finally{state.restorePromise=null;}
  }

  async function login({identifier,password,role,remember=false}){
    if(state.user&&String(state.user.role||'').toUpperCase()!==role){await logout({silent:true,keepModal:true});}
    const result=await post('/api/auth/login',{identifier,password,role,remember});
    state.user=result.user||null;
    if(result.demoToken&&['COOPERATIVE_ADMIN','FEDERATION_ADMIN'].includes(role))saveJudgeToken(result.demoToken);
    state.checked=true;
    updateAccessUI();
    return state.user;
  }

  async function logout({silent=false,keepModal=false}={}){
    try{await post('/api/auth/logout',{});}catch{}
    saveJudgeToken('');
    state.user=null;state.checked=true;state.draft={};
    try{window.ConnectedSanPaid?.close?.();}catch{}
    try{window.SanPaidJudgeMode?.close?.();}catch{}
    updateAccessUI();
    if(!keepModal)closeAuth();
    if(!silent)toast('Session cleared. You are logged out.');
  }

  async function waitForWorkspace(kind,attempts=35){
    for(let i=0;i<attempts;i++){
      if(kind==='connected'&&window.ConnectedSanPaid?.open)return true;
      if(kind==='judge'&&window.SanPaidJudgeMode?.open)return true;
      await sleep(80);
    }
    return false;
  }

  async function openRoleWorkspace(roleKey=roleKeyFromUser(state.user),persona=null){
    const meta=ROLE_META[roleKey];
    if(!meta){openAuth('CUSTOMER','login');return false;}
    const u=await restoreSession();
    if(!u){openAuth(roleKey,'login',persona||meta.persona);return false;}
    const actual=roleKeyFromUser(u);
    if(actual!==roleKey){openAuth(roleKey,'login',persona||meta.persona);return false;}
    if(meta.target==='judge'){
      await ensureAdminBridge();
      if(!await waitForWorkspace('judge')){toast('Admin workspace is still loading. Please retry.');return false;}
      window.SanPaidJudgeMode.open();
      return true;
    }
    if(!await waitForWorkspace('connected')){toast('Connected workspace is still loading. Please retry.');return false;}
    window.ConnectedSanPaid.open(persona||meta.persona);
    return true;
  }

  function root(){
    let r=$('#sanpaidUnifiedAuthRoot');if(r)return r;
    r=document.createElement('div');r.id='sanpaidUnifiedAuthRoot';r.className='spu-root';r.hidden=true;
    r.innerHTML=`<div class="spu-shell" role="dialog" aria-modal="true" aria-labelledby="spuTitle">
      <aside class="spu-brand"><div class="spu-logo">San<span>Paid</span></div><h2>One login.<br>One governed network.</h2><p>Authenticate once, restore the same session, and open the correct role workspace without another password prompt.</p><div class="spu-principles"><span>Rules First</span><span>Role-Based Access</span><span>Auditable</span></div><div class="spu-flow" aria-hidden="true"><div><i>1</i>Authenticate once</div><div><i>2</i>Detect authorized role</div><div><i>3</i>Restore valid session</div><div><i>4</i>Open correct workspace</div></div><div class="spu-proof">SIH demo identities use an isolated backend dataset. Worker verification and admin authorization remain governed; public signup does not auto-approve privileged roles.</div></aside>
      <main class="spu-main"><button class="spu-close" type="button" aria-label="Close authentication">✕</button><div class="spu-tabs" role="tablist"><button class="spu-tab active" data-spu-mode="login" role="tab">Login</button><button class="spu-tab" data-spu-mode="signup" role="tab">Signup Preview</button></div><div id="spuContent"></div></main>
    </div>`;
    document.body.appendChild(r);
    $('.spu-close',r).onclick=closeAuth;
    r.addEventListener('mousedown',e=>{if(e.target===r)closeAuth();});
    r.addEventListener('keydown',trapFocus);
    $$('[data-spu-mode]',r).forEach(b=>b.onclick=()=>setMode(b.dataset.spuMode));
    return r;
  }

  function roleGrid(){return `<div class="spu-role-grid" role="group" aria-label="Choose role">${Object.entries(ROLE_META).map(([k,m])=>`<button type="button" class="spu-role ${state.requestedRole===k?'active':''}" data-spu-role="${k}"><span>${m.icon}</span><b>${m.label}</b></button>`).join('')}</div>`;}

  function renderChecking(){const c=$('#spuContent',root());c.innerHTML=`<h2 id="spuTitle">Checking session…</h2><p class="spu-sub">Verifying whether a valid SanPaid session already exists.</p><div class="spu-checking"><span class="spu-spinner"></span><b>CHECKING SESSION</b></div>`;}

  function renderCurrent(){
    const key=roleKeyFromUser(state.user),meta=ROLE_META[key]||ROLE_META.CUSTOMER,c=$('#spuContent',root());
    c.innerHTML=`<h2 id="spuTitle">Welcome back</h2><p class="spu-sub">Your valid session was restored. No second login is required.</p><div class="spu-current"><div class="spu-current-top"><span class="spu-current-role">${esc(meta.label)}</span><span class="spu-demo-pill">SIH Demo Identity</span></div><h3>${esc(userLabel(state.user))}</h3><p>${esc(state.user?.email||'')}</p><div class="spu-current-actions"><button class="spu-primary" id="spuContinue" type="button">Continue to ${esc(meta.label)}</button><button class="spu-secondary" id="spuSwitch" type="button">Switch Role</button><button class="spu-secondary spu-danger" id="spuLogout" type="button">Logout</button></div></div><div class="spu-helper">Authenticated session restored from the backend. Protected role permissions are still enforced server-side.</div>`;
    $('#spuContinue').onclick=()=>{closeAuth();openRoleWorkspace(key,meta.persona);};
    $('#spuSwitch').onclick=async()=>{await logout({silent:true,keepModal:true});state.requestedRole='CUSTOMER';renderLogin();};
    $('#spuLogout').onclick=()=>logout();
  }

  function loginError(e){
    if(e.status===401)return 'Email, password or selected role did not match.';
    if(e.status===403)return 'This role is not authorized for this account.';
    if(e.status===409)return 'The account state changed. Please retry.';
    if(e.status===429)return 'Too many attempts. Please wait a moment and retry.';
    return 'Authentication is temporarily unavailable. Please retry.';
  }

  function renderLogin(){
    const meta=ROLE_META[state.requestedRole]||ROLE_META.CUSTOMER,c=$('#spuContent',root());
    c.innerHTML=`<span class="spu-demo-pill">SIH Demo Identity</span><h2 id="spuTitle">Welcome to SanPaid</h2><p class="spu-sub">Access your governed service network. Login once; the same valid session opens the correct workspace.</p>${roleGrid()}<form id="spuLoginForm" class="spu-form"><div class="spu-field"><label for="spuEmail">Email</label><input id="spuEmail" type="email" autocomplete="username" value="${esc(meta.email)}" required></div><div class="spu-field spu-password"><label for="spuPassword">Password</label><input id="spuPassword" type="password" autocomplete="current-password" value="${DEMO_PASSWORD}" required><button class="spu-show" id="spuShowPassword" type="button">Show</button><span class="spu-caps" id="spuCaps" aria-live="polite"></span></div><label class="spu-remember"><input id="spuRemember" type="checkbox"><span>Remember this device</span></label><div id="spuLoginMessage" aria-live="polite"></div><button class="spu-primary" id="spuLoginSubmit" type="submit">CONTINUE</button></form><div class="spu-secondary-row"><button class="spu-link" id="spuForgot" type="button">Forgot Password</button><span class="spu-sub" style="margin:0">Protected role-based access</span></div><div class="spu-helper"><b>${esc(meta.label)}:</b> ${esc(meta.help)}</div>`;
    wireRoles();
    const pw=$('#spuPassword');$('#spuShowPassword').onclick=()=>{const show=pw.type==='password';pw.type=show?'text':'password';$('#spuShowPassword').textContent=show?'Hide':'Show';};
    pw.addEventListener('keyup',e=>{$('#spuCaps').textContent=e.getModifierState?.('CapsLock')?'Caps Lock is on.':'';});
    $('#spuForgot').onclick=()=>{$('#spuLoginMessage').innerHTML='<div class="spu-note">Password recovery is not enabled for isolated SIH demo identities. Use the documented demo credential.</div>';};
    $('#spuLoginForm').onsubmit=submitLogin;
  }

  async function submitLogin(e){
    e.preventDefault();const btn=$('#spuLoginSubmit'),msg=$('#spuLoginMessage'),meta=ROLE_META[state.requestedRole];
    if(btn.disabled)return;msg.innerHTML='';btn.disabled=true;btn.textContent='SIGNING IN…';
    try{
      await login({identifier:$('#spuEmail').value.trim(),password:$('#spuPassword').value,role:meta.role,remember:$('#spuRemember').checked});
      closeAuth();toast(`${meta.label} session opened.`);await openRoleWorkspace(state.requestedRole,state.requestedPersona||meta.persona);
    }catch(err){msg.innerHTML=`<div class="spu-error">${esc(loginError(err))}</div>`;}
    finally{btn.disabled=false;btn.textContent='CONTINUE';}
  }

  function signupStatus(){
    if(state.requestedRole==='WORKER')return ['Verification Pending','Worker skills and documents require Cooperative/Admin verification before a verified badge is granted.'];
    if(state.requestedRole==='COOPERATIVE_ADMIN')return ['Admin Verification Required','Public signup never grants Cooperative Admin authority automatically.'];
    if(state.requestedRole==='FEDERATION_ADMIN')return ['Authorized Verification Required','Federation access requires verified organizational authorization.'];
    return ['Profile Preview','Customer onboarding preview remains separate from production account creation.'];
  }

  function renderSignup(){
    const c=$('#spuContent',root()),step=state.signupStep,meta=ROLE_META[state.requestedRole];
    if(step===4){const [status,desc]=signupStatus();c.innerHTML=`<span class="spu-demo-pill">Signup / Onboarding Preview</span><h2 id="spuTitle">Preview complete</h2><p class="spu-sub">No production account was created and no privileged role was auto-approved.</p><div class="spu-success"><b>${esc(status)}</b><br>${esc(desc)}</div><div class="spu-helper">No personal data entered in this preview is submitted or stored by this public evaluator UI.</div><button class="spu-primary" id="spuBackLogin" type="button">BACK TO LOGIN</button>`;$('#spuBackLogin').onclick=()=>setMode('login');return;}
    const steps=`<div class="spu-steps"><span class="spu-step ${step>=1?'done':''}"></span><span class="spu-step ${step>=2?'done':''}"></span><span class="spu-step ${step>=3?'done':''}"></span></div>`;
    let body='';
    if(step===1)body=`${roleGrid()}<div class="spu-status-card"><small>Selected role</small><b>${esc(meta.label)}</b></div>`;
    if(step===2)body=`<div class="spu-row"><div class="spu-field"><label for="spuName">Full Name</label><input id="spuName" required value="${esc(state.draft.fullName||'')}" placeholder="Your name"></div><div class="spu-field"><label for="spuSignupEmail">Email</label><input id="spuSignupEmail" type="email" required value="${esc(state.draft.email||'')}" placeholder="name@example.com"></div></div><div class="spu-field"><label for="spuMobile">Mobile</label><input id="spuMobile" inputmode="tel" required value="${esc(state.draft.mobile||'')}" placeholder="10-digit mobile number"></div><div class="spu-row"><div class="spu-field"><label for="spuNewPassword">Password</label><input id="spuNewPassword" type="password" minlength="8" required value="${esc(state.draft.password||'')}"><div class="spu-meter"><i id="spuMeter"></i></div><span class="spu-meter-label" id="spuMeterLabel">Use 8+ characters with mixed character types.</span></div><div class="spu-field"><label for="spuConfirm">Confirm Password</label><input id="spuConfirm" type="password" minlength="8" required value="${esc(state.draft.confirm||'')}"></div></div>`;
    if(step===3){
      if(state.requestedRole==='WORKER')body=`<div class="spu-row"><div class="spu-field"><label>Primary Service / Skill</label><select id="spuSkill"><option>Electrician</option><option>Plumber</option><option>Cleaner</option><option>Carpenter</option></select></div><div class="spu-field"><label>Experience</label><input id="spuExperience" placeholder="e.g. 2 years"></div></div><div class="spu-field"><label>Service Area</label><input id="spuArea" placeholder="e.g. Karad Zone 1"></div><div class="spu-field"><label>Cooperative</label><input id="spuOrg" placeholder="Cooperative / Society name"></div><div class="spu-row"><div class="spu-status-card"><small>Documents</small><b>Upload placeholder · Verification required</b></div><div class="spu-status-card"><small>Certificate</small><b>Upload placeholder · Verification required</b></div></div><div class="spu-note"><b>Worker status:</b> Verification Pending. Signup never grants VERIFIED automatically.</div>`;
      else if(state.requestedRole==='COOPERATIVE_ADMIN'||state.requestedRole==='FEDERATION_ADMIN')body=`<div class="spu-field"><label>${state.requestedRole==='COOPERATIVE_ADMIN'?'Organization Name':'Federation / Organization Name'}</label><input id="spuOrg" required placeholder="Authorized organization name"></div><div class="spu-row"><div class="spu-field"><label>Registration / Authorization Info</label><input id="spuReg" required placeholder="Reference / registration details"></div><div class="spu-field"><label>Contact</label><input id="spuContact" required placeholder="Official contact"></div></div><div class="spu-field"><label>Location</label><input id="spuArea" required placeholder="City / operating area"></div><div class="spu-note"><b>${state.requestedRole==='COOPERATIVE_ADMIN'?'ADMIN VERIFICATION REQUIRED':'AUTHORIZED VERIFICATION REQUIRED'}</b><br>Public signup never auto-approves an administrative role.</div>`;
      else body=`<div class="spu-row"><div class="spu-field"><label>Location</label><input id="spuArea" required placeholder="Preferred service area"></div><div class="spu-field"><label>Preferred Language</label><select id="spuLanguage"><option>Marathi</option><option>Hindi</option><option>English</option></select></div></div><div class="spu-note">Customer signup shown here is an onboarding preview, not a production account-creation claim.</div>`;
    }
    c.innerHTML=`<span class="spu-demo-pill">Signup / Onboarding Preview</span><h2 id="spuTitle">${step===1?'Choose your role':step===2?'Basic information':'Verification context'}</h2><p class="spu-sub">Step ${step} of 3 · This public SIH experience demonstrates verification-first onboarding without fabricating production registration.</p>${steps}<form id="spuSignupForm" class="spu-form">${body}<div id="spuSignupMessage" aria-live="polite"></div><button class="spu-primary" type="submit">${step===3?'COMPLETE PREVIEW':'CONTINUE'}</button></form><div class="spu-secondary-row"><button class="spu-link" id="spuSignupBack" type="button">${step===1?'Back to Login':'Back'}</button><span class="spu-sub" style="margin:0">${esc(meta.label)}</span></div>`;
    wireRoles();
    if(step===2){const p=$('#spuNewPassword');p.addEventListener('input',updateMeter);updateMeter({target:p});}
    $('#spuSignupBack').onclick=()=>{if(step===1)setMode('login');else{state.signupStep--;renderSignup();}};
    $('#spuSignupForm').onsubmit=submitSignupStep;
  }

  function updateMeter(e){const v=e.target.value||'';let score=0;if(v.length>=8)score++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))score++;if(/\d/.test(v))score++;if(/[^A-Za-z0-9]/.test(v))score++;const meter=$('#spuMeter'),label=$('#spuMeterLabel');if(meter){meter.style.width=`${score*25}%`;meter.style.background=score<2?'#b74343':score<4?'#b97512':'#15805d';}if(label)label.textContent=score<2?'Weak password':score<4?'Medium password':'Strong password';}

  function submitSignupStep(e){
    e.preventDefault();const msg=$('#spuSignupMessage');msg.innerHTML='';
    if(state.signupStep===1){state.signupStep=2;renderSignup();return;}
    if(state.signupStep===2){
      const email=$('#spuSignupEmail').value.trim(),mobile=$('#spuMobile').value.trim(),password=$('#spuNewPassword').value,confirm=$('#spuConfirm').value;
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.innerHTML='<div class="spu-error">Email format is invalid.</div>';return;}
      if(!/^\+?[0-9\s-]{10,15}$/.test(mobile)){msg.innerHTML='<div class="spu-error">Enter a valid mobile number.</div>';return;}
      if(password.length<8){msg.innerHTML='<div class="spu-error">Password must contain at least 8 characters.</div>';return;}
      if(password!==confirm){msg.innerHTML='<div class="spu-error">Password and Confirm Password must match.</div>';return;}
      state.draft={fullName:$('#spuName').value.trim(),email,mobile,password,confirm};state.signupStep=3;renderSignup();return;
    }
    state.signupStep=4;renderSignup();
  }

  function wireRoles(){
    $$('[data-spu-role]',root()).forEach(b=>b.onclick=()=>{state.requestedRole=b.dataset.spuRole;state.requestedPersona=ROLE_META[state.requestedRole].persona||null;if(state.mode==='signup')state.signupStep=1;state.draft={};render();});
  }
  function render(){if(state.checking)return renderChecking();if(state.mode==='login'&&state.user)return renderCurrent();state.mode==='signup'?renderSignup():renderLogin();}
  function setMode(mode){state.mode=mode==='signup'?'signup':'login';state.signupStep=1;state.draft={};$$('[data-spu-mode]',root()).forEach(b=>b.classList.toggle('active',b.dataset.spuMode===state.mode));render();}

  async function openAuth(role='CUSTOMER',mode='login',persona=null){
    if(ROLE_META[role])state.requestedRole=role;state.requestedPersona=persona||ROLE_META[state.requestedRole]?.persona||null;state.mode=mode==='signup'?'signup':'login';state.signupStep=1;state.lastFocus=document.activeElement;const r=root();r.hidden=false;document.body.style.overflow='hidden';renderChecking();await restoreSession();setMode(state.mode);setTimeout(()=>$('.spu-close',r)?.focus(),0);
  }
  function closeAuth(){const r=root();r.hidden=true;document.body.style.overflow='';if(state.lastFocus?.isConnected)state.lastFocus.focus();state.lastFocus=null;}
  function trapFocus(e){if(e.key==='Escape'){closeAuth();return;}if(e.key!=='Tab')return;const nodes=$$('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',root()).filter(n=>n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}

  function roleFromTrigger(t){
    if(t.closest?.('#coopLogin,#sihJudgeModeBtn,#judgeModeStatusBtn'))return ['COOPERATIVE_ADMIN',null];
    const persona=t.closest?.('[data-open-connected],[data-eval-connected-persona],[data-open-connected-role]')?.dataset?.openConnected||t.closest?.('[data-eval-connected-persona]')?.dataset?.evalConnectedPersona||t.closest?.('[data-open-connected-role]')?.dataset?.openConnectedRole;
    if(persona==='CUSTOMER')return ['CUSTOMER','CUSTOMER'];
    if(persona==='WORKER_A'||persona==='WORKER_B')return ['WORKER',persona];
    if(t.closest?.('#connectedDemoBtn'))return ['CUSTOMER','CUSTOMER'];
    const judgeRole=t.closest?.('[data-judge-role]')?.dataset?.judgeRole;if(judgeRole==='FEDERATION_ADMIN')return ['FEDERATION_ADMIN',null];if(judgeRole==='COOPERATIVE_ADMIN')return ['COOPERATIVE_ADMIN',null];
    const connectedRole=t.closest?.('[data-connected-persona]')?.dataset?.connectedPersona;if(connectedRole==='CUSTOMER')return ['CUSTOMER','CUSTOMER'];if(connectedRole==='WORKER_A'||connectedRole==='WORKER_B')return ['WORKER',connectedRole];
    return null;
  }

  function installCaptureGuards(){
    document.addEventListener('click',async e=>{
      const t=e.target;
      const logoutBtn=t.closest?.('#connectedLogout,#judgeLogout');
      if(logoutBtn){e.preventDefault();e.stopImmediatePropagation();await logout();return;}
      const switchBtn=t.closest?.('#connectedSwitch');
      if(switchBtn){e.preventDefault();e.stopImmediatePropagation();await logout({silent:true});openAuth('CUSTOMER','login');return;}
      if(t.closest?.('#getStarted,#spMobileAccess')){e.preventDefault();e.stopImmediatePropagation();openAuth(roleKeyFromUser(state.user)||'CUSTOMER','login');return;}
      const roleReq=roleFromTrigger(t);
      if(roleReq){e.preventDefault();e.stopImmediatePropagation();const [role,persona]=roleReq;const u=await restoreSession();if(u&&roleKeyFromUser(u)===role){openRoleWorkspace(role,persona);}else openAuth(role,'login',persona);}
    },true);
  }

  function updateAccessUI(){
    const key=roleKeyFromUser(state.user),meta=ROLE_META[key];
    const b=$('#getStarted');if(b)b.textContent=meta?`CONTINUE · ${meta.label.toUpperCase()}`:'ACCESS ROLES';
  }

  function publish(){
    window.SanPaidAuth={
      login,logout,restoreSession,isAuthenticated:()=>!!state.user,getCurrentUser:()=>state.user,getRole:()=>roleKeyFromUser(state.user),openRoleWorkspace,switchRole:async role=>{await logout({silent:true});openAuth(role||'CUSTOMER','login');},handleExpiredSession:async()=>{state.user=null;saveJudgeToken('');updateAccessUI();openAuth(state.requestedRole||'CUSTOMER','login');},open:openAuth,close:closeAuth
    };
    window.SanPaidAccess={open:openAuth,close:closeAuth};
  }

  async function start(){
    root();publish();installCaptureGuards();updateAccessUI();restoreSession();
    [300,900,1800].forEach(ms=>setTimeout(()=>{publish();updateAccessUI();},ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();