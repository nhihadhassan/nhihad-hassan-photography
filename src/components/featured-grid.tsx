"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioCard } from "@/lib/portfolio";
import { categoryLabels } from "@/data/photography";
import { Reveal } from "@/components/reveal";
import { cn, formatDisplayDate } from "@/lib/utils";

const TEXT_SHADOW = "[text-shadow:0_1px_10px_rgba(0,0,0,0.7)]";

/**
 * One featured photo in the homepage bento. Mirrors PhotoCard: the meta
 * (category, title, date · location) is hidden until hover (desktop) or tap
 * (mobile), so the image leads. The same fields as the portfolio page.
 */
function FeaturedCard({ item }: { item: PortfolioCard }) {
  const [open, setOpen] = useState(false);
  const meta = [item.date ? formatDisplayDate(item.date) : null, item.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className="group relative h-full min-h-72 overflow-hidden rounded-[2px] bg-soft-white/8"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      <Image
        src={item.imageUrl}
        alt={item.alt}
        fill
        sizes="(min-width: 768px) 40vw, 100vw"
        className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
        unoptimized={item.imageUrl.startsWith("http")}
      />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 transition-all duration-300 ease-out",
          open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        <div className="min-w-0">
          <p className={cn("text-xs uppercase tracking-[0.18em] text-copper", TEXT_SHADOW)}>
            {categoryLabels[item.category]}
          </p>
          <h3 className={cn("mt-2 font-serif text-2xl leading-tight text-soft-white sm:text-3xl", TEXT_SHADOW)}>
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
    </article>
  );
}

export function FeaturedGrid({ items }: { items: PortfolioCard[] }) {
  return (
    <>
      <div className="mt-12 grid gap-4 md:grid-cols-3 md:auto-rows-[260px] lg:auto-rows-[330px]">
        {items.map((item, index) => (
          <Reveal
            key={item.id}
            delay={index * 0.04}
            className={index === 0 ? "md:col-span-2 md:row-span-2" : ""}
          >
            <FeaturedCard item={item} />
          </Reveal>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 rounded-full border border-soft-white/20 px-6 py-2.5 text-xs uppercase tracking-[0.18em] text-soft-white/80 transition hover:border-copper hover:text-copper"
        >
          View more
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}
