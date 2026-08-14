import { NextResponse } from "next/server";
import { buildReceiptPdf } from "@/lib/receipt-pdf";
import { getReceiptByToken, getReceiptView } from "@/lib/receipts";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const receipt = await getReceiptByToken(token);
  if (!receipt || receipt.voided_at || !receipt.sent_at) return new NextResponse("Not found", { status: 404 });
  const view = await getReceiptView(receipt);
  const pdf = await buildReceiptPdf(view);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${view.receiptNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
