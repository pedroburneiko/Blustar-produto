import * as Sentry from "@sentry/react";

/**
 * Monitoramento de erros (Sentry). Config só por env (NUNCA hardcode):
 * VITE_SENTRY_DSN. Sem DSN → inerte (init e captura viram no-op; app roda normal).
 */
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function isMonitoringConfigured(): boolean {
  return !!DSN;
}

/** Inicializa o Sentry (chamar uma vez, no boot). */
export function initMonitoring(): void {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0, // sem performance tracing nesta passada
  });
}

/** Reporta um erro com contexto. No-op se não configurado. */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!DSN) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
