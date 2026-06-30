import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminGallery,
  getGalleryEmailCoverUrl,
  getGalleryLastInvite,
} from "@/lib/admin-data";
import { getAdminGalleryPhotos } from "@/lib/photos";
import { getGalleryShareLinks } from "@/lib/share-links";
import { hasR2Config } from "@/lib/env";
import { brandConfig } from "@/lib/config";
import { ShareLinkManager } from "@/components/share-link-manager";
import { GalleryShareEmail } from "@/components/gallery-share-email";
import { CopyLinkField } from "@/components/copy-link-field";

type Props = { params: Promise<{ id: string }> };

const PUBLIC_BASE = "https://nhihadhassan.ca";

export default async function GallerySharePage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const gallery = await getAdminGallery(id);
  if (!gallery) notFound();

  const r2Configured = hasR2Config();
  const [photos, shareLinks, lastInvite, coverImageUrl] = await Promise.all([
    r2Configured ? getAdminGalleryPhotos(id) : Promise.resolve([]),
    getGalleryShareLinks(id),
    getGalleryLastInvite(id),
    getGalleryEmailCoverUrl(gallery),
  ]);

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || PUBLIC_BASE;
  const galleryUrl = `${PUBLIC_BASE}/galleries/${gallery.slug}`;
  const publicLink = `${siteOrigin}/galleries/${gallery.slug}`;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/admin/galleries/${id}`}
        className="inline-flex items-center gap-2 text-sm text-admin-ink/58 hover:text-admin-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to gallery
      </Link>

      <div className="mt-5">
        <h1 className="text-2xl font-semibold tracking-tight">Share {gallery.title}</h1>
        <p className="mt-1 text-sm leading-6 text-admin-ink/60">
          Email the gallery to your client, copy the link to send yourself, or build a curated
          link for vendors and partners.
        </p>
      </div>

      {/* Send to client */}
      <section className="mt-7 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Send to client</h2>
        <p className="mt-1 text-sm text-admin-ink/55">
          Edit the subject and message, then send. The preview shows exactly what your client
          receives.
        </p>
        <div className="mt-5">
          <GalleryShareEmail
            galleryId={gallery.id}
            galleryTitle={gallery.title}
            galleryUrl={galleryUrl}
            clientName={gallery.client_name}
            defaultRecipient={gallery.client_email}
            password={gallery.password_plain}
            coverImageUrl={coverImageUrl}
            photographerEmail={brandConfig.contactEmail}
            savedSubject={gallery.invite_subject}
            savedMessage={gallery.invite_message}
            lastSentAt={lastInvite?.sent_at ?? null}
            lastSentTo={lastInvite?.sent_to ?? null}
          />
        </div>
      </section>

      {/* Gallery link */}
      <section className="mt-6 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Gallery link</h2>
        <p className="mt-1 text-sm text-admin-ink/55">
          The public address for this gallery. Share it by text or social.
          {gallery.has_password ? " Clients need the password to view." : ""}
          {!gallery.is_published ? " This gallery is a draft until you publish it." : ""}
        </p>
        <div className="mt-4">
          <CopyLinkField url={publicLink} />
        </div>
      </section>

      {/* Curated share links */}
      <section className="mt-6 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Curated links</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-admin-ink/55">
          Build a link that shows only the photos you select, for vendors, planners, or partners.
          Originals are never exposed.
        </p>

        {!r2Configured ? (
          <div className="mt-5 rounded-md border border-admin-copper/40 bg-admin-copper/10 p-4 text-sm text-admin-ink">
            Photo storage (R2) is not configured. Upload photos before creating curated links.
          </div>
        ) : (
          <div className="mt-5">
            <ShareLinkManager
              galleryId={id}
              photos={photos}
              initialLinks={shareLinks}
              siteOrigin={siteOrigin}
            />
          </div>
        )}
      </section>
    </div>
  );
}
