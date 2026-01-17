import React from "react";

type Props = {
  children: React.ReactNode;
};

type PersistedErrorReport = {
  at: string;
  url: string;
  userAgent: string;
  message: string;
  stack?: string;
  componentStack?: string;
};

type State = {
  hasError: boolean;
  error?: Error;
  componentStack?: string;
};

const STORAGE_KEY = "brandhub:last_render_error";

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep this console output — it helps debug "Snap, something's wrong" reloads.
    console.error("[ErrorBoundary] Unhandled render error:", error);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);

    // Persist a compact report so if the page reloads/crashes again we still have context.
    const report: PersistedErrorReport = {
      at: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      message: error?.message ?? "Unknown error",
      stack: error?.stack,
      componentStack: info.componentStack,
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(report));
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }

    this.setState({ componentStack: info.componentStack });
  }

  private getReportText() {
    const report: PersistedErrorReport = {
      at: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      message: this.state.error?.message ?? "Unknown error",
      stack: this.state.error?.stack,
      componentStack: this.state.componentStack,
    };
    return JSON.stringify(report, null, 2);
  }

  private async copyReport() {
    const text = this.getReportText();
    try {
      await navigator.clipboard.writeText(text);
      // Non-blocking feedback without adding new UI dependencies
      console.info("[ErrorBoundary] Copied error report to clipboard");
    } catch (e) {
      console.warn("[ErrorBoundary] Failed to copy error report", e);
    }
  }

  render() {
    if (this.state.hasError) {
      const reportText = this.getReportText();
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-2xl w-full rounded-xl border bg-card p-6">
            <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The app hit an unexpected error while rendering. Refreshing may help. If it keeps happening, click “Copy error
              report” and paste it here.
            </p>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="text-xs font-medium text-foreground mb-1">Error message</div>
                <pre className="max-h-28 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {this.state.error?.message}
                </pre>
              </div>

              {this.state.error?.stack ? (
                <div>
                  <div className="text-xs font-medium text-foreground mb-1">Stack</div>
                  <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                    {this.state.error.stack}
                  </pre>
                </div>
              ) : null}

              {this.state.componentStack ? (
                <div>
                  <div className="text-xs font-medium text-foreground mb-1">Component stack</div>
                  <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                    {this.state.componentStack}
                  </pre>
                </div>
              ) : null}

              <div>
                <div className="text-xs font-medium text-foreground mb-1">Full report</div>
                <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {reportText}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
              <button
                className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium text-foreground"
                onClick={() => void this.copyReport()}
              >
                Copy error report
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
