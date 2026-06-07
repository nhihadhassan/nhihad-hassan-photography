"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, FileText, Trash2 } from "lucide-react";
import { deleteBookingAction } from "@/app/admin/(protected)/bookings/actions";

export function BookingRowActions({
  id,
  hubUrl,
  invoiceUrl,
  hasCalendar,
}: {
  id: string;
  hubUrl: string;
  invoiceUrl: string;
  hasCalendar: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(hubUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            /* clipboard blocked */
          }
        }}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
      >
        {copied ? <Check className="size-3.5 text-admin-success" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <a
        href={hubUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
      >
        <ExternalLink className="size-3.5" />
        Open
      </a>
      {hasCalendar ? (
        <a
          href={`${hubUrl}/calendar`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
        >
          .ics
        </a>
      ) : null}
      <a
        href={invoiceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
      >
        <FileText className="size-3.5" />
        Invoice
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete this booking?")) return;
          startTransition(async () => {
            const result = await deleteBookingAction(id);
            if (result.ok) setDeleted(true);
          });
        }}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-danger/20 px-3 text-xs font-medium text-admin-danger hover:bg-admin-danger/8 disabled:opacity-50"
      >
        <Trash2 className="size-3.5" />
        Delete
      </button>
    </div>
  );
}
