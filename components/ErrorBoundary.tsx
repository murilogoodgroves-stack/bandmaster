import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BANDMATE ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-brand-bg-outer text-gray-200 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-brand-bg-card border border-brand-border rounded-xl p-8 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-400 mb-6">
              BANDMATE encountered an unexpected error. Your data in local storage is preserved.
            </p>
            <div className="flex gap-3 justify-center mb-6">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-dark text-white rounded-lg text-sm font-medium transition"
              >
                Reload application
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-brand-bg-content hover:bg-white/5 text-gray-300 rounded-lg text-sm font-medium border border-brand-border transition"
              >
                Try to resume
              </button>
            </div>
            {this.state.error && (
              <details className="text-left bg-brand-bg-content p-3 rounded-lg border border-brand-border/60 text-xs text-gray-400 overflow-x-auto">
                <summary className="cursor-pointer font-mono font-medium text-gray-300 mb-1">
                  Error details
                </summary>
                <p className="text-red-400 font-mono mt-1">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[10px] text-gray-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
