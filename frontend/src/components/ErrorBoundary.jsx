import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("VibeSync UI error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
      return (
        <div
          className="min-h-dvh bg-[#0b0e14] text-slate-200 flex flex-col items-center justify-center p-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-slate-400 text-sm text-center max-w-md mb-6">
            The app hit an unexpected error. Reload usually fixes it. If it keeps happening, try signing in
            again.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500"
            >
              Reload page
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.clear();
                } catch (_) {
                  /* ignore */
                }
                window.location.href = `${basePath}/#/`;
              }}
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/15"
            >
              Back to login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
