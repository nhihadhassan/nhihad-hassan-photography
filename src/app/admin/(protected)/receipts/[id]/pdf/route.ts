import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildReceiptPdf } from "@/lib/receipt-pdf";
import { getReceiptById, getReceiptView } from "@/lib/receipts";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const receipt = await getReceiptById(id);
  if (!receipt) return new NextResponse("Not found", { status: 404 });
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
