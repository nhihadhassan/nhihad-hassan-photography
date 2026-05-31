"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioCard } from "@/lib/portfolio";
import { categoryLabels } from "@/data/photography";
import { cn, formatDisplayDate } from "@/lib/utils";

const aspectClasses: Record<PortfolioCard["orientation"], string> = {
  portrait: "aspect-[4/5]",
  landscape: "aspect-[16/11]",
  square: "aspect-square",
};

const TEXT_SHADOW = "[text-shadow:0_1px_10px_rgba(0,0,0,0.7)]";

/**
 * Portfolio card. The image stands on its own; the meta (category, title,
 * date, location) is hidden until the visitor hovers (desktop) or taps
 * (mobile) — the same reveal interaction used by the pricing cards.
 */
export function PhotoCard({
  item,
  priority = false,
  className,
}: {
  item: PortfolioCard;
  priority?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const meta = [item.date ? formatDisplayDate(item.date) : null, item.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn("group", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[2px] bg-soft-white/8",
          aspectClasses[item.orientation],
        )}
      >
        <Image
          src={item.imageUrl}
          alt={item.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
          unoptimized
        />

        {/* Darkening that fades in with the meta so the text stays legible. */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />

        {item.featured ? (
          <span className="absolute left-3 top-3 rounded-full border border-soft-white/20 bg-ink/50 px-3 py-1 text-xs text-soft-white/80 backdrop-blur">
            Featured
          </span>
        ) : null}

        {/* Meta overlay — hidden until hover/tap. */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 transition-all duration-300 ease-out sm:p-5",
            open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          <div className="min-w-0">
            <p className={cn("text-xs uppercase tracking-[0.18em] text-copper", TEXT_SHADOW)}>
              {categoryLabels[item.category]}
            </p>
            <h3 className={cn("mt-2 font-serif text-2xl leading-tight text-soft-white", TEXT_SHADOW)}>
              {item.title}
            </h3>
            {meta ? (
              <p className={cn("mt-1.5 text-sm text-soft-white/80", TEXT_SHADOW)}>{meta}</p>
            ) : null}
          </div>
          <Link
            href={`/portfolio/${item.category}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${categoryLabels[item.category]} portfolio`}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-soft-white/30 text-soft-white/85 transition hover:border-copper hover:text-copper"
          >
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
