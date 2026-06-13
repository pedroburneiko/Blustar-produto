# BluStar Produto — guia do monorepo

Monorepo do produto BluStar. **React + TypeScript**, **pnpm workspaces**. Sistema dark-canvas.
Este arquivo vale para qualquer trabalho **na raiz / entre pacotes**. Regras específicas do
Design System estão em [`packages/ui/CLAUDE.md`](./packages/ui/CLAUDE.md).

> **Fase 0:** só a fundação. NÃO migrar features de app agora. O protótipo entra numa fase
> futura como `reference/`.

## Estrutura e dependências

```
packages/tokens   @blustar/tokens     fonte única de tokens
packages/ui       @blustar/ui         design system (consome tokens)
apps/workspace    @blustar/workspace  app do produto (consome ui)
reference/        protótipo vanilla   SPEC da migração — SOMENTE CONSULTA
```

Fluxo: `tokens → ui → workspace`. Pacotes se referenciam por `workspace:*`, nunca por cópia.

## Migração do produto — `reference/` (regra dura)

- A migração do produto segue [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md): o protótipo é o
  **SPEC**, reconstrução **feature por feature** em React, **nunca big-bang**.
- **`reference/` é SOMENTE CONSULTA.** **NUNCA importe/copie nada de `reference/` em código
  de produção** (`apps/`, `packages/`). O SPEC canônico é `reference/index.html`; versões
  antigas ficam em `reference/_archive/`.

## Tokens — fonte única (regra dura)

- Toda token nova/alterada vai em **`packages/tokens`** e em nenhum outro lugar:
  - valores CSS → `src/tokens.css` (variáveis `--bs-*`);
  - fonte da marca → `src/fonts.css` (Versos);
  - API JS → `src/{colors,spacing,typography,grid}.ts`, mantida em sincronia com o CSS.
- `@blustar/ui` e apps **só consomem** (`var(--bs-*)` ou imports de `@blustar/tokens`).
  Nunca redeclare hex, nunca duplique o bloco de tokens em outro pacote.
- O Tailwind do DS referencia exclusivamente `var(--bs-*)` — sem hex no config.

## Regras de marca

- **Primária:** turquesa **`#3FCCE3`** (`--bs-brand`). Única cor de ação/realce.
  Rampa: base `#3FCCE3` → hover `#0FC4D5` → active `#0DB3C2`. Ink sobre a marca = navy (`--bs-on-brand`).
- **Canvas:** preto **`#000000`** (`--bs-bg`). **Surface:** `#161B21` (`--bs-surface`).
- **Azul `#3259FF`** (`--bs-focus-ring`) é **só focus ring** — nunca ação, link ativo ou destaque.
- **Touch 48×48px** mínimo em qualquer controle tocável (`size="touch"` / prop `touch`).
  Usuário final é motoboy, no celular, em movimento.
- **Só tokens semânticos.** Nunca hardcode hex em componente, story ou app.
- **Uma story por componente** (default, variantes, tamanhos, estados; `play` quando houver interação).

## Versionamento

- **Por git, sempre.** Nunca duplique arquivos como backup (`*.old.tsx`, `copy de…`).
  Branches/commits são a rede de segurança.
- **Commit a cada tarefa concluída**, mensagem clara.

## Engenharia

- Gerenciador: **pnpm**. `pnpm install` na raiz instala tudo; `pnpm -r build` builda em ordem.
- Antes de concluir uma mudança: o build de cada pacote afetado deve passar.
- TypeScript em todo o monorepo. Sem JS solto onde TS cabe.
