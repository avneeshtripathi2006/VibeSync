import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, variant = "error") => {
    if (!message) return;
    setToast({ message: String(message), variant, id: Date.now() });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          role="status"
          className={`fixed z-[200] left-1/2 -translate-x-1/2 max-w-[min(92vw,24rem)] px-4 py-3 rounded-2xl text-sm font-medium shadow-xl border transition-opacity ${
            toast.variant === "success"
              ? "bottom-24 md:bottom-8 bg-emerald-950/95 text-emerald-100 border-emerald-500/30"
              : "bottom-24 md:bottom-8 bg-red-950/95 text-red-100 border-red-500/30"
          }`}
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return () => {};
  return ctx;
}
