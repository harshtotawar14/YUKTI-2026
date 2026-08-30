(() => {
  'use strict';

  let declineReturnFocus=null;

  function injectStyles(){
    if(document.getElementById('sanpaidFinalPolishStyles'))return;
    const style=document.createElement('style');
    style.id='sanpaidFinalPolishStyles';
    style.textContent=`
      .connected-trust-checks{display:grid;gap:8px;margin:12px 0}
      .connected-trust-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid #ead8a8;background:#fff9ea;border-radius:11px}
      .connected-trust-row.done{border-color:#c4e8d5;background:#eef9f3}
      .connected-payment-success{line-height:1.65}
      @media print{
        body>*{display:none!important}
        #connectedShell{display:block!important;position:static!important;background:#fff!important}
        #connectedShell .connected-top,#connectedShell .connected-actions,#connectedModalRoot{display:none!important}
        .connected-shell,.connected-main{overflow:visible!important;width:100%!important;max-width:none!important;padding:0!important}
        .connected-card{box-shadow:none!important;break-inside:avoid}
      }
    `;
    document.head.appendChild(style);
  }

  function focusable(root){
    return [...root.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(el=>!el.hidden&&el.getClientRects().length);
  }

  function trapFocus(event,root){
    if(event.key!=='Tab')return;
    const nodes=focusable(root);
    if(!nodes.length)return;
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }

  function start(){
    injectStyles();

    document.addEventListener('keydown',event=>{
      const connectedDialog=document.querySelector('#connectedModalRoot [role="dialog"]');
      if(event.key==='Tab'&&connectedDialog){
        trapFocus(event,connectedDialog);
        return;
      }
      if(event.key!=='Escape')return;
      const connectedCancel=document.querySelector('#connectedModalRoot [data-modal-cancel]');
      if(connectedCancel)connectedCancel.click();
    });

    document.addEventListener('click',event=>{
      const decline=event.target.closest?.('[data-reject-offer]');
      if(decline){
        declineReturnFocus=decline;
        setTimeout(()=>{
          const first=document.querySelector('#connectedModalRoot input[name="declineReason"]');
          first?.focus();
        },0);
        return;
      }

      const connectedCancel=event.target.closest?.('#connectedModalRoot [data-modal-cancel]');
      if(connectedCancel&&declineReturnFocus){
        const target=declineReturnFocus;
        declineReturnFocus=null;
        setTimeout(()=>{if(target.isConnected)target.focus();},0);
      }
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
