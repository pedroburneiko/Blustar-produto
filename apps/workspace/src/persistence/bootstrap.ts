import { useEditorStore, resetEditor, type DocumentStore } from "@blustar/core";
import { getDocumentStore } from "./supabaseStore";
import { sampleDocument } from "../sampleDocument";

/** id da linha no Supabase (primeira passada: um único documento). */
const DOC_ID = "default";
const AUTOSAVE_MS = 1500;

/**
 * Inicializa a store antes de montar a UI:
 * - Sem Supabase configurado → documento de exemplo em memória (dev sem conta).
 * - Com Supabase → carrega o doc `default` (cria do exemplo se não existir) e
 *   liga o autosave debounced. Falha de rede → cai no exemplo e marca erro.
 */
export async function bootstrap(): Promise<void> {
  const store = getDocumentStore();
  if (!store) {
    resetEditor(sampleDocument());
    return;
  }
  try {
    let doc = await store.load(DOC_ID);
    if (!doc) {
      doc = sampleDocument();
      await store.save(DOC_ID, doc);
    }
    resetEditor(doc);
    useEditorStore.getState().setSaveStatus("saved");
    setupAutosave(store);
  } catch (e) {
    console.error("Persistência: falha ao carregar; usando documento local.", e);
    resetEditor(sampleDocument());
    useEditorStore.getState().setSaveStatus("error");
  }
}

/** Salva o documento (debounced) sempre que o slice `document` muda. */
function setupAutosave(store: DocumentStore): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  useEditorStore.subscribe((state, prev) => {
    if (state.document === prev.document) return; // só mudanças historiáveis
    useEditorStore.getState().setSaveStatus("saving");
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await store.save(DOC_ID, useEditorStore.getState().document);
        useEditorStore.getState().setSaveStatus("saved");
      } catch (e) {
        console.error("Persistência: falha ao salvar.", e);
        useEditorStore.getState().setSaveStatus("error");
      }
    }, AUTOSAVE_MS);
  });
}
