/**
 * Factories — criação de entidades do modelo com defaults sãos.
 *
 * O gerador de ids é injetável (`setIdFactory`) para tornar os testes do núcleo
 * de undo (M7) determinísticos.
 */

import type {
  Board,
  BoardKind,
  BrandDocument,
  Id,
  Layer,
  LayerBase,
  LayerType,
  Page,
} from './types.js';

// --- Geração de ids (injetável) -------------------------------------------

type IdFactory = (prefix: string) => Id;

let _counter = 0;
const defaultIdFactory: IdFactory = (prefix) => {
  _counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${_counter.toString(36)}${rand}`;
};

let _idFactory: IdFactory = defaultIdFactory;

/** Substitui o gerador de ids (ex.: sequência determinística em testes). */
export function setIdFactory(fn: IdFactory): void {
  _idFactory = fn;
}

/** Restaura o gerador de ids padrão (útil entre testes). */
export function resetIdFactory(): void {
  _idFactory = defaultIdFactory;
  _counter = 0;
}

export function createId(prefix = 'id'): Id {
  return _idFactory(prefix);
}

// --- Documento -------------------------------------------------------------

/** Cria um documento vazio e válido (um board "guide" com uma página). */
export function createDocument(name = 'Documento sem título'): BrandDocument {
  const board = createBoard('guide', 'Guia');
  const page = createPage(board.id, 'Página 1');
  board.pages.push(page.id);

  return {
    id: createId('doc'),
    schemaVersion: 1,
    name,
    boards: [board.id],
    entities: {
      boards: { [board.id]: board },
      pages: { [page.id]: page },
      layers: {},
    },
    tokens: { vars: {} },
    templates: { masters: {} },
  };
}

export function createBoard(kind: BoardKind, name: string): Board {
  return { id: createId('board'), kind, name, pages: [] };
}

export function createPage(boardId: Id, name: string, parentId: Id | null = null): Page {
  return {
    id: createId('page'),
    boardId,
    name,
    parentId,
    locked: false,
    roots: [],
  };
}

// --- Layers ----------------------------------------------------------------

const typeName: Record<LayerType, string> = {
  component: 'Componente',
  group: 'Grupo',
  text: 'Texto',
  image: 'Imagem',
  shape: 'Forma',
  button: 'Botão',
  video: 'Vídeo',
};

const typeDefaults: { [T in LayerType]: Omit<Extract<Layer, { type: T }>, keyof LayerBase | 'type'> } = {
  component: { templateName: '' },
  group: {},
  text: { text: '' },
  image: { src: '' },
  shape: { shape: 'rect' },
  button: { variant: 'primary', label: 'Botão' },
  video: { src: '' },
};

/**
 * Cria uma layer do tipo dado, com base comum + defaults do tipo, permitindo
 * sobrescrever qualquer campo via `overrides`.
 */
export function createLayer<T extends LayerType>(
  type: T,
  pageId: Id,
  overrides: Partial<Extract<Layer, { type: T }>> = {},
): Extract<Layer, { type: T }> {
  const base: LayerBase = {
    id: createId('layer'),
    pageId,
    parentId: null,
    children: [],
    name: typeName[type],
    locked: false,
    visible: true,
  };

  return {
    ...base,
    type,
    ...(typeDefaults[type] as object),
    ...overrides,
  } as Extract<Layer, { type: T }>;
}
