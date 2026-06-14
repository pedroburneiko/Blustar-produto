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
    }
  }

  return doc;
}

/** Semeia masters de template (subárvore de layers; id da layer = slotKey). */
function seedMasters(doc: BrandDocument): void {
  const title = createLayer('text', 'master', { name: 'Título', text: 'Título do componente', font: { size: '1.5rem', weight: 700 } });
  const sub = createLayer('text', 'master', { name: 'Subtítulo', text: 'Subtítulo editável', style: { color: 'var(--bs-text-muted)' } });
  const btn = createLayer('button', 'master', { name: 'CTA', label: 'Ação', variant: 'primary' });
  const group = createLayer('group', 'master', { name: 'Hero' });
  group.children = [title.id, sub.id, btn.id];
  for (const l of [title, sub, btn]) l.parentId = group.id;

  const hero: TemplateMaster = {
    name: 'Hero',
    label: 'Hero',
    category: 'layout',
    rootId: group.id,
    layers: { [group.id]: group, [title.id]: title, [sub.id]: sub, [btn.id]: btn },
  };
  doc.templates.masters[hero.name] = hero;
}

/** Semeia uma página com layers ABSOLUTAS (rect x/y/w/h) para o M4. */
function seedFreeCanvas(doc: BrandDocument, page: Page): void {
  const pid = page.id;
  // Instância de componente (M6 D) — renderiza o master Hero, posicionada.
  attach(doc, createLayer('component', pid, {
    name: 'Hero',
    templateName: 'Hero',
    category: 'layout',
    rect: { x: 440, y: 60, w: 300, h: 200 },
    overrides: {},
  }));
  attach(doc, createLayer('shape', pid, {
    name: 'Bloco turquesa',
    shape: 'rect',
    style: { background: 'var(--bs-brand)' },
    rect: { x: 80, y: 60, w: 220, h: 140 },
  }));
  attach(doc, createLayer('text', pid, {
    name: 'Título',
    text: 'Arraste-me',
    font: { size: '2rem', weight: 700 },
    rect: { x: 360, y: 80, w: 320, h: 60 },
  }));
  attach(doc, createLayer('button', pid, {
    name: 'Botão',
    variant: 'primary',
    label: 'Ação',
    rect: { x: 360, y: 180, w: 160, h: 48 },
  }));
  attach(doc, createLayer('image', pid, {
    name: 'Imagem',
    src: '',
    rect: { x: 120, y: 260, w: 280, h: 180 },
  }));
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
