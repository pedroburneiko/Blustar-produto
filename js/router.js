// router.js — roteador hash-based de worlds (Fase 3).
// Classic script (não module): expõe navigate/applyRoute/alignTopnavCenter
// como globais (navigate é usado por onclick no HTML; applyRoute é chamado
// no boot pelo script principal). Carregado ANTES do script principal.
/* =========================================================================
   ROUTER — hash-based world switcher
   ========================================================================= */
function navigate(route) {
  window.location.hash = route;
}
function applyRoute() {
  const hash = (window.location.hash || '#home').replace('#', '');
  const knownRoutes = [...document.querySelectorAll('.world')].map(w => w.dataset.world);
  if (!knownRoutes.includes(hash)) {
    const section = document.getElementById(hash);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const route = hash;
  let collapseSidebar = false;
  document.querySelectorAll('.world').forEach(w => {
    const isActive = w.dataset.world === route;
    w.classList.toggle('active', isActive);
    if (isActive && w.dataset.collapseSidebar === 'true') collapseSidebar = true;
  });
  document.body.classList.toggle('sidebar-collapsed', collapseSidebar);
  document.body.className = document.body.className.replace(/\broute-\S+/g, '').trim();
  document.body.classList.add('route-' + route);
  requestAnimationFrame(alignTopnavCenter);
  document.querySelectorAll('.nav-item[data-route]').forEach(b => {
    b.classList.toggle('active', b.dataset.route === route);
  });
  document.getElementById('main').scrollTop = 0;
}
document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
  btn.addEventListener('click', () => {
    // If user navigates from inside DS canvas, leave DS mode first so the
    // target route renders normally instead of staying in the DS overlay.
    if (document.body.classList.contains('ds-mode')) {
      document.getElementById('ds-canvas-btn')?.click();
    }
    navigate(btn.dataset.route);
  });
});
window.addEventListener('hashchange', applyRoute);
function alignTopnavCenter() {
  const center = document.querySelector('.topnav-center');
  if (!center) return;
  const back = document.querySelector('.tn-back');
  const actions = document.querySelector('.topnav-actions');
  if (!back || !actions || getComputedStyle(back).display === 'none') {
    center.style.transform = '';
    return;
  }
  const backR = back.getBoundingClientRect();
  const actR = actions.getBoundingClientRect();
  const target = (backR.right + actR.left) / 2;
  const cur = center.getBoundingClientRect();
  const curCenter = cur.left + cur.width / 2;
  const delta = target - curCenter;
  center.style.transform = `translateX(${delta}px)`;
}
window.addEventListener('resize', alignTopnavCenter);
