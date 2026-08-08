import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { getInvoiceView } from "@/lib/invoice-data";
import { BOOKING_STAGE_LABELS } from "@/lib/booking-stages";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { getAdminGalleries } from "@/lib/admin-data";
import { getBookingTimeline } from "@/lib/timeline";
import { formatMoney, formatCompactDate } from "@/lib/utils";
import { StatusChip, statusForContract, statusForInvoice } from "@/components/ui/status-chip";
import { CopyText } from "@/components/ui/copy-text";
import { BookingTimeline } from "@/components/booking-timeline";
import { BookingNoteComposer } from "@/components/booking-note-composer";
import { InvoiceSendButton } from "@/components/invoice-send-button";
import {
  listInvoiceDeliveriesForBooking,
  successfulInvoiceDelivery,
} from "@/lib/invoice-deliveries";

export const dynamic = "force-dynamic";

const TZ = "America/Toronto";

function shootWhen(iso: string | null) {
  if (!iso) return "Date to be set";
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function BookingWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const booking = await getBookingById(id);
  if (!booking) notFound();

  const [timeline, agreements, galleries, invoiceDeliveries, invoice] = await Promise.all([
    getBookingTimeline(booking),
    getAdminAgreementRequests(),
    getAdminGalleries(),
    listInvoiceDeliveriesForBooking(booking.id),
    getInvoiceView(booking),
  ]);

  const agreement = agreements.find((a) => a.id === booking.agreement_request_id) ?? null;
  const gallery = booking.gallery_id ? galleries.find((g) => g.id === booking.gallery_id) ?? null : null;
  // Totals come from the shared invoice view so line items and the legacy
  // single-total bookings both report the same figures here.
  const { total, paid, balance } = invoice;
  const latestInvoiceDelivery = invoiceDeliveries[0] ?? null;
  const invoiceSent = invoiceDeliveries.some(successfulInvoiceDelivery);

  const signed = Boolean(agreement?.signed_at);
  const nextAction = suggestNextAction({
    booking,
    agreement,
    gallery,
    paid,
    balance,
    signed,
    invoiceSent,
  });

  const clientName = booking.client_name ?? booking.shoot_type ?? "Booking";

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/schedule" className="text-sm text-admin-muted hover:text-admin-ink">
        Schedule
      </Link>

      {/* Header */}
      <header className="mt-2 flex flex-col gap-4 border-b border-admin-line pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="admin-display text-3xl text-admin-ink">{clientName}</h1>
            <span className="rounded-full bg-admin-raise px-2.5 py-0.5 text-xs font-medium text-admin-muted">
              {BOOKING_STAGE_LABELS[booking.stage]}
            </span>
          </div>
          <p className="mt-1 text-sm text-admin-muted">
            {booking.shoot_type ? `${booking.shoot_type} · ` : ""}
            {shootWhen(booking.start_at)}
            {booking.location ? ` · ${booking.location}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/admin/bookings/${booking.id}/edit`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-admin-line-strong bg-admin-surface px-3 text-sm font-medium text-admin-ink hover:bg-admin-raise"
          >
            <Pencil className="size-4 text-admin-muted" aria-hidden="true" />
            Edit
          </Link>
          {nextAction ? (
            <Link
              href={nextAction.href}
              className="inline-flex min-h-10 items-center rounded-lg bg-admin-ink px-4 text-sm font-medium text-admin-surface hover:bg-admin-ink/88"
            >
              {nextAction.label}
            </Link>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-lg bg-admin-status-positive-tint px-4 text-sm font-medium text-admin-status-positive">
              All caught up
            </span>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Left: activity timeline */}
        <section aria-label="Activity">
          <h2 className="admin-display mb-3 text-xl text-admin-ink">Activity</h2>
          <BookingNoteComposer bookingId={booking.id} />
          <div className="mt-5">
            <BookingTimeline entries={timeline} />
          </div>
        </section>

        {/* Right: facts rail */}
        <aside aria-label="Details" className="space-y-5">
          <RailBlock title="Contact">
            <p className="text-sm font-medium text-admin-ink">{booking.client_name ?? "No name"}</p>
            {booking.client_email ? <CopyText value={booking.client_email} /> : null}
          </RailBlock>

          <RailBlock title="Contract">
            {agreement ? (
              <div className="flex items-center justify-between gap-2">
                <StatusChip status={statusForContract(agreement)} />
                <a
                  href={`/agreement/${agreement.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-admin-accent hover:text-admin-ink"
                >
                  View <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-admin-muted">No contract linked.</p>
            )}
          </RailBlock>

          <RailBlock title="Invoice">
            {total > 0 ? (
              <div className="space-y-2">
                <StatusChip
                  status={statusForInvoice({
                    total,
                    paid,
                    dueAt: booking.invoice_due_date ?? booking.start_at,
                    sentAt: booking.invoice_sent_at,
                    viewedAt: booking.invoice_viewed_at,
                    cancelledAt: booking.invoice_cancelled_at,
                  })}
                />
                <dl className="space-y-1 text-sm">
                  <Row label="Total" value={formatMoney(total)} />
                  <Row label="Paid" value={formatMoney(paid)} />
                  <Row label="Balance" value={formatMoney(balance)} strong />
                </dl>
                {latestInvoiceDelivery ? (
                  <p className="text-xs text-admin-muted">
                    Latest: {latestInvoiceDelivery.status.replaceAll("_", " ")}{" "}
                    {formatCompactDate(latestInvoiceDelivery.last_event_at ?? latestInvoiceDelivery.created_at)}
                    <br />
                    {latestInvoiceDelivery.sent_to}
                  </p>
                ) : (
                  <p className="text-xs text-admin-muted">This invoice has not been sent.</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/invoices/${booking.id}/edit`}
                    className="text-sm text-admin-accent hover:text-admin-ink"
                  >
                    Edit invoice
                  </Link>
                  <a
                    href={`/invoice/${booking.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-admin-accent hover:text-admin-ink"
                  >
                    View <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                  <InvoiceSendButton
                    bookingId={booking.id}
                    sentBefore={invoiceSent}
                    disabled={!booking.client_email}
                    compact
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-admin-muted">No amount set.</p>
                <Link
                  href={`/admin/invoices/${booking.id}/edit`}
                  className="text-sm text-admin-accent hover:text-admin-ink"
                >
                  Build the invoice
                </Link>
              </div>
            )}
          </RailBlock>

          {gallery ? (
            <RailBlock title="Gallery">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/admin/galleries/${gallery.id}`} className="truncate text-sm text-admin-ink hover:text-admin-accent">
                  {gallery.title}
                </Link>
                {gallery.is_published ? (
                  <a href={`/galleries/${gallery.slug}`} target="_blank" rel="noreferrer" className="shrink-0 text-admin-accent hover:text-admin-ink">
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-admin-muted">
                {gallery.is_published ? "Published" : "Not delivered"}
              </p>
            </RailBlock>
          ) : null}

          {booking.internal_note || gallery?.payment_notes ? (
            <RailBlock title="Notes">
              {booking.internal_note ? <p className="text-sm text-admin-ink">{booking.internal_note}</p> : null}
              {gallery?.payment_notes ? (
                <p className="mt-2 text-sm text-admin-muted">{gallery.payment_notes}</p>
              ) : null}
            </RailBlock>
          ) : null}

          <p className="text-xs text-admin-muted">
            Created {formatCompactDate(booking.created_at)}
          </p>
        </aside>
      </div>
    </div>
  );
}

type NextActionInput = {
  booking: Awaited<ReturnType<typeof getBookingById>>;
  agreement: { sent_at: string | null; signed_at: string | null; revoked_at: string | null } | null;
  gallery: { is_published: boolean } | null;
  paid: number;
  balance: number;
  signed: boolean;
  invoiceSent: boolean;
};

/** Derive the single suggested next action from booking state. Plain helper so
 *  the time read stays out of the component render path. */
function suggestNextAction({
  booking,
  agreement,
  gallery,
  paid,
  balance,
  signed,
  invoiceSent,
}: NextActionInput) {
  if (!booking) return null;
  const startMs = booking.start_at ? new Date(booking.start_at).getTime() : null;
  const now = Date.now();
  if (!agreement || !agreement.sent_at) return { label: "Send contract", href: "/admin/agreements" };
  if (!signed && !agreement.revoked_at) return { label: "Nudge the contract", href: "/admin/agreements" };
  if (signed && balance > 0.5 && !invoiceSent) return { label: "Send invoice", href: `/admin/invoices/${booking.id}/edit` };
  if (signed && paid <= 0) return { label: "Record deposit", href: `/admin/invoices/${booking.id}/preview` };
  if (balance > 0.5 && startMs && startMs <= now + 7 * 24 * 60 * 60 * 1000)
    return { label: "Send balance reminder", href: `/admin/invoices/${booking.id}/preview` };
  if (!gallery?.is_published && booking.stage !== "inquiry")
    return {
      label: "Deliver gallery",
      href: booking.gallery_id ? `/admin/galleries/${booking.gallery_id}` : "/admin/galleries",
    };
  return null;
}

function RailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-admin-line bg-admin-surface p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-admin-muted">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-admin-muted">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold text-admin-ink" : "text-admin-ink"}`}>{value}</dd>
    </div>
  );
}
