import { requireAdmin } from "@/lib/auth";
import { getFinanceSummary, listExpenses, listPayments } from "@/lib/finance";
import { getAdminBookings } from "@/lib/bookings";
import { FinanceManager } from "@/components/finance-manager";
import { InvoicesTable, type InvoiceRow } from "@/components/tables/invoices-table";
import { formatCompactDate, formatMoney, parseAmount } from "@/lib/utils";
import { siteUrl } from "@/lib/seo";
import {
  listInvoiceDeliveries,
  successfulInvoiceDelivery,
} from "@/lib/invoice-deliveries";

export const dynamic = "force-dynamic";

function SummaryMetric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={"p-5 " + (accent ? "bg-admin-copper/10" : "bg-admin-surface")}>
      <p className="text-sm text-admin-ink/65">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function AdminFinancesPage() {
  await requireAdmin();
  const [summary, payments, expenses, bookings, deliveries] = await Promise.all([
    getFinanceSummary(),
    listPayments(),
    listExpenses(),
    getAdminBookings(),
    listInvoiceDeliveries(),
  ]);

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }
  const latestDeliveryByBooking = new Map<string, (typeof deliveries)[number]>();
  const sentBookings = new Set<string>();
  for (const delivery of deliveries) {
    if (!latestDeliveryByBooking.has(delivery.booking_id)) {
      latestDeliveryByBooking.set(delivery.booking_id, delivery);
    }
    if (successfulInvoiceDelivery(delivery)) sentBookings.add(delivery.booking_id);
  }

  const invoiceRows: InvoiceRow[] = bookings
    .map((b) => {
      const total = parseAmount(b.total) ?? 0;
      const paid = paidByBooking.get(b.id) ?? 0;
      const delivery = latestDeliveryByBooking.get(b.id);
      return {
        id: b.id,
        client: b.client_name ?? b.shoot_type ?? "Booking",
        total,
        paid,
        balance: Math.max(0, total - paid),
        dueIso: b.start_at,
        invoiceUrl: `${origin}/invoice/${b.token}`,
        hasEmail: Boolean(b.client_email),
        sent: sentBookings.has(b.id),
        deliveryStatus: delivery?.status ?? null,
        deliveryAt: delivery?.last_event_at ?? delivery?.created_at ?? null,
      };
    })
    .filter((r) => r.total > 0);

  const bookingOptions = bookings.map((b) => ({
    id: b.id,
    label: [b.client_name ?? b.shoot_type ?? "Booking", b.start_at ? formatCompactDate(b.start_at) : null]
      .filter(Boolean)
      .join(" · "),
    total: parseAmount(b.total) ?? 0,
    paid: paidByBooking.get(b.id) ?? 0,
    balance: Math.max(0, (parseAmount(b.total) ?? 0) - (paidByBooking.get(b.id) ?? 0)),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-sm font-medium text-admin-accent">Invoices</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Invoices and money</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Invoice status, outstanding balances, and your bottom line. Reporting only; payments
          themselves stay on Interac e-Transfer.
        </p>
      </div>

      <div className="mt-8 grid overflow-hidden rounded-lg border border-admin-ink/10 bg-admin-surface sm:grid-cols-2 lg:grid-cols-5 [&>*]:border-admin-ink/10 [&>*:not(:last-child)]:border-b lg:[&>*:not(:last-child)]:border-b-0 lg:[&>*:not(:last-child)]:border-r">
        <SummaryMetric label="Income this month" value={formatMoney(summary.incomeThisMonth)} />
        <SummaryMetric label="Income this year" value={formatMoney(summary.incomeThisYear)} />
        <SummaryMetric label="Expenses this year" value={formatMoney(summary.expensesThisYear)} />
        <SummaryMetric label="Net this year" value={formatMoney(summary.netThisYear)} />
        <SummaryMetric label="Outstanding" value={formatMoney(summary.outstandingTotal)} accent={summary.outstandingTotal > 0} />
      </div>

      <section className="mt-8">
        <h2 className="admin-display text-xl text-admin-ink">Invoices</h2>
        <p className="mt-1 text-sm text-admin-muted">
          One row per booking with a total. Status is derived from recorded payments against the shoot date.
        </p>
        <div className="mt-4">
          <InvoicesTable rows={invoiceRows} />
        </div>
      </section>

      <div className="mt-10 border-t border-admin-line pt-8">
        <h2 className="admin-display text-xl text-admin-ink">Payments and expenses</h2>
        <div className="mt-4">
          <FinanceManager payments={payments} expenses={expenses} bookings={bookingOptions} />
        </div>
      </div>
    </div>
  );
}
