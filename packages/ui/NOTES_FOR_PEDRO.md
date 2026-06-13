# Notas para o Pedro — @blustar/ui

Documento de trabalho do Claude. Tudo é reversível via git (1 commit por etapa).
Decisões de gosto/marca ou ambíguas ficam aqui em vez de chutadas.

---

## ✅ FUNDAÇÃO DE COR COMPLETA (prompt mestre) — aplicado

Primitivos nomeados da marca agora vivem em `globals.css` (a fonte); componentes só usam
semânticos. Ver tabela completa no `CLAUDE.md`. Resumo do que mudou nesta rodada:

- **Primitivos:** `azul-*` (turquesa primária), escala neutra oficial `gray-15..180`,
  status `green/orange/yellow/red`. A antiga escala `--bs-neutral-*` foi substituída por
  `--bs-gray-*` (Tailwind manteve aliases `neutral-*` de compat).
- **Status corrigidos** (valores oficiais, propagam pro Alert automaticamente):
  - success → green-01 `#70FF82` / green-02 `#16331A` (bg antes era `#03230D`)
  - error/danger → red-01 `#FF9187` / red-02 `#560907` (**corrige o `#FF6B6B` que eu havia derivado**)
  - warning → orange-03 `#FF5D00` / orange-02 `#8D3100` (**corrige o `#FF7300`/tints derivados**)
  - yellow-01/02 ficam como primitivos disponíveis, **sem papel de status** por ora.

### ⚠️ DECISÕES / pontos que ainda são seus
- **Canvas (`--bs-bg`) — ✅ RESOLVIDO: preto `#000000`.** Você decidiu black 100%. `--bs-bg`
  aponta para o primitivo `--bs-asfalto` (= gray-180), sem hardcode. Surface = `#161B21`.
  `#04001E` (azul-noturno) e `#040910` (gray-01) seguem como primitivos disponíveis, mas não
  são mais o canvas.
- **`#ADADAD` ("Gray 03" antigo):** **não** está na escala neutra oficial (`gray-*`). Guardei
  como token próprio `--bs-legacy-gray-03` pra não perder o valor. Não é usado por nenhum
  componente hoje. Opções: (a) deixar como token avulso; (b) mapear pro vizinho mais próximo
  da escala — o mais perto é **gray-45 `#C7C7C7`** (|173−199|=26) vs gray-60 `#8F8F8F` (30).
  Me diz qual você quer.
- **Bordas/surfaces escuras** (`#242C36`, `#305B9B`, `#1C232C`) seguem como tokens funcionais
  (não são valores da escala `gray-*`). Mantidos pra não alterar a aparência dos componentes.

### ✅ Fonte externa (ds-tokens.css) — patch ADITIVO aplicado
Você escolheu a opção **(1) aditivo, não-destrutivo**. Aplicado nas duas cópias
(`Brand System Blustar NEW/` e `Guideline Blustar/`), com `.bak` ao lado de cada:
- **Adicionado:** bloco com a paleta nomeada (`azul-*`, `gray-15..180`, `green/orange/yellow/red`).
- **NÃO tocado:** `--bg` (#040910, canvas pendente), `--status-alert` (#FF7300), `--danger`
  (#ff6b6b), surfaces, tints. Ou seja, a aparência atual da ferramenta externa não mudou.
- As duas cópias continuam **idênticas entre si** (duplicação ainda pendente de unificação).
- Reverter: `mv "<pasta>/ds-tokens.css.bak" "<pasta>/ds-tokens.css"`.

> Obs.: como optamos pelo aditivo, os semânticos externos `--status-alert`/`--danger` ainda
> usam os valores antigos (#FF7300 / #ff6b6b), diferentes dos oficiais do DS (#FF5D00 / #FF9187).
> Se um dia quiser alinhar 100%, é trocar esses 2 valores lá.

---

## 1. Auditoria — estado atual (baseline)

Data: 2026-06-13. Branch `main`.

### Componentes

| Componente | Implementação | Story | Observações |
|---|---|---|---|
| **Button** | `src/components/Button/Button.tsx` | ✅ ampla (variantes, tamanhos, loading, disabled, ícone, teste de clique) | Usa Tailwind. Hardcode: `hover:bg-[#0DB3C2]`, `active:bg-[#0A98A5]`. Primary = `bg-cyan-400` (#0FC4D5). |
| **Select** | `src/components/Select/Select.tsx` | ✅ (padrão, com seleção, desabilitado, item desabilitado, teste) | Dark. Inline styles com hex cru (#161B21, #242C36, #0FC4D5, #E5E5E5, #8F8F8F…). Acessível (listbox, teclado). |
| **CopyField** | `src/components/CopyField/CopyField.tsx` | ⚠️ só `Padrao` + teste de cópia | Dark. Hex cru (#305B9B, #161B21, #0FC4D5). Sem story de hover/estado copiado isolado. |
| **Alert** | `src/components/Alert/Alert.tsx` | ⚠️ só `Sucesso` | Hex cru (#03230D, #114A31, #70FF82). Só variante `success`. |
| **Accordion** | `src/components/Accordion/Accordion.tsx` | ⚠️ `Aberto`/`Fechado` | Dark. Hex cru (#FFFFFF, #707070). Sem story de item desabilitado. |
| **Icon** | `src/components/Icon/Icon.tsx` | ✅ `Todos` | 5 ícones SVG. `color` default `#FFFFFF` hardcoded (aceitável p/ default de prop). |
| **Grid / Col** | `src/components/Grid/Grid.tsx` | ✅ overlay + exemplo | Usa `tokens/grid`. Overlay `#00BFFF` no token. |

### Tokens (estado atual — TRÊS fontes divergentes)

1. `src/tokens/*.ts` (colors, typography, spacing, grid) — API JS, tema **light** (bg branco, texto navy).
2. `tailwind.config.js` — subconjunto de cores, hardcoded.
3. `src/styles/globals.css :root` — `--bs-*` custom properties, tema **light**.

A referência de marca (`ds-tokens.css`, igual nas duas pastas de referência) é um sistema
**dark-canvas**: fundo `#040910`, texto branco, **cyan `#0FC4D5` como marca**, blue `#3259FF`
**apenas como focus ring**, surfaces translúcidas, status `#70FF82` (active) e `#FF7300` (alert).

**Os componentes já são dark** (bg `#161B21` etc.) e batem com a referência. Quem está
desalinhado são os tokens light (`colors.ts` + `globals.css :root`). Plano: consolidar numa
fonte única dark alinhada ao `ds-tokens.css`.

### 🔴 Build quebrado no baseline

`npm run build` falha **antes de qualquer alteração minha**:

```
src/index.ts(10,1): error TS2308: Module "./components/Grid" has already exported
a member named 'Grid'.
```

Colisão entre o componente `Grid` e o `export type Grid` em `src/tokens/grid.ts`.
É bug de engenharia (não decisão de gosto) → vou corrigir renomeando o *type* para
`GridConfig`. Anotado aqui para você saber que o baseline já vinha vermelho.

---

## ✅ ATUALIZAÇÃO (suas decisões aplicadas)

Você revisou e decidiu. Aplicado, com commit por etapa:

- **2.1 Turquesa primário → CORRIGIDO para `#3FCCE3`** (oficial). Rampa de marca:
  `#3FCCE3` (base) → `#0FC4D5` (hover) → `#0DB3C2` (active). Texto sobre a marca virou ink
  escuro (navy) por contraste — branco sobre `#3FCCE3` reprovava em WCAG.
  - ⚠️ A fonte externa `ds-tokens.css` (nas pastas de referência, **fora do git**) ainda está
    com `#0FC4D5`. Você pediu pra corrigir lá também, mas como é fora do DS e sem rede de
    segurança do git, optamos por aplicar **só dentro do DS**. **Falta você sincronizar o
    `ds-tokens.css` da referência** (trocar `--bs-cyan: #0FC4D5` → `#3FCCE3` e ajustar a rampa).
- **2.2 Touch 48px → FEITO (opção 1).** `Button`/`Select` têm `size="touch"`; `CopyField`/
  `Accordion` têm prop `touch`. Tamanhos do Figma mantidos para desktop.
- **2.3 Tema claro →** mantido dark-only (não iniciado).
- **2.4 Alert →** criadas variantes `error` (danger `#FF6B6B`) e `warning` (`#FF7300`), com
  ícones novos (ErrorCircle, Warning) e stories. `info` ficou para depois.
  - ⚠️ Os fundos/bordas escuros de `error`/`warning` (`--bs-danger-bg/-border`,
    `--bs-alert-bg/-border`) eu **derivei** seguindo o padrão do `success` (não estavam na
    referência). Se quiser tons exatos, me diga os hex.
- **Extra:** `storybook-addon-pseudo-states` instalado — hover/active aparecem congelados nas
  stories (Button: Hover, Active, EstadosInterativos).

---

## 2. Decisões que precisam de você (histórico — já resolvidas acima)

### 2.1 Qual é o turquesa primário? — RESOLVIDO: `#3FCCE3`
Contexto original: a referência `ds-tokens.css` trazia `#0FC4D5` como primário e `#3FCCE3` não
aparecia. Você confirmou que o correto é **`#3FCCE3`** e que a referência estava errada.

### 2.2 Touch target de 48px vs. tamanhos do Figma ⚠️ DECISÃO SUA
Regra de marca (no CLAUDE.md): touch target mínimo **48×48px** (usuário motoboy, em campo).
Mas os tamanhos atuais do `Button` vêm do Figma e **não atingem isso**:
- sm = 26px · md = 34px · lg = 44px

Não mexi nas alturas (mudaria o pixel-perfect do Figma — é decisão de design). Opções:
1. Criar um size `xl`/`touch` de 48px+ para uso em campo (mantém os do Figma p/ desktop).
2. Subir `lg` para 48px.
3. Manter como está e aplicar 48px só nos controles realmente tocados no app.

Me diga qual caminho. O mesmo vale para `Select` (botão 34px) e os ícones-botão de 24px
no `CopyField`/`Accordion`.

### 2.3 Componentes dark vs. tokens que eram light
Os componentes já eram **dark** (batiam com a referência). Os tokens `colors.ts`/`globals.css`
estavam **light** e foram alinhados para dark. Se em algum momento você quiser um DS com
suporte a tema claro também, dá pra fazer com um `[data-theme]` — mas isso é trabalho à parte
e uma decisão sua (não comecei).

### 2.4 Variantes de Alert
`Alert` só tem `success`. Faltam `error`/`warning`/`info` (a referência tem `--bs-alert`
laranja `#FF7300` e `--danger`). Não inventei as cores/ícones — me diga se quer que eu crie.

---

## 3. Relatório final

### ✅ O que ficou sólido
- **Build verde.** `npm run build` e `npm run build-storybook` passam. (O baseline estava
  **quebrado** por colisão de nome `Grid` — corrigido.)
- **Fonte única de tokens** em `src/styles/globals.css` (`:root --bs-*`), alinhada ao
  `ds-tokens.css` da marca. Tailwind e `colors.ts` apontam para ela.
- **Marca correta:** turquesa `#0FC4D5` como primária; azul só como focus ring. De quebra,
  consertei um bug em que o `Button` primary usava `bg-cyan-400` inexistente na config e caía
  no cyan default do Tailwind (`#22d3ee`) — agora é a marca de verdade.
- **Zero hex hardcoded** nos componentes e stories (tudo via `var(--bs-*)` ou classes Tailwind
  que apontam pros tokens). Ícones usam `currentColor`.
- **Stories** cobrindo default/variantes/tamanhos/disabled/hover por componente.
- **CLAUDE.md** com regras de marca e engenharia; **ESLint** configurado (estava sem config).
- 1 commit por etapa — tudo revisável e reversível.

### ⏳ O que falta / precisa de você
- Decisões 2.1 (qual turquesa), 2.2 (48px), 2.3 (tema claro), 2.4 (variantes de Alert) acima.
- Storybook não tem snapshot real de `:hover`/`:active` em CSS estático (Tailwind `hover:`).
  Adicionei uma story `Button/Hover` que dispara o hover via interação. Se quiser hover
  "congelado" nos docs, dá pra instalar `storybook-addon-pseudo-states` (não instalei p/ não
  mexer em dependências sem combinar).
- `chunk > 500kB` no build do Storybook é só aviso interno do Storybook, não afeta o pacote.

### Como revisar
```bash
git log --oneline        # um commit por etapa
npm run storybook        # ver os componentes
npm run build            # confirmar verde
```
