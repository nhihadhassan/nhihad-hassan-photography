import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, MailOpen } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminGallery } from "@/lib/admin-data";
import {
  getFavoriteSetsForGallery,
  getFavoriteSetDetail,
  type FavoriteSetSummary,
} from "@/lib/favorites";
import { EmptyState } from "@/components/empty-state";
import { FavoriteSetDetailCard } from "@/components/favorite-set-detail";
import { formatCompactDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ set?: string }>;
};

function formatTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export const dynamic = "force-dynamic";

export default async function GalleryFavoritesPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  await requireAdmin();

  const gallery = await getAdminGallery(id);
  if (!gallery) notFound();

  const sets = await getFavoriteSetsForGallery(id);
  const activeSetId = sp.set && sets.some((s) => s.id === sp.set) ? sp.set : sets[0]?.id ?? null;
  const detail = activeSetId ? await getFavoriteSetDetail(activeSetId) : null;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={`/admin/galleries/${id}`}
        className="inline-flex items-center gap-2 text-sm text-admin-ink/58 hover:text-admin-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to gallery
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-admin-accent">Client selects</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{gallery.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Submissions from visitors who hearted photos in this gallery and sent them in.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-admin-ink/10 px-3 py-1.5 text-xs text-admin-ink/55">
          <Heart className="size-3.5" aria-hidden="true" />
          {sets.length} submission{sets.length === 1 ? "" : "s"}
        </span>
      </div>

      {sets.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No selects yet."
            description="When clients heart photos and submit their selections, they'll show up here."
            action={
              <a
                href={`/galleries/${gallery.slug}`}
                target="_blank"
                className="inline-flex min-h-10 items-center rounded-md border border-admin-ink/12 px-4 text-sm text-admin-ink/68"
              >
                Open public cover ↗
              </a>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
          <aside className="rounded-md border border-admin-ink/10 bg-admin-surface">
            <ul className="divide-y divide-admin-ink/10">
              {sets.map((set) => (
                <SubmissionRow
                  key={set.id}
                  set={set}
                  galleryId={id}
                  active={set.id === activeSetId}
                />
              ))}
            </ul>
          </aside>

          <section>
            {detail ? (
              <FavoriteSetDetailCard detail={detail} galleryTitle={gallery.title} />
            ) : (
              <div className="rounded-md border border-dashed border-admin-ink/15 bg-admin-surface p-8 text-center text-sm text-admin-ink/55">
                Select a submission on the left to view photos and notes.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  set,
  galleryId,
  active,
}: {
  set: FavoriteSetSummary;
  galleryId: string;
  active: boolean;
}) {
  const name = set.visitor_name || set.visitor_email || "Anonymous visitor";
  return (
    <li>
      <Link
        href={`/admin/galleries/${galleryId}/favorites?set=${set.id}`}
        className={
          "block px-4 py-3 transition " +
          (active ? "bg-admin-ink/5" : "hover:bg-admin-ink/5")
        }
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-medium text-admin-ink">{name}</span>
          <span className="shrink-0 rounded-full bg-admin-accent/15 px-2 py-0.5 text-xs font-medium text-admin-accent">
            {set.photo_count}
          </span>
        </div>
        {set.visitor_email && set.visitor_name ? (
          <p className="mt-0.5 truncate text-xs text-admin-ink/55">
            <MailOpen className="mr-1 inline size-3 align-middle" aria-hidden="true" />
            {set.visitor_email}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-admin-ink/45">
          {formatTime(set.submitted_at ?? set.created_at)} ·{" "}
          {formatCompactDate(set.submitted_at ?? set.created_at)}
        </p>
      </Link>
    </li>
  );
}
