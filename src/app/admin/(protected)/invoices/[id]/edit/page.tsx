import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { getInvoiceView } from "@/lib/invoice-data";
import { InvoiceBuilder } from "@/components/invoice-builder";

export const dynamic = "force-dynamic";

/**
 * Document-first invoice editor. Only reachable for a draft: once an
 * invoice has been sent (or cancelled), its content is frozen -- the same
 * "editor redirects to the read-only page once no longer a draft" guard
 * /admin/agreements/[id]/edit uses for contracts.
 */
export default async function InvoiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  if (booking.invoice_sent_at || booking.invoice_cancelled_at) {
    redirect(`/admin/invoices/${id}/preview`);
  }

  const view = await getInvoiceView(booking);

  return (
    <InvoiceBuilder
      bookingId={booking.id}
      invoiceNumber={view.invoiceNumber}
      initialClientName={view.clientName}
      initialClientEmail={view.clientEmail ?? ""}
      paid={view.paid}
      initialItems={view.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice }))}
      initialDiscount={view.discount}
      initialTaxRate={view.taxRate}
      initialDueDate={view.dueDate}
      initialPoNumber={view.poNumber}
      initialNotes={view.notes}
      initialPaymentInstructions={view.paymentInstructions}
    />
  );
}
