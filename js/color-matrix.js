// color-matrix.js — paleta de matriz de cores do Gen Studio (Fase 3).
// IIFE autocontido, ZERO arestas: não lê/expõe window.__praia*; só renderiza
// em #color-matrix-grid e delega cliques em .color-tab. Ordem de carga irrelevante.
/* Color matrix palette */
(function(){
  const palettes = {
    brand: ['#061833','#0FC4D5','#3259FF','#04001E','#A6D9DE','#BFFAFF','#DFFCFF','#FFFFFF','#F59F3A','#E63946','#7CB342','#000000'],
    illustration: ['#7CB342','#3259FF','#E63946','#F59F3A','#FFD166','#06A77D','#9D4EDD','#0FC4D5','#FF6B6B','#F4A261','#264653','#2A9D8F'],
    marketing: ['#0FC4D5','#3259FF','#061833','#F59F3A','#E63946','#FFD166','#FFFFFF','#A6D9DE','#BFFAFF','#04001E','#7CB342','#FF6B6B'],
    product: ['#061833','#3259FF','#0FC4D5','#FFFFFF','#A6D9DE','#BFFAFF','#DFFCFF','#04001E','#E5E7EB','#9CA3AF','#6B7280','#374151'],
  };
  function tint(hex, alpha) {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function render(name) {
    const grid = document.getElementById('color-matrix-grid');
    if (!grid) return;
    const base = palettes[name] || palettes.brand;
    grid.innerHTML = '';
    const rows = 8;
    const cols = 18;
    const colors = [];
    for (let c = 0; c < cols; c++) {
      colors.push(base[c % base.length]);
    }
    for (let r = 0; r < rows; r++) {
      const alpha = (r + 1) / rows;
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cm-cell';
        cell.style.background = tint(colors[c], 0.1 + alpha * 0.9);
        cell.title = colors[c];
        grid.appendChild(cell);
      }
    }
  }
  document.addEventListener('click', e => {
    const tab = e.target.closest('.color-tab');
    if (!tab) return;
    tab.parentElement.querySelectorAll('.color-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    render(tab.dataset.palette);
  });
  function init() { if (document.getElementById('color-matrix-grid')) render('brand'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
