import { requireAdmin } from "@/lib/auth";
import { getFinanceSummary, listExpenses, listPayments } from "@/lib/finance";
import { getAdminBookings } from "@/lib/bookings";
import { FinanceManager } from "@/components/finance-manager";
import { formatCompactDate, formatMoney, parseAmount } from "@/lib/utils";

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
  const [summary, payments, expenses, bookings] = await Promise.all([
    getFinanceSummary(),
    listPayments(),
    listExpenses(),
    getAdminBookings(),
  ]);

  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }

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
        <p className="text-sm font-medium text-admin-accent">Finances</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Finances</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Payments and business expenses, and your bottom line. To create or send an invoice, use{" "}
          <a href="/admin/invoices" className="text-admin-accent hover:underline">
            Invoices
          </a>
          .
        </p>
      </div>

      <div className="mt-8 grid overflow-hidden rounded-lg border border-admin-ink/10 bg-admin-surface sm:grid-cols-2 lg:grid-cols-4 [&>*]:border-admin-ink/10 [&>*:not(:last-child)]:border-b lg:[&>*:not(:last-child)]:border-b-0 lg:[&>*:not(:last-child)]:border-r">
        <SummaryMetric label="Income this month" value={formatMoney(summary.incomeThisMonth)} />
        <SummaryMetric label="Income this year" value={formatMoney(summary.incomeThisYear)} />
        <SummaryMetric label="Expenses this year" value={formatMoney(summary.expensesThisYear)} />
        <SummaryMetric label="Net this year" value={formatMoney(summary.netThisYear)} />
      </div>

      <div className="mt-10">
        <FinanceManager payments={payments} expenses={expenses} bookings={bookingOptions} />
      </div>
    </div>
  );
}
