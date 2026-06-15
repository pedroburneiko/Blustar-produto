# ARCHITECTURE — BluStar Workspace (PRAIA Brand System)

> Mapa do monólito **antes** do refactor. Documento de leitura: nenhuma linha
> de código foi movida para produzi-lo. Serve de referência para as fases de
> extração de CSS (Fase 2) e split em módulos ES (Fase 3).
>
> Estado atual: app **vanilla** HTML/CSS/JS, tudo em `index.html`
> (**16.070 linhas**, ~830 KB). Stack continua vanilla — sem framework,
> sem bundler pesado. Tokens vivem **só** em `ds-tokens.css`.

---

## 1. Layout físico do `index.html`

| Faixa de linhas | Conteúdo | Vira (alvo) |
|---|---|---|
| 1–23 | `<head>`: meta, **reset script** (linha 7), fonts Google (Material Symbols), `<link href="ds-tokens.css">` | fica no shell |
| **24–4608** | **Bloco `<style>` único** (~4.584 linhas de CSS) | `styles/*.css` (Fase 2) |
| 4609–5536 | Markup HTML do body (topnav, worlds, painéis) | fica no shell |
| **5537–15879** | **`<script>` principal** (~10.343 linhas — o coração) | `js/*.js` (Fase 3) |
| 15880–15888 | Markup HTML residual | fica no shell |
| **15889–16068** | **`<script>` de auth** (Google Identity / sessão) | `js/auth.js` (Fase 3) |

Referências externas: `ds-tokens.css` (tokens — **fonte única**), Material
Symbols (Google Fonts), fontes locais em `fonts/`, mídia em `assets/` e
**Cloudinary** (`res.cloudinary.com/dq0tnoaye/...`) — não tocar nesta fase.

---

## 2. Router — worlds (hash-based)

Definido em `index.html:5593-5630`. Troca de "world" via `location.hash`.

- `navigate(route)` → seta `window.location.hash`.
- `applyRoute()` → lê o hash (default `#home`), acha `.world[data-world=...]`,
  alterna `.active`, aplica `body.route-<world>` e `body.sidebar-collapsed`
  (quando o world declara `data-collapse-sidebar="true"`).
- Listener: `window.addEventListener('hashchange', applyRoute)` (5630).
- Nav: botões `.nav-item[data-route]` (topnav). Se estiver em `ds-mode`,
  sai do DS antes de navegar.

### Worlds existentes (`section.world[data-world]`)
| world | linha (HTML) | nav | observações |
|---|---|---|---|
| `home` | 4743 | `data-route="home"` (4711) | hero + tiles |
| `guide` | 4774 | `data-route="guide"` (4715) | `data-collapse-sidebar="true"`; world principal de edição |

### Sub-roteadores (além do router de worlds)
- **DS mode**: `body.ds-mode` — canvas do Design System sobre o world `guide`.
  `showDsSection(page, key)` em `index.html:15100`, com seu próprio
  `hashchange` (15185). Seções DS (`data-ds-section`): `templates`, `color`,
  `icons`, `buttons`, `client`.
- **Deep-link**: `applyDeepLink()` + `hashchange` (15812) — restaura estado/seção
  a partir do hash no boot.

---

## 3. Estado persistido (localStorage)

Acesso ao localStorage está **espalhado** (~58 chamadas). Centralizar tudo em
`js/state.js` é a Fase 4. Chaves e onde a constante é definida:

| Constante | Chave (string) | Definida em | Conteúdo |
|---|---|---|---|
| `KEY` | `praia.brand.state.v5` | 15223 | **estado principal** (snapshot do doc); autosave |
| `VKEY` | `praia.brand.state.v5:versions` | 15358 | histórico de versões (máx `V_MAX=80`, l.15359) |
| `LIVE_KEY` | `praia.brand.state.v5:live` | 15472 | snapshot "ao vivo" do modo preview/play |
| `SESSION_KEY` | `blustar.auth.user` | 15893 | sessão do usuário (Google auth) |
| `CLIENT_KEY` | `praia.brand.client.v1` | 13906 | dados do cliente (world Client) |
| `ICONS_KEY` | `praia.brand.icons.v6` | 13788 | biblioteca de ícones |
| `BUTTONS_KEY` | `praia.brand.buttons.v1` | 14583 | variantes/estado de botões |
| `TEXT_DEFAULT_KEY` | `praia.text.default` | 12437 | default de estilo/cor de texto |
| `GRID_KEY` | `ds.tpl.gridHidden` | 9522 | flag de grade visível/oculta |
| (literal) | `praia.tpl.overrides` | — | overrides de template (15 refs) |
| (literal) | `grc-tpl-overrides` | — | overrides legados (5 refs) |
| (literal) | `praia.tpl.textgen.ver` | — | versão de geração de texto |
| (literal) | `praia.tpl.migrated.1280` | — | flag de migração de largura |
| (literal) | `praia.tpl.05dl.v3` | — | template-specific |

> **Reset**: `index.html:7` — `if(location.search.indexOf('reset')!==-1){localStorage.clear();}`
> Atalho `?reset=1` deve ser **preservado** na Fase 4.

### 3.1 IndexedDB — blobs de vídeo (descoberto na verificação pré-Fase 4)
Além do localStorage, há **uma segunda camada de persistência** que o mapa
inicial não cobria:

| DB | Store | Versão | Onde | Conteúdo |
|---|---|---|---|---|
| `praia-videos` | `blobs` | 1 | `index.html:~6877` (IIFE com `idbPut`/`idbGet`/`idbDel`) | Blobs de vídeo enviados, keyed por id |

> ⚠️ **`?reset=1` NÃO limpa esse IndexedDB** (só faz `localStorage.clear()`).
> A Fase 4 deve decidir explicitamente se o reset passa a limpar o
> `praia-videos` também, ou se mantém o comportamento atual (não limpa).
> Strings parecidas mas que **não são storage keys** (confirmado por grep):
> `blustar_unsigned`/`blustar_ds`/`blustar_ds_photo` (upload preset + tags do
> Cloudinary), `praia-ds-state`/`praia-button-overrides` (IDs de `<style>`),
> `praia-frame`/`praia-component` (classes CSS).

---

## 4. Grandes blocos funcionais do JS principal (5537–15879)

477 declarações de função no total. Agrupamento por área (linhas aproximadas):

| Bloco | ~linhas | Funções-âncora |
|---|---|---|
| **Paste/Drop sanitizer** | 5538–5590 | `paste` (5548) e `drop` (5567) handlers globais; herdam tokens DS, limpam HTML colado |
| **Router (worlds)** | 5591–5660 | `navigate`, `applyRoute`, `alignTopnavCenter` |
| **Catálogo de templates** | 6053–7765 | `renderGrid`, `buildTemplate` (6464), `insertTemplate` (6413), `insertModule`/`buildModule` (6617/7765) |
| **Mirror / scale do canvas** | 6182–6413 | `wrapMasterInMirror`, `applyMirrorScale`, `ensureMirrorObserver` |
| **Slots / contents** | 8407–8721 | `makeSlot`, `injectSlots`, `renderContents`, `resolveByName` |
| **Componentes (edição inline)** | 8721–8960 | `selectComponent`, `startEditingComponent`, `bindCompEdits`, `openCustDD` |
| **Overrides de template (CSS dinâmico)** | 9037–9116 | `ensureTplStyleEl`, `renderTplOverridesCSS`, `confirmTplDelete` |
| **Edição de template / live propagation** | 9116–9442 | `selectTemplate`, `enterTemplateEdit`, `startLivePropagation`, `applyEditScale` |
| **Grade / marquee / context menu** | 9523–9760 | `applyGridHidden`, `restoreGridState`, `paintMarquee`, `ensureCtxMenu`, `runCtxAction` |
| **Type inspector / texto** | 12184–12450 | `show` (12184), `applyTextDefault`, `TEXT_DEFAULT_KEY` (12437) |
| **Ícones (lib)** | 13788–13900 | `ICONS_KEY`, render/persist da biblioteca |
| **Cliente** | 13906–13930 | `readClient`/`writeClient`, `CLIENT_KEY` |
| **Botões (variantes)** | 14583–14710 | `BUTTONS_KEY`, `window.__praiaApplyButtonOverrides` |
| **DS mode / seções DS** | 15100–15220 | `showDsSection`, hashchange DS |
| **Persistência / autosave / histórico** | 15223–15760 | `KEY`/`VKEY`/`LIVE_KEY`, `snapshot()`, autosave (15334), versões, `showHistoryBanner`, preview/play stash |
| **Deep-link** | 15812 | `applyDeepLink` |
| **Auth (script separado)** | 15889–16068 | Google Identity, `getSession`/`setSession`/`clearSession`, `decodeJwt`, `SESSION_KEY` |

> Escopo misto: parte do código é top-level (`function navigate` na col. 0),
> parte vive dentro de IIFEs/closures (funções indentadas). A Fase 3 precisa
> respeitar esses escopos ao extrair — o que hoje compartilha closure terá de
> compartilhar módulo ou ser exposto explicitamente.

---

## 5. Superfície global (`window.*`)

**61 atribuições `window.*`** — a ponte entre os blocos do monólito. Durante a
Fase 3 essas globais ficam expostas explicitamente (documentadas) até a
migração terminar. Famílias:

- **`window.__praia*`** (maioria) — API interna do editor: `__praiaAutosave`,
  `__praiaUndo`/`__praiaRedo`, `__praiaHistory`, `__praiaBuildTemplate`,
  `__praiaCld*` (Cloudinary: `__praiaCldUploadImage`, `__praiaCldImageSrc`…),
  `__praiaToast`, `__praiaRenderContents`, `__praiaIcons`, `__praiaClient`,
  `__praiaTplOverrides`, `__praiaMakeDraggable`, etc.
- **`window.__grc*`** — overrides de template (legado `grc-`):
  `__grcGetTplOverrides`, `__grcSetTplOverrides`, `__grcSyncCustControls`,
  `__grcClearTplSelection`.
- **`window.__blustar*`** — auth: `__blustarUser`, `__blustarLogout`.
- **`window.__BUTTON_VARIANTS`**, `window.__openCustDD`, `window.__syncImageName`,
  `window.__restoreGridState`.

> Lista completa de globais a documentar conforme cada módulo for extraído
> (Fase 3). Cada global mantida deve ter justificativa registrada.

---

## 6. Assets e integrações externas (não tocar até fase própria)

- **Cloudinary** — cloud `dq0tnoaye`; thumbs/vídeos via URLs
  `res.cloudinary.com/.../upload/...`. Inputs de URL em `grv-url` (vídeo) e
  `grp-url` (foto). Upload via `window.__praiaCldUploadImage`.
- **Assets locais** — `assets/` (logos SVG, `Moto.png`, vídeos `.mov`/`.mp4`
  ~35 MB em `assets/Videos/`), `fonts/` (Almarena/Versos).
- **Auth** — Google Identity Services; `GOOGLE_CLIENT_ID` hardcoded no script
  de auth (l.15892). Bypass em localhost (`isLocalhost`).
- **Server** — `server/server.js` (Express; não servido pelo dev server do
  front). `server/.env` é **ignorado** pelo git (segredos).

---

## 7. Ordem do refactor (resumo das fases)

1. ✅ **Fase 0** — baseline em `main`; histórico legado em `legacy-monorepo`.
2. **Fase 1** — este mapa.
3. **Fase 2** — extrair `<style>` (24–4608) para `styles/*.css` via `<link>`.
4. **Fase 3** — quebrar `<script>` (5537–15879 + 15889–16068) em `js/*.js`
   (`router.js`, `state.js`, `templates.js`, `type-inspector.js`,
   `paste-sanitizer.js`, `auth.js`, …) com `type="module"`.
5. **Fase 4** — centralizar localStorage em `state.js` + `STATE_VERSION` +
   migração; preservar `?reset=1`.
6. **Fase 5** — error boundary no boot (`window.onerror` / `unhandledrejection`).
7. **Fase 6** — Biome (lint+format) + pré-commit.
8. **Fase 7** — README + CLAUDE.md atualizados.
