import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { GalleryRowActions } from "@/components/gallery-row-actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminGalleries } from "@/lib/admin-data";
import { DEPOSIT_STATUS_LABELS, type DepositStatus } from "@/lib/payment-constants";
import { formatCompactDate } from "@/lib/utils";

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-[#17130f]/10 px-2.5 py-1 text-xs text-[#17130f]/60">
      {children}
    </span>
  );
}

function DepositPill({ status }: { status: DepositStatus }) {
  const label = DEPOSIT_STATUS_LABELS[status];
  const colorClass =
    status === "paid"
      ? "border-[#3f6e4a]/30 bg-[#3f6e4a]/10 text-[#3f6e4a]"
      : status === "received"
        ? "border-[#2e5fa3]/30 bg-[#2e5fa3]/10 text-[#2e5fa3]"
        : status === "requested" || status === "balance_due"
          ? "border-[#9b744f]/40 bg-[#b98257]/12 text-[#9b744f]"
          : "border-[#17130f]/10 bg-transparent text-[#17130f]/45";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${colorClass}`}>
      {label}
    </span>
  );
}

export default async function AdminGalleriesPage() {
  await requireAdmin();

  const galleries = await getAdminGalleries();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#9b744f]">Gallery management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Galleries</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#17130f]/60">
            Create and manage client galleries. Track deposit status for each booking.
          </p>
        </div>
        <Link
          href="/admin/galleries/new"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#17130f] px-4 text-sm font-medium text-[#fbf8f1]"
        >
          Create gallery
        </Link>
      </div>
      {galleries.length ? (
        <div className="mt-8 overflow-hidden rounded-md border border-[#17130f]/10 bg-[#fbf8f1]">
          <div className="divide-y divide-[#17130f]/10">
            {galleries.map((gallery) => (
              <article key={gallery.id} className="grid gap-5 p-5 lg:grid-cols-[96px_1fr_auto] lg:items-center">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#17130f]/8">
                  {gallery.cover_image_url ? (
                    <Image
                      src={gallery.cover_image_url}
                      alt={gallery.cover_image_alt || `${gallery.title} cover image`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/galleries/${gallery.id}`}
                      className="text-lg font-semibold tracking-tight hover:text-[#9b744f]"
                    >
                      {gallery.title}
                    </Link>
                    <StatusPill>{gallery.is_published ? "Published" : "Draft"}</StatusPill>
                    <StatusPill>{gallery.is_archived ? "Archived" : "Active"}</StatusPill>
                    <StatusPill>{gallery.is_public ? "Public index" : "Private link"}</StatusPill>
                    <DepositPill status={gallery.deposit_status} />
                  </div>
                  <p className="mt-2 text-sm text-[#17130f]/58">
                    /galleries/{gallery.slug} · {gallery.client_name ?? "No client"} ·{" "}
                    {formatCompactDate(gallery.event_date)}
                  </p>
                  <p className="mt-1 text-sm text-[#17130f]/48">
                    Expires: {formatCompactDate(gallery.expires_at)}
                  </p>
                  <Link
                    href={`/admin/galleries/${gallery.id}/photos`}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-[#9b744f] hover:text-[#17130f]"
                  >
                    Manage photos →
                  </Link>
                </div>
                <GalleryRowActions
                  id={gallery.id}
                  title={gallery.title}
                  isPublished={gallery.is_published}
                  isArchived={gallery.is_archived}
                />
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Create your first gallery."
            description="Add a gallery title, slug, and publish state. Each gallery gets a public cover page and a private photo grid for your client."
            action={
              <Link
                href="/admin/galleries/new"
                className="inline-flex min-h-11 items-center rounded-md bg-[#17130f] px-4 text-sm font-medium text-[#fbf8f1]"
              >
                Create gallery
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
