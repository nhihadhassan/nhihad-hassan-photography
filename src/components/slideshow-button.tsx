"use client";

import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export const START_SLIDESHOW_EVENT = "gallery:start-slideshow";

export function SlideshowButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(START_SLIDESHOW_EVENT))}
      title="Play a full-screen slideshow"
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/12 px-3 text-sm text-ink/68 transition hover:bg-ink hover:text-soft-white",
        className,
      )}
    >
      <Play className="size-4" aria-hidden="true" />
      Slideshow
    </button>
  );
}
