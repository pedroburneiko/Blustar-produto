// component-selection.js — HUB de seleção de componentes/instâncias de template
// (Figma-style) (Fase 3). Lift VERBATIM do IIFE inteiro — NÃO decomposto.
// Expõe (bridge): __praiaApplyEditScale/__praiaApplyScaledThumbs/__praiaGetCanvasScale/
// __praiaTplOverrides. Consome ~9 globais via window.__praia* (handlers).
// Carregado antes do state.js (rodava no main antes do restore).
/* Component (template instance) selection — Figma-style. */
(() => {
  const right = document.querySelector('.guide-right');
  if (!right) return;

  function clearComponentSelection() {
    document.querySelectorAll('.praia-component.component-selected').forEach(c => {
      c.classList.remove('component-selected', 'component-editing');
    });
    document.body.classList.remove('editing-component');
    right.classList.remove('component-mode');
  }

  function syncComponentPanel(comp) {
    const name = comp.dataset.componentName || 'Component';
    document.getElementById('grc-path').textContent = `Contents / ${name}`;
    const thumb = document.getElementById('grc-thumb');
    const inner = document.getElementById('grc-thumb-inner');
    if (!thumb || !inner) return;
    inner.innerHTML = '';
    // Clone the actual component so the thumb mirrors its real visual.
    const clone = comp.cloneNode(true);
    clone.classList.remove('praia-component', 'component-selected', 'component-editing', 'canvas-selected');
    clone.removeAttribute('contenteditable');
    clone.style.outline = 'none';
    inner.appendChild(clone);
    // Scale to fit the thumb container.
    requestAnimationFrame(() => {
      const compRect = comp.getBoundingClientRect();
      const thumbRect = thumb.getBoundingClientRect();
      const scale = Math.min(thumbRect.width / Math.max(1, compRect.width), thumbRect.height / Math.max(1, compRect.height));
      inner.style.width = compRect.width + 'px';
      inner.style.height = compRect.height + 'px';
      inner.style.transform = `scale(${scale})`;
    });
  }

  function selectComponent(comp) {
    clearComponentSelection();
    // Also drop any text/layout selection.
    document.querySelectorAll('.canvas-selected').forEach(x => {
      x.classList.remove('canvas-selected');
      x.removeAttribute('contenteditable');
      x.removeAttribute('spellcheck');
    });
    right.classList.remove('text-mode', 'layout-mode', 'editing');
    comp.classList.add('component-selected');
    right.classList.add('component-mode');
    syncComponentPanel(comp);
    // Clear any active template selection so Save/Cancel target the instance.
    if (typeof window.__grcClearTplSelection === 'function') window.__grcClearTplSelection();
    syncCustControls(comp);
    // Switch the left sidebar to the Contents tab and highlight this item.
    const side = document.querySelector('.guide-side');
    if (side) {
      side.dataset.tab = 'contents';
      side.querySelectorAll('.guide-side-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'contents'));
      window.__praiaRenderContents?.();
    }
  }

  function startEditingComponent(comp) {
    comp.classList.add('component-editing');
    document.body.classList.add('editing-component');
    // component-mode stays so the advanced Layout panel is visible.
    // Clicking an inner element will switch to text-mode (selectEl removes component-mode).
  }
  function stopEditingComponent() {
    document.querySelectorAll('.praia-component.component-editing').forEach(c => c.classList.remove('component-editing'));
    document.body.classList.remove('editing-component');
  }

  // Click handler — runs before the canvas-selection handler thanks to capture phase.
  document.addEventListener('click', e => {
    if (document.body.classList.contains('preview-mode')) return;
    if (e.target.closest('.guide-right, .guide-side, #topnav, #sidebar, .add-module-slot, .am-overlay, .tk-popover, .canvas-hover-tools, .canvas-ctx')) return;
    // DS template edit mode owns its own selection (item inspector); don't clear here.
    if (e.target.closest('.ds-edit-stage')) return;
    const comp = e.target.closest('.praia-component');
    const dsMode = document.body.classList.contains('ds-mode');
    const editing = document.body.classList.contains('editing-component');
    if (dsMode) {
      if (comp) {
        e.preventDefault(); e.stopPropagation();
        selectComponent(comp);
      } else if (!document.body.classList.contains('ds-tpl-selected')) {
        // While a template thumb is selected (and not in edit mode), keep the
        // right inspector open — clicking outside should not deselect.
        clearComponentSelection();
      }
      return;
    }
    if (comp && !editing) {
      // First click on a component: select it as a single unit.
      e.preventDefault(); e.stopPropagation();
      selectComponent(comp);
      return;
    }
    if (!comp && editing) {
      // Click outside the active component → exit component edit mode.
      stopEditingComponent();
      clearComponentSelection();
    }
  }, true);

  function getActiveComponent() {
    return document.querySelector('.praia-component.component-selected');
  }

  function syncComponentEditFields(comp) {
    if (!comp) return;
    document.getElementById('grc-lock')?.setAttribute('aria-pressed', comp.dataset.locked === 'true' ? 'true' : 'false');
    document.querySelectorAll('#grc-edit ~ .gr-comp-advanced .grl-seg-btn, .gr-comp-advanced .grl-seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.bg === (comp.dataset.bg || 'light'));
    });
    const cols = comp.dataset.cols || '12';
    const colsInput = document.getElementById('grc-cols');
    if (colsInput) colsInput.value = cols;
    const w = document.getElementById('grc-w');
    const h = document.getElementById('grc-h');
    if (w) w.value = comp.style.width || '';
    if (h) h.value = comp.style.height || '';
    const _setVal = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    _setVal('grc-pt', parseInt(comp.style.paddingTop, 10) || 0);
    _setVal('grc-pb', parseInt(comp.style.paddingBottom, 10) || 0);
    _setVal('grc-pad', parseInt(comp.style.paddingLeft, 10) || 0);
    _setVal('grc-pad-2', parseInt(comp.style.paddingRight, 10) || 0);
    _setVal('grc-gap-row', parseInt(comp.style.rowGap || comp.style.gap, 10) || 0);
    _setVal('grc-gap-col', parseInt(comp.style.columnGap || comp.style.gap, 10) || 0);
    const bgDot = document.getElementById('grc-bg-dot');
    if (bgDot) {
      bgDot.style.background = comp.style.background || 'transparent';
      bgDot.style.borderStyle = comp.style.background ? 'solid' : 'dashed';
    }
  }

  function bindCompEdits() {
    const lock = document.getElementById('grc-lock');
    lock?.addEventListener('click', () => {
      const comp = getActiveComponent(); if (!comp) return;
      const cur = comp.dataset.locked === 'true';
      comp.dataset.locked = (!cur).toString();
      lock.setAttribute('aria-pressed', (!cur).toString());
      window.__praiaAutosave?.();
    });
    document.querySelectorAll('.gr-comp-advanced .grl-seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        const comp = getActiveComponent(); if (!comp) return;
        document.querySelectorAll('.gr-comp-advanced .grl-seg-btn').forEach(x => x.classList.toggle('active', x === b));
        comp.dataset.bg = b.dataset.bg;
        comp.style.background = b.dataset.bg === 'dark' ? 'var(--bs-ink)' : '';
        comp.style.color = b.dataset.bg === 'dark' ? '#fff' : '';
        window.__praiaAutosave?.();
      });
    });
    const cols = document.getElementById('grc-cols');
    cols?.addEventListener('input', () => {
      const comp = getActiveComponent(); if (!comp) return;
      const n = Math.max(1, Math.min(24, parseInt(cols.value, 10) || 12));
      comp.dataset.cols = String(n);
      // Apply CSS grid if the component uses display:grid; otherwise just store.
      const cs = getComputedStyle(comp);
      if (cs.display.includes('grid')) comp.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
      window.__praiaAutosave?.();
    });
    const w = document.getElementById('grc-w');
    w?.addEventListener('input', () => {
      const comp = getActiveComponent(); if (!comp) return;
      comp.style.width = w.value || '';
    });
    const h = document.getElementById('grc-h');
    h?.addEventListener('input', () => {
      const comp = getActiveComponent(); if (!comp) return;
      comp.style.height = h.value || '';
    });
    document.getElementById('grc-pt')?.addEventListener('input', e => {
      const comp = getActiveComponent(); if (!comp) return;
      comp.style.paddingTop = (parseInt(e.target.value, 10) || 0) + 'px';
    });
    document.getElementById('grc-pb')?.addEventListener('input', e => {
      const comp = getActiveComponent(); if (!comp) return;
      comp.style.paddingBottom = (parseInt(e.target.value, 10) || 0) + 'px';
    });
    document.getElementById('grc-pad')?.addEventListener('input', e => {
      const comp = getActiveComponent(); if (!comp) return;
      comp.style.paddingLeft = (parseInt(e.target.value, 10) || 0) + 'px';
    });
    document.getElementById('grc-pad-2')?.addEventListener('input', e => {
      const comp = getActiveComponent(); if (!comp) return;
      comp.style.paddingRight = (parseInt(e.target.value, 10) || 0) + 'px';
    });
    document.getElementById('grc-gap-row')?.addEventListener('input', e => {
      const comp = getActiveComponent(); if (!comp) return;
      comp.style.rowGap = (parseInt(e.target.value, 10) || 0) + 'px';
    });
    document.getElementById('grc-gap-col')?.addEventListener('input', e => {
      const comp = getActiveComponent(); if (!comp) return;
      comp.style.columnGap = (parseInt(e.target.value, 10) || 0) + 'px';
    });
  }
  bindCompEdits();

  // ---- Customizar (Family / Weight / Size / Cor) com Save/Cancel + propagação ----
  const FAMILY_OPTS = [
    { label: 'Versos',         value: "'Versos', sans-serif" },
    { label: 'Versos Display', value: "'Versos', sans-serif" },
  ];
  const WEIGHT_OPTS = [
    { label: 'Regular',  value: '400' },
    { label: 'Medium',   value: '500' },
    { label: 'Semibold', value: '600' },
    { label: 'Bold',     value: '700' },
  ];
  // Apenas tokens de type do DS — sem px arbitrário. Selecionar = aplicar o
  // token correspondente, que continua respondendo ao Design System.
  const SIZE_OPTS = [
    { label: 'Padrão',       value: '' },
    { label: 'H1',           value: 'var(--type-super-size)' },
    { label: 'H2',           value: 'var(--type-xl-size)' },
    { label: 'H3',           value: 'var(--type-l-size)' },
    { label: 'H4',           value: 'var(--type-mb-size)' },
    { label: 'Body',         value: 'var(--type-m-size)' },
    { label: 'Caption Bold', value: 'var(--type-sb-size)' },
    { label: 'Caption',      value: 'var(--type-s-size)' },
    { label: 'Body Small',   value: 'var(--type-xs-size)' },
  ];
  const COLOR_OPTS = [
    { label: 'Padrão',            value: '',        swatch: 'transparent' },
    { label: 'Surface/Background',value: 'var(--bg)', swatch: 'var(--bg)' },
    { label: 'Navy',              value: '#061833', swatch: '#061833' },
    { label: 'Cyan',              value: '#0FC4D5', swatch: '#0FC4D5' },
    { label: 'Blue',              value: '#3259FF', swatch: '#3259FF' },
    { label: 'White',             value: '#FFFFFF', swatch: '#FFFFFF' },
    { label: 'Dark',              value: '#0a1018', swatch: '#0a1018' },
  ];
  function labelFor(opts, value) {
    return (opts.find(o => o.value === value) || opts[0]).label;
  }
  window.__openCustDD = openCustDD;
  function openCustDD(anchor, opts, onPick) {
    document.querySelectorAll('.tk-popover.grc-dd').forEach(p => p.remove());
    const dd = document.createElement('div');
    dd.className = 'tk-popover grc-dd open';
    opts.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.label;
      b.addEventListener('click', () => { onPick(o); dd.remove(); });
      dd.appendChild(b);
    });
    document.body.appendChild(dd);
    const r = anchor.getBoundingClientRect();
    // Mirror the Type dropdown: right-align to the anchor, clamp to viewport
    // so colors don't get cut off near the screen edges.
    dd.style.top = '0px'; dd.style.left = '0px';
    const mr = dd.getBoundingClientRect();
    const spaceBelow = innerHeight - r.bottom;
    const top = (spaceBelow >= mr.height + 12) ? r.bottom + 6 : Math.max(8, r.top - mr.height - 6);
    const left = Math.min(Math.max(8, r.right - mr.width), innerWidth - mr.width - 8);
    dd.style.top = `${top}px`;
    dd.style.left = `${left}px`;
    setTimeout(() => {
      const off = e => { if (!dd.contains(e.target) && e.target !== anchor) { dd.remove(); document.removeEventListener('click', off); } };
      document.addEventListener('click', off);
    }, 0);
  }

  let custSnapshot = null;        // { name, items: [{el, fontFamily, fontSize, fontWeight, color}] }
  let custPending  = { fontFamily: '', fontSize: '', fontWeight: '', color: '' };

  function snapshotCust(comp) {
    const grab = el => ({ el, fontFamily: el.style.fontFamily, fontSize: el.style.fontSize, fontWeight: el.style.fontWeight, color: el.style.color });
    const name = comp.dataset.componentName;
    if (!name) return { name: null, items: [grab(comp)] };
    const instances = Array.from(document.querySelectorAll('.praia-component')).filter(c => c.dataset.componentName === name);
    return { name, items: instances.map(grab) };
  }

  function ensureCustSnapshot() {
    const comp = getActiveComponent();
    if (!comp) return null;
    if (!custSnapshot) custSnapshot = snapshotCust(comp);
    return comp;
  }

  function setCustLabels(state) {
    const fam = document.querySelector('#grc-cust-family span');
    const wgt = document.querySelector('#grc-cust-weight span');
    const sz  = document.querySelector('#grc-cust-size span');
    if (fam) fam.textContent = labelFor(FAMILY_OPTS, state.fontFamily || '');
    if (wgt) wgt.textContent = labelFor(WEIGHT_OPTS, state.fontWeight || '');
    if (sz)  sz.textContent  = labelFor(SIZE_OPTS,   state.fontSize   || '');
    const colorOpt = COLOR_OPTS.find(o => o.value === (state.color || '')) || COLOR_OPTS[0];
    const colorName = document.getElementById('grc-cust-color-name');
    const colorSwatch = document.getElementById('grc-cust-color-swatch');
    const colorBtn = document.getElementById('grc-cust-color');
    if (colorName) colorName.textContent = colorOpt.label;
    if (colorSwatch) colorSwatch.style.background = colorOpt.swatch;
    if (colorBtn) colorBtn.dataset.color = colorOpt.value;
  }
  function syncCustControls(comp) {
    custSnapshot = null;
    custPending = {
      fontFamily: comp.style.fontFamily || '',
      fontSize:   comp.style.fontSize   || '',
      fontWeight: comp.style.fontWeight || '',
      color:      comp.style.color      || '',
    };
    setCustLabels(custPending);
  }
  // Exposed so selectComponent (defined above) can call it.
  window.__grcSyncCustControls = syncCustControls;

  // ---- Template-level customization (DS Templates section) ----
  // Clicking a `.ds-tpl-cell` selects the template definition itself; Save
  // propagates to every `.praia-component[data-component-name="<name>"]`
  // (existing + future via a global stylesheet override).
  let activeTplName = null;           // currently selected template definition
  let tplOverrides = {};              // { name: { fontSize, fontWeight, color } } — saved
  let tplDraft = null;                // pending preview overrides for activeTplName

  function ensureTplStyleEl() {
    let el = document.getElementById('grc-tpl-overrides');
    if (!el) {
      el = document.createElement('style');
      el.id = 'grc-tpl-overrides';
      document.head.appendChild(el);
    }
    return el;
  }
  function renderTplOverridesCSS() {
    const el = ensureTplStyleEl();
    const rules = [];
    Object.entries(tplOverrides).forEach(([name, o]) => {
      const decls = [];
      if (o.fontFamily) decls.push(`font-family: ${o.fontFamily} !important`);
      if (o.fontSize)   decls.push(`font-size: ${o.fontSize} !important`);
      if (o.fontWeight) decls.push(`font-weight: ${o.fontWeight} !important`);
      if (o.color)      decls.push(`color: ${o.color} !important`);
      const escName = name.replace(/"/g, '\\"');
      if (decls.length) {
        const sel = `.praia-component[data-component-name="${escName}"]`;
        rules.push(`${sel}{${decls.join(';')}}`);
      }
      // Anchor — applied to child item(s) carrying data-ds-anchor inside the template.
      if (o.anchor && ANCHOR_MAP[o.anchor]) {
        const a = ANCHOR_MAP[o.anchor];
        const aDecls = [
          `align-self: ${a.align} !important`,
          `justify-self: ${a.justify} !important`,
          `align-items: ${a.align} !important`,
          `justify-content: ${a.justify} !important`,
        ].join(';');
        const aSel = `.praia-component[data-component-name="${escName}"] [data-ds-anchor]`;
        rules.push(`${aSel}{${aDecls}}`);
      }
    });
    el.textContent = rules.join('\n');
  }

  function confirmTplDelete(name) {
    return new Promise(resolve => {
      let dlg = document.getElementById('ds-tpl-confirm');
      if (!dlg) {
        dlg = document.createElement('div');
        dlg.id = 'ds-tpl-confirm';
        dlg.className = 'ds-edit-confirm';
        dlg.innerHTML = `
          <div class="ds-edit-confirm-box">
            <div class="ds-edit-confirm-title">Deletar template?</div>
            <div class="ds-edit-confirm-text" id="ds-tpl-confirm-text"></div>
            <div class="ds-edit-confirm-actions">
              <button type="button" class="gr-comp-btn" data-tpl-confirm="cancel">Cancelar</button>
              <button type="button" class="gr-comp-btn primary" data-tpl-confirm="ok">Deletar</button>
            </div>
          </div>`;
        document.body.appendChild(dlg);
      }
      dlg.querySelector('#ds-tpl-confirm-text').textContent = `Tem certeza que deseja deletar "${name}"? Você pode desfazer com Cmd+Z.`;
      dlg.classList.add('open');
      const close = ok => {
        dlg.classList.remove('open');
        dlg.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onKey, true);
        resolve(ok);
      };
      const onClick = e => {
        const b = e.target.closest('[data-tpl-confirm]');
        if (b) { e.preventDefault(); e.stopPropagation(); close(b.dataset.tplConfirm === 'ok'); return; }
        if (e.target === dlg) close(false);
      };
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(true); }
      };
      dlg.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey, true);
    });
  }

  function getActiveTemplateName() { return activeTplName; }
  window.__grcClearTplSelection = () => {
    activeTplName = null;
    tplDraft = null;
    document.querySelectorAll('.ds-tpl-cell.is-selected').forEach(c => c.classList.remove('is-selected'));
    document.body.classList.remove('ds-tpl-selected');
  };

  function selectTemplate(name, cellEl) {
    clearComponentSelection();
    document.querySelectorAll('.ds-tpl-cell.is-selected').forEach(c => c.classList.remove('is-selected'));
    cellEl?.classList.add('is-selected');
    activeTplName = name;
    tplDraft = { fontFamily: '', fontSize: '', fontWeight: '', color: '', ...(tplOverrides[name] || {}) };
    right.classList.add('component-mode');
    document.body.classList.add('ds-tpl-selected');
    // Sync the inspector header / thumb to this template's preview.
    document.getElementById('grc-path').textContent = `Templates / ${name}`;
    const thumb = document.getElementById('grc-thumb');
    const inner = document.getElementById('grc-thumb-inner');
    if (thumb && inner) {
      inner.innerHTML = '';
      const previewSrc = cellEl?.querySelector('.am-tpl-thumb');
      if (previewSrc) {
        const clone = previewSrc.cloneNode(true);
        // Reset any scale baked in by commitEditAndExit so we can rescale to
        // fit the right-panel preview box without compounding transforms.
        clone.style.transform = '';
        clone.style.width  = '';
        clone.style.height = '';
        clone.style.position = '';
        clone.style.left = '';
        clone.style.top  = '';
        // Prefer the captured edit-canvas dimensions so the preview matches
        // the cell thumb pixel-for-pixel (same source of truth).
        const editW = parseFloat(previewSrc.dataset.dsEditW) || 0;
        const editH = parseFloat(previewSrc.dataset.dsEditH) || 0;
        inner.appendChild(clone);
        // Match the preview wrap's aspect to the template's natural aspect so
        // there are no empty bars on top/bottom. Computed BEFORE the scale so
        // the wrap width drives the scale calculation cleanly.
        requestAnimationFrame(() => {
          const baseW = editW || clone.getBoundingClientRect().width  || 1;
          const baseH = editH || clone.getBoundingClientRect().height || 1;
          thumb.style.aspectRatio = `${baseW} / ${baseH}`;
          const thumbRect = thumb.getBoundingClientRect();
          const s = thumbRect.width / baseW; // width-driven; height matches via aspect-ratio
          clone.style.width  = baseW + 'px';
          clone.style.height = baseH + 'px';
          clone.style.transformOrigin = '0 0';
          clone.style.transform = `scale(${s})`;
          inner.style.width  = (baseW * s) + 'px';
          inner.style.height = (baseH * s) + 'px';
          inner.style.transform = 'translate(-50%, -50%)';
        });
      }
    }
    setCustLabels(tplDraft);
  }

  // Ensure the back-confirmation dialog exists in the DOM.
  function ensureConfirmDialog() {
    let dlg = document.getElementById('ds-edit-confirm');
    if (dlg) return dlg;
    dlg = document.createElement('div');
    dlg.id = 'ds-edit-confirm';
    dlg.className = 'ds-edit-confirm';
    dlg.innerHTML = `
      <div class="ds-edit-confirm-box">
        <div class="ds-edit-confirm-title">Salvar alterações?</div>
        <div class="ds-edit-confirm-text">Você fez edições neste template. Deseja salvar antes de voltar?</div>
        <div class="ds-edit-confirm-actions">
          <button type="button" class="gr-comp-btn" data-confirm="discard">Descartar</button>
          <button type="button" class="gr-comp-btn primary" data-confirm="save">Salvar</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
    return dlg;
  }
  // Currently-edited source cell (so Save can write the edited thumb back).
  let editingSourceCell = null;
  function exitEdit() {
    stopLivePropagation();
    document.body.classList.remove('ds-tpl-edit');
    document.body.classList.remove('ds-item-selected', 'ds-item-image', 'ds-item-button', 'ds-multi-selected');
    editingSourceCell = null;
    // Clear the item inspector so the next edit session starts fresh.
    if (typeof activeItem !== 'undefined') activeItem = null;
    document.querySelectorAll('.ds-edit-canvas .ds-item-active').forEach(el => el.classList.remove('ds-item-active'));
    const rIn = document.getElementById('grc-item-radius'); if (rIn) rIn.value = 0;
    const cIn = document.getElementById('grc-grid-cols');   if (cIn) cIn.value = 12;
    const gIn = document.getElementById('grc-grid-gap');    if (gIn) gIn.value = 16;
    const typeLabel = document.getElementById('grc-item-type-label'); if (typeLabel) typeLabel.textContent = '—';
    paintAnchorButton?.('center');
    document.querySelectorAll('.gr-anchor-menu.open').forEach(m => m.classList.remove('open'));
  }
  function commitEditAndExit() {
    if (editingSourceCell) {
      const section = editingSourceCell.closest('section[data-ds-section]');
      const editedThumb = section?.querySelector('.ds-edit-canvas .am-tpl-thumb');
      const targetThumb = editingSourceCell.querySelector('.am-tpl-thumb');
      if (editedThumb && targetThumb) {
        // Master canvas: W locked at 1280, H is per-template (captured from the
        // edit canvas — user can resize via the top/bottom edge drag). The
        // edit canvas uses transform: scale, so getBoundingClientRect returns
        // SCALED screen pixels — we need the CSS pixel (native) dimensions
        // here, which is what style.height + offsetHeight expose.
        const editW = 1280;
        const editH = Math.round(parseFloat(editedThumb.style.height) || editedThumb.offsetHeight || 800);

        const fresh = editedThumb.cloneNode(true);
        // Strip edit-only artifacts: grid overlay + selection class on items.
        fresh.querySelector(':scope > .ds-grid-overlay')?.remove();
        fresh.querySelectorAll('.ds-item-active').forEach(el => el.classList.remove('ds-item-active'));
        // Strip transient edit-only DOM/classes so they don't accumulate on the persisted thumb across Voltar cycles.
        fresh.querySelectorAll('.ds-resize-handle, .ds-mask-img-wrap').forEach(n => n.remove());
        fresh.querySelectorAll('.is-dragging, .is-panning, .ds-mask-target').forEach(n => {
          n.classList.remove('is-dragging', 'is-panning', 'ds-mask-target');
        });

        // Clear any edit-time inline geometry — the unified praia-frame +
        // praia-mirror pipeline (applyMirrorScale) handles scaling for every
        // context (cell thumb, instance, modal) using ONLY data-ds-edit-w/h.
        fresh.style.width = '';
        fresh.style.height = '';
        fresh.style.transform = '';
        fresh.style.transformOrigin = '';
        fresh.removeAttribute('data-ds-scaled-thumb');
        fresh.dataset.dsEditW = String(editW);
        fresh.dataset.dsEditH = String(editH);

        // Replace the cell's thumb with the wrapped (praia-frame) version so
        // the DS grid preview, the modal mirror, and the instance all share
        // exactly one render pipeline.
        const wrap = targetThumb.closest('.ds-thumb-wrap') || targetThumb.parentElement;
        if (wrap) {
          // Keep the wrap's action buttons; rebuild only the master content.
          const actions = wrap.querySelector('.ds-tpl-actions')?.cloneNode(true);
          wrap.style.aspectRatio = `${editW}/${editH}`;
          wrap.style.overflow = 'hidden';
          wrap.innerHTML = `<div class="praia-mirror" data-edit-w="${editW}" data-edit-h="${editH}" style="width:${editW}px;height:${editH}px">${fresh.outerHTML}</div>`;
          if (actions) wrap.appendChild(actions);
        } else {
          targetThumb.replaceWith(fresh);
        }
        // Mirror the edited thumb back into the Add Module overlay's card for
        // this same template — that overlay is the SOURCE populateTemplatesGrid
        // pulls from, so without this sync a future re-populate (page rebuild,
        // hard reload) would silently revert the preview to the pre-edit
        // buildTemplate() output. Match by template name.
        const name = editingSourceCell.dataset.tplName;
        if (name) {
          const cards = document.querySelectorAll('.am-tpl-card');
          cards.forEach(card => {
            if (card.dataset.name !== name) return;
            const sourceThumb = card.querySelector('.am-tpl-thumb');
            if (sourceThumb) sourceThumb.replaceWith(fresh.cloneNode(true));
          });
          // Stash the latest thumb HTML keyed by template name. renderGrid()
          // checks this map BEFORE rebuilding cards from the registry, so the
          // edited preview survives tab switches and Add Module re-opens —
          // the DS Templates section is now the single source of truth.
          window.__praiaTplOverrides = window.__praiaTplOverrides || {};
          // Stamp the master thumb with its template name so any future inserted
          // instance carries the identity inline — enables boot-time orphan
          // migration without relying on dataset tagging on the wrapper.
          fresh.setAttribute('data-tpl-name', name);
          window.__praiaTplOverrides[name] = fresh.outerHTML;
          // Mark as user-edited so the text-template version gate won't reset it.
          window.__praiaTplOverrides['edited:' + name] = '1';
          try { localStorage.setItem('praia.tpl.overrides', JSON.stringify(window.__praiaTplOverrides)); } catch {}
          // Propagate master → all instances inserted on guide pages.
          window.__praiaPropagateTemplate?.(name, fresh.outerHTML);
        }
        // Persist via autosave so reload keeps the edited preview.
        window.__praiaAutosave?.();
      }
    }
    exitEdit();
    // Unified mirror pipeline takes over after exit — applyMirrorScale runs on
    // the next frame so the cell thumb re-fits to its newly-revealed grid box.
    requestAnimationFrame(() => window.__praiaApplyMirrorScale?.());
  }
  // applyScaledThumbs (legacy per-thumb transform) was replaced by the
  // .praia-mirror pipeline. The window alias below preserves callers; nothing
  // sets `data-ds-scaled-thumb` anymore, so the legacy function is gone.
  // Legacy callers expect __praiaApplyScaledThumbs — point them at the unified
  // mirror scale function so the cell/instance/modal pipelines stay in sync.
  window.__praiaApplyScaledThumbs = () => window.__praiaApplyMirrorScale?.();
  document.addEventListener('click', e => {
    if (e.target.closest('[data-ds-edit-back]')) {
      e.preventDefault(); e.stopPropagation();
      // Voltar agora salva direto — sem perguntar. As mudanças do canvas já
      // estão refletidas no thumb via commitEditAndExit.
      commitEditAndExit();
      return;
    }
    const conf = e.target.closest('[data-confirm]');
    if (conf) {
      e.preventDefault(); e.stopPropagation();
      const dlg = ensureConfirmDialog();
      dlg.classList.remove('open');
      if (conf.dataset.confirm === 'save') commitEditAndExit();
      else exitEdit();
      return;
    }
    // Click outside the dialog box (on the backdrop) just closes the modal —
    // user stays in edit mode without losing changes.
    const openDlg = document.querySelector('.ds-edit-confirm.open');
    if (openDlg && e.target === openDlg) {
      openDlg.classList.remove('open');
      return;
    }
    const actionBtn = e.target.closest('[data-ds-tpl-action]');
    if (actionBtn) {
      const cell = actionBtn.closest('.ds-tpl-cell');
      if (!cell) return;
      e.preventDefault(); e.stopPropagation();
      const action = actionBtn.dataset.dsTplAction;
      if (action === 'duplicate') {
        const clone = cell.cloneNode(true);
        clone.classList.remove('is-selected');
        const baseName = cell.dataset.tplName || '';
        clone.dataset.tplName = baseName + ' copy';
        const label = clone.querySelector(':scope > .tk-sb');
        if (label) label.textContent = clone.dataset.tplName;
        cell.parentNode.insertBefore(clone, cell.nextSibling);
      } else if (action === 'delete') {
        const name = cell.dataset.tplName || 'este template';
        confirmTplDelete(name).then(ok => {
          if (!ok) return;
          if (cell.classList.contains('is-selected')) {
            window.__grcClearTplSelection && window.__grcClearTplSelection();
          }
          cell.remove();
        });
      }
      return;
    }
    const cell = e.target.closest('.ds-tpl-cell');
    if (!cell) return;
    if (!document.body.classList.contains('ds-mode')) return;
    e.preventDefault(); e.stopPropagation();
    // Single-click only selects the template (highlight + open inspector).
    // Double-click is what enters the full edit canvas (see dblclick handler below).
    selectTemplate(cell.dataset.tplName, cell);
  }, true);

  // Double-click on a text/image template → enter the edit canvas.
  // Edit-canvas scale management. The master is locked at 1280px native width,
  // but the canvas viewport is whatever the column allows. We scale the thumb
  // via CSS transform to fit, then expose the scale so drag/resize handlers
  // can divide writes back into native pixels (the visual must stay 1:1 with
  // the mouse).
  function getCanvasScale() {
    const c = document.querySelector('.ds-edit-canvas');
    if (!c) return 1;
    const s = parseFloat(getComputedStyle(c).getPropertyValue('--praia-edit-scale'));
    return s > 0 ? s : 1;
  }
  window.__praiaGetCanvasScale = getCanvasScale;
  function applyEditScale() {
    const canvas = document.querySelector('.ds-edit-canvas');
    if (!canvas) return;
    const thumb = canvas.querySelector('.am-tpl-thumb');
    if (!thumb) return;
    const editH = parseFloat(thumb.style.height) || 800;
    const innerW = canvas.clientWidth;
    if (!innerW) return;
    const scale = Math.min(1, innerW / 1280);
    canvas.style.setProperty('--praia-edit-scale', scale);
    // Reserve canvas height to match the scaled thumb height (transform doesn't
    // affect layout, so without this the canvas would size to native 800px).
    canvas.style.height = (editH * scale) + 'px';
  }
  window.__praiaApplyEditScale = applyEditScale;
  let __editScaleRO = null;
  function ensureEditScaleObserver() {
    if (!('ResizeObserver' in window) || __editScaleRO) return;
    __editScaleRO = new ResizeObserver(() => applyEditScale());
    const c = document.querySelector('.ds-edit-canvas');
    if (c) __editScaleRO.observe(c);
  }
  window.addEventListener('resize', applyEditScale);
  // Live propagation: while editing a master in DS canvas, mirror every change
  // to all instances inserted on guide pages. Throttled via RAF to coalesce
  // rapid mutations (drag/resize/typing). Disconnected on exitEdit.
  let __livePropagateMO = null;
  let __livePropagateRaf = 0;
  function startLivePropagation(canvas, name) {
    stopLivePropagation();
    if (!canvas || !name) return;
    const propagate = () => {
      __livePropagateRaf = 0;
      const thumb = canvas.querySelector('.am-tpl-thumb');
      if (!thumb) return;
      const fresh = thumb.cloneNode(true);
      fresh.querySelector(':scope > .ds-grid-overlay')?.remove();
      fresh.querySelectorAll('.ds-item-active').forEach(el => el.classList.remove('ds-item-active'));
      fresh.querySelectorAll('.ds-resize-handle, .ds-mask-img-wrap').forEach(n => n.remove());
      fresh.querySelectorAll('.is-dragging, .is-panning, .ds-mask-target').forEach(n => {
        n.classList.remove('is-dragging', 'is-panning', 'ds-mask-target');
      });
      // Stamp the master's native pixel canvas dims so instances render at
      // the right aspect ratio. The edit canvas applies transform: scale, so
      // getBoundingClientRect returns SCALED screen pixels — we need the CSS
      // pixel (native) size. style.height is the inline value the crop handler
      // updates; offsetWidth/Height ignore transforms.
      const w = parseFloat(thumb.style.width) || thumb.offsetWidth || 1280;
      const h = parseFloat(thumb.style.height) || thumb.offsetHeight || 800;
      if (w && h) {
        fresh.dataset.dsEditW = String(w);
        fresh.dataset.dsEditH = String(h);
      }
      window.__praiaPropagateTemplate?.(name, fresh.outerHTML);
    };
    __livePropagateMO = new MutationObserver(() => {
      if (__livePropagateRaf) return;
      __livePropagateRaf = requestAnimationFrame(propagate);
    });
    __livePropagateMO.observe(canvas, { childList: true, subtree: true, characterData: true, attributes: true });
  }
  function stopLivePropagation() {
    if (__livePropagateMO) { __livePropagateMO.disconnect(); __livePropagateMO = null; }
    if (__livePropagateRaf) { cancelAnimationFrame(__livePropagateRaf); __livePropagateRaf = 0; }
  }
  function enterTemplateEdit(cell) {
    // Edit mode disabled 2026-05-28 — templates will be rebuilt from scratch.
    return;
    if (!cell || !document.body.classList.contains('ds-mode')) return;
    if (cell.dataset.tplCat !== 'text' && cell.dataset.tplCat !== 'images' && cell.dataset.tplCat !== 'video') return;
    selectTemplate(cell.dataset.tplName, cell);
    const section = cell.closest('section[data-ds-section]');
    const canvas = section?.querySelector('[data-ds-edit-canvas]');
    const src = cell.querySelector('.am-tpl-thumb');
    if (canvas && src) {
      canvas.innerHTML = '';
      canvas.dataset.dsCat = cell.dataset.tplCat;
      const clone = src.cloneNode(true);
      // The cell's master thumb has data-ds-edit-w/h but no inline geometry —
      // the canvas needs an explicit height (W is forced 1280 by CSS). Use
      // the stored editH so the edit canvas matches the master proportions.
      const editH = parseFloat(src.dataset.dsEditH) || 800;
      clone.style.height = editH + 'px';
      if (cell.dataset.tplCat === 'images') {
        clone.querySelectorAll('.tpl-block').forEach(b => {
          b.style.backgroundImage = "url('assets/Moto.png')";
          b.style.backgroundSize = 'cover';
          b.style.backgroundPosition = 'center';
        });
      }
      canvas.appendChild(clone);
      tagCanvasItems(clone);
    }
    document.body.classList.add('ds-tpl-edit');
    document.body.classList.remove('ds-item-selected', 'ds-item-image', 'ds-item-button', 'ds-multi-selected');
    if (typeof window.__restoreGridState === 'function') window.__restoreGridState();
    editingSourceCell = cell;
    requestAnimationFrame(() => {
      const cols = parseInt(document.getElementById('grc-grid-cols')?.value, 10) || 12;
      const gap  = parseInt(document.getElementById('grc-grid-gap')?.value, 10)  || 0;
      applyGrid(cols, gap);
      applyEditScale();
      ensureEditScaleObserver();
    });
    startLivePropagation(canvas, cell.dataset.tplName);
  }
  document.addEventListener('dblclick', e => {
    const cell = e.target.closest('.ds-tpl-cell');
    if (!cell) return;
    // Don't intercept dbl-click inside the Add template modal mirror — that
    // grid uses dbl-click to insert, not to enter the DS edit canvas.
    if (e.target.closest('#am-body-mirror')) return;
    e.preventDefault(); e.stopPropagation();
    enterTemplateEdit(cell);
  }, true);

  // Right-panel "Deletar template" button — pede confirmação, deleta o cell
  // e sai do edit mode.
  document.addEventListener('click', e => {
    const btn = e.target.closest('#ds-tpl-delete-btn');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    if (!editingSourceCell) return;
    const name = editingSourceCell.dataset.tplName || 'este template';
    confirmTplDelete(name).then(ok => {
      if (!ok) return;
      const toRemove = editingSourceCell;
      window.__grcClearTplSelection && window.__grcClearTplSelection();
      exitEdit();
      toRemove.remove();
    });
  }, true);

  // Right-panel "Editar" button — same effect as double-clicking the thumb.
  document.addEventListener('click', e => {
    const btn = e.target.closest('#ds-tpl-edit-btn');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const selected = document.querySelector('.ds-tpl-cell.is-selected');
    if (selected) enterTemplateEdit(selected);
  }, true);

  // Grid toggle button — show/hide the grid overlay inside the edit canvas.
  // The choice persists across sessions via localStorage so the user doesn't
  // have to re-disable the grid every time they enter edit mode.
  const GRID_KEY = 'ds.tpl.gridHidden';
  function applyGridHidden(hidden) {
    document.body.classList.toggle('ds-tpl-grid-hidden', hidden);
    document.querySelectorAll('[data-ds-grid-toggle]').forEach(b => b.setAttribute('aria-pressed', String(!hidden)));
    try { localStorage.setItem(GRID_KEY, hidden ? '1' : '0'); } catch (_) {}
  }
  function restoreGridState() {
    try {
      const v = localStorage.getItem(GRID_KEY);
      if (v === null) return; // first run — keep default (grid visible)
      applyGridHidden(v === '1');
    } catch (_) {}
  }
  window.__restoreGridState = restoreGridState;
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-ds-grid-toggle]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    applyGridHidden(!document.body.classList.contains('ds-tpl-grid-hidden'));
  }, true);

  // ---- Text alignment (left / center / right / justify) ----
  function paintTextAlignButtons(align) {
    document.querySelectorAll('.ds-textalign-btn').forEach(b => {
      b.classList.toggle('is-active', b.dataset.textAlign === (align || 'left'));
    });
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ds-textalign-btn');
    if (!btn || !activeItem) return;
    e.preventDefault(); e.stopPropagation();
    const align = btn.dataset.textAlign;
    activeItem.style.textAlign = align;
    paintTextAlignButtons(align);
  }, true);

  // ---- Position (left/hcenter/right + top/vcenter/bottom) ----
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ds-pos-btn');
    if (!btn || !activeItem) return;
    e.preventDefault(); e.stopPropagation();
    const canvas = activeItem.closest('.am-tpl-thumb');
    if (!canvas) return;
    const cs = getComputedStyle(canvas);
    const margin = parseFloat(cs.getPropertyValue('--ds-margin')) || 0;
    const cr = canvas.getBoundingClientRect();
    const ir = activeItem.getBoundingClientRect();
    activeItem.style.position = 'absolute';
    activeItem.style.transform = 'none';
    const pos = btn.dataset.pos;
    switch (pos) {
      case 'left':    activeItem.style.left = margin + 'px'; break;
      case 'hcenter': activeItem.style.left = ((cr.width - ir.width) / 2) + 'px'; break;
      case 'right':   activeItem.style.left = (cr.width - ir.width - margin) + 'px'; break;
      case 'top':     activeItem.style.top  = margin + 'px'; break;
      case 'vcenter': activeItem.style.top  = ((cr.height - ir.height) / 2) + 'px'; break;
      case 'bottom':  activeItem.style.top  = (cr.height - ir.height - margin) + 'px'; break;
    }
  }, true);

  // ---- Image replace (right-inspector "Substituir imagem") ----
  document.addEventListener('click', e => {
    if (e.target.closest('#grc-item-image-replace')) {
      e.preventDefault(); e.stopPropagation();
      document.getElementById('grc-item-image-input')?.click();
    }
  }, true);
  document.getElementById('grc-item-image-input')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file || !activeItem) return;
    const url = URL.createObjectURL(file);
    activeItem.style.backgroundImage = `url('${url}')`;
    activeItem.dataset.dsImage = 'true';
    const nameEl = document.getElementById('grc-item-image-name');
    if (nameEl) nameEl.textContent = file.name;
    e.target.value = '';
  });
  function __syncImageName(el) {
    if (!el || el.dataset.dsItemKind !== 'image') return;
    const bg = el.style.backgroundImage || '';
    const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
    const name = m ? m[1].split('/').pop().split('?')[0] : '—';
    const nameEl = document.getElementById('grc-item-image-name');
    if (nameEl) nameEl.textContent = name;
  }
  window.__syncImageName = __syncImageName;

  // ---- Marquee selection (click-and-drag on empty canvas to select many) ----
  let __marquee = null;
  let __marqueeStart = null;
  let __marqueeJustDragged = false; // set on mouseup after a real drag to swallow the trailing click
  document.addEventListener('mousedown', e => {
    if (!document.body.classList.contains('ds-tpl-edit')) return;
    if (e.button !== 0) return;
    // Skip UI chrome (toolbar, sidebars, popovers) always.
    if (e.target.closest('.guide-right, .guide-side, #sidebar, #topnav, .ds-side, [data-ds-edit-back], [data-ds-grid-toggle], [data-ds-addblock], .ds-addblock-pop, .ds-ctx-menu, .gr-anchor-menu, .tk-popover, .ds-edit-confirm')) return;
    // With shift held, ALWAYS start a marquee — even when starting on an item.
    // Without shift, clicking on an ALREADY-SELECTED item routes to the drag
    // handler (so selected items can be moved). Mousedown on an unselected
    // item starts a marquee so users can lasso-select photos that fill the
    // canvas (and a no-drag release falls through to single-select that item).
    if (!e.shiftKey) {
      const onItem = e.target.closest('.ds-edit-canvas .am-tpl-thumb > *:not(.ds-grid-overlay)');
      if (onItem && onItem.classList.contains('ds-item-active')) return;
    }
    const thumb = document.querySelector('body.ds-tpl-edit .ds-edit-canvas .am-tpl-thumb');
    if (!thumb) return;
    e.preventDefault();
    // Shift extends an existing selection; without shift we clear first.
    if (!e.shiftKey) {
      document.querySelectorAll('.ds-edit-canvas .ds-item-active').forEach(el => el.classList.remove('ds-item-active'));
      document.body.classList.remove('ds-item-selected', 'ds-item-text', 'ds-item-block', 'ds-item-image', 'ds-item-button', 'ds-multi-selected');
      if (typeof clearResizeHandles === 'function') clearResizeHandles();
    }
    const startedOnItem = e.target.closest('.ds-edit-canvas .am-tpl-thumb > *:not(.ds-grid-overlay)');
    __marqueeStart = { x: e.clientX, y: e.clientY, thumb, additive: e.shiftKey, startedOnItem };
    __marquee = document.createElement('div');
    __marquee.className = 'ds-marquee';
    document.body.appendChild(__marquee);
    paintMarquee(e.clientX, e.clientY);
  }, true);
  function paintMarquee(x, y) {
    if (!__marquee || !__marqueeStart) return;
    const x0 = __marqueeStart.x, y0 = __marqueeStart.y;
    const l = Math.min(x0, x), t = Math.min(y0, y);
    const w = Math.abs(x - x0), h = Math.abs(y - y0);
    __marquee.style.left = l + 'px';
    __marquee.style.top = t + 'px';
    __marquee.style.width = w + 'px';
    __marquee.style.height = h + 'px';
  }
  document.addEventListener('mousemove', e => {
    if (!__marquee) return;
    paintMarquee(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', e => {
    if (!__marquee || !__marqueeStart) return;
    const rect = __marquee.getBoundingClientRect();
    __marquee.remove();
    __marquee = null;
    const start = __marqueeStart;
    __marqueeStart = null;
    const wasDrag = rect.width >= 4 || rect.height >= 4;
    if (wasDrag) __marqueeJustDragged = true;
    if (!wasDrag) {
      // Shift+click on item (no drag): toggle that item in the selection.
      if (start.additive && start.startedOnItem) {
        start.startedOnItem.classList.toggle('ds-item-active');
        const sel = document.querySelectorAll('.ds-edit-canvas .ds-item-active');
        document.body.classList.toggle('ds-item-selected', sel.length > 0);
        document.body.classList.toggle('ds-multi-selected', sel.length > 1);
        if (sel.length === 1 && typeof selectItem === 'function') selectItem(sel[0]);
        else if (sel.length === 0 && typeof clearItemSelection === 'function') clearItemSelection();
      } else if (!start.additive && start.startedOnItem) {
        // Plain click on an unselected item (no drag): single-select it via
        // selectItem so the right inspector lands in the SAME state as the
        // marquee→1 path (Cor / Type+Alinhamento / Position / Corner Radius).
        if (typeof selectItem === 'function') selectItem(start.startedOnItem);
      }
      return;
    }
    const items = [...start.thumb.querySelectorAll(':scope > *:not(.ds-grid-overlay)')];
    let picked = 0;
    items.forEach(it => {
      const ir = it.getBoundingClientRect();
      const intersects = !(ir.right < rect.left || ir.left > rect.right || ir.bottom < rect.top || ir.top > rect.bottom);
      if (intersects) { it.classList.add('ds-item-active'); picked++; }
    });
    picked = document.querySelectorAll('.ds-edit-canvas .ds-item-active').length;
    if (picked > 0) {
      document.body.classList.add('ds-item-selected');
      // Multi-select: mark body so styles/inspector know we're in batch mode.
      document.body.classList.toggle('ds-multi-selected', picked > 1);
      // Keep activeItem pointing at last selected so single-item panels still work.
      if (typeof activeItem !== 'undefined') {
        activeItem = items.find(it => it.classList.contains('ds-item-active')) || null;
      }
      // Single-item marquee result: route through selectItem so the right-side
      // inspector ends up in the SAME state as a plain click — body kind
      // classes (ds-item-text/image/button…) get applied uniformly, Cor/Type/
      // Alinhamento/Position/Radius all operate on this one node.
      if (picked === 1 && activeItem && typeof selectItem === 'function') {
        selectItem(activeItem);
      } else if (typeof clearResizeHandles === 'function') {
        clearResizeHandles();
      }
    }
  });

  // ---- Right-click context menu on canvas items ----
  let __ctxClipboard = null; // last-copied element outerHTML
  let __ctxPop = null;
  function ensureCtxMenu() {
    if (__ctxPop) return __ctxPop;
    const pop = document.createElement('div');
    pop.className = 'ds-glass-pop ds-ctx-menu';
    pop.innerHTML = [
      ['copy', 'Copiar'],
      ['paste', 'Colar'],
      ['group', 'Group selection'],
      ['ungroup', 'Ungroup'],
      ['front', 'Bring to front'],
      ['back', 'Send to back'],
    ].map(([k, l]) => `<button type="button" data-ctx="${k}">${l}</button>`).join('');
    document.body.appendChild(pop);
    pop.addEventListener('click', e => {
      const b = e.target.closest('[data-ctx]');
      if (!b) return;
      e.stopPropagation();
      const target = pop.__target;
      pop.classList.remove('open');
      if (!target) return;
      runCtxAction(b.dataset.ctx, target);
    });
    __ctxPop = pop;
    return pop;
  }
  function nextZ(canvas) {
    let max = 0;
    canvas.querySelectorAll(':scope > *:not(.ds-grid-overlay)').forEach(c => {
      const z = parseInt(c.style.zIndex, 10);
      if (!isNaN(z) && z > max) max = z;
    });
    return max + 1;
  }
  function runCtxAction(action, target) {
    const canvas = target.closest('.am-tpl-thumb');
    if (action === 'copy') {
      __ctxClipboard = { html: target.outerHTML };
    } else if (action === 'paste') {
      if (!__ctxClipboard || !canvas) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = __ctxClipboard.html.trim();
      const el = tmp.firstElementChild;
      if (!el) return;
      // Offset paste a bit so it's not on top of the original.
      const top = parseFloat(el.style.top) || 50;
      const left = parseFloat(el.style.left) || 50;
      el.style.position = 'absolute';
      el.style.top = (top + 4) + '%';
      el.style.left = (left + 4) + '%';
      el.classList.remove('ds-item-active');
      const overlay = canvas.querySelector(':scope > .ds-grid-overlay');
      if (overlay) canvas.insertBefore(el, overlay); else canvas.appendChild(el);
      if (typeof tagItem === 'function') tagItem(el);
      if (typeof selectItem === 'function') selectItem(el);
    } else if (action === 'group') {
      const selected = canvas?.querySelectorAll(':scope > .ds-item-active');
      const items = selected && selected.length ? [...selected] : [target];
      if (!items.length || !canvas) return;
      // Compute union bounding box of items relative to the canvas so the
      // group sits exactly where the items already are — no jumping/centering.
      const cr = canvas.getBoundingClientRect();
      const rects = items.map(it => it.getBoundingClientRect());
      const minL = Math.min(...rects.map(r => r.left));
      const minT = Math.min(...rects.map(r => r.top));
      const maxR = Math.max(...rects.map(r => r.right));
      const maxB = Math.max(...rects.map(r => r.bottom));
      const group = document.createElement('div');
      group.className = 'ds-group';
      group.dataset.dsItemKind = 'group';
      group.style.cssText = `position:absolute;left:${minL - cr.left}px;top:${minT - cr.top}px;width:${maxR - minL}px;height:${maxB - minT}px;transform:none`;
      canvas.insertBefore(group, items[0]);
      items.forEach((it, i) => {
        const r = rects[i];
        // Lock the current rendered size in pixels — items using percentage
        // widths (e.g. .tpl-block with width:60%) would otherwise resize when
        // re-parented into the smaller group box.
        it.style.width  = r.width + 'px';
        it.style.height = r.height + 'px';
        // Children become absolute-positioned inside the group at their
        // original on-canvas position offset by the group origin.
        it.style.position = 'absolute';
        it.style.left = (r.left - minL) + 'px';
        it.style.top = (r.top - minT) + 'px';
        it.style.transform = 'none';
        // Strip place-self / grid placement that would otherwise compete with
        // the absolute positioning inside the group.
        it.style.placeSelf = '';
        it.style.alignSelf = '';
        it.style.justifySelf = '';
        group.appendChild(it);
      });
      if (typeof selectItem === 'function') selectItem(group);
    } else if (action === 'ungroup') {
      if (!target.classList.contains('ds-group') || !canvas) return;
      const overlay = canvas.querySelector(':scope > .ds-grid-overlay');
      const cr = canvas.getBoundingClientRect();
      // Snapshot child positions BEFORE moving — once detached from the group
      // their getBoundingClientRect changes.
      const placements = [...target.children].map(child => {
        const r = child.getBoundingClientRect();
        return { child, left: r.left - cr.left, top: r.top - cr.top };
      });
      placements.forEach(({ child, left, top }) => {
        child.style.position = 'absolute';
        child.style.left = left + 'px';
        child.style.top = top + 'px';
        child.style.transform = 'none';
        if (overlay) canvas.insertBefore(child, overlay);
        else canvas.appendChild(child);
      });
      target.remove();
    } else if (action === 'front') {
      if (!canvas) return;
      target.style.zIndex = nextZ(canvas);
    } else if (action === 'back') {
      target.style.zIndex = 0;
    }
  }
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('ds-tpl-edit')) return;
    const t = e.target;
    const inField = t && (t.matches?.('input, textarea, [contenteditable="true"]') || t.closest?.('[contenteditable="true"]'));
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const cmd = isMac ? e.metaKey : e.ctrlKey;
    const canvas = document.querySelector('.ds-edit-canvas .am-tpl-thumb');
    if (!canvas) return;

    // Ctrl+G — toggle the grid overlay (Ctrl on all platforms, NOT Cmd on Mac,
    // so it doesn't collide with the browser's Cmd shortcuts).
    if (e.ctrlKey && !e.metaKey && (e.key === 'g' || e.key === 'G')) {
      if (inField) return;
      e.preventDefault();
      const wasHidden = document.body.classList.contains('ds-tpl-grid-hidden');
      if (typeof applyGridHidden === 'function') applyGridHidden(!wasHidden);
      return;
    }

    // Delete / Backspace — remove active items (skip when typing in a field).
    if (!cmd && (e.key === 'Delete' || e.key === 'Backspace')) {
      if (inField) return;
      const active = [...canvas.querySelectorAll(':scope > .ds-item-active')];
      if (!active.length) return;
      e.preventDefault();
      active.forEach(el => el.remove());
      document.body.classList.remove('ds-item-selected', 'ds-item-text', 'ds-item-block', 'ds-item-image', 'ds-item-button', 'ds-multi-selected');
      if (typeof clearItemSelection === 'function') clearItemSelection();
      return;
    }

    if (!cmd) return;
    if (inField) return;

    if (e.key === 'c' || e.key === 'C') {
      const active = canvas.querySelector(':scope > .ds-item-active');
      if (!active) return;
      e.preventDefault();
      runCtxAction('copy', active);
    } else if (e.key === 'v' || e.key === 'V') {
      if (!__ctxClipboard) return;
      e.preventDefault();
      const ref = canvas.querySelector(':scope > .ds-item-active') || canvas.querySelector(':scope > *:not(.ds-grid-overlay)');
      if (ref) runCtxAction('paste', ref);
    } else if (e.key === 'a' || e.key === 'A') {
      // Cmd/Ctrl+A — select every item on the canvas.
      e.preventDefault();
      const items = [...canvas.querySelectorAll(':scope > *:not(.ds-grid-overlay)')];
      if (!items.length) return;
      items.forEach(it => it.classList.add('ds-item-active'));
      document.body.classList.add('ds-item-selected');
      document.body.classList.toggle('ds-multi-selected', items.length > 1);
      if (typeof activeItem !== 'undefined') activeItem = items[items.length - 1];
    }
  }, true);
  document.addEventListener('contextmenu', e => {
    if (!document.body.classList.contains('ds-tpl-edit')) return;
    const item = e.target.closest('.ds-edit-canvas .am-tpl-thumb > *:not(.ds-grid-overlay)');
    if (!item) return;
    e.preventDefault();
    // If we right-click on an item that's part of a multi-selection, KEEP the
    // selection (so Group acts on all). Otherwise collapse to single-select.
    if (!item.classList.contains('ds-item-active')) {
      if (typeof selectItem === 'function') selectItem(item);
    }
    const pop = ensureCtxMenu();
    pop.__target = item;
    // Disable paste if clipboard empty.
    pop.querySelector('[data-ctx="paste"]')?.toggleAttribute('disabled', !__ctxClipboard);
    // Group vs Ungroup are mutually exclusive: show Ungroup only on a group,
    // hide it otherwise. Group is hidden when target is a group.
    const isGroup = item.classList.contains('ds-group');
    pop.querySelector('[data-ctx="group"]').style.display = isGroup ? 'none' : '';
    pop.querySelector('[data-ctx="ungroup"]').style.display = isGroup ? '' : 'none';
    pop.classList.add('open');
    pop.style.top = '0px'; pop.style.left = '0px';
    const mr = pop.getBoundingClientRect();
    const top = Math.min(e.clientY, innerHeight - mr.height - 8);
    const left = Math.min(e.clientX, innerWidth - mr.width - 8);
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
  });
  document.addEventListener('click', e => {
    if (__ctxPop?.classList.contains('open') && !e.target.closest('.ds-ctx-menu')) {
      __ctxPop.classList.remove('open');
    }
  });

  // ---- ADD BLOCK button: insert Essentials (Text / Image / Video / Botão) ----
  const BLOCK_DEFS = [
    { key: 'text',   label: 'Text',   icon: '<span class="bs-icon" style="--bs-icon-size:16px">title</span>' },
    { key: 'image',  label: 'Image',  icon: '<span class="bs-icon" style="--bs-icon-size:16px">image</span>' },
    { key: 'video',  label: 'Video',  icon: '<span class="bs-icon" style="--bs-icon-size:16px">movie</span>' },
    { key: 'button', label: 'Botão',  icon: '<span class="bs-icon" style="--bs-icon-size:16px">smart_button</span>' },
  ];
  function createBlockEl(key) {
    // Stamp authoritative kind so tagItem can skip SVG-path sniffing.
    if (key === 'text') {
      const el = document.createElement('div');
      el.className = 'tk-m';
      el.style.cssText = 'color:var(--bs-white);place-self:center';
      el.textContent = 'Text';
      el.dataset.dsItemKind = 'text';
      return el;
    }
    if (key === 'image' || key === 'video') {
      const el = document.createElement('div');
      el.className = 'tpl-block';
      el.style.cssText = 'border-radius:var(--r-sm);aspect-ratio:16/9;width:60%;place-self:center;display:flex;align-items:center;justify-content:center;background-color:var(--surface-2);background-size:cover;background-position:center';
      if (key === 'image') {
        // Default to the same Moto.png placeholder used elsewhere — the user
        // can swap it via the right inspector ("Substituir imagem").
        el.style.backgroundImage = "url('assets/Moto.png')";
        el.dataset.dsImage = 'true';
      } else {
        el.style.color = 'var(--text-3)';
        el.innerHTML = '<span class="bs-icon" style="--bs-icon-size:20px">movie</span>';
      }
      el.dataset.dsItemKind = key;
      return el;
    }
    if (key === 'button') {
      // Use a <div role="button"> instead of a real <button>: native buttons
      // have inconsistent ::before support (the BUTTON tag badge would not
      // render reliably). The div carries identical a11y semantics.
      const el = document.createElement('div');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.className = 'tk-sb';
      el.style.cssText = 'place-self:center;padding:10px 18px;border-radius:var(--r-full,999px);background:var(--bs-cyan);color:var(--bs-navy);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;user-select:none';
      el.textContent = 'Button';
      el.dataset.dsItemKind = 'button';
      return el;
    }
    return null;
  }
  let __addBlockPop = null;
  function ensureAddBlockPop() {
    if (__addBlockPop) return __addBlockPop;
    const pop = document.createElement('div');
    pop.className = 'ds-glass-pop ds-addblock-pop';
    pop.innerHTML = `<div class="ds-addblock-eyebrow" style="padding:6px 10px;color:var(--text-3);font:600 var(--type-s-size)/1 var(--font);letter-spacing:.08em;text-transform:uppercase">Essentials</div>` +
      BLOCK_DEFS.map(d => `<button type="button" data-block="${d.key}">${d.icon}<span>${d.label}</span></button>`).join('');
    document.body.appendChild(pop);
    pop.addEventListener('click', e => {
      const b = e.target.closest('[data-block]');
      if (!b) return;
      e.stopPropagation();
      insertBlock(b.dataset.block);
      pop.classList.remove('open');
    });
    __addBlockPop = pop;
    return pop;
  }
  function tagItem(el) {
    if (!el || el.classList.contains('ds-grid-overlay')) return;
    // Authoritative kind from createBlockEl wins; SVG sniffing only for legacy static templates.
    if (el.dataset.dsItemKind) return;
    const isText = !el.classList.contains('tpl-block')
                && !el.querySelector('.tpl-block, img, video, picture')
                && !!(el.textContent || '').trim()
                && el.tagName !== 'BUTTON';
    const isButton = el.tagName === 'BUTTON';
    const hasVideoSvg = !!el.querySelector('svg path[d^="M10 9l5 3"]');
    const isVideo = !!el.querySelector('video') || hasVideoSvg;
    const isImage = el.dataset.dsImage === 'true'
                 || !!el.querySelector('img, picture')
                 || (el.classList.contains('tpl-block') && !isVideo);
    let kind = 'block';
    if (isButton) kind = 'button';
    else if (isText) kind = 'text';
    else if (isVideo) kind = 'video';
    else if (isImage) kind = 'image';
    el.dataset.dsItemKind = kind;
  }
  function tagCanvasItems(thumb) {
    if (!thumb) return;
    [...thumb.children].forEach(c => tagItem(c));
  }
  window.__tagCanvasItems = tagCanvasItems;
  function insertBlock(key) {
    const canvas = document.querySelector('body.ds-tpl-edit .ds-edit-canvas .am-tpl-thumb');
    if (!canvas) return;
    const el = createBlockEl(key);
    if (!el) return;
    // The canvas is a CSS grid (auto 1fr auto rows). Appending children would
    // push existing content into new implicit rows — instead, layer the new
    // block on top with absolute positioning so it floats free until the user
    // anchors/moves it.
    el.style.position = 'absolute';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.placeSelf = '';
    // New blocks land ON TOP of existing content — bump z-index above the
    // current max so the freshly-added item is always visible and clickable,
    // not buried behind a full-bleed image/video already on the canvas.
    el.style.zIndex = String(nextZ(canvas));
    // Insert before the grid overlay so it stays on top.
    const overlay = canvas.querySelector(':scope > .ds-grid-overlay');
    if (overlay) canvas.insertBefore(el, overlay);
    else canvas.appendChild(el);
    tagItem(el);
    if (typeof selectItem === 'function') selectItem(el);
    // record undo step at gesture commit — childList insert is already structural
    // (MO would catch it), but force-flush so Cmd+Z is responsive immediately.
    window.__praiaRecordNow?.();
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-ds-addblock]');
    if (btn) {
      e.preventDefault(); e.stopPropagation();
      const pop = ensureAddBlockPop();
      const open = pop.classList.contains('open');
      pop.classList.toggle('open');
      if (!open) {
        // Position below the trigger, clamped to viewport (same pattern as Cor/Type DD).
        pop.style.top = '0px'; pop.style.left = '0px';
        const r = btn.getBoundingClientRect();
        const mr = pop.getBoundingClientRect();
        const spaceBelow = innerHeight - r.bottom;
        const top = (spaceBelow >= mr.height + 12) ? r.bottom + 8 : Math.max(8, r.top - mr.height - 8);
        const left = Math.min(Math.max(8, r.left), innerWidth - mr.width - 8);
        pop.style.top = `${top}px`;
        pop.style.left = `${left}px`;
      }
      return;
    }
    if (__addBlockPop?.classList.contains('open') && !e.target.closest('.ds-addblock-pop')) {
      __addBlockPop.classList.remove('open');
    }
  }, true);

  // ---- Item inspector (DS template edit mode) ----
  // Clicking a direct child of the cloned template selects it and exposes
  // margin / corner-radius / anchor controls in the right inspector.
  const ANCHOR_MAP = {
    'top-left':      { align: 'start',  justify: 'start'  },
    'top-center':    { align: 'start',  justify: 'center' },
    'top-right':     { align: 'start',  justify: 'end'    },
    'center-left':   { align: 'center', justify: 'start'  },
    'center':        { align: 'center', justify: 'center' },
    'center-right':  { align: 'center', justify: 'end'    },
    'bottom-left':   { align: 'end',    justify: 'start'  },
    'bottom-center': { align: 'end',    justify: 'center' },
    'bottom-right':  { align: 'end',    justify: 'end'    },
  };
  const ANCHOR_LABELS = {
    'top-left':'Top Left','top-center':'Top Center','top-right':'Top Right',
    'center-left':'Center Left','center':'Center','center-right':'Center Right',
    'bottom-left':'Bottom Left','bottom-center':'Bottom Center','bottom-right':'Bottom Right',
  };
  const ANCHOR_KEYS = Object.keys(ANCHOR_MAP);

  let activeItem = null;

  function makeAnchorGrid(activeIdx) {
    let html = '<span class="gr-anchor-grid">';
    for (let i = 0; i < 9; i++) html += `<span class="gr-anchor-dot${i === activeIdx ? ' active' : ''}"></span>`;
    return html + '</span>';
  }
  function paintAnchorButton(key) {
    const idx = ANCHOR_KEYS.indexOf(key);
    const dots = document.getElementById('grc-item-anchor-dots');
    if (!dots) return;
    dots.outerHTML = makeAnchorGrid(idx).replace('<span class="gr-anchor-grid">', '<span class="gr-anchor-grid" id="grc-item-anchor-dots">');
  }
  function buildAnchorMenu() {
    const menu = document.getElementById('grc-item-anchor-menu');
    if (!menu) return;
    menu.innerHTML = ANCHOR_KEYS.map((k, i) =>
      `<button type="button" class="gr-anchor-opt" data-anchor="${k}">${makeAnchorGrid(i)}<span>${ANCHOR_LABELS[k]}</span></button>`
    ).join('');
  }
  buildAnchorMenu();

  // ---- Type picker (DS type tokens applied via tk-* classes) ----
  const TYPE_TOKENS = [
    ['h0', 'H0'], ['super', 'H1'], ['xl', 'H2'], ['l', 'H3'], ['mb', 'H4'],
    ['m', 'Body'], ['sb', 'Caption Bold'], ['s', 'Caption'], ['xs', 'Body Small'],
  ];
  const TK_REGEX = /\btk-(?:h0|super|xl|l|mb|m|sb|s|xs)\b/g;
  function buildTypeMenu() {
    const menu = document.getElementById('grc-item-type-menu');
    if (!menu) return;
    const defaultOpt = `<button type="button" class="gr-anchor-opt" data-type=""><span class="gr-aa" style="color:var(--text-3)">Aa</span><span>Default</span></button>`;
    menu.innerHTML = defaultOpt + TYPE_TOKENS.map(([tok, name]) =>
      `<button type="button" class="gr-anchor-opt" data-type="${tok}"><span class="gr-aa">Aa</span><span>${name}</span></button>`
    ).join('');
  }
  buildTypeMenu();
  function getItemType(el) {
    const m = (el.className.match(TK_REGEX) || [])[0];
    if (m) return m.replace('tk-', '');
    // No explicit tk-* class — infer the closest DS token from computed font-size.
    const rs = getComputedStyle(document.documentElement);
    const itemSize = parseFloat(getComputedStyle(el).fontSize) || 0;
    if (!itemSize) return '';
    let best = '', bestDiff = Infinity;
    TYPE_TOKENS.forEach(([tok]) => {
      const tokSize = parseFloat(rs.getPropertyValue(`--type-${tok}-size`));
      if (!tokSize) return;
      const d = Math.abs(tokSize - itemSize);
      if (d < bestDiff) { bestDiff = d; best = tok; }
    });
    // Only claim a match if within 2px — otherwise leave blank (Default).
    return bestDiff <= 2 ? best : '';
  }
  function applyType(el, tok) {
    el.className = (el.className.replace(TK_REGEX, '').trim() + ' tk-' + tok).replace(/\s+/g, ' ').trim();
  }
  function paintTypeButton(tok) {
    const label = document.getElementById('grc-item-type-label');
    if (!label) return;
    const found = TYPE_TOKENS.find(([t]) => t === tok);
    label.textContent = found ? found[1] : 'Default';
  }
  document.getElementById('grc-item-type')?.addEventListener('click', e => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const menu = document.getElementById('grc-item-type-menu');
    if (!menu) return;
    const willOpen = !menu.classList.contains('open');
    menu.classList.toggle('open');
    if (willOpen) {
      const br = btn.getBoundingClientRect();
      menu.style.left = '0px'; menu.style.top = '0px';
      const mr = menu.getBoundingClientRect();
      const spaceBelow = innerHeight - br.bottom;
      const top = (spaceBelow >= mr.height + 12) ? br.bottom + 6 : Math.max(8, br.top - mr.height - 6);
      const left = Math.min(Math.max(8, br.right - mr.width), innerWidth - mr.width - 8);
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
    }
  });
  document.getElementById('grc-item-type-menu')?.addEventListener('click', e => {
    const opt = e.target.closest('[data-type]');
    if (!opt || !activeItem) return;
    const tok = opt.dataset.type;
    if (tok) {
      applyType(activeItem, tok);
    } else {
      // "Default" — strip any tk-* class so the element reverts to template defaults.
      activeItem.className = activeItem.className.replace(TK_REGEX, '').trim();
    }
    paintTypeButton(tok);
    document.getElementById('grc-item-type-menu').classList.remove('open');
  });
  document.addEventListener('click', e => {
    const menu = document.getElementById('grc-item-type-menu');
    if (!menu || !menu.classList.contains('open')) return;
    if (e.target.closest('#grc-item-type') || e.target.closest('#grc-item-type-menu')) return;
    menu.classList.remove('open');
  });

  // ---- Button variant picker (DS button presets) ----
  // BUTTON_VARIANTS lives further down the file; resolve lazily so this code
  // doesn't need to be re-ordered.
  function btnVariants() { return window.__BUTTON_VARIANTS || []; }
  function btnVarClasses(v) {
    // '.tn-btn.primary' → ['tn-btn', 'primary']
    return (v.selector || '').split('.').filter(Boolean);
  }
  function allBtnVarClasses() {
    const set = new Set();
    btnVariants().forEach(v => btnVarClasses(v).forEach(c => set.add(c)));
    return set;
  }
  function getItemBtnVar(el) {
    if (!el) return '';
    const cls = (el.className || '').split(/\s+/);
    // Find the first variant whose ALL classes are present on the element.
    for (const v of btnVariants()) {
      const need = btnVarClasses(v);
      if (need.length && need.every(c => cls.includes(c))) return v.id;
    }
    return '';
  }
  function applyBtnVar(el, id) {
    if (!el) return;
    const drop = allBtnVarClasses();
    let cls = (el.className || '').split(/\s+/).filter(c => c && !drop.has(c));
    const v = btnVariants().find(x => x.id === id);
    if (v) cls = cls.concat(btnVarClasses(v));
    el.className = cls.join(' ').trim();
    // Wipe ALL inline styles that the createBlockEl seed set (background,
    // color, padding, border-radius, height, font…) so the DS variant CSS
    // (.tn-btn / .am-add / etc.) can fully drive the look. Preserve only the
    // positioning we need to keep the block in place on the canvas.
    if (v) {
      const keep = ['position', 'left', 'top', 'right', 'bottom', 'transform', 'zIndex', 'placeSelf'];
      const saved = {};
      keep.forEach(k => { saved[k] = el.style[k]; });
      el.style.cssText = '';
      Object.entries(saved).forEach(([k, val]) => { if (val) el.style[k] = val; });
    }
    window.__praiaRecordNow?.();
  }
  function paintBtnVarButton(id) {
    const label = document.getElementById('grc-item-btnvar-label');
    if (!label) return;
    const v = btnVariants().find(x => x.id === id);
    label.textContent = v ? v.label : '—';
  }
  function buildBtnVarMenu() {
    const menu = document.getElementById('grc-item-btnvar-menu');
    if (!menu) return;
    menu.innerHTML = btnVariants().map(v =>
      `<button type="button" class="gr-anchor-opt" data-btnvar="${v.id}"><span>${v.label}</span></button>`
    ).join('');
  }
  // Defer until BUTTON_VARIANTS is defined later in this script.
  setTimeout(buildBtnVarMenu, 0);
  document.getElementById('grc-item-btnvar')?.addEventListener('click', e => {
    e.stopPropagation();
    if (!document.getElementById('grc-item-btnvar-menu')?.children.length) buildBtnVarMenu();
    const btn = e.currentTarget;
    const menu = document.getElementById('grc-item-btnvar-menu');
    if (!menu) return;
    const willOpen = !menu.classList.contains('open');
    menu.classList.toggle('open');
    if (willOpen) {
      const br = btn.getBoundingClientRect();
      menu.style.left = '0px'; menu.style.top = '0px';
      const mr = menu.getBoundingClientRect();
      const spaceBelow = innerHeight - br.bottom;
      const top = (spaceBelow >= mr.height + 12) ? br.bottom + 6 : Math.max(8, br.top - mr.height - 6);
      const left = Math.min(Math.max(8, br.right - mr.width), innerWidth - mr.width - 8);
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
    }
  });
  document.getElementById('grc-item-btnvar-menu')?.addEventListener('click', e => {
    const opt = e.target.closest('[data-btnvar]');
    if (!opt || !activeItem) return;
    const id = opt.dataset.btnvar;
    applyBtnVar(activeItem, id);
    paintBtnVarButton(id);
    document.getElementById('grc-item-btnvar-menu').classList.remove('open');
  });
  document.addEventListener('click', e => {
    const menu = document.getElementById('grc-item-btnvar-menu');
    if (!menu || !menu.classList.contains('open')) return;
    if (e.target.closest('#grc-item-btnvar') || e.target.closest('#grc-item-btnvar-menu')) return;
    menu.classList.remove('open');
  });

  function getItemAnchor(el) {
    return el.dataset.dsAnchor || 'center';
  }
  function applyAnchor(el, key) {
    const a = ANCHOR_MAP[key] || ANCHOR_MAP.center;
    el.style.alignSelf = a.align;
    el.style.justifySelf = a.justify;
    // Some children are flex containers (text rows) — also tweak inner alignment
    el.style.alignItems = a.align;
    el.style.justifyContent = a.justify;
    el.dataset.dsAnchor = key;
    // Persist via tplOverrides so anchor survives like fontSize/color (when a template is active).
    if (typeof setProp === 'function' && typeof activeTplName !== 'undefined' && activeTplName) {
      setProp('anchor', key);
    }
  }
  function rgbToHex(rgb) {
    const m = (rgb || '').match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return '';
    const h = n => Math.round(parseFloat(n)).toString(16).padStart(2, '0');
    return ('#' + h(m[0]) + h(m[1]) + h(m[2])).toUpperCase();
  }
  function matchColorOpt(hex) {
    if (!hex) return null;
    const up = hex.toUpperCase();
    return COLOR_OPTS.find(o => {
      if (!o.value || o.value.startsWith('var(')) return false;
      return o.value.toUpperCase() === up;
    }) || null;
  }
  function paintColorButton(hex) {
    const name = document.getElementById('grc-cust-color-name');
    const sw = document.getElementById('grc-cust-color-swatch');
    const btn = document.getElementById('grc-cust-color');
    const opt = matchColorOpt(hex);
    if (opt) {
      if (name) name.textContent = opt.label;
      if (sw) sw.style.background = opt.swatch;
      if (btn) btn.dataset.color = opt.value;
    } else if (hex) {
      if (name) name.textContent = hex;
      if (sw) sw.style.background = hex;
      if (btn) btn.dataset.color = hex;
    } else {
      if (name) name.textContent = 'Padrão';
      if (sw) sw.style.background = 'transparent';
      if (btn) btn.dataset.color = '';
    }
  }
  function syncItemPanel(el) {
    const cs = getComputedStyle(el);
    const r = parseInt(cs.borderTopLeftRadius, 10) || 0;
    const rEl = document.getElementById('grc-item-radius');
    if (rEl) rEl.value = r;
    paintAnchorButton(getItemAnchor(el));
    paintTypeButton(getItemType(el));
    paintColorButton(rgbToHex(cs.color));
    if (el.dataset.dsItemKind === 'button') paintBtnVarButton(getItemBtnVar(el));
    if (typeof window.__syncImageName === 'function') window.__syncImageName(el);
    if (typeof paintTextAlignButtons === 'function') paintTextAlignButtons(cs.textAlign && cs.textAlign !== 'start' ? cs.textAlign : 'left');
  }
  function isTextItem(el) {
    // A text item is one that contains non-empty text and no image/block children.
    if (el.classList.contains('tpl-block')) return false;
    if (el.querySelector('.tpl-block, img, video, picture')) return false;
    return !!(el.textContent || '').trim();
  }
  // Idempotent: converts %-based left/top/transform centering into pixel left/top
  // so drag/resize math has a stable origin. No-op if already in px.
  function normalizeItemToPx(el) {
    if (!el) return;
    const hasPct = /%/.test(el.style.transform || '') || /%/.test(el.style.left || '') || /%/.test(el.style.top || '');
    if (!hasPct) return;
    const thumb = el.closest('.am-tpl-thumb');
    if (!thumb) return;
    const tr = thumb.getBoundingClientRect();
    const ir = el.getBoundingClientRect();
    // Both rects are SCREEN px (the thumb may be under `transform: scale`).
    // Inline style.left/top is CSS px, multiplied by the canvas scale to reach
    // screen — so divide the screen-px delta by the scale before writing.
    const scale = (typeof window.__praiaGetCanvasScale === 'function') ? window.__praiaGetCanvasScale() : 1;
    el.style.position = 'absolute';
    el.style.left = ((ir.left - tr.left) / scale) + 'px';
    el.style.top  = ((ir.top  - tr.top)  / scale) + 'px';
    el.style.transform = 'none';
  }
  function selectItem(el) {
    if (activeItem) activeItem.classList.remove('ds-item-active');
    activeItem = el;
    el.classList.add('ds-item-active');
    document.body.classList.add('ds-item-selected');
    document.body.classList.toggle('ds-item-text', isTextItem(el));
    document.body.classList.toggle('ds-item-block', !isTextItem(el));
    document.body.classList.toggle('ds-item-image', el.dataset.dsItemKind === 'image');
    document.body.classList.toggle('ds-item-button', el.dataset.dsItemKind === 'button');
    // Normalize geometry up-front so the first drag has stable pixel coords.
    normalizeItemToPx(el);
    syncItemPanel(el);
    ensureResizeHandles(el);
  }
  function clearItemSelection() {
    if (activeItem) activeItem.classList.remove('ds-item-active');
    activeItem = null;
    document.body.classList.remove('ds-item-selected', 'ds-item-text', 'ds-item-block', 'ds-item-image');
    clearResizeHandles();
  }

  // ---- Resize handles (Figma-style) for image/video items ----
  function clearResizeHandles() {
    document.querySelectorAll('.ds-edit-canvas .ds-resize-handle').forEach(h => h.remove());
  }
  function ensureResizeHandles(el) {
    clearResizeHandles();
    if (!el) return;
    // Normalize here too: shift-select may add items without going through selectItem.
    normalizeItemToPx(el);
    const kind = el.dataset.dsItemKind;
    if (kind !== 'image' && kind !== 'video' && kind !== 'button') return;
    // Selection of more than one item: no handles (resize is single-item only).
    if (document.querySelectorAll('.ds-edit-canvas .ds-item-active').length > 1) return;
    // Item must be positioned for absolute handles to anchor correctly.
    const pos = getComputedStyle(el).position;
    if (pos === 'static') el.style.position = 'relative';
    ['nw','n','ne','e','se','s','sw','w'].forEach(dir => {
      const h = document.createElement('div');
      h.className = `ds-resize-handle h-${dir}`;
      h.dataset.dir = dir;
      el.appendChild(h);
    });
  }
  document.addEventListener('pointerdown', e => {
    const handle = e.target.closest('.ds-resize-handle');
    if (!handle) return;
    if (!document.body.classList.contains('ds-tpl-edit')) return;
    // Handles on the mask-image overlay are owned by the mask-edit handler.
    if (handle.dataset.maskHandle === 'true') return;
    const item = handle.closest('.ds-edit-canvas .am-tpl-thumb > *, .ds-edit-canvas .am-tpl-thumb .tpl-block');
    if (!item) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = item.getBoundingClientRect();
    // For image masks: lock bg-size to px BEFORE the resize starts so changing
    // the frame's box won't trigger a re-cover (which would re-scale and
    // distort the image relative to the user's previous crop).
    if (item.classList.contains('tpl-block') && item.dataset.dsItemKind === 'image') {
      const hasPx = /\d+(\.\d+)?px\s+\d+(\.\d+)?px/.test(item.style.backgroundSize || '');
      if (!hasPx) {
        const cs2 = getComputedStyle(item);
        const m2 = (cs2.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
        if (m2) {
          const im2 = new Image();
          im2.src = m2[1];
          // If the image is already cached the width/height are immediately
          // available; otherwise we fall back to the frame box (acceptable
          // because the snap-to-px happens once and persists).
          const natW = im2.naturalWidth || rect.width;
          const natH = im2.naturalHeight || rect.height;
          const s = Math.max(rect.width / natW, rect.height / natH);
          const w = natW * s, h = natH * s;
          item.style.backgroundSize = w + 'px ' + h + 'px';
          item.style.backgroundPosition = ((rect.width - w) / 2) + 'px ' + ((rect.height - h) / 2) + 'px';
        }
      }
    }
    const dir = handle.dataset.dir;
    // Column boundaries from the .am-tpl-thumb grid, in viewport coords —
    // resize edges snap to these column lines (same scheme used by drag).
    const thumb = item.closest('.am-tpl-thumb');
    const cs = thumb ? getComputedStyle(thumb) : null;
    const cols = cs ? (parseInt(cs.getPropertyValue('--ds-cols'), 10) || 12) : 12;
    const margin = cs ? (parseFloat(cs.getPropertyValue('--ds-margin')) || 0) : 0;
    const gap = cs ? (parseFloat(cs.getPropertyValue('--ds-gap')) || 0) : 0;
    const tRect = thumb ? thumb.getBoundingClientRect() : null;
    const innerLeft = tRect ? tRect.left + margin : 0;
    const innerW = tRect ? tRect.width - 2 * margin : 0;
    const colW = cols > 0 ? (innerW - (cols - 1) * gap) / cols : 0;
    const xLines = [];
    if (tRect) {
      // Include both the LEFT and RIGHT edge of every column. This lets a
      // resized edge snap to either side of the gap, so users can align the
      // right side of a photo to "end of column N" as well as "start of N+1".
      for (let i = 0; i < cols; i++) {
        const colStart = innerLeft + i * (colW + gap);
        xLines.push(colStart);
        xLines.push(colStart + colW);
      }
    }
    const yLines = tRect ? [tRect.top + margin, tRect.bottom - margin] : [];
    // The resize handler's math runs in SCREEN pixels (rects + clientX). Inline
    // style values are in CSS pixels — multiplied by canvas scale to reach the
    // screen. Capture scale once so the read/writes to style.left/top/width
    // /height can convert in both directions without affecting the rest of
    // the math.
    const __scale = (typeof window.__praiaGetCanvasScale === 'function') ? window.__praiaGetCanvasScale() : 1;
    const __parentRect = item.parentElement.getBoundingClientRect();
    const __styleLeft = parseFloat(item.style.left);
    const __styleTop  = parseFloat(item.style.top);
    const start = {
      x: e.clientX, y: e.clientY,
      w: rect.width, h: rect.height,
      left: rect.left, top: rect.top,
      parentRect: __parentRect,
      origLeftPx: isNaN(__styleLeft) ? (rect.left - __parentRect.left) : __styleLeft * __scale,
      origTopPx:  isNaN(__styleTop)  ? (rect.top  - __parentRect.top)  : __styleTop  * __scale,
    };
    const SNAP = 8;
    function snap(v, lines) {
      let best = v, bestD = SNAP + 1;
      for (const ln of lines) { const d = Math.abs(ln - v); if (d < bestD) { bestD = d; best = ln; } }
      return bestD <= SNAP ? best : v;
    }
    // Use the existing smart-guide overlays so the user sees exactly which
    // column / margin line the edge snapped to (Figma-style).
    if (typeof ensureSmartGuides === 'function') ensureSmartGuides();
    // Convert to absolute px so width/height are predictable.
    item.style.aspectRatio = '';
    item.style.placeSelf = '';
    if (item.style.position !== 'absolute' && item.style.position !== 'fixed') {
      item.style.position = 'absolute';
      item.style.left = (start.origLeftPx / __scale) + 'px';
      item.style.top  = (start.origTopPx / __scale) + 'px';
    }
    // Lock width/height in px immediately so the item doesn't collapse when
    // taken out of its flex/grid parent.
    item.style.width  = (start.w / __scale) + 'px';
    item.style.height = (start.h / __scale) + 'px';
    try { handle.setPointerCapture?.(e.pointerId); } catch (_) { /* synthetic events or stale id */ }
    let __resizeMoved = false;
    function onMove(ev) {
      __resizeMoved = true;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      let w = start.w, h = start.h, left = start.origLeftPx, top = start.origTopPx;
      if (dir.includes('e')) w = Math.max(8, start.w + dx);
      if (dir.includes('s')) h = Math.max(8, start.h + dy);
      if (dir.includes('w')) { w = Math.max(8, start.w - dx); left = start.origLeftPx + (start.w - w); }
      if (dir.includes('n')) { h = Math.max(8, start.h - dy); top  = start.origTopPx  + (start.h - h); }
      let snappedX = null, snappedY = null;
      const isCorner = dir.length === 2;
      const isVideo = item.dataset.dsItemKind === 'video';
      // Videos are always locked to 16:9 — resizing from any handle (corner
      // or edge) preserves that ratio. Other items only lock when Shift is held.
      const aspect = isVideo ? (16 / 9) : (start.w / Math.max(start.h, 1));
      const lockAspect = isVideo || (isCorner && ev.shiftKey);

      // Aspect lock first. Snap below adjusts the driver axis
      // and recomputes the other to preserve the ratio.
      if (lockAspect) {
        const ratioW = w / start.w, ratioH = h / start.h;
        const k = Math.abs(ratioW - 1) > Math.abs(ratioH - 1) ? ratioW : ratioH;
        const nw = start.w * k, nh = start.h * k;
        if (dir.includes('w')) left = start.origLeftPx + (start.w - nw);
        if (dir.includes('n')) top  = start.origTopPx  + (start.h - nh);
        w = Math.max(8, nw); h = Math.max(8, nh);
      }

      // Snap edges. When aspect is locked, snapping one axis recomputes the
      // other from the aspect ratio so the resize stays proportional.
      if (lockAspect) {
        // Try snapping the X edge of the corner; if it snaps, derive h from w.
        let didX = false;
        if (dir.includes('e')) {
          const rightV = start.left + w;
          const s = snap(rightV, xLines);
          if (s !== rightV) {
            w = Math.max(8, s - start.left);
            h = w / aspect;
            if (dir.includes('n')) top = start.origTopPx + (start.h - h);
            snappedX = s; didX = true;
          }
        } else if (dir.includes('w')) {
          const leftV = start.left + (start.w - w);
          const s = snap(leftV, xLines);
          if (s !== leftV) {
            w = Math.max(8, (start.left + start.w) - s);
            left = start.origLeftPx + (start.w - w);
            h = w / aspect;
            if (dir.includes('n')) top = start.origTopPx + (start.h - h);
            snappedX = s; didX = true;
          }
        }
        // If X didn't snap, try Y; recompute w from h.
        if (!didX) {
          if (dir.includes('s')) {
            const bottomV = start.top + h;
            const s = snap(bottomV, yLines);
            if (s !== bottomV) {
              h = Math.max(8, s - start.top);
              w = h * aspect;
              if (dir.includes('w')) left = start.origLeftPx + (start.w - w);
              snappedY = s;
            }
          } else if (dir.includes('n')) {
            const topV = start.top + (start.h - h);
            const s = snap(topV, yLines);
            if (s !== topV) {
              h = Math.max(8, (start.top + start.h) - s);
              top = start.origTopPx + (start.h - h);
              w = h * aspect;
              if (dir.includes('w')) left = start.origLeftPx + (start.w - w);
              snappedY = s;
            }
          }
        }
      } else {
        // Free resize: snap each moving edge independently.
        if (dir.includes('e')) {
          const rightV = start.left + w;
          const s = snap(rightV, xLines);
          if (s !== rightV) { w = Math.max(8, s - start.left); snappedX = s; }
        }
        if (dir.includes('w')) {
          const leftV = start.left + (start.w - w);
          const s = snap(leftV, xLines);
          if (s !== leftV) {
            w = Math.max(8, (start.left + start.w) - s);
            left = start.origLeftPx + (start.w - w);
            snappedX = s;
          }
        }
        if (dir.includes('s')) {
          const bottomV = start.top + h;
          const s = snap(bottomV, yLines);
          if (s !== bottomV) { h = Math.max(8, s - start.top); snappedY = s; }
        }
        if (dir.includes('n')) {
          const topV = start.top + (start.h - h);
          const s = snap(topV, yLines);
          if (s !== topV) {
            h = Math.max(8, (start.top + start.h) - s);
            top = start.origTopPx + (start.h - h);
            snappedY = s;
          }
        }
      }

      // Paint smart guides exactly on the snap line.
      if (__guideV) {
        if (snappedX !== null && tRect) {
          __guideV.style.left = snappedX + 'px';
          __guideV.style.top  = tRect.top + 'px';
          __guideV.style.height = tRect.height + 'px';
          __guideV.classList.add('open');
        } else { __guideV.classList.remove('open'); }
      }
      if (__guideH) {
        if (snappedY !== null && tRect) {
          __guideH.style.top  = snappedY + 'px';
          __guideH.style.left = tRect.left + 'px';
          __guideH.style.width = tRect.width + 'px';
          __guideH.classList.add('open');
        } else { __guideH.classList.remove('open'); }
      }
      item.style.width  = (w / __scale) + 'px';
      item.style.height = (h / __scale) + 'px';
      if (dir.includes('w')) item.style.left = (left / __scale) + 'px';
      if (dir.includes('n')) item.style.top  = (top  / __scale) + 'px';
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      if (typeof hideSmartGuides === 'function') hideSmartGuides();
      // record undo step at gesture commit — skip if no actual resize happened
      // (handle pressed and released without movement).
      if (__resizeMoved) window.__praiaRecordNow?.();
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, true);

  // ---- Canvas height crop (Figma-style frame resize) ----
  // Hover near top/bottom edge of the .am-tpl-thumb in edit mode → cursor
  // becomes ns-resize; click and drag to change ONLY the canvas height.
  // Width is never modified. Top edge: drag up = grow; bottom edge: drag down
  // = grow. Heights below MIN_H are clamped.
  const CANVAS_EDGE_HIT = 8;     // px from edge that triggers the cursor
  const CANVAS_MIN_H    = 120;
  function __canvasEdgeFor(e) {
    if (!document.body.classList.contains('ds-tpl-edit')) return null;
    const thumb = document.querySelector('.ds-edit-canvas .am-tpl-thumb');
    if (!thumb) return null;
    const r = thumb.getBoundingClientRect();
    if (e.clientX < r.left - 2 || e.clientX > r.right + 2) return null;
    if (Math.abs(e.clientY - r.top)    <= CANVAS_EDGE_HIT) return { thumb, edge: 'n', r };
    if (Math.abs(e.clientY - r.bottom) <= CANVAS_EDGE_HIT) return { thumb, edge: 's', r };
    return null;
  }
  let __canvasHover = false;
  document.addEventListener('pointermove', e => {
    if (document.body.classList.contains('ds-canvas-h-dragging')) return;
    const hit = __canvasEdgeFor(e);
    const on = !!hit;
    if (on !== __canvasHover) {
      __canvasHover = on;
      document.body.classList.toggle('ds-canvas-h-hover', on);
    }
  });
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const hit = __canvasEdgeFor(e);
    if (!hit) return;
    e.preventDefault();
    e.stopPropagation();
    const { thumb, edge, r } = hit;
    const startY = e.clientY;
    const startH = r.height;
    const sign = edge === 's' ? 1 : -1;
    document.body.classList.add('ds-canvas-h-dragging');
    let moved = false;
    const __cScale = (typeof window.__praiaGetCanvasScale === 'function') ? window.__praiaGetCanvasScale() : 1;
    function onMove(ev) {
      const dy = ev.clientY - startY;
      const h = Math.max(CANVAS_MIN_H, startH + sign * dy);
      // startH and h are SCREEN px (rect-derived). Thumb's inline height is
      // CSS px (multiplied by --praia-edit-scale to reach screen). Divide.
      thumb.style.height = (h / __cScale) + 'px';
      // Recompute the canvas viewport height so the bottom edge follows.
      window.__praiaApplyEditScale?.();
      if (Math.abs(dy) > 1) moved = true;
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup', onUp, true);
      document.body.classList.remove('ds-canvas-h-dragging');
      if (moved) window.__praiaRecordNow?.();
    }
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', onUp, true);
  }, true);

  // ---- Image mask edit (Figma-style) ----
  // Double-click a photo to enter mask mode. The .tpl-block stays in place as
  // the CROP FRAME (dashed contour). A live IMG element is created at the
  // image's natural-aspect size, positioned over the frame, with handles on
  // the IMG (not the frame). Resize handles scale the image proportionally;
  // dragging the body of the image pans it. On exit, the image's geometry is
  // committed back to the frame's background-size / background-position so
  // the crop persists.
  let __maskTarget = null;       // the .tpl-block being edited
  let __maskWrap   = null;       // the .ds-mask-img-wrap overlay
  let __maskOrigBg = null;       // saved background-image to restore
  let __maskInitial = null;      // snapshot for ESC revert (no commit)
  function enterMaskEdit(block) {
    if (!block || __maskTarget === block) return;
    exitMaskEdit();
    __maskTarget = block;
    // Snapshot pre-edit state so ESC can revert without touching global undo.
    __maskInitial = {
      bg: block.style.backgroundSize || '',
      pos: block.style.backgroundPosition || '',
      w: block.style.width || '',
      h: block.style.height || '',
    };
    // Read background-image BEFORE the .ds-mask-target class hides it via CSS,
    // otherwise getComputedStyle returns "none" and the inner <img> never
    // gets a src.
    const cs = getComputedStyle(block);
    const m = (cs.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
    const url = m ? m[1] : null;
    __maskOrigBg = block.style.backgroundImage || cs.backgroundImage;
    block.classList.add('ds-mask-target');
    document.body.classList.add('ds-img-mask-edit');
    const r = block.getBoundingClientRect();
    // Read current bg-size / bg-position (px if already set, else compute).
    function readPx(value, fallback) {
      if (!value) return fallback;
      const parts = value.split(/\s+/);
      const px = parseFloat(parts[0]); const py = parseFloat(parts[1] != null ? parts[1] : parts[0]);
      return [isNaN(px) ? fallback[0] : px, isNaN(py) ? fallback[1] : py];
    }
    function buildWrap(w, h, x, y) {
      const wrap = document.createElement('div');
      wrap.className = 'ds-mask-img-wrap';
      wrap.style.left = x + 'px';
      wrap.style.top  = y + 'px';
      wrap.style.width  = w + 'px';
      wrap.style.height = h + 'px';
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.draggable = false;
        wrap.appendChild(img);
      }
      ['nw','n','ne','e','se','s','sw','w'].forEach(dir => {
        const hd = document.createElement('div');
        hd.className = `ds-resize-handle h-${dir}`;
        hd.dataset.dir = dir;
        hd.dataset.maskHandle = 'true';
        wrap.appendChild(hd);
      });
      block.appendChild(wrap);
      __maskWrap = wrap;
    }
    function init(natW, natH) {
      if (__maskTarget !== block) return;
      // If user previously customized (bg-size has px), use those values.
      const hasPx = /\d+(\.\d+)?px\s+\d+(\.\d+)?px/.test(block.style.backgroundSize || '');
      let w, h, x, y;
      if (hasPx) {
        [w, h] = readPx(block.style.backgroundSize, [r.width, r.height]);
        [x, y] = readPx(block.style.backgroundPosition, [0, 0]);
      } else {
        const scale = Math.max(r.width / natW, r.height / natH);
        w = natW * scale; h = natH * scale;
        x = (r.width  - w) / 2; y = (r.height - h) / 2;
      }
      buildWrap(w, h, x, y);
    }
    if (url) {
      const im = new Image();
      im.onload  = () => init(im.naturalWidth  || r.width, im.naturalHeight || r.height);
      im.onerror = () => init(r.width, r.height);
      im.src = url;
    } else {
      init(r.width, r.height);
    }
  }
  // ESC path: restore pre-edit snapshot and exit WITHOUT committing to undo.
  function exitMaskEditRevert() {
    if (!__maskTarget) return;
    const block = __maskTarget;
    if (__maskInitial) {
      block.style.backgroundSize = __maskInitial.bg;
      block.style.backgroundPosition = __maskInitial.pos;
      if (__maskInitial.w) block.style.width = __maskInitial.w;
      if (__maskInitial.h) block.style.height = __maskInitial.h;
    }
    if (__maskWrap) { __maskWrap.remove(); __maskWrap = null; }
    if (__maskOrigBg) { block.style.backgroundImage = __maskOrigBg; __maskOrigBg = null; }
    block.classList.remove('ds-mask-target');
    __maskTarget = null;
    __maskInitial = null;
    document.body.classList.remove('ds-img-mask-edit');
  }
  function exitMaskEdit() {
    if (!__maskTarget) return;
    const block = __maskTarget;
    // Commit the wrap geometry to background-size / background-position so the
    // crop survives leaving mask mode.
    let __maskCommitted = false;
    if (__maskWrap) {
      const w = parseFloat(__maskWrap.style.width);
      const h = parseFloat(__maskWrap.style.height);
      const x = parseFloat(__maskWrap.style.left);
      const y = parseFloat(__maskWrap.style.top);
      const prevSize = block.style.backgroundSize;
      const prevPos = block.style.backgroundPosition;
      if (!isNaN(w) && !isNaN(h)) block.style.backgroundSize = w + 'px ' + h + 'px';
      if (!isNaN(x) && !isNaN(y)) block.style.backgroundPosition = x + 'px ' + y + 'px';
      if (block.style.backgroundSize !== prevSize || block.style.backgroundPosition !== prevPos) {
        __maskCommitted = true;
      }
      __maskWrap.remove();
      __maskWrap = null;
    }
    if (__maskOrigBg) { block.style.backgroundImage = __maskOrigBg; __maskOrigBg = null; }
    block.classList.remove('ds-mask-target');
    __maskTarget = null;
    __maskInitial = null;
    document.body.classList.remove('ds-img-mask-edit');
    // record undo step at gesture commit — only if the crop actually changed.
    if (__maskCommitted) window.__praiaRecordNow?.();
  }
  document.addEventListener('dblclick', e => {
    if (!document.body.classList.contains('ds-tpl-edit')) return;
    const block = e.target.closest('.ds-edit-canvas .am-tpl-thumb .tpl-block');
    if (!block) return;
    if (block.dataset.dsItemKind !== 'image') return;
    e.preventDefault(); e.stopPropagation();
    enterMaskEdit(block);
  }, true);

  // Pan and resize handlers operate on the image WRAP, not the frame.
  document.addEventListener('pointerdown', e => {
    if (!__maskTarget || !__maskWrap) return;
    // Resize handle on the wrap → scale the image proportionally.
    const handle = e.target.closest('.ds-mask-img-wrap > .ds-resize-handle');
    if (handle) {
      e.preventDefault(); e.stopPropagation();
      const wrap = __maskWrap;
      const dir = handle.dataset.dir;
      const startW = parseFloat(wrap.style.width);
      const startH = parseFloat(wrap.style.height);
      const startX = parseFloat(wrap.style.left);
      const startY = parseFloat(wrap.style.top);
      const aspect = startW / Math.max(startH, 1);
      const sX = e.clientX, sY = e.clientY;
      // The mask wrap lives inside the scaled .am-tpl-thumb — mouse deltas
      // are SCREEN px, wrap inline styles are CSS px (scaled visually).
      const __mScale = (typeof window.__praiaGetCanvasScale === 'function') ? window.__praiaGetCanvasScale() : 1;
      try { handle.setPointerCapture?.(e.pointerId); } catch (_) {}
      function onMove(ev) {
        const dx = (ev.clientX - sX) / __mScale;
        const dy = (ev.clientY - sY) / __mScale;
        let w = startW, h = startH, x = startX, y = startY;
        if (dir.includes('e')) w = Math.max(8, startW + dx);
        if (dir.includes('s')) h = Math.max(8, startH + dy);
        if (dir.includes('w')) { w = Math.max(8, startW - dx); x = startX + (startW - w); }
        if (dir.includes('n')) { h = Math.max(8, startH - dy); y = startY + (startH - h); }
        // Mask edit ALWAYS preserves the image aspect by default (resizing a
        // photo to a different ratio would distort it). Shift breaks the lock.
        if (!ev.shiftKey) {
          const rW = w / startW, rH = h / startH;
          // For edge handles (1-axis), the driver is whichever axis we moved.
          // For corner handles, use the larger relative change.
          const k = Math.abs(rW - 1) > Math.abs(rH - 1) ? rW : rH;
          const nw = startW * k, nh = startH * k;
          // Anchor opposite edge/corner so the image doesn't drift while
          // scaling — picks the side appropriate to the handle direction.
          if (dir.includes('w'))      x = startX + (startW - nw);
          else if (!dir.includes('e')) x = startX + (startW - nw) / 2; // top/bottom edge → keep centered horizontally
          if (dir.includes('n'))      y = startY + (startH - nh);
          else if (!dir.includes('s')) y = startY + (startH - nh) / 2; // left/right edge → keep centered vertically
          w = Math.max(8, nw); h = Math.max(8, nh);
        }
        wrap.style.width = w + 'px';
        wrap.style.height = h + 'px';
        wrap.style.left = x + 'px';
        wrap.style.top  = y + 'px';
      }
      function onUp() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      return;
    }
    // Pointerdown on the wrap body → pan.
    const wrap = e.target.closest('.ds-mask-img-wrap');
    if (wrap) {
      e.preventDefault(); e.stopPropagation();
      const startX = parseFloat(wrap.style.left);
      const startY = parseFloat(wrap.style.top);
      const sX = e.clientX, sY = e.clientY;
      const __pScale = (typeof window.__praiaGetCanvasScale === 'function') ? window.__praiaGetCanvasScale() : 1;
      wrap.classList.add('is-panning');
      try { wrap.setPointerCapture?.(e.pointerId); } catch (_) {}
      function onMove(ev) {
        wrap.style.left = (startX + (ev.clientX - sX) / __pScale) + 'px';
        wrap.style.top  = (startY + (ev.clientY - sY) / __pScale) + 'px';
      }
      function onUp() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        wrap.classList.remove('is-panning');
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      return;
    }
    // Clicking inside the frame but outside the wrap: swallow the event so the
    // item-drag handler doesn't try to move the frame underneath us.
    if (e.target.closest('.ds-mask-target')) {
      e.preventDefault(); e.stopPropagation();
      return;
    }
    // Clicking fully outside the frame exits mask edit.
    e.preventDefault(); e.stopPropagation();
    exitMaskEdit();
  }, true);

  // ESC reverts mask edit (no commit); Enter commits; Cmd/Ctrl+Z is swallowed in mask mode.
  document.addEventListener('keydown', e => {
    if (!__maskTarget) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      exitMaskEditRevert();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      exitMaskEdit();
      return;
    }
    // Block global undo while in mask mode — revert-to-initial is the local undo.
    if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      e.stopPropagation();
      exitMaskEditRevert();
    }
  }, true);

  // Wheel zoom on the image wrap while in mask edit, anchored to the cursor.
  document.addEventListener('wheel', e => {
    if (!__maskTarget || !__maskWrap) return;
    if (!e.target.closest('.ds-mask-img-wrap, .ds-mask-target')) return;
    e.preventDefault();
    const wrap = __maskWrap;
    const sw = parseFloat(wrap.style.width);
    const sh = parseFloat(wrap.style.height);
    const sx = parseFloat(wrap.style.left);
    const sy = parseFloat(wrap.style.top);
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    const nw = Math.max(20, sw * factor);
    const nh = Math.max(20, sh * factor);
    // Cursor position relative to the frame (.ds-mask-target).
    const fr = __maskTarget.getBoundingClientRect();
    const cx = e.clientX - fr.left, cy = e.clientY - fr.top;
    const npx = cx - (cx - sx) * (nw / sw);
    const npy = cy - (cy - sy) * (nh / sh);
    wrap.style.width = nw + 'px';
    wrap.style.height = nh + 'px';
    wrap.style.left = npx + 'px';
    wrap.style.top  = npy + 'px';
  }, { passive: false });

  // ---- Fill / Fit / Crop / Center modes (right inspector) ----
  function getNaturalSize(block, cb) {
    const cs = getComputedStyle(block);
    const m = (cs.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
    const url = m ? m[1] : null;
    if (!url) return cb(null);
    const im = new Image();
    im.onload  = () => cb({ w: im.naturalWidth, h: im.naturalHeight, url });
    im.onerror = () => cb(null);
    im.src = url;
  }
  function applyFitMode(block, mode) {
    if (!block) return;
    block.dataset.imgFit = mode;
    if (mode === 'crop') { paintFitButtons(mode); return; } // manual — leave as-is
    const r = block.getBoundingClientRect();
    getNaturalSize(block, (nat) => {
      if (!nat) return;
      let w, h;
      if (mode === 'fill') {
        const s = Math.max(r.width / nat.w, r.height / nat.h);
        w = nat.w * s; h = nat.h * s;
      } else if (mode === 'fit') {
        const s = Math.min(r.width / nat.w, r.height / nat.h);
        w = nat.w * s; h = nat.h * s;
      } else { // center — keep current size, just re-center
        const cur = (block.style.backgroundSize || '').split(/\s+/).map(parseFloat);
        if (cur.length === 2 && !isNaN(cur[0]) && !isNaN(cur[1])) { w = cur[0]; h = cur[1]; }
        else { const s = Math.max(r.width / nat.w, r.height / nat.h); w = nat.w * s; h = nat.h * s; }
      }
      const x = (r.width - w) / 2, y = (r.height - h) / 2;
      // If currently editing this block in mask mode, drive the wrap too so the
      // change is visible immediately.
      if (__maskTarget === block && __maskWrap) {
        __maskWrap.style.width = w + 'px';
        __maskWrap.style.height = h + 'px';
        __maskWrap.style.left = x + 'px';
        __maskWrap.style.top  = y + 'px';
      }
      block.style.backgroundSize = w + 'px ' + h + 'px';
      block.style.backgroundPosition = x + 'px ' + y + 'px';
      paintFitButtons(mode);
    });
  }
  function paintFitButtons(active) {
    document.querySelectorAll('.gr-imgfit-btn').forEach(b => {
      b.classList.toggle('is-active', b.dataset.imgFit === active);
    });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.gr-imgfit-btn');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    // Resolve the target block: mask-edit target wins, then the currently
    // active image item, then the active sidebar selection, then the only
    // .tpl-block in the canvas (common case).
    let block = __maskTarget
      || document.querySelector('.ds-edit-canvas .tpl-block.ds-item-active')
      || (typeof activeItem !== 'undefined' && activeItem && activeItem.classList.contains('tpl-block') ? activeItem : null)
      || document.querySelector('body.ds-tpl-edit .ds-edit-canvas .am-tpl-thumb .tpl-block');
    if (!block) return;
    applyFitMode(block, b.dataset.imgFit);
  });
  // When an image item is selected, reflect its current fit mode in the buttons.
  const __origSyncImagePanel = window.__syncImageName;
  // Hook syncItemPanel via the existing chain: refresh fit-button state on selection.
  document.addEventListener('click', e => {
    const block = e.target.closest('.ds-edit-canvas .tpl-block');
    if (!block) return;
    const mode = block.dataset.imgFit || 'fill';
    paintFitButtons(mode);
  }, true);

  function findSelectable(target) {
    // Prefer the deepest .tpl-block (image cells in image templates), then
    // fall back to any direct child of .am-tpl-thumb.
    const block = target.closest('.ds-edit-canvas .am-tpl-thumb .tpl-block');
    if (block) return block;
    return target.closest('.ds-edit-canvas .am-tpl-thumb > *');
  }
  document.addEventListener('click', e => {
    if (!document.body.classList.contains('ds-tpl-edit')) return;
    // Swallow the click that fires after a marquee drag — it would otherwise
    // collapse the multi-selection back to a single item under the cursor.
    if (__marqueeJustDragged) { __marqueeJustDragged = false; e.preventDefault(); e.stopPropagation(); return; }
    // Clicks on the right inspector or back button should not deselect
    if (e.target.closest('.guide-right') || e.target.closest('[data-ds-edit-back]')) return;
    const item = findSelectable(e.target);
    if (item && !item.classList.contains('ds-grid-overlay')) {
      e.preventDefault(); e.stopPropagation();
      selectItem(item);
      return;
    }
    // Click on canvas background or empty area deselects
    if (e.target.closest('.ds-edit-stage')) {
      clearItemSelection();
    }
  });

  // Radius input
  document.getElementById('grc-item-radius')?.addEventListener('input', e => {
    if (!activeItem) return;
    activeItem.style.borderRadius = `${parseInt(e.target.value, 10) || 0}px`;
  });

  // ---- Grid (columns / gap) — applied to the cloned .am-tpl-thumb in edit canvas
  function currentThumb() {
    // Pick the thumb whose section is currently visible (multiple templates-*
    // sections share the same .ds-edit-canvas structure but only one is shown).
    const all = document.querySelectorAll('body.ds-tpl-edit .ds-edit-canvas .am-tpl-thumb');
    for (const t of all) {
      const sec = t.closest('section[data-ds-section]');
      if (sec && getComputedStyle(sec).display !== 'none') return t;
    }
    return all[0] || null;
  }
  function applyGrid(cols, gap) {
    const t = currentThumb(); if (!t) return;
    t.style.setProperty('--ds-cols', String(cols));
    t.style.setProperty('--ds-gap', `${gap}px`);
    let ov = t.querySelector(':scope > .ds-grid-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'ds-grid-overlay';
      t.insertBefore(ov, t.firstChild);
    }
    if (ov.children.length !== cols) {
      ov.innerHTML = '';
      for (let i = 0; i < cols; i++) ov.appendChild(document.createElement('span'));
    }
  }
  function readGridInputs() {
    const cols = Math.max(1, parseInt(document.getElementById('grc-grid-cols')?.value, 10) || 12);
    const gap  = Math.max(0, parseInt(document.getElementById('grc-grid-gap')?.value, 10)  || 0);
    return { cols, gap };
  }
  document.getElementById('grc-grid-cols')?.addEventListener('input', () => {
    const { cols, gap } = readGridInputs(); applyGrid(cols, gap);
  });
  document.getElementById('grc-grid-gap')?.addEventListener('input', () => {
    const { cols, gap } = readGridInputs(); applyGrid(cols, gap);
  });

  // ---- Drag with snap-to-grid for the selected item
  // Items use translate() to offset; snapping rounds the x-translate to the
  // nearest column boundary so movement stays aligned to the visible grid.
  let drag = null;
  // The drag/snap math throughout the handler works in SCREEN pixels (clientX,
  // getBoundingClientRect). But the inline transform on the item is in CSS
  // pixels — once inside the scaled .am-tpl-thumb, those CSS px get multiplied
  // by the canvas scale before reaching screen. To keep drag 1:1 with the
  // mouse visually, getTranslate exposes the SCREEN-px equivalent of the
  // stored CSS translate, and setTranslate divides incoming screen-px values
  // back into CSS px when writing them out.
  function getTranslate(el) {
    const m = (el.style.transform || '').match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    if (!m) return { x: 0, y: 0 };
    const scale = (typeof window.__praiaGetCanvasScale === 'function') ? window.__praiaGetCanvasScale() : 1;
    return { x: parseFloat(m[1]) * scale, y: parseFloat(m[2]) * scale };
  }
  function setTranslate(el, x, y) {
    const scale = (typeof window.__praiaGetCanvasScale === 'function') ? window.__praiaGetCanvasScale() : 1;
    el.style.transform = `translate(${x / scale}px, ${y / scale}px)`;
  }
  document.addEventListener('pointerdown', e => {
    if (!document.body.classList.contains('ds-tpl-edit')) return;
    // While in mask-edit, mask handler owns pointer — never start an item drag.
    if (document.body.classList.contains('ds-img-mask-edit')) return;
    // Shift held → mousedown/marquee handler owns the gesture (shift+click
    // toggles, shift+drag = additive marquee). Don't start a drag here.
    if (e.shiftKey) return;
    // Figma-style: pointerdown on any item (selected or not) starts a drag.
    // If the item wasn't selected, select it first so the marquee handler
    // (mousedown, runs after) sees an active item and yields. Pointerdown on
    // empty canvas area falls through to the marquee handler.
    let item = e.target.closest('.ds-edit-canvas .am-tpl-thumb > *:not(.ds-grid-overlay)');
    // Image templates also support .tpl-block cells.
    if (!item) item = e.target.closest('.ds-edit-canvas .am-tpl-thumb .tpl-block');
    if (!item) return;
    if (!item.classList.contains('ds-item-active') && typeof selectItem === 'function') {
      selectItem(item);
    }
    e.preventDefault();
    const thumb = item.closest('.am-tpl-thumb');
    // Safety net: normalization should have already run in selectItem; idempotent if so.
    normalizeItemToPx(item);
    const cs = getComputedStyle(thumb);
    const cols = parseInt(cs.getPropertyValue('--ds-cols'), 10) || 12;
    const margin = parseFloat(cs.getPropertyValue('--ds-margin')) || 0;
    const gap = parseFloat(cs.getPropertyValue('--ds-gap')) || 0;
    const thumbRect = thumb.getBoundingClientRect();
    const innerLeft = thumbRect.left + margin;
    const innerW = thumbRect.width - 2 * margin;
    const colW = (innerW - (cols - 1) * gap) / cols;
    // Absolute viewport X for each column start (0..cols-1) plus the right edge.
    const boundaries = [];
    for (let i = 0; i < cols; i++) boundaries.push(innerLeft + i * (colW + gap));
    boundaries.push(innerLeft + innerW);
    // Vertical snap targets: top margin line, bottom margin line. Item snaps
    // when its top or bottom edge hits one of these.
    const innerTop = thumbRect.top + margin;
    const innerBottom = thumbRect.bottom - margin;
    const boundariesY = [innerTop, innerBottom];
    const itemRect = item.getBoundingClientRect();
    const start = getTranslate(item);
    // Multi-drag: if there are other items in the selection, normalize their
    // positioning too and capture their start translate so we can move all
    // together as the primary item moves.
    const allSelected = [...thumb.querySelectorAll(':scope > .ds-item-active')];
    if (allSelected.length > 1) {
      // Safety net for multi-drag — each selected item may have skipped selectItem.
      allSelected.forEach(s => { if (s !== item) normalizeItemToPx(s); });
    }
    const others = allSelected.filter(s => s !== item).map(s => ({ el: s, start: getTranslate(s) }));
    drag = {
      item,
      mouseOffsetX: e.clientX - itemRect.left,
      mouseOffsetY: e.clientY - itemRect.top,
      origLeft: itemRect.left - start.x,
      origTop: itemRect.top - start.y,
      itemW: itemRect.width,
      itemH: itemRect.height,
      thumbRect,
      boundaries,
      boundariesY,
      innerLeft,
      innerRight: innerLeft + innerW,
      innerTop,
      innerBottom,
      others,
      startX: start.x,
      startY: start.y,
    };
    item.classList.add('is-dragging');
    others.forEach(o => o.el.classList.add('is-dragging'));
    item.setPointerCapture?.(e.pointerId);
    ensureSmartGuides();
  });
  // Smart guides — cyan dashed lines that appear when the dragged item's center
  // aligns with the container's horizontal or vertical centerline (Figma-style).
  let __guideV = null, __guideH = null;
  function ensureSmartGuides() {
    if (!__guideV) {
      __guideV = document.createElement('div');
      __guideV.className = 'ds-smart-guide ds-smart-guide-v';
      document.body.appendChild(__guideV);
    }
    if (!__guideH) {
      __guideH = document.createElement('div');
      __guideH.className = 'ds-smart-guide ds-smart-guide-h';
      document.body.appendChild(__guideH);
    }
  }
  function hideSmartGuides() {
    __guideV?.classList.remove('open');
    __guideH?.classList.remove('open');
  }
  const SMART_SNAP = 6;  // tolerance for explicit guides (margins + centerlines)
  const COL_SNAP   = 3;  // tighter tolerance for column boundaries (lighter feel)
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    // Desired new left of the item: where the pointer would put it.
    const desiredLeft = e.clientX - drag.mouseOffsetX;
    let bestX = desiredLeft;
    // X smart snaps: center, margins, AND column boundaries (item's left edge
    // or right edge). All candidates within SMART_SNAP compete — closest wins,
    // so center/margins still take priority when you get genuinely close.
    const thumb = drag.thumbRect;
    const thumbCx = thumb.left + thumb.width / 2;
    const desiredItemCx = desiredLeft + drag.itemW / 2;
    const desiredItemRight = desiredLeft + drag.itemW;
    const xCandidates = [
      { guide: thumbCx,         newLeft: thumbCx - drag.itemW / 2,     d: Math.abs(desiredItemCx - thumbCx) },
      { guide: drag.innerLeft,  newLeft: drag.innerLeft,               d: Math.abs(desiredLeft - drag.innerLeft) },
      { guide: drag.innerRight, newLeft: drag.innerRight - drag.itemW, d: Math.abs(desiredItemRight - drag.innerRight) },
    ];
    // Column boundaries: snap on item's left edge AND right edge.
    for (const col of drag.boundaries) {
      xCandidates.push({ guide: col, newLeft: col,                d: Math.abs(desiredLeft - col) });
      xCandidates.push({ guide: col, newLeft: col - drag.itemW,   d: Math.abs(desiredItemRight - col) });
    }
    const xPicks = xCandidates.filter(c => c.d <= SMART_SNAP).sort((a, b) => a.d - b.d);
    let showV = false, snapVX = null;
    if (xPicks[0]) {
      bestX = xPicks[0].newLeft;
      snapVX = xPicks[0].guide;
      showV = true;
    }
    const newTranslateX = bestX - drag.origLeft;

    // Y smart snaps: center, top margin, bottom margin — closest within SMART_SNAP wins.
    let desiredTop = e.clientY - drag.mouseOffsetY;
    const thumbCy = thumb.top + thumb.height / 2;
    const desiredItemCy = desiredTop + drag.itemH / 2;
    const yCandidates = [
      { guide: thumbCy,         newTop: thumbCy - drag.itemH / 2,    d: Math.abs(desiredItemCy - thumbCy) },
      { guide: drag.innerTop,   newTop: drag.innerTop,               d: Math.abs(desiredTop - drag.innerTop) },
      { guide: drag.innerBottom,newTop: drag.innerBottom - drag.itemH, d: Math.abs((desiredTop + drag.itemH) - drag.innerBottom) },
    ].filter(c => c.d <= SMART_SNAP).sort((a, b) => a.d - b.d);
    let showH = false, snapHY = null;
    if (yCandidates[0]) {
      desiredTop = yCandidates[0].newTop;
      snapHY = yCandidates[0].guide;
      showH = true;
    }
    const newTranslateY = desiredTop - drag.origTop;
    setTranslate(drag.item, newTranslateX, newTranslateY);
    // Move every other selected item by the same delta so the whole group
    // travels together as a unit (Figma-style multi-drag).
    if (drag.others && drag.others.length) {
      const dx = newTranslateX - drag.startX;
      const dy = newTranslateY - drag.startY;
      drag.others.forEach(o => setTranslate(o.el, o.start.x + dx, o.start.y + dy));
    }

    // Paint guides
    ensureSmartGuides();
    if (showV) {
      __guideV.style.left = (snapVX ?? thumbCx) + 'px';
      __guideV.style.top = thumb.top + 'px';
      __guideV.style.height = thumb.height + 'px';
      __guideV.classList.add('open');
    } else __guideV.classList.remove('open');
    if (showH) {
      __guideH.style.top = (snapHY ?? thumbCy) + 'px';
      __guideH.style.left = thumb.left + 'px';
      __guideH.style.width = thumb.width + 'px';
      __guideH.classList.add('open');
    } else __guideH.classList.remove('open');
  });
  document.addEventListener('pointerup', e => {
    if (!drag) return;
    hideSmartGuides();
    drag.item.classList.remove('is-dragging');
    if (drag.others) drag.others.forEach(o => o.el.classList.remove('is-dragging'));
    // record undo step at gesture commit — only if the item actually moved
    // (a no-move click should not push a history entry).
    const end = getTranslate(drag.item);
    if (end.x !== drag.startX || end.y !== drag.startY) {
      window.__praiaRecordNow?.();
    }
    drag = null;
  });

  // Anchor button + dropdown
  document.getElementById('grc-item-anchor')?.addEventListener('click', e => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const menu = document.getElementById('grc-item-anchor-menu');
    if (!menu) return;
    const willOpen = !menu.classList.contains('open');
    menu.classList.toggle('open');
    if (willOpen) {
      const br = btn.getBoundingClientRect();
      // Render once to measure, then place above/below the button and clamp to viewport
      menu.style.left = '0px'; menu.style.top = '0px';
      const mr = menu.getBoundingClientRect();
      const spaceBelow = innerHeight - br.bottom;
      const top = (spaceBelow >= mr.height + 12)
        ? br.bottom + 6
        : Math.max(8, br.top - mr.height - 6);
      const left = Math.min(Math.max(8, br.right - mr.width), innerWidth - mr.width - 8);
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
    }
  });
  document.getElementById('grc-item-anchor-menu')?.addEventListener('click', e => {
    const opt = e.target.closest('[data-anchor]');
    if (!opt || !activeItem) return;
    const key = opt.dataset.anchor;
    applyAnchor(activeItem, key);
    paintAnchorButton(key);
    document.getElementById('grc-item-anchor-menu').classList.remove('open');
  });
  document.addEventListener('click', e => {
    const menu = document.getElementById('grc-item-anchor-menu');
    if (!menu || !menu.classList.contains('open')) return;
    if (e.target.closest('#grc-item-anchor') || e.target.closest('#grc-item-anchor-menu')) return;
    menu.classList.remove('open');
  });

  // Unified change router: writes to tplDraft (when a template is active) or
  // to the live component instance (custPending) and updates the UI label.
  function setProp(prop, value) {
    // Item-level edits win: when a single item is selected in the DS template
    // editor (e.g. a button or text added via Add Block), apply the style
    // directly to that node so Cor/Type act on the instance, not on the whole
    // template's CSS override layer.
    if (activeItem && document.body.classList.contains('ds-tpl-edit')) {
      activeItem.style[prop] = value;
      window.__praiaRecordNow?.();
      // Keep the customize labels in sync so the inspector reflects the change.
      try { setCustLabels({ ...(custPending || {}), [prop]: value }); } catch {}
      return;
    }
    if (activeTplName) {
      tplDraft[prop] = value;
      tplOverrides[activeTplName] = tplDraft;
      renderTplOverridesCSS();
      try { localStorage.setItem('grc-tpl-overrides', JSON.stringify(tplOverrides)); } catch {}
      window.__praiaRecordNow?.();
    } else {
      const comp = ensureCustSnapshot(); if (!comp) return;
      custPending[prop] = value;
      // CSS property keys map 1:1 to style props here.
      comp.style[prop] = value;
      window.__praiaRecordNow?.();
    }
    setCustLabels(activeTplName ? tplDraft : custPending);
  }
  // Expose for snapshot/applySnapshot so Cmd+Z can round-trip template overrides.
  window.__grcGetTplOverrides = () => tplOverrides;
  window.__grcSetTplOverrides = (next) => {
    tplOverrides = (next && typeof next === 'object') ? next : {};
    if (activeTplName) {
      tplDraft = { fontFamily: '', fontSize: '', fontWeight: '', color: '', anchor: '', ...(tplOverrides[activeTplName] || {}) };
      setCustLabels(tplDraft);
    }
    renderTplOverridesCSS();
    try { localStorage.setItem('grc-tpl-overrides', JSON.stringify(tplOverrides)); } catch {}
  };

  document.getElementById('grc-cust-family')?.addEventListener('click', e => {
    e.stopPropagation();
    openCustDD(e.currentTarget, FAMILY_OPTS, o => setProp('fontFamily', o.value));
  });
  document.getElementById('grc-cust-weight')?.addEventListener('click', e => {
    e.stopPropagation();
    openCustDD(e.currentTarget, WEIGHT_OPTS, o => setProp('fontWeight', o.value));
  });
  document.getElementById('grc-cust-size')?.addEventListener('click', e => {
    e.stopPropagation();
    openCustDD(e.currentTarget, SIZE_OPTS, o => setProp('fontSize', o.value));
  });
  document.getElementById('grc-cust-color')?.addEventListener('click', e => {
    e.stopPropagation();
    openCustDD(e.currentTarget, COLOR_OPTS, o => setProp('color', o.value));
  });

  // Save / Cancel — routes by whichever flow is active.
  document.getElementById('grc-cust-save')?.addEventListener('click', () => {
    if (activeTplName) {
      try { localStorage.setItem('grc-tpl-overrides', JSON.stringify(tplOverrides)); } catch {}
      renderTplOverridesCSS();
      window.__praiaAutosave?.();
      return;
    }
    const comp = getActiveComponent(); if (!comp) return;
    const name = comp.dataset.componentName;
    const targets = name
      ? Array.from(document.querySelectorAll('.praia-component')).filter(c => c.dataset.componentName === name)
      : [comp];
    targets.forEach(el => {
      el.style.fontFamily = custPending.fontFamily;
      el.style.fontSize   = custPending.fontSize;
      el.style.fontWeight = custPending.fontWeight;
      el.style.color      = custPending.color;
    });
    custSnapshot = null;
    syncComponentPanel(comp);
    window.__praiaAutosave?.();
  });
  document.getElementById('grc-cust-cancel')?.addEventListener('click', () => {
    if (activeTplName) {
      try {
        tplOverrides = JSON.parse(localStorage.getItem('grc-tpl-overrides') || '{}');
      } catch { tplOverrides = {}; }
      tplDraft = { fontFamily: '', fontSize: '', fontWeight: '', color: '', anchor: '', ...(tplOverrides[activeTplName] || {}) };
      renderTplOverridesCSS();
      setCustLabels(tplDraft);
      return;
    }
    if (!custSnapshot) return;
    custSnapshot.items.forEach(({ el, fontFamily, fontSize, fontWeight, color }) => {
      el.style.fontFamily = fontFamily || '';
      el.style.fontSize   = fontSize   || '';
      el.style.fontWeight = fontWeight || '';
      el.style.color      = color      || '';
    });
    custSnapshot = null;
    const comp = getActiveComponent();
    if (comp) syncCustControls(comp);
    window.__praiaAutosave?.();
  });

  // Restore saved overrides on load.
  try {
    tplOverrides = JSON.parse(localStorage.getItem('grc-tpl-overrides') || '{}');
    renderTplOverridesCSS();
  } catch {}

  // Snapshot used by Undo while editing.
  let editingSnapshot = null;

  // Edit / Detach / Close buttons
  document.getElementById('grc-edit')?.addEventListener('click', () => {
    const comp = document.querySelector('.praia-component.component-selected');
    if (comp) {
      editingSnapshot = comp.outerHTML;
      startEditingComponent(comp);
      // Keep the Layout panel visible with the advanced section now active.
      right.classList.add('component-mode');
      syncComponentEditFields(comp);
    }
  });

  document.getElementById('grc-undo')?.addEventListener('click', () => {
    if (!editingSnapshot) return;
    const comp = document.querySelector('.praia-component.component-editing');
    if (!comp) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = editingSnapshot;
    const restored = tmp.firstElementChild;
    if (!restored) return;
    comp.replaceWith(restored);
    document.body.classList.remove('editing-component');
    right.classList.remove('component-mode');
    editingSnapshot = null;
    window.__praiaAutosave?.();
  });

  document.getElementById('grc-save')?.addEventListener('click', () => {
    const comp = document.querySelector('.praia-component.component-editing');
    if (!comp) return;
    comp.classList.remove('component-editing');
    document.body.classList.remove('editing-component');
    // Keep selection so the user still sees what they edited.
    syncComponentPanel(comp);
    right.classList.add('component-mode');
    editingSnapshot = null;
    window.__praiaAutosave?.();
  });
  document.getElementById('grc-detach')?.addEventListener('click', () => {
    const comp = document.querySelector('.praia-component.component-selected');
    if (!comp) return;
    comp.classList.remove('praia-component', 'component-selected', 'component-editing');
    delete comp.dataset.componentId;
    delete comp.dataset.componentName;
    delete comp.dataset.componentCategory;
    document.body.classList.remove('editing-component');
    right.classList.remove('component-mode');
    window.__praiaAutosave?.();
  });
  document.getElementById('grc-close')?.addEventListener('click', () => {
    stopEditingComponent();
    clearComponentSelection();
  });

  // Escape exits component edit mode
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('editing-component')) {
      stopEditingComponent();
      clearComponentSelection();
    }
  });
})();
