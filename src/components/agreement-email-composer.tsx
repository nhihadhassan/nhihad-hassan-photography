"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, RotateCcw } from "lucide-react";
import {
  buildAgreementEmail,
  defaultAgreementMessage,
  defaultAgreementSubject,
} from "@/lib/emails/agreement-invite";
import { sendAgreementRequestEmailAction } from "@/app/admin/(protected)/agreements/actions";

const inputClass =
  "min-h-11 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35";

type Recipient = { name: string | null; email: string };

/**
 * Preview & Send's email composer: a lightweight, always-has-a-good-default
 * subject/message editor with a live preview, replacing the old fixed
 * read-only email block. Mirrors GalleryShareEmail's compose+preview layout
 * so the two editable-email screens in this admin feel like the same product.
 *
 * The expiry deadline and missing-contact-field notices are never part of
 * the editable text -- they're appended automatically after it (see
 * buildAgreementEmail) so they can't go stale or get edited away by
 * accident, the same way the gallery invite always appends its password line.
 */
export function AgreementEmailComposer({
  requestId,
  recipients,
  agreementUrl,
  expiresAt,
  missingFields,
  savedSubject,
  savedMessage,
  alreadySent,
  disabledReason,
}: {
  requestId: string;
  recipients: Recipient[];
  agreementUrl: string;
  expiresAt: string | null;
  missingFields: string[];
  savedSubject: string | null;
  savedMessage: string | null;
  alreadySent: boolean;
  disabledReason?: string;
}) {
  const primary = recipients[0] ?? null;
  const defaultSubject = defaultAgreementSubject();
  const defaultMessage = defaultAgreementMessage(primary?.name ?? null);

  const [subject, setSubject] = useState(savedSubject ?? defaultSubject);
  const [message, setMessage] = useState(savedMessage ?? defaultMessage);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const isDefault = subject.trim() === defaultSubject.trim() && message.trim() === defaultMessage.trim();

  const previewHtml = useMemo(
    () =>
      buildAgreementEmail({
        clientName: primary?.name ?? null,
        agreementUrl,
        expiresAt,
        missingFields,
        subject,
        message,
      }).html,
    [primary, agreementUrl, expiresAt, missingFields, subject, message],
  );

  const resetToDefault = () => {
    setSubject(defaultSubject);
    setMessage(defaultMessage);
  };

  const handleSend = () => {
    setResult(null);
    startTransition(async () => {
      // Only pass an override when it's actually been customized, so an
      // unedited send still gets each signer's own personalized greeting
      // (see emailAgreementSigners) instead of one shared, generic message.
      const res = await sendAgreementRequestEmailAction(requestId, {
        subject: subject.trim() !== defaultSubject.trim() ? subject : undefined,
        message: message.trim() !== defaultMessage.trim() ? message : undefined,
      });
      setResult(res);
      setConfirming(false);
    });
  };

  if (disabledReason) {
    return (
      <p className="rounded-md border border-admin-ink/10 bg-admin-surface px-4 py-3 text-sm text-admin-ink/65">
        {disabledReason}
      </p>
    );
  }

  const target = recipients.length === 1 ? recipients[0].email : `${recipients.length} signers`;
  const sendLabel = alreadySent ? `Resend to ${target}` : `Send to ${target}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Compose */}
      <div className="grid gap-4 rounded-md border border-admin-ink/10 bg-admin-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-admin-ink/50">Compose</span>
          {!isDefault ? (
            <button
              type="button"
              onClick={resetToDefault}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-admin-ink/55 transition hover:text-admin-ink"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset to default
            </button>
          ) : null}
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Subject</span>
          <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Message</span>
          <textarea
            className="min-h-40 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 py-3 text-sm leading-6 text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <span className="text-xs leading-5 text-admin-ink/65">
            Leave a blank line between paragraphs. The sign-in button
            {expiresAt || missingFields.length ? ", the deadline notice, and the missing-info list" : ""}{" "}
            are added automatically below this.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-admin-ink/8 pt-4">
          {confirming ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={handleSend}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-semibold text-admin-surface transition disabled:opacity-40"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Mail className="size-4" aria-hidden="true" />
                )}
                Yes, send it now
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirming(false)}
                className="min-h-11 rounded-md border border-admin-ink/12 px-4 text-sm font-medium text-admin-ink/70 transition disabled:opacity-40"
              >
                Cancel
              </button>
              <span className="text-xs text-admin-ink/55">
                This emails {recipients.map((r) => r.email).join(" and ")} right away.
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-semibold text-admin-surface transition hover:opacity-90"
            >
              <Mail className="size-4" aria-hidden="true" />
              {sendLabel}
            </button>
          )}
        </div>

        {result ? (
          <p
            className={
              result.ok
                ? "inline-flex items-center gap-2 rounded-md bg-admin-success/12 px-3 py-2 text-sm text-admin-success"
                : "inline-flex items-center gap-2 rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger-ink"
            }
          >
            {result.ok ? (
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            )}
            {result.message}
          </p>
        ) : null}
      </div>

      {/* Live preview */}
      <div className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-admin-ink/65">
          Preview{recipients.length > 1 ? ` — as sent to ${primary?.name ?? primary?.email}` : ""}
        </span>
        <div className="overflow-hidden rounded-md border border-admin-ink/12 bg-[#f3eee5]">
          <iframe title="Email preview" srcDoc={previewHtml} sandbox="" className="h-[560px] w-full border-0" />
        </div>
        {recipients.length > 1 && isDefault ? (
          <p className="text-xs text-admin-ink/50">
            Each signer gets this message with their own name in the greeting.
          </p>
        ) : null}
      </div>
    </div>
  );
}
