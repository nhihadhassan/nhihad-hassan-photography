import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Heart, Images, Settings2, Share2 } from "lucide-react";
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

  const tabs = [
    { label: "Photos", href: `/admin/galleries/${gallery.id}/photos`, icon: Images, active: true },
    { label: "Settings", href: `/admin/galleries/${gallery.id}`, icon: Settings2 },
    { label: "Selects", href: `/admin/galleries/${gallery.id}/favorites`, icon: Heart },
    { label: "Share", href: `/admin/galleries/${gallery.id}/share`, icon: Share2 },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Back link */}
      <Link href="/admin/galleries" className="text-sm text-[#17130f]/55 hover:text-[#17130f]">
        ← All galleries
      </Link>

      {/* Header */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
              (gallery.is_archived
                ? "bg-[#17130f]/10 text-[#17130f]/60"
                : gallery.is_published
                  ? "bg-[#3f6e4a]/15 text-[#3f6e4a]"
                  : "bg-[#b98257]/20 text-[#9b744f]")
            }
          >
            {gallery.is_archived ? "Archived" : gallery.is_published ? "Published" : "Draft"}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{gallery.title}</h1>
        {gallery.client_name && (
          <p className="mt-0.5 text-sm text-[#17130f]/55">{gallery.client_name}</p>
        )}
      </div>

      {/* Tab navigation */}
      <div className="mt-6 border-b border-[#17130f]/10">
        <nav className="flex gap-1" aria-label="Gallery sections">
          {tabs.map(({ label, href, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={
                "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition " +
                (active
                  ? "border-[#17130f] font-medium text-[#17130f]"
                  : "border-transparent text-[#17130f]/55 hover:border-[#17130f]/25 hover:text-[#17130f]")
              }
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
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
