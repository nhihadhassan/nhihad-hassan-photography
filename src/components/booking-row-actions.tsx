"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, FileText, Loader2, Mail, Trash2 } from "lucide-react";
import { deleteBookingAction, emailBookingHubAction } from "@/app/admin/(protected)/bookings/actions";

export function BookingRowActions({
  id,
  hubUrl,
  invoiceUrl,
  hasCalendar,
  hasEmail,
}: {
  id: string;
  hubUrl: string;
  invoiceUrl: string;
  hasCalendar: boolean;
  hasEmail: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [emailing, startEmailing] = useTransition();
  const [copied, setCopied] = useState(false);
  const [emailed, setEmailed] = useState(false);
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
      {hasEmail ? (
        <button
          type="button"
          disabled={emailing}
          onClick={() => {
            startEmailing(async () => {
              const result = await emailBookingHubAction(id);
              if (result.ok) {
                setEmailed(true);
                setTimeout(() => setEmailed(false), 2500);
              } else {
                window.alert(result.message);
              }
            });
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6 disabled:opacity-50"
        >
          {emailing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : emailed ? (
            <Check className="size-3.5 text-admin-success" />
          ) : (
            <Mail className="size-3.5" />
          )}
          {emailed ? "Sent" : "Email"}
        </button>
      ) : null}
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
