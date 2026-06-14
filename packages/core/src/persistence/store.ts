/**
 * Persistência — contrato agnóstico de backend. O @blustar/core NÃO depende de
 * nenhum SDK (Supabase, etc.); adapters concretos vivem no app/consumidor.
 */
import type { BrandDocument } from '../model/types.js';

/** Armazena/recupera documentos por id. Implementado por um adapter (ex.: Supabase). */
export interface DocumentStore {
  /** Carrega o documento; null se não existir. */
  load(id: string): Promise<BrandDocument | null>;
  /** Persiste o documento (last-write-wins). */
  save(id: string, doc: BrandDocument): Promise<void>;
}

/** Versão de schema atual do documento (espelha BrandDocument.schemaVersion). */
export const DOCUMENT_SCHEMA_VERSION = 1 as const;

/** Serializa o documento para JSON puro (pronto para jsonb). */
export function serializeDocument(doc: BrandDocument): unknown {
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Valida/normaliza dados crus vindos do storage. Retorna null se não for um
 * documento reconhecível ou se a versão de schema for incompatível.
 */
export function deserializeDocument(raw: unknown): BrandDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const doc = raw as Partial<BrandDocument>;
  if (doc.schemaVersion !== DOCUMENT_SCHEMA_VERSION) return null;
  if (!doc.entities || !Array.isArray(doc.boards)) return null;
  return doc as BrandDocument;
}
