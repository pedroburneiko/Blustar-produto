// breakpoint-dropdown.js — dropdown de breakpoint da topbar (Fase 3, 🟡).
// IIFE autocontido; sem arestas de bridge.
/* Breakpoint dropdown */
(() => {
  const trig = document.getElementById('bp-trigger');
  const dd = document.getElementById('bp-dd');
  const label = document.getElementById('bp-label');
  if (!trig || !dd) return;
  trig.addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('open'); });
  document.addEventListener('click', e => { if (!dd.contains(e.target)) dd.classList.remove('open'); });
  dd.querySelectorAll('.gt-dd-item').forEach(it => {
    it.addEventListener('click', () => {
      const bp = it.dataset.bp;
      if (bp === 'grid') { dd.classList.remove('open'); return; }
      dd.querySelectorAll('.gt-dd-item').forEach(x => x.dataset.bp !== 'grid' && x.classList.toggle('active', x === it));
      label.textContent = bp;
      dd.classList.remove('open');
    });
  });
})();
