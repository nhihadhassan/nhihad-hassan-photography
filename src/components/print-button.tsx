"use client";

import { Printer } from "lucide-react";

/** Triggers the browser print dialog (Save as PDF). Hidden when printing. */
export function PrintButton({
  className,
  iconOnly = false,
  filename,
}: {
  className?: string;
  iconOnly?: boolean;
  /**
   * When set, becomes the document title for the duration of the print job so
   * "Save as PDF" suggests it as the filename (browsers append .pdf
   * themselves). Restored once the print dialog closes. Omit for the default,
   * title-based filename.
   */
  filename?: string;
}) {
  const handleClick = () => {
    if (!filename) {
      window.print();
      return;
    }
    const previousTitle = document.title;
    document.title = filename;
    const restore = () => {
      document.title = previousTitle;
    };
    window.addEventListener("afterprint", restore, { once: true });
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={iconOnly ? "Print invoice" : undefined}
      title={iconOnly ? "Print invoice" : undefined}
      className={
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/20 text-sm font-medium text-ink/80 transition hover:border-ink/40 hover:text-ink print:hidden " +
        (iconOnly ? "min-w-11 px-3 " : "px-5 ") +
        (className ?? "")
      }
    >
      <Printer className="size-4" aria-hidden="true" />
      {iconOnly ? null : "Print / Save as PDF"}
    </button>
  );
}
