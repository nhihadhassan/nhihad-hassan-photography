"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  /** Cell renderer. */
  render: (row: T) => React.ReactNode;
  /** When set, the column is sortable by this comparable value. */
  sortValue?: (row: T) => string | number;
  /** Money / counts: right aligned with tabular numerals. */
  numeric?: boolean;
  /** Hide below sm to keep the table honest on a phone. */
  hideOnMobile?: boolean;
};

export type FilterTab<T> = {
  key: string;
  label: string;
  predicate: (row: T) => boolean;
};

export type BulkAction<T> = {
  label: string;
  onRun: (rows: T[]) => void;
  tone?: "default" | "danger";
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  getRowHref,
  searchText,
  filterTabs,
  bulkActions,
  rowActions,
  emptyState,
  searchPlaceholder = "Search",
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  getRowHref?: (row: T) => string | undefined;
  searchText?: (row: T) => string;
  filterTabs?: FilterTab<T>[];
  bulkActions?: BulkAction<T>[];
  rowActions?: (row: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(filterTabs?.[0]?.key ?? null);
  const [sort, setSort] = useState<SortState>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const activeTab = filterTabs?.find((t) => t.key === tab) ?? null;

  const visible = useMemo(() => {
    let out = rows;
    if (activeTab) out = out.filter(activeTab.predicate);
    if (query.trim() && searchText) {
      const q = query.trim().toLowerCase();
      out = out.filter((r) => searchText(r).toLowerCase().includes(q));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const dir = sort.dir === "asc" ? 1 : -1;
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      }
    }
    return out;
  }, [rows, activeTab, query, searchText, sort, columns]);

  const allSelected = visible.length > 0 && visible.every((r) => selected.has(getRowId(r)));

  function toggleSort(key: string) {
    setSort((s) =>
      s && s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  function toggleRow(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(visible.map(getRowId)));
  }

  const selectedRows = visible.filter((r) => selected.has(getRowId(r)));

  return (
    <div className="rounded-xl border border-admin-line bg-admin-surface">
      <div className="flex flex-col gap-3 border-b border-admin-line p-3 sm:flex-row sm:items-center sm:justify-between">
        {filterTabs && filterTabs.length > 0 ? (
          <div className="flex flex-wrap gap-1" role="tablist">
            {filterTabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  tab === t.key
                    ? "bg-admin-ink text-admin-surface"
                    : "text-admin-muted hover:bg-admin-raise hover:text-admin-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        {searchText ? (
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-admin-muted" aria-hidden="true" />
            <input
              data-table-search
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="min-h-9 w-full rounded-lg border border-admin-line bg-admin-bg py-1.5 pl-9 pr-3 text-sm text-admin-ink outline-none focus-visible:border-admin-accent sm:w-64"
            />
          </label>
        ) : null}
      </div>

      {selectedRows.length > 0 && bulkActions && bulkActions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-admin-line bg-admin-subtle px-3 py-2 text-sm">
          <span className="font-medium text-admin-ink">{selectedRows.length} selected</span>
          {bulkActions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                a.onRun(selectedRows);
                setSelected(new Set());
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                a.tone === "danger"
                  ? "text-admin-danger hover:bg-admin-status-danger-tint"
                  : "text-admin-ink hover:bg-admin-raise",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-admin-surface">
            <tr className="border-b border-admin-line text-left text-xs uppercase tracking-wide text-admin-muted">
              {bulkActions ? (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-4 accent-admin-ink"
                  />
                </th>
              ) : null}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 font-medium",
                    c.numeric && "text-right",
                    c.hideOnMobile && "hidden sm:table-cell",
                  )}
                >
                  {c.sortValue ? (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-admin-ink",
                        c.numeric && "flex-row-reverse",
                      )}
                    >
                      {c.header}
                      <ArrowUpDown className="size-3" aria-hidden="true" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
              {rowActions ? <th className="w-10 px-3 py-2.5" /> : null}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const id = getRowId(row);
              const href = getRowHref?.(row);
              return (
                <tr
                  key={id}
                  onClick={href ? () => router.push(href) : undefined}
                  className={cn(
                    "group border-b border-admin-line last:border-0",
                    href && "cursor-pointer hover:bg-admin-subtle",
                  )}
                >
                  {bulkActions ? (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={selected.has(id)}
                        onChange={() => toggleRow(id)}
                        className="size-4 accent-admin-ink"
                      />
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 py-2.5 text-admin-ink",
                        c.numeric && "text-right tabular-nums",
                        c.hideOnMobile && "hidden sm:table-cell",
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <span className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                        {rowActions(row)}
                      </span>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visible.length === 0 ? (
        <div className="px-3 py-12 text-center text-sm text-admin-muted">
          {emptyState ?? "Nothing here yet."}
        </div>
      ) : null}
    </div>
  );
}
