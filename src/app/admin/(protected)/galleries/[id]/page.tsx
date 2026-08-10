import { notFound } from "next/navigation";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { GalleryForm } from "@/components/gallery-form";
import { GalleryRowActions } from "@/components/gallery-row-actions";
import { GalleryDetailHeader } from "@/components/gallery-detail-header";
import { requireAdmin } from "@/lib/auth";
import { getAdminGallery, getGalleryCoverPreviewUrl, getRecentGalleryLocations } from "@/lib/admin-data";
import { getClientList } from "@/lib/clients";

type EditGalleryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditGalleryPage({ params }: EditGalleryPageProps) {
  const { id } = await params;
  await requireAdmin();

  const gallery = await getAdminGallery(id);

  if (!gallery) {
    notFound();
  }

  const [coverImageUrl, locations, clients] = await Promise.all([
    getGalleryCoverPreviewUrl(gallery),
    getRecentGalleryLocations(),
    getClientList(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <GalleryDetailHeader
        galleryId={gallery.id}
        title={gallery.title}
        clientName={gallery.client_name}
        isPublished={gallery.is_published}
        isArchived={gallery.is_archived}
        activeTab="settings"
        actions={
          <>
            <Link
              href={`/admin/galleries/${gallery.id}/share`}
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-admin-ink/12 px-3 text-sm font-medium text-admin-ink/75 transition hover:bg-admin-ink/6"
            >
              <Share2 className="size-3.5" aria-hidden="true" />
              Share
            </Link>
            <GalleryRowActions
              id={gallery.id}
              title={gallery.title}
              slug={gallery.slug}
              isPublished={gallery.is_published}
              isArchived={gallery.is_archived}
            />
          </>
        }
      />

      <div className="mt-6">
        <GalleryForm gallery={gallery} coverImageUrl={coverImageUrl} locations={locations} clients={clients} />
      </div>
    </div>
  );
}
