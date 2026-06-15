// type-inspector.js
// Extraído do script principal (Fase 3, 🟡 só consome). Move verbatim.
// lê window.__praiaAutosave/__praiaRemeasureTextTemplates/__praiaSyncTextPanel (opt); não expõe.
/* Type editor — global tokens */
(() => {
  const right = document.querySelector('.guide-right');
  if (!right) return;
  const root = document.documentElement;
  const fields = {
    name: document.getElementById('gre-name'),
    family: document.getElementById('gre-family').querySelector('span'),
    weight: document.getElementById('gre-weight').querySelector('span'),
    size: document.getElementById('gre-size'),
    line: document.getElementById('gre-line'),
    track: document.getElementById('gre-track'),
    preview: document.getElementById('gre-preview'),
  };
  let currentToken = null;
  const weightMap = { 400: 'Regular', 500: 'Medium', 700: 'Bold' };
  const weightInverse = Object.fromEntries(Object.entries(weightMap).map(([k, v]) => [v, k]));

  function refreshTypeList() {
    document.querySelectorAll('.type-item').forEach(item => {
      const tok = item.dataset.token;
      const w = getComputedStyle(root).getPropertyValue(`--type-${tok}-weight`).trim();
      const label = weightMap[w] || 'Medium';
      let chip = item.querySelector('.gr-weight');
      if (!chip) {
        chip = document.createElement('span');
        chip.className = 'gr-weight';
        const actions = item.querySelector('.gr-item-actions');
        item.insertBefore(chip, actions);
      }
      chip.textContent = label;
    });
  }
  refreshTypeList();

  function readToken(tok) {
    const cs = getComputedStyle(root);
    return {
      family: cs.getPropertyValue(`--type-${tok}-family`).trim(),
      weight: cs.getPropertyValue(`--type-${tok}-weight`).trim(),
      size: parseFloat(cs.getPropertyValue(`--type-${tok}-size`)),
      line: cs.getPropertyValue(`--type-${tok}-line`).trim(),
      track: cs.getPropertyValue(`--type-${tok}-tracking`).trim(),
    };
  }

  // Snapshot of the token at editor-open time so Cancel can revert all live
  // edits (size/line/tracking/weight/family inputs apply immediately for
  // preview, but should not stick if the user backs out).
  let __editorSnapshot = null;

  function openEditor(tok, name) {
    currentToken = tok;
    const v = readToken(tok);
    __editorSnapshot = { tok, ...v };
    fields.name.value = name;
    fields.family.textContent = v.family.includes('display') ? 'Versos Display' : 'Versos';
    fields.weight.textContent = weightMap[v.weight] || v.weight;
    fields.size.value = Math.round(v.size);
    // Line-height stored as unitless multiplier (1.05) — display as % (105)
    const lineNum = isNaN(parseFloat(v.line)) ? 1 : parseFloat(v.line);
    fields.line.value = Math.round(lineNum * 100);
    // Tracking stored as em (-0.02em) — display as % (-2)
    fields.track.value = Math.round((parseFloat(v.track) || 0) * 100 * 10) / 10;
    fields.preview.style.fontFamily = v.family;
    fields.preview.style.fontWeight = v.weight;
    right.classList.add('editing');
    document.querySelectorAll('.type-item').forEach(i => i.classList.toggle('active', i.dataset.token === tok));
  }

  function revertEditor() {
    if (!__editorSnapshot) return;
    const s = __editorSnapshot;
    root.style.setProperty(`--type-${s.tok}-family`, s.family);
    root.style.setProperty(`--type-${s.tok}-weight`, s.weight);
    root.style.setProperty(`--type-${s.tok}-size`, s.size + 'px');
    root.style.setProperty(`--type-${s.tok}-line`, s.line);
    root.style.setProperty(`--type-${s.tok}-tracking`, s.track);
    refreshTypeList();
    remeasureTextTemplates();
    window.__praiaAutosave?.();
  }

  function closeEditor() {
    right.classList.remove('editing');
    document.querySelectorAll('.type-item').forEach(i => i.classList.remove('active'));
    currentToken = null;
    // If a text element is still selected, restore the Text panel.
    const sel = document.querySelector('.canvas-selected');
    if (sel) {
      const tag = sel.tagName;
      const isText = ['H1', 'H2', 'H3', 'P', 'SPAN'].includes(tag) || /\b(tk-|cl-|world-eyebrow|world-title|world-sub|tile-|specimen|meta|swatch-name|swatch-hex|label|stat|desc|accent|cta)\b/.test(sel.className);
      right.classList.add(isText ? 'text-mode' : 'layout-mode');
      window.__praiaSyncTextPanel?.(sel);
    }
  }

  // Re-mede + reflui os templates de texto após mudar a type (debounced para
  // não recalcular a cada keystroke nos inputs de size/line/tracking).
  let __remeasureTimer = 0;
  function remeasureTextTemplates() {
    clearTimeout(__remeasureTimer);
    __remeasureTimer = setTimeout(() => {
      window.__praiaRemeasureTextTemplates?.();
    }, 120);
  }

  function applyChange() {
    if (!currentToken) return;
    root.style.setProperty(`--type-${currentToken}-size`, fields.size.value + 'px');
    // Line % → unitless (105 → 1.05). Tracking % → em (-2 → -0.02em).
    const linePct = parseFloat(fields.line.value) || 100;
    const trackPct = parseFloat(fields.track.value) || 0;
    root.style.setProperty(`--type-${currentToken}-line`, String(linePct / 100));
    root.style.setProperty(`--type-${currentToken}-tracking`, trackPct / 100 + 'em');
    remeasureTextTemplates();
    window.__praiaAutosave?.();
  }
  function applyWeight(wName) {
    if (!currentToken) return;
    const w = weightInverse[wName] || '500';
    root.style.setProperty(`--type-${currentToken}-weight`, w);
    fields.weight.textContent = wName;
    fields.preview.style.fontWeight = w;
    refreshTypeList();
    remeasureTextTemplates();
    window.__praiaAutosave?.();
  }
  function applyFamily(fName) {
    if (!currentToken) return;
    const val = fName === 'Versos Display' ? 'var(--font-display)' : 'var(--font)';
    root.style.setProperty(`--type-${currentToken}-family`, val);
    fields.family.textContent = fName;
    fields.preview.style.fontFamily = val;
    remeasureTextTemplates();
    window.__praiaAutosave?.();
  }

  // Weight dropdown (Regular / Medium / Bold)
  const weightBtn = document.getElementById('gre-weight');
  const familyBtn = document.getElementById('gre-family');
  function openDD(anchor, items, onPick) {
    const existing = document.querySelector('.tk-popover.gre-dd');
    if (existing) existing.remove();
    const dd = document.createElement('div');
    dd.className = 'tk-popover gre-dd open';
    items.forEach(label => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => {
        onPick(label);
        dd.remove();
      });
      dd.appendChild(b);
    });
    document.body.appendChild(dd);
    const r = anchor.getBoundingClientRect();
    dd.style.top = r.bottom + 4 + 'px';
    dd.style.left = r.left + 'px';
    setTimeout(() => {
      const off = e => {
        if (!dd.contains(e.target)) {
          dd.remove();
          document.removeEventListener('click', off);
        }
      };
      document.addEventListener('click', off);
    }, 0);
  }
  weightBtn?.addEventListener('click', e => {
    e.stopPropagation();
    openDD(weightBtn, ['Regular', 'Medium', 'Bold'], applyWeight);
  });
  familyBtn?.addEventListener('click', e => {
    e.stopPropagation();
    openDD(familyBtn, ['Versos', 'Versos Display'], applyFamily);
  });

  document.querySelectorAll('.type-item').forEach(item => {
    item.querySelector('.ti-edit').addEventListener('click', e => {
      e.stopPropagation();
      openEditor(item.dataset.token, item.dataset.name);
    });
    item.addEventListener('click', () => openEditor(item.dataset.token, item.dataset.name));
  });
  document.getElementById('gre-close').addEventListener('click', closeEditor);
  // Save = commit (changes already applied live) + close
  document.getElementById('gre-done').addEventListener('click', () => {
    __editorSnapshot = null;
    window.__praiaAutosave?.();
    closeEditor();
  });
  // Cancel = revert to snapshot + close
  document.getElementById('gre-remove').addEventListener('click', () => {
    revertEditor();
    __editorSnapshot = null;
    closeEditor();
  });
  [fields.size, fields.line, fields.track].forEach(f => f.addEventListener('input', applyChange));
  // Custom stepper buttons (▲/▼) — increment/decrement the sibling input by its step value
  document.querySelectorAll('.gre-step').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const input = btn.closest('.gre-num-step-wrap')?.querySelector('input');
      if (!input) return;
      const step = parseFloat(input.step) || 1;
      const cur = parseFloat(input.value) || 0;
      const next = btn.dataset.step === 'up' ? cur + step : cur - step;
      // Round to step precision (handles 0.1 → -2.0 not -1.9999)
      const decimals = (input.step.split('.')[1] || '').length;
      input.value = decimals ? next.toFixed(decimals) : Math.round(next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  document.querySelectorAll('.gre-case-toggle button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.gre-case-toggle button').forEach(x => x.classList.toggle('active', x === b));
    });
  });
})();
