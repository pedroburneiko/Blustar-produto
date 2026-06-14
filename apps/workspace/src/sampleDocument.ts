/**
 * Documento de exemplo (placeholder) para o M1 — só dá conteúdo à moldura
 * (rail de boards + sidebar de páginas). NÃO é dado real e não vem do SPEC;
 * será substituído por carga/persistência real no M7.
 */
import {
  createBoard,
  createDocument,
  createPage,
  type BoardKind,
  type BrandDocument,
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

  for (const seed of SEED) {
    const board = createBoard(seed.kind, seed.name);
    doc.entities.boards[board.id] = board;
    doc.boards.push(board.id);

    for (const pageName of seed.pages) {
      const page = createPage(board.id, pageName);
      doc.entities.pages[page.id] = page;
      board.pages.push(page.id);
    }
  }

  return doc;
}
