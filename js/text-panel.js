// text-panel.js — sync do painel de texto (estilo/cor token-aware) (Fase 3, 🟠 expõe).
// Expõe window.__praiaApplyTextDefault/__praiaSyncTextPanel (consumidos só em
// handlers via ?.()). Carregado ANTES do state.js por conservadorismo (exposer).
/* Text panel sync — token-aware style + color pickers */
(() => {
  const trig = document.getElementById('grt-style-trig');
  const nameEl = document.getElementById('grt-style-name');
  const editBtn = document.getElementById('grt-edit-style');
  if (!trig || !nameEl) return;

  const TOKENS = [
    { key: 'h0', label: 'H0', cls: 'tk-h0' },
    { key: 'super', label: 'H1', cls: 'tk-super' },
    { key: 'xl', label: 'H2', cls: 'tk-xl' },
    { key: 'l', label: 'H3', cls: 'tk-l' },
    { key: 'mb', label: 'H4', cls: 'tk-mb' },
    { key: 'm', label: 'Body', cls: 'tk-m' },
    { key: 'sb', label: 'Caption Bold', cls: 'tk-sb' },
    { key: 's', label: 'Caption', cls: 'tk-s' },
    { key: 'xs', label: 'Body Small', cls: 'tk-xs' },
  ];
  const COLORS = [
    { cls: 'cl-text', label: 'Text', varName: '--text' },
    { cls: 'cl-text-2', label: 'Text muted', varName: '--text-2' },
    { cls: 'cl-text-3', label: 'Text subtle', varName: '--text-3' },
    { cls: 'cl-navy', label: 'BluStar Navy', varName: '--bs-navy' },
    { cls: 'cl-cyan', label: 'BluStar Cyan', varName: '--bs-cyan' },
    { cls: 'cl-blue', label: 'Royal Blue', varName: '--bs-blue' },
    { cls: 'cl-white', label: 'White', varName: '--bs-white' },
  ];
  // Para botões, a "cor" editada é o FUNDO (classes .clbg-*), não o texto.
  const BTN_COLORS = [
    { cls: 'clbg-cyan', label: 'BluStar Cyan', varName: '--bs-cyan' },
    { cls: 'clbg-navy', label: 'BluStar Navy', varName: '--bs-navy' },
    { cls: 'clbg-blue', label: 'Royal Blue', varName: '--bs-blue' },
    { cls: 'clbg-white', label: 'White', varName: '--bs-white' },
  ];
  const isBtn = el => !!el && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.classList.contains('bs-cta') || el.classList.contains('am-add'));
  const colorSetFor = el => (isBtn(el) ? BTN_COLORS : COLORS);

  // Floating popover (re-used for both style and color)
  const pop = document.createElement('div');
  pop.className = 'tk-popover';
  document.body.appendChild(pop);
  let popMode = null; // 'style' | 'color'

  function getSelected() {
    return document.querySelector('.canvas-selected');
  }

  function detectStyle(el) {
    for (const t of TOKENS) if (el.classList.contains(t.cls)) return t;
    // Fallback: match by computed font-size.
    const sz = parseFloat(getComputedStyle(el).fontSize);
    let best = TOKENS[4],
      bestDelta = Infinity;
    for (const t of TOKENS) {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--type-${t.key}-size`));
      const d = Math.abs(v - sz);
      if (d < bestDelta) {
        bestDelta = d;
        best = t;
      }
    }
    return best;
  }

  function detectColor(el) {
    const set = colorSetFor(el);
    for (const c of set) if (el.classList.contains(c.cls)) return c;
    // Sem classe explícita → casa a cor COMPUTADA com o token mais próximo, pra
    // nunca ficar genérico. Em botão usa o FUNDO; no resto, o texto.
    const cs = getComputedStyle(el);
    const targetStr = isBtn(el) ? cs.backgroundColor : cs.color;
    const parse = s => (String(s).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const toRGB = v => {
      probe.style.color = '';
      probe.style.color = v;
      return getComputedStyle(probe).color;
    };
    const target = parse(targetStr);
    let best = set[0],
      bd = Infinity;
    for (const c of set) {
      const cv = parse(toRGB(`var(${c.varName})`));
      if (cv.length < 3) continue;
      const d = Math.hypot(target[0] - cv[0], target[1] - cv[1], target[2] - cv[2]);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    probe.remove();
    return best;
  }

  // ---- Padrão global de texto (estilo + cor) — a última escolha vira default
  // e é aplicada a TODO texto de qualquer template novo inserido. Persiste. ----
  const TEXT_DEFAULT_KEY = 'praia.text.default';
  const textDefault = (() => {
    try {
      return Object.assign({ style: '', color: '' }, JSON.parse(localStorage.getItem(TEXT_DEFAULT_KEY) || '{}'));
    } catch {
      return { style: '', color: '' };
    }
  })();
  function saveTextDefault() {
    try {
      localStorage.setItem(TEXT_DEFAULT_KEY, JSON.stringify(textDefault));
    } catch {}
  }
  // Aplica o padrão global (último estilo/cor escolhidos) APENAS a blocos de
  // texto simples — um único elemento de texto. Templates com hierarquia
  // tipográfica desenhada (título + corpo, ex.: 01–08) têm MAIS de um texto e
  // são preservados integralmente, para que a instância fique idêntica ao
  // thumb/master (sem achatar tudo no estilo default).
  function applyTextDefault(root) {
    if (!root || (!textDefault.style && !textDefault.color)) return;
    const sel = TOKENS.map(t => '.' + t.cls).join(',');
    const els = [...root.querySelectorAll(sel)];
    if (root.matches && root.matches(sel)) els.push(root);
    const textEls = els.filter(el => !isBtn(el));
    if (textEls.length !== 1) return; // hierarquia (ou nenhum texto) → preserva master
    const el = textEls[0];
    if (textDefault.style) {
      TOKENS.forEach(t => el.classList.remove(t.cls));
      el.classList.add('tk-' + textDefault.style);
    }
    if (textDefault.color) {
      const match = colorSetFor(el).find(c => c.varName === textDefault.color);
      [...COLORS, ...BTN_COLORS].forEach(c => el.classList.remove(c.cls));
      if (match) el.classList.add(match.cls);
    }
  }
  window.__praiaApplyTextDefault = applyTextDefault;

  // Mudar Style/Cor de um bloco propaga para TODAS as instâncias do mesmo
  // template (data-tpl-instance). Acha o elemento correspondente pelo índice
  // dentro do mirror — a estrutura é idêntica entre gêmeos, então o mesmo
  // índice aponta o mesmo elemento. Aplica `mutate` a cada gêmeo. Bloco solto
  // (sem data-tpl-instance) não propaga: muda só ele mesmo.
  const mirrorOf = wrap => wrap.querySelector('.praia-mirror') || wrap;
  // Lista "estável" de elementos do template dentro de um wrapper: ignora os
  // nós que o contenteditable cria por dentro de um bloco ao digitar (<div>,
  // <br>), que de outro modo desalinhariam o índice entre instâncias gêmeas e
  // fariam o estilo cair no elemento errado.
  const stableListFrom = root => [...root.querySelectorAll('*')].filter(n => !(n.parentElement && n.parentElement.closest('[contenteditable="true"]')));
  const stableEls = wrap => stableListFrom(mirrorOf(wrap));
  function eachTwinCounterpart(srcEl, mutate) {
    const wrap = srcEl.closest('[data-tpl-instance]');
    if (!wrap) return;
    const name = wrap.dataset.tplInstance;
    const idx = stableEls(wrap).indexOf(srcEl);
    if (idx < 0) return;
    document.querySelectorAll(`[data-tpl-instance="${CSS.escape(name)}"]`).forEach(tw => {
      if (tw === wrap || tw.closest('section[data-ds-section]')) return;
      const target = stableEls(tw)[idx];
      if (target) mutate(target);
    });
    window.__praiaApplyMirrorScale?.();
  }
  // Grava a mesma mudança no MASTER do template (override persistido) para que
  // o thumb e QUALQUER inserção futura do mesmo template reflitam a edição feita
  // pelo inspector — senão, deletar a instância e readicionar volta ao padrão.
  // O override começa no `.am-tpl-thumb`, e a instância em `.praia-mirror >
  // .am-tpl-thumb`: o índice da lista estável casa nos dois (mesma estrutura).
  function updateMasterOverride(srcEl, mutate) {
    const wrap = srcEl.closest('[data-tpl-instance]');
    if (!wrap) return;
    const name = wrap.dataset.tplInstance;
    const ov = window.__praiaTplOverrides && window.__praiaTplOverrides[name];
    if (!ov) return;
    const idx = stableEls(wrap).indexOf(srcEl);
    if (idx < 0) return;
    const probe = document.createElement('div');
    probe.innerHTML = ov;
    const target = stableListFrom(probe)[idx];
    if (!target) return;
    mutate(target);
    window.__praiaTplOverrides[name] = (probe.querySelector('.am-tpl-thumb') || probe.firstElementChild).outerHTML;
    window.__praiaTplOverrides['edited:' + name] = '1'; // protege do version-gate
    try {
      localStorage.setItem('praia.tpl.overrides', JSON.stringify(window.__praiaTplOverrides));
    } catch {}
    // Re-mede altura (trocar de token muda o tamanho) e atualiza células/thumb.
    window.__praiaRemeasureTextTemplates?.();
  }

  function setStyleClass(el, tok) {
    TOKENS.forEach(t => el.classList.remove(t.cls));
    if (tok) el.classList.add(tok.cls);
  }
  function setColorClass(el, color) {
    [...COLORS, ...BTN_COLORS].forEach(c => el.classList.remove(c.cls));
    if (color) el.classList.add(color.cls);
  }
  function applyStyle(el, tok) {
    setStyleClass(el, tok);
    eachTwinCounterpart(el, t => setStyleClass(t, tok));
    updateMasterOverride(el, t => setStyleClass(t, tok));
    textDefault.style = tok ? tok.key : '';
    saveTextDefault(); // vira o padrão global
    syncPanel(el);
    window.__praiaAutosave?.();
  }
  function applyColor(el, color) {
    setColorClass(el, color);
    eachTwinCounterpart(el, t => setColorClass(t, color));
    updateMasterOverride(el, t => setColorClass(t, color));
    textDefault.color = color ? color.varName : '';
    saveTextDefault(); // padrão global
    syncPanel(el);
    window.__praiaAutosave?.();
  }

  function syncPanel(el) {
    if (!el) return;
    const s = detectStyle(el);
    // Sempre mostra o estilo real (token detectado), nunca "Default" genérico.
    nameEl.textContent = s.label;
    trig.dataset.token = s.key;
    // Spacing inputs
    const mt = document.getElementById('grt-mt');
    const mb = document.getElementById('grt-mb');
    if (mt) mt.value = parseInt(el.style.marginTop || 0, 10) || 0;
    if (mb) mb.value = parseInt(el.style.marginBottom || 0, 10) || 0;
    const c = detectColor(el);
    const dot = document.getElementById('grt-color-dot');
    if (dot) {
      dot.style.background = c ? `var(${c.varName})` : 'transparent';
      dot.style.borderStyle = c ? 'solid' : 'dashed';
      dot.dataset.hasColor = c ? 'true' : 'false';
      dot.dataset.color = c ? c.cls : '';
    }
    // Mostra sempre o nome da cor real no label, nunca o genérico "Text color".
    const colorLabel = document.querySelector('#grt-color-row .label');
    if (colorLabel) colorLabel.textContent = c ? c.label : 'Text color';
    // Link — só para botões/links (a ação precisa de um destino).
    const linkSec = document.getElementById('grt-link-section');
    const linkInp = document.getElementById('grt-link-input');
    if (linkSec && linkInp) {
      const isLinkable = el.tagName === 'BUTTON' || el.tagName === 'A' || el.classList.contains('bs-cta') || el.classList.contains('am-add');
      linkSec.hidden = !isLinkable;
      if (isLinkable) linkInp.value = el.dataset.link || el.getAttribute('href') || '';
    }
  }
  window.__praiaSyncTextPanel = syncPanel;
  // Persist the link target on the selected element (data-link). Live navigation
  // happens only in preview/published mode — see the delegated handler below.
  (() => {
    const linkInp = document.getElementById('grt-link-input');
    if (!linkInp) return;
    const apply = () => {
      const el = getSelected();
      if (!el) return;
      const v = linkInp.value.trim();
      if (v) el.dataset.link = v;
      else delete el.dataset.link;
      window.__praiaAutosave?.();
    };
    linkInp.addEventListener('input', apply);
    linkInp.addEventListener('change', apply);
    // Keep typing in the field from bubbling into canvas selection / shortcuts.
    linkInp.addEventListener('keydown', e => e.stopPropagation());
    linkInp.addEventListener('click', e => e.stopPropagation());
  })();
  // In preview/published mode, a button/link with data-link navigates.
  document.addEventListener('click', e => {
    if (!document.body.classList.contains('preview-mode')) return;
    const t = e.target.closest('[data-link]');
    if (!t) return;
    const href = t.dataset.link;
    if (!href) return;
    e.preventDefault();
    const external = /^https?:\/\//i.test(href);
    window.open(href, external ? '_blank' : '_self', external ? 'noopener' : '');
  });

  function openPop(anchor, mode) {
    popMode = mode;
    const el = getSelected();
    pop.innerHTML = '';
    if (mode === 'style') {
      // Sem opção "Default": o texto sempre tem um estilo real do DS.
      const current = el ? detectStyle(el) : null;
      TOKENS.forEach(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.token = t.key;
        b.innerHTML = `<span class="tk-prev" style="font-size:${Math.min(20, Math.max(11, Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--type-${t.key}-size`)) / 3)))}px">Aa</span><span>${t.label}</span>`;
        if (current && current.key === t.key) b.classList.add('active');
        b.addEventListener('click', () => {
          if (el) applyStyle(el, t);
          pop.classList.remove('open');
        });
        pop.appendChild(b);
      });
    } else {
      // Sem opção "Default": a cor sempre casa um token real do DS.
      const current = el ? detectColor(el) : null;
      colorSetFor(el).forEach(c => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = `<span class="cl-swatch" style="background:var(${c.varName})"></span><span>${c.label}</span>`;
        if (current && current.cls === c.cls) b.classList.add('active');
        b.addEventListener('click', () => {
          if (el) applyColor(el, c);
          pop.classList.remove('open');
        });
        pop.appendChild(b);
      });
    }
    const r = anchor.getBoundingClientRect();
    pop.classList.add('open');
    const pw = pop.offsetWidth,
      ph = pop.offsetHeight;
    pop.style.top = Math.min(window.innerHeight - ph - 8, r.bottom + 6) + 'px';
    pop.style.left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.right - pw)) + 'px';
  }

  trig.addEventListener('click', e => {
    e.stopPropagation();
    openPop(trig, 'style');
  });

  // Wire color row (already in markup) — entire row triggers the color popover.
  const colorRow = document.getElementById('grt-color-row');
  const colorDot = document.getElementById('grt-color-dot');
  if (colorRow && colorDot) {
    colorRow.addEventListener('click', e => {
      e.stopPropagation();
      openPop(colorDot, 'color');
    });
  }

  // Spacing inputs — margin top / bottom on the selected element.
  const mtInput = document.getElementById('grt-mt');
  const mbInput = document.getElementById('grt-mb');
  function applySpacing() {
    const el = getSelected();
    if (!el) return;
    if (mtInput) el.style.marginTop = (parseInt(mtInput.value, 10) || 0) + 'px';
    if (mbInput) el.style.marginBottom = (parseInt(mbInput.value, 10) || 0) + 'px';
    window.__praiaAutosave?.();
  }
  mtInput?.addEventListener('input', applySpacing);
  mbInput?.addEventListener('input', applySpacing);

  // Edit button: jump to the Type editor of the current token.
  if (editBtn) {
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      const tok = trig.dataset.token;
      if (!tok) return;
      const right = document.querySelector('.guide-right');
      // Suspend text-mode so the editor pane is allowed to show.
      right?.classList.remove('text-mode', 'layout-mode');
      const item = document.querySelector(`.type-item[data-token="${tok}"]`);
      item?.click();
    });
  }

  // Close popover on outside click
  document.addEventListener('click', e => {
    if (!pop.contains(e.target) && e.target !== trig && !e.target.closest('.grl-fill-row')) {
      pop.classList.remove('open');
    }
  });
})();
