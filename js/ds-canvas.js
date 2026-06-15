// ds-canvas.js — HUB do Design System Canvas (Fase 3). Lift VERBATIM do IIFE
// inteiro (NÃO decomposto). Catálogo de tokens + todos os templates do DS.
// Expõe (bridge): __praiaApplyButtonOverrides/__praiaClient/__praiaEnsureDsTemplates/
// __praiaIcons/__praiaTplOverrides. Consome ~14 globais via window.__praia* (handlers).
// Carregado antes do state.js (rodava no main antes do restore).
/* Design System Canvas — pinned page that catalogs tokens + every template.
   Editable + persists via autosave like any other page. */
(() => {
  const btn = document.getElementById('ds-canvas-btn');
  if (!btn) return;
  const DS_PAGE_ID = 'p-ds-canvas';
  // Bump this when the DS canvas template (sections, samples, layout) changes
  // so cached pages regenerate instead of restoring stale content.
  const DS_VERSION = '65';
  const list = document.querySelector('.guide-side-list');
  const content = document.querySelector('[data-world="guide"] .guide-content');
  if (!list || !content) return;

  const checkIcon = '<span class="gs-check bs-icon" style="--bs-icon-size:16px">check</span>';
  const dsIcon = '<span class="gs-icon bs-icon" style="--bs-icon-size:16px">grid_view</span>';

  function buildTypeSection() {
    // Names match the rest of the UI (the type inspector / style picker):
    // H0, H1, H2, H3, H4, Body, Caption Bold, Caption, Body Small.
    const scales = [
      ['tk-h0',    'H0',           'Mensagem de marca'],
      ['tk-super', 'H1',           'Mensagem de marca'],
      ['tk-xl',    'H2',           'Mensagem de marca'],
      ['tk-l',     'H3',           'Mensagem de marca'],
      ['tk-mb',    'H4',           'Mensagem de marca'],
      ['tk-m',     'Body',         'Mensagem de marca'],
      ['tk-sb',    'Caption Bold', 'Mensagem de marca'],
      ['tk-s',     'Caption',      'Mensagem de marca'],
      ['tk-xs',    'Body Small',   'Mensagem de marca'],
    ];
    const rows = scales.map(([cls, label, sample]) => `
      <div style="display:grid;grid-template-columns:80px 1fr;gap:32px;align-items:baseline;padding:18px 0;border-top:1px solid var(--border)">
        <div class="tk-s" style="color:var(--text-3)">${label}</div>
        <div class="${cls}" style="color:var(--text);margin:0">${sample}</div>
      </div>`).join('');
    return `<section style="margin-top:48px">
      <div class="world-eyebrow" style="margin-bottom:14px">Tokens · Tipografia</div>
      ${rows}
    </section>`;
  }

  function buildColorSection() {
    const groups = [
      ['Brand', [
        ['--bs-navy',      'BluStar Navy',    '#061833'],
        ['--bs-navy-deep', 'Navy Deep',       '#04001E'],
        ['--bs-cyan',      'BluStar Cyan',    '#0FC4D5'],
        ['--bs-cyan-200',  'Cyan 200',        ''],
        ['--bs-cyan-100',  'Cyan 100',        '#BFFAFF'],
        ['--bs-cyan-50',   'Cyan 50',         '#DFFCFF'],
        ['--bs-blue',      'Royal Blue',      '#3259FF'],
        ['--bs-white',     'White',           '#FFFFFF'],
      ]],
      ['Surface', [
        ['--bg',          'Background',  ''],
        ['--surface',     'Surface 1',   ''],
        ['--surface-2',   'Surface 2',   ''],
        ['--surface-3',   'Surface 3',   ''],
        ['--border',      'Border',      ''],
        ['--border-strong','Border strong',''],
      ]],
      ['Text', [
        ['--text',    'Text',    ''],
        ['--text-2',  'Text 2',  ''],
        ['--text-3',  'Text 3',  ''],
      ]],
    ];
    // Resolve a CSS custom property to its display value. Raw hex stays hex;
    // rgba values display in shortened rgba form so alpha is preserved.
    const resolveHex = (token) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      if (!raw) return '';
      if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) return raw.toUpperCase();
      const rgba = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
      if (rgba) {
        const [r, g, b, a] = [rgba[1], rgba[2], rgba[3], rgba[4]];
        const hex = '#' + [r, g, b].map(n => parseInt(n).toString(16).padStart(2, '0').toUpperCase()).join('');
        if (a !== undefined && parseFloat(a) < 1) return hex + ' ' + Math.round(parseFloat(a) * 100) + '%';
        return hex;
      }
      return raw;
    };
    const swatchHtml = (token, name) => {
      const hex = resolveHex(token);
      return `
        <div class="ds-color-swatch" data-token="${token}" data-name="${name}" style="display:flex;flex-direction:column;gap:8px;min-width:0;cursor:pointer">
          <div class="ds-color-chip" style="aspect-ratio:1;border-radius:var(--r-md);background:var(--${token.slice(2)});border:1px solid var(--border)"></div>
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
            <div class="tk-sb ds-color-name" style="color:var(--text)">${name}</div>
            <div class="tk-xs ds-color-meta" style="color:var(--text-3);font-family:var(--font);letter-spacing:0;text-transform:none">${token}${hex ? ' · ' + hex : ''}</div>
          </div>
        </div>`;
    };
    const groupHtml = (title, items) => `
      <div style="margin-top:32px">
        <div class="tk-s" style="color:var(--text-3);margin-bottom:14px">${title}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));gap:24px">${items.map(i => swatchHtml(i[0], i[1])).join('')}</div>
      </div>`;
    return `<section style="margin-top:64px">
      <div class="world-eyebrow" style="margin-bottom:14px">Tokens · Cor</div>
      ${groups.map(g => groupHtml(...g)).join('')}
    </section>`;
  }

  // --- Icon library: editable, persisted, broadcast to every usage on save ---
  // Seeded with the 23 icons actually used in this tool (topnav, sidebar, page
  // menu, breakpoints, inspectors). Each entry now holds two variants:
  //   { outline: <svg...>, filled: <svg...> | null }
  // Outline is the default. Filled is used when the host has `.ico-filled`
  // class (active/pressed state). If filled is null, the host falls back to the
  // outline variant so non-stateful icons stay rendered.
  const ICONS_KEY = 'praia.brand.icons.v6';
  // Every icon is a Google Material Symbol glyph (fonts.google.com/icons).
  // An entry is { glyph, fill }: glyph = the Material ligature name,
  // fill = true renders the filled axis (default: outline).
  const _ig = (glyph, fill) => ({ glyph, fill: !!fill });
  const DEFAULT_ICONS = {
    home:           _ig('home'),
    guide:          _ig('menu_book'),
    sparkle:        _ig('auto_awesome'),
    gear:           _ig('settings'),
    grid_4:         _ig('grid_view'),
    clock:          _ig('schedule'),
    play:           _ig('play_arrow', true),
    share_up:       _ig('ios_share'),
    desktop:        _ig('desktop_windows'),
    tablet:         _ig('tablet_mac'),
    mobile:         _ig('smartphone'),
    chevron_down:   _ig('expand_more'),
    chevron_right:  _ig('chevron_right'),
    check:          _ig('check'),
    plus:           _ig('add'),
    minus:          _ig('remove'),
    dots:           _ig('more_horiz'),
    eye:            _ig('visibility'),
    edit:           _ig('edit'),
    trash:          _ig('delete'),
    undo:           _ig('undo'),
    arrow_right:    _ig('arrow_forward'),
    arrow_right_alt:_ig('arrow_right_alt'),
  };
  // Read library. Migrate any legacy entry (old SVG schema, string) → { glyph, fill }.
  function readIcons() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(ICONS_KEY) || '{}'); } catch {}
    const merged = Object.assign({}, DEFAULT_ICONS, raw);
    Object.keys(merged).forEach(k => {
      const e = merged[k];
      if (typeof e === 'string') merged[k] = { glyph: e, fill: false };
      else if (e && typeof e === 'object' && typeof e.glyph === 'string' && e.glyph) {
        merged[k] = { glyph: e.glyph, fill: !!e.fill };
      } else {
        merged[k] = { glyph: DEFAULT_ICONS[k]?.glyph || 'help', fill: !!DEFAULT_ICONS[k]?.fill };
      }
    });
    return merged;
  }
  function writeIcons(lib) {
    try { localStorage.setItem(ICONS_KEY, JSON.stringify(lib)); } catch {}
  }
  // Build the Material Symbols markup for a glyph entry at a given pixel size.
  function iconGlyphHTML(name, entry, sizePx) {
    if (!entry || !entry.glyph) return '';
    const size = sizePx ? `--bs-icon-size:${sizePx}px;` : '';
    return `<span class="bs-icon" data-ds-icon="${name}" data-fill="${entry.fill ? 1 : 0}" style="${size}">${entry.glyph}</span>`;
  }
  // Broadcast an icon glyph to every usage tagged with data-ds-icon.
  // Hosts are converted in place to a Material Symbols <span>:
  //   - legacy <svg data-ds-icon> → replaced by a sized span (keeps class/style,
  //     derives --bs-icon-size from the rendered box so layout doesn't shift)
  //   - <span data-ds-icon>       → glyph text + fill state updated
  // A host carrying .ico-filled/.is-filled forces the filled axis; .ico-outline forces outline.
  let __broadcasting = false;
  function broadcastIcon(name, entry) {
    if (__broadcasting) return;
    if (typeof entry === 'string') entry = { glyph: entry, fill: false };
    if (!entry || !entry.glyph) return;
    __broadcasting = true;
    try {
      document.querySelectorAll(`[data-ds-icon="${name}"]`).forEach(el => {
        const cls = el.getAttribute('class') || '';
        let fill = entry.fill;
        if (/\bico-filled\b|\bis-filled\b/.test(cls)) fill = true;
        if (/\bico-outline\b/.test(cls)) fill = false;
        if (el.tagName.toLowerCase() === 'svg') {
          const rect = el.getBoundingClientRect();
          const size = Math.round(rect.width) || Math.round(rect.height)
            || parseFloat(el.getAttribute('width')) || 24;
          const span = document.createElement('span');
          span.className = (cls ? cls + ' ' : '') + 'bs-icon';
          span.setAttribute('data-ds-icon', name);
          span.setAttribute('data-fill', fill ? '1' : '0');
          const style = el.getAttribute('style') || '';
          span.setAttribute('style', `${style}${style && !style.trim().endsWith(';') ? ';' : ''}--bs-icon-size:${size}px`);
          ['aria-label', 'role'].forEach(a => { const v = el.getAttribute(a); if (v != null) span.setAttribute(a, v); });
          span.textContent = entry.glyph;
          el.replaceWith(span);
        } else {
          el.classList.add('bs-icon');
          el.setAttribute('data-fill', fill ? '1' : '0');
          if (el.textContent.trim() !== entry.glyph) el.textContent = entry.glyph;
        }
      });
    } finally { __broadcasting = false; }
  }
  function broadcastAllIcons() {
    const lib = readIcons();
    Object.keys(lib).forEach(name => broadcastIcon(name, lib[name]));
  }
  window.__praiaIcons = { read: readIcons, write: writeIcons, broadcast: broadcastIcon };

  function buildIconsSection() {
    const lib = readIcons();
    const names = Object.keys(lib);
    const tile = (name) => `
      <button type="button" class="ds-icon-tile" data-icon-name="${name}" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;color:var(--text);transition:background .12s var(--ease), border-color .12s var(--ease)">
        <span class="ds-icon-host bs-icon" data-ds-icon="${name}" data-fill="${lib[name].fill ? 1 : 0}" style="--bs-icon-size:24px;color:var(--text)">${lib[name].glyph}</span>
        <span class="tk-xs" style="color:var(--text-3);font-family:var(--font);letter-spacing:0;text-transform:none">${name}</span>
      </button>`;
    return `<section style="margin-top:64px">
      <div class="world-eyebrow" style="margin-bottom:14px">Ícones</div>
      <div class="tk-s" style="color:var(--text-3);margin-bottom:14px">Clique em um ícone para editar. Alterações se propagam para todos os usos.</div>
      <div class="ds-icons-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:12px">${names.map(tile).join('')}</div>
    </section>`;
  }

  // --- Client logo / mark library ---
  // Two assets: full wordmark + brand symbol. Editable via the inspector;
  // changes broadcast to every `[data-ds-logo="<id>"]` host (e.g. sidebar).
  const CLIENT_KEY = 'praia.brand.client.v1';
  const DEFAULT_CLIENT = {
    full: {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1190.75 226.38" fill="#0FC4D5"><polygon points="858.18 119.48 832.79 221.29 873.43 221.29 893.45 141.04 858.18 119.48"/><polygon points="980.75 109.23 954.92 5.65 886.57 5.65 860.74 109.23 901.39 109.23 920.74 31.67 940.1 109.23 980.75 109.23"/><polygon points="983.3 119.48 948.03 141.04 968.06 221.29 1008.69 221.29 983.3 119.48"/><path d="M120.59,105.92c6.75-6.83,17.69-21.09,17.69-41.82,0-27.81-20.95-56.83-61.16-58.48H0v215.06h80.21c44.06,0,67.83-32.39,67.83-62.86,0-24.36-13.83-42.37-27.46-51.9ZM40.07,125.69h40.55c15.59.21,27.35,14.02,27.35,32.12,0,16.45-11.84,28.93-27.52,29.03h-40.38v-61.16ZM75.84,91.88l-35.77-.02v-52.43h35.24c11.1.2,22.9,8.92,22.9,24.67s-9.47,27.33-22.38,27.77Z"/><polygon points="218.6 5.64 178.53 5.64 178.53 220.67 304.56 220.67 304.56 186.84 218.6 186.84 218.6 5.64"/><path d="M430.74,149.68c0,27.21-13.1,42.82-35.94,42.82s-32.99-15.61-32.99-42.82V5.61h-40.07v143.76c.29,46.78,27.18,77.01,73.07,77.01s75.73-30.23,76.01-77.04V5.61h-40.07v144.07Z"/><path d="M603.86,95.74l-24.13-7.19c-17-4.04-25.61-13.57-25.61-28.32,0-16.5,10.59-26.35,33.26-26.35,24.7,0,33.26,21.87,33.26,36.65v4.42h40.07v-4.42c0-32.54-17.03-70.54-73.33-70.54-44.2,0-73.34,25.41-73.34,60.42s19.85,54.9,58.99,64.25l27.15,7.2c13.38,3.15,26.39,11.2,26.39,31.61,0,6.94-2.62,12.98-7.78,17.96-7.9,7.61-17.76,11.7-32.22,11.15-26.05-.96-39.23-22.97-39.23-42.81v-4.42h-40.28s0,4.41,0,4.41c0,36.23,26.02,75.39,79.7,76.59.81.02,1.63.03,2.44.03,24.64,0,44.37-8.41,59.56-23.27,11.54-11.29,17.9-25.37,17.9-39.65,0-36.04-19.96-57.56-62.79-67.72Z"/><polygon points="835.62 5.61 682.08 5.61 682.08 39.44 738.82 39.44 738.82 220.67 778.89 220.67 778.89 39.44 835.62 39.44 835.62 5.61"/><path d="M1140.67,132.57c26.75-9.49,43.73-32.95,43.73-61.18,0-38.11-30.16-65.77-71.71-65.77h-72.69v215.06h40.07v-83.52h20s47.46,83.52,47.46,83.52h43.22l-50.08-88.11ZM1080.06,39.45h32.59c18.35.12,31.67,13.55,31.67,31.94s-13.23,31.69-31.41,31.94h-32.85v-63.88Z"/></svg>',
      label: 'Logo completo',
      size: 28, // default render height in px
    },
    mark: {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 670 820" fill="#FFFFFF"><path d="M96.5779 432.854L0 820H154.585L230.737 514.839L96.5779 432.854Z"/><path d="M562.809 393.877L464.558 0H204.57L106.318 393.877H260.942L334.545 98.9445L408.186 393.877H562.809Z"/><path d="M572.508 432.854L438.349 514.839L514.538 820H669.085L572.508 432.854Z"/></svg>',
      label: 'Símbolo',
      size: 36,
    },
  };
  function readClient() {
    try {
      const stored = JSON.parse(localStorage.getItem(CLIENT_KEY) || '{}');
      return {
        full: Object.assign({}, DEFAULT_CLIENT.full, stored.full || {}),
        mark: Object.assign({}, DEFAULT_CLIENT.mark, stored.mark || {}),
      };
    } catch { return JSON.parse(JSON.stringify(DEFAULT_CLIENT)); }
  }
  function writeClient(c) { try { localStorage.setItem(CLIENT_KEY, JSON.stringify(c)); } catch {} }
  function broadcastClient(id, asset) {
    document.querySelectorAll(`[data-ds-logo="${id}"]`).forEach(host => {
      host.innerHTML = asset.svg;
      // Height-only sizing — width auto-scales from the svg's intrinsic ratio.
      host.style.setProperty('--ds-logo-h', (asset.size || 28) + 'px');
    });
  }
  function broadcastAllClient() {
    const c = readClient();
    broadcastClient('full', c.full);
    broadcastClient('mark', c.mark);
  }
  window.__praiaClient = { read: readClient, write: writeClient, broadcast: broadcastClient };

  function buildClientSection() {
    const c = readClient();
    const tile = (id, asset) => `
      <button type="button" class="ds-client-tile" data-client-id="${id}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px 24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;color:var(--text);transition:background .12s var(--ease), border-color .12s var(--ease);min-height:140px">
        <span class="ds-client-host" data-ds-logo="${id}" style="display:inline-flex;align-items:center;justify-content:center;height:${asset.size || 28}px;color:var(--text)">${asset.svg}</span>
        <span class="tk-xs" style="color:var(--text-3);font-family:var(--font);letter-spacing:0;text-transform:none">${asset.label}</span>
      </button>`;
    return `<section style="margin-top:64px">
      <div class="world-eyebrow" style="margin-bottom:14px">Cliente</div>
      <div class="tk-s" style="color:var(--text-3);margin-bottom:14px">Logo e símbolo do cliente. Clique para editar — alterações se propagam para todos os lugares onde aparecem.</div>
      <div class="ds-client-grid" style="display:grid;grid-template-columns:2fr 1fr;gap:12px">
        ${tile('full', c.full)}
        ${tile('mark', c.mark)}
      </div>
    </section>`;
  }

  // Catalogue of editable button variants. id → selector + sample HTML.
  // Exposed on window so the DS template-editor inspector can build a
  // "Variante" dropdown from the same source of truth (no parallel catalog).
  window.__BUTTON_VARIANTS = window.__BUTTON_VARIANTS || null;
  const BUTTON_VARIANTS = [
    { id: 'primary',        label: 'Primary',         selector: '.tn-btn.primary',
      sample: '<button class="tn-btn primary" type="button">Botão</button>' },
    { id: 'modal_primary',  label: 'Modal primary',   selector: '.am-add',
      sample: '<button class="am-add" type="button">Botão</button>' },
    { id: 'modal_ghost',    label: 'Modal ghost',     selector: '.am-cancel',
      sample: '<button class="am-cancel" type="button">Botão</button>' },
    { id: 'modal_alt',      label: 'Modal alt',       selector: '.am-ds',
      sample: '<button class="am-ds" type="button">Botão</button>' },
    { id: 'topnav_default', label: 'Topnav default',  selector: '.tn-btn',
      sample: '<button class="tn-btn" type="button">Botão</button>' },
    { id: 'content_cta',    label: 'CTA (conteúdo)',  selector: '.bs-cta',
      sample: '<button class="bs-cta" type="button">Download</button>' },
  ];
  window.__BUTTON_VARIANTS = BUTTON_VARIANTS;

  function buildButtonsSection() {
    const tile = (v) => `
      <div class="ds-btn-tile" data-btn-id="${v.id}" role="button" tabindex="0">
        <div class="ds-btn-tile-stage">${v.sample}</div>
        <div class="ds-btn-tile-label">${v.label}</div>
      </div>`;
    return `<section style="margin-top:64px">
      <div class="world-eyebrow" style="margin-bottom:14px">Botões</div>
      <div class="ds-btn-grid">${BUTTON_VARIANTS.map(tile).join('')}</div>
    </section>`;
  }

  function buildTemplatesSection() {
    // Single unified Templates section — no sub-categories. Cells keep their
    // data-tpl-cat so per-category behavior (e.g. edit-canvas rules) still works.
    return `
      <section style="margin-top:64px;display:none" data-ds-section="templates">
        <div class="world-eyebrow" style="margin-bottom:14px">Templates</div>
        <div class="ds-tpl-filters" role="tablist" aria-label="Filtrar templates por categoria">
          <button type="button" class="ds-tpl-filter is-active" data-tpl-filter="all">Todos</button>
          <button type="button" class="ds-tpl-filter" data-tpl-filter="text">Texto</button>
          <button type="button" class="ds-tpl-filter" data-tpl-filter="images">Foto</button>
          <button type="button" class="ds-tpl-filter" data-tpl-filter="video">Video</button>
          <button type="button" class="ds-tpl-filter" data-tpl-filter="basic">Base</button>
          <button type="button" class="ds-tpl-filter" data-tpl-filter="colors">Cor</button>
        </div>
        <div class="ds-cat-grid" data-cat="all" style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px"></div>
        <div class="ds-edit-stage" data-cat="all">
          <button type="button" class="ds-edit-back" data-ds-edit-back aria-label="Voltar">← Voltar</button>
          <button type="button" class="ds-edit-gridtoggle" data-ds-grid-toggle aria-label="Mostrar/ocultar grid" title="Mostrar/ocultar grid" aria-pressed="true">
            <span class="bs-icon" style="--bs-icon-size:16px">grid_on</span>
          </button>
          <button type="button" class="ds-edit-addblock" data-ds-addblock aria-label="Add block" title="Add block">
            <span class="bs-icon" style="--bs-icon-size:16px">add</span>
            <span>ADD BLOCK</span>
          </button>
          <div class="ds-edit-canvas" data-ds-edit-canvas></div>
        </div>
      </section>
    `;
  }

  // Filter chips above the DS Templates grid. Delegated so it survives DOM
  // rebuilds (page re-creation, autosave restore).
  document.addEventListener('click', e => {
    const chip = e.target.closest('.ds-tpl-filter');
    if (!chip) return;
    const filter = chip.dataset.tplFilter || 'all';
    const root = chip.closest('section[data-ds-section="templates"], .am-modal');
    if (!root) return;
    root.querySelectorAll('.ds-tpl-filter').forEach(b => b.classList.toggle('is-active', b === chip));
    const grid = root.querySelector('.ds-cat-grid');
    if (grid) {
      if (filter === 'all') grid.removeAttribute('data-filter');
      else grid.dataset.filter = filter;
    }
  });
  // Inject the filter chips into any DS Templates section that was created
  // BEFORE this version of the script (autosave restores the old HTML). Runs
  // once on load + after every DOM swap, idempotent via the existence check.
  function ensureTplFilters() {
    document.querySelectorAll('section[data-ds-section="templates"]').forEach(sec => {
      if (sec.querySelector('.ds-tpl-filters')) return;
      const grid = sec.querySelector('.ds-cat-grid');
      if (!grid) return;
      const wrap = document.createElement('div');
      wrap.className = 'ds-tpl-filters';
      wrap.setAttribute('role', 'tablist');
      wrap.setAttribute('aria-label', 'Filtrar templates por categoria');
      wrap.innerHTML = [
        ['all',    'Todos'],
        ['text',   'Texto'],
        ['images', 'Foto'],
        ['video',  'Video'],
        ['basic',  'Base'],
        ['colors', 'Cor'],
      ].map(([k, l], i) => `<button type="button" class="ds-tpl-filter${i === 0 ? ' is-active' : ''}" data-tpl-filter="${k}">${l}</button>`).join('');
      grid.parentNode.insertBefore(wrap, grid);
    });
  }
  // The templates-grid MutationObserver (below) rebuilds the grid when DS cells
  // are added/removed. But rebuilding ITSELF adds/removes cells — which re-fired
  // the observer every frame (~2000 mutations/s, freezing the page). Fix: pause
  // the observer around any grid rebuild so it never reacts to its own writes.
  // Depth counter handles nested calls (ensureTplCells → populateTemplatesGrid).
  let __tplMO = null;
  let __tplMODepth = 0;
  const __pauseTplMO = (fn) => {
    __tplMODepth++;
    if (__tplMO && __tplMODepth === 1) __tplMO.disconnect();
    try { return fn(); }
    finally {
      __tplMODepth--;
      if (__tplMO && __tplMODepth === 0) __tplMO.observe(document.body, { childList: true, subtree: true });
    }
  };
  function ensureTplCells() {
   __pauseTplMO(() => {
    document.querySelectorAll('section[data-ds-section="templates"]').forEach(sec => {
      const grid = sec.querySelector('.ds-cat-grid[data-cat="all"]');
      if (!grid) return;
      // 2026-05-28: always rebuild from the in-scope registries (which are now
      // empty — templates will be authored from scratch). Autosave may restore
      // stale cells from earlier sessions; force a clean repopulate.
      grid.innerHTML = '';
      if (!grid.children.length) {
        const page = sec.closest('.guide-page') || sec.parentElement;
        if (page) populateTemplatesGrid(page);
        return;
      }
      // Grid already populated by autosave restore. Re-apply any saved overrides
      // so the cell thumb reflects the latest commitEditAndExit, even when the
      // restored DOM snapshot pre-dates the edit.
      if (!window.__praiaTplOverrides) {
        try { window.__praiaTplOverrides = JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}'); }
        catch { window.__praiaTplOverrides = {}; }
      }
      const overrides = window.__praiaTplOverrides || {};
      grid.querySelectorAll('.ds-tpl-cell').forEach(cell => {
        const name = cell.dataset.tplName;
        const html = name && overrides[name];
        if (!html) return;
        const wrap = cell.querySelector('.ds-thumb-wrap');
        if (!wrap) return;
        if (wrap.dataset.dsOverrideApplied === name) return;
        if (!window.__praiaWrapMasterInMirror) return;
        const r = window.__praiaWrapMasterInMirror(html, { transparentBg: false });
        if (!r.hasThumb) return;
        const actions = wrap.querySelector('.ds-tpl-actions')?.cloneNode(true);
        wrap.classList.add('praia-frame');
        wrap.style.aspectRatio = `${r.editW}/${r.editH}`;
        wrap.style.overflow = 'hidden';
        wrap.style.position = 'relative';
        wrap.innerHTML = r.html;
        if (actions) wrap.appendChild(actions);
        wrap.dataset.dsOverrideApplied = name;
      });
      window.__praiaEnsureMirrorObserver?.();
      requestAnimationFrame(() => window.__praiaApplyMirrorScale?.());
    });
   });
  }
  // Migrate orphan instances (inserted before tagging existed). For every
  // .am-tpl-thumb on a guide page whose wrapper has no data-tpl-instance, try
  // to identify it by matching against saved overrides. Two paths:
  //  1. The thumb itself carries data-tpl-name (master was re-edited after
  //     the stamping fix) — trust it directly.
  //  2. Coarse fingerprint match (child count + first-child class) against
  //     sanitized override — best-effort for pre-stamping orphans.
  function migrateOrphans() {
    const overrides = window.__praiaTplOverrides || JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}');
    const fingerprints = Object.entries(overrides).map(([name, html]) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = sanitizeOverrideForInstance(html);
      const t = tmp.querySelector('.am-tpl-thumb');
      return t ? { name, childCount: t.children.length, firstCls: t.firstElementChild?.className || '', signature: t.outerHTML.length } : null;
    }).filter(Boolean);
    document.querySelectorAll('.guide-page .am-tpl-thumb').forEach(thumb => {
      if (thumb.closest('section[data-ds-section]')) return;
      const wrap = thumb.parentElement;
      if (!wrap || wrap.dataset.tplInstance) return;
      const stamped = thumb.getAttribute('data-tpl-name') || thumb.getAttribute('data-ds-override-applied');
      if (stamped) { wrap.dataset.tplInstance = stamped; return; }
      const match = fingerprints.find(fp => fp.childCount === thumb.children.length && fp.firstCls === (thumb.firstElementChild?.className || ''));
      if (match) wrap.dataset.tplInstance = match.name;
    });
  }
  // One-shot at boot: sync every inserted instance with its master's latest
  // override. Runs ONCE so it can't ping-pong with the body-level MO that
  // listens for DOM changes.
  function syncInstancesOnce() {
    try {
      const overrides = window.__praiaTplOverrides || JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}');
      window.__praiaTplOverrides = overrides;
      migrateOrphans();
      Object.entries(overrides).forEach(([name, html]) => {
        if (html) window.__praiaPropagateTemplate?.(name, html);
      });
    } catch {}
  }
  // One-shot migration: lock every saved override to the canonical 1280×800
  // master canvas. Older overrides were stored with variable editW dimensions
  // (whatever the edit canvas happened to be when the user committed). We
  // rescale every absolute px value in inline styles so the layout matches the
  // new native size. Idempotent via the praia.tpl.migrated.1280 flag.
  function migrateOverridesTo1280() {
    if (localStorage.getItem('praia.tpl.migrated.1280') === '1') return;
    const MW = 1280, MH = 800;
    const overrides = window.__praiaTplOverrides || JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}');
    Object.entries(overrides).forEach(([name, html]) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const thumb = tmp.querySelector('.am-tpl-thumb');
      if (!thumb) return;
      const editW = parseFloat(thumb.dataset.dsEditW) || parseFloat(thumb.style.width) || MW;
      const editH = parseFloat(thumb.dataset.dsEditH) || parseFloat(thumb.style.height) || MH;
      const sx = MW / editW;
      const sy = MH / editH;
      // Scale every px value inside inline style attributes on every child.
      // Use the geometric mean for properties like font-size that are
      // direction-agnostic; left/width use sx, top/height use sy.
      const sAvg = (sx + sy) / 2;
      thumb.querySelectorAll('*').forEach(el => {
        const style = el.getAttribute('style');
        if (!style) return;
        const next = style.replace(/(left|right|width)\s*:\s*([-\d.]+)px/g, (_, p, n) => `${p}:${(parseFloat(n) * sx).toFixed(3)}px`)
                          .replace(/(top|bottom|height)\s*:\s*([-\d.]+)px/g, (_, p, n) => `${p}:${(parseFloat(n) * sy).toFixed(3)}px`)
                          .replace(/(padding|margin|border-radius|gap|font-size|line-height)\s*:\s*([-\d.]+)px/g, (_, p, n) => `${p}:${(parseFloat(n) * sAvg).toFixed(3)}px`)
                          .replace(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/g, (_, x, y) => `translate(${(parseFloat(x) * sx).toFixed(3)}px, ${(parseFloat(y) * sy).toFixed(3)}px)`)
                          .replace(/font\s*:\s*([^;]*?)([-\d.]+)px\s*\/\s*([\d.]+)/g, (_, pre, sz, lh) => `font: ${pre}${(parseFloat(sz) * sAvg).toFixed(2)}px/${lh}`);
        if (next !== style) el.setAttribute('style', next);
      });
      // Reset thumb's stamped dims to canonical and clear scale artifacts.
      thumb.dataset.dsEditW = String(MW);
      thumb.dataset.dsEditH = String(MH);
      thumb.style.width = '';
      thumb.style.height = '';
      thumb.style.transform = '';
      thumb.style.transformOrigin = '';
      thumb.removeAttribute('data-ds-scaled-thumb');
      overrides[name] = thumb.outerHTML;
    });
    window.__praiaTplOverrides = overrides;
    try { localStorage.setItem('praia.tpl.overrides', JSON.stringify(overrides)); } catch {}
    try { localStorage.setItem('praia.tpl.migrated.1280', '1'); } catch {}
  }
  // Migração: garante o botão Download no template texto 05 (New page) em
  // QUALQUER navegador. O override fica no localStorage de cada um, então esta
  // migração (que ship no source) atualiza o override antigo e propaga p/ as
  // instâncias já em uso. Idempotente via flag.
  function migrate05Download() {
    if (localStorage.getItem('praia.tpl.05dl.v3') === '1') return;
    const HTML05 = '<div class="am-tpl-thumb" data-ds-edit-w="1280" data-ds-edit-h="174" style="width:1280px;height:174px;padding:0;display:block;aspect-ratio:auto;background:var(--bs-navy);overflow:hidden"><section style="display:grid;grid-template-columns:repeat(12,1fr);column-gap:var(--ds-gap,24px);row-gap:16px;align-items:start;overflow-wrap:anywhere"><h1 class="tk-super" style="grid-column:1 / 9;grid-row:1;margin:0;color:var(--bs-white);letter-spacing:-0.02em">New page</h1><button type="button" class="bs-cta" style="grid-column:9 / -1;grid-row:1;justify-self:end;align-self:center"><span class="bs-icon" style="--bs-icon-size:14px">download</span>Download</button><h4 class="tk-mb" style="grid-column:1 / -1;grid-row:2;margin:0;color:var(--text-3)">Descrição da página. Clique para editar.</h4><div aria-hidden="true" style="grid-column:1 / -1;grid-row:3;height:1px;background:var(--border-strong);margin-top:16px"></div></section></div>';
    try {
      const ov = JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}');
      if (ov['05'] !== HTML05) {
        ov['05'] = HTML05;
        localStorage.setItem('praia.tpl.overrides', JSON.stringify(ov));
        window.__praiaTplOverrides = ov;
        try { window.__praiaPropagateTemplate && window.__praiaPropagateTemplate('05', HTML05); } catch {}
        // Re-renderiza a grade do picker p/ a célula 05 mostrar a versão nova.
        try { document.querySelectorAll('.ds-thumb-wrap[data-ds-override-applied="05"]').forEach(w => { delete w.dataset.dsOverrideApplied; }); ensureTplCells(); } catch {}
      }
      localStorage.setItem('praia.tpl.05dl.v3', '1');
    } catch {}
  }

  function bootInstanceSync() {
    migrateOverridesTo1280();
    migrate05Download();
    syncInstancesOnce();
    window.__praiaEnsureMirrorObserver?.();
    window.__praiaApplyMirrorScale?.();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(bootInstanceSync, 600));
  } else {
    setTimeout(bootInstanceSync, 600);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { ensureTplFilters(); ensureTplCells(); });
  } else {
    ensureTplFilters();
    ensureTplCells();
  }
  setTimeout(() => { ensureTplFilters(); ensureTplCells(); }, 500);
  // Only react when the DS section is added/removed (page nav, autosave restore,
  // template insert/delete). Style/text mutations elsewhere in the document
  // would otherwise trigger ensureTplCells on every keystroke.
  let __tplObserverPending = 0;
  __tplMO = new MutationObserver(muts => {
    let relevant = false;
    for (const m of muts) {
      if (m.type !== 'childList') continue;
      if (!m.addedNodes.length && !m.removedNodes.length) continue;
      const involved = [...m.addedNodes, ...m.removedNodes].some(n => {
        if (n.nodeType !== 1) return false;
        return n.matches?.('section[data-ds-section], .ds-tpl-cell, .guide-page') ||
               n.querySelector?.('section[data-ds-section="templates"], .ds-tpl-cell');
      });
      if (involved) { relevant = true; break; }
    }
    if (!relevant) return;
    if (__tplObserverPending) return;
    __tplObserverPending = requestAnimationFrame(() => {
      __tplObserverPending = 0;
      ensureTplFilters();
      ensureTplCells();
    });
  });
  __tplMO.observe(document.body, { childList: true, subtree: true });
  function populateTemplatesGrid(pageEl) {
    // Render directly from the in-scope registries (textTemplates / templates /
    // modules) — the Add Module modal mirrors DS now, so DS is the source.
    const target = pageEl.querySelector(`.ds-cat-grid[data-cat="all"]`);
    if (!target) return;
    target.innerHTML = '';
    const reg = window.__praiaRegistries || {};
    const textTpls = reg.textTemplates || [];
    const imgTpls = reg.templates || [];
    const mods = reg.modules || {};
    if (!window.__praiaTplOverrides) {
      try { window.__praiaTplOverrides = JSON.parse(localStorage.getItem('praia.tpl.overrides') || '{}'); }
      catch { window.__praiaTplOverrides = {}; }
    }
    const overrideFor = (name) => name && window.__praiaTplOverrides && window.__praiaTplOverrides[name];
    // Users can no longer duplicate/delete templates from the picker — the
    // per-cell action buttons are removed.
    const ACTIONS = '';
    const baseWrapStyle = 'overflow:hidden;border-radius:var(--r-sm);border:1px solid var(--border);background:var(--surface);transition:border-color .15s var(--ease);position:relative';
    const makeCell = (item, cat, kind) => {
      const name = item.name || '—';
      const cell = document.createElement('div');
      cell.style.cssText = 'display:flex;flex-direction:column;gap:10px;min-width:0;cursor:pointer';
      cell.className = 'ds-tpl-cell';
      cell.dataset.tplName = name;
      if (item.id) cell.dataset.tplId = item.id;
      cell.dataset.tplKind = kind === 'module' ? 'module' : 'template';
      cell.dataset.tplCat = cat;
      cell.setAttribute('role', 'button');
      cell.tabIndex = 0;
      // If the master has been edited (override exists), wrap it in the unified
      // mirror pipeline so the cell preview is pixel-identical to the master.
      // Registry thumbs (no override) keep their original responsive layout —
      // they're hand-authored to fit any width without needing scale.
      const overrideHtml = overrideFor(name);
      let inner, wrapStyle;
      if (overrideHtml && window.__praiaWrapMasterInMirror) {
        const r = window.__praiaWrapMasterInMirror(overrideHtml, { transparentBg: false });
        wrapStyle = baseWrapStyle + `;aspect-ratio:${r.editW}/${r.editH}`;
        inner = r.html;
      } else {
        wrapStyle = baseWrapStyle;
        inner = item.thumb || '';
      }
      cell.innerHTML = `<div class="ds-thumb-wrap praia-frame" style="${wrapStyle}">${inner}${ACTIONS}</div>
        <div class="tk-s" style="color:var(--text);text-transform:none;letter-spacing:0">${name}</div>`;
      target.appendChild(cell);
    };
    textTpls.forEach(t => makeCell(t, 'text', 'template'));
    imgTpls.forEach(t => makeCell(t, 'images', 'template'));
    (mods.video || []).filter(m => m.thumb).forEach(m => makeCell(m, 'video', 'module'));
    (mods.basic || []).filter(m => m.thumb).forEach(m => makeCell(m, 'basic', 'module'));
    (mods.colors || []).filter(m => m.thumb).forEach(m => makeCell(m, 'colors', 'module'));
    window.__praiaEnsureMirrorObserver?.();
    requestAnimationFrame(() => window.__praiaApplyMirrorScale?.());
  }

  // Cleanup: previous versions inserted DS Canvas as a sidebar entry. Remove
  // any stale item so DS is exclusively accessed via the topnav button.
  const stale = list.querySelector(`.guide-side-item[data-page="${DS_PAGE_ID}"]`);
  if (stale) stale.remove();

  // Remember the page the user was viewing before entering DS mode so the
  // "Voltar" button can restore it cleanly.
  let __dsPreviousPageId = null;

  function createCanvasPage() {
    const page = document.createElement('div');
    page.className = 'guide-page';
    page.dataset.page = DS_PAGE_ID;
    page.dataset.dsCanvas = 'true';
    page.dataset.dsVersion = DS_VERSION;
    page.innerHTML = `
      ${buildTypeSection()}
      ${buildColorSection()}
      ${buildIconsSection()}
      ${buildButtonsSection()}
      ${buildClientSection()}
      ${buildTemplatesSection()}
    `;
    content.appendChild(page);
    // Tag the six sections so the DS sidebar can show/hide them individually.
    const __DS_SECTIONS = ['type', 'color', 'icons', 'buttons', 'client'];
    page.querySelectorAll(':scope > section').forEach((sec, i) => {
      // Templates sub-sections already carry their own data-ds-section, so
      // we only assign keys to the leading non-templates sections in order.
      if (sec.dataset.dsSection) return;
      const key = __DS_SECTIONS[i];
      if (key) sec.dataset.dsSection = key;
    });
    populateTemplatesGrid(page);
    broadcastAllIcons();
    broadcastAllClient();
    window.__praiaAutosave?.();
    return page;
  }
  // Ensure the DS canvas page (and therefore the Templates section that the
  // "Add template" modal mirrors) exists, building it lazily if the user has
  // never opened the Design System. This guarantees the picker shows the same
  // templates whether opened from Home or Guide — identical, never different.
  window.__praiaEnsureDsTemplates = function() {
    let page = content.querySelector(`.guide-page[data-page="${DS_PAGE_ID}"]`);
    if (page && page.dataset.dsVersion !== DS_VERSION) { page.remove(); page = null; }
    if (!page) page = createCanvasPage();
    return page.querySelector('section[data-ds-section="templates"]');
  };
  // Re-broadcast any time DS page (re)renders or after autosave restores.
  setTimeout(broadcastAllIcons, 300);

  // Live MO: when new [data-ds-icon] nodes get added to the DOM (e.g. a fresh
  // page row with eye/dots), re-broadcast just those names. Disconnect during
  // the broadcast and reconnect afterwards so the replacement doesn't reflow
  // back into the observer's queue.
  let __iconMO = null;
  function rebroadcastForAdded(addedSet) {
    if (!addedSet.size) return;
    if (__iconMO) __iconMO.disconnect();
    const lib = readIcons();
    addedSet.forEach(name => { if (lib[name]) broadcastIcon(name, lib[name]); });
    if (__iconMO) __iconMO.observe(document.body, { childList: true, subtree: true });
  }
  __iconMO = new MutationObserver((muts) => {
    const seen = new Set();
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.matches?.('[data-ds-icon]')) seen.add(n.getAttribute('data-ds-icon'));
        n.querySelectorAll?.('[data-ds-icon]').forEach(el => seen.add(el.getAttribute('data-ds-icon')));
      });
    }
    if (seen.size) requestAnimationFrame(() => rebroadcastForAdded(seen));
  });
  __iconMO.observe(document.body, { childList: true, subtree: true });

  // --- Icon inspector wiring (file upload, two variants: outline + filled) ---
  let __iconEditing = null;                          // name of icon being edited
  let __iconPending = { glyph: null, fill: false };  // Material glyph awaiting Save
  function sanitizeSvg(raw) {
    if (typeof raw !== 'string') return null;
    let s = raw.trim().replace(/<\?xml[\s\S]*?\?>/, '').trim();
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
    s = s.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
    s = s.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
    const m = s.match(/<svg[\s\S]*<\/svg>/i);
    return m ? m[0] : null;
  }
  async function readFileAsText(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsText(file);
    });
  }
  // Refresh the live glyph preview from current pending state.
  function renderIconPreview() {
    const prev = document.getElementById('gri-preview-glyph');
    if (!prev) return;
    prev.textContent = __iconPending.glyph || 'help';
    prev.setAttribute('data-fill', __iconPending.fill ? '1' : '0');
  }
  function openIconEditor(name) {
    const lib = readIcons();
    if (!(name in lib)) return;
    __iconEditing = name;
    const entry = lib[name];
    __iconPending = { glyph: entry.glyph || '', fill: !!entry.fill };
    const right = document.querySelector('.guide-right'); if (!right) return;
    window.__praiaCloseRightModes?.();
    right.classList.add('icon-mode');
    document.getElementById('gri-title').textContent = name;
    const input = document.getElementById('gri-glyph-input');
    if (input) input.value = __iconPending.glyph;
    const toggle = document.getElementById('gri-fill-toggle');
    if (toggle) toggle.checked = __iconPending.fill;
    renderIconPreview();
    document.querySelectorAll('.ds-icon-tile.editing').forEach(t => t.classList.remove('editing'));
    document.querySelector(`.ds-icon-tile[data-icon-name="${name}"]`)?.classList.add('editing');
  }
  function closeIconEditor() {
    __iconEditing = null;
    __iconPending = { glyph: null, fill: false };
    document.querySelector('.guide-right')?.classList.remove('icon-mode');
    document.querySelectorAll('.ds-icon-tile.editing').forEach(t => t.classList.remove('editing'));
  }
  // Live-preview wiring: typing a glyph name / toggling fill updates the preview.
  document.getElementById('gri-glyph-input')?.addEventListener('input', (e) => {
    __iconPending.glyph = e.target.value.trim().toLowerCase().replace(/\s+/g, '_');
    renderIconPreview();
  });
  document.getElementById('gri-fill-toggle')?.addEventListener('change', (e) => {
    __iconPending.fill = !!e.target.checked;
    renderIconPreview();
  });
  // Delegated click on DS canvas tiles (survives re-render)
  document.addEventListener('click', (e) => {
    const tile = e.target.closest('.ds-icon-tile');
    if (!tile) return;
    e.preventDefault(); e.stopPropagation();
    openIconEditor(tile.dataset.iconName);
  });
  document.getElementById('gri-cancel')?.addEventListener('click', () => {
    closeIconEditor();
  });
  document.getElementById('gri-save')?.addEventListener('click', () => {
    if (!__iconEditing) return;
    const glyph = (__iconPending.glyph || '').trim();
    if (!glyph) { alert('Digite o nome de um ícone Material.'); return; }
    const lib = readIcons();
    const entry = { glyph, fill: !!__iconPending.fill };
    lib[__iconEditing] = entry;
    writeIcons(lib);
    broadcastIcon(__iconEditing, entry);
    window.__praiaToast?.('Ícone "' + __iconEditing + '" atualizado');
    closeIconEditor();
  });
  document.getElementById('gri-close')?.addEventListener('click', closeIconEditor);
  // Click outside the icon inspector / outside an icon tile → close.
  document.addEventListener('click', (e) => {
    if (!document.querySelector('.guide-right.icon-mode')) return;
    if (e.target.closest('.gr-icon-insp')) return;
    if (e.target.closest('.ds-icon-tile')) return;
    closeIconEditor();
  }, true);

  // ============================================================
  // CLIENT LOGO / MARK EDITOR
  // ============================================================
  let __clientEditing = null;
  function openClientEditor(id) {
    const c = readClient();
    const asset = c[id];
    if (!asset) return;
    __clientEditing = id;
    const right = document.querySelector('.guide-right'); if (!right) return;
    window.__praiaCloseRightModes?.();
    right.classList.add('client-mode');
    document.getElementById('grc-client-title').textContent = asset.label;
    const preview = document.getElementById('grcl-preview');
    preview.style.setProperty('--ds-logo-h', (asset.size || 36) + 'px');
    preview.innerHTML = asset.svg;
    document.getElementById('grcl-svg').value = asset.svg;
    document.getElementById('grcl-size-range').value = asset.size || 36;
    document.getElementById('grcl-size-num').value = asset.size || 36;
    document.querySelectorAll('.ds-client-tile.editing').forEach(t => t.classList.remove('editing'));
    document.querySelector(`.ds-client-tile[data-client-id="${id}"]`)?.classList.add('editing');
  }
  function closeClientEditor() {
    __clientEditing = null;
    document.querySelector('.guide-right')?.classList.remove('client-mode');
    document.querySelectorAll('.ds-client-tile.editing').forEach(t => t.classList.remove('editing'));
  }
  // Live preview as user edits
  function refreshClientPreview() {
    const preview = document.getElementById('grcl-preview');
    const svg = document.getElementById('grcl-svg').value;
    const size = parseInt(document.getElementById('grcl-size-num').value, 10) || 36;
    preview.style.setProperty('--ds-logo-h', size + 'px');
    preview.innerHTML = svg;
  }
  document.getElementById('grcl-svg')?.addEventListener('input', refreshClientPreview);
  document.getElementById('grcl-size-range')?.addEventListener('input', (e) => {
    document.getElementById('grcl-size-num').value = e.target.value;
    refreshClientPreview();
  });
  document.getElementById('grcl-size-num')?.addEventListener('input', (e) => {
    document.getElementById('grcl-size-range').value = e.target.value;
    refreshClientPreview();
  });
  // Delegated click on DS client tiles
  document.addEventListener('click', (e) => {
    const tile = e.target.closest('.ds-client-tile');
    if (!tile) return;
    e.preventDefault(); e.stopPropagation();
    openClientEditor(tile.dataset.clientId);
  });
  document.getElementById('grcl-cancel')?.addEventListener('click', () => {
    if (__clientEditing) {
      const c = readClient();
      // Revert any live preview edits by re-broadcasting saved values
      broadcastClient(__clientEditing, c[__clientEditing]);
    }
    closeClientEditor();
  });
  document.getElementById('grcl-save')?.addEventListener('click', () => {
    if (!__clientEditing) return;
    const raw = (document.getElementById('grcl-svg').value || '').trim();
    if (!raw.includes('<svg')) { alert('O markup precisa conter um <svg>.'); return; }
    const size = parseInt(document.getElementById('grcl-size-num').value, 10) || 36;
    const c = readClient();
    c[__clientEditing] = Object.assign({}, c[__clientEditing], { svg: raw, size });
    writeClient(c);
    broadcastClient(__clientEditing, c[__clientEditing]);
    // Also update the DS tile host's inline height attribute so it matches.
    const tileHost = document.querySelector(`.ds-client-tile[data-client-id="${__clientEditing}"] .ds-client-host`);
    if (tileHost) tileHost.style.height = size + 'px';
    window.__praiaToast?.('Logo "' + __clientEditing + '" atualizado');
    closeClientEditor();
  });
  document.getElementById('grcl-close')?.addEventListener('click', closeClientEditor);
  // Click outside the client inspector / outside a client tile → close.
  document.addEventListener('click', (e) => {
    if (!document.querySelector('.guide-right.client-mode')) return;
    if (e.target.closest('.gr-client-insp')) return;
    if (e.target.closest('.ds-client-tile')) return;
    closeClientEditor();
  }, true);

  // ============================================================
  // BUTTON EDITOR — Figma-like inspector (Fill / Stroke / Layout)
  // ============================================================
  const BUTTONS_KEY = 'praia.brand.buttons.v1';
  // Brand-named tokens for the picker popover, in Figma "Category/Name" format.
  // Naming aligned to the Blustar color tier (Asfalto/Noturno/Profundo/Céu/Turquesa/Horizonte/Aberto/Nuvem).
  const BUTTON_TOKENS = [
    { v: 'var(--bs-navy)',      cat: 'Blustar', name: 'Asfalto',    c: 'var(--bs-navy)' },
    { v: 'var(--bs-navy-deep)', cat: 'Blustar', name: 'Noturno',    c: 'var(--bs-navy-deep)' },
    { v: '#0A1F3B',             cat: 'Blustar', name: 'Profundo',   c: '#0A1F3B' },
    { v: 'var(--bs-blue)',      cat: 'Blustar', name: 'Céu',        c: 'var(--bs-blue)' },
    { v: 'var(--bs-cyan)',      cat: 'Blustar', name: 'Turquesa',   c: 'var(--bs-cyan)' },
    { v: 'var(--bs-cyan-200)',  cat: 'Blustar', name: 'Horizonte',  c: 'var(--bs-cyan-200)' },
    { v: 'var(--bs-cyan-100)',  cat: 'Blustar', name: 'Aberto',     c: 'var(--bs-cyan-100)' },
    { v: 'var(--bs-cyan-50)',   cat: 'Blustar', name: 'Nuvem',      c: 'var(--bs-cyan-50)' },
    { v: 'var(--bs-white)',     cat: 'Blustar', name: 'White',      c: 'var(--bs-white)' },
    { v: 'var(--text)',         cat: 'Text',    name: 'Text',       c: 'var(--text)' },
    { v: 'var(--text-2)',       cat: 'Text',    name: 'Text 2',     c: 'var(--text-2)' },
    { v: 'var(--text-3)',       cat: 'Text',    name: 'Text 3',     c: 'var(--text-3)' },
    { v: 'var(--bg)',           cat: 'Surface', name: 'Background', c: 'var(--bg)' },
    { v: 'var(--surface)',      cat: 'Surface', name: 'Surface 1',  c: 'var(--surface)' },
    { v: 'var(--surface-2)',    cat: 'Surface', name: 'Surface 2',  c: 'var(--surface-2)' },
    { v: 'var(--border)',       cat: 'Surface', name: 'Border',     c: 'var(--border)' },
    { v: 'var(--border-strong)',cat: 'Surface', name: 'Border strong', c: 'var(--border-strong)' },
    { v: 'transparent',         cat: 'Other',   name: 'Transparente', c: 'transparent', empty: true },
  ];
  const tokenByValue = (v) => BUTTON_TOKENS.find(t => t.v === v);
  // The overrides also mirror into a hidden <span data-praia-buttons> placed
  // inside .guide-content. That element is watched by the autosave MutationObserver,
  // so each save pushes a Cmd+Z snapshot. On undo, applySnapshot restores the
  // attribute and the post-snapshot hook re-applies the stylesheet.
  function getStateEl() {
    let el = document.getElementById('praia-ds-state');
    if (!el) {
      const content = document.querySelector('[data-world="guide"] .guide-content');
      if (!content) return null;
      el = document.createElement('span');
      el.id = 'praia-ds-state';
      el.hidden = true;
      el.dataset.buttons = '{}';
      content.prepend(el);
    }
    return el;
  }
  function readButtons() {
    const el = getStateEl();
    if (el?.dataset.buttons) {
      try { return JSON.parse(el.dataset.buttons); } catch {}
    }
    try { return JSON.parse(localStorage.getItem(BUTTONS_KEY) || '{}'); } catch { return {}; }
  }
  function writeButtons(o) {
    try { localStorage.setItem(BUTTONS_KEY, JSON.stringify(o)); } catch {}
    const el = getStateEl();
    if (el) el.dataset.buttons = JSON.stringify(o);
  }
  function applyButtonOverrides() {
    const all = readButtons();
    let styleEl = document.getElementById('praia-button-overrides');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'praia-button-overrides'; document.head.appendChild(styleEl); }
    const parts = [];
    BUTTON_VARIANTS.forEach(v => {
      const ov = all[v.id]; if (!ov) return;
      const d = [];
      if (ov.bg)     d.push('background:' + ov.bg);
      if (ov.fg)     d.push('color:' + ov.fg);
      // Stroke: Inside uses border (default), Outside uses box-shadow ring,
      // Center uses outline with negative offset so half of the line sits over
      // the button's edge — visually like Figma's alignment options.
      if (ov.stroke && ov.border) {
        const w = parseInt(ov.strokeW, 10) || 1;
        if (ov.strokePos === 'Outside') {
          d.push('border:0', 'box-shadow:0 0 0 ' + w + 'px ' + ov.border, 'outline:none');
        } else if (ov.strokePos === 'Center') {
          d.push('border:0', 'outline:' + w + 'px solid ' + ov.border, 'outline-offset:-' + (w / 2) + 'px', 'box-shadow:none');
        } else {
          d.push('border:' + w + 'px solid ' + ov.border, 'box-shadow:none', 'outline:none');
        }
      } else if (ov.stroke === false || !ov.border) {
        d.push('border:0', 'box-shadow:none', 'outline:none');
      }
      if (ov.type && /^tk-(mb|m|sb|s|xs)$/.test(ov.type)) {
        const tk = ov.type.slice(3);
        d.push('font-family:var(--type-' + tk + '-family)');
        d.push('font-weight:var(--type-' + tk + '-weight)');
        d.push('font-size:var(--type-' + tk + '-size)');
        d.push('line-height:var(--type-' + tk + '-line)');
        d.push('letter-spacing:var(--type-' + tk + '-tracking)');
      }
      if (ov.height) {
        d.push('height:' + ov.height + 'px');
        // Altura fixa num botão block deixaria o texto colado no topo — força
        // flex pra manter a type SEMPRE centralizada (vertical + horizontal).
        d.push('display:inline-flex', 'align-items:center', 'justify-content:center');
      }
      if (ov.radius != null && ov.radius !== '') {
        const r = String(ov.radius).trim();
        d.push('border-radius:' + (/^\d+$/.test(r) ? r + 'px' : r));
      }
      if (d.length) parts.push(v.selector + '{' + d.join(';') + '}');
    });
    styleEl.textContent = parts.join('\n');
  }
  window.__praiaApplyButtonOverrides = applyButtonOverrides;
  applyButtonOverrides();

  // Cmd+Z support: each button save mutates the hidden state element, which
  // triggers the autosave + recordHistoryNow. After undo/redo restores DOM,
  // we re-apply the stylesheet so the live UI matches the rolled-back state.
  ['__praiaUndo', '__praiaRedo'].forEach(k => {
    const wait = setInterval(() => {
      if (typeof window[k] !== 'function') return;
      clearInterval(wait);
      const orig = window[k];
      window[k] = function (...args) {
        const r = orig.apply(this, args);
        queueMicrotask(() => {
          applyButtonOverrides();
          // Mirror the restored state element back into localStorage so the
          // app boots into the same state next reload.
          const el = document.getElementById('praia-ds-state');
          if (el?.dataset.buttons) {
            try { localStorage.setItem(BUTTONS_KEY, el.dataset.buttons); } catch {}
          }
        });
        return r;
      };
    }, 50);
  });

  // --- Token state (per target: bg / fg / border) ---
  const __tokenValues = { bg: '', fg: '', border: '' };
  // Resolve a CSS color (computed rgb/rgba) back to a BUTTON_TOKENS value.
  // Renders each token into a probe element so it works with var(--*) refs.
  let __tokenRgbMap = null;
  function buildTokenRgbMap() {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    const m = new Map();
    BUTTON_TOKENS.forEach(t => {
      probe.style.color = t.c;
      const rgb = getComputedStyle(probe).color;
      if (!m.has(rgb)) m.set(rgb, t.v);
    });
    probe.remove();
    return m;
  }
  function matchTokenColor(cssColor) {
    if (!cssColor || cssColor === 'rgba(0, 0, 0, 0)' || cssColor === 'transparent') return '';
    if (!__tokenRgbMap) __tokenRgbMap = buildTokenRgbMap();
    return __tokenRgbMap.get(cssColor) || '';
  }

  function setTokenPill(target, value) {
    __tokenValues[target] = value || '';
    const tk = value ? tokenByValue(value) : null;
    // Update trigger button (dot + name)
    const trigger = document.querySelector(`.grb-color-trigger[data-target="${target}"]`);
    if (trigger) {
      const dot  = trigger.querySelector('.grb-color-dot');
      const name = trigger.querySelector('.grb-color-name');
      if (dot)  dot.style.background = value || 'transparent';
      if (dot)  dot.style.borderStyle = value ? 'solid' : 'dashed';
      if (name) name.textContent = tk ? (tk.cat + '/' + tk.name) : '— sem cor —';
    }
    // Also update the open popover, if it's this target.
    document.querySelectorAll(`.grb-color-pop[data-target="${target}"] .gswatch`).forEach(b => {
      b.classList.toggle('selected', b.dataset.color === (value || ''));
    });
  }
  function getTokenValue(target) {
    return __tokenValues[target] || '';
  }
  function openColorPicker(trigger) {
    document.querySelectorAll('.grb-color-pop').forEach(p => p.remove());
    const target = trigger.dataset.target;
    const current = getTokenValue(target);
    const pop = document.createElement('div');
    pop.className = 'tk-popover grb-color-pop open';
    pop.dataset.target = target;
    pop.innerHTML = `<div class="grb-swatch-grid" data-target="${target}">` +
      BUTTON_TOKENS.map(t =>
        `<button type="button" class="gswatch${t.empty ? ' empty' : ''}${t.v === current ? ' selected' : ''}" data-color="${t.v}" title="${t.cat}/${t.name}" style="--grb-c:${t.c}"></button>`
      ).join('') + '</div>';
    document.body.appendChild(pop);
    const r = trigger.getBoundingClientRect();
    pop.style.top = (r.bottom + 4) + 'px';
    pop.style.left = (r.left) + 'px';
    pop.style.width = Math.max(220, r.width) + 'px';
    pop.addEventListener('click', e => {
      e.stopPropagation();
      const sw = e.target.closest('.gswatch');
      if (!sw) return;
      setTokenPill(target, sw.dataset.color);
      livePreview();
      pop.remove();
    });
    setTimeout(() => {
      const off = e => { if (!pop.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) { pop.remove(); document.removeEventListener('click', off); } };
      document.addEventListener('click', off);
    }, 0);
  }
  // Bind triggers — delegated so it survives re-renders.
  document.addEventListener('click', e => {
    const t = e.target.closest('.grb-color-trigger');
    if (!t) return;
    e.stopPropagation(); e.preventDefault();
    openColorPicker(t);
  });
  // No-op stub (kept so any legacy openPicker/closePicker call sites don't crash)
  function closePicker() {}

  let __btnEditing = null;
  let __btnSnapshot = null;   // { id, override-or-undefined } captured on open
  function openButtonEditor(id) {
    const v = BUTTON_VARIANTS.find(x => x.id === id);
    if (!v) return;
    __btnEditing = id;
    __btnSnapshot = { id, override: readButtons()[id] ? JSON.parse(JSON.stringify(readButtons()[id])) : null };
    const right = document.querySelector('.guide-right'); if (!right) return;
    window.__praiaCloseRightModes?.();
    right.classList.add('button-mode');
    // Always start with the token picker closed — otherwise a leftover open
    // popover sticks visually anchored to a stale pill from the previous edit.
    closePicker();
    document.getElementById('grb-title').textContent = v.label;
    document.getElementById('grb-preview').innerHTML = v.sample;
    broadcastAllIcons();
    const cur = (readButtons()[id]) || {};
    // Fallback: sample the LIVE button's computed colors so the dropdowns reflect
    // what is currently applied (CSS defaults) even when there's no override.
    const liveSample = document.querySelector(v.selector);
    const liveCS2 = liveSample ? getComputedStyle(liveSample) : null;
    const fallbackBg     = liveCS2 ? matchTokenColor(liveCS2.backgroundColor) : '';
    const fallbackFg     = liveCS2 ? matchTokenColor(liveCS2.color)           : '';
    const fallbackBorder = liveCS2 ? matchTokenColor(liveCS2.borderTopColor)  : '';
    setTokenPill('bg',     cur.bg     || fallbackBg     || '');
    setTokenPill('fg',     cur.fg     || fallbackFg     || '');
    setTokenPill('border', cur.border || fallbackBorder || '');
    __btnTypeCurrent = cur.type || '';
    const typeSel = document.getElementById('grb-type-select');
    const typeSelLabel = document.getElementById('grb-type-select-label');
    if (typeSel) typeSel.dataset.type = __btnTypeCurrent;
    if (typeSelLabel) {
      let label;
      if (__btnTypeCurrent) {
        label = (BTN_TYPE_OPTS.find(o => o.value === __btnTypeCurrent) || BTN_TYPE_OPTS[0]).label;
      } else {
        // No override — surface the inherent style the live button is using
        // by matching its computed font-size + weight to a tk-* token.
        const liveForType = document.querySelector(v.selector);
        label = detectInherentTypeLabel(liveForType);
      }
      typeSelLabel.textContent = label;
    }
    const strokeOn = !!cur.stroke && !!cur.border;
    document.getElementById('grb-stroke-toggle').setAttribute('aria-pressed', String(strokeOn));
    document.getElementById('grb-row-stroke').hidden = !strokeOn;
    document.getElementById('grb-stroke-w').value = cur.strokeW || 1;
    document.getElementById('grb-stroke-pos-label').textContent = cur.strokePos || 'Inside';
    // Real values for the LIVE button — used as fallback when no override exists.
    const liveEl = document.querySelector(v.selector);
    const liveCS = liveEl ? getComputedStyle(liveEl) : null;
    const liveH = liveCS ? Math.round(parseFloat(liveCS.height) || 32) : 32;
    const h = cur.height ? parseInt(cur.height, 10) : liveH;
    // Radius: read override or compute from live. ALWAYS clamp for display so a
    // "pill" value (999/9999/var(--r-full)) shows as the realistic round-end
    // number (= half height). The lock toggle remembers it's a pill.
    let r;
    if (cur.radius != null && cur.radius !== '') r = parseInt(cur.radius, 10);
    else r = liveCS ? parseFloat(liveCS.borderTopLeftRadius) || 0 : 0;
    const pillThreshold = h / 2;
    if (r >= pillThreshold - 1) r = Math.round(pillThreshold);
    document.getElementById('grb-height-num').value = h;
    document.getElementById('grb-radius-num').value = r;
    const pillLocked = Math.abs(r - pillThreshold) < 1.5;
    document.getElementById('grb-pill-lock').setAttribute('aria-pressed', String(pillLocked));
    document.querySelectorAll('.ds-btn-tile.editing, .ds-btn-row.editing').forEach(r => r.classList.remove('editing'));
    document.querySelector(`.ds-btn-tile[data-btn-id="${id}"], .ds-btn-row[data-btn-id="${id}"]`)?.classList.add('editing');
  }
  function closeButtonEditor() {
    __btnEditing = null;
    closePicker();
    document.querySelector('.guide-right')?.classList.remove('button-mode');
    document.querySelectorAll('.ds-btn-tile.editing, .ds-btn-row.editing').forEach(r => r.classList.remove('editing'));
  }
  function collectButtonForm() {
    const strokeOn = document.getElementById('grb-stroke-toggle').getAttribute('aria-pressed') === 'true';
    return {
      bg:       getTokenValue('bg') || undefined,
      fg:       getTokenValue('fg') || undefined,
      stroke:   strokeOn,
      border:   strokeOn ? (getTokenValue('border') || 'var(--border-strong)') : undefined,
      strokeW:  strokeOn ? (parseInt(document.getElementById('grb-stroke-w').value, 10) || 1) : undefined,
      strokePos: strokeOn ? document.getElementById('grb-stroke-pos-label').textContent : undefined,
      type:     __btnTypeCurrent || undefined,
      height:   document.getElementById('grb-height-num').value || undefined,
      radius:   document.getElementById('grb-radius-num').value || undefined,
    };
  }
  function livePreview() {
    if (!__btnEditing) return;
    const all = readButtons();
    all[__btnEditing] = collectButtonForm();
    writeButtons(all);
    applyButtonOverrides();
    // Push a history snapshot so Cmd+Z right after editing rolls back.
    queueMicrotask(() => window.__praiaRecordNow?.());
  }
  // Delegated tile click → open editor
  document.addEventListener('click', (e) => {
    const row = e.target.closest('.ds-btn-tile, .ds-btn-row');
    if (!row) return;
    if (e.target.closest('.gr-button-insp')) return;
    e.preventDefault(); e.stopPropagation();
    openButtonEditor(row.dataset.btnId);
  });
  // Inspector delegated actions — swatches + type buttons
  document.querySelector('.gr-button-insp')?.addEventListener('click', (e) => {
    const sw = e.target.closest('.gswatch');
    if (sw) {
      const target = sw.closest('.grb-swatch-grid').dataset.target;
      setTokenPill(target, sw.dataset.color);
      livePreview();
      return;
    }
    const tb = e.target.closest('#grb-type-select');
    if (tb) {
      e.stopPropagation();
      window.__openCustDD?.(tb, BTN_TYPE_OPTS, (o) => {
        __btnTypeCurrent = o.value;
        tb.dataset.type = o.value;
        document.getElementById('grb-type-select-label').textContent = o.label;
        livePreview();
      });
    }
  });
  const BTN_TYPE_OPTS = [
    { label: 'H4',            value: 'tk-mb' },
    { label: 'Body',          value: 'tk-m' },
    { label: 'Caption Bold',  value: 'tk-sb' },
    { label: 'Caption',       value: 'tk-s' },
    { label: 'Caption Small', value: 'tk-xs' },
  ];
  const TOKEN_LABELS = { 'tk-super':'H1', 'tk-xl':'H2', 'tk-l':'H3', 'tk-mb':'H4', 'tk-m':'Body', 'tk-sb':'Caption Bold', 'tk-s':'Caption', 'tk-xs':'Caption Small' };
  function detectInherentTypeLabel(el) {
    if (!el) return 'Caption Bold';
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize) || 0;
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const rootCS = getComputedStyle(document.documentElement);
    let best = null, bestDist = Infinity;
    Object.keys(TOKEN_LABELS).forEach(cls => {
      const tok = cls.replace('tk-', '');
      const tSize = parseFloat(rootCS.getPropertyValue(`--type-${tok}-size`)) || 0;
      const tWeight = parseInt(rootCS.getPropertyValue(`--type-${tok}-weight`), 10) || 400;
      if (!tSize) return;
      const dist = Math.abs(tSize - size) * 10 + Math.abs(tWeight - weight) * 0.1;
      if (dist < bestDist) { bestDist = dist; best = cls; }
    });
    return best ? TOKEN_LABELS[best] : `${Math.round(size)}px / ${weight}`;
  }
  let __btnTypeCurrent = '';
  // Stroke on/off
  document.getElementById('grb-stroke-toggle')?.addEventListener('click', (e) => {
    const next = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(next));
    document.getElementById('grb-row-stroke').hidden = !next;
    if (next && !getTokenValue('border')) setTokenPill('border', 'var(--border-strong)');
    livePreview();
  });
  // Stroke position cycle (Inside → Outside → Center → Inside)
  document.getElementById('grb-stroke-pos')?.addEventListener('click', () => {
    const lbl = document.getElementById('grb-stroke-pos-label');
    const next = { Inside: 'Outside', Outside: 'Center', Center: 'Inside' }[lbl.textContent] || 'Inside';
    lbl.textContent = next;
    livePreview();
  });
  document.getElementById('grb-stroke-w')?.addEventListener('input', livePreview);
  document.getElementById('grb-height-num')?.addEventListener('input', () => {
    if (document.getElementById('grb-pill-lock').getAttribute('aria-pressed') === 'true') {
      const h = parseInt(document.getElementById('grb-height-num').value, 10) || 32;
      document.getElementById('grb-radius-num').value = Math.round(h / 2);
    }
    livePreview();
  });
  document.getElementById('grb-radius-num')?.addEventListener('input', () => {
    document.getElementById('grb-pill-lock').setAttribute('aria-pressed', 'false');
    livePreview();
  });
  document.getElementById('grb-pill-lock')?.addEventListener('click', (e) => {
    const next = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(next));
    if (next) {
      const h = parseInt(document.getElementById('grb-height-num').value, 10) || 32;
      document.getElementById('grb-radius-num').value = Math.round(h / 2);
    }
    livePreview();
  });
  document.getElementById('grb-save')?.addEventListener('click', () => {
    if (!__btnEditing) return;
    livePreview();
    window.__praiaToast?.('Botão "' + __btnEditing + '" atualizado');
    closeButtonEditor();
  });
  document.getElementById('grb-cancel')?.addEventListener('click', () => {
    if (__btnSnapshot) {
      const all = readButtons();
      if (__btnSnapshot.override) all[__btnSnapshot.id] = __btnSnapshot.override;
      else delete all[__btnSnapshot.id];
      writeButtons(all);
      applyButtonOverrides();
    }
    closeButtonEditor();
  });
  document.getElementById('grb-close')?.addEventListener('click', closeButtonEditor);
  // Click outside the inspector / outside a tile → close the editor so the
  // panel doesn't stay "stuck" after the user moves on to something else.
  document.addEventListener('click', (e) => {
    if (!document.querySelector('.guide-right.button-mode')) return;
    if (e.target.closest('.gr-button-insp')) return;
    if (e.target.closest('.ds-btn-tile, .ds-btn-row')) return;
    // The color picker popover lives outside the inspector — keep it open.
    if (e.target.closest('.grb-color-pop, .tk-popover')) return;
    closeButtonEditor();
  }, true);

  // Broadcast client assets on first paint so the sidebar host renders.
  setTimeout(broadcastAllClient, 300);
  // Re-broadcast when new [data-ds-logo] elements get inserted (after autosave restore, etc.)
  const __clientMO = new MutationObserver((muts) => {
    let needed = false;
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.matches?.('[data-ds-logo]')) needed = true;
        else if (n.querySelector?.('[data-ds-logo]')) needed = true;
      });
      if (needed) break;
    }
    if (needed) requestAnimationFrame(broadcastAllClient);
  });
  __clientMO.observe(document.body, { childList: true, subtree: true });

  // Remember scroll positions so toggling DS doesn't jump the canvas back to top
  let __dsScrollBefore = 0;
  let __dsScrollInside = 0;
  function getScroller() { return document.querySelector('main') || document.scrollingElement || document.documentElement; }

  function exitCanvas() {
    const sc = getScroller();
    __dsScrollInside = sc.scrollTop;
    document.body.classList.remove('ds-mode');
    btn.classList.remove('active');
    const dsPage = content.querySelector(`.guide-page[data-page="${DS_PAGE_ID}"]`);
    if (dsPage) dsPage.classList.remove('active');
    // Restore previous page
    const restoreId = __dsPreviousPageId;
    const target = restoreId ? document.querySelector(`.guide-side-item[data-page="${restoreId}"]`) : document.querySelector('.guide-side-item[data-page]');
    if (target) {
      document.querySelectorAll('.guide-side-item').forEach(x => x.classList.toggle('active', x === target));
      const pageId = target.dataset.page;
      document.querySelectorAll('.guide-page').forEach(p => p.classList.toggle('active', p.dataset.page === pageId));
    }
    requestAnimationFrame(() => { getScroller().scrollTop = __dsScrollBefore; });
  }

  function openCanvas() {
    // Stash current page + scroll so toggling back/forth feels stable
    const sc = getScroller();
    __dsScrollBefore = sc.scrollTop;
    const currentActive = document.querySelector('.guide-side-item.active');
    if (currentActive) __dsPreviousPageId = currentActive.dataset.page;
    let page = content.querySelector(`.guide-page[data-page="${DS_PAGE_ID}"]`);
    // Regenerate if cached page is from an older template version
    if (page && page.dataset.dsVersion !== DS_VERSION) {
      page.remove();
      page = null;
    }
    if (!page) page = createCanvasPage();
    // Deactivate sidebar items + all other pages
    document.querySelectorAll('.guide-side-item').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.guide-page').forEach(p => p.classList.toggle('active', p === page));
    document.body.classList.add('ds-mode');
    btn.classList.add('active');
    ensureDsSide(page);
    if (currentDsSection && currentDsSection.startsWith('templates-')) currentDsSection = 'templates';
    showDsSection(page, currentDsSection || 'type');
    requestAnimationFrame(() => { getScroller().scrollTop = __dsScrollInside; });
  }

  // ----- DS left sidebar (one link per section) -----
  const DS_SECTION_LIST = [
    ['type',             'Tipografia'],
    ['color',            'Cor'],
    ['icons',            'Ícones'],
    ['buttons',          'Botões'],
    ['client',           'Cliente'],
    // 'Templates' removido 2026-05-28 — acesso apenas via botão "Add template".
  ];
  let currentDsSection = null;
  function ensureDsSide(page) {
    let side = document.querySelector('.ds-side');
    if (!side) {
      side = document.createElement('aside');
      side.className = 'ds-side';
      side.innerHTML = `<div class="ds-side-tabs">Design System</div>
        <div class="ds-side-list">${DS_SECTION_LIST.map(([k, label, sub], i) => {
          const isParent = !sub && i > 0 && DS_SECTION_LIST[i + 1] && DS_SECTION_LIST[i + 1][2];
          return `<button type="button" class="ds-side-item${sub ? ' is-sub' : ''}${isParent ? ' is-parent' : ''}" data-ds-link="${k}"><span class="gsi-label">${label}</span></button>`;
        }).join('')}</div>`;
      document.body.appendChild(side);
      side.addEventListener('click', (e) => {
        const b = e.target.closest('.ds-side-item');
        if (!b) return;
        showDsSection(page, b.dataset.dsLink);
      });
    }
  }
  function showDsSection(page, key) {
    document.body.classList.remove('ds-tpl-edit');
    currentDsSection = key;
    page.querySelectorAll(':scope > section[data-ds-section]').forEach(s => {
      s.style.display = (s.dataset.dsSection === key) ? '' : 'none';
    });
    document.querySelectorAll('.ds-side .ds-side-item').forEach(b => {
      const isSub = b.classList.contains('is-sub');
      const isParent = b.classList.contains('is-parent');
      let active = false;
      if (isParent) active = key.startsWith('templates-');
      else if (isSub) active = b.dataset.dsLink === key;
      else active = b.dataset.dsLink === key;
      b.classList.toggle('active', active);
    });
    getScroller().scrollTop = 0;
    autoSelectFirstInSection(page, key);
  }

  // Auto-select the first item of the active section so the right inspector
  // is always visible with a meaningful selection (e.g. entering Tipografia
  // selects Super by default).
  function autoSelectFirstInSection(page, key) {
    const SELECTORS = {
      'type':             () => document.querySelector('.type-item[data-token="super"]') || document.querySelector('.type-item'),
      'color':            () => page.querySelector('section[data-ds-section="color"] .ds-color-swatch'),
      'icons':            () => page.querySelector('section[data-ds-section="icons"] .ds-icon-tile'),
      'buttons':          () => page.querySelector('section[data-ds-section="buttons"] .ds-btn-tile'),
      'client':           () => page.querySelector('section[data-ds-section="client"] .ds-client-tile'),
      'templates':        () => {
        // Cover/some text templates are hidden via CSS but still in the DOM —
        // skip them and select the first cell that is actually visible (e.g.
        // Heading is the first VISIBLE template in the current grid).
        const cells = page.querySelectorAll('section[data-ds-section="templates"] .ds-tpl-cell');
        return [...cells].find(c => c.offsetParent !== null) || cells[0] || null;
      },
    };
    const resolve = SELECTORS[key];
    if (!resolve) return;
    // Clear any previous inspector mode so panels from other DS sections
    // (e.g. color editor) don't leak through alongside the new one.
    const right = document.querySelector('.guide-right');
    if (right) {
      ['editing','editing-color','icon-mode','button-mode','client-mode','themepal-mode','component-mode','history-mode','text-mode','color-mode','layout-mode','spacing-mode','video-mode']
        .forEach(c => right.classList.remove(c));
    }
    // Defer so the section becomes visible (and any pending DOM population
    // — e.g. templates grids — has a chance to settle) before we click.
    // populateTemplatesGrid is async (awaits between cats); retry up to ~1s
    // so the very first cell is clicked once the grid has settled.
    let attempts = 0;
    (function tryClick() {
      const el = resolve();
      if (el) { el.click(); return; }
      if (++attempts < 30) setTimeout(tryClick, 50);
    })();
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (document.body.classList.contains('ds-mode')) { exitCanvas(); return; }
    // If user is on Home (or any non-guide route), switch to guide first so
    // the guide world is visible — DS canvas lives inside it.
    if (!document.body.classList.contains('route-guide')) {
      window.location.hash = 'guide';
      // Wait for route to apply before opening DS
      setTimeout(openCanvas, 50);
    } else {
      openCanvas();
    }
  });

  // Delegated handler — Voltar button is re-created on each page render
  document.addEventListener('click', (e) => {
    if (e.target.closest('#ds-back-btn')) { e.preventDefault(); e.stopPropagation(); exitCanvas(); }
  });

  // Escape exits DS mode (mirrors preview behavior)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('ds-mode')) exitCanvas();
  });

  // Route change (e.g. user clicks "Voltar para Home" or any nav item) — clear
  // DS state so the next time they come back into Guide and click DS, the
  // toggle starts from a clean off-state instead of being stuck "on".
  window.addEventListener('hashchange', () => {
    if (document.body.classList.contains('ds-mode')) exitCanvas();
  });
})();
