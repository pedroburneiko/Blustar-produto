# BluStar Produto — fonte de verdade do monorepo

Editor visual dark-canvas (estilo Figma) para a marca BluStar. **React + Vite + TypeScript**,
**pnpm workspaces**. Este arquivo é a fonte de verdade do projeto e sobrevive a `/clear`:
uma sessão nova deve se reorientar a partir daqui. Regras específicas do Design System estão em
[`packages/ui/CLAUDE.md`](./packages/ui/CLAUDE.md).

---

## 1. STATUS ATUAL  ← atualize a cada milestone

**Marcos concluídos (✅):** M0–M7, e M6 A/B/C/D/E — todos completos (confirmado no git log).

- **Templates (M6.D) — completo:** masters + instâncias, **propagação ao vivo**
  (render de instância = master + overrides), inserção via **catálogo de templates**,
  **master-edit por painel** (inspector), **overrides por slot** (sub-seleção).
- **Cena de demo "Vitrine" — montada:** grid 3×2, 6 instâncias do master Card de preço.
  Vive no seed (`apps/workspace/src/sampleDocument.ts`). O *money shot* funciona:
  editar o master propaga às 6 instâncias ao vivo.
- **Qualidade:** build (`pnpm -r build`), testes (Vitest no core) e CI (`.github/workflows/ci.yml`)
  verdes.
- **Git:** HEAD sincronizado com `origin/main` (push feito). Confirme com `git status` /
  `git rev-list --left-right --count origin/main...HEAD`.

**Foco atual: polish + ensaio do pitch. NÃO construir features novas.**

---

## 2. ARQUITETURA

Monorepo pnpm. Fluxo de dependências `tokens → ui → core → workspace`, sempre por `workspace:*`,
nunca por cópia.

```
packages/tokens   @blustar/tokens     fonte única de design values (cores, espaço, tipo, grid)
packages/ui       @blustar/ui         design system — componentes reutilizáveis, só tokens, com story
packages/core     @blustar/core       domínio: store + undo/history + contrato de persistência
apps/workspace    @blustar/workspace  o editor (React + Vite + TS) — consome ui + core
reference/        protótipo vanilla   SPEC da migração — SOMENTE CONSULTA
```

- `packages/core` = `model/` (types + factories), `store/` (editorStore, history),
  `persistence/` (contrato DocumentStore + serialização).
- **`reference/` é SPEC, não código.** NUNCA importe, copie ou edite nada de `reference/` em
  produção (`apps/`, `packages/`). SPEC canônico: `reference/index.html`; histórico em
  `reference/_archive/`. (Detalhes em [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md).)

---

## 3. CONVENÇÕES (obrigatórias)

- **Fluxo de trabalho:** plan-first → **pergunte, não adivinhe** → **1 commit por etapa concluída**,
  mensagem clara. Versionamento é por git; nunca duplique arquivos como backup (`*.old.tsx`, `copy de…`).
- **DS-vs-app:** reutilizável → `@blustar/ui` (com **story** + export, **só tokens semânticos**,
  zero hex/px hardcoded). Específico do editor → `apps/workspace`.
- **Undo:** cada mutação de documento = **1 entrada de undo**. Estado efêmero
  (seleção, gesto/drag, `saveStatus`) fica **fora** do histórico.
- **Tokens são a regra de marca:** construir com tokens = on-brand automático. Token nova/alterada
  vai **só** em `packages/tokens` (CSS em `src/tokens.css`, fonte em `src/fonts.css`,
  API JS em `src/{colors,spacing,typography,grid}.ts`, mantida em sincronia). UI e apps **só consomem**.
- **Engenharia:** pnpm (`pnpm install` na raiz; `pnpm -r build` builda em ordem). TypeScript em todo
  o monorepo. Build dos pacotes afetados deve passar antes de concluir.

---

## 4. REGRAS DE MARCA  (valores exatos de `packages/tokens/src/tokens.css`)

- **Primária / ação — turquesa `#3FCCE3`** (`--bs-brand`). Única cor de ação/realce.
  - hover `#0FC4D5` (`--bs-brand-hover`) · active `#0DB3C2` (`--bs-brand-active`)
  - ink sobre a marca = navy `#04001E` (`--bs-on-brand`)
- **Focus ring — azul `#3259FF`** (`--bs-focus-ring`). **SÓ focus ring** — nunca ação, link ou destaque.
- **Canvas — preto `#000000`** (`--bs-bg`). **Surface — `#161B21`** (`--bs-surface`);
  surface-hover `#1C232C`, surface-2/borda `#242C36`.
- **Texto:** `#FFFFFF` (`--bs-text`), muted `#E5E5E5`, subtle `#707070`.
- **Status:** success `#70FF82` · alert/warning `#FF5D00` · danger `#FF9187`.
- **Tipografia:** fonte da marca **Versos** (`--bs-font`), com fallback system-ui.
- **Espaçamento** base 4px (`--bs-space-1..7`); **raio** soft-square 8/12/16px.
- **Touch 48×48px** mínimo em qualquer controle tocável (`size="touch"` / prop `touch`).
  Usuário final é motoboy, no celular, em movimento.
- **Nunca hardcode hex/px** em componente, story ou app — só tokens semânticos `var(--bs-*)`.

---

## 5. PARQUEADO (construído, inerte — não estender sem pedido explícito)

- **Persistência Supabase** + auth anônima + RLS (`supabase/schema.sql`, `packages/core/.../persistence`).
  **Inerte sem env.** O demo roda **do seed**, NÃO do Supabase — com env ligado, o Supabase
  carregaria um doc antigo e **esconderia a Vitrine**. Mantenha desligado no pitch.
- **Sentry** (monitoramento de erros) — inerte sem DSN.
- **Máscaras de imagem** (M6.E, estilo Figma pan/zoom/fit) — pronta, **não usada** no demo atual.

---

## 6. DEFERIDO (futuro — só com necessidade real)

- M8: release / deploy.
- Verificação real do fluxo Supabase (carga/salvamento end-to-end).
- Edge cases de override (instâncias × master).
- Integrar máscara de imagem em um template real.
- **Grid responsivo por breakpoint — faixa de feature (pós-pitch).** Tokens já existem
  (`packages/tokens`: `breakpoints`, `gridByBreakpoint`, `breakpointForWidth` em `src/grid.ts`;
  `--bs-bp-*` e `--bs-grid-*` em `tokens.css`). Falta: (a) `<Grid>`/`<Col>` do DS escolherem a
  config pela largura do artboard + story dos 3 bps; (b) painel Columns com seletor de breakpoint
  + chip do bp ativo (derivado da largura, **estado efêmero, fora do undo**) + campos por bp;
  (c) **model em `packages/core`**: config de grid vira **override no documento** (tokens = default
  de marca), **1 undo por mutação** — **direção APROVADA**. NÃO estender `LayerBox` antes do pitch.
