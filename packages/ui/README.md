# Blustar Design System

`@blustar/ui` — biblioteca de componentes React do Blustar, com tokens de marca, tipografia Versos e documentação viva no Storybook.

Stack: **React + TypeScript + Tailwind CSS + Vite + Storybook**.

## Começando

```bash
npm install
npm run storybook   # documentação viva em http://localhost:6006
```

Outros comandos:

```bash
npm run build             # gera o pacote em dist/ (pronto pra publicar)
npm run build-storybook   # gera a documentação estática em storybook-static/
npm run lint              # checagem de código
```

## Fundamentos

**Cores** (`src/tokens/colors.ts`): cyan da marca (`#3FCCE3`), azuis (`#4D8BFE`, `#3259FF`), navy (`#061833`, `#04001E`) e escala neutra de 9 tons. Use sempre os tokens semânticos (`colors.brand`, `colors.text`, etc.), não os valores crus.

**Tipografia** (`src/tokens/typography.ts`): fonte **Versos** nos pesos Regular (400), SemiBold (600) e Bold (700). Os arquivos `.ttf` vivem em `src/styles/fonts/` e são carregados via `@font-face` em `globals.css`.

**Espaçamento e raio** (`src/tokens/spacing.ts`): base 4px; raios de 12px (cards) e 16px (blocos).

## Usando em um projeto

```tsx
import { Button } from "@blustar/ui";
import "@blustar/ui/styles.css";

export default function App() {
  return <Button variant="primary" onClick={() => alert("oi")}>Entrar</Button>;
}
```

## Fluxo de trabalho: do Figma ao componente

Este é o fluxo que usamos para crescer o DS:

1. **Figma** — o design define o componente e exporta o **SVG**.
2. **Código** — o SVG vira um componente React tipado em `src/components/<Nome>/`, reaproveitando os tokens.
3. **Interações** — adicionamos estados (hover, active, focus, loading, disabled) e comportamento.
4. **Story** — cada componente ganha um arquivo `*.stories.tsx` com variações e um teste de interação (`play`).
5. **Publicação** — `npm run build` empacota; `npm publish` lança a versão.

Estrutura de uma pasta de componente:

```
src/components/Button/
├── Button.tsx            # componente + tipos
├── Button.stories.tsx    # documentação + testes de interação
└── index.ts              # re-export
```

## Publicar no GitHub

```bash
git init
git add .
git commit -m "feat: base do Blustar Design System"
git branch -M main
git remote add origin git@github.com:<org>/blustar-ds.git
git push -u origin main
```

Para publicar a documentação no GitHub Pages, faça `npm run build-storybook` e sirva a pasta `storybook-static/` (ou configure uma GitHub Action).

## Estrutura

```
blustar-ds/
├── .storybook/           # config do Storybook
├── src/
│   ├── components/       # componentes (um por pasta)
│   ├── tokens/           # cores, tipografia, espaçamento
│   ├── styles/           # globals.css + fontes Versos
│   └── index.ts          # entry point do pacote
├── tailwind.config.js
├── vite.config.ts
└── package.json
```
