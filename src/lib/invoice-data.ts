import "server-only";
import type { Booking } from "@/lib/bookings";
import { getOrAssignInvoiceNumber } from "@/lib/bookings";
import { listPaymentsForBooking } from "@/lib/finance";
import { computeInvoiceTotals, listInvoiceItems, type InvoiceTotals } from "@/lib/invoice-items";

export type InvoiceView = InvoiceTotals & {
  invoiceNumber: string;
  issuedAt: string;
  dueDate: string | null;
  poNumber: string | null;
  notes: string | null;
  clientName: string;
  clientEmail: string | null;
  shootType: string;
  shootDate: string | null;
  location: string | null;
};

/**
 * Everything needed to render an invoice, in one place.
 *
 * The send action, the client-facing invoice page, the public PDF route, and
 * the admin preview all call this, so the numbers a client sees can never drift
 * from the numbers the admin previewed. Previously each of those surfaces
 * repeated the same fetch-and-total block.
 */
export async function getInvoiceView(booking: Booking): Promise<InvoiceView> {
  const [payments, assignedNumber, items] = await Promise.all([
    listPaymentsForBooking(booking.id),
    getOrAssignInvoiceNumber(booking.id),
    listInvoiceItems(booking.id),
  ]);

  const totals = computeInvoiceTotals({
    items,
    fallbackTotal: booking.total,
    deposit: booking.deposit,
    discount: booking.invoice_discount,
    paid: payments.reduce((sum, item) => sum + item.amount, 0),
  });

  return {
    ...totals,
    invoiceNumber: assignedNumber ?? `NHP-${booking.token.slice(0, 8).toUpperCase()}`,
    issuedAt: booking.created_at,
    dueDate: booking.invoice_due_date,
    poNumber: booking.invoice_po_number,
    notes: booking.invoice_notes,
    clientName: booking.client_name ?? "Client",
    clientEmail: booking.client_email,
    shootType: booking.shoot_type ?? "Photography services",
    shootDate: booking.start_at,
    location: booking.location,
  };
}
