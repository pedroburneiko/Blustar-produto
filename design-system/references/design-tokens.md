# Blustar — Design Tokens

> Fonte única da verdade: [`ds-tokens.css`](../../ds-tokens.css). Este documento é a referência legível (humanos + IA) desses tokens.
> **Nunca** redeclare valores fora do `ds-tokens.css` — edite lá e atualize aqui.

Para usar em qualquer página, no `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block">
<link rel="stylesheet" href="ds-tokens.css">
```

---

## Cores

### Brand

| Token | Valor | Uso |
| --- | --- | --- |
| `--bs-navy` | `#061833` | Cor base de marca; fundos navy de templates |
| `--bs-navy-deep` | `#04001E` | Navy mais profundo |
| `--bs-cyan` | `#0FC4D5` | Cyan principal (destaque/marca) |
| `--bs-cyan-200` | `#A6D9DE` | Cyan dessaturado |
| `--bs-cyan-100` | `#BFFAFF` | Cyan claro |
| `--bs-cyan-50` | `#DFFCFF` | Cyan muito claro |
| `--bs-blue` | `#3259FF` | Azul de ação/foco |
| `--bs-white` | `#FFFFFF` | Branco |
| `--bs-ink` | `#0a1018` | Texto/elemento escuro sobre fundos cyan/claros |

### Canvas escuro (UI da ferramenta)

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#040910` | Fundo da aplicação |
| `--surface` | `rgba(126,126,126,0.10)` | Superfície nível 1 |
| `--surface-2` | `rgba(126,126,126,0.18)` | Superfície nível 2 |
| `--surface-3` | `rgba(126,126,126,0.26)` | Superfície nível 3 |
| `--hover` | `rgba(255,255,255,0.08)` | Wash de hover unificado (todo hover neutro usa este) |

### Bordas

| Token | Valor |
| --- | --- |
| `--border` | `rgba(255,255,255,0.10)` |
| `--border-strong` | `rgba(255,255,255,0.18)` |

### Texto

| Token | Valor | Uso |
| --- | --- | --- |
| `--text` | `#FFFFFF` | Texto primário |
| `--text-2` | `rgba(255,255,255,0.72)` | Texto secundário |
| `--text-3` | `rgba(255,255,255,0.48)` | Texto terciário/placeholder |

### Status

| Token | Valor | Uso |
| --- | --- | --- |
| `--status-active` | `#70FF82` | Ativo/sucesso |
| `--status-alert` | `#FF7300` | Alerta |

### Semânticas

| Token | Valor | Uso |
| --- | --- | --- |
| `--popover` | `#0d1421` | Fundo de popover |
| `--accent-select` | `#a259ff` | Seleção/realce |
| `--danger` | `#ff6b6b` | Erro/destrutivo |

### Overlays

| Token | Valor |
| --- | --- |
| `--overlay-light` | `rgba(0,0,0,0.25)` |
| `--overlay-md` | `rgba(0,0,0,0.45)` |
| `--overlay-dark` | `rgba(0,0,0,0.55)` |

### Placeholder (skeletons de template)

| Token | Valor |
| --- | --- |
| `--placeholder` | `rgba(0,0,0,0.18)` |
| `--placeholder-strong` | `rgba(0,0,0,0.55)` |

### Tints de cyan (hover/active sobre cyan)

| Token | Valor |
| --- | --- |
| `--tint-cyan-sm` | `rgba(15,196,213,0.08)` |
| `--tint-cyan-md` | `rgba(15,196,213,0.18)` |
| `--tint-cyan-lg` | `rgba(15,196,213,0.30)` |

---

## Tipografia

**Família:** `Versos` (marca BluStar) — pesos `400/500` → Regular, `600` → SemiBold, `700+` → Bold.

```css
--font:         'Versos', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
--font-display: 'Versos', sans-serif;
```

### Escala de conteúdo

Cada nível expõe `family / weight / size / line / tracking` (ex.: `--type-h0-size`).

| Nível | Size | Weight | Line | Tracking | Família |
| --- | --- | --- | --- | --- | --- |
| `h0` | 220px | 500 | 0.92 | -0.03em | display |
| `super` | 96px | 500 | 1 | -0.02em | display |
| `xl` | 40px | 500 | 1.05 | -0.02em | text |
| `l` | 32px | 500 | 1.15 | -0.01em | text |
| `mb` | 24px | 500 | 1.2 | -0.01em | text |
| `m` | 16px | 500 | 1.5 | 0 | text |
| `sb` | 13px | 700 | 1.4 | 0 | text |
| `s` | 12px | 500 | 1.4 | 0.04em | text |
| `xs` | 10px | 500 | 1.55 | 0.04em | text |

> Estes tokens são **editáveis pelo inspector** da ferramenta. Mudar um token de Type re-mede e reflui os templates de texto.

### UI type (chrome, labels, badges)

| Nível | Size | Weight | Line | Tracking |
| --- | --- | --- | --- | --- |
| `ui` | `var(--type-sb-size, 14px)` | 500 | 1.4 | -0.01em |
| `ui-sm` | `var(--type-s-size, 12px)` | 500 | 1.4 | 0 |
| `ui-xs` | `var(--type-xs-size, 10px)` | 500 | 1.4 | 0.04em |

---

## Ícones — Material Symbols

Glyphs token-driven via `.bs-icon` / `.material-symbols-outlined`. A cor segue `currentColor` e o tamanho segue `font-size`.

| Variável | Default | Uso |
| --- | --- | --- |
| `--bs-icon-size` | `24px` | Tamanho do glyph (hosts sobrescrevem) |

Eixo `FILL` alterna outline ↔ filled:

```html
<span class="bs-icon">home</span>            <!-- outline -->
<span class="bs-icon" data-fill="1">home</span> <!-- filled -->
```

---

## Espaçamento

| Token | Valor |
| --- | --- |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-7` | 32px |

---

## Raios (soft-square)

| Token | Valor |
| --- | --- |
| `--r-sm` | 8px |
| `--r-md` | 14px |
| `--r-lg` | 24px |
| `--r-full` | 9999px |

---

## Layout

| Token | Valor |
| --- | --- |
| `--topnav-h` | 56px |
| `--sidebar-w` | 260px |
| `--sidebar-collapsed-w` | 64px |

---

## Z-index

| Token | Valor |
| --- | --- |
| `--z-base` | 1 |
| `--z-sticky` | 50 |
| `--z-nav` | 100 |
| `--z-overlay` | 200 |
| `--z-dropdown` | 400 |
| `--z-modal` | 500 |
| `--z-toast` | 600 |

---

## Foco & Motion

| Token | Valor |
| --- | --- |
| `--focus-ring` | `1.5px solid var(--bs-blue)` |
| `--ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |
