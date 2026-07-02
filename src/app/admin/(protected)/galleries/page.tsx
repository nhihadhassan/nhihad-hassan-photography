import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { GalleriesGrid, type GalleryCard } from "@/components/galleries-grid";
import { requireAdmin } from "@/lib/auth";
import { getAdminGalleriesWithCounts, getGalleryListCoverUrls } from "@/lib/admin-data";

export default async function AdminGalleriesPage() {
  await requireAdmin();

  const galleries = await getAdminGalleriesWithCounts();

  // Resolve real cover thumbnails in a bounded number of queries (not N+1).
  const coverUrls = await getGalleryListCoverUrls(galleries);

  const cards: GalleryCard[] = galleries.map((g) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    clientName: g.client_name,
    eventDate: g.event_date,
    coverUrl: coverUrls[g.id] ?? null,
    isPublished: g.is_published,
    isArchived: g.is_archived,
    photoCount: g.photo_count,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="mt-1 text-sm text-admin-ink/65">
            {galleries.length} {galleries.length === 1 ? "collection" : "collections"}
          </p>
        </div>
        <Link
          href="/admin/galleries/new"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-admin-copper/40"
        >
          <Plus className="size-4" aria-hidden="true" />
          New collection
        </Link>
      </div>

      {galleries.length ? (
        <div className="mt-7">
          <GalleriesGrid galleries={cards} />
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Create your first collection."
            description="Give it a title and you will land on the upload screen. Each collection gets a public cover page and a private photo grid for your client."
            action={
              <Link
                href="/admin/galleries/new"
                className="inline-flex min-h-11 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface"
              >
                New collection
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
