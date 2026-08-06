"use client";

import { ExternalLink } from "lucide-react";
import { DataTable, type Column, type FilterTab } from "@/components/ui/data-table";
import { StatusChip, statusForContract } from "@/components/ui/status-chip";
import { formatRelativeDate } from "@/lib/utils";

export type ContractRow = {
  id: string;
  client: string;
  galleryTitle: string;
  token: string;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  expired_at: string | null;
  created_at: string;
};

export function ContractsTable({ rows }: { rows: ContractRow[] }) {
  const columns: Column<ContractRow>[] = [
    { key: "client", header: "Client", render: (r) => <span className="font-medium">{r.client}</span>, sortValue: (r) => r.client },
    { key: "gallery", header: "Gallery", render: (r) => r.galleryTitle || "-", hideOnMobile: true },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusChip status={statusForContract(r)} />,
    },
    {
      key: "sent",
      header: "Sent",
      render: (r) => (r.sent_at ? formatRelativeDate(r.sent_at) : "Not sent"),
      sortValue: (r) => r.sent_at ?? "",
      hideOnMobile: true,
    },
  ];

  const tabs: FilterTab<ContractRow>[] = [
    { key: "awaiting", label: "Awaiting signature", predicate: (r) => Boolean(r.sent_at) && !r.signed_at && !r.revoked_at && !r.expired_at && (!r.expires_at || new Date(r.expires_at).getTime() > Date.now()) },
    { key: "signed", label: "Signed", predicate: (r) => Boolean(r.signed_at) },
    { key: "expired", label: "Expired", predicate: (r) => !r.signed_at && Boolean(r.expired_at || (r.expires_at && new Date(r.expires_at).getTime() <= Date.now())) },
    { key: "draft", label: "Draft", predicate: (r) => !r.sent_at && !r.revoked_at && !r.expired_at && (!r.expires_at || new Date(r.expires_at).getTime() > Date.now()) },
    { key: "all", label: "All", predicate: () => true },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => `${r.client} ${r.galleryTitle}`}
      searchPlaceholder="Search contracts"
      filterTabs={tabs}
      rowActions={(r) => (
        <a
          href={`/agreement/${r.token}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-admin-accent hover:text-admin-ink"
        >
          View <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
      emptyState="No contracts yet."
    />
  );
}
