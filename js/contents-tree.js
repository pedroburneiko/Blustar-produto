// contents-tree.js — Sidebar tabs (Pages/Contents/Menu) + árvore de Contents (Fase 3).
// Expõe window.__praiaRenderContents (consumido pelo component-selection em handlers).
// Antes do state.js. Lift verbatim.
/* Sidebar tabs (Pages / Contents / Menu) + Contents tree */
(() => {
  const side = document.querySelector('.guide-side');
  if (!side) return;
  const contents = side.querySelector('.guide-side-contents');
  const chev = '<span class="bs-icon" style="--bs-icon-size:16px">chevron_right</span>';

  function describeChild(el) {
    if (el.classList.contains('add-module-slot')) return null;
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return { label: tag.toUpperCase() + ' — ' + (el.textContent || '').trim().slice(0, 28) };
    if (tag === 'p') return { label: 'Text — ' + (el.textContent || '').trim().slice(0, 28) };
    if (el.classList.contains('tpl-img')) return { label: 'Image' };
    if (el.classList.contains('otp-grid') || el.classList.contains('otp-list')) return { label: 'List' };
    if (el.classList.contains('otp-link') || tag === 'a') return { label: 'Link — ' + (el.textContent || '').trim().slice(0, 28) };
    if (el.classList.contains('tile-title')) return { label: 'Title — ' + (el.textContent || '').trim().slice(0, 24) };
    if (el.classList.contains('tile-desc')) return { label: 'Description' };
    if (el.children.length) return { label: tag === 'div' ? 'Group' : tag };
    const text = (el.textContent || '').trim();
    if (text) return { label: text.slice(0, 28) };
    return null;
  }

  function renderContents() {
    if (!contents) return;
    const page = document.querySelector('.guide-page.active');
    if (!page) { contents.innerHTML = '<div class="gsc-empty">No active page.</div>'; return; }
    const comps = [...page.querySelectorAll('.praia-component')];
    if (!comps.length) { contents.innerHTML = '<div class="gsc-empty">Os componentes inseridos pelo + Add module aparecem aqui.</div>'; return; }
    let html = '';
    comps.forEach((c, i) => {
      const name = c.dataset.componentName || 'Component';
      const cat = c.dataset.componentCategory || 'Components';
      c.dataset.compIndex = String(i);
      const active = c.classList.contains('component-selected') ? ' active' : '';
      const expanded = c.dataset.gscExpanded === 'true';
      const childItems = [...c.children].map(describeChild).filter(Boolean);
      html += `<div class="gsc-item${active}${childItems.length ? '' : ' no-children'}${expanded ? ' expanded' : ''}" data-comp-index="${i}" data-depth="0"><button type="button" class="gsc-toggle" data-act="toggle" aria-label="Expandir">${chev}</button><span class="gsc-diamond"></span><span class="gsc-name">${cat} / ${name}</span></div>`;
      if (expanded) {
        childItems.forEach((child, j) => {
          html += `<div class="gsc-item gsc-child" data-comp-index="${i}" data-child-index="${j}" data-depth="1"><span class="gsc-toggle"></span><span class="gsc-diamond child"></span><span class="gsc-name">${child.label}</span></div>`;
        });
      }
    });
    contents.innerHTML = html;
  }
  window.__praiaRenderContents = renderContents;

  // Tab switching
  side.querySelectorAll('.guide-side-tab').forEach(t => {
    t.addEventListener('click', () => {
      const tab = t.dataset.tab;
      side.querySelectorAll('.guide-side-tab').forEach(x => x.classList.toggle('active', x === t));
      side.dataset.tab = tab;
      if (tab === 'contents') renderContents();
    });
  });

  // Click on Contents item → expand toggle | enter edit mode | select inner child.
  contents?.addEventListener('click', e => {
    const toggle = e.target.closest('.gsc-toggle[data-act="toggle"]');
    const item = e.target.closest('.gsc-item');
    if (!item) return;
    const page = document.querySelector('.guide-page.active');
    const comps = [...(page?.querySelectorAll('.praia-component') || [])];
    const idx = parseInt(item.dataset.compIndex, 10);
    const comp = comps[idx];
    if (!comp) return;
    // Chevron click → toggle expansion only.
    if (toggle) {
      e.stopPropagation();
      comp.dataset.gscExpanded = (comp.dataset.gscExpanded === 'true') ? 'false' : 'true';
      renderContents();
      return;
    }
    // Child item → select that inner element on the canvas.
    if (item.classList.contains('gsc-child')) {
      const childIdx = parseInt(item.dataset.childIndex, 10);
      const candidates = [...comp.children].filter(el => !el.classList.contains('add-module-slot'));
      const child = candidates[childIdx];
      if (child) {
        // Enter edit mode if not yet, then click the child to drop into text/layout mode.
        if (!document.body.classList.contains('editing-component')) {
          comp.click();
          document.getElementById('grc-edit')?.click();
        }
        child.click();
        child.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return;
    }
    // Top-level component row → select + enter edit mode.
    comp.click();
    comp.scrollIntoView({ block: 'center', behavior: 'smooth' });
    document.getElementById('grc-edit')?.click();
  });

  // Render Contents on tab switch and when components are selected/changed.
  // (See selectComponent + page nav handlers.) Avoids MutationObserver loops.
})();
