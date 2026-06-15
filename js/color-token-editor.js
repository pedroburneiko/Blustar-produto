// color-token-editor.js
// Extraído do script principal (Fase 3, 🟡 só consome). Move verbatim.
// lê window.__praiaAutosave/__praiaCloseRightModes (opt); não expõe.
/* Color token editor — opens when user clicks a swatch in the DS canvas.
   Updates --bs-* (or surface/text) tokens globally; persists via autosave. */
(() => {
  const right = document.querySelector('.guide-right');
  if (!right) return;
  const root = document.documentElement;
  const preview = document.getElementById('grec-preview');
  const nameInput = document.getElementById('grec-name');
  const hexInput = document.getElementById('grec-hex');
  const picker = document.getElementById('grec-hex-picker');
  const saveBtn = document.getElementById('grec-save');
  const cancelBtn = document.getElementById('grec-cancel');
  const closeBtn = document.getElementById('grec-close');
  if (!preview || !nameInput || !hexInput) return;

  let currentToken = null; // e.g. '--bs-cyan'
  let snapshot = null; // { token, hex, name }

  const norm = h => {
    let v = (h || '').trim().replace(/^#?/, '#');
    if (!/^#[0-9a-fA-F]{3,8}$/.test(v)) return null;
    if (v.length === 4)
      v =
        '#' +
        v
          .slice(1)
          .split('')
          .map(c => c + c)
          .join('');
    return v.toUpperCase();
  };

  function readToken(token) {
    // Read the resolved color value from a temp element so we get a hex back.
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    const m = rgb.match(/rgb(?:a)?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return '#000000';
    return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0').toUpperCase()).join('');
  }

  function syncSwatchesUI() {
    // Refresh visible swatches in the DS canvas to reflect new hex/name.
    document.querySelectorAll('.ds-color-swatch').forEach(s => {
      const tok = s.dataset.token;
      if (!tok) return;
      const hex = readToken(tok);
      const meta = s.querySelector('.ds-color-meta');
      if (meta) meta.textContent = `${tok} · ${hex}`;
      const nameEl = s.querySelector('.ds-color-name');
      if (nameEl && s.dataset.name) nameEl.textContent = s.dataset.name;
    });
  }

  function openEditor(token, name) {
    currentToken = token;
    const hex = readToken(token);
    snapshot = { token, hex, name };
    preview.style.background = hex;
    nameInput.value = name || '';
    hexInput.value = hex;
    picker.value = hex.length === 7 ? hex : '#000000';
    window.__praiaCloseRightModes?.();
    right.classList.add('editing-color');
  }

  function closeEditor() {
    right.classList.remove('editing-color');
    currentToken = null;
    snapshot = null;
  }

  function applyHex(hex) {
    if (!currentToken) return;
    const v = norm(hex);
    if (!v) return;
    root.style.setProperty(currentToken, v);
    preview.style.background = v;
    syncSwatchesUI();
  }
  function applyName(name) {
    if (!currentToken) return;
    // Update the dataset on the matching swatch so its label re-renders.
    document.querySelectorAll(`.ds-color-swatch[data-token="${currentToken}"]`).forEach(s => {
      s.dataset.name = name;
      const nameEl = s.querySelector('.ds-color-name');
      if (nameEl) nameEl.textContent = name;
    });
  }

  hexInput.addEventListener('input', () => {
    const v = norm(hexInput.value);
    if (v) {
      picker.value = v;
      applyHex(v);
    }
  });
  picker.addEventListener('input', () => {
    hexInput.value = picker.value.toUpperCase();
    applyHex(picker.value);
  });
  nameInput.addEventListener('input', () => applyName(nameInput.value));

  saveBtn.addEventListener('click', () => {
    snapshot = null;
    window.__praiaAutosave?.();
    closeEditor();
  });
  function revert() {
    if (!snapshot) return;
    root.style.setProperty(snapshot.token, snapshot.hex);
    applyName(snapshot.name);
    syncSwatchesUI();
    window.__praiaAutosave?.();
  }
  cancelBtn.addEventListener('click', () => {
    revert();
    closeEditor();
  });
  closeBtn.addEventListener('click', () => {
    revert();
    closeEditor();
  });

  // Delegated: click on any DS swatch opens the editor (DS mode only).
  document.addEventListener(
    'click',
    e => {
      if (!document.body.classList.contains('ds-mode')) return;
      const sw = e.target.closest('.ds-color-swatch');
      if (!sw) return;
      e.preventDefault();
      e.stopPropagation();
      openEditor(sw.dataset.token, sw.dataset.name);
    },
    true
  );
})();
