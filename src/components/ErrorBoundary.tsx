/** ErrorBoundary — prevents white screens, offers a safe fallback (Life OS canon, light skin) */
import * as React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps { children?: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Citadelle app error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center bg-[var(--theme-bg)]">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mb-5">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-stone-800 tracking-tight mb-1">This app hit a snag</h2>
          <p className="text-sm text-stone-500 max-w-sm mb-6 leading-relaxed">
            The rest of your Citadelle is unaffected — only this window needs a reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-[var(--panel-border)] text-stone-700 hover:bg-stone-50 transition-all font-semibold text-sm shadow-sm"
          >
            <RefreshCcw className="w-4 h-4" /> Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
