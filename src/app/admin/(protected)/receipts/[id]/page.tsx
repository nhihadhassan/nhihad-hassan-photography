import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getReceiptById, getReceiptView } from "@/lib/receipts";
import { ReceiptAdminActions } from "@/components/receipt-admin-actions";
import { ReceiptDocument } from "@/components/receipt-document";

export const dynamic = "force-dynamic";

export default async function AdminReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const receipt = await getReceiptById(id);
  if (!receipt) notFound();
  const view = await getReceiptView(receipt);
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/invoices" className="text-sm text-admin-muted hover:text-admin-ink">Invoices</Link>
      <header className="mt-2 flex flex-col gap-4 border-b border-admin-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-admin-accent">Receipt</p>
          <h1 className="admin-display mt-1 text-3xl text-admin-ink">{view.receiptNumber}</h1>
          <p className="mt-1 text-sm text-admin-muted">
            {receipt.voided_at ? "Void" : receipt.sent_at ? "Sent" : "Prepared for review"}
          </p>
        </div>
        <a href={`/admin/receipts/${receipt.id}/pdf`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-admin-line-strong px-3 text-sm font-medium text-admin-ink hover:bg-admin-raise">
          <Download className="size-4" aria-hidden="true" />Download PDF
        </a>
      </header>
      <div className="mt-5 rounded-xl border border-admin-line bg-admin-surface p-4">
        <ReceiptAdminActions receiptId={receipt.id} sentBefore={Boolean(receipt.sent_at)} canSend={Boolean(view.clientEmail)} isVoid={Boolean(receipt.voided_at)} />
      </div>
      <div className="mt-5 overflow-hidden rounded-xl"><ReceiptDocument receipt={view} /></div>
    </div>
  );
}
