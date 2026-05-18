'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const VARIANT_BG: Record<ToastVariant, string> = {
  success: 'bg-emerald-600',
  info: 'bg-blue-600',
  warning: 'bg-amber-500',
  error: 'bg-red-600',
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed z-[200] flex flex-col gap-2 px-4 pointer-events-none bottom-4 left-0 right-0 md:bottom-auto md:top-4 md:left-auto md:right-4 md:max-w-sm md:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full md:w-auto px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg ${VARIANT_BG[toast.variant]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}
