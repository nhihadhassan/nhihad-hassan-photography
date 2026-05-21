"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type CopyLinkButtonProps = {
  className?: string;
  label?: string;
  copiedLabel?: string;
};

export function CopyLinkButton({
  className,
  label = "Share",
  copiedLabel = "Link copied",
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Silent fail — user can still copy URL from the address bar.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className={
        className ??
        "inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/12 px-3 text-sm text-ink/68 transition hover:bg-ink hover:text-soft-white"
      }
    >
      {copied ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Share2 className="size-4" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}
