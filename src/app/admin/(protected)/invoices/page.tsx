import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings } from "@/lib/bookings";
import { getFinanceSummary, listPayments } from "@/lib/finance";
import { listInvoiceDeliveries } from "@/lib/invoice-deliveries";
import { formatMoney, parseAmount } from "@/lib/utils";
import { InvoicesTable, type InvoiceRow } from "@/components/tables/invoices-table";
import { listReceipts } from "@/lib/receipts";

export const dynamic = "force-dynamic";

function SummaryMetric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={"p-5 " + (accent ? "bg-admin-copper/10" : "bg-admin-surface")}>
      <p className="text-sm text-admin-ink/65">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function AdminInvoicesPage() {
  await requireAdmin();
  const [bookings, payments, deliveries, summary, receipts] = await Promise.all([
    getAdminBookings(),
    listPayments(),
    listInvoiceDeliveries(),
    getFinanceSummary(),
    listReceipts(),
  ]);

  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }
  const latestDeliveryByBooking = new Map<string, (typeof deliveries)[number]>();
  for (const delivery of deliveries) {
    if (!latestDeliveryByBooking.has(delivery.booking_id)) {
      latestDeliveryByBooking.set(delivery.booking_id, delivery);
    }
  }
  const latestReceiptByBooking = new Map<string, (typeof receipts)[number]>();
  for (const receipt of receipts) {
    if (!receipt.voided_at && !latestReceiptByBooking.has(receipt.booking_id)) {
      latestReceiptByBooking.set(receipt.booking_id, receipt);
    }
  }

  const rows: InvoiceRow[] = bookings
    .map((b) => {
      const total = parseAmount(b.total) ?? 0;
      const paid = paidByBooking.get(b.id) ?? 0;
      const delivery = latestDeliveryByBooking.get(b.id);
      const receipt = latestReceiptByBooking.get(b.id);
      return {
        id: b.id,
        client: b.client_name ?? b.shoot_type ?? "Untitled invoice",
        total,
        paid,
        balance: Math.max(0, total - paid),
        dueIso: b.invoice_due_date ?? b.start_at,
        hasEmail: Boolean(b.client_email),
        sentAt: b.invoice_sent_at,
        viewedAt: b.invoice_viewed_at,
        cancelledAt: b.invoice_cancelled_at,
        deliveryStatus: delivery?.status ?? null,
        deliveryAt: delivery?.last_event_at ?? delivery?.created_at ?? null,
        receiptId: receipt?.id ?? null,
        receiptSentAt: receipt?.sent_at ?? null,
      };
    })
    // A brand-new draft with no line items and no legacy total yet has
    // nothing to show; it still shows up once it has any amount at all.
    .filter((r) => r.total > 0 || r.sentAt || r.cancelledAt);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-display text-3xl text-admin-ink">Invoices</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
            Create, send, and track invoices. Payments and business expenses live on the{" "}
            <Link href="/admin/finances" className="text-admin-accent hover:underline">
              Finances
            </Link>{" "}
            ledger.
          </p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-admin-ink px-4 text-sm font-medium text-admin-surface"
        >
          <Plus className="size-4" aria-hidden="true" />
          New invoice
        </Link>
      </div>

      <div className="mt-8 grid overflow-hidden rounded-lg border border-admin-ink/10 bg-admin-surface sm:grid-cols-2 lg:grid-cols-3 [&>*]:border-admin-ink/10 [&>*:not(:last-child)]:border-b lg:[&>*:not(:last-child)]:border-b-0 lg:[&>*:not(:last-child)]:border-r">
        <SummaryMetric label="Income this month" value={formatMoney(summary.incomeThisMonth)} />
        <SummaryMetric label="Income this year" value={formatMoney(summary.incomeThisYear)} />
        <SummaryMetric label="Outstanding" value={formatMoney(summary.outstandingTotal)} accent={summary.outstandingTotal > 0} />
      </div>

      <div className="mt-8">
        <InvoicesTable rows={rows} />
      </div>
    </div>
  );
}
