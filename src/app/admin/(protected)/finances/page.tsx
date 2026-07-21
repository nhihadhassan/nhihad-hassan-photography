import { requireAdmin } from "@/lib/auth";
import { getFinanceSummary, listExpenses, listPayments } from "@/lib/finance";
import { getAdminBookings } from "@/lib/bookings";
import { FinanceManager } from "@/components/finance-manager";
import { InvoicesTable, type InvoiceRow } from "@/components/tables/invoices-table";
import { formatCompactDate, formatMoney, parseAmount } from "@/lib/utils";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={"rounded-md border p-5 " + (accent ? "border-admin-accent/40 bg-admin-copper/10" : "border-admin-ink/10 bg-admin-surface")}>
      <p className="text-sm text-admin-ink/58">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function AdminFinancesPage() {
  await requireAdmin();
  const [summary, payments, expenses, bookings] = await Promise.all([
    getFinanceSummary(),
    listPayments(),
    listExpenses(),
    getAdminBookings(),
  ]);

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }

  const invoiceRows: InvoiceRow[] = bookings
    .map((b) => {
      const total = parseAmount(b.total) ?? 0;
      const paid = paidByBooking.get(b.id) ?? 0;
      return {
        id: b.id,
        client: b.client_name ?? b.shoot_type ?? "Booking",
        total,
        paid,
        balance: Math.max(0, total - paid),
        dueIso: b.start_at,
        invoiceUrl: `${origin}/invoice/${b.token}`,
      };
    })
    .filter((r) => r.total > 0);

  const bookingOptions = bookings.map((b) => ({
    id: b.id,
    label: [b.client_name ?? b.shoot_type ?? "Booking", b.start_at ? formatCompactDate(b.start_at) : null]
      .filter(Boolean)
      .join(" · "),
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label="Income this month" value={formatMoney(summary.incomeThisMonth)} />
        <SummaryCard label="Income this year" value={formatMoney(summary.incomeThisYear)} />
        <SummaryCard label="Expenses this year" value={formatMoney(summary.expensesThisYear)} />
        <SummaryCard label="Net this year" value={formatMoney(summary.netThisYear)} />
        <SummaryCard label="Outstanding" value={formatMoney(summary.outstandingTotal)} accent={summary.outstandingTotal > 0} />
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
