import { notFound } from "next/navigation";
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
import { GalleryDetailHeader } from "@/components/gallery-detail-header";
import { siteUrl } from "@/lib/seo";
import { getGalleryDeliveryStats } from "@/lib/gallery-delivery-stats";
import { galleryVisibility } from "@/lib/gallery-visibility";
import { formatCompactDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function GallerySharePage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const gallery = await getAdminGallery(id);
  if (!gallery) notFound();

  const r2Configured = hasR2Config();
  const [photos, shareLinks, lastInvite, coverImageUrl, stats] = await Promise.all([
    r2Configured ? getAdminGalleryPhotos(id) : Promise.resolve([]),
    getGalleryShareLinks(id),
    getGalleryLastInvite(id),
    getGalleryEmailCoverUrl(gallery),
    getGalleryDeliveryStats(id),
  ]);

  const visibility = galleryVisibility({
    isPublished: gallery.is_published,
    isPublic: gallery.is_public,
    hasPassword: gallery.has_password,
    isArchived: gallery.is_archived,
    expiresAt: gallery.expires_at,
  });

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const galleryUrl = `${siteUrl}/galleries/${gallery.slug}`;
  const publicLink = `${siteOrigin}/galleries/${gallery.slug}`;

  return (
    <div className="mx-auto max-w-5xl">
      <GalleryDetailHeader
        galleryId={gallery.id}
        title={gallery.title}
        clientName={gallery.client_name}
        isPublished={gallery.is_published}
        isArchived={gallery.is_archived}
        activeTab="share"
        kicker="Share"
        description="Email the gallery to your client or other recipients, copy the link to send yourself, or build a curated link for vendors and partners."
      />

      {/* Delivery summary: did this actually land? Answering that used to mean
          leaving the gallery for the raw log screens and filtering by gallery. */}
      <section className="mt-7 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">Delivery</h2>
          <span className="text-xs text-admin-ink/65">{visibility.detail}</span>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Opened"
            value={stats.views === 0 ? "Not yet" : `${stats.views}×`}
            detail={stats.lastOpenedAt ? `Last ${formatCompactDate(stats.lastOpenedAt)}` : null}
          />
          <Stat
            label="Downloads"
            value={stats.downloads === 0 ? "None" : `${stats.downloads}`}
            detail={
              stats.lastDownloadedAt ? `Last ${formatCompactDate(stats.lastDownloadedAt)}` : null
            }
          />
          <Stat
            label="Client selects"
            value={stats.selectSets === 0 ? "None" : `${stats.selectSets}`}
            detail={
              stats.submittedSelectSets > 0 ? `${stats.submittedSelectSets} sent to you` : null
            }
          />
          <Stat
            label="Sent"
            value={lastInvite?.sent_at ? formatCompactDate(lastInvite.sent_at) : "Not sent"}
            detail={lastInvite?.sent_to ?? null}
          />
        </dl>

        {stats.failedAttempts > 0 ? (
          <p className="mt-4 rounded-md bg-admin-status-waiting-tint px-3 py-2 text-xs text-admin-status-waiting">
            {stats.failedAttempts} failed {stats.failedAttempts === 1 ? "attempt" : "attempts"} to
            open this gallery. Usually a wrong or mistyped password.
          </p>
        ) : null}

        <p className="mt-4 text-xs text-admin-ink/60">
          Every open and download is listed individually under{" "}
          <a href={`/admin/access-logs?gallery=${gallery.id}`} className="underline underline-offset-2 hover:text-admin-ink">
            access logs
          </a>{" "}
          and{" "}
          <a href={`/admin/download-logs?gallery=${gallery.id}`} className="underline underline-offset-2 hover:text-admin-ink">
            download logs
          </a>
          .
        </p>
      </section>

      {/* Send to client */}
      <section
        id="send-email"
        className="mt-7 scroll-mt-6 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6"
      >
        <h2 className="text-base font-semibold tracking-tight">Send gallery email</h2>
        <p className="mt-1 text-sm text-admin-ink/65">
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
        <p className="mt-1 text-sm text-admin-ink/65">
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
        <p className="mt-1 max-w-2xl text-sm leading-6 text-admin-ink/65">
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

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string | null;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-admin-ink/60">{label}</dt>
      <dd className="mt-1 text-lg font-medium tabular-nums text-admin-ink">{value}</dd>
      {detail ? <p className="mt-0.5 truncate text-xs text-admin-ink/60">{detail}</p> : null}
    </div>
  );
}
