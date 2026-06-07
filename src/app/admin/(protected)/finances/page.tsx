import Link from "next/link";
import { Wallet } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getFinanceSummary, getOutstanding, listExpenses, listPayments } from "@/lib/finance";
import { getAdminBookings } from "@/lib/bookings";
import { FinanceManager } from "@/components/finance-manager";
import { formatCompactDate, formatMoney } from "@/lib/utils";

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
  const [summary, payments, expenses, outstanding, bookings] = await Promise.all([
    getFinanceSummary(),
    listPayments(),
    listExpenses(),
    getOutstanding(),
    getAdminBookings(),
  ]);

  const bookingOptions = bookings.map((b) => ({
    id: b.id,
    label: [b.client_name ?? b.shoot_type ?? "Booking", b.start_at ? formatCompactDate(b.start_at) : null]
      .filter(Boolean)
      .join(" · "),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <Wallet className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Finances</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Money</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Record payments and expenses to track income, outstanding balances, and your bottom line.
            Reporting only; payments themselves stay on Interac e-Transfer.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard label="Income this month" value={formatMoney(summary.incomeThisMonth)} />
        <SummaryCard label="Income this year" value={formatMoney(summary.incomeThisYear)} />
        <SummaryCard label="Expenses this year" value={formatMoney(summary.expensesThisYear)} />
        <SummaryCard label="Net this year" value={formatMoney(summary.netThisYear)} />
        <SummaryCard label="Outstanding" value={formatMoney(summary.outstandingTotal)} accent={summary.outstandingTotal > 0} />
      </div>

      {outstanding.length ? (
        <section className="mt-8 rounded-md border border-admin-ink/10 bg-admin-surface p-5">
          <h2 className="text-lg font-semibold tracking-tight">Outstanding balances</h2>
          <p className="mt-1 text-sm text-admin-ink/55">
            Booking total minus recorded payments. Link payments to a booking to keep this accurate.
          </p>
          <div className="mt-4 divide-y divide-admin-ink/10">
            {outstanding.map((o) => (
              <Link key={o.bookingId} href={`/admin/bookings/${o.bookingId}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition hover:text-admin-accent">
                <span className="font-medium">{o.clientName ?? o.shootType ?? "Booking"}</span>
                <span className="text-admin-ink/55">
                  {formatMoney(o.paid)} paid of {formatMoney(o.total)} ·{" "}
                  <span className="font-medium text-admin-accent">{formatMoney(o.outstanding)} due</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <FinanceManager payments={payments} expenses={expenses} bookings={bookingOptions} />
      </div>
    </div>
  );
}
