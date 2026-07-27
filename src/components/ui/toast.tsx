"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  message: string;
  tone: "default" | "positive" | "danger";
  undo?: () => void;
};

type ToastInput = {
  message: string;
  tone?: Toast["tone"];
  /** When set, the toast shows an Undo action for 6 seconds. */
  onUndo?: () => void;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const UNDO_MS = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ message, tone = "default", onUndo }: ToastInput) => {
      const id = ++seq.current;
      setToasts((current) => [...current, { id, message, tone, undo: onUndo }]);
      const timer = setTimeout(() => dismiss(id), UNDO_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-lg motion-safe:animate-[toast-in_180ms_ease-out]",
              t.tone === "positive" &&
                "border-admin-status-positive/25 bg-admin-status-positive-tint text-admin-status-positive",
              t.tone === "danger" &&
                "border-admin-status-danger/25 bg-admin-status-danger-tint text-admin-status-danger",
              t.tone === "default" &&
                "border-admin-line-strong bg-admin-ink text-admin-surface",
            )}
          >
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.undo ? (
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                onClick={() => {
                  t.undo?.();
                  dismiss(t.id);
                }}
              >
                Undo
              </button>
            ) : (
              <button
                type="button"
                aria-label="Dismiss"
                className="shrink-0 rounded-md px-2 py-1 text-xs opacity-70 hover:opacity-100"
                onClick={() => dismiss(t.id)}
              >
                Close
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
