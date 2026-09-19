import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {extname, join, relative} from 'node:path';

const root=new URL('..',import.meta.url).pathname;
const html=readFileSync(join(root,'index.html'),'utf8');

function walk(dir){
  const out=[];
  for(const name of readdirSync(dir)){
    if(['node_modules','dist','.git'].includes(name))continue;
    const path=join(dir,name);
    const stat=statSync(path);
    if(stat.isDirectory())out.push(...walk(path));
    else out.push(path);
  }
  return out;
}
const files=walk(root);
const scripts=files.filter(file=>extname(file)==='.js'||extname(file)==='.mjs'||extname(file)==='.cjs');
const scriptText=scripts.map(file=>readFileSync(file,'utf8')).join('\n');

function attrs(tag){
  const out={};
  for(const match of tag.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)){
    const key=match[1].toLowerCase();
    if(key==='button'||key==='a'||key==='input'||key==='select'||key==='textarea'||key==='form'||key==='label')continue;
    out[key]=match[2]??match[3]??match[4]??'';
  }
  return out;
}

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const buttons=[...html.matchAll(/<button\b[^>]*>/gi)].map(m=>({tag:m[0],a:attrs(m[0])}));
const controls=[...html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)].map(m=>({kind:m[1].toLowerCase(),tag:m[0],a:attrs(m[0])}));
const links=[...html.matchAll(/<a\b[^>]*>/gi)].map(m=>({tag:m[0],a:attrs(m[0])}));

const delegatedButtonAttrs=new Set([
  'data-eval-open-connected','data-open-selector','data-service','data-role','data-action','data-tab','data-demo-action',
  'data-booking-action','data-workspace-action','data-portal-action','data-close','data-open-role','data-auth-action','data-capacity-action'
]);

function idReferenced(id){
  const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`(?:#${escaped}\\b|getElementById\\(["']${escaped}["']\\)|querySelector\\(["']#${escaped}["']\\))`).test(scriptText);
}
function delegated(a){return Object.keys(a).some(key=>delegatedButtonAttrs.has(key)||key.startsWith('data-eval-')||key.startsWith('data-open-'));}

test('index has no duplicate ids',()=>{
  const duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  assert.deepEqual(duplicates,[],`Duplicate DOM ids: ${duplicates.join(', ')}`);
});

test('all buttons declare type and have an interaction owner',()=>{
  const failures=[];
  for(const {tag,a} of buttons){
    if(!a.type)failures.push(`Missing type: ${tag}`);
    const interactive=Boolean(a.id&&idReferenced(a.id))||delegated(a)||a.disabled!==undefined;
    if(!interactive)failures.push(`No JS owner/data action: ${tag}`);
  }
  assert.deepEqual(failures,[],failures.join('\n'));
});

test('form controls have accessible names',()=>{
  const failures=[];
  for(const {tag,a} of controls){
    const named=Boolean(a['aria-label']||a['aria-labelledby']||a.title||a.placeholder||a.id&&new RegExp(`<label\\b[^>]*for=["']${a.id}["']`,'i').test(html));
    if(!named)failures.push(tag);
  }
  assert.deepEqual(failures,[],`Unnamed controls:\n${failures.join('\n')}`);
});

test('aria-controls targets exist',()=>{
  const failures=[];
  for(const match of html.matchAll(/aria-controls="([^"]+)"/g))if(!ids.includes(match[1]))failures.push(match[1]);
  assert.deepEqual(failures,[],`Missing aria-controls targets: ${failures.join(', ')}`);
});

test('local stylesheet/script/image/manifest assets referenced by index exist',()=>{
  const refs=[];
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const value=match[1];
    if(!value||value.startsWith('#')||/^https?:\/\//.test(value)||value.startsWith('data:')||value.startsWith('mailto:')||value.startsWith('tel:'))continue;
    refs.push(value.split(/[?#]/)[0]);
  }
  const missing=[...new Set(refs.filter(ref=>!existsSync(join(root,ref))) )];
  assert.deepEqual(missing,[],`Missing local assets: ${missing.join(', ')}`);
});

test('navigation does not contain empty or javascript pseudo-links',()=>{
  const bad=links.filter(({a})=>!a.href||/^javascript:/i.test(a.href)).map(({tag})=>tag);
  assert.deepEqual(bad,[],`Invalid links:\n${bad.join('\n')}`);
});

test('visible evaluator-critical controls are present and wired',()=>{
  const critical=['connectedDemoBtn','getStarted','menuBtn','heroTourCta','runMatchBtn','evalRunRanking','evalResetMatch','evalOpenConnected','evalAdminPrototype','evalCapacityAction','evalFinalPrototype','evalFinalArchitecture'];
  const missing=critical.filter(id=>!ids.includes(id));
  const unwired=critical.filter(id=>ids.includes(id)&&!idReferenced(id)&&!new RegExp(`id=["']${id}["'][^>]*(?:data-eval-|data-open-)`).test(html));
  assert.deepEqual(missing,[],`Missing critical controls: ${missing.join(', ')}`);
  assert.deepEqual(unwired,[],`Unwired critical controls: ${unwired.join(', ')}`);
});

test('deploy build uses an explicit public-asset allowlist',()=>{
  const build=readFileSync(join(root,'scripts/build.mjs'),'utf8');
  assert.match(build,/const publicFiles=\[/,'Build must publish only an explicit runtime allowlist.');
  assert.doesNotMatch(build,/readdirSync\(root/,'Build must not copy every top-level JS/CSS file.');
});

test('legacy duplicate presentation layers are removed',()=>{
  const removed=['evaluator-final.css','hero-viewport-fix.css','mobile-fix.css','sih-final.css','worker-trust-passport-ui.js'];
  const leftovers=removed.filter(file=>existsSync(join(root,file)));
  assert.deepEqual(leftovers,[],`Legacy duplicate runtime files remain: ${leftovers.join(', ')}`);
});

test('public runtime has no obvious dead placeholder actions',()=>{
  const suspicious=[];
  for(const file of scripts){
    const rel=relative(root,file);
    if(rel.startsWith('tests/')||rel.startsWith('scripts/'))continue;
    const text=readFileSync(file,'utf8');
    if(/TODO[:\s]|FIXME[:\s]|alert\(\s*["'](?:TODO|Coming soon|Not implemented)/i.test(text))suspicious.push(rel);
  }
  assert.deepEqual(suspicious,[],`Placeholder runtime code found: ${suspicious.join(', ')}`);
});


test('landing mirrors the locked SIH PPT narrative',()=>{
  const required=[
    'Trusted nearby workers are hard to find',
    'Similar jobs can receive different quotes',
    'Digital adoption needs support',
    'Insurance coverage is uneven',
    'In-home service needs identity assurance',
    'Customer Demand',
    'Trust Gate',
    'Fair Allocation',
    'Service-Start Verification',
    'Delivery + Billing',
    'Digital Service Passport',
    'Cooperative Capacity Exchange',
    'Demand-to-Workforce Loop',
    'Better access to local work opportunities',
    'Baseline',
    'Measure KPIs',
    'Validate Impact',
    'SOURCE / FINDING',
    'SANPAID DECISION'
  ];
  const missing=required.filter(phrase=>!html.includes(phrase));
  assert.deepEqual(missing,[],`PPT-aligned website phrases missing: ${missing.join(', ')}`);
});

test('first fold exposes both core USPs and field validation immediately',()=>{
  const required=[
    'Not another worker-listing app.',
    'USP 01',
    'Cooperative Capacity Exchange',
    'USP 02',
    'Demand-to-Workforce Loop',
    'Customer Choice + Worker Consent',
    'Stakeholder-informed design · Kolhapur',
    '5 findings mapped'
  ];
  const missing=required.filter(phrase=>!html.includes(phrase));
  assert.deepEqual(missing,[],`First-fold differentiation/evidence missing: ${missing.join(', ')}`);
  assert.equal((html.match(/class="hero-usp"/g)||[]).length,2,'Hero must show exactly two core USP cards.');
});

test('Platform Tour step two mirrors the two locked SanPaid USPs',()=>{
  const selector=readFileSync(join(root,'selector-mode.js'),'utf8');
  for(const phrase of ['STEP 2 · TWO CORE USPs','Cooperative Capacity Exchange','Demand-to-Workforce Loop','Serve today. Prepare tomorrow.']){
    assert.ok(selector.includes(phrase),`Platform Tour USP story missing: ${phrase}`);
  }
});

test('mobile Platform Tour owns drawer cleanup and responsive overflow protection',()=>{
  const selectorJs=readFileSync(join(root,'selector-mode.js'),'utf8');
  const selectorCss=readFileSync(join(root,'selector-mode.css'),'utf8');
  const mobileCss=readFileSync(join(root,'mobile.css'),'utf8');
  assert.match(selectorJs,/SanPaidLanding\?\.closeMobileDrawer/,'Platform Tour must close the canonical mobile drawer state before opening.');
  assert.match(selectorCss,/\.selector-mode\{[^}]*overflow-x:hidden/,'Platform Tour shell must block horizontal overflow.');
  assert.match(selectorCss,/#selectorAuto\{grid-column:1\/-1;grid-row:2\}/,'Mobile walkthrough controls need an explicit two-row layout.');
  assert.doesNotMatch(mobileCss,/\.eval-nav\s+\.mobile-drawer/,'Deleted evaluator navigation overrides must not remain in mobile CSS.');
});


test('final evaluator navigation is concise and role access is available on mobile',()=>{
  for(const label of ['Problem','Solution','Workflow','2 USPs','Evidence','Impact']){
    assert.ok(html.includes(`>${label}</a>`),`Missing concise navigation label: ${label}`);
  }
  assert.match(html,/id="heroTourCta"[^>]*data-open-selector="0"/,'Hero secondary CTA must open the Platform Tour.');
  assert.match(html,/id="spMobileAccess"/,'Mobile navigation must expose generic Role Access.');
});

test('tablet drawer JavaScript matches the 1020px navigation breakpoint',()=>{
  const app=readFileSync(join(root,'app.js'),'utf8');
  const css=readFileSync(join(root,'master-v2.css'),'utf8');
  assert.match(css,/@media \(max-width:1020px\)[\s\S]*?\.master-v2 \.navlinks\{display:none\}/,'Tablet nav must switch to the menu at 1020px.');
  assert.match(app,/window\.innerWidth>1020/,'Drawer behavior must remain enabled through the tablet navigation breakpoint.');
  assert.doesNotMatch(app,/window\.innerWidth>768/,'Drawer behavior must not use the old 768px-only breakpoint.');
});


test('authenticated workspaces keep professional product branding',()=>{
  const roleFiles=['auth-unified.js','connected-demo.js','connected-service-ui.js','connected-commerce-ui.js','customer-worker-dashboard.js','judge-demo.js','admin-command-center.js','cooperative-portal.js','federation-portal.js'];
  const eventLeaks=[];
  for(const file of roleFiles){
    const text=readFileSync(join(root,file),'utf8');
    if(/SIH\s*2026/i.test(text))eventLeaks.push(file);
  }
  assert.deepEqual(eventLeaks,[],`Authenticated workspace still exposes event-specific branding: ${eventLeaks.join(', ')}`);
});

test('role workspaces use the shared SanPaid brand hierarchy',()=>{
  const connected=readFileSync(join(root,'connected-demo.css'),'utf8');
  const dashboard=readFileSync(join(root,'customer-worker-dashboard.css'),'utf8');
  const auth=readFileSync(join(root,'auth-unified.css'),'utf8');
  const judge=readFileSync(join(root,'judge-demo.css'),'utf8');
  assert.match(connected,/--sp-blue|var\(--sp-blue/,'Connected workspace must use the canonical blue brand accent.');
  assert.match(dashboard,/var\(--sp-blue/,'Customer/worker dashboard must use the canonical blue brand accent.');
  assert.match(auth,/49,107,154|#316B9A/,'Role Access must use the shared blue brand accent.');
  assert.match(judge,/49,107,154|#123D73/,'Administration shell must use the shared blue brand accent.');
});

test('literal dynamic buttons declare an explicit type',()=>{
  const failures=[];
  for(const file of scripts){
    const rel=relative(root,file);
    if(rel.startsWith('tests/')||rel.startsWith('scripts/'))continue;
    const text=readFileSync(file,'utf8');
    for(const match of text.matchAll(/<button\b(?![^>]*\btype\s*=)[^>]*>/gi)){
      failures.push(`${rel}: ${match[0].slice(0,120)}`);
      if(failures.length>=20)break;
    }
    if(failures.length>=20)break;
  }
  assert.deepEqual(failures,[],`Dynamic buttons missing type="button":\n${failures.join('\n')}`);
});


test('professional product surfaces do not expose stale validation contradictions',()=>{
  const credibility=readFileSync(join(root,'credibility-layer.js'),'utf8');
  const customer=readFileSync(join(root,'connected-demo.js'),'utf8');
  const worker=readFileSync(join(root,'customer-worker-dashboard.js'),'utf8');
  const admin=readFileSync(join(root,'admin-command-center.js'),'utf8');
  assert.doesNotMatch(credibility,/no interview counts|verified field evidence has not been entered/i,'Credibility center contradicts the field-validation dossier.');
  assert.match(credibility,/FIELD-INFORMED/,'Credibility center must preserve the field-informed evidence boundary.');
  assert.doesNotMatch(customer,/value="Service Address,/,'Customer address must not look pre-seeded.');
  assert.doesNotMatch(worker,/id="cwScheduleVoice" value=/,'Worker schedule example must be a placeholder, not fake user data.');
  assert.doesNotMatch(admin,/CODE-CONNECTED · MANUAL REGRESSION REQUIRED|CONNECTED BUT NOT TESTED/,'Admin workspace exposes internal QA wording as product status.');
});


test('cooperative and federation admin workspaces expose governed connected actions',()=>{
  const coop=readFileSync(join(root,'cooperative-portal.js'),'utf8');
  const fed=readFileSync(join(root,'federation-portal.js'),'utf8');
  const evidence=readFileSync(join(root,'handover-evidence.js'),'utf8');
  const admin=readFileSync(join(root,'admin-command-center.js'),'utf8');
  assert.match(coop,/\/api\/cooperative-admin\/capacity-requests/,'Cooperative Admin must expose connected capacity request creation.');
  assert.match(fed,/\/api\/federation\/capacity-requests\//,'Federation Admin must expose governed capacity coordination.');
  assert.match(fed,/data\.fedProviderOffer|fedProviderOffer/,'Federation provider coordination control is missing.');
  assert.match(fed,/data\.fedApprove|fedApprove/,'Federation authorization control is missing.');
  assert.match(evidence,/\/api\/cooperative-admin\/complaints\/.*\/status/,'Cooperative complaint status actions are not connected.');
  assert.match(evidence,/Array\.isArray\(rows\?\.complaints\)/,'Complaint list response wrapper must be handled.');
  assert.match(evidence,/Array\.isArray\(data\?\.timeline\)/,'Complaint evidence must consume the backend timeline contract.');
  assert.doesNotMatch(admin,/Manual test required|Manual regression required/,'Admin surfaces still expose stale internal QA wording.');
});

test('admin sidebars expose accessible active navigation states',()=>{
  const coop=readFileSync(join(root,'cooperative-portal.js'),'utf8');
  const admin=readFileSync(join(root,'admin-command-center.js'),'utf8');
  assert.match(coop,/aria-current/,'Cooperative navigation must expose the active location.');
  assert.match(admin,/aria-current/,'Federation navigation must expose the active location.');
  assert.match(coop,/Open cooperative navigation/,'Cooperative mobile menu needs an accessible label.');
  assert.match(admin,/Open federation navigation/,'Federation mobile menu needs an accessible label.');
});


test('admin workspaces keep primary navigation grouped and operations-first',()=>{
  const cooperative=readFileSync(join(root,'cooperative-portal.js'),'utf8');
  const federation=readFileSync(join(root,'federation-portal.js'),'utf8');
  const admin=readFileSync(join(root,'admin-command-center.js'),'utf8');
  const css=readFileSync(join(root,'admin-command-center.css'),'utf8');
  const coopNav=(cooperative.match(/const NAV_GROUPS=\[([\s\S]*?)\n  \];/)||[])[1]||'';
  const fedNav=(admin.match(/const FED_NAV=\[([\s\S]*?)\n  \];/)||[])[1]||'';
  for(const group of ['OPERATIONS','GOVERNANCE','INTELLIGENCE'])assert.ok(coopNav.includes(group),`Cooperative navigation group missing: ${group}`);
  for(const group of ['Regional Operations','Coordination','Intelligence & Policy'])assert.ok(federation.includes(group),`Federation navigation group missing: ${group}`);
  for(const label of ['System Health','System Verification','Architecture & Research','Welfare Readiness'])assert.ok(!coopNav.includes(label),`Cooperative primary nav still exposes secondary item: ${label}`);
  for(const label of ['Feature Verification','System Verification','Architecture & Research','Welfare Readiness'])assert.ok(!fedNav.includes(label),`Federation primary nav still exposes secondary item: ${label}`);
  assert.match(css,/#sihJudgeShell\.admin-command-center \.judge-tabs\{display:none!important\}/,'Duplicate horizontal admin tabs must stay hidden.');
  assert.match(admin,/class="admin-technical-details"/,'Technical verification must remain available as collapsed secondary content.');
});

test('admin workspaces remove duplicate roadmap clutter and keep technical truth secondary',()=>{
  const cooperative=readFileSync(join(root,'cooperative-portal.js'),'utf8');
  const federation=readFileSync(join(root,'federation-portal.js'),'utf8');
  const admin=readFileSync(join(root,'admin-command-center.js'),'utf8');
  assert.doesNotMatch(cooperative,/coop-readiness|ADMINISTRATIVE INTEGRATION ROADMAP/,'Cooperative workspace still duplicates the future-integration roadmap.');
  assert.doesNotMatch(federation,/fed-admin-readiness|ADMINISTRATIVE INTEGRATION ROADMAP|ensureAdministrativeReadiness/,'Federation workspace still duplicates the future-integration roadmap.');
  for(const label of ['Service-Start Trust','Payment Sandbox','System Reset'])assert.ok(!admin.includes(label),`Admin technical verification still exposes out-of-scope row: ${label}`);
  assert.match(admin,/class="admin-technical-details"/,'Implementation truth must remain available in collapsed technical verification.');
});


test('customer and worker dashboards stay compact and action-led',()=>{
  const dashboard=readFileSync(join(root,'customer-worker-dashboard.js'),'utf8');
  const dashboardCss=readFileSync(join(root,'customer-worker-dashboard.css'),'utf8');
  const connected=readFileSync(join(root,'connected-demo.js'),'utf8');
  assert.doesNotMatch(dashboard,/cw-quick-grid|function quick\(/,'Dashboard must not duplicate navigation with a quick-action grid.');
  assert.match(dashboard,/function nextCustomerView\(/,'Customer overview needs a contextual next-step route.');
  assert.match(dashboard,/function nextWorkerView\(/,'Worker overview needs a contextual next-step route.');
  assert.match(dashboard,/class="cw-next-action"/,'Overview must expose one clear next action.');
  assert.doesNotMatch(dashboard,/deployed backend|deploy-pending|Connected backend unavailable/i,'User-facing dashboard copy exposes internal deployment language.');
  assert.doesNotMatch(dashboardCss,/\.cw-quick\b|\.cw-quick-grid\b/,'Removed quick-action UI must not leave dead dashboard CSS.');
  assert.doesNotMatch(connected,/connected-app-heading/,'Connected workspace must not render a duplicate dashboard heading card.');
  assert.match(connected,/AUTHORIZED WORKSPACE/,'Connected workspace should retain a compact session identity bar.');
});


test('four role dashboards protect status semantics and active navigation',()=>{
  const dashboard=readFileSync(join(root,'customer-worker-dashboard.js'),'utf8');
  const cooperative=readFileSync(join(root,'cooperative-portal.js'),'utf8');
  const workforce=readFileSync(join(root,'workforce-intelligence.js'),'utf8');
  assert.match(dashboard,/STATUS_TONES\.risk\.has\(value\)[\s\S]*STATUS_TONES\.good\.has\(value\)/,'Customer/Worker negative statuses must be evaluated before positive statuses.');
  assert.match(dashboard,/aria-current="page"/,'Customer/Worker navigation must expose the active view.');
  const coopBadge=(cooperative.match(/function badge\(value,tone\)\{[^\n]+/)||[])[0]||'';
  assert.ok(coopBadge.indexOf('UNAVAILABLE')>=0&&coopBadge.indexOf('UNAVAILABLE')<coopBadge.indexOf('VERIFIED|BALANCED'),'Cooperative negative availability/eligibility states must win before positive badge states.');
  const wiStatus=(workforce.match(/const statusClass=s=>\{[^\n]+/)||[])[0]||'';
  assert.ok(wiStatus.indexOf('NOT_ELIGIBLE')>=0&&wiStatus.indexOf('NOT_ELIGIBLE')<wiStatus.indexOf('ELIGIBLE|VALID'),'Workforce negative eligibility must win before positive eligibility.');
});

test('admin role switching removes stale opposite-role chrome',()=>{
  const admin=readFileSync(join(root,'admin-command-center.js'),'utf8');
  const coop=readFileSync(join(root,'cooperative-portal.js'),'utf8');
  const fed=readFileSync(join(root,'federation-portal.js'),'utf8');
  assert.match(admin,/classList\.toggle\('cooperative-govtech',role==='COOPERATIVE_ADMIN'\)/,'Admin shell must explicitly own Cooperative styling by role.');
  for(const id of ['coopSidebar','coopNavToggle','coopProfileChip','fedSidebar','fedNavToggle','fedProfileChip']){
    assert.ok(admin.includes(id),`Role switch cleanup is missing ${id}`);
  }
  assert.match(coop,/if\(!\$\('#coopSidebar \[aria-current="page"\]'\)\)setActiveNav\('coop-home'\)/,'Cooperative refresh must preserve the current sidebar location.');
  assert.match(coop,/\$\('#fedProfileChip',actions\)\?\.remove\(\)/,'Cooperative workspace must remove a stale Federation profile chip.');
  assert.match(fed,/\$\('#coopProfileChip',actions\)\?\.remove\(\)/,'Federation workspace must remove a stale Cooperative profile chip.');
});


test('customer booking and worker opportunity UI avoid seeded or misleading defaults',()=>{
  const connected=readFileSync(join(root,'connected-demo.js'),'utf8');
  const service=readFileSync(join(root,'connected-service-ui.js'),'utf8');
  const capacity=readFileSync(join(root,'capacity-worker-ui.js'),'utf8');
  const commerce=readFileSync(join(root,'connected-commerce-ui.js'),'utf8');
  assert.doesNotMatch(connected,/Karad Zone 1/,'Customer booking must not ship with a hard-coded area.');
  assert.match(connected,/Select a service/,'Customer must explicitly choose a service when no landing prefill exists.');
  assert.match(connected,/Enter area or locality/,'Customer area input needs a neutral product placeholder.');
  assert.doesNotMatch(service,/value="Service labour"/,'Worker estimate must not ship with a fake work item.');
  assert.match(service,/previousItems/,'Rejected estimate revisions should preserve real prior line items.');
  assert.match(connected,/Why you received this offer/,'Worker offer must explain why the opportunity was shown.');
  assert.match(connected,/offer\.matching\?\.reasonCodes/,'Worker offer explanation must use backend-derived matching reasons.');
  assert.doesNotMatch(connected,/Expected Amount/,'Booking total must not be presented as worker earnings.');
  assert.match(capacity,/Authorized approval is still required/,'Worker consent must not be presented as final cross-cooperative authorization.');
  assert.match(commerce,/Payment Method/,'Customer checkout must label the payment method control.');
});

test('customer and worker dashboards keep action language concise and role-appropriate',()=>{
  const dashboard=readFileSync(join(root,'customer-worker-dashboard.js'),'utf8');
  assert.match(dashboard,/Payment & Invoice/,'Customer navigation should expose invoice access clearly.');
  assert.match(dashboard,/QUICK SCHEDULE UPDATE/,'Worker schedule shortcut needs a clear task label.');
  assert.match(dashboard,/Review Update/,'Natural-language schedule parsing must ask the worker to review before confirmation.');
  assert.doesNotMatch(dashboard,/VOICE \/ TEXT SCHEDULE|Rule-assisted shortcut/,'Worker workspace should not expose implementation-centric schedule labels.');
  assert.doesNotMatch(dashboard,/Review the final amount, complete the sandbox payment and rate the service/,'Next-action guidance should not foreground sandbox implementation language.');
});

test('public JavaScript does not call forEach on the single-element selector helper',()=>{
  const failures=[];
  for(const file of scripts){
    const rel=relative(root,file);
    if(rel.startsWith('tests/')||rel.startsWith('scripts/'))continue;
    const text=readFileSync(file,'utf8');
    if(/(^|[^$])\$\([^\n;]*\)\.forEach\s*\(/m.test(text))failures.push(rel);
  }
  assert.deepEqual(failures,[],`Single-element selector used with forEach: ${failures.join(', ')}`);
});
