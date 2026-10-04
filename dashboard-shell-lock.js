(() => {
  'use strict';

  const STYLE_ID = 'sanpaidDashboardShellLockStyles';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html.sanpaid-dashboard-open,
      body.sanpaid-dashboard-open{
        overflow:hidden!important;
        overscroll-behavior:none!important;
      }

      #connectedShell.sp-dashboard-shell-locked{
        height:100dvh!important;
        max-height:100dvh!important;
        overflow:hidden!important;
        display:flex!important;
        flex-direction:column!important;
        overscroll-behavior:none!important;
      }

      #connectedShell.sp-dashboard-shell-locked>.connected-top{
        flex:0 0 auto!important;
      }

      #connectedShell.sp-dashboard-shell-locked>.connected-main{
        flex:1 1 auto!important;
        min-height:0!important;
        max-height:none!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        overscroll-behavior:contain!important;
        -webkit-overflow-scrolling:touch;
      }

      #connectedShell.sp-dashboard-shell-locked.customer-mobile-bootstrap>.connected-main{
        height:100%!important;
      }
    `;
    document.head.appendChild(style);
  }

  function sync() {
    const shell = document.getElementById('connectedShell');
    if (!shell) return;

    const dashboard = shell.querySelector('#cwDashboard');
    const open = !shell.classList.contains('hidden') && !!dashboard;

    shell.classList.toggle('sp-dashboard-shell-locked', open);
    document.documentElement.classList.toggle('sanpaid-dashboard-open', open);
    document.body.classList.toggle('sanpaid-dashboard-open', open);

    if (!open) return;

    // Keep the outer app shell fixed. Navigation changes only the active dashboard view.
    shell.scrollTop = 0;
  }

  function install() {
    ensureStyles();
    sync();

    document.addEventListener('click', event => {
      const button = event.target instanceof Element
        ? event.target.closest('#connectedShell #cwDashboard [data-cw-view-btn]')
        : null;
      if (!button) return;

      requestAnimationFrame(() => {
        const main = document.querySelector('#connectedShell.sp-dashboard-shell-locked>.connected-main');
        if (main) main.scrollTop = 0;
        const shell = document.getElementById('connectedShell');
        if (shell) shell.scrollTop = 0;
      });
    }, true);

    new MutationObserver(sync).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'data-connected-role']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
