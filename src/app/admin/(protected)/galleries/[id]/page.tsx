import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Images, Share2, Settings2 } from "lucide-react";
import { GalleryForm } from "@/components/gallery-form";
import { GalleryRowActions } from "@/components/gallery-row-actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminGallery, getGalleryCoverPreviewUrl } from "@/lib/admin-data";

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

  const coverImageUrl = await getGalleryCoverPreviewUrl(gallery);

  const tabs = [
    { label: "Photos", href: `/admin/galleries/${gallery.id}/photos`, icon: Images },
    { label: "Settings", href: `/admin/galleries/${gallery.id}`, icon: Settings2, active: true },
    { label: "Selects", href: `/admin/galleries/${gallery.id}/favorites`, icon: Heart },
    { label: "Share", href: `/admin/galleries/${gallery.id}/share`, icon: Share2 },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link href="/admin/galleries" className="text-sm text-admin-ink/65 hover:text-admin-ink">
        ← All galleries
      </Link>

      {/* Header */}
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
                (gallery.is_archived
                  ? "bg-admin-ink/10 text-admin-ink/60"
                  : gallery.is_published
                    ? "bg-admin-success/15 text-admin-success"
                    : "bg-admin-copper/20 text-admin-accent")
              }
            >
              {gallery.is_archived ? "Archived" : gallery.is_published ? "Published" : "Draft"}
            </span>
          </div>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight">{gallery.title}</h1>
          {gallery.client_name && (
            <p className="mt-0.5 text-sm text-admin-ink/65">{gallery.client_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mt-6 border-b border-admin-ink/10">
        <nav className="flex gap-1" aria-label="Gallery sections">
          {tabs.map(({ label, href, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={
                "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition " +
                (active
                  ? "border-admin-ink font-medium text-admin-ink"
                  : "border-transparent text-admin-ink/65 hover:border-admin-ink/25 hover:text-admin-ink")
              }
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <GalleryForm gallery={gallery} coverImageUrl={coverImageUrl} />
      </div>
    </div>
  );
}
