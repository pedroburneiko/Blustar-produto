import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@blustar/ui";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Captura erros de render da árvore e mostra um fallback amigável (em vez de
 * tela branca). Ponto natural para enviar ao Sentry depois.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // TODO(M7 Sentry): reportar erro + info aqui.
    console.error("Erro de render capturado pelo ErrorBoundary:", error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--bs-space-4)",
            background: "var(--bs-bg)",
            color: "var(--bs-text)",
            fontFamily: "var(--bs-font)",
            padding: "var(--bs-space-7)",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24 }}>Algo deu errado</h1>
          <p style={{ margin: 0, color: "var(--bs-text-muted)", maxWidth: 420 }}>
            Ocorreu um erro inesperado. Você pode recarregar para tentar de novo.
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
