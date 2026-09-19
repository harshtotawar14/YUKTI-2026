# Claude Main Page Handoff — Part 2 of 3

Read this together with Part 1 and Part 3 before making changes.

These files contain additional landing-page styling and interactive behavior. Preserve existing selectors, IDs, event hooks and demo behavior while redesigning the page.

## Files in this part
- connected-demo.css
- judge-demo.css
- selector-mode.css
- app.js
- mobile.js
- connected-demo.js


---

## FILE: `connected-demo.css`

```css
/* SanPaid connected customer/worker workspace — responsive governed service journey. */
.connected-entry{margin-top:14px;display:flex;gap:10px;flex-wrap:wrap}.connected-entry .btn{min-height:48px}.connected-badge{display:inline-flex;align-items:center;gap:7px;max-width:100%;padding:6px 10px;border-radius:999px;background:rgba(43,194,123,.14);border:1px solid rgba(43,194,123,.3);color:#176b46;font-size:12px;font-weight:800;white-space:normal}.connected-shell{position:fixed;inset:0;z-index:400;background:var(--sp-bg,#f6f8fa);color:var(--text);overflow:auto;overscroll-behavior:contain;min-width:0}.connected-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:max(12px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) 12px max(14px,env(safe-area-inset-left));background:var(--navy);color:#fff;border-bottom:1px solid rgba(255,255,255,.09)}.connected-top>*{min-width:0}.connected-top-subtitle{font-size:11px;color:#b8c6d8;margin-top:2px;overflow-wrap:anywhere}.connected-main{width:min(1180px,100%);margin:0 auto;padding:24px clamp(14px,4vw,26px) calc(34px + env(safe-area-inset-bottom));contain:layout style;min-width:0}.connected-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.connected-customer-grid{grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)}.connected-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:var(--sp-shadow-sm,var(--shadow));min-width:0;contain:layout paint;overflow-wrap:anywhere}.connected-card h2,.connected-card h3{margin:0 0 8px;color:var(--navy2)}.connected-card p{margin:0 0 12px;color:var(--muted);line-height:1.55}.connected-card code{white-space:normal;overflow-wrap:anywhere;word-break:break-word}.connected-intro{margin-bottom:14px}.connected-login-card{max-width:560px;margin:0 auto}.connected-login-card h2{margin-top:14px}.connected-role{cursor:pointer;text-align:left;min-height:160px}.connected-role:hover,.connected-role:focus{border-color:#8bd2ae;outline:2px solid rgba(32,166,106,.15)}.connected-role-cta{margin-top:12px}.connected-status{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}.connected-session-bar{justify-content:space-between;padding:10px 12px;border:1px solid var(--sp-border,#DCE5E9);border-radius:12px;background:rgba(255,255,255,.82);box-shadow:0 4px 14px rgba(11,31,51,.04)}.connected-session-user{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}.connected-session-bar .connected-header-actions{margin-left:auto}.connected-dot{width:10px;height:10px;border-radius:50%;background:#9aa8b7}.connected-dot.ok{background:var(--green)}.connected-dot.warn{background:var(--warn)}.connected-form{display:grid;gap:12px}.connected-form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.connected-form .field{display:grid;gap:6px;min-width:0}.connected-form .field label{font-size:12px;font-weight:800;color:#425d6d}.connected-form .field input,.connected-form .field select,.connected-form .field textarea{width:100%;min-height:48px;font-size:15px;border:1px solid #c8d6df;border-radius:10px;background:#fff;color:#10283a;padding:10px 11px}.connected-form .field textarea{min-height:112px;resize:vertical}.connected-form .field input:focus,.connected-form .field select:focus,.connected-form .field textarea:focus{outline:3px solid rgba(49,107,154,.15);border-color:#7FA8C9}.connected-check{display:flex;align-items:flex-start;gap:10px;min-height:48px;padding:11px 12px;border:1px solid #ead3a8;background:#fff9ec;border-radius:11px;color:#4f6070;cursor:pointer}.connected-check input{width:18px;height:18px;flex:0 0 auto;margin-top:1px;accent-color:#0f766e}.connected-check span{display:grid;gap:2px}.connected-check b{color:#7a5117;font-size:13px}.connected-check small{font-size:11px;line-height:1.45;color:#7d6b4e}.connected-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}.connected-actions .btn{min-height:48px}.connected-heading-row,.connected-offer-head,.connected-request-summary{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.connected-header-actions{margin-top:0}.connected-step-label{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--sp-blue,#316B9A);margin-bottom:6px}.connected-offer{border:1px solid #d7e3db;border-left:4px solid var(--sp-blue,#316B9A);border-radius:14px;padding:16px;background:#f8fcfa;margin-top:12px;contain:layout paint;min-width:0}.connected-offer h4{font-size:20px;margin:7px 0 4px;color:var(--navy2)}.connected-offer p{margin:0}.connected-earnings{text-align:right;min-width:120px}.connected-earnings small{display:block;color:var(--muted);font-size:11px}.connected-earnings b{display:block;color:#176b46;font-size:22px;margin-top:3px}.connected-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}.connected-meta div{background:#f4f7fa;border-radius:10px;padding:9px;font-size:12px;min-width:0}.connected-meta b{display:block;color:var(--navy2);margin-top:2px;overflow-wrap:anywhere}.connected-voice{background:#F1F6FB;border:1px solid #D2E0EC;border-radius:12px;padding:12px;margin-top:10px}.connected-voice .transcript{font-size:14px;line-height:1.6;margin-top:7px;overflow-wrap:anywhere}.connected-voice details{margin-top:9px}.connected-voice summary,.connected-tech-details summary{cursor:pointer;font-weight:700;color:#315E86}.connected-booking-state{display:grid;gap:10px}.connected-state-line{padding:12px;border:1px solid var(--line);border-radius:11px;background:#fff;min-width:0}.connected-state-line p{margin:6px 0 0}.connected-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.connected-summary-grid small,.connected-request-summary small{display:block;font-size:11px;color:var(--muted);margin-bottom:3px}.connected-summary-grid b,.connected-request-summary b{color:var(--navy2);overflow-wrap:anywhere}.connected-worker-assigned{border-color:#bfe6d2;background:#f7fcf9}.connected-worker-assigned h4{margin:3px 0;font-size:18px;color:var(--navy2)}.connected-demo-note{font-size:12px;color:#6d5b37;background:#fff8e9;border:1px solid #f0d4a0;padding:10px;border-radius:10px;overflow-wrap:anywhere}.connected-progress-note{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#315e4c;background:#eff8f3;border:1px solid #cee8da;padding:10px;border-radius:10px}.connected-progress-note span{color:#61766d}.connected-account{font-size:12px;color:var(--muted);line-height:1.6;margin-top:10px}.connected-account code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#eef2f6;padding:2px 5px;border-radius:5px}.connected-tech-details{margin-top:14px;padding-top:10px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}.connected-live{font-size:12px;font-weight:800;color:#167a4c}.connected-error{background:#fff0f0;color:#9c3030;border:1px solid #efc1c1;padding:10px;border-radius:10px;overflow-wrap:anywhere}.connected-success{background:#eaf8f1;color:#176b46;border:1px solid #bfe6d2;padding:10px;border-radius:10px;overflow-wrap:anywhere}.connected-list{display:grid;gap:10px}.connected-empty{padding:20px;text-align:center;color:var(--muted);border:1px dashed #c8d5e2;border-radius:12px;line-height:1.6}.connected-divider{height:1px;background:var(--line);margin:14px 0}.connected-shell .close-connected{min-width:44px;min-height:44px}.connected-shell.hidden{display:none!important}.connected-offer-actions .btn{flex:1 1 160px;min-height:50px}.connected-stepper{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-bottom:10px;overflow:hidden}.connected-step{position:relative;text-align:center;color:#8a98a7;font-size:10px;min-width:0}.connected-step span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;margin:0 auto 5px;background:#e8eef4;color:#667687;font-weight:800}.connected-step small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.connected-step.done span{background:#d9f2e5;color:#176b46}.connected-step.active span{background:var(--sp-blue,#316B9A);color:#fff;box-shadow:0 0 0 4px rgba(49,107,154,.12)}.connected-step.active small{color:var(--sp-blue,#316B9A);font-weight:800}.connected-modal-backdrop{position:fixed;inset:0;z-index:460;background:rgba(3,15,29,.58);display:grid;place-items:center;padding:18px}.connected-modal{width:min(480px,100%);max-height:90dvh;overflow-y:auto;background:#fff;border-radius:18px;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.25);overscroll-behavior:contain}.connected-modal h3{margin:0 0 8px;color:var(--navy2)}.connected-modal p{color:var(--muted);line-height:1.5}.connected-choice-list{display:grid;gap:8px;margin:14px 0}.connected-choice-list label{display:flex;align-items:center;gap:10px;min-height:48px;border:1px solid var(--line);padding:11px 12px;border-radius:11px;cursor:pointer}.connected-choice-list input{width:18px;height:18px}.connected-choice-list label:has(input:checked){border-color:#77caa2;background:#f0faf5}.btn:disabled{opacity:.62;cursor:not-allowed;transform:none!important}
.connected-shell :is(button,input,select,textarea,a):focus-visible{outline:3px solid rgba(49,107,154,.24);outline-offset:2px}
/* When the full-screen connected workspace is open, do not keep painting the landing underneath it. */
body:has(#connectedShell:not(.hidden))>#landing{visibility:hidden;pointer-events:none}
@media(max-width:820px){.connected-grid,.connected-customer-grid{grid-template-columns:1fr}.connected-main{padding-top:16px}.connected-role{min-height:0}.connected-meta{grid-template-columns:1fr 1fr}.connected-stepper{grid-template-columns:repeat(7,76px);overflow-x:auto;padding-bottom:6px;scroll-snap-type:x proximity}.connected-step{scroll-snap-align:start}.connected-step small{white-space:normal}.connected-heading-row{align-items:stretch}.connected-header-actions{width:100%}.connected-header-actions .btn{flex:1 1 150px}.connected-form .field input,.connected-form .field select,.connected-form .field textarea{font-size:16px}}
@media(max-width:520px){.connected-session-bar{align-items:stretch}.connected-session-user{width:100%}.connected-session-bar .connected-header-actions{width:100%;margin-left:0}.connected-top{align-items:center}.connected-top .brand{font-size:18px}.connected-top .actions{flex:0 0 auto}.connected-top-subtitle{max-width:65vw}.connected-main{padding-left:12px;padding-right:12px}.connected-card{padding:15px}.connected-form-row{grid-template-columns:1fr}.connected-actions{display:grid;grid-template-columns:1fr}.connected-actions .btn{width:100%;min-height:50px}.connected-meta,.connected-summary-grid{grid-template-columns:1fr}.connected-entry{display:grid;grid-template-columns:1fr}.connected-entry .btn{width:100%}.connected-offer-head{display:grid;grid-template-columns:1fr}.connected-earnings{text-align:left;min-width:0}.connected-offer-actions{display:grid;grid-template-columns:1fr}.connected-offer-actions [data-accept-offer]{order:-1}.connected-modal-backdrop{align-items:end;padding:0}.connected-modal{width:100%;max-width:none;max-height:90dvh;border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom))}.connected-request-summary{display:grid;grid-template-columns:1fr;gap:8px}.connected-badge{justify-self:start}}
@media(max-width:420px){.connected-stepper{display:grid;grid-template-columns:1fr;gap:0;overflow:visible;margin:4px 0 12px;padding:0 0 0 2px}.connected-step{display:grid;grid-template-columns:34px 1fr;align-items:center;text-align:left;gap:8px;min-height:42px}.connected-step span{margin:0;width:30px;height:30px}.connected-step small{font-size:11px;white-space:normal;overflow:visible;text-overflow:clip}.connected-step:after{content:"";position:absolute;left:14px;top:31px;bottom:-11px;width:2px;background:#dfe7ec}.connected-step:last-child:after{display:none}.connected-step.done:after{background:#9fd5bb}.connected-top-subtitle{display:none}.connected-card{border-radius:13px}.connected-offer{padding:14px}.connected-offer h4{font-size:18px}}
@media(max-width:340px){.connected-main{padding-left:10px;padding-right:10px}.connected-card,.connected-offer{padding:12px}.connected-modal{padding-left:12px;padding-right:12px}.connected-top{gap:8px}.connected-live{font-size:10px}}
@media(prefers-reduced-motion:reduce){.connected-shell *{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}

/* Canonical connected-service readiness gate */
.readiness-backdrop{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:20px;background:rgba(4,15,31,.72);backdrop-filter:blur(8px)}
.readiness-backdrop[hidden]{display:none}
.readiness-dialog{width:min(560px,100%);max-height:min(760px,calc(100vh - 32px));overflow:auto;padding:28px;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:#fff;color:#10233f;box-shadow:0 24px 80px rgba(0,0,0,.35)}
.readiness-dialog h2{margin:8px 0 6px;font-size:clamp(1.45rem,3vw,2rem)}
.readiness-dialog>p{margin:0;color:#52647a;line-height:1.55}
.readiness-checks{display:grid;gap:10px;margin:22px 0}
.readiness-row{display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:center;padding:13px 14px;border:1px solid #d9e2ec;border-radius:14px;background:#f7f9fc}
.readiness-row>span{display:grid;width:32px;height:32px;place-items:center;border-radius:50%;background:#dce6f1;color:#324960;font-weight:800}
.readiness-row div{display:grid;gap:2px}.readiness-row small{color:#607286}
.readiness-row.ready{border-color:#a7dec0;background:#effaf4}.readiness-row.ready>span{background:#198754;color:#fff}
.readiness-row.blocked{border-color:#f0b6b6;background:#fff3f3}.readiness-row.blocked>span{background:#b42318;color:#fff}
.readiness-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}
body.readiness-open{overflow:hidden}
@media(max-width:560px){.readiness-backdrop{padding:10px}.readiness-dialog{padding:20px;border-radius:18px}.readiness-actions{display:grid;grid-template-columns:1fr}.readiness-actions .btn{width:100%}}

/* Customer + Worker final opportunity/payment polish */
.connected-badge{background:rgba(49,107,154,.12);border-color:rgba(49,107,154,.26);color:#D8E8F5}
.connected-offer{border-color:#D7E3EC;background:#F8FBFE}
.connected-earnings b{color:var(--sp-blue,#316B9A)}
.connected-offer-reason{background:#F4F8FC;border-color:#D7E3EC}
.connected-reason-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.connected-reason-tags span{display:inline-flex;align-items:center;min-height:28px;padding:5px 8px;border:1px solid #C8D9E8;border-radius:999px;background:#EEF4FA;color:#315E86;font-size:10px;font-weight:800}
.connected-payment-actions{align-items:flex-end}
.connected-payment-method{display:grid;gap:5px;min-width:min(240px,100%);color:#425D6D;font-size:11px;font-weight:800}
.connected-payment-method select{min-height:48px;border:1px solid #C8D6DF;border-radius:10px;background:#fff;color:#10283A;padding:10px 11px;font:inherit}
.connected-choice-list label:has(input:checked){border-color:#7FA8C9;background:#F1F6FB}
@media(max-width:560px){.connected-payment-actions{display:grid;grid-template-columns:1fr}.connected-payment-actions>*{width:100%}.connected-reason-tags{display:grid;grid-template-columns:1fr}.connected-reason-tags span{justify-content:center}}

```


---

## FILE: `judge-demo.css`

```css
#sihJudgeShell{position:fixed;inset:0;z-index:1300;background:#f4f7fb;color:#10223a;overflow:auto}.judge-hidden{display:none!important}.judge-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px max(16px,env(safe-area-inset-left));background:#0b1930;color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}.judge-top .brand{font-size:22px}.judge-top-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.judge-live{font-size:12px;font-weight:800;color:#91e6b8}.judge-main{max-width:1180px;margin:0 auto;padding:22px 16px calc(34px + env(safe-area-inset-bottom))}.judge-hero{background:#0f2340;color:#fff;padding:22px;border-radius:20px;margin-bottom:14px}.judge-hero h1{margin:4px 0 8px;font-size:clamp(24px,4vw,38px)}.judge-hero p{color:#c5d2e2;max-width:900px}.judge-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.judge-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.judge-card{background:#fff;border:1px solid #dce4ee;border-radius:16px;padding:16px;min-width:0;box-shadow:0 8px 24px rgba(20,40,70,.06)}.judge-card h2,.judge-card h3{margin:0 0 8px}.judge-card p{margin:5px 0;color:#5d6b7d}.judge-kpi b{display:block;font-size:28px;margin-top:6px}.judge-tabs{display:flex;gap:8px;overflow:auto;padding:2px 0 12px;scrollbar-width:thin}.judge-tab{white-space:nowrap;border:1px solid #ccd7e5;background:#fff;border-radius:999px;padding:10px 14px;font-weight:800;cursor:pointer}.judge-tab.active{background:#0b1930;color:#fff;border-color:#0b1930}.judge-section{display:none}.judge-section.active{display:block}.judge-badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;background:#eaf8f1;color:#176b46;border:1px solid #c4e8d5}.judge-badge.demo{background:#fff6df;color:#8a5b00;border-color:#f0d797}.judge-badge.exclude{background:#fff0f0;color:#a33535;border-color:#efc6c6}.judge-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #e8edf3}.judge-row:last-child{border-bottom:0}.judge-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px}.judge-check{padding:8px 10px;border-radius:10px;background:#f7f9fc;font-size:12px}.judge-check.ok:before{content:'✓ ';color:#16764c;font-weight:900}.judge-check.no:before{content:'✕ ';color:#ad3838;font-weight:900}.judge-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.judge-note{padding:11px 12px;background:#f7f9fc;border-left:3px solid #3e6fa8;border-radius:8px;font-size:13px}.judge-error{padding:11px 12px;background:#fff0f0;color:#9f3030;border-radius:10px;margin-top:10px}.judge-success{padding:11px 12px;background:#eaf8f1;color:#176b46;border-radius:10px;margin-top:10px}.judge-login{max-width:620px;margin:60px auto}.judge-account{font-family:ui-monospace,monospace;background:#f7f9fc;padding:10px;border-radius:10px;overflow-wrap:anywhere}.judge-coop-list{max-height:310px;overflow:auto}.judge-timeline{border-left:2px solid #d5deea;margin-left:7px;padding-left:14px}.judge-event{position:relative;padding:5px 0 14px}.judge-event:before{content:'';position:absolute;width:9px;height:9px;border-radius:50%;background:#0b1930;left:-19.5px;top:10px}.judge-table-wrap{overflow:auto}.judge-table{width:100%;border-collapse:collapse;min-width:620px}.judge-table th,.judge-table td{text-align:left;padding:10px;border-bottom:1px solid #e7ecf2;font-size:13px}.judge-presentation #landing .section:not(#matching),.judge-presentation #landing .footer{display:none!important}@media(max-width:900px){.judge-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.judge-main{padding:14px 12px 28px}.judge-grid,.judge-grid.two{grid-template-columns:1fr}.judge-checks{grid-template-columns:1fr}.judge-top{align-items:flex-start}.judge-top-actions{justify-content:flex-end}.judge-card{padding:14px}.judge-tabs{margin-right:-12px;padding-right:12px}.judge-actions .btn{min-height:48px;flex:1 1 140px}}
/* Final administration shell alignment */
#sihJudgeShell{background:var(--sp-bg,#f6f8fa)}
#sihJudgeShell .judge-card{border-color:var(--sp-border,#DCE5E9);border-radius:18px;box-shadow:var(--sp-shadow-sm,0 8px 24px rgba(11,31,51,.055))}
#sihJudgeShell .judge-badge{background:#EEF4FA;color:#245D8D;border-color:#C8D9E8}
#sihJudgeShell .judge-badge.demo{background:var(--sp-warning-bg,#FFF6E5);color:var(--sp-amber,#A96813);border-color:var(--sp-warning-border,#EED29D)}
#sihJudgeShell .judge-tab.active{background:#123D73;border-color:#123D73;color:#fff}
#sihJudgeShell :is(button,a,input,select,textarea):focus-visible{outline:3px solid rgba(49,107,154,.24)!important;outline-offset:2px!important}

```


---

## FILE: `selector-mode.css`

```css
/* SanPaid SIH Selector Mode — read-only, self-guided PPT-link experience */
.selector-mode{position:fixed;inset:0;z-index:1500;background:#f4f7fb;color:#10223a;overflow:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.selector-mode.hidden{display:none!important}
.selector-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:max(12px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 12px max(16px,env(safe-area-inset-left));background:#0b1930;color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}
.selector-top .brand{font-size:22px}.selector-top small{display:block;color:#c7d3e1;margin-top:2px}
.selector-top-actions{display:flex;align-items:center;gap:10px}.selector-readonly{font-size:10px;letter-spacing:.08em;font-weight:900;color:#8ee2b5;border:1px solid rgba(142,226,181,.35);border-radius:999px;padding:6px 9px}
.selector-icon-btn{width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;font-size:18px;cursor:pointer}
.selector-progress-wrap{position:sticky;top:65px;z-index:4;background:rgba(244,247,251,.97);backdrop-filter:blur(8px);border-bottom:1px solid #dde5ef;padding:10px 16px}
.selector-progress{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px}
.selector-progress button{min-width:0;border:0;background:transparent;color:#6a788b;display:flex;align-items:center;justify-content:center;gap:5px;padding:7px 4px;border-radius:10px;font:inherit;cursor:pointer}
.selector-progress button span{display:grid;place-items:center;width:25px;height:25px;flex:0 0 25px;border-radius:50%;border:1px solid #cbd6e4;background:#fff;font-size:11px;font-weight:900}
.selector-progress button small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:800}
.selector-progress button.active{background:#e8f1ff;color:#0b4f91}.selector-progress button.active span{background:#0b1930;border-color:#0b1930;color:#fff}
.selector-progress button.done span{background:#eaf8f1;border-color:#b9e2ce;color:#176b46}
.selector-mobile-progress{display:none;max-width:1180px;margin:0 auto;align-items:center;justify-content:space-between;gap:12px}.selector-mobile-progress span{color:#627187}
.selector-main{max-width:1180px;margin:0 auto;padding:34px 16px 112px;outline:none}
.selector-step-head{max-width:900px;margin-bottom:22px}.selector-step-head h1{font-size:clamp(28px,4.5vw,48px);line-height:1.08;letter-spacing:-.025em;margin:8px 0 12px;color:#0b1930}.selector-step-head p{font-size:17px;line-height:1.65;color:#5b6a7d;margin:0}
.selector-kicker,.selector-mini-label{font-size:11px;font-weight:900;letter-spacing:.09em;color:#176b46}
.selector-card-grid{display:grid;gap:12px}.selector-card-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.selector-card-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.selector-card-grid.five{grid-template-columns:repeat(5,minmax(0,1fr))}
.selector-card,.selector-research-grid article,.selector-person,.selector-capacity-flow article,.selector-handoff article{background:#fff;border:1px solid #dce4ee;border-radius:16px;padding:17px;box-shadow:0 8px 24px rgba(19,39,66,.055)}
.selector-card b,.selector-research-grid b{display:block;color:#0b1930;margin-bottom:7px}.selector-card p,.selector-research-grid p{margin:0;color:#627187;line-height:1.55;font-size:14px}
.compact-cards .selector-card{min-height:112px}
.selector-callout{margin-top:18px;padding:16px 18px;border-radius:14px;background:#0f2340;color:#fff}.selector-callout b{font-size:17px;line-height:1.5}
.selector-compare{display:grid;grid-template-columns:.8fr 1.2fr;gap:14px}.muted-card{background:#f8fafc}.strong-card{border-color:#b9e2ce;background:linear-gradient(180deg,#fff,#f3fbf7)}
.selector-chain{display:flex;align-items:center;gap:10px;margin-top:24px;flex-wrap:wrap}.selector-chain span,.selector-network-stack span{padding:10px 13px;border-radius:11px;background:#eef3f8;font-weight:800}.selector-chain i,.selector-network-stack i{font-style:normal;color:#7c8999}
.selector-network-stack{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:18px 0}
.selector-chip-row{display:flex;gap:7px;flex-wrap:wrap}.selector-chip-row span{font-size:11px;font-weight:800;background:#eef6f1;color:#176b46;border:1px solid #c5e4d4;padding:6px 8px;border-radius:999px}.selector-chip-row.security span{background:#f3f6fa;color:#33485f;border-color:#dbe3ec}
.selector-proof-pair{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;gap:14px;max-width:900px}.selector-person h2{margin:12px 0 4px}.selector-person>strong{font-size:30px;color:#0b1930}.selector-person p{color:#67778b}.selector-person.excluded{border-color:#efcaca;background:#fff7f7}.selector-person.eligible{border-color:#bde3cf;background:#f4fbf7}.selector-vs{align-self:center;font-weight:900;color:#8290a1}.selector-status{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900;letter-spacing:.04em}.selector-status.good{background:#e9f8f0;color:#176b46;border:1px solid #bee3d0}.selector-status.bad{background:#fff0f0;color:#a23535;border:1px solid #efcaca}.selector-status.demo{background:#fff6df;color:#8a5b00;border:1px solid #f0d797}.selector-status.future{background:#f1efff;color:#5e4cb4;border:1px solid #d9d2fa}
.selector-check-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:14px}.selector-check-list span,.selector-proof-lines span{font-size:12px;font-weight:800;color:#176b46;background:#eaf8f1;border-radius:9px;padding:8px 9px}
.selector-flow-three,.selector-training-flow,.selector-planning-flow,.selector-trust-flow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:18px 0}.selector-flow-three span,.selector-training-flow span,.selector-planning-flow span,.selector-trust-flow span{padding:10px 12px;border-radius:11px;background:#fff;border:1px solid #dce4ee;font-weight:850;font-size:12px}.selector-flow-three i,.selector-training-flow i,.selector-planning-flow i,.selector-trust-flow i{font-style:normal;color:#8290a1}.selector-trust-flow .enabled{background:#eaf8f1;border-color:#bde3cf;color:#176b46}
.selector-details{margin-top:14px;background:#fff;border:1px solid #dce4ee;border-radius:13px;padding:12px 14px}.selector-details summary{cursor:pointer;font-weight:850;color:#25405e}.selector-two-col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.selector-two-col>div{background:#f7f9fc;border-radius:10px;padding:12px}.selector-two-col p{color:#66768a;line-height:1.5}
.selector-handoff{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;align-items:center;gap:8px}.selector-handoff article{min-height:148px;display:flex;flex-direction:column;justify-content:center}.selector-handoff article span{font-size:12px;color:#66768a;margin-top:6px}.selector-handoff i,.selector-capacity-flow i{font-style:normal;color:#8895a5;font-weight:900}.selector-handoff strong{margin-top:12px;font-size:11px}.selector-handoff .decline{color:#a23535}.selector-handoff .accept{color:#176b46}
.selector-proof-lines{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.selector-lock-rule{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:10px;margin:20px 0;background:#0b1930;color:#fff;border-radius:16px;padding:18px}.selector-lock-rule b{text-align:center}.selector-lock-rule strong{color:#8ee2b5;font-size:20px}
.selector-truth-note{display:flex;gap:10px;align-items:flex-start;padding:13px 14px;background:#fff;border:1px solid #dce4ee;border-radius:13px;margin-top:14px}.selector-truth-note p{margin:1px 0 0;color:#617187;line-height:1.5}
.selector-scenario-badge{display:inline-block;margin-bottom:12px;font-size:10px;font-weight:900;letter-spacing:.08em;color:#8a5b00;background:#fff6df;border:1px solid #f0d797;border-radius:999px;padding:6px 9px}
.selector-capacity-flow{display:grid;grid-template-columns:1.2fr auto 1fr auto 1.2fr auto 1fr;align-items:stretch;gap:8px}.selector-capacity-flow article{display:flex;flex-direction:column;justify-content:center}.selector-capacity-flow span{font-size:12px;color:#66768a;margin-top:5px}.selector-capacity-flow strong{margin-top:9px;color:#a35a16}
.selector-research-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.selector-research-grid article{box-shadow:none}.selector-architecture{margin-top:14px;padding:16px;background:#0f2340;color:#fff;border-radius:16px}.selector-architecture>b{display:block;margin-bottom:12px}.selector-architecture>div{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.selector-architecture span{padding:9px 11px;border:1px solid rgba(255,255,255,.15);border-radius:10px;background:rgba(255,255,255,.06);font-size:12px}.selector-architecture i{font-style:normal;color:#8ee2b5}.selector-roadmap{color:#617187;line-height:1.55}
.selector-truth-matrix{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:18px 0}.selector-truth-matrix>div{background:#fff;border:1px solid #dce4ee;border-radius:12px;padding:11px 12px;display:flex;justify-content:space-between;gap:10px;align-items:center}.selector-truth-matrix b{font-size:13px}
.selector-final-message{padding:22px;border-radius:18px;background:#0b1930;color:#fff}.selector-final-message b{font-size:22px}.selector-final-message p{font-size:16px;line-height:1.6;color:#d0dae7;max-width:850px;margin-bottom:0}
.selector-why{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.selector-why>b{width:100%;margin-bottom:3px}.selector-why span{font-size:11px;font-weight:800;background:#fff;border:1px solid #dce4ee;border-radius:999px;padding:7px 9px}
.selector-controls{position:fixed;left:0;right:0;bottom:0;z-index:6;display:flex;align-items:center;gap:8px;padding:11px max(16px,env(safe-area-inset-right)) calc(11px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));background:rgba(255,255,255,.97);backdrop-filter:blur(10px);border-top:1px solid #dbe3ed}.selector-controls .btn{min-height:46px}.selector-control-spacer{flex:1}
.selector-nav-link{border:0;background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer;padding:5px 0}.selector-nav-link:hover{color:var(--green)}
.selector-hero-primary{box-shadow:0 12px 26px rgba(27,146,92,.23)}
#home .searchbox{opacity:.82}
.selector-home-note{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;margin-top:14px;padding:11px 13px;border-radius:12px;background:#eef8f3;border:1px solid #c8e6d6;color:#33546b;font-size:12px}.selector-home-note b{color:#176b46}.quick-booking-details{margin-top:15px;border:1px solid rgba(255,255,255,.16);border-radius:13px;padding:9px 11px;background:rgba(255,255,255,.05)}.quick-booking-details summary{cursor:pointer;font-size:12px;font-weight:800}.quick-booking-details .searchbox{margin-top:10px}.hero-secondary-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.loop-message{margin-top:14px;padding:10px 12px;border-radius:11px;background:rgba(255,255,255,.07);color:#c7d4e3;font-size:12px;line-height:1.5}.selector-invite{background:#0f2340;color:#fff}.selector-invite-inner{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center}.selector-invite h2{font-size:clamp(26px,4vw,40px);margin:9px 0}.selector-invite p{color:#c8d4e3;max-width:760px;line-height:1.6}.selector-invite-actions{display:flex;flex-direction:column;gap:9px;min-width:230px}.selector-invite .tag{background:#eaf8f1;color:#176b46}
@media(max-width:1050px){
  .selector-progress small{display:none}
  .selector-card-grid.four,.selector-card-grid.five{grid-template-columns:repeat(2,minmax(0,1fr))}
  .selector-research-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .selector-handoff,.selector-capacity-flow{grid-template-columns:1fr}.selector-handoff i,.selector-capacity-flow i{transform:rotate(90deg);justify-self:center}
}
@media(max-width:760px){.selector-invite-inner{grid-template-columns:1fr}.selector-invite-actions{min-width:0}.selector-invite-actions .btn{width:100%;min-height:48px}.selector-home-note{font-size:11px}}
@media(max-width:720px){
  .selector-progress-wrap{top:64px;padding:9px 12px}.selector-progress{display:none}.selector-mobile-progress{display:flex}
  .selector-main{padding:24px 12px 198px}.selector-step-head p{font-size:15px}
  .selector-card-grid.four,.selector-card-grid.three,.selector-card-grid.five,.selector-research-grid,.selector-compare,.selector-proof-pair,.selector-two-col,.selector-truth-matrix{grid-template-columns:1fr}
  .selector-vs{text-align:center}.selector-check-list{grid-template-columns:1fr}
  .selector-lock-rule{grid-template-columns:1fr;text-align:center}.selector-lock-rule strong{transform:rotate(90deg)}
  .selector-controls{display:grid;grid-template-columns:1fr 1fr;padding:9px max(12px,env(safe-area-inset-right)) calc(9px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}
  .selector-controls .btn{width:100%;min-height:48px}.selector-control-spacer{display:none}
  #selectorPrev{grid-column:1;grid-row:1}#selectorNext{grid-column:2;grid-row:1}#selectorAuto{grid-column:1/-1;grid-row:2}
  #selectorWorkingDemo,#selectorTechnical{font-size:12px}
  .selector-readonly{display:none}
}
@media(max-width:430px){
  .selector-top{padding:max(10px,env(safe-area-inset-top)) 12px 10px}.selector-top .brand{font-size:20px}.selector-top small{display:none}
  .selector-main{padding-top:19px}.selector-step-head h1{font-size:29px}
  .selector-card,.selector-research-grid article,.selector-person,.selector-capacity-flow article,.selector-handoff article{padding:14px}
}
@media(prefers-reduced-motion:reduce){
  .selector-mode *, .selector-mode *:before, .selector-mode *:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}
}

```


---

## FILE: `app.js`

```javascript
(() => {
  'use strict';

  const BUILD={release:'connected-backend-rebuild',runtime:'v70',source:'harshtotawar14/YUKTI-2026',branch:'main',loadedAt:new Date().toISOString()};
  window.__SANPAID_BUILD__=Object.freeze(BUILD);

  const FALLBACK_SERVICES=[
    {name:'Electrician',icon:'EL'},{name:'Plumber',icon:'PL'},{name:'Carpenter',icon:'CP'},{name:'Painter',icon:'PT'},
    {name:'Cleaner',icon:'CL'},{name:'Domestic Helper',icon:'DH'},{name:'Caregiver',icon:'CG'},{name:'Driver',icon:'DR'},
    {name:'Gardener',icon:'GD'},{name:'Appliance Technician',icon:'AT'},{name:'AC Technician',icon:'AC'},
    {name:'RO Technician',icon:'RO'},{name:'Pest Control Worker',icon:'PC'},{name:'Community Technician',icon:'CT'},
    {name:'General Technician',icon:'GT'}
  ];
  const PREFILL_SERVICE_KEY='sanpaid_prefill_service_v1';
  const PREFILL_AREA_KEY='sanpaid_prefill_area_v1';
  const $=(selector,root=document)=>root.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money=value=>`₹${Number(value||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
  const iconFor=name=>String(name||'SV').split(/\s+/).map(part=>part[0]||'').join('').slice(0,2).toUpperCase()||'SV';
  let catalog=[];
  let catalogSource='LOADING';
  let catalogLoading=false;
  let mobileDrawerReturnFocus=null;

  function toast(message,type='success'){
    let wrap=$('#toastWrap');
    if(!wrap){wrap=document.createElement('div');wrap.id='toastWrap';wrap.className='toast-wrap';document.body.appendChild(wrap);}
    const node=document.createElement('div');node.className=`toast ${type}`;node.textContent=message;wrap.appendChild(node);setTimeout(()=>node.remove(),3000);
  }

  function normalizedCatalog(rows){
    return (Array.isArray(rows)?rows:[]).filter(item=>item?.name).map(item=>({
      id:Number(item.id||0)||null,
      name:String(item.name),
      icon:String(item.icon||iconFor(item.name)),
      basePrice:Number.isFinite(Number(item.basePrice))?Number(item.basePrice):null,
      emergencyCharge:Number.isFinite(Number(item.emergencyCharge))?Number(item.emergencyCharge):null,
      description:String(item.description||''),
      category:String(item.category||''),
      averageDurationMinutes:Number(item.averageDurationMinutes||0)||null
    }));
  }

  function renderServices(){
    const services=catalog.length?catalog:FALLBACK_SERVICES;
    const grid=$('#serviceGrid');
    if(grid){
      grid.innerHTML=services.map(service=>{
        const price=service.basePrice!==null&&service.basePrice!==undefined
          ?`<span class="price">Configured base ${money(service.basePrice)}</span>`
          :'<span class="price">Current pricing loads after connection</span>';
        return `<button class="card service-card" type="button" data-service="${esc(service.name)}"><span class="service-icon" aria-hidden="true">${esc(service.icon||iconFor(service.name))}</span><strong>${esc(service.name)}</strong>${price}</button>`;
      }).join('');
      grid.dataset.catalogSource=catalogSource;
    }
    const hero=$('#heroService');
    if(hero){
      const selected=hero.value;
      hero.innerHTML=services.map(service=>`<option value="${esc(service.name)}">${esc(service.name)}</option>`).join('');
      if(selected&&services.some(service=>service.name===selected))hero.value=selected;
    }
    const status=$('#catalogStatus');
    const retry=$('#catalogRetry');
    if(status){
      status.dataset.state=catalogSource.toLowerCase();
      status.textContent=catalogSource==='DATABASE_CONFIGURATION'
        ?`${services.length} connected services loaded from database configuration.`
        :catalogSource==='LOADING'
          ?'Checking connected service catalog…'
          :'Connected catalog is temporarily unavailable. Service names are shown without current pricing.';
    }
    if(retry){
      retry.hidden=catalogSource!=='STATIC_NAMES_ONLY';
      retry.disabled=catalogLoading;
    }
  }

  async function loadServiceCatalog(){
    if(catalogLoading)return;
    catalogLoading=true;
    catalogSource='LOADING';
    renderServices();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      if(!window.SanPaidApi?.get)throw new Error('api_client_unavailable');
      const data=await window.SanPaidApi.get('/api/public/services',{bearer:false,headers:{Accept:'application/json'},signal:controller.signal,timeoutMs:8000});
      if(!Array.isArray(data.services))throw new Error(data.message||'catalog_unavailable');
      catalog=normalizedCatalog(data.services);
      if(!catalog.length)throw new Error('empty_catalog');
      catalogSource='DATABASE_CONFIGURATION';
    }catch(error){
      catalog=[];
      catalogSource='STATIC_NAMES_ONLY';
      console.warn('[SanPaid catalog] connected service catalog unavailable; displaying service names without current pricing claim.',error?.message||error);
    }finally{
      clearTimeout(timeout);
      catalogLoading=false;
    }
    renderServices();
    window.dispatchEvent(new CustomEvent('sanpaid:service-catalog',{detail:{source:catalogSource,services:catalog.length?catalog:FALLBACK_SERVICES}}));
  }

  async function waitForAuth(attempts=50){
    for(let index=0;index<attempts;index++){
      if(window.SanPaidAuth?.open&&window.SanPaidAuth?.openRoleWorkspace)return window.SanPaidAuth;
      await new Promise(resolve=>setTimeout(resolve,80));
    }
    return null;
  }

  async function openRoleAccess(role){
    const auth=await waitForAuth();
    if(!auth){toast('Login workspace is still loading. Please retry.','warn');return false;}
    if(auth.getRole?.()===role&&auth.isAuthenticated?.())return auth.openRoleWorkspace(role,role);
    auth.open(role,role);
    return true;
  }

  function rememberService(service){try{service?sessionStorage.setItem(PREFILL_SERVICE_KEY,String(service)):sessionStorage.removeItem(PREFILL_SERVICE_KEY);}catch{}}
  function rememberArea(area){try{area?sessionStorage.setItem(PREFILL_AREA_KEY,String(area)):sessionStorage.removeItem(PREFILL_AREA_KEY);}catch{}}

  async function startBooking(service){
    rememberService(service||$('#heroService')?.value||catalog[0]?.name||FALLBACK_SERVICES[0].name);
    return openRoleAccess('CUSTOMER');
  }

  function ensureDrawerStructure(){
    const drawer=$('#mobileDrawer');
    if(!drawer||drawer.dataset.mobileReady==='1')return drawer;
    drawer.dataset.mobileReady='1';drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','SanPaid mobile navigation');
    const title=document.createElement('div');title.className='drawer-title';title.innerHTML='<strong>SanPaid Menu</strong><button type="button" class="drawer-close" aria-label="Close menu">×</button>';
    drawer.insertBefore(title,drawer.firstChild);title.querySelector('.drawer-close').addEventListener('click',()=>closeMobileDrawer(true));return drawer;
  }

  function ensureDrawerScrim(){
    let scrim=$('#mobileDrawerScrim');if(scrim)return scrim;
    scrim=document.createElement('div');scrim.id='mobileDrawerScrim';scrim.className='mobile-drawer-scrim hidden';scrim.setAttribute('aria-hidden','true');scrim.addEventListener('click',()=>closeMobileDrawer(true));document.body.appendChild(scrim);return scrim;
  }

  function drawerFocusable(drawer){return [...drawer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>element.getClientRects().length);}

  function setDrawerOpenState(open){
    const drawer=$('#mobileDrawer'),button=$('#menuBtn'),scrim=ensureDrawerScrim();if(!drawer||!button)return;
    drawer.classList.toggle('hidden',!open);drawer.setAttribute('aria-hidden',open?'false':'true');button.setAttribute('aria-expanded',open?'true':'false');button.setAttribute('aria-label',open?'Close menu':'Open menu');scrim.classList.toggle('hidden',!open);scrim.setAttribute('aria-hidden',open?'false':'true');document.body.classList.toggle('mobile-drawer-open',open);
  }
  function openMobileDrawer(){const drawer=ensureDrawerStructure(),button=$('#menuBtn');if(!drawer||!button||window.innerWidth>1020)return;mobileDrawerReturnFocus=document.activeElement;setDrawerOpenState(true);requestAnimationFrame(()=>drawer.querySelector('.drawer-close')?.focus());}
  function closeMobileDrawer(restoreFocus=true){const drawer=$('#mobileDrawer');if(!drawer)return;setDrawerOpenState(false);const target=mobileDrawerReturnFocus;mobileDrawerReturnFocus=null;if(restoreFocus&&target?.isConnected)requestAnimationFrame(()=>target.focus());}
  function recoverDrawerState(){const drawer=$('#mobileDrawer');if(!drawer)return;const closed=drawer.classList.contains('hidden')||drawer.getAttribute('aria-hidden')==='true'||window.innerWidth>1020;if(closed)setDrawerOpenState(false);}
  function toggleMobileDrawer(){const drawer=ensureDrawerStructure();if(drawer)drawer.classList.contains('hidden')?openMobileDrawer():closeMobileDrawer(true);}

  function wireMobileNavigation(){
    const drawer=ensureDrawerStructure(),button=$('#menuBtn');if(!drawer||!button)return;ensureDrawerScrim();button.addEventListener('click',toggleMobileDrawer);
    drawer.addEventListener('click',event=>{const action=event.target.closest('a[href^="#"],button');if(action&&!action.classList.contains('drawer-close'))queueMicrotask(()=>closeMobileDrawer(false));});
    document.addEventListener('keydown',event=>{if(drawer.classList.contains('hidden'))return;if(event.key==='Escape'){event.preventDefault();closeMobileDrawer(true);return;}if(event.key!=='Tab')return;const nodes=drawerFocusable(drawer);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
    window.addEventListener('resize',()=>{if(window.innerWidth>1020)closeMobileDrawer(false);},{passive:true});window.addEventListener('pageshow',recoverDrawerState,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(recoverDrawerState,120),{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden)recoverDrawerState();});
  }

  function wireLandingUtilities(){
    $('#bookServiceHero')?.addEventListener('click',()=>startBooking($('#heroService')?.value));
    $('#joinWorker')?.addEventListener('click',()=>openRoleAccess('WORKER'));
    $('#heroSearch')?.addEventListener('click',()=>{const area=$('#heroArea')?.value.trim();if(!area){toast('Enter your area first.','error');return;}rememberArea(area);startBooking($('#heroService')?.value);});
    document.addEventListener('click',event=>{const card=event.target.closest?.('#serviceGrid [data-service]');if(!card)return;event.preventDefault();startBooking(card.dataset.service);});
    $('#catalogRetry')?.addEventListener('click',loadServiceCatalog);
  }

  function start(){
    renderServices();wireMobileNavigation();wireLandingUtilities();recoverDrawerState();loadServiceCatalog();
  }

  window.SanPaidLanding={
    get services(){return catalog.length?catalog:FALLBACK_SERVICES;},
    get catalogSource(){return catalogSource;},
    reloadServiceCatalog:loadServiceCatalog,startBooking,openRoleAccess,openMobileDrawer,closeMobileDrawer,recoverDrawerState
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* Landing V3 motion layer: progressive enhancement only. */
(() => {
  'use strict';

  function revealCards(){
    const cards=[...document.querySelectorAll('.landing-v3 .reveal-card')];
    if(!cards.length)return;
    if(!('IntersectionObserver' in window)){
      cards.forEach(card=>card.classList.add('is-visible'));
      return;
    }
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    cards.forEach((card,index)=>{
      card.style.transitionDelay=`${Math.min(index%5,4)*55}ms`;
      observer.observe(card);
    });
  }

  function wireHeroDepth(){
    const stage=document.querySelector('.landing-v3 .phone-stage');
    const visual=document.querySelector('.landing-v3 .hero-visual');
    if(!stage||!visual||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let frame=0;
    const move=event=>{
      if(window.innerWidth<=720)return;
      const rect=visual.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5;
      const y=(event.clientY-rect.top)/rect.height-.5;
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        stage.style.transform=`rotateY(${x*4}deg) rotateX(${-y*4}deg) translate3d(${x*5}px,${y*5}px,0)`;
      });
    };
    const reset=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{stage.style.transform='';});
    };
    visual.addEventListener('pointermove',move,{passive:true});
    visual.addEventListener('pointerleave',reset,{passive:true});
  }

  function startLandingMotion(){
    revealCards();
    wireHeroDepth();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startLandingMotion,{once:true});
  else startLandingMotion();
})();

```


---

## FILE: `mobile.js`

```javascript
(() => {
  'use strict';

  const MOBILE_BREAKPOINT = 768;
  let deferredInstallPrompt = null;
  let reloadingForSW = false;

  function isMobile(){
    return window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
  }

  function prefersReducedMotion(){
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  }

  function showConnection(message, offline=false, autoHide=true){
    let banner = document.getElementById('connectionBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'connectionBanner';
      banner.className = 'connection-banner';
      banner.setAttribute('role','status');
      banner.setAttribute('aria-live','polite');
      document.body.appendChild(banner);
    }
    banner.textContent = message;
    banner.classList.toggle('offline',offline);
    banner.classList.remove('hidden');
    clearTimeout(banner._hideTimer);
    if (autoHide) banner._hideTimer = setTimeout(() => banner.classList.add('hidden'),2600);
  }

  function setupConnectivity(){
    const update = () => {
      if (navigator.onLine) showConnection('Online · Connection restored',false,true);
      else showConnection('Offline · Reconnect to use connected SanPaid features.',true,false);
    };
    window.addEventListener('online',update);
    window.addEventListener('offline',update);
    if (!navigator.onLine) update();
  }

  function setupVisualViewport(){
    const apply = () => {
      const h = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--visual-height',`${Math.round(h)}px`);
      document.documentElement.style.setProperty('--mobile-vw',`${Math.round(window.innerWidth)}px`);
    };
    apply();
    window.visualViewport?.addEventListener('resize',apply,{passive:true});
    window.visualViewport?.addEventListener('scroll',apply,{passive:true});
    window.addEventListener('orientationchange',() => setTimeout(apply,150),{passive:true});
    window.addEventListener('resize',debounce(apply,100),{passive:true});

    document.addEventListener('focusin',event => {
      if (!isMobile() || !event.target.matches('input,textarea,select')) return;
      setTimeout(() => event.target.scrollIntoView({block:'center',behavior:'smooth'}),180);
    });
  }

  function revealElement(el,index=0){
    if (!el || el.classList.contains('is-visible')) return;
    el.style.transitionDelay = `${Math.min(index*55,165)}ms`;
    el.classList.add('is-visible');
  }

  function setupMobileMotionRecovery(){
    if (!isMobile()) return;
    const landing = document.getElementById('landing');
    if (!landing) return;
    const elements = Array.from(landing.querySelectorAll('[data-reveal]'));
    if (!elements.length) return;

    if (prefersReducedMotion()) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    landing.classList.add('eval-motion-ready');

    const revealVisibleNow = () => {
      const viewport = window.visualViewport?.height || window.innerHeight || 700;
      elements.forEach((el,index) => {
        if (el.classList.contains('is-visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < viewport*1.08 && rect.bottom > -40) revealElement(el,index%4);
      });
    };

    revealVisibleNow();
    requestAnimationFrame(() => requestAnimationFrame(revealVisibleNow));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          revealElement(entry.target);
          observer.unobserve(entry.target);
        });
      },{threshold:0.01,rootMargin:'0px 0px 18% 0px'});
      elements.forEach(el => {
        if (!el.classList.contains('is-visible')) observer.observe(el);
      });
    } else {
      const onScroll = debounce(revealVisibleNow,40);
      window.addEventListener('scroll',onScroll,{passive:true});
    }

    window.addEventListener('orientationchange',() => setTimeout(revealVisibleNow,180),{passive:true});
    window.addEventListener('pageshow',revealVisibleNow,{passive:true});
    document.fonts?.ready?.then(revealVisibleNow).catch(()=>{});
    setTimeout(revealVisibleNow,600);
    setTimeout(revealVisibleNow,1600);

    setupHeroSequenceFallback();
  }

  function setupHeroSequenceFallback(){
    const root = document.getElementById('evalHeroSystem');
    if (!root || prefersReducedMotion()) return;
    const nodes = Array.from(root.querySelectorAll('[data-hero-seq]'));
    const workers = Array.from(root.querySelectorAll('.hero-worker'));
    const progress = document.getElementById('evalHeroProgress');
    if (!nodes.length) return;

    const startFallback = () => {
      if (root.dataset.animationOwner === 'evaluator' || root.querySelector('.hero-active')) return;
      root.dataset.animationOwner = 'mobile-fallback';
      const sequence = ['request','workers','gate','rank','offer','audit'];
      const run = () => {
        if (root.dataset.animationOwner !== 'mobile-fallback') return;
        nodes.forEach(node => node.classList.remove('hero-active'));
        workers.forEach(worker => worker.classList.remove('hero-pass','hero-remove'));
        if (progress) progress.style.width = '0%';
        sequence.forEach((name,index) => {
          setTimeout(() => {
            if (root.dataset.animationOwner !== 'mobile-fallback') return;
            const node = root.querySelector(`[data-hero-seq="${name}"]`);
            node?.classList.add('hero-active');
            if (name === 'gate') {
              workers.forEach(worker => worker.classList.add(worker.classList.contains('good')?'hero-pass':'hero-remove'));
            }
            if (progress) progress.style.width = `${Math.round(((index+1)/sequence.length)*100)}%`;
          },120+index*820);
        });
        root._mobileAnimationTimer = setTimeout(run,120+sequence.length*820+700);
      };
      run();
    };

    setTimeout(startFallback,900);
  }

  async function installPwa(){
    if (!deferredInstallPrompt) return false;
    try {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      return true;
    } catch (_) {
      return false;
    }
  }

  function setupInstallPrompt(){
    window.addEventListener('beforeinstallprompt',event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      window.dispatchEvent(new CustomEvent('sanpaid:pwa-install-ready'));
    });
    window.addEventListener('appinstalled',() => {
      deferredInstallPrompt = null;
      showConnection('SanPaid installed successfully',false,true);
    });
  }

  function showSWUpdate(registration){
    if (!registration?.waiting || document.getElementById('pwaUpdateBanner')) return;
    const bar = document.createElement('div');
    bar.id = 'pwaUpdateBanner';
    bar.className = 'pwa-install-banner';
    bar.innerHTML = `<div class="pwa-copy"><b>New SanPaid version available</b><span>Refresh the mobile app shell to use the latest fixes.</span></div><div class="actions"><button class="btn secondary small" id="laterUpdate" type="button">Later</button><button class="btn primary small" id="applyUpdate" type="button">Update</button></div>`;
    document.body.appendChild(bar);
    document.getElementById('laterUpdate')?.addEventListener('click',() => bar.remove());
    document.getElementById('applyUpdate')?.addEventListener('click',() => registration.waiting?.postMessage({type:'SKIP_WAITING'}));
  }

  function setupServiceWorker(){
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost')) return;

    window.addEventListener('load',async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
        await registration.update().catch(() => undefined);
        if (registration.waiting) showSWUpdate(registration);
        registration.addEventListener('updatefound',() => {
          const worker = registration.installing;
          worker?.addEventListener('statechange',() => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) showSWUpdate(registration);
          });
        });
        navigator.serviceWorker.addEventListener('controllerchange',() => {
          if (reloadingForSW) return;
          reloadingForSW = true;
          location.reload();
        });
      } catch (error) {
        console.warn('SanPaid service worker registration failed:',error);
      }
    },{once:true});
  }

  function clearStaleDrawerLock(){
    if (window.SanPaidLanding?.recoverDrawerState) {
      window.SanPaidLanding.recoverDrawerState();
      return;
    }
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer || drawer.classList.contains('hidden')) document.body.classList.remove('mobile-drawer-open');
  }

  function setupLifecycleRecovery(){
    window.addEventListener('pageshow',clearStaleDrawerLock);
    window.addEventListener('orientationchange',() => setTimeout(clearStaleDrawerLock,120),{passive:true});
    document.addEventListener('visibilitychange',() => {
      if (!document.hidden) clearStaleDrawerLock();
    });
  }

  function debounce(fn,wait){
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args),wait);
    };
  }

  function init(){
    clearStaleDrawerLock();
    setupConnectivity();
    setupVisualViewport();
    setupMobileMotionRecovery();
    setupInstallPrompt();
    setupServiceWorker();
    setupLifecycleRecovery();
  }

  window.SanPaidMobile = {
    isMobile,
    installPwa,
    hasInstallPrompt:() => !!deferredInstallPrompt,
    clearStaleDrawerLock
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
```


---

## FILE: `connected-demo.js`

```javascript
(() => {
  'use strict';

  const BOOKING_KEY='sanpaid_connected_booking_id';
  const STATUS_LABELS={
    REQUESTED:'Finding Verified Worker',VALIDATING:'Checking Eligibility',MATCHING:'Finding Verified Worker',OFFERING:'Waiting for Worker Response',PENDING_WORKER_ACCEPTANCE:'Waiting for Worker Response',FINDING_REPLACEMENT:'Finding Another Verified Worker',ASSIGNED:'Worker Assigned',ACCEPTED:'Worker Assigned',ON_THE_WAY:'Worker On The Way',TRAVELING:'Worker On The Way',ARRIVED:'Worker Arrived',IDENTITY_VERIFIED:'Worker Identity Verified',CUSTOMER_CONFIRMED:'Worker Confirmed',SERVICE_STARTED:'Service Started',IN_PROGRESS:'Service In Progress',AWAITING_CUSTOMER_CONFIRMATION:'Waiting for Completion Confirmation',COMPLETED:'Service Completed',PAYMENT_PENDING:'Payment Pending',PAID:'Payment Completed',CLOSED:'Closed',CANCELLED:'Cancelled',NO_WORKER_AVAILABLE:'No Eligible Worker Available'
  };
  let currentUser=null,currentPersona=null,unsubscribeSync=null,activeBookingId=null;
  let voiceMeta={source:'TEXT',language:'mr',transcript:''};
  let lastCustomerSignature='',lastWorkerSignature='';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const localDate=(offsetDays=0)=>{const d=new Date();d.setDate(d.getDate()+offsetDays);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const statusLabel=status=>STATUS_LABELS[String(status||'').toUpperCase()]||String(status||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  const sessionGet=key=>{try{return sessionStorage.getItem(key)||'';}catch{return '';}};
  const sessionSet=(key,value)=>{try{value?sessionStorage.setItem(key,String(value)):sessionStorage.removeItem(key);}catch{}};

  function friendlyError(err,context='request'){
    const status=Number(err?.status||0),raw=String(err?.message||'').toLowerCase();
    if(status===401){window.SanPaidAuth?.handleExpiredSession?.();return 'Your session expired. Please log in again.';}
    if(status===403)return 'This action is not available for this role.';
    if(status===404)return context==='booking'?'This booking is no longer available.':'The requested item could not be found.';
    if(status===409)return context==='offer'?'This job is no longer available. Refreshing your offers…':err?.message||'This action was already completed on another device.';
    if(status===422)return err?.message||'Please check the entered details.';
    if(status===429)return 'Too many requests. Please wait a moment and retry.';
    if(status>=500||/timeout|connect|unavailable|failed/.test(raw))return 'Service temporarily unavailable. Please retry.';
    return context==='booking'?'Booking could not be created. Please retry.':err?.message||'Something went wrong. Please retry.';
  }
  async function request(path,opt={}){
    if(window.SanPaidApi?.request)return window.SanPaidApi.request(path,opt);
    const response=await fetch(path,{...opt,credentials:'include',headers:{...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})},cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(data.message||data.error||`Request failed (${response.status})`);error.status=response.status;error.data=data;throw error;}
    return data;
  }
  const post=(path,body={})=>window.SanPaidApi?.post?window.SanPaidApi.post(path,body):request(path,{method:'POST',body:JSON.stringify(body)});

  function shell(){
    let root=document.getElementById('connectedShell');
    if(root)return root;
    root=document.createElement('section');root.id='connectedShell';root.className='connected-shell hidden';root.setAttribute('aria-label','SanPaid customer and worker workspace');
    root.innerHTML=`<header class="connected-top"><div><div class="brand">San<span>Paid</span></div><div id="connectedHeaderSubtitle" class="connected-top-subtitle">Connected service network</div></div><div class="actions"><span id="connectedTopStatus" class="connected-live">Checking…</span><button type="button" class="btn ghost small close-connected" id="connectedClose" aria-label="Close dashboard">✕</button></div></header><main class="connected-main" id="connectedContent"></main><div id="connectedModalRoot"></div>`;
    document.body.appendChild(root);root.querySelector('#connectedClose').onclick=close;return root;
  }
  function setHeaderSubtitle(text){const el=shell().querySelector('#connectedHeaderSubtitle');if(el)el.textContent=text;}
  function setLiveState(state){const el=shell().querySelector('#connectedTopStatus');if(!el)return;const map={online:['● Live','#8ee2b5'],checking:['Checking…','#b8c6d8'],offline:['● Offline','#ff9b9b'],retry:['● Reconnecting…','#ffb66e']};const [text,color]=map[state]||map.checking;el.textContent=text;el.style.color=color;}
  async function checkHealth(){try{const h=await request('/api/connected/health',{bearer:false});setLiveState(h.ok?'online':'offline');}catch{setLiveState('offline');}}
  function requestedRole(persona){return persona==='CUSTOMER'?'CUSTOMER':persona==='WORKER_A'||persona==='WORKER_B'?'WORKER':null;}

  async function resolveUser(){
    try{return await window.SanPaidAuth?.restoreSession?.()||window.SanPaidAuth?.getCurrentUser?.()||null;}catch{}
    try{return (await request('/api/auth/me',{bearer:false})).user||null;}catch{return null;}
  }

  async function open(persona=null){
    currentPersona=persona||currentPersona;const want=requestedRole(currentPersona);
    const user=await resolveUser();const actual=String(user?.role||'').toUpperCase();
    if(!user||!['CUSTOMER','WORKER'].includes(actual)||(want&&actual!==want)){
      close({clearIntent:false});
      window.SanPaidAuth?.open?.(want||'CUSTOMER','login',currentPersona||null);
      return false;
    }
    currentUser=user;const root=shell();root.classList.remove('hidden');document.body.style.overflow='hidden';setLiveState('checking');await checkHealth();renderApp();connectStream();return true;
  }

  function close({clearIntent=true}={}){
    const root=document.getElementById('connectedShell');if(root)root.classList.add('hidden');document.body.style.overflow='';stopStream();closeDecisionModal();
    if(clearIntent)window.SanPaidAuth?.clearWorkspace?.();
  }

  function renderApp(){if(!currentUser)return;if(currentUser.role==='CUSTOMER')renderCustomer();else if(currentUser.role==='WORKER')renderWorker();}
  function appHeader(){return `<div class="connected-status connected-session-bar"><div class="connected-session-user"><span class="connected-badge">AUTHORIZED WORKSPACE</span><span class="connected-live">${esc(currentUser.fullName||currentUser.email||'SanPaid user')}</span></div><div class="connected-actions connected-header-actions"><button type="button" class="btn secondary small" id="connectedSwitch">Switch Role</button><button type="button" class="btn danger small" id="connectedLogout">Logout</button></div></div>`;}
  function wireHeader(){
    document.getElementById('connectedSwitch')?.addEventListener('click',async()=>{close();await window.SanPaidAuth?.logout?.({silent:true});window.SanPaidAuth?.open?.('CUSTOMER','login');});
    document.getElementById('connectedLogout')?.addEventListener('click',async()=>{close();await window.SanPaidAuth?.logout?.();});
  }

  async function loadServiceCatalog(){
    const select=document.getElementById('cdService');if(!select)return;
    try{
      const data=await request('/api/public/services',{bearer:false}),rows=data.services||[],prefill=sessionGet('sanpaid_prefill_service_v1'),current=prefill||select.value;
      select.innerHTML=rows.length?`<option value="" disabled>Select a service</option>${rows.map(service=>`<option value="${esc(service.name)}">${esc(service.name)} · configured base ₹${Number(service.basePrice||0).toLocaleString('en-IN')}</option>`).join('')}`:'<option value="" disabled>No active services configured</option>';
      if(rows.some(service=>service.name===current))select.value=current;else select.value='';
      if(prefill)sessionSet('sanpaid_prefill_service_v1','');
      window.dispatchEvent(new CustomEvent('sanpaid:services-loaded',{detail:{services:rows,source:data.source||'DATABASE_CONFIGURATION'}}));
    }catch{select.innerHTML='<option value="" disabled selected>Service catalog unavailable — retry</option>';}
  }

  function renderCustomer(){
    setHeaderSubtitle('Customer Dashboard');const content=shell().querySelector('#connectedContent');content.dataset.connectedRole='CUSTOMER';lastCustomerSignature='';
    const area=sessionGet('sanpaid_prefill_area_v1')||'';sessionSet('sanpaid_prefill_area_v1','');
    content.innerHTML=appHeader()+`<div class="connected-grid connected-customer-grid"><div class="connected-card"><span class="connected-step-label">BOOK SERVICE</span><h3>Tell us what you need</h3><form id="connectedBookingForm" class="connected-form"><div class="field"><label>Service</label><select id="cdService" required><option value="">Loading services…</option></select></div><div class="connected-form-row"><div class="field"><label>Requested Date</label><input id="cdDate" type="date" value="${localDate(1)}" min="${localDate(0)}" required></div><div class="field"><label>Preferred Time</label><select id="cdTime"><option value="09:00">9 AM</option><option value="11:00">11 AM</option><option value="13:00">1 PM</option><option value="15:00">3 PM</option><option value="17:00">5 PM</option></select></div></div><div class="field"><label>Location / Area</label><input id="cdZone" value="${esc(area)}" placeholder="Enter area or locality" autocomplete="address-level2" required></div><div class="field"><label>Service Address</label><input id="cdAddress" placeholder="Enter service address" autocomplete="street-address" required></div><div class="field"><label>Language</label><select id="cdLang"><option value="mr">Marathi</option><option value="hi">Hindi</option><option value="en">English</option></select></div><div class="field"><label>Describe the problem</label><textarea id="cdProblem" required placeholder="Describe the service request"></textarea></div><label class="connected-check"><input id="cdEmergency" type="checkbox"><span><b>Urgent service</b><small>Uses the configured urgent-service policy.</small></span></label><div class="connected-actions"><button type="button" class="btn secondary" id="cdVoice">🎙 Speak Request</button><button class="btn primary" type="submit" id="cdSubmit">Find Verified Worker</button></div><div id="cdVoiceStatus" class="connected-demo-note">Voice is optional. Review the captured text before sending.</div><div id="cdBookingProgress"></div><div id="cdBookingError"></div></form></div><div class="connected-card"><span class="connected-step-label">LIVE STATUS</span><h3>Your Service Request</h3><div id="connectedCustomerState" class="connected-booking-state"><div class="connected-empty"><b>No active booking</b><br>Book a verified local service to begin.</div></div></div></div>`;
    wireHeader();document.getElementById('cdVoice').onclick=startCustomerVoice;document.getElementById('connectedBookingForm').onsubmit=createConnectedBooking;loadServiceCatalog();loadLatestCustomerBooking();
  }

  function langCode(short){return short==='mr'?'mr-IN':short==='hi'?'hi-IN':'en-IN';}
  function startCustomerVoice(){
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition,status=document.getElementById('cdVoiceStatus'),btn=document.getElementById('cdVoice');
    if(!Recognition){status.textContent='Microphone recognition is unavailable here. Type the request instead.';return;}
    const recognition=new Recognition(),lang=document.getElementById('cdLang').value;recognition.lang=langCode(lang);recognition.interimResults=false;recognition.maxAlternatives=1;btn.disabled=true;btn.textContent='Listening…';
    recognition.onresult=event=>{const transcript=String(event.results?.[0]?.[0]?.transcript||'').trim();if(transcript){document.getElementById('cdProblem').value=transcript;voiceMeta={source:'VOICE',language:lang,transcript};status.textContent='Voice captured. Review the text before sending.';}};
    recognition.onerror=()=>{status.textContent='Voice capture unavailable. Text input still works.';};recognition.onend=()=>{btn.disabled=false;btn.textContent='🎙 Speak Request';};
    try{recognition.start();}catch{btn.disabled=false;btn.textContent='🎙 Speak Request';status.textContent='Microphone could not start. Type the request instead.';}
  }

  async function createConnectedBooking(event){
    event.preventDefault();const error=document.getElementById('cdBookingError'),progress=document.getElementById('cdBookingProgress'),btn=document.getElementById('cdSubmit');error.innerHTML='';
    const service=document.getElementById('cdService').value,problem=document.getElementById('cdProblem').value.trim(),lang=document.getElementById('cdLang').value,date=document.getElementById('cdDate').value,time=document.getElementById('cdTime').value;
    if(!service){error.innerHTML='<div class="connected-error">Choose a service after the catalog loads.</div>';return;}
    if(problem.length<3){error.innerHTML='<div class="connected-error">Describe the service problem before continuing.</div>';return;}
    const scheduled=new Date(`${date}T${time}:00`);if(!date||!time||Number.isNaN(scheduled.getTime())||scheduled.getTime()<Date.now()-60000){error.innerHTML='<div class="connected-error">Choose a current or future service date and time.</div>';return;}
    const isVoice=voiceMeta.source==='VOICE'&&voiceMeta.transcript===problem;btn.disabled=true;btn.textContent='Finding verified workers…';progress.innerHTML='<div class="connected-progress-note"><b>Checking worker eligibility</b><span>Identity · Skill · Availability · Credentials · Schedule · Service Radius</span></div>';
    try{
      const booking=await post('/api/connected/bookings',{service,zone:document.getElementById('cdZone').value.trim(),address:document.getElementById('cdAddress').value.trim(),problem,requestSource:isVoice?'VOICE':'TEXT',requestLanguage:lang,voiceTranscript:isVoice?problem:null,scheduledAt:scheduled.toISOString(),emergency:document.getElementById('cdEmergency').checked});
      activeBookingId=Number(booking.id);sessionSet(BOOKING_KEY,activeBookingId);progress.innerHTML='<div class="connected-success">Request created. Eligible workers are being offered this booking in canonical rank order.</div>';renderCustomerState(booking,true);await refreshCustomerBooking();signalSync('customer-booking');
    }catch(err){error.innerHTML=`<div class="connected-error">${esc(friendlyError(err,'booking'))}</div>`;progress.innerHTML='';}
    finally{btn.disabled=false;btn.textContent='Find Verified Worker';}
  }

  async function loadLatestCustomerBooking(){
    const saved=Number(sessionGet(BOOKING_KEY)||0);if(saved){activeBookingId=saved;await refreshCustomerBooking();return;}
    try{const snapshot=await request('/api/connected/snapshot'),latest=snapshot.bookings?.[0];if(latest?.id){activeBookingId=Number(latest.id);sessionSet(BOOKING_KEY,activeBookingId);await refreshCustomerBooking();}}catch{}
  }
  async function refreshCustomerBooking(){
    if(!activeBookingId)return;
    try{const booking=await request(`/api/connected/customer/bookings/${activeBookingId}`);renderCustomerState(booking);}
    catch(err){if(err.status===404){sessionSet(BOOKING_KEY,'');activeBookingId=null;lastCustomerSignature='';}else if(err.status===401)friendlyError(err);}
  }
  function bookingStep(status){const value=String(status||'').toUpperCase();if(['PAID','CLOSED'].includes(value))return 6;if(['COMPLETED','PAYMENT_PENDING','SERVICE_STARTED','IN_PROGRESS','AWAITING_CUSTOMER_CONFIRMATION'].includes(value))return 5;if(['IDENTITY_VERIFIED','CUSTOMER_CONFIRMED'].includes(value))return 4;if(value==='ARRIVED')return 3;if(['ASSIGNED','ACCEPTED','ON_THE_WAY','TRAVELING'].includes(value))return 2;if(['OFFERING','PENDING_WORKER_ACCEPTANCE','FINDING_REPLACEMENT','NO_WORKER_AVAILABLE'].includes(value))return 1;return 0;}
  function stepper(status){const current=bookingStep(status),labels=['Request','Worker Match','Accepted','Arrival','Verification','Service','Payment'];return `<div class="connected-stepper">${labels.map((label,index)=>`<div class="connected-step ${index<current?'done':index===current?'active':''}"><span>${index<current?'✓':index+1}</span><small>${label}</small></div>`).join('')}</div>`;}
  function renderCustomerState(booking,force=false){
    const root=document.getElementById('connectedCustomerState');if(!root)return;const signature=JSON.stringify([booking.id,booking.status,booking.workerName,booking.workerVerification,booking.distance,booking.cooperative,booking.scheduledAt,booking.emergency,booking.updatedAt]);if(!force&&signature===lastCustomerSignature)return;lastCustomerSignature=signature;
    const status=String(booking.status||''),replacement=status==='FINDING_REPLACEMENT',assigned=!!booking.workerName;
    root.innerHTML=`${stepper(status)}<div class="connected-success connected-request-summary"><div><small>Booking ID</small><b>${esc(booking.bookingCode||`#${booking.id}`)}</b></div><span class="badge ${replacement?'b-orange':'b-green'}">${esc(statusLabel(status))}</span></div><div class="connected-state-line"><b>${replacement?'Finding another verified worker…':'Current status'}</b><p>${esc(statusLabel(status))}</p></div><div class="connected-state-line"><div class="connected-summary-grid"><div><small>Service</small><b>${esc(booking.service||'Service')}</b></div><div><small>Scheduled</small><b>${booking.scheduledAt?esc(new Date(booking.scheduledAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})):'—'}</b></div><div><small>Urgency</small><b>${booking.emergency?'Urgent':'Standard'}</b></div><div><small>Request</small><b>${esc(booking.requestSource==='VOICE'?'Voice':'Text')}</b></div></div></div>${assigned?`<div class="connected-state-line connected-worker-assigned"><span class="connected-step-label">ASSIGNED WORKER</span><h4>${esc(booking.workerName)}</h4><p>${esc(booking.workerVerification||'VERIFIED')} · ${booking.distance!=null?`DISTANCE ${esc(booking.distance)} km · `:''}${esc(booking.cooperative||'Cooperative')}</p></div>`:`<div class="connected-state-line"><b>${replacement?'Replacement search active':'Waiting for worker response'}</b><p>No worker appears assigned until that worker accepts.</p></div>`}`;
  }

  function renderWorker(){
    setHeaderSubtitle('Worker Dashboard');const content=shell().querySelector('#connectedContent');content.dataset.connectedRole='WORKER';lastWorkerSignature='';
    content.innerHTML=appHeader()+`<div class="connected-card"><div class="connected-heading-row"><div><span class="connected-step-label">JOB REQUESTS</span><h3>Available Work</h3><p>Opportunities appear only after eligibility checks. Accept or Decline remains your choice.</p></div><button type="button" class="btn secondary small" id="connectedRefreshOffers">Refresh</button></div><div id="connectedWorkerMessage"></div><div id="connectedWorkerOffers" class="connected-list"><div class="connected-empty">Loading job offers…</div></div></div>`;
    wireHeader();document.getElementById('connectedRefreshOffers').onclick=()=>loadWorkerOffers(true);loadWorkerOffers(true);
  }
  async function loadWorkerOffers(force=false){
    const root=document.getElementById('connectedWorkerOffers');if(!root)return;
    try{const offers=await request('/api/connected/worker/offers'),signature=JSON.stringify((offers||[]).map(offer=>[offer.offerId,offer.offerStatus,offer.status,offer.bookingId,offer.distance,offer.total,offer.scheduledAt]));if(!force&&signature===lastWorkerSignature)return;lastWorkerSignature=signature;root.innerHTML=offers.length?offers.map(offerCard).join(''):'<div class="connected-empty"><b>No job requests right now</b><br>Stay available. Suitable opportunities will appear here.</div>';wireOfferActions();}
    catch(err){root.innerHTML=`<div class="connected-error">${esc(friendlyError(err,'offer'))}</div>`;}
  }
  function offerReason(code){const map={IDENTITY_VERIFIED:'Identity verified',SKILL_VERIFIED:'Skill verified',AVAILABLE:'Available now',WITHIN_RADIUS:'Within service radius',SCHEDULE_AVAILABLE:'Schedule available',DOCUMENTS_VALID:'Credentials valid'};return map[String(code||'').toUpperCase()]||String(code||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());}
  function offerCard(offer){
    const accepted=offer.offerStatus==='ACCEPTED',reasons=Array.isArray(offer.matching?.reasonCodes)?offer.matching.reasonCodes.slice(0,4):[],rank=Number(offer.rank||0),score=Number(offer.matching?.score||0);return `<article class="connected-offer" data-offer="${Number(offer.offerId)}"><div class="connected-offer-head"><div><span class="badge ${accepted?'b-green':'b-orange'}">${accepted?'ACCEPTED':'NEW JOB REQUEST'}</span><h4>${esc(offer.service)}</h4><p>${esc(offer.zone||'Customer area')} ${offer.distance!=null?`· DISTANCE ${esc(offer.distance)} km`:''}</p></div><div class="connected-earnings"><small>Service Amount</small><b>₹${Number(offer.total||0).toLocaleString('en-IN')}</b></div></div><div class="connected-meta"><div>Schedule<b>${offer.scheduledAt?new Date(offer.scheduledAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—'}</b></div><div>Cooperative<b>${esc(offer.cooperative||'—')}</b></div><div>Urgency<b>${offer.emergency?'Urgent':'Standard'}</b></div><div>Distance<b>${offer.distance!=null?`${esc(offer.distance)} km`:'—'}</b></div></div><div class="connected-state-line connected-offer-reason"><b>Why you received this offer</b><p>Eligibility gate passed${rank?` · Rank #${rank}`:''}${Number.isFinite(score)&&score>0?` · Match score ${score.toFixed(1)}`:''}.</p>${reasons.length?`<div class="connected-reason-tags">${reasons.map(r=>`<span>${esc(offerReason(r))}</span>`).join('')}</div>`:''}</div><div class="connected-state-line"><b>Customer Request</b><p>${esc(offer.problem||offer.voiceTranscript||'No additional description')}</p></div>${offer.offerStatus==='PENDING'?`<div class="connected-actions connected-offer-actions"><button type="button" class="btn danger" data-reject-offer="${Number(offer.offerId)}">Decline</button><button type="button" class="btn primary" data-accept-offer="${Number(offer.offerId)}">Accept Job</button></div>`:'<div class="connected-success">Job accepted. This booking is assigned to you.</div>'}</article>`;
  }
  function wireOfferActions(){document.querySelectorAll('[data-accept-offer]').forEach(button=>button.onclick=()=>respondOffer(button,'ACCEPT'));document.querySelectorAll('[data-reject-offer]').forEach(button=>button.onclick=()=>openDecisionModal(button));}
  function openDecisionModal(button){const root=document.getElementById('connectedModalRoot');root.innerHTML=`<div class="connected-modal-backdrop"><div class="connected-modal" role="dialog" aria-modal="true" aria-labelledby="declineTitle"><h3 id="declineTitle">Why are you declining this job?</h3><p>The reason is recorded. The same customer booking continues to the next eligible worker where possible.</p><div class="connected-choice-list">${['Schedule Conflict','Too Far','Unavailable','Not My Skill','Personal Reason','Other'].map((reason,index)=>`<label><input type="radio" name="declineReason" value="${reason}" ${index===0?'checked':''}><span>${reason}</span></label>`).join('')}</div><div class="connected-actions"><button type="button" class="btn secondary" data-modal-cancel>Cancel</button><button type="button" class="btn danger" data-modal-confirm>Decline Job</button></div></div></div>`;root.querySelector('[data-modal-cancel]').onclick=closeDecisionModal;root.querySelector('[data-modal-confirm]').onclick=()=>{const reason=root.querySelector('input[name="declineReason"]:checked')?.value||'Other';closeDecisionModal();respondOffer(button,'REJECT',reason);};}
  function closeDecisionModal(){const root=document.getElementById('connectedModalRoot');if(root)root.innerHTML='';}
  function workerMessage(text,type='success'){const element=document.getElementById('connectedWorkerMessage');if(element)element.innerHTML=`<div class="${type==='error'?'connected-error':type==='warn'?'connected-demo-note':'connected-success'}">${esc(text)}</div>`;}
  async function respondOffer(button,action,reason=''){
    if(button.disabled)return;const id=button.dataset.acceptOffer||button.dataset.rejectOffer,old=button.textContent;button.disabled=true;button.textContent=action==='ACCEPT'?'Accepting Job…':'Declining Job…';
    try{const result=await post(`/api/connected/worker/offers/${id}/respond`,{action,reason});lastWorkerSignature='';await loadWorkerOffers(true);workerMessage(action==='REJECT'?(result.nextWorker?'Job declined. The same booking is moving to the next eligible worker.':'Job declined. No assignment penalty is applied.'):'Job accepted. The customer has been notified.',action==='REJECT'?'warn':'success');signalSync('worker-offer');}
    catch(err){workerMessage(friendlyError(err,'offer'),'error');button.disabled=false;button.textContent=old;lastWorkerSignature='';await loadWorkerOffers(true);}
  }

  function signalSync(source){
    try{window.dispatchEvent(new CustomEvent('sanpaid:connected-sync',{detail:{source,at:Date.now()}}));}catch{}
    window.SanPaidSync?.refreshNow?.();
  }
  function applySnapshot(snapshot){
    if(snapshot?.role==='CUSTOMER'){
      const latest=snapshot.bookings?.[0];
      if(latest){activeBookingId=Number(latest.id);sessionSet(BOOKING_KEY,activeBookingId);refreshCustomerBooking();}
    }else if(snapshot?.role==='WORKER')loadWorkerOffers();
  }
  function connectStream(){
    stopStream();
    if(!window.SanPaidSync?.subscribe){setLiveState('retry');return;}
    unsubscribeSync=window.SanPaidSync.subscribe(snapshot=>{applySnapshot(snapshot);setLiveState('online');});
    window.SanPaidSync.refreshNow();
  }
  function stopStream(){if(unsubscribeSync){unsubscribeSync();unsubscribeSync=null;}}

  window.ConnectedSanPaid={open,close,refreshCustomerBooking,loadWorkerOffers,reloadServices:loadServiceCatalog};
})();

```
