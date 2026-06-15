// state.js — persistência do canvas: autosave, histórico de versões, undo/redo,
// snapshot/restore e o modo "ao vivo" (preview/play). Extraído de index.html (Fase 4).
//
// Classic script carregado APÓS o script principal: consome helpers externos via
// window.__praia* (NormalizeItem/EnsureActions/ResolveContentPage/RefreshHierarchy,
// definidos antes) e expõe os globais de estado (__praiaAutosave/Undo/Redo/History/
// RecordNow/ReadVersions/ViewingHistorical/CloseHistory/ExitHistorical/TplOverrides).
// Auditoria de ordem de carga: todos os consumidores são order-tolerant (optional
// chaining em handlers, init preguiçoso de TplOverrides, polling de Undo/Redo,
// applyDeepLink deferido). Versão do schema do snapshot: ver STATE_VERSION.

/* Autosave — persist canvas edits across reloads */
(() => {
  const KEY = 'praia.brand.state.v5';
  // Versão do SCHEMA do payload salvo (independente do "v5" do nome da chave).
  // Bump quando o formato do snapshot mudar de forma incompatível, e adicione
  // o passo correspondente em migrateState().
  const STATE_VERSION = 1;
  // Lê o estado salvo de forma resiliente: migra formatos antigos quando possível
  // e DESCARTA com segurança (retorna null) o que for incompatível/futuro/corrompido,
  // em vez de deixar o boot quebrar. Não altera dados válidos do formato atual.
  function migrateState(data) {
    if (!data || typeof data !== 'object') return null;
    const v = typeof data.__v === 'number' ? data.__v : 0;
    // v0 = estado legado sem carimbo de versão. Estruturalmente idêntico ao v1,
    // então apenas o adotamos como v1 (sem perda de dados).
    if (v === 0) return { ...data, __v: STATE_VERSION };
    if (v === STATE_VERSION) return data;
    // Mais novo do que este build sabe ler → descarta em vez de aplicar errado.
    if (v > STATE_VERSION) {
      console.warn('[BluStar] Estado salvo é de uma versão mais nova (__v=' + v + '); ignorando.');
      return null;
    }
    // Espaço para migrações futuras (0 < v < STATE_VERSION). Sem nenhuma por ora.
    return { ...data, __v: STATE_VERSION };
  }
  const sideList = document.querySelector('[data-world="guide"] .guide-side-list');
  const content = document.querySelector('[data-world="guide"] .guide-content');
  const head = document.querySelector('[data-world="guide"] .world-head');
  const homeSideList = document.querySelector('[data-world="home"] .guide-side-list');
  const homeContent = document.querySelector('[data-world="home"] .guide-content');
  if (!sideList || !content) return;

  // Restore first
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? migrateState(JSON.parse(raw)) : null;
    if (data) {
      if (data.sideList) sideList.innerHTML = data.sideList;
      if (data.content) content.innerHTML = data.content;
      if (data.head && head) head.innerHTML = data.head;
      if (data.homeSideList && homeSideList) homeSideList.innerHTML = data.homeSideList;
      if (data.homeContent && homeContent) {
        homeContent.innerHTML = data.homeContent;
        // Ensure first Home page is active (Home has no visible page nav).
        const hPages = homeContent.querySelectorAll('.guide-page');
        if (hPages.length && !homeContent.querySelector('.guide-page.active')) {
          hPages[0].classList.add('active');
        }
      }
      if (data.rootStyle) document.documentElement.style.cssText += ';' + data.rootStyle;
      // Restore active page (Guide only — Home stays on its first page)
      if (data.activePage) {
        const item = document.querySelector(`[data-world="guide"] .guide-side-item[data-page="${data.activePage}"]`);
        const page = document.querySelector(`[data-world="guide"] .guide-page[data-page="${data.activePage}"]`);
        if (item && page) {
          document.querySelectorAll('[data-world="guide"] .guide-side-item').forEach(x => x.classList.toggle('active', x === item));
          document.querySelectorAll('[data-world="guide"] .guide-page').forEach(p => p.classList.toggle('active', p === page));
        }
      }
      // Always keep Home's first page active
      const hFirst = homeContent?.querySelector('.guide-page');
      if (hFirst && !homeContent.querySelector('.guide-page.active')) hFirst.classList.add('active');
      // Strip transient drag/drop markers that might have been persisted in a buggy build
      document.querySelectorAll('.gsi-dragging, .gsi-drop-before, .gsi-drop-after, .gsi-drop-inside').forEach(el => {
        el.classList.remove('gsi-dragging', 'gsi-drop-before', 'gsi-drop-after', 'gsi-drop-inside');
        delete el.dataset.dropPos;
      });
      // Re-wire side-item navigation on restored elements + normalize their structure
      document.querySelectorAll('.guide-side-item').forEach(a => {
        if (window.__praiaNormalizeItem) window.__praiaNormalizeItem(a);
        if (window.__praiaEnsureActions) window.__praiaEnsureActions(a);
        a.addEventListener('click', e => {
          e.preventDefault();
          const contentId = window.__praiaResolveContentPage ? window.__praiaResolveContentPage(a) : a.dataset.page;
          document.querySelectorAll('.guide-side-item').forEach(x => x.classList.toggle('active', x === a));
          document.querySelectorAll('.guide-page').forEach(p => p.classList.toggle('active', p.dataset.page === contentId));
          document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
          save();
        });
      });
      window.__praiaRefreshHierarchy?.();
    }
  } catch (err) { console.warn('Autosave restore failed', err); }

  // Strip transient state before saving
  function snapshot() {
    const cloneSide = sideList.cloneNode(true);
    const cloneContent = content.cloneNode(true);
    const cloneHead = head ? head.cloneNode(true) : null;
    const cloneHomeSide = homeSideList ? homeSideList.cloneNode(true) : null;
    const cloneHome = homeContent ? homeContent.cloneNode(true) : null;
    [cloneSide, cloneContent, cloneHead, cloneHomeSide, cloneHome].filter(Boolean).forEach(root => {
      root.querySelectorAll('.canvas-selected').forEach(el => {
        el.classList.remove('canvas-selected');
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
      });
      root.querySelectorAll('.gsi-open').forEach(el => el.classList.remove('gsi-open'));
      // Transient drag/drop markers — never persist
      root.querySelectorAll('.gsi-dragging, .gsi-drop-before, .gsi-drop-after, .gsi-drop-inside').forEach(el => {
        el.classList.remove('gsi-dragging', 'gsi-drop-before', 'gsi-drop-after', 'gsi-drop-inside');
        delete el.dataset.dropPos;
      });
      // DS edit transients — never persist ghost handles/active state into autosave or history
      root.querySelectorAll('.ds-resize-handle, .ds-mask-img-wrap').forEach(el => el.remove());
      root.querySelectorAll('.ds-item-active, .is-dragging, .is-panning, .ds-mask-target').forEach(el => {
        el.classList.remove('ds-item-active', 'is-dragging', 'is-panning', 'ds-mask-target');
      });
    });
    // Capture only tokens we set; cssText includes everything inline on :root
    const rootStyle = document.documentElement.style.cssText;
    const activePage = document.querySelector('.guide-side-item.active')?.dataset.page || null;
    return {
      __v: STATE_VERSION,
      sideList: cloneSide.innerHTML,
      content: cloneContent.innerHTML,
      head: cloneHead ? cloneHead.innerHTML : null,
      homeSideList: cloneHomeSide ? cloneHomeSide.innerHTML : null,
      homeContent: cloneHome ? cloneHome.innerHTML : null,
      rootStyle,
      activePage,
      tplOverrides: (() => { try { return JSON.stringify(window.__grcGetTplOverrides?.() || {}); } catch { return '{}'; } })(),
      // Master HTML overrides (Figma-style template canvas). Including these in
      // the history snapshot lets Cmd+Z restore a master's previous editH /
      // child positions in sync with the DOM that referenced them.
      praiaTplOverrides: (() => { try { return JSON.stringify(window.__praiaTplOverrides || {}); } catch { return '{}'; } })(),
    };
  }

  let saveTimer = null;
  function save() {
    // Suppress autosave while viewing a historical version — we must NOT overwrite
    // the live state (kept safe in KEY+':live') with the historical preview.
    if (window.__praiaViewingHistorical) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch (err) { console.warn('Autosave failed', err); }
      scheduleRecordHistory();
    }, 250);
  }
  // Force an immediate history record (skip both autosave + history debounces).
  // Use this after a discrete user action so Cmd+Z is responsive right away.
  function recordHistoryNow() {
    if (__applyingSnapshot || window.__praiaViewingHistorical) return;
    clearTimeout(__historyTimer);
    const cur = JSON.stringify(snapshot());
    if (cur === __lastSnap) return;
    history.past.push(__lastSnap);
    if (history.past.length > history.max) history.past.shift();
    history.future = [];
    __lastSnap = cur;
    try { localStorage.setItem(KEY, cur); } catch {}
    pushVersion(cur);
  }
  window.__praiaAutosave = save;
  window.__praiaRecordNow = recordHistoryNow;

  // --- Version history (Figma-style autosave timeline) ---
  // Stored in localStorage as KEY + ':versions'. Each entry: { id, ts, snapshot, user }.
  // Coalesces rapid edits: a new version is only written if >= MIN_GAP_MS since the last one.
  const VKEY = KEY + ':versions';
  const V_MAX = 80;
  const V_MIN_GAP_MS = 60 * 1000; // 1 minute
  const __currentUser = (window.__praiaCurrentUser ||= { initials: 'PB', name: 'Pedro B.' });
  function readVersions() {
    try {
      const arr = JSON.parse(localStorage.getItem(VKEY) || '[]');
      // Normalize all users to the current user (single-user app for now).
      let mutated = false;
      arr.forEach(v => {
        if (!v.user || v.user.initials !== __currentUser.initials || v.user.name !== __currentUser.name) {
          v.user = __currentUser; mutated = true;
        }
      });
      if (mutated) { try { localStorage.setItem(VKEY, JSON.stringify(arr)); } catch {} }
      return arr;
    } catch { return []; }
  }
  function writeVersions(arr) {
    try { localStorage.setItem(VKEY, JSON.stringify(arr.slice(-V_MAX))); } catch {}
  }
  function pushVersion(snapStr) {
    if (__applyingSnapshot) return;
    const arr = readVersions();
    const now = Date.now();
    const last = arr[arr.length - 1];
    if (last && now - last.ts < V_MIN_GAP_MS) {
      // Coalesce: update the most recent entry instead of appending.
      last.ts = now; last.snapshot = snapStr; last.user = __currentUser;
    } else {
      arr.push({ id: 'v-' + now.toString(36), ts: now, snapshot: snapStr, user: __currentUser });
    }
    writeVersions(arr);
    if (document.querySelector('.guide-right.history-mode')) renderHistoryPanel();
  }
  window.__praiaReadVersions = readVersions;

  function fmtVersionDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const opts = { hour: 'numeric', minute: '2-digit', hour12: true };
    if (sameDay) return 'Hoje, ' + d.toLocaleTimeString('pt-BR', opts);
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem, ' + d.toLocaleTimeString('pt-BR', opts);
    const dateOpts = { day: 'numeric', month: 'short' };
    return d.toLocaleDateString('pt-BR', dateOpts) + ', ' + d.toLocaleTimeString('pt-BR', opts);
  }

  let __historyCollapsed = false;
  const HISTORY_PAGE = 12;
  let __historyShown = HISTORY_PAGE;
  function renderHistoryPanel() {
    const list = document.getElementById('grh-list');
    if (!list) return;
    const versions = readVersions().slice().reverse(); // newest first
    const activeId = list.dataset.activeId || '__current__';
    const userChip = () => '';
    const dot = '<span class="bs-icon" style="--bs-icon-size:16px">fiber_manual_record</span>';
    const currentItem = `
      <div class="grh-item${activeId === '__current__' ? ' active' : ''}" data-version="__current__">
        <span class="grh-marker">${dot}</span>
        <div class="grh-content">
          <div class="grh-title">Versão atual</div>
        </div>
      </div>`;
    const shown = versions.slice(0, __historyShown);
    const remaining = versions.length - shown.length;
    const items = shown.map(v => `
      <div class="grh-item${activeId === v.id ? ' active' : ''}" data-version="${v.id}">
        <span class="grh-marker">${dot}</span>
        <div class="grh-content">
          <div class="grh-title">${fmtVersionDate(v.ts)}</div>
          <div class="grh-meta">${v.user?.name || ''}</div>
        </div>
      </div>`).join('');
    const groupLabel = versions.length
      ? `<button type="button" class="grh-group" id="grh-group-toggle" aria-expanded="${!__historyCollapsed}">
          <span class="grh-marker">
            <span class="bs-icon" style="--bs-icon-size:16px">chevron_right</span>
          </span>
          <span class="grh-group-label">${versions.length} ${versions.length === 1 ? 'versão de autosave' : 'versões de autosave'}</span>
        </button>`
      : '<div class="grh-empty">Sem versões salvas ainda. Edite o Guide e elas aparecerão aqui.</div>';
    const showOlder = !__historyCollapsed && remaining > 0
      ? `<button type="button" class="grh-show-older" id="grh-show-older">Show older</button>`
      : '';
    list.innerHTML = currentItem + groupLabel + (__historyCollapsed ? '' : items + showOlder);
  }

  function openHistoryPanel() {
    const right = document.querySelector('.guide-right'); if (!right) return;
    window.__praiaCloseRightModes?.();
    right.classList.add('history-mode');
    const btn = document.getElementById('version-history-btn');
    btn?.classList.add('active');
    btn?.setAttribute('aria-pressed', 'true');
    __historyShown = HISTORY_PAGE;
    renderHistoryPanel();
  }
  function closeHistoryPanel() {
    document.querySelector('.guide-right')?.classList.remove('history-mode');
    const btn = document.getElementById('version-history-btn');
    btn?.classList.remove('active');
    btn?.setAttribute('aria-pressed', 'false');
  }
  window.__praiaCloseHistory = closeHistoryPanel;
  document.getElementById('version-history-btn')?.addEventListener('click', () => {
    const right = document.querySelector('.guide-right');
    if (right?.classList.contains('history-mode')) closeHistoryPanel();
    else openHistoryPanel();
  });
  document.getElementById('grh-close')?.addEventListener('click', closeHistoryPanel);
  // --- Historical preview: save live state before previewing past versions ---
  const LIVE_KEY = KEY + ':live';

  // --- Fonte única das CHAVES DE ESTADO (Fase 4) ---
  // state.js é a dona destas 3 chaves (nenhum outro código as toca). O registro
  // + helper abaixo expõem um ponto central; as chamadas internas deste arquivo
  // permanecem inalteradas (extração verbatim verificada). As outras 11 chaves
  // do app (tpl.overrides, icons, buttons, client, …) podem migrar pra cá depois.
  window.__praiaStateKeys = Object.freeze({ state: KEY, versions: VKEY, live: LIVE_KEY });
  window.__praiaStateStore = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
    remove: (k) => { try { localStorage.removeItem(k); } catch {} },
  };

  function showHistoryBanner(label) {
    let b = document.getElementById('__history_banner');
    if (!b) {
      b = document.createElement('div');
      b.id = '__history_banner';
      b.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:var(--bs-white);color:var(--bs-navy);padding:10px 18px;border-radius:999px;font:var(--type-sb-weight) var(--type-sb-size)/1 var(--font);letter-spacing:0;z-index:var(--z-toast);box-shadow:0 8px 24px rgba(0,0,0,0.35);display:inline-flex;align-items:center;gap:12px';
      document.body.appendChild(b);
    }
    b.innerHTML = `<span>${label}</span>`;
    b.style.opacity = '1';
  }
  function hideHistoryBanner() {
    const b = document.getElementById('__history_banner');
    if (b) b.remove();
  }
  function enterHistoricalView() {
    if (window.__praiaViewingHistorical) return;
    // Capture the current live state (the one in KEY) and stash it.
    try {
      const live = localStorage.getItem(KEY) || JSON.stringify(snapshot());
      localStorage.setItem(LIVE_KEY, live);
    } catch {}
    window.__praiaViewingHistorical = true;
  }
  function exitHistoricalView() {
    window.__praiaViewingHistorical = false;
    hideHistoryBanner();
    try { localStorage.removeItem(LIVE_KEY); } catch {}
  }
  window.__praiaExitHistorical = exitHistoricalView;

  document.getElementById('grh-list')?.addEventListener('click', (e) => {
    if (e.target.closest('#grh-group-toggle')) {
      __historyCollapsed = !__historyCollapsed;
      renderHistoryPanel();
      return;
    }
    if (e.target.closest('#grh-show-older')) {
      __historyShown += HISTORY_PAGE;
      renderHistoryPanel();
      return;
    }
    const item = e.target.closest('.grh-item');
    if (!item) return;
    const vid = item.dataset.version;
    const list = document.getElementById('grh-list');
    list.dataset.activeId = vid;
    if (vid === '__current__') {
      // Restore the live state we stashed when entering historical view.
      let liveSnap = null;
      try { liveSnap = localStorage.getItem(LIVE_KEY); } catch {}
      exitHistoricalView();
      if (liveSnap) applySnapshot(liveSnap);
    } else {
      const v = readVersions().find(x => x.id === vid);
      if (!v?.snapshot) return;
      enterHistoricalView();
      applySnapshot(v.snapshot);
      showHistoryBanner('Visualizando ' + fmtVersionDate(v.ts));
    }
    renderHistoryPanel();
  });
  // Closing the panel while viewing historical → snap back to live too.
  document.getElementById('grh-close')?.addEventListener('click', () => {
    if (window.__praiaViewingHistorical) {
      let liveSnap = null;
      try { liveSnap = localStorage.getItem(LIVE_KEY); } catch {}
      exitHistoricalView();
      if (liveSnap) applySnapshot(liveSnap);
    }
  });
  // If the user reloaded the page while viewing a past version, restore live on boot.
  setTimeout(() => {
    try {
      const stash = localStorage.getItem(LIVE_KEY);
      if (stash) {
        localStorage.setItem(KEY, stash);
        localStorage.removeItem(LIVE_KEY);
        applySnapshot(stash);
      }
    } catch {}
  }, 100);
  // Seed an initial version on load so the panel isn't empty for first-time users.
  setTimeout(() => {
    if (readVersions().length === 0) pushVersion(__lastSnap);
  }, 2000);
  // Periodic snapshot: every 5 minutes, if the current state differs from the
  // last persisted version, create a fresh version (bypasses the 60s coalesce).
  // This way long sessions still build a timeline even when edits are sparse.
  setInterval(() => {
    if (window.__praiaViewingHistorical) return;
    const arr = readVersions();
    const cur = JSON.stringify(snapshot());
    const last = arr[arr.length - 1];
    if (!last || last.snapshot !== cur) {
      // Force append (skip the 60s coalesce by pushing a synthetic gap).
      const now = Date.now();
      const newEntry = { id: 'v-' + now.toString(36), ts: now, snapshot: cur, user: __currentUser };
      arr.push(newEntry);
      writeVersions(arr);
      if (document.querySelector('.guide-right.history-mode')) renderHistoryPanel();
    }
  }, 5 * 60 * 1000);

  // --- Undo / Redo (Cmd+Z / Ctrl+Z + Shift for redo) ---
  const history = { past: [], future: [], max: 20 };
  let __lastSnap = JSON.stringify(snapshot());
  let __historyTimer = null;
  let __applyingSnapshot = false;
  function scheduleRecordHistory() {
    if (__applyingSnapshot) return;
    clearTimeout(__historyTimer);
    __historyTimer = setTimeout(() => {
      const cur = JSON.stringify(snapshot());
      if (cur === __lastSnap) return;
      history.past.push(__lastSnap);
      if (history.past.length > history.max) history.past.shift();
      history.future = [];
      __lastSnap = cur;
    }, 600);
  }
  function applySnapshot(jsonStr) {
    __applyingSnapshot = true;
    try {
      const data = JSON.parse(jsonStr);
      if (data.sideList != null) sideList.innerHTML = data.sideList;
      if (data.content != null) content.innerHTML = data.content;
      if (data.head != null && head) head.innerHTML = data.head;
      if (data.homeContent != null && homeContent) {
        homeContent.innerHTML = data.homeContent;
        const hPages = homeContent.querySelectorAll('.guide-page');
        if (hPages.length && !homeContent.querySelector('.guide-page.active')) {
          hPages[0].classList.add('active');
        }
      }
      if (data.rootStyle) document.documentElement.style.cssText = data.rootStyle;
      if (data.tplOverrides != null) {
        try { window.__grcSetTplOverrides?.(JSON.parse(data.tplOverrides)); } catch {}
      }
      // Restore master HTML overrides so Cmd+Z over a template canvas crop /
      // child move syncs instances back to the previous master state.
      if (data.praiaTplOverrides != null) {
        try {
          const parsed = JSON.parse(data.praiaTplOverrides);
          window.__praiaTplOverrides = parsed;
          localStorage.setItem('praia.tpl.overrides', JSON.stringify(parsed));
          // Re-propagate so every instance reflects the restored master.
          Object.entries(parsed).forEach(([name, html]) => {
            if (html) window.__praiaPropagateTemplate?.(name, html);
          });
        } catch {}
      }
      // Re-wire side items
      document.querySelectorAll('.guide-side-item').forEach(a => {
        if (window.__praiaNormalizeItem) window.__praiaNormalizeItem(a);
        if (window.__praiaEnsureActions) window.__praiaEnsureActions(a);
      });
      window.__praiaRefreshHierarchy?.();
      if (data.activePage) {
        const item = document.querySelector(`[data-world="guide"] .guide-side-item[data-page="${CSS.escape(data.activePage)}"]`);
        const page = document.querySelector(`[data-world="guide"] .guide-page[data-page="${CSS.escape(data.activePage)}"]`);
        if (item && page) {
          document.querySelectorAll('[data-world="guide"] .guide-side-item').forEach(x => x.classList.toggle('active', x === item));
          document.querySelectorAll('[data-world="guide"] .guide-page').forEach(p => p.classList.toggle('active', p === page));
        }
      }
      // Always keep Home's first page active
      const hFirst = homeContent?.querySelector('.guide-page');
      if (hFirst && !homeContent.querySelector('.guide-page.active')) hFirst.classList.add('active');
      // Re-bind the ResizeObserver to the freshly-restored .praia-frame nodes and
      // recompute scale/auto-layout height — propagate may have skipped edited
      // instances, so this guarantees every mirror (incl. auto-height text) is
      // measured after a Cmd+Z / version restore.
      window.__praiaEnsureMirrorObserver?.();
      requestAnimationFrame(() => window.__praiaApplyMirrorScale?.());
    } catch (e) { console.warn('applySnapshot failed', e); }
    __lastSnap = JSON.stringify(snapshot());
    // While viewing a historical version we must NOT persist this preview into
    // the live KEY slot — the live data is stashed in KEY+':live' until restore.
    if (!window.__praiaViewingHistorical) {
      try { localStorage.setItem(KEY, __lastSnap); } catch {}
    }
    // Defer release so the MutationObserver callback (microtask + task) that
    // processes our innerHTML reset still sees the guard and skips
    // recordHistoryNow — otherwise undo/redo would clobber history.future.
    setTimeout(() => { __applyingSnapshot = false; }, 0);
  }
  function undo() {
    if (!history.past.length) return false;
    const prev = history.past.pop();
    history.future.push(__lastSnap);
    applySnapshot(prev);
    return true;
  }
  function redo() {
    if (!history.future.length) return false;
    const next = history.future.pop();
    history.past.push(__lastSnap);
    applySnapshot(next);
    return true;
  }
  window.__praiaUndo = undo;
  window.__praiaRedo = redo;
  window.__praiaHistory = history;
  document.addEventListener('keydown', e => {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const cmd = isMac ? e.metaKey : e.ctrlKey;
    if (!cmd) return;
    // Don't hijack undo inside text inputs / textareas / contenteditable — let the
    // browser do its native intra-field undo.
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || (t.isContentEditable && t.tagName !== 'BODY'))) return;
    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo(); }
  });

  // Watch DOM mutations in the editable regions.
  // Figma-style: structural changes (add/delete/drag/attribute toggles like
  // hidden-page, gsi-dragging cleanup, etc.) record a history step IMMEDIATELY
  // so each discrete action is its own undo step. Pure text typing
  // (characterData) keeps the debounce so a run of keystrokes coalesces.
  const TRANSIENT_CLASSES = ['canvas-selected','gsi-open','gsi-dragging','gsi-drop-before','gsi-drop-after','gsi-drop-inside','active'];
  const TRANSIENT_ATTRS = new Set(['contenteditable','spellcheck','data-drop-pos','draggable','style','class']);
  function isStructural(muts) {
    for (const m of muts) {
      if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
        // Ignore additions/removals of purely transient nodes (none today, but future-proof).
        return true;
      }
      if (m.type === 'attributes') {
        // class changes that ONLY toggle transient classes shouldn't trigger history.
        if (m.attributeName === 'class') {
          const before = (m.oldValue || '').split(/\s+/).filter(Boolean);
          const after = (m.target.getAttribute('class') || '').split(/\s+/).filter(Boolean);
          const diff = new Set([...before.filter(c => !after.includes(c)), ...after.filter(c => !before.includes(c))]);
          // If every changed class is transient, skip; otherwise it's a real structural change.
          let onlyTransient = true;
          diff.forEach(c => { if (!TRANSIENT_CLASSES.includes(c)) onlyTransient = false; });
          if (!onlyTransient) return true;
          continue;
        }
        // style is mostly used transiently (drag positioning, menu coords). Skip.
        if (m.attributeName === 'style') continue;
        // Other attributes (data-page, data-parent, src, href, contenteditable commit, etc.) count.
        if (!TRANSIENT_ATTRS.has(m.attributeName)) return true;
        if (m.attributeName === 'contenteditable') return true; // rename commit
      }
    }
    return false;
  }
  const mo = new MutationObserver(muts => {
    if (isStructural(muts)) {
      // Persist + commit a history entry NOW so this discrete action is its own undo step.
      try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch {}
      recordHistoryNow();
    } else {
      save();
    }
  });
  const moOpts = { childList: true, subtree: true, attributes: true, attributeOldValue: true, characterData: true };
  mo.observe(sideList, moOpts);
  mo.observe(content,  moOpts);
  if (head) mo.observe(head, moOpts);
  if (homeContent) mo.observe(homeContent, moOpts);
  if (homeSideList) mo.observe(homeSideList, moOpts);

  // Persist on text input as well (covers contenteditable typing)
  document.addEventListener('input', e => {
    if (e.target.closest('.guide-content') || e.target.closest('.guide-side-list') || e.target.closest('[data-world="guide"] .world-head')) save();
  });

  // Save before unload as a safety net
  window.addEventListener('beforeunload', () => {
    try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch {}
  });
})();
