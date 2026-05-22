import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminGallery } from "@/lib/admin-data";
import { getAdminGalleryPhotos } from "@/lib/photos";
import { getGalleryShareLinks } from "@/lib/share-links";
import { hasR2Config } from "@/lib/env";
import { ShareLinkManager } from "@/components/share-link-manager";

type Props = { params: Promise<{ id: string }> };

export default async function GallerySharePage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const gallery = await getAdminGallery(id);
  if (!gallery) notFound();

  const r2Configured = hasR2Config();
  const [photos, shareLinks] = await Promise.all([
    r2Configured ? getAdminGalleryPhotos(id) : Promise.resolve([]),
    getGalleryShareLinks(id),
  ]);

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://nhihadhassan.ca";

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/admin/galleries/${id}`}
        className="inline-flex items-center gap-2 text-sm text-[#17130f]/58 hover:text-[#17130f]"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to gallery
      </Link>

      <div className="mt-6 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#b98257]/15">
          <Share2 className="size-5 text-[#9b744f]" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#9b744f]">Share links</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{gallery.title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#17130f]/60">
            Create curated share links for vendors, planners, or partners. Each link shows only
            the photos you select — originals are never exposed.
          </p>
        </div>
      </div>

      {!r2Configured ? (
        <div className="mt-8 rounded-md border border-[#b98257]/40 bg-[#b98257]/10 p-5 text-sm text-[#17130f]">
          Photo storage (R2) isn&apos;t configured — upload photos before creating share links.
        </div>
      ) : null}

      <div className="mt-8">
        <ShareLinkManager
          galleryId={id}
          photos={photos}
          initialLinks={shareLinks}
          siteOrigin={siteOrigin}
        />
      </div>
    </div>
  );
}
