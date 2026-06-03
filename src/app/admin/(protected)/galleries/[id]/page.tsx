import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Images, Share2, Settings2 } from "lucide-react";
import { GalleryForm } from "@/components/gallery-form";
import { GalleryRowActions } from "@/components/gallery-row-actions";
import { SendInviteButton } from "@/components/send-invite-button";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminGallery,
  getGalleryLastInvite,
  getGalleryCoverPreviewUrl,
} from "@/lib/admin-data";

type EditGalleryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditGalleryPage({ params }: EditGalleryPageProps) {
  const { id } = await params;
  await requireAdmin();

  const [gallery, lastInvite] = await Promise.all([
    getAdminGallery(id),
    getGalleryLastInvite(id),
  ]);

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
      <Link href="/admin/galleries" className="text-sm text-admin-ink/55 hover:text-admin-ink">
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
            <p className="mt-0.5 text-sm text-admin-ink/55">{gallery.client_name}</p>
          )}
        </div>
        <GalleryRowActions
          id={gallery.id}
          title={gallery.title}
          slug={gallery.slug}
          isPublished={gallery.is_published}
          isArchived={gallery.is_archived}
        />
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
                  : "border-transparent text-admin-ink/55 hover:border-admin-ink/25 hover:text-admin-ink")
              }
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Invite section */}
      <div className="mt-6 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Send gallery invite</h2>
            <p className="mt-1 text-sm leading-6 text-admin-ink/58">
              {gallery.client_email ? (
                <>
                  Sends a branded email to{" "}
                  <span className="font-medium text-admin-ink">{gallery.client_email}</span> with
                  the gallery link{gallery.has_password ? " and access password" : ""}.
                </>
              ) : (
                <>
                  Add a <strong className="font-medium text-admin-ink">client email</strong> in
                  Settings below to enable invite delivery.
                </>
              )}
            </p>
          </div>
          {!gallery.client_email ? (
            <span className="inline-flex items-center rounded-full border border-admin-ink/15 bg-admin-ink/6 px-3 py-1 text-xs text-admin-ink/50">
              No email set
            </span>
          ) : null}
        </div>
        {gallery.client_email ? (
          <div className="mt-4">
            <SendInviteButton
              galleryId={gallery.id}
              clientEmail={gallery.client_email}
              lastSentAt={lastInvite?.sent_at ?? null}
              lastSentTo={lastInvite?.sent_to ?? null}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <GalleryForm gallery={gallery} coverImageUrl={coverImageUrl} />
      </div>
    </div>
  );
}
