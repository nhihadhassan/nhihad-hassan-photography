"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tap to copy a value (email, phone, reference). Used in the facts rail. */
export function CopyText({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore: value is still selectable on screen
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${value}`}
      className={cn(
        "group inline-flex max-w-full items-center gap-1.5 text-left text-sm text-admin-ink hover:text-admin-accent",
        className,
      )}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-admin-status-positive" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5 shrink-0 text-admin-muted opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
      )}
    </button>
  );
}
