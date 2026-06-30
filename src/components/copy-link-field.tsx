"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/** Read-only URL with a copy button and an open-in-new-tab link. */
export function CopyLinkField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-h-10 min-w-0 flex-1 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink/80 outline-none"
      />
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-10 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface transition hover:bg-[#2e2822]"
      >
        {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-ink/12 px-3 text-sm text-admin-ink/65 transition hover:bg-admin-ink/6"
      >
        <ExternalLink className="size-3.5" aria-hidden="true" />
        Open
      </a>
    </div>
  );
}
