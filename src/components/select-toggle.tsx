"use client";

import { Heart } from "lucide-react";
import { useSelects } from "@/components/selects-provider";
import { cn } from "@/lib/utils";

type SelectToggleProps = {
  photoId: string;
  variant?: "grid" | "lightbox";
  className?: string;
};

export function SelectToggle({ photoId, variant = "grid", className }: SelectToggleProps) {
  const { isSelected, toggle } = useSelects();
  const selected = isSelected(photoId);

  if (variant === "lightbox") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle(photoId);
        }}
        aria-pressed={selected}
        aria-label={selected ? "Remove from favourites" : "Add to favourites"}
        title={selected ? "Remove from favourites" : "Add to favourites"}
        className={cn(
          "flex size-11 items-center justify-center rounded-full border backdrop-blur transition",
          selected
            ? "border-copper/80 bg-copper text-ink"
            : "border-soft-white/12 bg-ink/55 text-soft-white hover:border-soft-white/30 hover:bg-soft-white hover:text-ink",
          className,
        )}
      >
        <Heart
          className={cn("size-5", selected ? "fill-current" : "")}
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(photoId);
      }}
      aria-pressed={selected}
      aria-label={selected ? "Remove from selects" : "Add to selects"}
      className={cn(
        "flex size-10 items-center justify-center rounded-full backdrop-blur transition",
        selected
          ? "bg-copper text-ink shadow-md"
          : "bg-[#f3eee5]/88 text-ink hover:bg-[#f3eee5]",
        // On desktop, hidden until tile hover; always visible on touch
        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
        selected && "sm:opacity-100",
        className,
      )}
    >
      <Heart
        className={cn("size-4", selected ? "fill-current" : "")}
        aria-hidden="true"
      />
    </button>
  );
}
