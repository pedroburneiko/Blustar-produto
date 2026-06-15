// paste-sanitizer.js — sanitiza paste/drop em contenteditable (Fase 3).
// IIFE self-contained: só adiciona listeners globais; sem deps externas.
/* =========================================================================
   GLOBAL PASTE/DROP SANITIZER — strip formatting + block images
   Ensures any contenteditable in the tool inherits DS tokens; never
   allows pasted HTML styling or dropped/pasted images to break layout.
   ========================================================================= */
(function() {
  const isEditable = (el) => {
    if (!el || el.nodeType !== 1) return false;
    return el.isContentEditable || el.closest('[contenteditable="true"], [contenteditable=""]');
  };
  document.addEventListener('paste', (e) => {
    const ed = isEditable(e.target);
    if (!ed) return;
    e.preventDefault();
    e.stopPropagation();
    const cd = e.clipboardData || window.clipboardData;
    if (!cd) return;
    // Block any image/file payload
    if (cd.files && cd.files.length) return;
    if (cd.items) {
      for (const it of cd.items) {
        if (it.kind === 'file' || (it.type && it.type.startsWith('image/'))) return;
      }
    }
    let txt = cd.getData('text/plain') || '';
    txt = txt.replace(/\r\n?/g, '\n');
    if (!txt) return;
    document.execCommand('insertText', false, txt);
  }, true);
  document.addEventListener('drop', (e) => {
    if (!isEditable(e.target)) return;
    const dt = e.dataTransfer;
    if (dt && ((dt.files && dt.files.length) || (dt.items && [...dt.items].some(i => i.kind === 'file')))) {
      e.preventDefault(); e.stopPropagation();
      return;
    }
    const txt = dt && dt.getData('text/plain');
    if (txt) {
      e.preventDefault(); e.stopPropagation();
      document.execCommand('insertText', false, txt.replace(/\r\n?/g, '\n'));
    }
  }, true);
  document.addEventListener('dragover', (e) => {
    if (!isEditable(e.target)) return;
    const dt = e.dataTransfer;
    if (dt && dt.types && [...dt.types].includes('Files')) {
      e.preventDefault();
      dt.dropEffect = 'none';
    }
  }, true);
})();

