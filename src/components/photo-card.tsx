import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioItem } from "@/data/photography";
import { categoryLabels } from "@/data/photography";
import { cn, formatDisplayDate } from "@/lib/utils";

const aspectClasses: Record<PortfolioItem["orientation"], string> = {
  portrait: "aspect-[4/5]",
  landscape: "aspect-[16/11]",
  square: "aspect-square",
};

export function PhotoCard({
  item,
  priority = false,
  className,
}: {
  item: PortfolioItem;
  priority?: boolean;
  className?: string;
}) {
  return (
    <article className={cn("group", className)}>
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
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-70" />
        {item.featured ? (
          <span className="absolute left-3 top-3 rounded-full border border-soft-white/20 bg-ink/50 px-3 py-1 text-xs text-soft-white/80 backdrop-blur">
            Featured
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper">
            {categoryLabels[item.category]}
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-none text-soft-white">{item.title}</h3>
          <p className="mt-2 text-sm text-soft-white/55">
            {formatDisplayDate(item.date)} · {item.location}
          </p>
        </div>
        <Link
          href={`/portfolio/${item.category}`}
          aria-label={`View ${categoryLabels[item.category]} portfolio`}
          className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-soft-white/14 text-soft-white/70 transition group-hover:border-copper group-hover:text-copper"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-3 text-sm leading-6 text-soft-white/58">{item.description}</p>
    </article>
  );
}

