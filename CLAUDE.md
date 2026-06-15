# CLAUDE.md — guia de trabalho no BluStar workspace

Contexto e regras para trabalhar neste repositório. **Leia antes de editar.**

## O que é

App **vanilla** (HTML/CSS/JS nativo) do PRAIA Brand System. Era um único
`index.html` de ~16 mil linhas; foi modularizado em CSS por área (`styles/`) e
módulos JS (`js/`), preservando comportamento. Sem framework, sem bundler.
Mapa detalhado em [ARCHITECTURE.md](ARCHITECTURE.md).

## Regras inegociáveis

1. **Stack continua vanilla.** Não introduzir React/Vue/bundler/framework. JS é
   `<script src>` clássico; a comunicação entre módulos é via `window.__praia*`
   (ponte global explícita) + DOM.
2. **`ds-tokens.css` é a fonte única de design tokens.** NUNCA redeclarar
   valores de token fora dele. Componentes consomem via `var(--token)`.
3. **Comportamento idêntico.** Refatorações são estruturais; não mudar UI,
   estado salvo ou fluxo do usuário sem pedido explícito.
4. **Verificar no preview** após mudanças observáveis: subir o servidor
   estático, confirmar que o error boundary NÃO disparou (boot sem fallback), e
   rodar o **smoke test** abaixo. Gate antes do preview: `node --check js/<arquivo>.js`.

## Onde fica cada coisa

- **`index.html`** — markup + `<link>`/`<script>` + ~50 linhas de boot glue
  inline (`__praiaResolveContentPage`, navegação de itens do guide, `applyRoute()`).
- **`styles/`** — CSS por área, linkado na **ordem da cascata** (não reordenar
  sem motivo). `base · topnav · app-shell · main · worlds/* · editor/* · responsive`.
- **`js/`** — um módulo por feature. Ordem de carga (em `index.html`):
  `error-boundary → paste-sanitizer → router → [glue] → hubs (add-module,
  component-selection, ds-canvas) → contents-tree → bridge (guide-sidebar,
  text-panel, media-cloudinary) → state → consumidores → auth`.
  - **Ponte:** módulos expõem `window.__praiaX = ...` e consomem
    `window.__praiaY?.(...)`. Ao mover/criar código, respeite a **ordem de
    carga**: quem é consumido em *load-time* (ex.: o restore do `state.js`)
    precisa carregar **antes** do consumidor. A maioria consome em handlers
    (`?.()`), então é order-tolerant — mas **audite** antes de assumir.
    Inventário completo das globais `window.__praia*` em **ARCHITECTURE.md §5**.
    Ao criar ou remover uma global, **atualize esse inventário** (evita a
    superfície da ponte derivar do doc em silêncio).
  - **`state.js`** — toda a persistência (localStorage), `STATE_VERSION` +
    `migrateState()`, autosave/histórico/undo-redo. Centraliza as chaves de
    estado (`window.__praiaStateKeys`).
  - **`error-boundary.js`** — `window.onerror`/`unhandledrejection`; loga alto
    e mostra fallback discreto em vez de tela branca.
  - **Hubs** (`add-module`, `component-selection`, `ds-canvas`): IIFEs grandes,
    mantidos inteiros (não decompor sem necessidade real). Eles contêm
    **variáveis de closure compartilhadas entre features** — uma mudança pode
    ter efeito não-local dentro do hub. Audite os usos da variável antes de alterar.

## Qualidade (Biome)

- `npm run check` / `format` / `lint` — Biome cobre **só `js/`**.
- Gate de **erros reais**, não de estilo: nags de idioma (forEach, useTemplate,
  isNaN, etc.) estão **desativados** de propósito em `biome.json` — o código
  vanilla os usa de forma consistente e funcional. Não reativá-los para
  "modernizar" sem pedido. Casos intencionais usam `// biome-ignore` documentado.
- **Pré-commit** (simple-git-hooks) roda `biome check --staged`. Para casos
  legítimos, `SKIP_SIMPLE_GIT_HOOKS=1 git commit` pula o hook.

## Protocolo de commit por fase

O refactor foi feito em **fases, um commit por fase** (checkpoint reversível).
Mantenha esse hábito:

- Mudança estrutural arriscada → **branch** + commits pequenos e coesos,
  verificando o app entre cada um; merge no `main` como marco quando estável.
- **Lift verbatim** (mover um bloco sem alterar): mantenha o diff como *move
  puro* (byte-idêntico) — revisável em segundos. Não misture formatação no
  mesmo commit (o Biome roda como passada separada).
- Mensagem clara do que mudou e **como foi verificado** (preview, node --check,
  byte-identidade).
- `main` tem história limpa; o monorepo React/TS anterior está preservado na
  branch `legacy-monorepo`. Tags reais que marcam os marcos: `fundacao-fase0-5`,
  `fase3-leva-1`, `fase3-completa`, `refactor-completo`.

## Smoke test (rode após QUALQUER mudança observável)

Não há testes automatizados — **este checklist é a suíte de verificação**.
Suba o estático (`npm run dev`) e percorra, no preview:

- [ ] **Boot:** entrar em modo DEV e confirmar boot limpo — o error boundary
      NÃO disparou (sem faixa de fallback no rodapé).
- [ ] **Router:** `home` → `#guide` → voltar a `#home`.
- [ ] **DS mode:** entrar no DS e navegar as seções (templates, color, icons,
      buttons, client).
- [ ] **Templates:** inserir um template no canvas e editar um texto.
- [ ] **Component selection:** selecionar um componente e editar inline.
- [ ] **Persistência:** recarregar a página e confirmar que o estado volta (restore).
- [ ] **Reset:** abrir com `?reset=1` e confirmar que limpa e boota do zero.

## Não tocar sem fase própria

- URLs/assets do Cloudinary e a mídia em `assets/`.
- O IndexedDB `praia-videos` (blobs de vídeo) — o `?reset=1` não o limpa.
- `GOOGLE_CLIENT_ID` é **público por design** (não é segredo) e o preset
  Cloudinary `blustar_unsigned` é **intencional/conhecido** — não "consertar"
  escondendo o client ID ou trancando o preset (quebraria login/upload).
