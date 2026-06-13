# @blustar/ui — Regras do Design System

DS React do BluStar: Vite + TypeScript + Tailwind + Storybook. Sistema **dark-canvas**.
Este arquivo vale para qualquer trabalho **dentro deste repositório**.

> Procurando como **consumir** o DS em um app? Veja [`CLAUDE.template.md`](./CLAUDE.template.md).

---

## Marca

- **Tipografia:** **Versos Test** (família `"Versos"`, embutida em `@blustar/tokens/fonts.css`).
  Use sempre `var(--bs-font)` / `font-family: var(--bs-font)`.
- **Cor primária:** **turquesa `#3FCCE3`** (Azul Turquesa oficial, `--bs-brand`). É a cor de
  ação/realce. Rampa: base `#3FCCE3` → hover `#0FC4D5` → active `#0DB3C2`.
- Texto/ícone sobre a marca = **ink escuro** (`--bs-on-brand`, navy) — branco sobre o turquesa
  claro reprova em contraste.
- **Azul `#3259FF` (`--bs-focus-ring`) é APENAS focus ring.** Nunca use o azul (nem
  qualquer "accent") como cor de ação, botão, link ativo ou destaque de marca.
- **Accent NUNCA como cor de ação.** Ação = turquesa. Ponto.
- Canvas = **preto `#000000`** (`--bs-bg` → asfalto / gray-180); superfícies `--bs-surface*`
  (`#161B21`); texto branco/derivados. (`#04001E` e `#040910` seguem como primitivos, mas não
  são o canvas.)

## Paleta (primitivos nomeados)

Primitivos vivem em `@blustar/tokens` (`tokens.css`); **componentes só usam semânticos**, nunca primitivo direto.

- **Secundária (`azul-*`):** azul-nuvem `#DFFCFF` · azul-aberto `#BFFAFF` · azul-horizonte
  `#A6D9DE` · **azul-turquesa `#3FCCE3` (primária)** · azul-ceu `#3259FF` (focus) ·
  azul-profundo `#061833` · azul-noturno `#04001E` · asfalto `#000000` · branco `#FFFFFF`.
- **Neutros — escala oficial (`gray-*`):** gray-15 `#F7F7F7` · gray-30 `#E5E5E5` · gray-45
  `#C7C7C7` · gray-60 `#8F8F8F` · gray-90 `#707070` · gray-120 `#363636` · gray-150 `#191919`
  · gray-180 `#000000` · white `#FFFFFF`.
- **Status (terciária):** green-01 `#70FF82` / green-02 `#16331A` · orange-01 `#FFB282` /
  orange-02 `#8D3100` / orange-03 `#FF5D00` · yellow-01 `#FFE88B` / yellow-02 `#725400`
  (yellow é primitivo disponível, sem papel de status por ora) · red-01 `#FF9187` / red-02
  `#560907`.
- **Cuidado com "gray":** a escala neutra é `gray-*`. Os antigos "Gray 01/02/03" NÃO usam esse
  namespace: `#040910`/`#161B21` são canvas/surface (nomes funcionais `--bs-bg`/`--bs-surface`);
  `#ADADAD` ("Gray 03") está fora da escala neutra → token próprio (`--bs-legacy-gray-03`).

### Semânticos → primitivos
- `--bs-brand` → azul-turquesa · `--bs-focus-ring` → azul-ceu · `--bs-on-brand` → azul-noturno
- success = green-01 / green-02 · error/danger = red-01 / red-02 · warning = orange-03 / orange-02
- texto/borda/superfícies → escala neutra (`gray-*`)

## Tokens

- **Fonte única da verdade:** o pacote **`@blustar/tokens`** (`packages/tokens`) → `tokens.css`
  com as variáveis `--bs-*` e `fonts.css` com a fonte Versos. Alinhada ao `ds-tokens.css` da marca.
  Este pacote (`@blustar/ui`) **consome** esses arquivos (importados em `src/index.ts`); não
  declara tokens no próprio `globals.css`.
- **Só tokens semânticos. Nunca hardcode hex** em componente ou story. Se precisar de uma
  cor/raio/espaço novo, **adicione um token** em `@blustar/tokens` e referencie via `var(--bs-*)`
  (ou pelas classes Tailwind que apontam para os tokens — `bg-brand`, `text-muted`, etc.).
- A API JS dos tokens (`colors`, `palette`, `fontFamily`...) também vem de `@blustar/tokens`
  (re-exportada por `@blustar/ui`). Mantenha os valores JS em sincronia com `tokens.css`.
- Tailwind (`tailwind.config.js`) **não declara hex** — só referencia `var(--bs-*)`.

## Acessibilidade / uso em campo

- **Touch target mínimo 48×48px** para qualquer controle tocável. O usuário final é motoboy,
  usando no celular, em movimento. Para uso em campo, use:
  - `Button` / `Select`: `size="touch"` (48px).
  - `CopyField` / `Accordion`: prop `touch` (alvos de 48px).
  Os tamanhos do Figma (sm/md/lg) ficam para desktop.
- Mantenha foco visível (`--bs-focus-ring`), `aria-*` e navegação por teclado (ver `Select`).

## Engenharia

- **Todo componente novo precisa de uma story** cobrindo: default, variantes, tamanhos,
  estados (hover, disabled) e, quando houver interação, um `play`/teste.
- **Versionamento é por git.** Nunca duplique arquivos como backup (`Component.old.tsx`,
  `copy de...`). Use branches/commits — o histórico é a rede de segurança.
- **Commit a cada tarefa concluída**, com mensagem clara.
- Estrutura de componente: `src/components/X/{X.tsx, X.stories.tsx, index.ts}`, re-exportado
  em `src/index.ts`.
- Antes de concluir: `npm run build` e `npm run build-storybook` devem passar.

## Decisões de gosto/marca

Se uma escolha for de gosto, marca ou ambígua (qual variante, qual valor exato), **não chute**:
anote em [`NOTES_FOR_PEDRO.md`](./NOTES_FOR_PEDRO.md) e siga.
