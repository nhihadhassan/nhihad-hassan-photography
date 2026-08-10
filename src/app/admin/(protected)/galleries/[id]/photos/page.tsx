import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminGallery } from "@/lib/admin-data";
import { getAdminGalleryPhotos } from "@/lib/photos";
import { hasR2Config } from "@/lib/env";
import { PhotoManager } from "@/components/photo-manager";
import { GalleryDetailHeader } from "@/components/gallery-detail-header";

type PhotosPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GalleryPhotosPage({ params }: PhotosPageProps) {
  const { id } = await params;
  await requireAdmin();

  const gallery = await getAdminGallery(id);
  if (!gallery) {
    notFound();
  }

  const r2Configured = hasR2Config();
  const photos = r2Configured ? await getAdminGalleryPhotos(id) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <GalleryDetailHeader
        galleryId={gallery.id}
        title={gallery.title}
        clientName={gallery.client_name}
        isPublished={gallery.is_published}
        isArchived={gallery.is_archived}
        activeTab="photos"
      />

      {!r2Configured ? (
        <div className="mt-8 rounded-md border border-admin-copper/40 bg-admin-copper/10 p-5 text-sm text-admin-ink">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-admin-accent" aria-hidden="true" />
            <div>
              <p className="font-semibold">Photo storage isn&apos;t configured yet.</p>
              <p className="mt-2 text-admin-ink/68">
                Add the following to <code className="rounded bg-white/60 px-1.5 py-0.5">.env.local</code>{" "}
                and restart the dev server. See{" "}
                <code className="rounded bg-white/60 px-1.5 py-0.5">.env.example</code> and the README
                for Cloudflare R2 setup steps.
              </p>
              <ul className="mt-3 grid gap-1 font-mono text-xs text-admin-ink/72">
                <li>R2_ACCOUNT_ID</li>
                <li>R2_ACCESS_KEY_ID</li>
                <li>R2_SECRET_ACCESS_KEY</li>
                <li>R2_BUCKET_NAME</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <PhotoManager
            galleryId={gallery.id}
            slug={gallery.slug}
            coverPhotoId={gallery.cover_photo_id}
            initialPhotos={photos}
          />
        </div>
      )}
    </div>
  );
}
