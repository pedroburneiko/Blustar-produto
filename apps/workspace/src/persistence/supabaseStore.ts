import { createClient } from "@supabase/supabase-js";
import {
  type DocumentStore,
  type BrandDocument,
  serializeDocument,
  deserializeDocument,
} from "@blustar/core";

/**
 * Adapter Supabase do DocumentStore. Lê a config de variáveis de ambiente
 * (NUNCA hardcode): VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
 * Sem env → não configurado (getDocumentStore retorna null e o app usa o
 * documento de exemplo em memória).
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const TABLE = "documents";

export function isPersistenceConfigured(): boolean {
  return !!URL && !!ANON;
}

export function getDocumentStore(): DocumentStore | null {
  if (!URL || !ANON) return null;
  const client = createClient(URL, ANON);

  return {
    async load(id: string): Promise<BrandDocument | null> {
      const { data, error } = await client.from(TABLE).select("data").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? deserializeDocument(data.data) : null;
    },
    async save(id: string, doc: BrandDocument): Promise<void> {
      const { error } = await client.from(TABLE).upsert({
        id,
        name: doc.name,
        data: serializeDocument(doc),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
  };
}
