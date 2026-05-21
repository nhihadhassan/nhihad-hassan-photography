import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminGallery } from "@/lib/admin-data";
import { getAdminGalleryPhotos } from "@/lib/photos";
import { hasR2Config } from "@/lib/env";
import { PhotoManager } from "@/components/photo-manager";

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
      <Link
        href={`/admin/galleries/${id}`}
        className="inline-flex items-center gap-2 text-sm text-[#17130f]/58 hover:text-[#17130f]"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to gallery
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#9b744f]">Photos</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{gallery.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#17130f]/60">
            Upload, hide, reorder, and set the cover photo. Originals are stored privately in
            Cloudflare R2 and served via short-lived signed URLs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#17130f]/55">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#17130f]/10 px-3 py-1.5">
            <ImageIcon className="size-3.5" aria-hidden="true" />
            {photos.length} photo{photos.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {!r2Configured ? (
        <div className="mt-8 rounded-md border border-[#b98257]/40 bg-[#b98257]/10 p-5 text-sm text-[#17130f]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#9b744f]" aria-hidden="true" />
            <div>
              <p className="font-semibold">Photo storage isn&apos;t configured yet.</p>
              <p className="mt-2 text-[#17130f]/68">
                Add the following to <code className="rounded bg-white/60 px-1.5 py-0.5">.env.local</code>{" "}
                and restart the dev server. See{" "}
                <code className="rounded bg-white/60 px-1.5 py-0.5">.env.example</code> and the README
                for Cloudflare R2 setup steps.
              </p>
              <ul className="mt-3 grid gap-1 font-mono text-xs text-[#17130f]/72">
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
