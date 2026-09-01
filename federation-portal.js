(() => {
  'use strict';

  const TOKEN_KEY='sanpaid_judge_demo_token_v1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let timer=0;
  let returnFocus=null;
  let planningCache=null;
  let planningPromise=null;

  function isFederation(){return !!document.querySelector('#sihJudgeShell.federation-govtech:not(.judge-hidden)');}
  function token(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return ''}}
  async function api(path){
    const headers={};
    const t=token();
    if(t)headers.Authorization=`Bearer ${t}`;
    const r=await fetch(path,{credentials:'include',cache:'no-store',headers});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw Object.assign(new Error(data.message||data.error||`Request failed (${r.status})`),{status:r.status});
    return data;
  }

  function ensureProfile(){
    const actions=$('#sihJudgeShell.federation-govtech .judge-top-actions');
    if(!actions||$('#fedProfileChip',actions))return;
    const user=window.SanPaidAuth?.getCurrentUser?.()||{};
    const name=String(user.full_name||user.fullName||user.name||'Federation Admin');
    const email=String(user.email||'');
    const chip=document.createElement('div');
    chip.id='fedProfileChip';
    chip.className='fed-profile-chip';
    chip.innerHTML=`<span>${esc(name)}</span><small>${email?esc(email):'FEDERATION_ADMIN'}</small>`;
    const close=$('#judgeClose',actions);
    actions.insertBefore(chip,close||null);
  }

  function ensureNavGroups(){
    const nav=$('#fedSidebar nav');
    if(!nav)return;
    const toggle=$('#fedNavToggle');
    if(toggle)toggle.textContent='Federation Menu';
    if(!$('.fed-nav-group.operations',nav)){
      const label=document.createElement('span');
      label.className='fed-nav-group operations';
      label.textContent='Operations';
      nav.insertBefore(label,nav.firstChild);
    }
    const systemAnchor=$('[data-fed-target="fed-health"]',nav);
    if(systemAnchor&&!$('.fed-nav-group.system',nav)){
      const label=document.createElement('span');
      label.className='fed-nav-group system';
      label.textContent='System';
      nav.insertBefore(label,systemAnchor);
    }
  }

  function statusFromRow(row){return String(row.cells?.[4]?.innerText||'').trim().toUpperCase()||'UNKNOWN';}
  function cityFromRow(row){return String(row.cells?.[1]?.innerText||'').trim()||'—';}

  function ensureNetworkToolbar(){
    const host=$('#fedNetworkTable');
    const table=$('table',host);
    if(!host||!table)return;

    let toolbar=$('.fed-network-toolbar',host);
    if(!toolbar){
      toolbar=document.createElement('div');
      toolbar.className='fed-network-toolbar';
      toolbar.innerHTML=`
        <label><span>Search Cooperative</span><input id="fedCoopSearch" type="search" placeholder="Name or city" autocomplete="off"></label>
        <label><span>City / Zone</span><select id="fedCityFilter"><option value="">All locations</option></select></label>
        <label><span>Capacity Status</span><select id="fedStatusFilter"><option value="">All statuses</option></select></label>
        <button type="button" class="btn secondary small" id="fedFilterReset">Reset</button>
        <span id="fedFilterCount" class="fed-filter-count" aria-live="polite"></span>`;
      host.insertBefore(toolbar,host.firstChild);
    }

    const headRow=$('thead tr',table);
    if(headRow&&!headRow.querySelector('[data-fed-action-head]')){
      const th=document.createElement('th');
      th.dataset.fedActionHead='true';
      th.textContent='Action';
      headRow.appendChild(th);
    }

    const rows=$$('tbody tr',table);
    rows.forEach((row,index)=>{
      row.dataset.fedCoopIndex=String(index);
      row.dataset.fedName=String(row.cells?.[0]?.innerText||'').trim().toLowerCase();
      row.dataset.fedCity=cityFromRow(row).toLowerCase();
      row.dataset.fedStatus=statusFromRow(row);
      if(!row.querySelector('[data-fed-coop-view]')){
        const td=document.createElement('td');
        td.innerHTML='<button type="button" class="fed-table-action" data-fed-coop-view>View Details</button>';
        row.appendChild(td);
      }
      const view=row.querySelector('[data-fed-coop-view]');
      if(view&&view.dataset.fedBound!=='1'){
        view.dataset.fedBound='1';
        view.addEventListener('click',e=>openCooperativeDetail(row,e.currentTarget));
      }
    });

    const cities=[...new Set(rows.map(cityFromRow).filter(x=>x&&x!=='—'))].sort((a,b)=>a.localeCompare(b));
    const statuses=[...new Set(rows.map(statusFromRow).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const citySelect=$('#fedCityFilter',toolbar),statusSelect=$('#fedStatusFilter',toolbar);
    const currentCity=citySelect?.value||'',currentStatus=statusSelect?.value||'';
    if(citySelect){citySelect.innerHTML='<option value="">All locations</option>'+cities.map(x=>`<option value="${esc(x.toLowerCase())}">${esc(x)}</option>`).join('');citySelect.value=currentCity;}
    if(statusSelect){statusSelect.innerHTML='<option value="">All statuses</option>'+statuses.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');statusSelect.value=currentStatus;}

    const apply=()=>{
      const q=String($('#fedCoopSearch',toolbar)?.value||'').trim().toLowerCase();
      const city=String(citySelect?.value||'');
      const status=String(statusSelect?.value||'');
      let shown=0;
      rows.forEach(row=>{
        const matchText=!q||row.dataset.fedName.includes(q)||row.dataset.fedCity.includes(q);
        const matchCity=!city||row.dataset.fedCity===city;
        const matchStatus=!status||row.dataset.fedStatus===status;
        const visible=matchText&&matchCity&&matchStatus;
        row.hidden=!visible;
        if(visible)shown+=1;
      });
      const count=$('#fedFilterCount',toolbar);
      if(count)count.textContent=`Showing ${shown} of ${rows.length} cooperatives`;
    };

    if(toolbar.dataset.fedBound!=='1'){
      toolbar.dataset.fedBound='1';
      ['input','change'].forEach(type=>toolbar.addEventListener(type,e=>{if(e.target.matches('input,select'))apply();}));
      $('#fedFilterReset',toolbar)?.addEventListener('click',()=>{const q=$('#fedCoopSearch',toolbar);if(q)q.value='';if(citySelect)citySelect.value='';if(statusSelect)statusSelect.value='';apply();q?.focus();});
    }
    apply();
  }

  function ensureDrawer(){
    let root=$('#fedDetailRoot');
    if(root)return root;
    root=document.createElement('div');
    root.id='fedDetailRoot';
    root.className='fed-detail-root';
    root.hidden=true;
    root.innerHTML=`<div class="fed-detail-backdrop" data-fed-detail-close></div><aside class="fed-detail-panel" role="dialog" aria-modal="true" aria-labelledby="fedDetailTitle"><header><div><span>COOPERATIVE PROFILE</span><h2 id="fedDetailTitle">Cooperative details</h2></div><button type="button" class="fed-detail-close" data-fed-detail-close aria-label="Close cooperative details">Close</button></header><div id="fedDetailBody" class="fed-detail-body"></div></aside>`;
    document.body.appendChild(root);
    root.addEventListener('click',e=>{if(e.target.closest('[data-fed-detail-close]'))closeDrawer();});
    return root;
  }

  function openCooperativeDetail(row,trigger){
    const root=ensureDrawer();
    const cells=row.cells||[];
    const name=String(cells[0]?.innerText||'Cooperative').trim();
    const city=String(cells[1]?.innerText||'—').trim();
    const workers=Number(String(cells[2]?.innerText||'0').replace(/[^0-9.-]/g,''))||0;
    const available=Number(String(cells[3]?.innerText||'0').replace(/[^0-9.-]/g,''))||0;
    const status=statusFromRow(row);
    const availabilityRatio=workers?Math.round((available/workers)*100):0;
    const body=$('#fedDetailBody',root);
    if(body)body.innerHTML=`
      <div class="fed-detail-status"><span>Capacity Status</span><b>${esc(status)}</b></div>
      <dl class="fed-detail-grid">
        <div><dt>Cooperative</dt><dd>${esc(name)}</dd></div>
        <div><dt>City / Zone</dt><dd>${esc(city)}</dd></div>
        <div><dt>Registered Workforce</dt><dd>${workers}</dd></div>
        <div><dt>Available Workforce</dt><dd>${available}</dd></div>
        <div><dt>Availability Ratio</dt><dd>${availabilityRatio}%</dd></div>
        <div><dt>Data Scope</dt><dd>Aggregate governance view</dd></div>
      </dl>
      <div class="fed-detail-note"><b>Privacy-safe Federation view</b><p>Only aggregate cooperative workforce data exposed by the connected overview is shown here. Individual worker personal data is intentionally not displayed.</p></div>`;
    returnFocus=trigger||document.activeElement;
    root.hidden=false;
    document.body.classList.add('fed-detail-open');
    setTimeout(()=>$('.fed-detail-close',root)?.focus(),0);
  }

  function closeDrawer(){
    const root=$('#fedDetailRoot');
    if(!root||root.hidden)return;
    root.hidden=true;
    document.body.classList.remove('fed-detail-open');
    const target=returnFocus;
    returnFocus=null;
    setTimeout(()=>target?.isConnected&&target.focus(),0);
  }

  async function getPlanning(){
    if(planningCache)return planningCache;
    if(!planningPromise)planningPromise=api('/api/connected/judge/planning').then(x=>(planningCache=x,x)).finally(()=>{planningPromise=null;});
    return planningPromise;
  }

  function actionsText(actions){return (actions||[]).map(x=>String(x).replaceAll('_',' ').toLowerCase().replace(/\b\w/g,m=>m.toUpperCase())).join(' · ')||'Monitor demand';}
  async function ensureDemandSnapshot(){
    const network=$('#fed-network');
    if(!network||$('#fed-demand-snapshot'))return;
    const section=document.createElement('section');
    section.id='fed-demand-snapshot';
    section.className='fed-demand-snapshot';
    section.innerHTML='<div class="admin-skeleton">Loading regional demand and capacity…</div>';
    network.insertAdjacentElement('afterend',section);
    try{
      const p=await getPlanning();
      const observed=Math.max(0,Number(p.historicalDemand30d||0));
      const expected=Math.max(0,Number(p.expectedDemand||0));
      const capacity=Math.max(0,Number(p.eligibleCapacity||0));
      const gap=Number(p.capacityGap||0);
      const max=Math.max(1,observed,expected,capacity);
      section.innerHTML=`
        <div class="fed-section-head"><div><span>REGIONAL DEMAND & CAPACITY</span><h3>${esc(p.service||'Service')} planning snapshot</h3></div><small>Advisory · Human-controlled</small></div>
        <div class="fed-demand-grid">
          <div class="fed-demand-metrics">
            <article><span>Observed demand · 30d</span><strong>${observed}</strong></article>
            <article><span>Expected demand</span><strong>${expected}</strong></article>
            <article><span>Eligible capacity</span><strong>${capacity}</strong></article>
            <article class="${gap>0?'attention':'balanced'}"><span>Capacity gap</span><strong>${gap}</strong></article>
          </div>
          <div class="fed-demand-bars" aria-label="Demand and capacity comparison">
            <div><span>Observed</span><i><b style="width:${Math.round(observed/max*100)}%"></b></i><em>${observed}</em></div>
            <div><span>Expected</span><i><b style="width:${Math.round(expected/max*100)}%"></b></i><em>${expected}</em></div>
            <div><span>Capacity</span><i><b style="width:${Math.round(capacity/max*100)}%"></b></i><em>${capacity}</em></div>
            <p><b>Planning confidence:</b> ${esc(p.confidence||'—')} · <b>Method:</b> ${esc(p.forecastMethod||'Observed-demand baseline')}</p>
            <p><b>Recommended action:</b> ${esc(actionsText(p.recommendedActions))}</p>
          </div>
        </div>`;
    }catch{
      section.innerHTML='<div class="admin-health-error">Regional planning data could not be loaded. Open Planning & Intelligence to retry.</div>';
    }
  }

  function ensureAdministrativeReadiness(){
    const records=$('#fed-records');
    if(!records||$('#fed-admin-readiness'))return;
    const section=document.createElement('section');
    section.id='fed-admin-readiness';
    section.className='fed-admin-readiness';
    section.innerHTML=`
      <div class="fed-section-head"><div><span>ADMINISTRATIVE READINESS</span><h3>Connected now vs authorized next phase</h3></div><small>Truth-labelled capabilities</small></div>
      <div class="fed-readiness-grid">
        <article><span>GIS Cooperative Capacity View</span><b>Future Authorized Integration</b><p>No precise cooperative coordinates are exposed by the current Federation overview, so no map is fabricated.</p></article>
        <article><span>Report Export</span><b>Future Integration</b><p>Operational tables are visible now. PDF/Excel export is not presented as working until an actual export path is implemented and tested.</p><button type="button" disabled>Export Reports</button></article>
        <article><span>Support & Feedback</span><b>Future Integration</b><p>No fake support ticket workflow is shown. A connected support module can be added when the backend exists.</p></article>
      </div>`;
    records.insertAdjacentElement('afterend',section);
  }

  function ensurePortalNavLinks(){
    const nav=$('#fedSidebar nav');
    if(!nav)return;
    const insert=(target,label,desc,before)=>{
      if($(`[data-fed-portal-target="${target}"]`,nav))return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.dataset.fedPortalTarget=target;
      btn.innerHTML=`<span>${esc(label)}</span><small>${esc(desc)}</small>`;
      btn.addEventListener('click',()=>{document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('judgeContent')?.classList.remove('fed-nav-open');});
      const anchor=before?$(`[data-fed-target="${before}"]`,nav):null;
      nav.insertBefore(btn,anchor||null);
    };
    insert('fed-demand-snapshot','Demand & Capacity','MIS planning snapshot','planning');
    insert('fed-admin-readiness','Administrative Readiness','GIS, export and support truth states','fed-health');
  }

  function trapDrawer(event){
    const root=$('#fedDetailRoot');
    if(!root||root.hidden)return;
    if(event.key==='Escape'){event.preventDefault();closeDrawer();return;}
    if(event.key!=='Tab')return;
    const nodes=$$('button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])',root).filter(el=>el.getClientRects().length);
    if(!nodes.length)return;
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }

  function enhance(){
    if(!isFederation())return;
    ensureProfile();
    ensureNavGroups();
    ensureNetworkToolbar();
    ensureDemandSnapshot();
    ensureAdministrativeReadiness();
    ensurePortalNavLinks();
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(enhance,90);}
  function install(){
    document.addEventListener('keydown',trapDrawer,true);
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('click',e=>{
      const refresh=e.target.closest?.('#adminHealthRefresh');
      if(refresh){planningCache=null;planningPromise=null;$('#fed-demand-snapshot')?.remove();setTimeout(schedule,180);return;}
      if(e.target.closest?.('[data-judge-role],#getStarted'))setTimeout(schedule,180);
    },true);
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();