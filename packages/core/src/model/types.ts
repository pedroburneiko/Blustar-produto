/**
 * @blustar/core — modelo de dados do produto BluStar.
 *
 * Reconstrução estruturada do SPEC (protótipo vanilla em `reference/index.html`),
 * que hoje guarda o estado como blobs de innerHTML no localStorage. Aqui o
 * documento vira um modelo NORMALIZADO (entidades por id) — pré-requisito para a
 * edição em React, seleção O(1) e undo/redo confiável.
 *
 * Terminologia (mapeada ao SPEC):
 *   - Board  = "world" do SPEC (home / guide / design-system).
 *   - Page   = página navegável dentro de um board (data-page).
 *   - Layer  = elemento do canvas (componente/grupo/texto/imagem/forma/...).
 */

/** Identificador opaco de entidade. */
export type Id = string;

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------

/** Raiz do documento — tudo que é persistido/historiável vive aqui. */
export interface BrandDocument {
  id: Id;
  /** Versão do schema do modelo; permite migração segura no futuro. */
  schemaVersion: 1;
  name: string;
  /** Ordem dos boards (worlds). */
  boards: Id[];
  /** Entidades normalizadas (dicionários por id). */
  entities: {
    boards: Record<Id, Board>;
    pages: Record<Id, Page>;
    layers: Record<Id, Layer>;
  };
  /** Tokens de marca editáveis por documento (vars de :root no SPEC). Undoable. */
  tokens: DesignTokenOverrides;
  /** Registro de templates (masters + overrides do SPEC). Undoable. */
  templates: TemplateRegistry;
}

/** = "world" do SPEC. Superfície de topo que agrupa páginas. */
export interface Board {
  id: Id;
  kind: BoardKind;
  name: string;
  /** Ordem das páginas do board. */
  pages: Id[];
}

export type BoardKind = 'home' | 'guide' | 'design-system';

/** Página navegável dentro de um board (data-page no SPEC). */
export interface Page {
  id: Id;
  boardId: Id;
  name: string;
  /** Sub-páginas: id da página-mãe (data-parent no SPEC) ou null no topo. */
  parentId: Id | null;
  locked: boolean;
  /** Layers de topo da página, em ordem. */
  roots: Id[];
}

// ---------------------------------------------------------------------------
// Layers (união discriminada por `type`)
// ---------------------------------------------------------------------------

/** Campos comuns a toda layer. */
export interface LayerBase {
  id: Id;
  pageId: Id;
  parentId: Id | null;
  /** Filhos em ordem (z-order = ordem do array). */
  children: Id[];
  name: string;
  locked: boolean;
  visible: boolean;
  /** Caixa/layout (props observadas em .praia-component, linhas 8829-8875 do SPEC). */
  box?: LayerBox;
  /** Aparência de fundo/cor da própria layer. */
  style?: LayerStyle;
  /**
   * Geometria absoluta (px no frame do canvas). Presente → a layer é posicionada
   * livremente (drag/resize do M4); ausente → render em flow (M2).
   */
  rect?: LayerRect;
}

/** Geometria absoluta no frame do canvas (px). */
export interface LayerRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Direção de uma alça de resize (cantos + bordas). */
export type ResizeDir = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

/** Estado efêmero de um gesto de manipulação direta (fora do undo). */
export interface Interaction {
  kind: 'drag' | 'resize';
  layerId: Id;
  /** Alça em uso (apenas para resize). */
  handle?: ResizeDir;
  /** Geometria ao vivo durante o gesto (preview). */
  preview: LayerRect;
  /** Linhas de alinhamento em que houve snap (para render das guias). */
  guides?: { x: number[]; y: number[] };
}

export interface LayerBox {
  width?: string;
  height?: string;
  padding?: Spacing;
  gap?: { row?: string; col?: string };
  /** Colunas de grid (data-cols no SPEC). */
  cols?: number;
}

export interface LayerStyle {
  background?: string;
  color?: string;
  /** data-bg no SPEC: claro/escuro. */
  bgMode?: 'light' | 'dark';
}

export interface Spacing {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface FontProps {
  family?: string;
  size?: string;
  weight?: number;
}

/** Modo de preenchimento da máscara de imagem (paridade com o SPEC). */
export type MaskFit = 'fill' | 'fit' | 'crop';

/**
 * Crop/box de máscara de imagem (M6.E — paridade de máscaras, estilo Figma).
 * `fill`/`fit` derivam a geometria do frame em render (object-fit cover/contain).
 * `crop` é o ajuste manual: a imagem é desenhada em `natural * scale`, ancorada
 * em `(offsetX, offsetY)` no sistema de coordenadas do frame.
 */
export interface MaskProps {
  /** Modo atual (default `fill`). */
  fit?: MaskFit;
  /** Canto superior-esquerdo da imagem em px do frame (modo `crop`). */
  offsetX?: number;
  offsetY?: number;
  /** Escala sobre o tamanho natural: `displayedW = naturalW * scale` (modo `crop`). */
  scale?: number;
}

/**
 * Override por slot de uma instância de componente: subconjunto editável das
 * props de uma layer do master. Slots não sobrescritos herdam do master.
 */
export interface LayerOverride {
  text?: string;
  label?: string;
  variant?: string;
  src?: string;
  visible?: boolean;
  style?: Partial<LayerStyle>;
  font?: Partial<FontProps>;
}

/**
 * Instância de um template/componente (.praia-component no SPEC). Renderiza a
 * subárvore do master (`templateName`) aplicando `overrides` por slot. Editar o
 * master propaga para todas as instâncias, exceto nos slots sobrescritos.
 */
export interface ComponentLayer extends LayerBase {
  type: 'component';
  templateName: string;
  category?: string;
  /** Overrides por slot (slotKey = id da layer no master). */
  overrides?: Record<Id, LayerOverride>;
}

export interface GroupLayer extends LayerBase {
  type: 'group';
}

export interface TextLayer extends LayerBase {
  type: 'text';
  text: string;
  font?: FontProps;
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  src: string;
  mask?: MaskProps;
}

export interface ShapeLayer extends LayerBase {
  type: 'shape';
  /** Forma geométrica. */
  shape: 'rect' | 'ellipse' | 'line';
}

export interface ButtonLayer extends LayerBase {
  type: 'button';
  variant: string;
  label: string;
  font?: FontProps;
}

export interface VideoLayer extends LayerBase {
  type: 'video';
  src: string;
}

/** União discriminada por `type`. */
export type Layer =
  | ComponentLayer
  | GroupLayer
  | TextLayer
  | ImageLayer
  | ShapeLayer
  | ButtonLayer
  | VideoLayer;

export type LayerType = Layer['type'];

// ---------------------------------------------------------------------------
// Tokens & Templates
// ---------------------------------------------------------------------------

/** Overrides de tokens de marca por documento (vars CSS inline em :root no SPEC). */
export interface DesignTokenOverrides {
  /** Ex.: '--bs-brand' → '#3FCCE3', '--type-h1-size' → '56px'. */
  vars: Record<string, string>;
}

/** Registro de templates (masters) do documento. */
export interface TemplateRegistry {
  masters: Record<string, TemplateMaster>;
}

/**
 * Master de um template: subárvore de layers (o conteúdo padrão). O `id` de cada
 * layer em `layers` é o **slotKey** usado pelos overrides das instâncias.
 * Editar o master propaga para todas as instâncias (render compõe master+overrides).
 */
export interface TemplateMaster {
  name: string;
  label: string;
  category: string;
  /** Raiz da subárvore do master. */
  rootId: Id;
  /** Layers do master, indexadas por id (= slotKey). */
  layers: Record<Id, Layer>;
}
