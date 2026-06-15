// hover-toolbar.js
// Extraído do script principal (Fase 3, 🟡 só consome). Move verbatim.
// lê window.__praiaAutosave/__praiaReplaceVideo (opt, em handlers); não expõe.
/* Hover toolbar — Duplicate / Delete on every group, Replace + Delete on photos */
(() => {
  const tools = document.createElement('div');
  tools.className = 'canvas-hover-tools';
  const ring = document.createElement('div');
  ring.className = 'canvas-hover-ring';
  document.body.appendChild(ring);
  document.body.appendChild(tools);

  const ICN = {
    dup:  '<span class="bs-icon" style="--bs-icon-size:16px">content_copy</span>',
    del:  '<span class="bs-icon" style="--bs-icon-size:16px">delete</span>',
    rep:  '<span class="bs-icon" style="--bs-icon-size:16px">refresh</span>',
    spc:  '<span class="bs-icon" style="--bs-icon-size:16px">height</span>',
    mov:  '<span class="bs-icon" style="--bs-icon-size:16px">drag_indicator</span>',
  };

  function pickGroup(el) {
    const head = el.closest('.world-head');
    if (head) return head;
    const page = el.closest('.guide-page');
    if (!page) return null;
    // Prefer the smallest self-contained card; fall back to the module-level row.
    const card = el.closest('.swatch, .type-row, .card, .tpl-img, .video-mod, .resource-row, .prevnext-card');
    if (card && page.contains(card)) return card;
    const row = el.closest('.otp-block, .resources-block, .prevnext, .color-grid, .type-grid, .spacer-block, .on-this-page, .color-section, .page-hero');
    if (row && page.contains(row)) return row;
    // Any direct child of .guide-page is a module-level row.
    let p = el;
    while (p && p.parentElement !== page) p = p.parentElement;
    return p || null;
  }

  let current = null;
  function place() {
    if (!current || !current.isConnected) { hide(); return; }
    // For a full-bleed block (e.g. cover 05) the visible element is the bled-out
    // frame, which is wider than the content-width group wrapper. Outline the
    // frame so the selection ring matches what the user actually sees.
    const fb = current.querySelector?.('.praia-frame[data-praia-fullbleed="1"]');
    const r = (fb || current).getBoundingClientRect();
    ring.style.left = (r.left - 4) + 'px';
    ring.style.top = (r.top - 4) + 'px';
    ring.style.width = (r.width + 8) + 'px';
    ring.style.height = (r.height + 8) + 'px';
    ring.classList.add('open');
    // Toolbar centered horizontally and vertically over the group
    tools.classList.add('open');
    const tw = tools.offsetWidth || 140;
    const th = tools.offsetHeight || 32;
    const centerX = r.left + r.width / 2 - tw / 2;
    const centerY = r.top + r.height / 2 - th / 2;
    tools.style.top = Math.max(8, Math.min(window.innerHeight - th - 8, centerY)) + 'px';
    tools.style.left = Math.max(8, Math.min(window.innerWidth - tw - 8, centerX)) + 'px';
  }
  function show(el) {
    if (current === el) return;
    current = el;
    const isImg = el.classList.contains('tpl-img');
    const isVid = el.classList.contains('video-mod');
    tools.innerHTML = `<button type="button" data-act="move" aria-label="Mover (arraste)" title="Mover · arraste" style="cursor:grab">${ICN.mov}</button>`
      + ((isImg || isVid)
        ? `<button type="button" data-act="replace" aria-label="Substituir" title="Substituir">${ICN.rep}</button>`
        : `<button type="button" data-act="duplicate" aria-label="Duplicar" title="Duplicar">${ICN.dup}</button>`)
      + `<button type="button" data-act="spacing" aria-label="Ajustar respiro (arraste)" title="Ajustar respiro · arraste">${ICN.spc}</button>`
      + `<button type="button" data-act="delete" aria-label="Deletar" title="Deletar">${ICN.del}</button>`;
    place();
  }
  function hide() {
    current = null;
    tools.classList.remove('open');
    ring.classList.remove('open');
  }

  document.addEventListener('mousemove', e => {
    if (document.body.classList.contains('preview-mode') || document.body.classList.contains('ds-mode')) return;
    if (e.target.closest('.canvas-hover-tools, .canvas-ctx, .guide-right, .guide-side, #topnav, #sidebar, .add-module-slot, .am-overlay')) return;
    const g = pickGroup(e.target);
    if (!g) { hide(); return; }
    show(g);
  });
  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);

  tools.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b || !current) return;
    // Spacing/move are drag interactions handled below; ignore click here.
    if (b.dataset.act === 'spacing' || b.dataset.act === 'move') return;
    e.stopPropagation();
    e.preventDefault();
    const act = b.dataset.act;
    const target = current;
    if (act === 'replace') {
      if (target.classList.contains('video-mod')) {
        window.__praiaReplaceVideo?.(target);
      } else {
        target.click();
      }
    } else if (act === 'duplicate') {
      const clone = target.cloneNode(true);
      clone.classList.remove('canvas-selected');
      clone.removeAttribute('contenteditable');
      clone.removeAttribute('spellcheck');
      target.parentNode.insertBefore(clone, target.nextSibling);
      window.__praiaAutosave?.();
    } else if (act === 'delete') {
      hide();
      target.remove();
      window.__praiaAutosave?.();
    }
  });

  // Spacing handle — click + drag down/up to adjust margin-bottom of the target.
  let drag = null;
  const measurement = document.createElement('div');
  measurement.style.cssText = 'position:fixed;z-index: var(--z-toast);background:var(--bs-cyan);color:var(--bs-ink);font:700 11px/1 var(--font);padding:4px 8px;border-radius:4px;pointer-events:none;display:none;letter-spacing:0.04em';
  document.body.appendChild(measurement);

  tools.addEventListener('mousedown', e => {
    const b = e.target.closest('button[data-act="spacing"]');
    if (!b || !current) return;
    e.preventDefault(); e.stopPropagation();
    drag = {
      target: current,
      startY: e.clientY,
      startMb: parseInt(current.style.marginBottom, 10) || 0,
    };
    document.body.style.cursor = 'ns-resize';
    measurement.style.display = 'block';
  });

  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const delta = e.clientY - drag.startY;
    const next = Math.max(0, Math.min(400, drag.startMb + delta));
    drag.target.style.marginBottom = next + 'px';
    measurement.textContent = Math.round(next) + 'px';
    const r = drag.target.getBoundingClientRect();
    measurement.style.left = (r.left + r.width / 2 - 20) + 'px';
    measurement.style.top  = (r.bottom + 6) + 'px';
    place();
  });

  window.addEventListener('mouseup', () => {
    if (!drag) return;
    drag = null;
    document.body.style.cursor = '';
    measurement.style.display = 'none';
    window.__praiaAutosave?.();
  });

  /* Move handle — drag a whole module up/down to reorder among its siblings. */
  let moveDrag = null;
  const dropLine = document.createElement('div');
  dropLine.style.cssText = 'position:fixed;left:0;right:0;height:2px;background:var(--bs-cyan);box-shadow:0 0 0 1px rgba(15,196,213,0.4);z-index: var(--z-toast);pointer-events:none;display:none';
  document.body.appendChild(dropLine);

  function moduleSiblings(target) {
    const parent = target.parentNode;
    return Array.from(parent.children).filter(c => c !== target && !c.classList.contains('add-module-slot'));
  }

  tools.addEventListener('mousedown', e => {
    const b = e.target.closest('button[data-act="move"]');
    if (!b || !current) return;
    e.preventDefault(); e.stopPropagation();
    moveDrag = { target: current, parent: current.parentNode };
    document.body.style.cursor = 'grabbing';
    b.style.cursor = 'grabbing';
    current.style.opacity = '0.5';
    tools.classList.remove('open');
    ring.classList.remove('open');
  });

  window.addEventListener('mousemove', e => {
    if (!moveDrag) return;
    const siblings = moduleSiblings(moveDrag.target);
    let dropBefore = null;
    let dropY = null;
    for (const s of siblings) {
      const r = s.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (e.clientY < mid) { dropBefore = s; dropY = r.top; break; }
    }
    if (!dropBefore && siblings.length) {
      const last = siblings[siblings.length - 1];
      dropY = last.getBoundingClientRect().bottom;
    }
    if (dropY !== null) {
      dropLine.style.display = 'block';
      dropLine.style.top = (dropY - 1) + 'px';
      const parentR = moveDrag.parent.getBoundingClientRect();
      dropLine.style.left = parentR.left + 'px';
      dropLine.style.width = parentR.width + 'px';
    }
    moveDrag.dropBefore = dropBefore;
  });

  window.addEventListener('mouseup', () => {
    if (!moveDrag) return;
    const { target, parent, dropBefore } = moveDrag;
    // Remove the slot immediately following the target (each module is paired with a slot below).
    const nextSlot = target.nextElementSibling;
    if (dropBefore && dropBefore !== target.nextElementSibling) {
      parent.insertBefore(target, dropBefore);
      if (nextSlot && nextSlot.classList.contains('add-module-slot')) {
        parent.insertBefore(nextSlot, target.nextSibling);
      }
    } else if (!dropBefore) {
      parent.appendChild(target);
      if (nextSlot && nextSlot.classList.contains('add-module-slot')) {
        parent.appendChild(nextSlot);
      }
    }
    target.style.opacity = '';
    dropLine.style.display = 'none';
    document.body.style.cursor = '';
    moveDrag = null;
    window.__praiaAutosave?.();
  });
})();
