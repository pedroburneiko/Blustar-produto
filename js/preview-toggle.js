// preview-toggle.js — toggle do modo preview (esconde chrome) (Fase 3, 🟡).
// IIFE; lê window.__praiaCloseHistory (opt, em handler); não expõe.
/* Preview mode toggle — preserves scroll position when chrome shows/hides */
(() => {
  const playBtn = document.getElementById('preview-btn');
  if (!playBtn) return;
  function getScroller() {
    return document.querySelector('main') || document.scrollingElement || document.documentElement;
  }
  const toggle = () => {
    const sc = getScroller();
    const prev = sc.scrollTop;
    const on = document.body.classList.toggle('preview-mode');
    playBtn.classList.toggle('active', on);
    playBtn.setAttribute('aria-pressed', on);
    // Histórico de versões é só do modo edição — fecha o painel ao entrar no preview.
    if (on) window.__praiaCloseHistory?.();
    // Restore scroll after layout settles (sidebar/right panel display change)
    requestAnimationFrame(() => { sc.scrollTop = prev; });
  };
  playBtn.addEventListener('click', toggle);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('preview-mode')) toggle();
  });
})();
