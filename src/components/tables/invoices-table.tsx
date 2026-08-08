"use client";

import { ExternalLink } from "lucide-react";
import { DataTable, type Column, type FilterTab } from "@/components/ui/data-table";
import { StatusChip, statusForInvoice, type StatusKey } from "@/components/ui/status-chip";
import { InvoiceSendButton } from "@/components/invoice-send-button";
import { formatMoney, formatRelativeDate } from "@/lib/utils";

export type InvoiceRow = {
  id: string;
  client: string;
  total: number;
  paid: number;
  balance: number;
  dueIso: string | null;
  invoiceUrl: string;
  hasEmail: boolean;
  sentAt: string | null;
  viewedAt: string | null;
  cancelledAt: string | null;
  deliveryStatus: string | null;
  deliveryAt: string | null;
};

function statusOf(r: InvoiceRow): StatusKey {
  return statusForInvoice({
    total: r.total,
    paid: r.paid,
    dueAt: r.dueIso,
    sentAt: r.sentAt,
    viewedAt: r.viewedAt,
    cancelledAt: r.cancelledAt,
  });
}

function deliveryLabel(r: InvoiceRow) {
  if (!r.deliveryStatus) return "Not sent";
  const label = r.deliveryStatus.replaceAll("_", " ");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}${r.deliveryAt ? ` ${formatRelativeDate(r.deliveryAt)}` : ""}`;
}

export function InvoicesTable({ rows }: { rows: InvoiceRow[] }) {
  const columns: Column<InvoiceRow>[] = [
    { key: "client", header: "Client", render: (r) => <span className="font-medium">{r.client}</span>, sortValue: (r) => r.client },
    { key: "status", header: "Status", render: (r) => <StatusChip status={statusOf(r)} /> },
    {
      key: "due",
      header: "Due",
      render: (r) => (r.dueIso ? formatRelativeDate(r.dueIso) : "-"),
      sortValue: (r) => r.dueIso ?? "",
      hideOnMobile: true,
    },
    { key: "total", header: "Total", numeric: true, render: (r) => formatMoney(r.total), sortValue: (r) => r.total },
    { key: "paid", header: "Paid", numeric: true, render: (r) => formatMoney(r.paid), hideOnMobile: true },
    { key: "balance", header: "Balance", numeric: true, render: (r) => formatMoney(r.balance), sortValue: (r) => r.balance },
    {
      key: "delivery",
      header: "Delivery",
      render: (r) => <span className="text-xs text-admin-muted">{deliveryLabel(r)}</span>,
      sortValue: (r) => r.deliveryAt ?? "",
      hideOnMobile: true,
    },
  ];

  const tabs: FilterTab<InvoiceRow>[] = [
    { key: "open", label: "Open", predicate: (r) => r.balance > 0.5 && statusOf(r) !== "cancelled" },
    { key: "draft", label: "Draft", predicate: (r) => statusOf(r) === "draft" },
    { key: "overdue", label: "Overdue", predicate: (r) => statusOf(r) === "overdue" },
    { key: "paid", label: "Paid", predicate: (r) => statusOf(r) === "paid" },
    { key: "cancelled", label: "Cancelled", predicate: (r) => statusOf(r) === "cancelled" },
    { key: "all", label: "All", predicate: () => true },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      getRowHref={(r) => `/admin/invoices/${r.id}/preview`}
      searchText={(r) => r.client}
      searchPlaceholder="Search invoices"
      filterTabs={tabs}
      rowActions={(r) => (
        <div className="flex items-center gap-2">
          <a
            href={r.invoiceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-admin-accent hover:text-admin-ink"
          >
            View <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
          <InvoiceSendButton
            bookingId={r.id}
            sentBefore={Boolean(r.sentAt)}
            disabled={!r.hasEmail}
            compact
          />
        </div>
      )}
      emptyState="No invoices yet."
    />
  );
}
