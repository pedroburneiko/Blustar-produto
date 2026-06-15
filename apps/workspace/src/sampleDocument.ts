/**
 * Documento de exemplo (placeholder) para o M1 — só dá conteúdo à moldura
 * (rail de boards + sidebar de páginas). NÃO é dado real e não vem do SPEC;
 * será substituído por carga/persistência real no M7.
 */
import {
  createBoard,
  createDocument,
  createLayer,
  createPage,
  type BoardKind,
  type BrandDocument,
  type Layer,
  type LayerOverride,
  type Page,
  type TemplateMaster,
} from '@blustar/core';

interface BoardSeed {
  kind: BoardKind;
  name: string;
  pages: string[];
}

const SEED: BoardSeed[] = [
  { kind: 'home', name: 'Home', pages: ['Home'] },
  {
    kind: 'guide',
    name: 'Guide',
    pages: ['Introduction', 'Foundations', 'Logo', 'Color', 'Typography'],
  },
  { kind: 'design-system', name: 'Design System', pages: ['Components', 'Tokens'] },
];

/** Monta um BrandDocument vazio com boards/páginas de exemplo. */
export function sampleDocument(): BrandDocument {
  // Começa de um documento limpo e descarta o board/página default.
  const doc = createDocument('Brand System BluStar');
  doc.boards = [];
  doc.entities = { boards: {}, pages: {}, layers: {} };
  seedMasters(doc);

  for (const seed of SEED) {
    const board = createBoard(seed.kind, seed.name);
    doc.entities.boards[board.id] = board;
    doc.boards.push(board.id);

    for (const pageName of seed.pages) {
      const page = createPage(board.id, pageName);
      doc.entities.pages[page.id] = page;
      board.pages.push(page.id);
      if (seed.kind === 'home' && board.pages.length === 1) {
        seedLayers(doc, page);
      }
    }

    // Página dedicada de manipulação direta (M4) no board Home.
    if (seed.kind === 'home') {
      const free = createPage(board.id, 'Canvas livre');
      doc.entities.pages[free.id] = free;
      board.pages.push(free.id);
      seedFreeCanvas(doc, free);

      // Cena de demo do pitch: 1 master × várias instâncias (propagação).
      const vitrine = createPage(board.id, 'Vitrine');
      doc.entities.pages[vitrine.id] = vitrine;
      board.pages.push(vitrine.id);
      seedVitrine(doc, vitrine);
    }
  }

  return doc;
}

/** Monta um master a partir de um grupo-raiz + filhos. */
function makeMaster(name: string, label: string, category: string, children: Layer[]): TemplateMaster {
  const group = createLayer('group', 'master', { name });
  group.children = children.map((c) => c.id);
  for (const c of children) c.parentId = group.id;
  const layers: Record<string, Layer> = { [group.id]: group };
  for (const c of children) layers[c.id] = c;
  return { name, label, category, rootId: group.id, layers };
}

/** Semeia masters de template (subárvore de layers; id da layer = slotKey). */
function seedMasters(doc: BrandDocument): void {
  const masters: TemplateMaster[] = [
    makeMaster('Hero', 'Hero', 'Layout', [
      createLayer('text', 'master', { name: 'Título', text: 'Título do componente', font: { size: '1.5rem', weight: 700 } }),
      createLayer('text', 'master', { name: 'Subtítulo', text: 'Subtítulo editável', style: { color: 'var(--bs-text-muted)' } }),
      createLayer('button', 'master', { name: 'CTA', label: 'Ação', variant: 'primary' }),
    ]),
    makeMaster('CTA', 'CTA', 'Conteúdo', [
      createLayer('text', 'master', { name: 'Chamada', text: 'Pronto para começar?', font: { size: '1.25rem', weight: 700 } }),
      createLayer('button', 'master', { name: 'Botão', label: 'Comece agora', variant: 'primary' }),
    ]),
    makeMaster('Card', 'Plano', 'Layout', [
      createLayer('shape', 'master', { name: 'Mídia', shape: 'rect', style: { background: 'var(--bs-brand)' }, box: { height: '84px' } }),
      createLayer('text', 'master', { name: 'Título', text: 'Plano', font: { size: '1.125rem', weight: 700 } }),
      createLayer('text', 'master', { name: 'Preço', text: 'R$ 49 / mês', style: { color: 'var(--bs-text-muted)' } }),
      createLayer('button', 'master', { name: 'CTA', label: 'Assinar', variant: 'secondary' }),
    ]),
  ];
  for (const m of masters) doc.templates.masters[m.name] = m;
}

/**
 * Semeia o playground de manipulação direta (M4/M6.E): layers ABSOLUTAS sem
 * sobreposição, dispostas no frame 900×560 — um primitivo de cada tipo + uma
 * instância de componente, com espaço livre para arrastar/redimensionar.
 */
function seedFreeCanvas(doc: BrandDocument, page: Page): void {
  const pid = page.id;
  attach(doc, createLayer('shape', pid, {
    name: 'Bloco turquesa',
    shape: 'rect',
    style: { background: 'var(--bs-brand)' },
    rect: { x: 60, y: 60, w: 220, h: 140 },
  }));
  attach(doc, createLayer('text', pid, {
    name: 'Título',
    text: 'Arraste-me',
    font: { size: '2rem', weight: 700 },
    rect: { x: 320, y: 60, w: 360, h: 60 },
  }));
  attach(doc, createLayer('button', pid, {
    name: 'Botão',
    variant: 'primary',
    label: 'Ação',
    rect: { x: 320, y: 150, w: 160, h: 48 },
  }));
  attach(doc, createLayer('image', pid, {
    name: 'Imagem',
    src: '',
    rect: { x: 60, y: 240, w: 280, h: 180 },
  }));
  // Instância de componente (M6 D) — renderiza o master Hero, posicionada.
  attach(doc, createLayer('component', pid, {
    name: 'Hero',
    templateName: 'Hero',
    category: 'layout',
    rect: { x: 380, y: 240, w: 320, h: 200 },
    overrides: {},
  }));
}

/** id do slot (layer do master) pelo nome — para endereçar overrides no seed. */
function cardSlot(doc: BrandDocument, name: string): string {
  const master = doc.templates.masters['Card'];
  return Object.values(master.layers).find((l) => l.name === name)?.id ?? '';
}

/**
 * Cena de demo do pitch: 6 instâncias do master `Card` num grid 3×2 (frame
 * 900×560). Quatro herdam puro; duas carregam override (título/cor) — assim
 * editar o master propaga aos herdados, mas o override vence nas customizadas.
 */
function seedVitrine(doc: BrandDocument, page: Page): void {
  const pid = page.id;
  const titleSlot = cardSlot(doc, 'Título');
  const mediaSlot = cardSlot(doc, 'Mídia');

  const W = 260;
  const H = 230;
  const xs = [35, 320, 605];
  const ys = [38, 292];

  let i = 0;
  for (const y of ys) {
    for (const x of xs) {
      i += 1;
      const overrides: Record<string, LayerOverride> = {};
      if (i === 2) {
        // instância customizada: título próprio + mídia navy (override vence)
        overrides[titleSlot] = { text: 'Plano Pro' };
        overrides[mediaSlot] = { style: { background: 'var(--bs-azul-profundo)' } };
      }
      if (i === 5) {
        overrides[titleSlot] = { text: 'Plano Free' };
      }
      attach(doc, createLayer('component', pid, {
        name: `Card ${i}`,
        templateName: 'Card',
        category: 'Layout',
        rect: { x, y, w: W, h: H },
        overrides,
      }));
    }
  }
}

/** Registra a layer no documento (em page.roots ou nos filhos do pai). */
function attach(doc: BrandDocument, layer: Layer, parent?: Layer): Layer {
  doc.entities.layers[layer.id] = layer;
  if (parent) {
    layer.parentId = parent.id;
    parent.children.push(layer.id);
  } else {
    doc.entities.pages[layer.pageId].roots.push(layer.id);
  }
  return layer;
}

/** Semeia uma página com um placeholder de cada tipo de layer (M2). */
function seedLayers(doc: BrandDocument, page: Page): void {
  const pid = page.id;

  attach(doc, createLayer('component', pid, { name: 'Header', templateName: 'HeaderBlock', category: 'Layout' }));

  attach(doc, createLayer('text', pid, { name: 'Título', text: 'Brand System BluStar', font: { size: '40px', weight: 700 } }));

  attach(doc, createLayer('text', pid, {
    name: 'Parágrafo',
    text: 'Esta página é um placeholder do M2 — cada bloco abaixo é uma layer do modelo, renderizada a partir da store. Clique para selecionar.',
    font: { size: '16px' },
    style: { color: 'var(--bs-text-muted)' },
  }));

  attach(doc, createLayer('image', pid, { name: 'Imagem', src: '', box: { width: '360px', height: '200px' } }));

  attach(doc, createLayer('button', pid, { name: 'Botão', variant: 'primary', label: 'Saiba mais' }));

  attach(doc, createLayer('shape', pid, {
    name: 'Forma',
    shape: 'rect',
    style: { background: 'var(--bs-brand)' },
    box: { width: '120px', height: '120px' },
  }));

  // Grupo com dois filhos (grid 2 colunas).
  const group = attach(doc, createLayer('group', pid, { name: 'Grupo', box: { cols: 2, gap: { col: '16px', row: '16px' } } }));
  attach(doc, createLayer('shape', pid, { name: 'Círculo', shape: 'ellipse', style: { background: 'var(--bs-azul-horizonte)' }, box: { height: '96px' } }), group);
  attach(doc, createLayer('shape', pid, { name: 'Retângulo', shape: 'rect', style: { background: 'var(--bs-surface-2)' }, box: { height: '96px' } }), group);

  attach(doc, createLayer('video', pid, { name: 'Vídeo', src: '', box: { width: '360px', height: '200px' } }));
}
