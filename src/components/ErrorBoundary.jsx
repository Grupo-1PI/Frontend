import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-5">
          <div className="w-full max-w-md text-center">
            <div className="mb-4 flex items-center justify-center gap-3 text-status-cancelado">
              <AlertTriangle size={28} />
              <span className="font-semibold">Erro inesperado</span>
            </div>
            <p className="text-[13.5px] text-brand-muted mb-6">
              Ocorreu um erro ao carregar esta página.
            </p>
            <button
              onClick={this.resetError}
              className="btn-login"
            >
              <RefreshCw size={16} className="mr-2" />
              Tentar novamente
            </button>
            {import.meta.env.MODE === "development" && this.state.error && (
              <details className="mt-6 text-left text-xs text-brand-muted">
                <summary className="cursor-pointer mb-2">Detalhes do erro (dev)</summary>
                <pre className="bg-brand-bg p-3 rounded overflow-auto max-h-64">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };
}

export default ErrorBoundary;