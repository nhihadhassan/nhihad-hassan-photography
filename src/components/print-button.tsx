"use client";

import { Printer } from "lucide-react";

/** Triggers the browser print dialog (Save as PDF). Hidden when printing. */
export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        "inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/20 px-5 text-sm font-medium text-ink/80 transition hover:border-ink/40 hover:text-ink print:hidden " +
        (className ?? "")
      }
    >
      <Printer className="size-4" aria-hidden="true" />
      Print / Save as PDF
    </button>
  );
}
