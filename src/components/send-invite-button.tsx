"use client";

import { useTransition, useState } from "react";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { sendGalleryInvite } from "@/app/admin/(protected)/galleries/[id]/invite-actions";

type SendInviteButtonProps = {
  galleryId: string;
  clientEmail: string;
  lastSentAt?: string | null;
  lastSentTo?: string | null;
};

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export function SendInviteButton({
  galleryId,
  clientEmail,
  lastSentAt,
  lastSentTo,
}: SendInviteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSend() {
    setResult(null);
    startTransition(async () => {
      const res = await sendGalleryInvite(galleryId);
      setResult(res);
    });
  }

  const hasSentBefore = Boolean(lastSentAt);
  const sentLabel =
    hasSentBefore && lastSentAt
      ? `Last sent ${formatRelativeDate(lastSentAt)}${lastSentTo && lastSentTo !== clientEmail ? ` (to ${lastSentTo})` : ""}`
      : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#17130f] px-4 text-sm font-medium text-[#fbf8f1] transition hover:bg-[#2e2822] disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Mail className="size-3.5" aria-hidden="true" />
          )}
          {isPending ? "Sending…" : hasSentBefore ? "Resend invite" : "Send invite email"}
        </button>

        {sentLabel ? (
          <span className="text-xs text-[#17130f]/45">{sentLabel}</span>
        ) : null}
      </div>

      {result ? (
        <p
          className={
            result.ok
              ? "inline-flex items-center gap-2 rounded-md bg-[#2a4a2a]/20 px-3 py-2 text-sm text-[#3a6a3a]"
              : "inline-flex items-center gap-2 rounded-md bg-[#8a2f24]/10 px-3 py-2 text-sm text-[#7a2e25]"
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
  );
}
