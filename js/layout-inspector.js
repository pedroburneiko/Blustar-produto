// layout-inspector.js
// Extraído do script principal (Fase 3, 🟡 só consome). Move verbatim.
// lê window.__praiaCloseRightModes/__praiaSyncTextPanel (opt, em handlers); não expõe.
/* Canvas selection → Layout inspector */
(() => {
  const right = document.querySelector('.guide-right');
  if (!right) return;
  const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'BUTTON', 'LABEL', 'SMALL', 'EM', 'STRONG'];
  const textClasses = [
    'specimen',
    'meta',
    'tile-title',
    'tile-desc',
    'tile-num',
    'tile-eyebrow',
    'swatch-name',
    'swatch-hex',
    'world-eyebrow',
    'world-title',
    'world-sub',
    'label',
    'stat',
    'desc',
    'accent',
    'cta',
    'otp-title',
    'otp-link',
    'resource-title',
    'resource-desc',
    'prevnext-eyebrow',
    'prevnext-title',
    'page-eyebrow',
    'page-sub',
    'section-head',
    'activity',
  ];
  function isTextEl(el) {
    if (textTags.includes(el.tagName)) return true;
    if (textClasses.some(c => el.classList.contains(c))) return true;
    // Already-styled with a token/color class → treat as text.
    if (/\b(tk-|cl-)/.test(el.className || '')) return true;
    // Heuristic: leaf element whose own text content is its primary payload.
    if (el.children.length === 0 && (el.textContent || '').trim().length > 0) return true;
    return false;
  }
  function selectEl(el) {
    document.querySelectorAll('.canvas-selected').forEach(x => {
      x.classList.remove('canvas-selected');
      if (x.getAttribute('contenteditable') === 'true') {
        x.removeAttribute('contenteditable');
        x.removeAttribute('spellcheck');
      }
    });
    el.classList.add('canvas-selected');
    window.__praiaCloseRightModes?.();
    // Always open the Text inspector so style + color pickers are available for every element.
    right.classList.add('text-mode');
    const text = isTextEl(el);
    if (text) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      el.focus();
    }
    window.__praiaSyncTextPanel?.(el);
  }
  function clearSelection() {
    document.querySelectorAll('.canvas-selected').forEach(x => {
      x.classList.remove('canvas-selected');
      if (x.getAttribute('contenteditable') === 'true') {
        x.removeAttribute('contenteditable');
        x.removeAttribute('spellcheck');
      }
    });
    right.classList.remove('layout-mode', 'text-mode', 'color-mode', 'video-mode', 'spacing-mode');
  }
  document.addEventListener('click', e => {
    if (document.body.classList.contains('preview-mode')) return;
    if (e.target.closest('.tpl-img')) return;
    // Template edit canvas owns its own selection (selectItem + gr-item-insp);
    // don't let the global text-mode handler hijack clicks inside it.
    if (e.target.closest('.ds-edit-canvas')) return;
    const el = e.target.closest(
      '[data-world="guide"] :where(.guide-page .am-add,.guide-page .bs-cta,.guide-page h1,.guide-page h2,.guide-page h3,.guide-page h4,.guide-page h5,.guide-page h6,.guide-page p,.guide-page a,.guide-page li,.guide-page span,.guide-page .card,.guide-page .swatch,.guide-page .type-row,.guide-page .color-grid,.guide-page .type-grid,.guide-page .specimen,.guide-page .meta,.guide-page .swatch-chip,.guide-page .swatch-info,.guide-page .swatch-name,.guide-page .swatch-hex,.guide-page .tile-title,.guide-page .tile-desc,.guide-page .otp-title,.guide-page .otp-link,.guide-page .resources-title,.guide-page .resource-row,.guide-page .resource-title,.guide-page .resource-desc,.guide-page .resource-thumb,.guide-page .resource-action,.guide-page .page-eyebrow,.guide-page .page-sub,.guide-page .prevnext,.guide-page .prevnext-card,.guide-page .prevnext-eyebrow,.guide-page .prevnext-title,.guide-page .prevnext-arrow,.guide-page .world-eyebrow,.guide-page .cl-name,.guide-page .cl-meta,.guide-page .meta-hex,.guide-page .meta-rgb,.guide-page .meta-cmyk,.guide-page .meta-pms,.guide-page [class*="tk-"]),' +
        '.world-head :where(.world-eyebrow,.world-title,.world-sub,h1,h2,h3,p),' +
        '[data-world="home"] :where(.am-add,.bs-cta,h1,h2,h3,h4,p,a,span,li,.card,.home-hero,.home-hero-main,.home-hero-side,.home-hero .cta,.home-hero-side .label,.home-hero-side .stat,.home-hero-side .desc,.home-hero-side .accent,.tile-eyebrow,.tile-num,.tile-title,.tile-desc,.section-head,.activity)'
    );
    if (el) {
      e.preventDefault();
      e.stopPropagation();
      selectEl(el);
      // In DS mode, if the element uses a type token (.tk-*), auto-open the
      // global Edit Text Style editor so changes propagate to all consumers.
      if (document.body.classList.contains('ds-mode')) {
        const tkCls = [...el.classList].find(c => /^tk-(super|xl|l|mb|m|sb|s|xs)$/.test(c));
        if (tkCls) {
          const tok = tkCls.replace('tk-', '');
          const item = document.querySelector(`.type-item[data-token="${tok}"]`);
          const right = document.querySelector('.guide-right');
          right?.classList.remove('text-mode', 'layout-mode', 'color-mode', 'video-mode', 'spacing-mode');
          if (item) item.click();
        }
      }
      return;
    }
    if (e.target.closest('.guide-right') || e.target.closest('.guide-side') || e.target.closest('#topnav') || e.target.closest('#sidebar') || e.target.closest('.tk-popover') || e.target.closest('.canvas-hover-tools') || e.target.closest('.canvas-ctx') || e.target.closest('.am-overlay')) return;
    clearSelection();
  });
  document.getElementById('grl-close').addEventListener('click', clearSelection);
  document.getElementById('grt-close').addEventListener('click', clearSelection);
  document.querySelectorAll('.grt-align button').forEach(b =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.grt-align button').forEach(x => x.classList.toggle('active', x === b));
      const sel = document.querySelector('.canvas-selected');
      if (sel) sel.style.textAlign = b.dataset.align;
    })
  );

  /* Delete / Duplicate via keyboard + right-click context menu */
  const ctx = document.createElement('div');
  ctx.className = 'canvas-ctx';
  ctx.innerHTML = '<button type="button" data-act="duplicate">Duplicar</button><button type="button" data-act="delete">Deletar</button>';
  document.body.appendChild(ctx);
  let ctxTarget = null;

  function pickTarget(el) {
    // Never escape the page/header container.
    const page = el.closest('.guide-page, .world-head');
    if (!page) return null;
    // Prefer the smallest *self-contained* card group — e.g. a single swatch
    // (chip + name + hex), a type-row, or a card. Pieces inside that group
    // (.swatch-chip, .swatch-info, .tile-title) escalate to the parent card.
    const card = el.closest('.swatch, .type-row, .card');
    if (card && page.contains(card)) return card;
    const block = el.closest('.specimen, .world-eyebrow, .world-title, .world-sub, h1, h2, h3, p, img, .tpl-img, .color-grid, .type-grid');
    if (block && page.contains(block)) return block;
    return el === page ? null : el;
  }

  function duplicateEl(el) {
    if (!el) return;
    const clone = el.cloneNode(true);
    clone.classList.remove('canvas-selected');
    clone.removeAttribute('contenteditable');
    clone.removeAttribute('spellcheck');
    el.parentNode.insertBefore(clone, el.nextSibling);
  }
  function deleteEl(el) {
    if (!el) return;
    clearSelection();
    el.remove();
  }

  document.addEventListener('contextmenu', e => {
    if (document.body.classList.contains('preview-mode') || document.body.classList.contains('ds-mode')) return;
    if (e.target.closest('.guide-right, .guide-side, #topnav, #sidebar, .add-module-slot, .am-overlay')) return;
    const target = pickTarget(e.target);
    if (!target) return;
    e.preventDefault();
    ctxTarget = target;
    selectEl(target);
    const pad = 6;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    ctx.classList.add('open');
    const w = ctx.offsetWidth || 160,
      h = ctx.offsetHeight || 70;
    ctx.style.left = Math.min(e.clientX, vw - w - pad) + 'px';
    ctx.style.top = Math.min(e.clientY, vh - h - pad) + 'px';
  });
  document.addEventListener('click', e => {
    if (!ctx.contains(e.target)) ctx.classList.remove('open');
  });
  ctx.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    e.stopPropagation();
    const act = b.dataset.act;
    if (act === 'duplicate') duplicateEl(ctxTarget);
    else if (act === 'delete') deleteEl(ctxTarget);
    ctx.classList.remove('open');
    ctxTarget = null;
  });

  document.addEventListener('keydown', e => {
    if (document.body.classList.contains('preview-mode') || document.body.classList.contains('ds-mode')) return;
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    const active = document.activeElement;
    const tag = (active?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    // Editing text in a contenteditable → let the browser handle the delete.
    if (active && (active.isContentEditable || active.closest?.('[contenteditable="true"]'))) return;
    const winSel = window.getSelection?.();
    if (winSel && !winSel.isCollapsed) {
      const anchor = winSel.anchorNode;
      const anchorEl = anchor?.nodeType === 1 ? anchor : anchor?.parentElement;
      // Text selection inside a contenteditable → defer to browser (text delete).
      if (anchorEl && (anchorEl.isContentEditable || anchorEl.closest?.('[contenteditable="true"]'))) return;
      // Plain text selection on the canvas (not editable) → delete the parent
      // module the selection lives in. This matches the user expectation: "if I
      // select text in a block and hit Delete, the block goes away".
      const guidePage = anchorEl?.closest?.('.guide-page');
      if (guidePage) {
        // Find the top-level module under .guide-page that contains the selection.
        let mod = anchorEl;
        while (mod && mod.parentElement && mod.parentElement !== guidePage) {
          mod = mod.parentElement;
        }
        if (mod && mod.parentElement === guidePage && !mod.classList.contains('add-module-slot')) {
          e.preventDefault();
          winSel.removeAllRanges();
          deleteEl(mod);
          return;
        }
      }
    }
    // Fallback: there's a canvas-selected block but no text selection → delete it.
    const sel = document.querySelector('.canvas-selected');
    if (!sel) return;
    e.preventDefault();
    deleteEl(sel);
  });
})();
