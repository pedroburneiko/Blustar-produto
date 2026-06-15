# PRAIA Brand System — BluStar workspace

App **vanilla** (HTML + CSS + JS nativo, sem framework/bundler) do brand &
design system da BluStar. Roda direto no navegador a partir de `index.html`,
servido por qualquer servidor estático.

> **Stack é e continua vanilla.** Não há React/Vue/bundler. O JS usa scripts
> clássicos (`<script src>`) com uma ponte explícita via `window.__praia*`
> entre módulos. Veja [ARCHITECTURE.md](ARCHITECTURE.md) para o mapa detalhado.

## Como rodar localmente

Precisa só de um servidor estático (o app usa `fetch`/módulos, então abrir o
`file://` direto não funciona). Com Node instalado:

```bash
npm install          # instala dev tooling (Biome) + registra o pré-commit
npm run dev          # sobe http://localhost:5173  (python3 -m http.server)
```

Sem Node, qualquer estático serve: `python3 -m http.server 5173`.

Abra `http://localhost:5173/index.html`. Há um **gate de login Google**; em
`localhost` use o atalho **"Entrar em modo DEV"**. Para limpar o estado salvo e
bootar do zero, abra com **`?reset=1`**.

## Estrutura de pastas

```
index.html              # markup + boot glue inline (~50 linhas) + <link>/<script>
ds-tokens.css           # FONTE ÚNICA de design tokens — nunca redeclarar fora daqui
styles/                 # CSS extraído por área (linkado na ordem da cascata)
  base · topnav · app-shell · main · responsive
  worlds/   home · guide
  editor/   modes · inspector · layout-inspector · components · templates ·
            canvas-items · color-add-module · mirror-canvas · contents-pages ·
            color-modules · icons-buttons · client-history
js/                     # módulos ES (scripts clássicos; ponte via window.__praia*)
assets/ · fonts/        # mídia e fontes (Cloudinary + locais)
server/                 # backend opcional (não necessário p/ o app estático)
biome.json              # lint + format (só js/)
ARCHITECTURE.md         # mapa de worlds, estado, blocos e globais
```

### Ordem de carga dos scripts (`index.html`)

```
error-boundary → paste-sanitizer → router → [boot glue inline]
→ hubs (add-module, component-selection, ds-canvas) → contents-tree
→ bridge (guide-sidebar, text-panel, media-cloudinary)
→ state → consumidores (color-matrix, layout-inspector, type-inspector, …)
→ auth
```

A ordem importa: `error-boundary` vem **primeiro** (rede contra tela branca);
os módulos que o `state.js` consome no restore (guide-sidebar) vêm **antes**
dele. Cada `<script>` em `index.html` traz um comentário explicando seu lugar.

## Conceito de "worlds"

A UI é organizada em **worlds** — seções de tela trocadas por um router
hash-based (`js/router.js`). Cada world é uma `<section class="world"
data-world="...">`; `navigate('home')` / `#guide` ativam o world correspondente
(`.world.active`) e o `body` ganha `route-<world>`. Um world pode declarar
`data-collapse-sidebar="true"` (ex.: Guide).

## Modelo de estado

Toda persistência vive em **`js/state.js`** (localStorage), centralizando as
chaves de estado (`window.__praiaStateKeys`):

- `praia.brand.state.v5` — snapshot do canvas (autosave, debounced).
- `…:versions` — histórico de versões (Figma-style, máx 80).
- `…:live` — snapshot "ao vivo" do modo preview/play.

O snapshot é carimbado com **`STATE_VERSION`** (`__v`). No boot, `migrateState()`
adota estados legados (sem `__v`) sem perda e **descarta com segurança** estados
de versão futura/corrompidos (em vez de quebrar o boot). `?reset=1` limpa o
localStorage e recomeça. Há também um **IndexedDB** (`praia-videos`) para blobs
de vídeo, que o reset **não** limpa (ver ARCHITECTURE.md §3.1).

## Qualidade

```bash
npm run check        # biome lint + format (só reporta)
npm run format       # aplica formatação
npm run lint         # só lint
```

O **pré-commit** (simple-git-hooks) roda `biome check` nos arquivos `js/`
staged. O Biome é configurado como **gate de erros reais**, não de estilo: nags
de idioma (forEach, template strings, etc.) estão desativados de propósito,
porque o código vanilla os usa de forma consistente. CSS e `index.html` ficam
fora do Biome (o CSS usa estilo compacto intencional).
