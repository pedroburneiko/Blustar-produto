import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  useEditorStore,
  editorTemporal,
  undo,
  redo,
  resetEditor,
  createDocument,
  createLayer,
  setIdFactory,
  resetIdFactory,
} from "../index.js";

const S = () => useEditorStore.getState();
const past = () => editorTemporal.getState().pastStates.length;
const future = () => editorTemporal.getState().futureStates.length;

/** Página atual (criada por createDocument). */
function pageId(): string {
  return Object.keys(S().document.entities.pages)[0];
}

/** Adiciona uma layer absoluta e retorna o id. */
function addAbsolute(): string {
  const layer = createLayer("shape", pageId(), { rect: { x: 0, y: 0, w: 100, h: 100 } });
  S().addLayer(layer);
  return layer.id;
}

beforeEach(() => {
  vi.useFakeTimers();
  resetIdFactory();
  let n = 0;
  setIdFactory((p) => `${p}_${++n}`);
  resetEditor(createDocument());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("histórico — estrutural (imediato)", () => {
  it("cada mutação estrutural vira 1 entrada e undo reverte", () => {
    const before = past();
    const id = addAbsolute(); // imediato
    expect(past()).toBe(before + 1);
    S().moveLayer(id, { x: 50, y: 30 }); // imediato
    expect(past()).toBe(before + 2);
    expect(S().document.entities.layers[id].rect).toMatchObject({ x: 50, y: 30 });

    undo(); // reverte o move
    expect(S().document.entities.layers[id].rect).toMatchObject({ x: 0, y: 0 });
    undo(); // reverte o add
    expect(S().document.entities.layers[id]).toBeUndefined();
  });

  it("undo logo após uma mutação não colide (sem esperar debounce)", () => {
    const id = addAbsolute();
    S().resizeLayer(id, { x: 0, y: 0, w: 200, h: 200 });
    // undo imediato, sem avançar timers — não deve perder o passo
    undo();
    expect(S().document.entities.layers[id].rect).toMatchObject({ w: 100, h: 100 });
  });

  it("redo refaz o passo desfeito", () => {
    const id = addAbsolute();
    S().moveLayer(id, { x: 10, y: 10 });
    undo();
    expect(S().document.entities.layers[id].rect).toMatchObject({ x: 0, y: 0 });
    redo();
    expect(S().document.entities.layers[id].rect).toMatchObject({ x: 10, y: 10 });
  });
});

describe("histórico — texto/contínuo (coalescido)", () => {
  it("burst de texto vira 1 entrada e undo reverte o burst inteiro", () => {
    const layer = createLayer("text", pageId(), { text: "" });
    S().addLayer(layer);
    const base = past();

    for (const ch of ["O", "l", "á", "!"]) {
      S().updateLayerText(layer.id, { text: S().document.entities.layers[layer.id].text + ch });
    }
    // ainda não registrou (debounce pendente)
    expect(past()).toBe(base);
    vi.advanceTimersByTime(600);
    expect(past()).toBe(base + 1);
    expect(S().document.entities.layers[layer.id].text).toBe("Olá!");

    undo();
    expect(S().document.entities.layers[layer.id].text).toBe("");
  });

  it("undo faz flush do registro pendente antes de desfazer", () => {
    const layer = createLayer("text", pageId(), { text: "ab" });
    S().addLayer(layer);
    S().updateLayerText(layer.id, { text: "abc" }); // pendente (não avança timer)
    undo(); // flush + undo → reverte a edição de texto
    expect(S().document.entities.layers[layer.id].text).toBe("ab");
  });

  it("nudge consecutivo coalesce em 1 entrada", () => {
    const id = addAbsolute();
    const base = past();
    S().nudgeLayer(id, 1, 0);
    S().nudgeLayer(id, 1, 0);
    S().nudgeLayer(id, 1, 0);
    expect(past()).toBe(base); // debounce pendente
    vi.advanceTimersByTime(600);
    expect(past()).toBe(base + 1);
    expect(S().document.entities.layers[id].rect!.x).toBe(3);
    undo();
    expect(S().document.entities.layers[id].rect!.x).toBe(0);
  });
});

describe("histórico — efêmero fora do undo", () => {
  it("seleção não cria entrada", () => {
    const id = addAbsolute();
    const base = past();
    S().selectLayers([id]);
    S().clearSelection();
    expect(past()).toBe(base);
  });

  it("gesto (begin/update/end interaction) não cria entrada; só o commit", () => {
    const id = addAbsolute();
    const base = past();
    S().beginInteraction({ kind: "drag", layerId: id, preview: { x: 0, y: 0, w: 100, h: 100 } });
    S().updateInteraction({ preview: { x: 40, y: 40, w: 100, h: 100 } });
    S().endInteraction();
    expect(past()).toBe(base); // nenhum commit no documento
    S().moveLayer(id, { x: 40, y: 40 }); // commit do gesto = 1 entrada
    expect(past()).toBe(base + 1);
  });

  it("setSaveStatus não cria entrada", () => {
    const base = past();
    S().setSaveStatus("saving");
    S().setSaveStatus("saved");
    expect(past()).toBe(base);
  });
});

describe("ações de página/layer são undoable", () => {
  it("duplicateLayer e undo", () => {
    const id = addAbsolute();
    const base = past();
    const nid = S().duplicateLayer(id);
    expect(nid).toBeTruthy();
    expect(Object.keys(S().document.entities.layers).length).toBe(2);
    undo();
    expect(Object.keys(S().document.entities.layers).length).toBe(1);
  });

  it("removePage e undo restaura página + layers", () => {
    const boardId = S().ui.activeBoardId!;
    const sub = S().addSubPage(pageId(), "Sub");
    const base = past();
    expect(sub).toBeTruthy();
    const pagesBefore = S().document.entities.boards[boardId].pages.length;
    S().removePage(sub!.id);
    expect(S().document.entities.boards[boardId].pages.length).toBe(pagesBefore - 1);
    undo();
    expect(S().document.entities.boards[boardId].pages.length).toBe(pagesBefore);
    expect(past()).toBe(base - 0); // base inalterada após undo do remove
  });

  it("undo de edição de token reverte o override", () => {
    S().setToken("--bs-brand", "#ff0000");
    expect(S().document.tokens.vars["--bs-brand"]).toBe("#ff0000");
    undo();
    expect(S().document.tokens.vars["--bs-brand"]).toBeUndefined();
  });
});
