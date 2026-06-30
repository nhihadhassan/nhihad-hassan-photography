"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ImageIcon, Search } from "lucide-react";
import { GalleryRowActions } from "@/components/gallery-row-actions";
import { formatCompactDate } from "@/lib/utils";

export type GalleryCard = {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  eventDate: string | null;
  coverUrl: string | null;
  isPublished: boolean;
  isArchived: boolean;
  photoCount: number;
};

function StatusDot({ card }: { card: GalleryCard }) {
  const { label, color } = card.isArchived
    ? { label: "Archived", color: "bg-admin-ink/30" }
    : card.isPublished
      ? { label: "Published", color: "bg-admin-success" }
      : { label: "Draft", color: "bg-admin-accent" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-admin-ink/50">
      <span className={`size-1.5 rounded-full ${color}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function GalleriesGrid({ galleries }: { galleries: GalleryCard[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return galleries;
    return galleries.filter((g) =>
      [g.title, g.clientName ?? "", g.slug].some((v) => v.toLowerCase().includes(q)),
    );
  }, [galleries, query]);

  return (
    <div>
      <div className="relative max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-admin-ink/35"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections"
          className="min-h-10 w-full rounded-md border border-admin-ink/12 bg-white/70 pl-9 pr-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper"
        />
      </div>

      {filtered.length ? (
        <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((card) => (
            <div key={card.id} className="group">
              <div className="relative overflow-hidden rounded-lg bg-admin-ink/8">
                <Link
                  href={`/admin/galleries/${card.id}`}
                  className="block aspect-[4/3]"
                  aria-label={card.title}
                >
                  {card.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.coverUrl}
                      alt={card.title}
                      className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-admin-ink/25">
                      <ImageIcon className="size-7" aria-hidden="true" />
                    </div>
                  )}
                </Link>
                <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <GalleryRowActions
                    id={card.id}
                    title={card.title}
                    slug={card.slug}
                    isPublished={card.isPublished}
                    isArchived={card.isArchived}
                    variant="compact"
                  />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/galleries/${card.id}`}
                    className="font-medium tracking-tight text-admin-ink hover:text-admin-accent"
                  >
                    {card.title}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-admin-ink/50">
                  {card.photoCount} {card.photoCount === 1 ? "item" : "items"}
                  {card.eventDate ? ` · ${formatCompactDate(card.eventDate)}` : ""}
                  {card.clientName ? ` · ${card.clientName}` : ""}
                </p>
                <div className="mt-1.5">
                  <StatusDot card={card} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-admin-ink/55">
          No collections match &ldquo;{query}&rdquo;.
        </p>
      )}
    </div>
  );
}
