"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, RotateCcw, XCircle } from "lucide-react";
import { cancelInvoiceAction, reactivateInvoiceAction, sendInvoiceAction } from "@/app/admin/(protected)/invoices/actions";

/** Send / cancel / reactivate controls for the admin invoice preview page. */
export function InvoiceSendSection({
  bookingId,
  recipientEmail,
  alreadySent,
  cancelled,
  disabledReason,
}: {
  bookingId: string;
  recipientEmail: string | null;
  alreadySent: boolean;
  cancelled: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (cancelled) {
    return (
      <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
        <p className="text-sm text-admin-ink/65">This invoice is cancelled.</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await reactivateInvoiceAction(bookingId);
              setFeedback(result);
              if (result.ok) router.refresh();
            });
          }}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-ink/12 px-4 text-sm font-medium text-admin-ink/70 disabled:opacity-40"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
          Reactivate
        </button>
        {feedback ? <p className={`mt-2 text-sm ${feedback.ok ? "text-admin-success" : "text-admin-danger"}`}>{feedback.message}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      {disabledReason ? (
        <p className="text-sm text-admin-ink/65">{disabledReason}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {confirming ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    setFeedback(null);
                    const result = await sendInvoiceAction(bookingId);
                    setFeedback(result);
                    setConfirming(false);
                    if (result.ok) router.refresh();
                  });
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-semibold text-admin-surface disabled:opacity-40"
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
                Yes, send it now
              </button>
              <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="min-h-11 rounded-md border border-admin-ink/12 px-4 text-sm font-medium text-admin-ink/70 disabled:opacity-40">
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-semibold text-admin-surface"
            >
              <Mail className="size-4" aria-hidden="true" />
              {alreadySent ? `Resend to ${recipientEmail}` : `Send to ${recipientEmail}`}
            </button>
          )}
        </div>
      )}
      {feedback ? <p className={`mt-3 text-sm ${feedback.ok ? "text-admin-success" : "text-admin-danger"}`}>{feedback.message}</p> : null}
      {!disabledReason ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Cancel this invoice? The client will still be able to view it, marked as cancelled.")) return;
            startTransition(async () => {
              const result = await cancelInvoiceAction(bookingId);
              setFeedback(result);
              if (result.ok) router.refresh();
            });
          }}
          className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-danger/20 px-3 text-xs font-medium text-admin-danger hover:bg-admin-danger/8 disabled:opacity-50"
        >
          <XCircle className="size-3.5" aria-hidden="true" />
          Cancel invoice
        </button>
      ) : null}
    </div>
  );
}
