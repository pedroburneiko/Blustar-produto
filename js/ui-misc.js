// ui-misc.js — pequenos listeners de UI (Fase 3, 🟡). Statements soltos movidos
// verbatim: Right inspector tabs + Chip toggles (Gen Studio) + Guide TOC highlight.
// Apenas registram listeners de toggle de classe; zero arestas de bridge.

/* Right inspector tabs */
document.querySelectorAll('.gr-tab').forEach(t => {
  t.addEventListener('click', () => {
    const pane = t.dataset.pane;
    document.querySelectorAll('.gr-tab').forEach(x => x.classList.toggle('active', x.dataset.pane === pane));
    document.querySelectorAll('.gr-pane').forEach(x => x.classList.toggle('active', x.dataset.pane === pane));
    document.querySelector('.guide-right').setAttribute('data-active', pane);
  });
});

/* Chip toggles inside Gen Studio */
document.querySelectorAll('.chip-row').forEach(row => {
  row.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    row.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

/* Guide TOC highlight */
document.querySelectorAll('.guide-toc a').forEach(a => {
  a.addEventListener('click', e => {
    document.querySelectorAll('.guide-toc a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
  });
});
