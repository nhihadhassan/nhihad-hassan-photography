"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  photoId: string;
  className?: string;
};

export function PhotoShareButton({ photoId, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?p=${encodeURIComponent(photoId)}`;
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
      // Silent fail — visitor can still copy the URL from the address bar.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      aria-label="Copy a link to this photo"
      title={copied ? "Link copied" : "Copy a link to this photo"}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border backdrop-blur transition",
        copied
          ? "border-copper/80 bg-copper text-ink"
          : "border-soft-white/12 bg-ink/55 text-soft-white hover:border-soft-white/30 hover:bg-soft-white hover:text-ink",
        className,
      )}
    >
      {copied ? (
        <Check className="size-5" aria-hidden="true" />
      ) : (
        <Share2 className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
