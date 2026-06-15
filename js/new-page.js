// new-page.js
// Extraído do script principal (Fase 3, 🟡 só consome). Move verbatim.
// lê window.__praiaAutosave/__praiaEnsureActions/__praiaMakeDraggable/__praiaRefreshHierarchy (opt); não expõe.
/* New page button — creates a fresh empty page and activates it. */
(() => {
  const btn = document.querySelector('[data-world="guide"] .guide-side-newpage');
  if (!btn) return;
  const list = document.querySelector('[data-world="guide"] .guide-side-list');
  const content = document.querySelector('[data-world="guide"] .guide-content');
  if (!list || !content) return;
  const fileIcon = '<span class="gs-icon bs-icon" style="--bs-icon-size:16px">description</span>';
  const checkIcon = '<span class="gs-check bs-icon" style="--bs-icon-size:16px">check</span>';
  function nextPageId() {
    // Check BOTH .guide-page and .guide-side-item to avoid collisions when
    // autosave restored an out-of-sync DOM.
    const taken = new Set([
      ...[...document.querySelectorAll('.guide-page')].map(p => p.dataset.page),
      ...[...document.querySelectorAll('.guide-side-item')].map(i => i.dataset.page),
    ].filter(Boolean));
    let id;
    do { id = 'p-' + Math.random().toString(36).slice(2, 9); } while (taken.has(id));
    return id;
  }
  function nextPageName() {
    const taken = new Set([...document.querySelectorAll('.guide-side-item')].map(a => a.textContent.trim()));
    if (!taken.has('New page')) return 'New page';
    let i = 2;
    while (taken.has('New page ' + i)) i++;
    return 'New page ' + i;
  }
  function createPage() {
    const id = nextPageId();
    const name = nextPageName();
    const item = document.createElement('a');
    item.href = '#';
    item.dataset.page = id;
    item.className = 'guide-side-item';
    item.innerHTML = `${checkIcon}${fileIcon}<span class="gsi-label" contenteditable="false">${name}</span>`;
    list.appendChild(item);
    window.__praiaEnsureActions?.(item);
    window.__praiaMakeDraggable?.(item);
    window.__praiaRefreshHierarchy?.();
    return { item, id, name };
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const { item, id, name } = createPage();
    // Page body — only the title; everything else added via "+ Add module".
    const page = document.createElement('div');
    page.className = 'guide-page';
    page.dataset.page = id;
    page.innerHTML = `<div class="world-head"><div><div class="world-eyebrow">Guide</div><h1 class="world-title">${name}</h1><p class="world-sub">Descrição da página. Clique para editar.</p></div></div><div class="add-module-slot"><button class="add-module-btn" type="button">Add template</button></div>`;
    content.appendChild(page);
    // Activate the new page immediately.
    document.querySelectorAll('.guide-side-item').forEach(x => x.classList.toggle('active', x === item));
    document.querySelectorAll('.guide-page').forEach(p => p.classList.toggle('active', p === page));
    // Inline rename
    const label = item.querySelector('.gsi-label');
    label.setAttribute('contenteditable', 'true');
    label.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(label);
    sel.removeAllRanges(); sel.addRange(range);
    const commit = () => {
      label.removeAttribute('contenteditable');
      const txt = (label.textContent || '').trim() || name;
      label.textContent = txt;
      const h2 = page.querySelector('h2');
      if (h2) h2.textContent = txt;
      const wt = page.querySelector('.world-title');
      if (wt) wt.textContent = txt;
    };
    label.addEventListener('blur', commit, { once: true });
    label.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); label.blur(); }
      if (e.key === 'Escape') { label.textContent = name; label.blur(); }
    });
    label.addEventListener('paste', e => {
      e.preventDefault();
      const txt = ((e.clipboardData || window.clipboardData)?.getData('text/plain') || '').replace(/\s+/g, ' ').trim();
      if (txt) document.execCommand('insertText', false, txt);
    });
    label.addEventListener('drop', e => e.preventDefault());
    label.addEventListener('dragover', e => e.preventDefault());
    window.__praiaAutosave?.();
  });
})();
