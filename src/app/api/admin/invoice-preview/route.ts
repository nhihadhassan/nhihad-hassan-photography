import { getAdminUser } from "@/lib/auth";
import { getBookingById } from "@/lib/bookings";
import { getInvoiceView } from "@/lib/invoice-data";
import { computeInvoiceTotals } from "@/lib/invoice-items";
import { parseInvoiceDraft } from "@/lib/invoice-draft";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Renders the real invoice PDF from an unsaved draft, so "Preview" shows what
 * the client will actually receive rather than the last saved state. Nothing is
 * written; the draft is used purely to recompute totals for this render.
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return new Response("Sign in as an admin.", { status: 401 });

  let body: { bookingId?: string; draft?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  if (!body.bookingId) return new Response("Missing bookingId.", { status: 400 });

  const booking = await getBookingById(body.bookingId);
  if (!booking) return new Response("Booking not found.", { status: 404 });

  // Saved view supplies the invoice number, client, shoot details and payments.
  const saved = await getInvoiceView(booking);
  const draft = parseInvoiceDraft(body.draft);

  // Recompute totals from the draft rather than the stored rows.
  const draftItems = draft.items.map((item, index) => ({
    id: `draft-${index}`,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: Math.round((item.quantity * item.unitPrice + Number.EPSILON) * 100) / 100,
  }));

  const totals = computeInvoiceTotals({
    items: draftItems,
    fallbackTotal: booking.total,
    deposit: booking.deposit,
    discount: draft.discount,
    paid: saved.paid,
  });

  const bytes = await buildInvoicePdf({
    ...saved,
    ...totals,
    lines: draftItems,
    dueDate: draft.dueDate,
    poNumber: draft.poNumber,
    notes: draft.notes,
  });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${saved.invoiceNumber}-preview.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
