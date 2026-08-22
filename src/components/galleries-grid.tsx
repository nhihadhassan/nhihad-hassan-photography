"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ImageIcon, Search } from "lucide-react";
import { GalleryRowActions } from "@/components/gallery-row-actions";
import { DEPOSIT_STATUS_LABELS, type DepositStatus } from "@/lib/payment-constants";
import { formatAge, formatCompactDate } from "@/lib/utils";
import { galleryVisibility } from "@/lib/gallery-visibility";

export type GalleryCard = {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  eventDate: string | null;
  location: string | null;
  coverUrl: string | null;
  isPublished: boolean;
  isArchived: boolean;
  /** Listed on the public /galleries index. */
  isPublic: boolean;
  /** True when a password is set. The hash itself is never sent to the client. */
  hasPassword: boolean;
  expiresAt: string | null;
  photoCount: number;
  depositStatus: DepositStatus;
  updatedAt: string;
};

type FilterKey = "all" | "published" | "draft" | "archived";
type SortKey = "newest" | "oldest" | "event_date" | "client";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Archived" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Recently updated" },
  { key: "event_date", label: "Event date" },
  { key: "client", label: "Client name" },
  { key: "oldest", label: "Oldest first" },
];

const DOT_TONE_CLASSES: Record<"positive" | "neutral" | "danger", string> = {
  positive: "bg-admin-status-positive",
  neutral: "bg-admin-status-neutral",
  danger: "bg-admin-status-danger",
};

/**
 * Who can open this gallery, stated plainly.
 *
 * Replaces a Published/Draft dot that answered a different question: a
 * published gallery could be password-locked, unlisted, or expired, and the dot
 * said "Published" for all of them. The label is derived from the same flags
 * row-level security uses, so it cannot claim a gallery is more open than it is.
 */
function StatusDot({ card }: { card: GalleryCard }) {
  const visibility = galleryVisibility({
    isPublished: card.isPublished,
    isPublic: card.isPublic,
    hasPassword: card.hasPassword,
    isArchived: card.isArchived,
    expiresAt: card.expiresAt,
  });
  const tone =
    visibility.tone === "positive"
      ? "positive"
      : visibility.tone === "danger"
        ? "danger"
        : "neutral";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-admin-ink/65" title={visibility.detail}>
      <span className={`size-1.5 rounded-full ${DOT_TONE_CLASSES[tone]}`} aria-hidden="true" />
      {card.isArchived ? "Archived" : visibility.label}
    </span>
  );
}

export function GalleriesGrid({ galleries }: { galleries: GalleryCard[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const counts = useMemo(() => {
    return {
      all: galleries.length,
      published: galleries.filter((g) => g.isPublished && !g.isArchived).length,
      draft: galleries.filter((g) => !g.isPublished && !g.isArchived).length,
      archived: galleries.filter((g) => g.isArchived).length,
    };
  }, [galleries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = galleries;

    if (filter === "published") list = list.filter((g) => g.isPublished && !g.isArchived);
    else if (filter === "draft") list = list.filter((g) => !g.isPublished && !g.isArchived);
    else if (filter === "archived") list = list.filter((g) => g.isArchived);

    if (q) {
      list = list.filter((g) =>
        [g.title, g.clientName ?? "", g.slug, g.location ?? ""].some((v) => v.toLowerCase().includes(q)),
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "event_date": {
          const ad = a.eventDate ? new Date(a.eventDate).getTime() : -Infinity;
          const bd = b.eventDate ? new Date(b.eventDate).getTime() : -Infinity;
          return bd - ad;
        }
        case "client":
          return (a.clientName ?? "￿").localeCompare(b.clientName ?? "￿");
        case "newest":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    return sorted;
  }, [galleries, query, filter, sort]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              aria-pressed={filter === tab.key}
              className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition ${
                filter === tab.key
                  ? "bg-admin-ink text-admin-surface"
                  : "text-admin-ink/60 hover:bg-admin-ink/6 hover:text-admin-ink"
              }`}
            >
              {tab.label}
              <span
                className={
                  filter === tab.key ? "text-admin-surface/60" : "text-admin-ink/35"
                }
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-admin-ink/35"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search galleries"
              aria-label="Search galleries"
              className="min-h-10 w-full rounded-md border border-admin-ink/15 bg-white/70 pl-9 pr-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35 sm:w-52"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort galleries"
            className="min-h-10 rounded-md border border-admin-ink/15 bg-white/70 px-3 text-sm text-admin-ink outline-none transition focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length ? (
        <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((card) => (
            <div key={card.id} className="group relative">
              {/* Cover clips its own corners; the action menu lives OUTSIDE this
                  overflow-hidden box so its dropdown is never clipped. */}
              <div className="overflow-hidden rounded-lg bg-admin-ink/8 shadow-[0_1px_2px_rgba(23,19,15,0.04)] transition group-hover:shadow-[0_10px_28px_-14px_rgba(23,19,15,0.35)]">
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
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-admin-ink/30">
                      <ImageIcon className="size-7" aria-hidden="true" />
                    </div>
                  )}
                </Link>
              </div>
              <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                <GalleryRowActions
                  id={card.id}
                  title={card.title}
                  slug={card.slug}
                  isPublished={card.isPublished}
                  isArchived={card.isArchived}
                  variant="compact"
                />
              </div>
              <div className="mt-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/galleries/${card.id}`}
                    className="truncate font-medium tracking-tight text-admin-ink hover:text-admin-accent"
                  >
                    {card.title}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-admin-ink/65">
                  {card.photoCount} {card.photoCount === 1 ? "item" : "items"}
                  {card.eventDate ? ` · ${formatCompactDate(card.eventDate)}` : ""}
                  {card.clientName ? ` · ${card.clientName}` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusDot card={card} />
                  {card.depositStatus !== "not_requested" ? (
                    <span className="text-xs text-admin-ink/45">{DEPOSIT_STATUS_LABELS[card.depositStatus]}</span>
                  ) : null}
                  <span className="text-xs text-admin-ink/35">Updated {formatAge(card.updatedAt)} ago</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-admin-ink/65">
          {query ? <>No galleries match &ldquo;{query}&rdquo;.</> : "No galleries in this view."}
        </p>
      )}
    </div>
  );
}
