"use client";

import { DataTable, type Column, type FilterTab } from "@/components/ui/data-table";
import type { ClientSummary } from "@/lib/clients";
import { formatMoney, formatRelativeDate } from "@/lib/utils";

export function ClientsDataTable({ rows }: { rows: ClientSummary[] }) {
  const columns: Column<ClientSummary>[] = [
    { key: "name", header: "Client", render: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "email", header: "Email", render: (r) => r.email ?? "-", hideOnMobile: true },
    {
      key: "next",
      header: "Next shoot",
      render: (r) => (r.nextShootAt ? formatRelativeDate(r.nextShootAt) : "-"),
      sortValue: (r) => r.nextShootAt ?? "",
      hideOnMobile: true,
    },
    { key: "bookings", header: "Bookings", numeric: true, render: (r) => String(r.bookingCount), sortValue: (r) => r.bookingCount, hideOnMobile: true },
    {
      key: "outstanding",
      header: "Outstanding",
      numeric: true,
      render: (r) => (r.outstandingBalance > 0.5 ? formatMoney(r.outstandingBalance) : "-"),
      sortValue: (r) => r.outstandingBalance,
    },
    {
      key: "activity",
      header: "Last activity",
      render: (r) => (r.lastActivity ? formatRelativeDate(r.lastActivity) : "-"),
      sortValue: (r) => r.lastActivity ?? "",
      hideOnMobile: true,
    },
  ];

  const tabs: FilterTab<ClientSummary>[] = [
    { key: "all", label: "All", predicate: () => true },
    { key: "outstanding", label: "Owes money", predicate: (r) => r.outstandingBalance > 0.5 },
    { key: "unsigned", label: "Unsigned contract", predicate: (r) => r.hasUnsignedContract },
    { key: "upcoming", label: "Upcoming shoot", predicate: (r) => Boolean(r.nextShootAt) },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.key}
      getRowHref={(r) => `/admin/clients/${encodeURIComponent(r.key)}`}
      searchText={(r) => `${r.name} ${r.email ?? ""}`}
      searchPlaceholder="Search clients"
      filterTabs={tabs}
      emptyState="No clients yet."
    />
  );
}
