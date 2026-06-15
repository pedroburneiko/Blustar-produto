// guide-sidebar.js — sidebar esquerda do guide: ações (eye/3-dots), context menu,
// drag, normalização de itens (Fase 3, 🟠 expõe).
// Expõe __praiaEnsureActions/__praiaMakeDraggable/__praiaNormalizeItem/__praiaRefreshHierarchy.
// CARREGA ANTES DO state.js: o restore do state (load-time) chama NormalizeItem/
// EnsureActions/RefreshHierarchy nos itens restaurados — ordem auditada (senão
// itens restaurados não seriam wired = regressão silenciosa).
/* Guide left-sidebar: inject eye + 3-dots actions, wire context menu */
(() => {
  const menu = document.getElementById('gsi-menu');
  if (!menu) return;
  const eyeSvg = '<span class="bs-icon" style="--bs-icon-size:15px">visibility</span>';
  const dotsSvg = '<span class="bs-icon" style="--bs-icon-size:15px">more_horiz</span>';
  function ensureActions(it) {
    if (it.querySelector('.gsi-actions')) return;
    const actions = document.createElement('span');
    actions.className = 'gsi-actions';
    actions.innerHTML = `<button type="button" class="gsi-eye" aria-label="Hide">${eyeSvg}</button><button type="button" class="gsi-dots" aria-label="More">${dotsSvg}</button>`;
    it.appendChild(actions);
  }
  document.querySelectorAll('.guide-side-item').forEach(ensureActions);
  window.__praiaEnsureActions = ensureActions;

  // Normalize legacy items: convert any stray text labels into a .gsi-label span
  // and strip whitespace-only text nodes that fight the CSS grid layout.
  function normalizeItem(it) {
    if (!it.querySelector('.gsi-label')) {
      const txt = [...it.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (txt) {
        const lbl = document.createElement('span');
        lbl.className = 'gsi-label';
        lbl.textContent = txt;
        const actions = it.querySelector('.gsi-actions');
        if (actions) it.insertBefore(lbl, actions);
        else it.appendChild(lbl);
      }
    }
    // Drop every direct text-node child (they push grid items into wrong columns).
    [...it.childNodes].filter(n => n.nodeType === 3).forEach(n => n.remove());
    it.setAttribute('draggable', 'true');
  }
  document.querySelectorAll('.guide-side-item').forEach(normalizeItem);
  window.__praiaNormalizeItem = normalizeItem;

  // Hierarchy helpers
  const caretSvg = '<span class="bs-icon" style="--bs-icon-size:16px">expand_more</span>';
  function refreshHierarchy() {
    const list = document.querySelector('.guide-side-list');
    if (!list) return;
    const items = [...list.querySelectorAll('.guide-side-item')];
    // Compute which masters have children
    const hasKids = new Set();
    items.forEach(it => {
      const p = it.dataset.parent;
      if (p) hasKids.add(p);
    });
    items.forEach(it => {
      const id = it.dataset.page;
      const isMaster = !it.dataset.parent;
      const shouldHaveCaret = isMaster && hasKids.has(id);
      it.classList.toggle('has-children', shouldHaveCaret);
      let caret = it.querySelector('.gsi-caret');
      if (shouldHaveCaret && !caret) {
        caret = document.createElement('button');
        caret.type = 'button';
        caret.className = 'gsi-caret';
        caret.setAttribute('aria-label', 'Expand/collapse');
        caret.innerHTML = caretSvg;
        it.prepend(caret); // left side, before label
      } else if (!shouldHaveCaret && caret) {
        caret.remove();
      } else if (caret && it.firstElementChild !== caret) {
        // Legacy items had the caret appended on the right; move to left.
        it.prepend(caret);
      }
    });
    // Apply collapsed state — hide sub items whose ancestor master is collapsed
    items.forEach(it => {
      const parentId = it.dataset.parent;
      if (!parentId) {
        it.classList.remove('gsi-hidden');
        return;
      }
      const master = list.querySelector(`.guide-side-item[data-page="${CSS.escape(parentId)}"]:not([data-parent])`);
      const collapsed = master?.classList.contains('collapsed');
      it.classList.toggle('gsi-hidden', !!collapsed);
    });
  }
  window.__praiaRefreshHierarchy = refreshHierarchy;
  refreshHierarchy();

  // --- Drag & drop reordering (master/sub) ---
  const sideListEl2 = document.querySelector('[data-world="guide"] .guide-side-list');
  function makeDraggable(it) {
    it.setAttribute('draggable', 'true');
  }
  document.querySelectorAll('.guide-side-item').forEach(makeDraggable);
  window.__praiaMakeDraggable = makeDraggable;

  let __dragId = null;
  function clearDropMarkers() {
    document.querySelectorAll('.gsi-drop-before, .gsi-drop-after, .gsi-drop-inside').forEach(x => {
      x.classList.remove('gsi-drop-before', 'gsi-drop-after', 'gsi-drop-inside');
    });
  }
  if (sideListEl2) {
    sideListEl2.addEventListener('dragstart', e => {
      const it = e.target.closest('.guide-side-item');
      if (!it) return;
      __dragId = it.dataset.page;
      it.classList.add('gsi-dragging');
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', __dragId);
      } catch {}
    });
    sideListEl2.addEventListener('dragend', () => {
      document.querySelectorAll('.gsi-dragging').forEach(x => x.classList.remove('gsi-dragging'));
      clearDropMarkers();
      __dragId = null;
    });
    sideListEl2.addEventListener('dragover', e => {
      if (!__dragId) return;
      const it = e.target.closest('.guide-side-item');
      if (!it) {
        // Hovering empty space inside the list — show "drop at bottom as top-level"
        if (e.target === sideListEl2 || sideListEl2.contains(e.target)) {
          e.preventDefault();
          clearDropMarkers();
          sideListEl2.dataset.dropEnd = '1';
        }
        return;
      }
      delete sideListEl2.dataset.dropEnd;
      if (it.dataset.page === __dragId) return;
      e.preventDefault();
      clearDropMarkers();
      const r = it.getBoundingClientRect();
      const y = e.clientY - r.top;
      const h = r.height;
      const dragged = sideListEl2.querySelector(`.guide-side-item[data-page="${CSS.escape(__dragId)}"]`);
      const draggedIsMaster = dragged && !dragged.dataset.parent;
      const isSelfChild = !!dragged && it.dataset.parent === dragged.dataset.page;
      const canNest = !isSelfChild;
      // Center of row = nest (auto-creates group / joins existing group).
      // Top/bottom edges = sibling reorder.
      const targetIsMaster = !it.dataset.parent;
      // When dragging a SUB onto a MASTER, biasing heavily toward 'inside' matches
      // user intent for "drop this page into that group" (e.g. Our colors → Motion).
      // Only a 4px sliver at the very top/bottom triggers a sibling reorder.
      // Master→master and sub→sub keep the standard 22% edge band.
      const subOntoMaster = canNest && targetIsMaster && !draggedIsMaster;
      const edge = subOntoMaster ? 4 : Math.max(4, h * 0.22);
      let pos;
      if (canNest && y >= edge && y <= h - edge) pos = 'inside';
      else if (y < h / 2) pos = 'before';
      else pos = 'after';
      // Don't allow dropping a master (with subs) INSIDE another item
      if (pos === 'inside' && draggedIsMaster) {
        const hasSubs = !!sideListEl2.querySelector(`.guide-side-item[data-parent="${CSS.escape(dragged.dataset.page)}"]`);
        if (hasSubs) pos = y < h / 2 ? 'before' : 'after';
      }
      it.classList.add('gsi-drop-' + pos);
      it.dataset.dropPos = pos;
    });
    sideListEl2.addEventListener('dragleave', e => {
      const it = e.target.closest('.guide-side-item');
      if (!it) return;
      it.classList.remove('gsi-drop-before', 'gsi-drop-after', 'gsi-drop-inside');
    });
    sideListEl2.addEventListener('drop', e => {
      if (!__dragId) return;
      const dragged = sideListEl2.querySelector(`.guide-side-item[data-page="${CSS.escape(__dragId)}"]`);
      const target = e.target.closest('.guide-side-item');
      // Drop on empty list area → append as top-level master at the bottom
      if (!target) {
        if (sideListEl2.dataset.dropEnd && dragged) {
          e.preventDefault();
          delete sideListEl2.dataset.dropEnd;
          const draggedIsMaster = !dragged.dataset.parent;
          const group = [dragged];
          if (draggedIsMaster) {
            const subs = [...sideListEl2.querySelectorAll(`.guide-side-item[data-parent="${CSS.escape(dragged.dataset.page)}"]`)];
            group.push(...subs);
          }
          dragged.removeAttribute('data-parent');
          group.forEach(g => sideListEl2.appendChild(g));
          refreshHierarchy();
          __dragId = null;
          window.__praiaAutosave?.();
        }
        return;
      }
      delete sideListEl2.dataset.dropEnd;
      e.preventDefault();
      const pos = target.dataset.dropPos || 'after';
      delete target.dataset.dropPos;
      clearDropMarkers();
      if (!dragged || dragged === target) {
        __dragId = null;
        return;
      }
      // Collect dragged group (master + subs) to move together
      const draggedIsMaster = !dragged.dataset.parent;
      const group = [dragged];
      if (draggedIsMaster) {
        const subs = [...sideListEl2.querySelectorAll(`.guide-side-item[data-parent="${CSS.escape(dragged.dataset.page)}"]`)];
        group.push(...subs);
      }
      // Compute new parent for the dragged item
      let newParent;
      if (pos === 'inside') {
        // If target is already a sub, join its existing group instead of breaking it.
        newParent = target.dataset.parent || target.dataset.page;
      } else {
        // Drop before/after — inherit target's parent (top-level if target is master)
        newParent = target.dataset.parent || null;
        // A master being moved among other masters stays top-level
        if (draggedIsMaster && !newParent) newParent = null;
      }
      // Compute the insertion anchor BEFORE mutating dragged's data-parent —
      // otherwise the freshly-reparented dragged shows up in the subs query
      // below and pins itself before the master (the original bug: dragged
      // sub appeared above the new master instead of nested under it).
      let anchor = pos === 'before' ? target : target.nextSibling;
      // If target is a master with subs, "after" needs to skip past existing subs (so masters stay contiguous)
      if (pos === 'after' && !target.dataset.parent) {
        let lastSub = target;
        const subs = sideListEl2.querySelectorAll(`.guide-side-item[data-parent="${CSS.escape(target.dataset.page)}"]`);
        subs.forEach(s => {
          if (s !== dragged) lastSub = s;
        });
        anchor = lastSub.nextSibling;
      }
      // If inside, place at end of the group (target's existing parent, or target itself)
      if (pos === 'inside') {
        const groupMasterId = newParent;
        const groupMaster = sideListEl2.querySelector(`.guide-side-item[data-page="${CSS.escape(groupMasterId)}"]:not([data-parent])`);
        let lastSub = groupMaster || target;
        const subs = sideListEl2.querySelectorAll(`.guide-side-item[data-parent="${CSS.escape(groupMasterId)}"]`);
        subs.forEach(s => {
          if (s !== dragged) lastSub = s;
        });
        anchor = lastSub.nextSibling;
      }
      // Now safe to mutate parent + insert
      if (newParent) dragged.dataset.parent = newParent;
      else dragged.removeAttribute('data-parent');
      // If our computed anchor is the dragged element itself (can happen when
      // dragged sits immediately after the master and there were no other subs),
      // skip past it so we don't insertBefore(dragged, dragged) — a no-op that
      // would leave dragged above the master.
      if (anchor === dragged) anchor = dragged.nextSibling;
      group.forEach(g => sideListEl2.insertBefore(g, anchor));
      refreshHierarchy();
      __dragId = null;
      window.__praiaAutosave?.();
    });
  }

  // Delegated handlers — survive innerHTML restore from autosave
  const sideListEl = document.querySelector('[data-world="guide"] .guide-side-list');
  if (sideListEl) {
    sideListEl.addEventListener('click', e => {
      const caret = e.target.closest('.gsi-caret');
      if (caret) {
        e.preventDefault();
        e.stopPropagation();
        const it = caret.closest('.guide-side-item');
        if (!it) return;
        it.classList.toggle('collapsed');
        refreshHierarchy();
        window.__praiaAutosave?.();
        return;
      }
      const eye = e.target.closest('.gsi-eye');
      const dots = e.target.closest('.gsi-dots');
      if (!eye && !dots) return;
      e.preventDefault();
      e.stopPropagation();
      const it = (eye || dots).closest('.guide-side-item');
      if (!it) return;
      if (eye) {
        it.classList.toggle('hidden-page');
        return;
      }
      openMenu(it, dots);
    });
    sideListEl.addEventListener('dblclick', e => {
      if (e.target.closest('.gsi-caret, .gsi-actions, .gsi-eye, .gsi-dots')) return;
      const it = e.target.closest('.guide-side-item');
      if (!it) return;
      e.preventDefault();
      currentItem = it;
      doAct('rename');
    });
  }

  let currentItem = null;
  function openMenu(item, trigger) {
    document.querySelectorAll('.guide-side-item.gsi-open').forEach(x => x.classList.remove('gsi-open'));
    currentItem = item;
    item.classList.add('gsi-open');
    document.getElementById('gsi-hide-label').textContent = item.classList.contains('hidden-page') ? 'Show' : 'Hide';
    // Show first (off-screen) so we can measure the menu, then position with
    // viewport clamping so it never gets clipped at the edges.
    menu.style.left = '-9999px';
    menu.style.top = '-9999px';
    menu.classList.add('open');
    requestAnimationFrame(() => {
      const r = trigger.getBoundingClientRect();
      const mw = menu.offsetWidth;
      const mh = menu.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 6,
        pad = 8;
      // Horizontal: open to the right of trigger by default; flip to the left
      // if it would overflow the viewport.
      let left = r.right + gap;
      if (left + mw + pad > vw) left = Math.max(pad, r.left - gap - mw);
      // Vertical: align to trigger top; if it would overflow the bottom, shift
      // up so the whole menu fits (and never let it cross the top either).
      let top = r.top;
      if (top + mh + pad > vh) top = Math.max(pad, vh - mh - pad);
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    });
  }
  function closeMenu() {
    menu.classList.remove('open');
    document.querySelectorAll('.guide-side-item.gsi-open').forEach(x => x.classList.remove('gsi-open'));
    currentItem = null;
  }
  document.addEventListener('click', e => {
    if (!menu.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
    if (currentItem && (e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.tagName !== 'INPUT') doAct('delete');
    if (currentItem && e.key.toLowerCase() === 'd' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      doAct('duplicate');
    }
  });

  function doAct(act) {
    if (!currentItem) return;
    const page = currentItem.dataset.page;
    const pageEl = document.querySelector(`.guide-page[data-page="${page}"]`);
    if (act === 'rename') {
      const label = currentItem.querySelector('.gsi-label');
      const fallbackTxt = (label?.textContent || currentItem.textContent || '').trim().split('\n')[0];
      const orig = (label?.textContent || fallbackTxt).trim();
      if (!label) {
        // Legacy item without .gsi-label — convert it
        const text = document.createTextNode('');
        const newLabel = document.createElement('span');
        newLabel.className = 'gsi-label';
        newLabel.textContent = orig;
        const actions = currentItem.querySelector('.gsi-actions');
        if (actions) currentItem.insertBefore(newLabel, actions);
        else currentItem.appendChild(newLabel);
        // Strip stray text nodes
        [...currentItem.childNodes].filter(n => n.nodeType === 3 && n !== text).forEach(n => n.remove());
      }
      const lbl = currentItem.querySelector('.gsi-label');
      closeMenu();
      lbl.setAttribute('contenteditable', 'true');
      lbl.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(lbl);
      sel.removeAllRanges();
      sel.addRange(range);
      const commit = () => {
        lbl.removeAttribute('contenteditable');
        const txt = (lbl.textContent || '').trim() || orig;
        lbl.textContent = txt;
        if (pageEl) {
          const h = pageEl.querySelector('h2');
          if (h) h.textContent = txt;
          const wt = pageEl.querySelector('.world-title');
          if (wt) wt.textContent = txt;
        }
        window.__praiaAutosave?.();
      };
      lbl.addEventListener('blur', commit, { once: true });
      lbl.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          lbl.blur();
        }
        if (e.key === 'Escape') {
          lbl.textContent = orig;
          lbl.blur();
        }
      });
      lbl.addEventListener('paste', e => {
        e.preventDefault();
        const txt = ((e.clipboardData || window.clipboardData)?.getData('text/plain') || '').replace(/\s+/g, ' ').trim();
        if (txt) document.execCommand('insertText', false, txt);
      });
      lbl.addEventListener('drop', e => e.preventDefault());
      lbl.addEventListener('dragover', e => e.preventDefault());
      return;
    } else if (act === 'add-sub') {
      // Promote currentItem to master if it was a sub, then add a sub beneath it
      const masterId = currentItem.dataset.parent || currentItem.dataset.page;
      const list = document.querySelector('.guide-side-list');
      const masterItem = currentItem.dataset.parent ? list.querySelector(`.guide-side-item[data-page="${CSS.escape(masterId)}"]:not([data-parent])`) : currentItem;
      if (!masterItem) {
        closeMenu();
        return;
      }
      // Find last sub of this master (or the master itself)
      const subs = [...list.querySelectorAll(`.guide-side-item[data-parent="${CSS.escape(masterId)}"]`)];
      const insertAfter = subs.length ? subs[subs.length - 1] : masterItem;
      // Generate unique id (check both pages and sidebar items)
      const takenIds = new Set([...[...document.querySelectorAll('.guide-page')].map(p => p.dataset.page), ...[...document.querySelectorAll('.guide-side-item')].map(it => it.dataset.page)].filter(Boolean));
      let newId;
      do {
        newId = 'p-' + Math.random().toString(36).slice(2, 9);
      } while (takenIds.has(newId));
      const takenNames = new Set([...document.querySelectorAll('.guide-side-item')].map(a => (a.querySelector('.gsi-label')?.textContent || a.textContent).trim()));
      const baseName = 'New sub-page';
      let nm = baseName,
        k = 2;
      while (takenNames.has(nm)) {
        nm = baseName + ' ' + k;
        k++;
      }
      const fileIcon = '<span class="gs-icon bs-icon" style="--bs-icon-size:16px">description</span>';
      const checkIcon = '<span class="gs-check bs-icon" style="--bs-icon-size:16px">check</span>';
      const item = document.createElement('a');
      item.href = '#';
      item.dataset.page = newId;
      item.dataset.parent = masterId;
      item.className = 'guide-side-item';
      item.innerHTML = `${checkIcon}${fileIcon}<span class="gsi-label">${nm}</span>`;
      window.__praiaEnsureActions?.(item);
      window.__praiaMakeDraggable?.(item);
      insertAfter.parentNode.insertBefore(item, insertAfter.nextSibling);
      // Page body
      const content = document.querySelector('[data-world="guide"] .guide-content');
      if (content) {
        const page = document.createElement('div');
        page.className = 'guide-page';
        page.dataset.page = newId;
        page.innerHTML = `<div class="world-head"><div><div class="world-eyebrow">Guide</div><h1 class="world-title">${nm}</h1><p class="world-sub">Descrição da página. Clique para editar.</p></div></div><h2>${nm}</h2>`;
        content.appendChild(page);
      }
      // Activate
      document.querySelectorAll('.guide-side-item').forEach(x => x.classList.toggle('active', x === item));
      document.querySelectorAll('.guide-page').forEach(p => p.classList.toggle('active', p.dataset.page === newId));
      // Ensure master is expanded
      masterItem.classList.remove('collapsed');
      refreshHierarchy();
      // Inline rename
      const label = item.querySelector('.gsi-label');
      label.setAttribute('contenteditable', 'true');
      label.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(label);
      sel.removeAllRanges();
      sel.addRange(range);
      const commit = () => {
        label.removeAttribute('contenteditable');
        const txt = (label.textContent || '').trim() || nm;
        label.textContent = txt;
        const h2 = document.querySelector(`.guide-page[data-page="${CSS.escape(newId)}"] h2`);
        if (h2) h2.textContent = txt;
        const wt = document.querySelector(`.guide-page[data-page="${CSS.escape(newId)}"] .world-title`);
        if (wt) wt.textContent = txt;
        window.__praiaAutosave?.();
      };
      label.addEventListener('blur', commit, { once: true });
      label.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          label.blur();
        }
        if (e.key === 'Escape') {
          label.textContent = nm;
          label.blur();
        }
      });
      label.addEventListener('paste', e => {
        e.preventDefault();
        const txt = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ').trim();
        document.execCommand('insertText', false, txt);
      });
      window.__praiaAutosave?.();
    } else if (act === 'duplicate') {
      const newPage = page + '-copy-' + Date.now().toString(36);
      const clonedItem = currentItem.cloneNode(true);
      clonedItem.dataset.page = newPage;
      clonedItem.classList.remove('active', 'gsi-open');
      // Rename label to "<original> (copy)" — target the .gsi-label span (the
      // actual label container) instead of stray text nodes that may not exist.
      const labelEl = clonedItem.querySelector('.gsi-label');
      if (labelEl) {
        const baseName = (labelEl.textContent || '').trim();
        labelEl.textContent = baseName ? `${baseName} (copy)` : 'New page (copy)';
      } else {
        const txtNodes = [...clonedItem.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
        if (txtNodes.length) {
          const last = txtNodes[txtNodes.length - 1];
          last.textContent = ' ' + last.textContent.trim() + ' (copy) ';
        }
      }
      // rewire actions on clone
      const newActions = clonedItem.querySelector('.gsi-actions');
      if (newActions) newActions.remove();
      const actions = document.createElement('span');
      actions.className = 'gsi-actions';
      actions.innerHTML = `<button class="gsi-eye" aria-label="Hide">${eyeSvg}</button><button class="gsi-dots" aria-label="More">${dotsSvg}</button>`;
      clonedItem.appendChild(actions);
      actions.querySelector('.gsi-eye').addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        clonedItem.classList.toggle('hidden-page');
      });
      actions.querySelector('.gsi-dots').addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        openMenu(clonedItem, e.currentTarget);
      });
      clonedItem.addEventListener('click', e => {
        e.preventDefault();
        const p = clonedItem.dataset.page;
        document.querySelectorAll('.guide-side-item').forEach(x => x.classList.toggle('active', x === clonedItem));
        document.querySelectorAll('.guide-page').forEach(pg => pg.classList.toggle('active', pg.dataset.page === p));
        document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
      });
      currentItem.parentNode.insertBefore(clonedItem, currentItem.nextSibling);
      if (pageEl) {
        const clonedPage = pageEl.cloneNode(true);
        clonedPage.dataset.page = newPage;
        clonedPage.classList.remove('active');
        pageEl.parentNode.insertBefore(clonedPage, pageEl.nextSibling);
      }
    } else if (act === 'hide') {
      currentItem.classList.toggle('hidden-page');
    } else if (act === 'delete') {
      const labelEl = currentItem.querySelector('.gsi-label');
      const pageName = (labelEl?.textContent || currentItem.textContent || '').trim().split('\n')[0];
      const isMaster = !currentItem.dataset.parent;
      const subs = isMaster ? [...document.querySelectorAll(`.guide-side-item[data-parent="${CSS.escape(currentItem.dataset.page)}"]`)] : [];
      const extra = subs.length ? ` e ${subs.length} sub-página${subs.length > 1 ? 's' : ''}` : '';
      if (!confirm(`Tem certeza que deseja deletar "${pageName}"${extra}? Esta ação não pode ser desfeita.`)) {
        closeMenu();
        return;
      }
      const wasActive = currentItem.classList.contains('active') || subs.some(s => s.classList.contains('active'));
      // Delete sub items + their pages first (only when removing a master)
      subs.forEach(s => {
        const sid = s.dataset.page;
        if (sid) document.querySelectorAll(`.guide-page[data-page="${CSS.escape(sid)}"]`).forEach(p => p.remove());
        s.remove();
      });
      // Delete the current sidebar item
      currentItem.remove();
      // Remove the page(s) tied to the current id — but only those NOT still
      // referenced by another sidebar item (guards against legacy id collisions
      // where multiple items share the same data-page).
      if (page) {
        const stillRefs = document.querySelectorAll(`.guide-side-item[data-page="${CSS.escape(page)}"]`).length;
        if (!stillRefs) {
          document.querySelectorAll(`.guide-page[data-page="${CSS.escape(page)}"]`).forEach(p => p.remove());
        }
      }
      refreshHierarchy();
      if (wasActive) {
        const first = document.querySelector('.guide-side-item');
        if (first) first.click();
      }
    }
    closeMenu();
  }
  menu.querySelectorAll('.gsi-menu-item').forEach(mi =>
    mi.addEventListener('click', e => {
      if (mi.classList.contains('disabled')) return;
      e.stopPropagation();
      doAct(mi.dataset.act);
    })
  );
})();
