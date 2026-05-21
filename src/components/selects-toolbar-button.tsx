"use client";

import { Heart } from "lucide-react";
import { useSelects } from "@/components/selects-provider";
import { cn } from "@/lib/utils";

export function SelectsToolbarButton({ className }: { className?: string }) {
  const { count, openDrawer } = useSelects();
  const hasSelects = count > 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`Review ${count} selected photo${count === 1 ? "" : "s"}`}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm transition",
        hasSelects
          ? "border-copper bg-copper text-ink hover:bg-beige"
          : "border-ink/12 text-ink/68 hover:bg-ink hover:text-soft-white",
        className,
      )}
    >
      <Heart className={cn("size-4", hasSelects ? "fill-current" : "")} aria-hidden="true" />
      {hasSelects ? `Review selects (${count})` : "My selects"}
    </button>
  );
}
