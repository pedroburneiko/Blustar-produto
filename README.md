# BluStar Produto

Monorepo do produto BluStar. Produto e design system em **React + TypeScript**,
gerenciado com **pnpm workspaces**.

> **Fase 0 — fundação.** Só a estrutura base. Nenhuma feature de app foi migrada
> ainda. O protótipo entra numa fase futura como `reference/`.

## Estrutura

```
packages/
  tokens/      @blustar/tokens  — FONTE ÚNICA de tokens (CSS --bs-* + fonte Versos + API JS)
  ui/          @blustar/ui      — Design System React (Vite + TS + Tailwind + Storybook)
apps/
  workspace/   @blustar/workspace — app do produto (placeholder na Fase 0)
```

Fluxo de dependência: `tokens → ui → workspace`.

## Tokens — fonte única

Todos os tokens da marca vivem em **`packages/tokens`** e em nenhum outro lugar:

- `src/tokens.css` — variáveis CSS `--bs-*` (paleta oficial, semânticos, raio, espaço).
- `src/fonts.css` — fonte da marca **Versos** (embutida).
- `src/*.ts` — API JS (`palette`, `colors`, `spacing`, `typography`, `grid`).

`@blustar/ui` e os apps **consomem** desses arquivos — nunca redefinem hex nem
duplicam valores. O Tailwind do DS só referencia `var(--bs-*)`.

## Versionamento

**Por git, sempre.** Nunca versione por cópia de arquivo/pasta (`*.old`, `copy de…`).
Branches e commits são a rede de segurança. O DS é consumido como pacote do
workspace (`workspace:*`), não como cópia.

## Regras de marca

- **Primária:** turquesa **`#3FCCE3`** (`--bs-brand`) — única cor de ação/realce.
- **Canvas:** preto **`#000000`** (`--bs-bg`); **surface** `#161B21` (`--bs-surface`).
- **Azul `#3259FF`** = **apenas** focus ring (`--bs-focus-ring`). Nunca como ação.
- **Touch target mínimo 48×48px** (`size="touch"` / prop `touch`) — uso em campo, no celular.
- **Só tokens semânticos.** Nunca hardcode hex em componente, story ou app.
- **Uma story por componente**, cobrindo variantes, tamanhos e estados.

## Comandos

```bash
pnpm install              # instala todo o workspace
pnpm build                # builda tokens → ui → workspace
pnpm dev:workspace        # roda o app placeholder
pnpm storybook            # Storybook do DS
```
