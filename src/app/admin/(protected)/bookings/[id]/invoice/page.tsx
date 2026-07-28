import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { getInvoiceView } from "@/lib/invoice-data";
import { InvoiceEditor } from "@/components/invoice-editor";

type Props = { params: Promise<{ id: string }> };

export default async function BookingInvoicePage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const booking = await getBookingById(id);
  if (!booking) notFound();

  const view = await getInvoiceView(booking);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/admin/bookings/${id}`}
        className="inline-flex items-center gap-2 text-sm text-admin-muted hover:text-admin-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to booking
      </Link>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-display text-2xl text-admin-ink">Invoice</h1>
          <p className="mt-1 text-sm text-admin-muted">
            Break the shoot into line items. Preview it before you send.
          </p>
        </div>
        <a
          href={`/invoice/${booking.token}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-admin-accent hover:text-admin-ink"
        >
          What the client sees
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      {!view.itemised && view.subtotal > 0 ? (
        <p className="mt-5 rounded-md border border-admin-copper/40 bg-admin-copper/10 px-4 py-3 text-sm text-admin-ink">
          This booking is still billed as a single total of{" "}
          <strong className="font-medium">${view.subtotal.toFixed(2)}</strong>. Adding line items
          below replaces that with an itemised breakdown.
        </p>
      ) : null}

      <div className="mt-6">
        <InvoiceEditor
          bookingId={booking.id}
          invoiceNumber={view.invoiceNumber}
          clientName={view.clientName}
          clientEmail={view.clientEmail}
          paid={view.paid}
          initialItems={view.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))}
          initialDiscount={view.discount}
          initialDueDate={view.dueDate}
          initialPoNumber={view.poNumber}
          initialNotes={view.notes}
        />
      </div>
    </div>
  );
}
