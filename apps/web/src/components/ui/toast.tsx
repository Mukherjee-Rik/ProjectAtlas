'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof Info; border: string; text: string; bg: string }
> = {
  success: {
    icon: CheckCircle2,
    border: 'border-atlas-success/40',
    text: 'text-atlas-success',
    bg: 'bg-atlas-success/10',
  },
  error: {
    icon: XCircle,
    border: 'border-atlas-error/40',
    text: 'text-atlas-error',
    bg: 'bg-atlas-error/10',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-atlas-warning/40',
    text: 'text-atlas-warning',
    bg: 'bg-atlas-warning/10',
  },
  info: {
    icon: Info,
    border: 'border-atlas-info/40',
    text: 'text-atlas-info',
    bg: 'bg-atlas-info/10',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 4000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    [],
  );

  const value = useMemo(
    () => ({
      toast,
      success: (message: string) => toast(message, 'success'),
      error: (message: string) => toast(message, 'error', 7000),
      warning: (message: string) => toast(message, 'warning', 5000),
      info: (message: string) => toast(message, 'info', 4000),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* aria-live so screen readers announce results that appear visually. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-auto sm:items-end"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const styles = VARIANT_STYLES[toast.variant];
  const Icon = styles.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border ${styles.border} ${styles.bg} bg-card p-3.5 backdrop-blur-md`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.text}`} aria-hidden="true" />
      <p className="flex-1 text-sm text-foreground">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="allow-small-target shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
