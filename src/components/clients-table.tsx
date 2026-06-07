"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ClientSummary } from "@/lib/clients";
import { formatCompactDate, formatMoney } from "@/lib/utils";

function Chip({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-admin-ink/12 px-2 py-0.5 text-xs text-admin-ink/60">
      {children}
    </span>
  );
}

export function ClientsTable({ clients }: { clients: ClientSummary[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(term) || (c.email ?? "").toLowerCase().includes(term),
    );
  }, [q, clients]);

  return (
    <div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-admin-ink/40" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email"
          className="min-h-11 w-full rounded-md border border-admin-ink/12 bg-white/70 pl-9 pr-3 text-sm text-admin-ink outline-none transition focus:border-admin-copper"
        />
      </div>

      {filtered.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-admin-ink/10 bg-admin-surface">
          <div className="divide-y divide-admin-ink/10">
            {filtered.map((c) => (
              <Link
                key={c.key}
                href={`/admin/clients/${encodeURIComponent(c.key)}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-admin-ink/[0.03]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tracking-tight">{c.name}</span>
                    {c.hasUnsignedContract ? (
                      <span className="inline-flex rounded-full border border-admin-accent/40 bg-admin-copper/12 px-2 py-0.5 text-xs text-admin-accent">
                        Unsigned contract
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-admin-ink/55">
                    {c.email ?? "No email on file"}
                    {c.lastActivity ? ` · Last activity ${formatCompactDate(c.lastActivity)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {c.bookingCount ? <Chip>{`${c.bookingCount} booking${c.bookingCount === 1 ? "" : "s"}`}</Chip> : null}
                  {c.galleryCount ? <Chip>{`${c.galleryCount} galler${c.galleryCount === 1 ? "y" : "ies"}`}</Chip> : null}
                  {c.inquiryCount ? <Chip>{`${c.inquiryCount} inquir${c.inquiryCount === 1 ? "y" : "ies"}`}</Chip> : null}
                  {c.outstandingBalance > 0 ? (
                    <span className="inline-flex rounded-full border border-admin-accent/40 bg-admin-copper/12 px-2.5 py-0.5 text-xs font-medium text-admin-accent">
                      {formatMoney(c.outstandingBalance)} due
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-md border border-dashed border-admin-ink/15 px-4 py-10 text-center text-sm text-admin-ink/50">
          {clients.length ? "No clients match your search." : "No clients yet. They appear here as inquiries, bookings, and galleries come in."}
        </p>
      )}
    </div>
  );
}
