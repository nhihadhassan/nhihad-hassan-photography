import Link from "next/link";
import { CalendarPlus, FilePlus2, ReceiptText, UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAttentionItems, getMoneyRow, type AttentionSeverity } from "@/lib/attention";
import { formatAge, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TZ = "America/Toronto";

const SEVERITY_DOT: Record<AttentionSeverity, string> = {
  danger: "bg-admin-status-danger",
  warning: "bg-admin-status-waiting",
  info: "bg-admin-status-info",
};

function todayLabel() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default async function TodayPage() {
  await requireAdmin();

  const [money, attention] = await Promise.all([getMoneyRow(), getAttentionItems()]);

  const moneyCards = [
    {
      label: "Collected this month",
      value: formatMoney(money.collectedThisMonth),
      sub: "Payments recorded",
      href: "/admin/finances",
    },
    {
      label: "Outstanding",
      value: formatMoney(money.outstandingTotal),
      sub: `${money.outstandingCount} ${money.outstandingCount === 1 ? "invoice" : "invoices"}`,
      href: "/admin/finances",
    },
    {
      label: "Booked ahead",
      value: formatMoney(money.bookedAhead),
      sub: "Confirmed future work",
      href: "/admin/schedule",
    },
  ];

  const quickCreate = [
    { label: "New booking", href: "/admin/bookings/new", icon: CalendarPlus },
    { label: "New invoice", href: "/admin/finances", icon: ReceiptText },
    { label: "New contract", href: "/admin/agreements", icon: FilePlus2 },
    { label: "New client", href: "/admin/clients", icon: UserPlus },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-admin-accent">Today</p>
        <h1 className="admin-display text-3xl text-admin-ink">{todayLabel()}</h1>
      </header>

      {/* Money row */}
      <section aria-label="Money" className="mt-6 grid gap-4 sm:grid-cols-3">
        {moneyCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-xl border border-admin-line bg-admin-surface p-5 transition hover:border-admin-line-strong"
          >
            <p className="text-sm text-admin-muted">{card.label}</p>
            <p className="admin-display mt-3 text-4xl tabular-nums text-admin-ink">{card.value}</p>
            <p className="mt-2 text-xs text-admin-muted">{card.sub}</p>
          </Link>
        ))}
      </section>

      {/* Needs attention */}
      <section aria-label="Needs attention" className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="admin-display text-xl text-admin-ink">Needs attention</h2>
          {attention.length > 0 ? (
            <span className="text-sm text-admin-muted tabular-nums">{attention.length}</span>
          ) : null}
        </div>

        {attention.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-admin-line-strong bg-admin-surface p-10 text-center">
            <p className="admin-display text-2xl text-admin-ink">Nothing needs you.</p>
            <p className="mt-1 text-sm text-admin-muted">Go shoot.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-admin-line overflow-hidden rounded-xl border border-admin-line bg-admin-surface">
            {attention.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-admin-subtle"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 size-2 shrink-0 rounded-full ${SEVERITY_DOT[item.severity]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-admin-ink">{item.client}</p>
                  <p className="truncate text-sm text-admin-muted">{item.problem}</p>
                </div>
                {item.since ? (
                  <span className="hidden shrink-0 text-xs text-admin-muted tabular-nums sm:inline">
                    {formatAge(item.since)}
                  </span>
                ) : null}
                {item.action.external ? (
                  <a
                    href={item.action.href}
                    className="shrink-0 rounded-lg border border-admin-line-strong bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-ink hover:bg-admin-raise"
                  >
                    {item.action.label}
                  </a>
                ) : (
                  <Link
                    href={item.action.href}
                    className="shrink-0 rounded-lg border border-admin-line-strong bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-ink hover:bg-admin-raise"
                  >
                    {item.action.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick create */}
      <section aria-label="Quick create" className="mt-8">
        <h2 className="text-sm font-medium text-admin-muted">Quick create</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickCreate.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-admin-line-strong bg-admin-surface px-4 text-sm font-medium text-admin-ink transition hover:bg-admin-raise"
              >
                <Icon className="size-4 text-admin-muted" aria-hidden="true" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
