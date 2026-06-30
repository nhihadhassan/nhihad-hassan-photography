"use client";

import { useMemo, useState, useTransition } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  buildGalleryInviteEmail,
  defaultInviteSubject,
  defaultInviteMessage,
} from "@/lib/emails/gallery-invite";
import { sendGalleryInvite } from "@/app/admin/(protected)/galleries/[id]/invite-actions";

type GalleryShareEmailProps = {
  galleryId: string;
  galleryTitle: string;
  galleryUrl: string;
  clientName: string | null;
  defaultRecipient: string | null;
  /** Plain-text password, used only to render the live preview. */
  password: string | null;
  coverImageUrl: string | null;
  photographerEmail: string;
  savedSubject: string | null;
  savedMessage: string | null;
  lastSentAt: string | null;
  lastSentTo: string | null;
};

const inputClass =
  "min-h-11 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export function GalleryShareEmail({
  galleryId,
  galleryTitle,
  galleryUrl,
  clientName,
  defaultRecipient,
  password,
  coverImageUrl,
  photographerEmail,
  savedSubject,
  savedMessage,
  lastSentAt,
  lastSentTo,
}: GalleryShareEmailProps) {
  const [recipient, setRecipient] = useState(defaultRecipient ?? "");
  const [subject, setSubject] = useState(savedSubject ?? defaultInviteSubject(galleryTitle));
  const [message, setMessage] = useState(savedMessage ?? defaultInviteMessage(clientName));
  const [includePassword, setIncludePassword] = useState(Boolean(password));

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const previewHtml = useMemo(
    () =>
      buildGalleryInviteEmail({
        clientName,
        galleryTitle,
        galleryUrl,
        password: includePassword ? password : null,
        photographerEmail,
        coverImageUrl,
        subject,
        message,
      }).html,
    [
      clientName,
      galleryTitle,
      galleryUrl,
      includePassword,
      password,
      photographerEmail,
      coverImageUrl,
      subject,
      message,
    ],
  );

  function handleSend() {
    setResult(null);
    startTransition(async () => {
      const res = await sendGalleryInvite(galleryId, {
        recipient: recipient.trim(),
        subject,
        message,
        includePassword,
      });
      setResult(res);
    });
  }

  const hasSentBefore = Boolean(lastSentAt);
  const sentLabel =
    hasSentBefore && lastSentAt
      ? `Last sent ${formatRelativeDate(lastSentAt)}${
          lastSentTo && lastSentTo !== recipient ? ` to ${lastSentTo}` : ""
        }`
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Compose */}
      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">To</span>
          <input
            className={inputClass}
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="client@example.com"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Subject</span>
          <input
            className={inputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Message</span>
          <textarea
            className="min-h-44 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 py-3 text-sm leading-6 text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <span className="text-xs text-admin-ink/45">
            Leave a blank line between paragraphs. The gallery button and footer are added
            automatically.
          </span>
        </label>

        {password ? (
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-admin-ink/12 bg-white/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-admin-ink">Include gallery password</p>
              <p className="mt-0.5 text-xs text-admin-ink/50">
                Shows the access password inside the email.
              </p>
            </div>
            <input
              type="checkbox"
              checked={includePassword}
              onChange={(e) => setIncludePassword(e.target.checked)}
              className="size-4 accent-admin-accent"
            />
          </label>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface transition hover:bg-[#2e2822] disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Mail className="size-3.5" aria-hidden="true" />
            )}
            {isPending ? "Sending…" : hasSentBefore ? "Resend email" : "Send email"}
          </button>
          {sentLabel ? <span className="text-xs text-admin-ink/45">{sentLabel}</span> : null}
        </div>

        {result ? (
          <p
            className={
              result.ok
                ? "inline-flex items-center gap-2 rounded-md bg-[#2a4a2a]/15 px-3 py-2 text-sm text-[#3a6a3a]"
                : "inline-flex items-center gap-2 rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger-ink"
            }
          >
            {result.ok ? (
              <CheckCircle className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            )}
            {result.message}
          </p>
        ) : null}
      </div>

      {/* Live preview */}
      <div className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-admin-ink/45">
          Preview
        </span>
        <div className="overflow-hidden rounded-md border border-admin-ink/12 bg-[#f3eee5]">
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            sandbox=""
            className="h-[560px] w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
