"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { sendAgreementRequestEmailAction } from "@/app/admin/(protected)/agreements/actions";

/**
 * The confirm step on the contract preview page: send the previewed email to
 * every required signer, after the admin has read it.
 */
export function AgreementSendPanel({
  requestId,
  recipients,
  alreadySent,
  disabledReason,
}: {
  requestId: string;
  recipients: string[];
  alreadySent: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (disabledReason) {
    return (
      <p className="rounded-md border border-admin-ink/10 bg-admin-surface px-4 py-3 text-sm text-admin-ink/65">
        {disabledReason}
      </p>
    );
  }

  const label = alreadySent
    ? `Resend to ${recipients.length === 1 ? recipients[0] : `${recipients.length} signers`}`
    : `Send to ${recipients.length === 1 ? recipients[0] : `${recipients.length} signers`}`;

  return (
    <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        {confirming ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  setFeedback(null);
                  const result = await sendAgreementRequestEmailAction(requestId);
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
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-md border border-admin-ink/12 px-4 text-sm font-medium text-admin-ink/70 disabled:opacity-40"
            >
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
            {label}
          </button>
        )}
        {confirming ? (
          <span className="text-xs text-admin-ink/55">
            This emails {recipients.join(" and ")} right away.
          </span>
        ) : null}
      </div>
      {feedback ? (
        <p className={`mt-3 text-sm ${feedback.ok ? "text-admin-success" : "text-admin-danger"}`}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
