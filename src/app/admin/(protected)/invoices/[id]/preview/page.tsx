import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { getInvoiceView } from "@/lib/invoice-data";
import { listInvoiceDeliveriesForBooking } from "@/lib/invoice-deliveries";
import { InvoiceDocument } from "@/components/invoice-document";
import { InvoiceSendSection } from "@/components/invoice-admin-actions";
import { RecordPaymentForm } from "@/components/record-payment-form";
import { formatCompactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview invoice",
  robots: { index: false, follow: false },
};

export default async function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const [view, deliveries] = await Promise.all([
    getInvoiceView(booking),
    listInvoiceDeliveriesForBooking(booking.id),
  ]);

  const blockedReason = !booking.client_email
    ? "This invoice has no client email saved. Add one before sending."
    : view.total <= 0
      ? "Add at least one line item before sending."
      : undefined;

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <Link href="/admin/invoices" className="inline-flex items-center gap-2 text-sm text-admin-ink/60 transition hover:text-admin-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to invoices
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-admin-accent">Preview</p>
            <h1 className="admin-display mt-1 text-2xl text-admin-ink">Invoice {view.invoiceNumber}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!view.locked ? (
              <Link
                href={`/admin/invoices/${booking.id}/edit`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </Link>
            ) : null}
            <a
              href={`/invoice/${booking.token}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Open client link
            </a>
          </div>
        </div>
        {view.locked ? (
          <p className="mt-2 text-xs text-admin-ink/50">
            Sent {view.sentAt ? formatCompactDate(view.sentAt) : ""}. Content is frozen so this always
            matches what the client received; cancel it to stop billing against it.
          </p>
        ) : null}

        <section className="mt-6">
          <h2 className="admin-display text-lg text-admin-ink">Send it</h2>
          <div className="mt-3">
            <InvoiceSendSection
              bookingId={booking.id}
              recipientEmail={booking.client_email}
              alreadySent={view.status !== "draft" && view.status !== "cancelled"}
              cancelled={view.status === "cancelled"}
              disabledReason={blockedReason}
            />
          </div>
          {deliveries.length ? (
            <ul className="mt-3 space-y-1 text-xs text-admin-ink/55">
              {deliveries.map((d) => (
                <li key={d.id}>
                  {d.status.replaceAll("_", " ")} · {formatCompactDate(d.last_event_at ?? d.created_at)} · {d.sent_to}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {view.balance > 0 && view.status !== "cancelled" ? (
          <section className="mt-6">
            <h2 className="admin-display text-lg text-admin-ink">Record a payment</h2>
            <div className="mt-3">
              <RecordPaymentForm bookingId={booking.id} suggestedAmount={view.balance} />
            </div>
          </section>
        ) : null}
      </div>

      <div className="mt-8 border-t border-admin-line">
        <InvoiceDocument invoice={view} token={booking.token} variant="preview" />
      </div>
    </div>
  );
}
