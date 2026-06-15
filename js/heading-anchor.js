// heading-anchor.js — link âncora em headings + deep-link ?page=#anchor (Fase 3, 🟡).
// IIFE; lê window.__praiaCopy/__praiaToast (opt); applyDeepLink deferido + retry.
/* Heading anchor — click the link icon to copy a shareable URL to that heading.
   Delegated so it survives autosave's innerHTML round-trips. */
(() => {
  const slugify = (s) => (s || '').toString().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
  const ensureUniqueId = (el, base) => {
    let id = base; let n = 2;
    while (document.getElementById(id) && document.getElementById(id) !== el) {
      id = base + '-' + n++;
    }
    el.id = id;
    return id;
  };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.heading-anchor-btn');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const mod = btn.closest('.heading-mod');
    const h = mod?.querySelector('h1, h2, h3, h4, h5, h6');
    if (!h) return;
    const id = h.id || ensureUniqueId(h, slugify(h.textContent));
    // Find the closest guide page id so the deep-link also restores the active page
    const pageId = h.closest('.guide-page')?.dataset.page;
    const url = location.origin + location.pathname + (pageId ? '?page=' + encodeURIComponent(pageId) : '') + '#' + id;
    window.__praiaCopy?.(url);
    window.__praiaToast?.('Link copiado');
  }, true);

  // On load, if URL has ?page=X#anchor, activate that page and scroll to anchor.
  // Heading id may not exist immediately (autosave restore is async), so retry briefly.
  function applyDeepLink() {
    const params = new URLSearchParams(location.search);
    const pageId = params.get('page');
    const hash = decodeURIComponent(location.hash.slice(1));
    if (pageId) {
      const item = document.querySelector(`.guide-side-item[data-page="${CSS.escape(pageId)}"]`);
      const page = document.querySelector(`.guide-page[data-page="${CSS.escape(pageId)}"]`);
      if (item && page) {
        document.querySelectorAll('.guide-side-item').forEach(x => x.classList.toggle('active', x === item));
        document.querySelectorAll('.guide-page').forEach(p => p.classList.toggle('active', p === page));
      }
    }
    if (!hash) return;
    const topnav = document.querySelector('#topnav');
    const offset = (topnav?.getBoundingClientRect().height || 0) + 16;
    const tryScroll = (attempts = 20) => {
      const target = document.getElementById(hash);
      const scroller = document.querySelector('#main') || document.scrollingElement || document.documentElement;
      if (target && scroller) {
        const targetTop = target.getBoundingClientRect().top + scroller.scrollTop - (scroller.getBoundingClientRect?.().top || 0);
        scroller.scrollTo({ top: targetTop - offset, behavior: 'smooth' });
        return;
      }
      if (attempts > 0) setTimeout(() => tryScroll(attempts - 1), 100);
    };
    tryScroll();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDeepLink);
  } else { setTimeout(applyDeepLink, 200); }
  // Re-apply if the hash changes without a full reload (in-app navigation)
  window.addEventListener('hashchange', applyDeepLink);
})();
