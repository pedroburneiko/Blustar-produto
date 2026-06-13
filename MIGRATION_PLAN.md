# Plano de Migração — Produto BluStar

Migração do produto a partir do **protótipo vanilla** para **React + TypeScript** no monorepo.

## Princípio

- **O protótipo é o SPEC.** Ele define o comportamento esperado de cada feature.
- **Reconstrução feature por feature** em React, conferindo cada uma contra o protótipo.
- **Nunca big-bang.** Nada de portar o `index.html` inteiro de uma vez. Cada milestone
  entrega uma fatia verificável, com paridade comprovada antes de seguir.
- **`reference/` é só consulta.** O protótipo vive em `reference/` apenas como
  especificação executável. **NUNCA importar `reference/` em código de produção.**

## Roadmap

### M0 — Esqueleto
Modelo de dados (TypeScript) + estado (Zustand) + base de undo. Nenhuma UI ainda;
só o núcleo: tipos de `Document / Page / Board / Layer`, store e fundação do histórico.

### M1 — Moldura
Topbar, sidebar de páginas, inspector e área de canvas — montados com `@blustar/ui`.
Layout vazio/estático, sem renderizar conteúdo do modelo ainda.

### M2 — Canvas (somente leitura)
Renderiza as camadas do modelo na área de canvas + seleção. Sem edição.

### M3 — Inspectors
Editar propriedades pelos inspectors → atualiza o estado → o canvas reflete a mudança.

### M4 — Manipulação direta
Drag, resize, guias e snap diretamente no canvas.

### M5 — Undo/redo robusto
Histórico completo e confiável cobrindo todas as mutações (canvas + inspectors).

### M6 — Features avançadas (paridade)
Máscaras, templates, multi-página, atalhos de teclado e painéis de cor — até atingir
paridade com o protótipo.

### M7 — Produto
Persistência (Supabase), testes do núcleo de undo, CI/CD, Sentry, performance,
estados vazios/erro, acessibilidade.

### M8 — Release
Versionamento, changelog e monitoramento.

## Estrutura

- `packages/tokens` — fonte única de tokens (já pronto).
- `packages/ui` — design system React (já pronto).
- `apps/workspace` — app do produto (alvo da migração).
- `reference/` — **protótipo vanilla (SPEC), somente consulta. NUNCA importar em produção.**
  - `reference/index.html` — **SPEC canônico** (versão mais recente e completa).
  - `reference/_archive/` — versões antigas (`index_v*`, `index_legacy_*`), só histórico.

> Detalhes do M0 (modelo de dados, Zustand, undo/redo) são definidos no plano do M0,
> aprovado antes da implementação.
