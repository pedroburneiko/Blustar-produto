# Blustar Design System

Este projeto usa o **@blustar/ui** (Blustar Design System). Use SEMPRE os componentes
e tokens dele em vez de criar do zero.

## Setup
- Instalar (local, enquanto não está no npm): `npm install ~/Claude___/Blustar_DS_NEWNEWNEW`
- Importar o CSS UMA vez no entry point (`src/main.tsx`): `import "@blustar/ui/styles.css"`
- Fonte da marca: **Versos** (já embutida no pacote, carrega sozinha).

## Componentes disponíveis

### Button
```tsx
import { Button } from "@blustar/ui";

<Button variant="primary" size="md" onClick={...}>Texto</Button>
```
- `variant`: `primary` (cyan, texto branco) | `secondary` (contorno preto) | `ghost` (texto sublinhado)
- `size`: `sm` | `md` | `lg`
- `loading`: boolean — mostra spinner e desabilita
- `fullWidth`: boolean — ocupa toda a largura
- `leftIcon`: ReactNode — ícone à esquerda do texto

### Select
```tsx
import { Select } from "@blustar/ui";

<Select
  placeholder="Selecione"
  options={[{ label: "Item 1", value: "1" }]}
  onChange={(v) => ...}
/>
```
- `options`: `{ label, value, disabled? }[]`
- `value` / `defaultValue`: string (controlado / não controlado)
- `placeholder`: string
- `onChange`: `(value: string) => void`

### CopyField
```tsx
import { CopyField } from "@blustar/ui";

<CopyField value="token-abc-123" />
```
- `value`: string — texto exibido e copiado ao clicar
- `width`: number | string
- `onCopy`: `(value: string) => void`

### Alert
```tsx
import { Alert } from "@blustar/ui";

<Alert variant="success">Salvo com sucesso!</Alert>
```
- `variant`: `success`
- `children`: mensagem
- `width`: number | string

## Tokens
```tsx
import { colors, palette, fontFamily } from "@blustar/ui";
```
- `palette` — cores cruas (cyan, blue, navy, neutral)
- `colors` — tokens semânticos (brand, text, bg, border, focusRing...)
- `fontFamily.sans` — pilha de fonte (Versos)

## Regras
- NÃO criar um componente novo se já existir equivalente no @blustar/ui.
- Usar os tokens de cor, não valores HEX soltos.
- Depois de atualizar o DS, rodar `npm run build` na pasta do DS (ou deixar
  `npm run dev:lib` rodando) para a interface enxergar a versão nova.
