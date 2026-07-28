import { getBookingByToken } from "@/lib/bookings";
import { getInvoiceView } from "@/lib/invoice-data";
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

  const view = await getInvoiceView(booking);
  const { invoiceNumber } = view;
  const bytes = await buildInvoicePdf({ ...view, lines: view.items });

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
