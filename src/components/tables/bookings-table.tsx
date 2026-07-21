"use client";

import { DataTable, type Column, type FilterTab } from "@/components/ui/data-table";
import { BookingRowActions } from "@/components/booking-row-actions";
import { cn, formatRelativeDate } from "@/lib/utils";

export type BookingRow = {
  id: string;
  client: string;
  packageLabel: string;
  shootIso: string | null;
  stageLabel: string;
  stageOrder: number;
  moneyLabel: string;
  moneyTone: "positive" | "warning" | "neutral";
  isUpcoming: boolean;
  hubUrl: string;
  invoiceUrl: string;
  hasEmail: boolean;
  hasCalendar: boolean;
};

const MONEY_TONE: Record<BookingRow["moneyTone"], string> = {
  positive: "bg-admin-status-positive-tint text-admin-status-positive",
  warning: "bg-admin-status-waiting-tint text-admin-status-waiting",
  neutral: "bg-admin-status-neutral-tint text-admin-status-neutral",
};

export function BookingsTable({ rows }: { rows: BookingRow[] }) {
  const columns: Column<BookingRow>[] = [
    { key: "client", header: "Client", render: (r) => <span className="font-medium">{r.client}</span>, sortValue: (r) => r.client },
    { key: "package", header: "Package", render: (r) => r.packageLabel || "-", hideOnMobile: true },
    {
      key: "shoot",
      header: "Shoot",
      render: (r) => formatRelativeDate(r.shootIso),
      sortValue: (r) => r.shootIso ?? "",
      hideOnMobile: true,
    },
    { key: "stage", header: "Stage", render: (r) => r.stageLabel, sortValue: (r) => r.stageOrder },
    {
      key: "money",
      header: "Money",
      numeric: true,
      render: (r) => (
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", MONEY_TONE[r.moneyTone])}>{r.moneyLabel}</span>
      ),
    },
  ];

  const tabs: FilterTab<BookingRow>[] = [
    { key: "all", label: "All", predicate: () => true },
    { key: "upcoming", label: "Upcoming", predicate: (r) => r.isUpcoming },
    { key: "past", label: "Past", predicate: (r) => !r.isUpcoming && Boolean(r.shootIso) },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      getRowHref={(r) => `/admin/bookings/${r.id}`}
      searchText={(r) => `${r.client} ${r.packageLabel}`}
      searchPlaceholder="Search bookings"
      filterTabs={tabs}
      rowActions={(r) => (
        <BookingRowActions
          id={r.id}
          hubUrl={r.hubUrl}
          invoiceUrl={r.invoiceUrl}
          hasCalendar={r.hasCalendar}
          hasEmail={r.hasEmail}
        />
      )}
      emptyState="No bookings yet."
    />
  );
}
