import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type DocumentStore,
  type BrandDocument,
  serializeDocument,
  deserializeDocument,
} from "@blustar/core";

/**
 * Adapter Supabase do DocumentStore com AUTENTICAÇÃO ANÔNIMA.
 * Config só por env (NUNCA hardcode): VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 * Sem env → não configurado (app usa o documento de exemplo em memória).
 *
 * Cada navegador recebe um usuário anônimo (auth.uid()); a RLS por `owner`
 * garante que ele só lê/escreve os próprios documentos. O `id` passado ao
 * DocumentStore é ignorado: trabalhamos com o ÚNICO documento do usuário atual.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const TABLE = "documents";

export function isPersistenceConfigured(): boolean {
  return !!URL && !!ANON;
}

/** Garante uma sessão (cria usuário anônimo na primeira vez). */
async function ensureSession(client: SupabaseClient): Promise<void> {
  const { data } = await client.auth.getSession();
  if (data.session) return;
  const { error } = await client.auth.signInAnonymously();
  if (error) throw error;
}

export function getDocumentStore(): DocumentStore | null {
  if (!URL || !ANON) return null;

  // Cliente carregado sob demanda → @supabase/supabase-js sai do bundle inicial
  // (chunk separado, só baixado quando a persistência é realmente usada).
  let clientPromise: Promise<SupabaseClient> | null = null;
  const getClient = (): Promise<SupabaseClient> => {
    if (!clientPromise) {
      clientPromise = import("@supabase/supabase-js").then((m) => m.createClient(URL!, ANON!));
    }
    return clientPromise;
  };

  // id da linha do usuário atual (descoberto no load ou no primeiro insert)
  let rowId: string | null = null;

  return {
    async load(): Promise<BrandDocument | null> {
      const client = await getClient();
      await ensureSession(client);
      // RLS restringe a owner = auth.uid(); pega o doc mais recente do usuário.
      const { data, error } = await client
        .from(TABLE)
        .select("id, data")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      rowId = data.id;
      return deserializeDocument(data.data);
    },

    async save(_id: string, doc: BrandDocument): Promise<void> {
      const client = await getClient();
      await ensureSession(client);
      const payload = {
        name: doc.name,
        data: serializeDocument(doc),
        updated_at: new Date().toISOString(),
      };
      if (rowId) {
        const { error } = await client.from(TABLE).update(payload).eq("id", rowId);
        if (error) throw error;
        return;
      }
      // primeira gravação: insere (owner = auth.uid() pelo default) e guarda o id
      const { data, error } = await client.from(TABLE).insert(payload).select("id").single();
      if (error) throw error;
      rowId = data.id;
    },
  };
}
