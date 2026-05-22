import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Heart, Images } from "lucide-react";
import { GalleryForm } from "@/components/gallery-form";
import { GalleryRowActions } from "@/components/gallery-row-actions";
import { SendInviteButton } from "@/components/send-invite-button";
import { requireAdmin } from "@/lib/auth";
import { getAdminGallery, getGalleryLastInvite } from "@/lib/admin-data";

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

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/galleries" className="text-sm text-[#17130f]/58 hover:text-[#17130f]">
        Back to galleries
      </Link>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#9b744f]">Edit gallery</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{gallery.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <Link
              href={`/admin/galleries/${gallery.id}/photos`}
              className="inline-flex items-center gap-2 rounded-md border border-[#17130f]/12 px-3 py-1.5 text-[#17130f]/72 hover:bg-[#17130f] hover:text-[#fbf8f1]"
            >
              <Images className="size-3.5" aria-hidden="true" />
              Manage photos
            </Link>
            <Link
              href={`/admin/galleries/${gallery.id}/favorites`}
              className="inline-flex items-center gap-2 rounded-md border border-[#17130f]/12 px-3 py-1.5 text-[#17130f]/72 hover:bg-[#17130f] hover:text-[#fbf8f1]"
            >
              <Heart className="size-3.5" aria-hidden="true" />
              Client selects
            </Link>
            <a
              href={`/galleries/${gallery.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-[#17130f]/58 hover:text-[#17130f]"
            >
              Open public cover
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
        <GalleryRowActions
          id={gallery.id}
          title={gallery.title}
          isPublished={gallery.is_published}
          isArchived={gallery.is_archived}
        />
      </div>
      {/* Invite section */}
      <div className="mt-8 rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Send gallery invite</h2>
            <p className="mt-1 text-sm leading-6 text-[#17130f]/58">
              {gallery.client_email ? (
                <>
                  Sends a branded email to{" "}
                  <span className="font-medium text-[#17130f]">{gallery.client_email}</span> with the
                  gallery link{gallery.has_password ? " and access password" : ""}.
                </>
              ) : (
                <>
                  Add a <strong className="font-medium text-[#17130f]">client email</strong> in the
                  settings below to enable invite delivery.
                </>
              )}
            </p>
          </div>
          {!gallery.client_email ? (
            <span className="inline-flex items-center rounded-full border border-[#17130f]/15 bg-[#17130f]/6 px-3 py-1 text-xs text-[#17130f]/50">
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
        <GalleryForm gallery={gallery} />
      </div>
    </div>
  );
}
