import { getBookingByToken, getOrAssignInvoiceNumber } from "@/lib/bookings";
import { listPaymentsForBooking } from "@/lib/finance";
import { calculateInvoicePaymentState } from "@/lib/invoice-state";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) return new Response("Invoice not found.", { status: 404 });

  const [payments, assignedNumber] = await Promise.all([
    listPaymentsForBooking(booking.id),
    getOrAssignInvoiceNumber(booking.id),
  ]);
  const payment = calculateInvoicePaymentState({
    total: booking.total,
    deposit: booking.deposit,
    paid: payments.reduce((sum, item) => sum + item.amount, 0),
  });
  const invoiceNumber =
    assignedNumber ??
    `NHP-${booking.token.slice(0, 8).toUpperCase()}`;
  const bytes = await buildInvoicePdf({
    invoiceNumber,
    issuedAt: booking.created_at,
    clientName: booking.client_name ?? "Client",
    clientEmail: booking.client_email,
    shootType: booking.shoot_type ?? "Photography services",
    shootDate: booking.start_at,
    location: booking.location,
    ...payment,
  });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
