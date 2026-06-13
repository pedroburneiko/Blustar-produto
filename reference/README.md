# reference/ — Protótipo vanilla (SPEC)

Esta pasta é o **protótipo original** do produto BluStar, em HTML/JS vanilla.
Serve como **especificação executável** da migração para React.

## Regra dura

> **`reference/` é SOMENTE CONSULTA. NUNCA importe nada daqui em código de produção**
> (`apps/`, `packages/`). Nada de `import`/`require`/copiar trechos para o app.
> O produto é reconstruído em React conferindo o comportamento contra este protótipo.

## Conteúdo

- **`index.html`** — **SPEC canônico** (versão mais recente e completa do protótipo).
  É o arquivo a consultar ao reconstruir cada feature.
- **`_archive/`** — versões antigas (`index_v*`, `index_legacy_*`), mantidas só para
  histórico. Não são o SPEC.
- `assets/`, `design-system/`, `fonts/`, `ds-tokens.css`, `server/` — recursos do
  protótipo, apenas para consulta.

Roadmap da migração: ver [`../MIGRATION_PLAN.md`](../MIGRATION_PLAN.md).
