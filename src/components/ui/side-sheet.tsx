"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Right-anchored side sheet. Used where the spec wants a record opened without
 * navigating away (calendar shoot, quick record peek). Closes on Escape and on
 * backdrop click; traps initial focus on the panel.
 */
export function SideSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-admin-ink/30 motion-safe:animate-[toast-in_150ms_ease-out]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative h-full w-full max-w-md overflow-y-auto border-l border-admin-line-strong bg-admin-surface shadow-2xl outline-none motion-safe:animate-[sheet-in_220ms_ease-out]",
          className,
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-admin-line bg-admin-surface/95 px-5 py-4 backdrop-blur">
          <h2 className="admin-display text-lg text-admin-ink">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1.5 text-admin-muted hover:bg-admin-raise hover:text-admin-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
