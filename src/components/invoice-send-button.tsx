"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { sendInvoiceAction } from "@/app/admin/(protected)/invoices/actions";
import { cn } from "@/lib/utils";

export function InvoiceSendButton({
  bookingId,
  sentBefore,
  disabled = false,
  compact = false,
}: {
  bookingId: string;
  sentBefore: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          const result = await sendInvoiceAction(bookingId);
          if (!result.ok) {
            window.alert(result.message);
            return;
          }
          setSent(true);
          router.refresh();
          setTimeout(() => setSent(false), 2500);
        });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md border border-admin-ink/12 font-medium text-admin-ink/75 hover:bg-admin-ink/6 disabled:cursor-not-allowed disabled:opacity-45",
        compact ? "min-h-8 px-2.5 text-xs" : "min-h-10 px-3 text-sm",
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : sent ? (
        <Check className="size-3.5 text-admin-success" aria-hidden="true" />
      ) : (
        <Mail className="size-3.5" aria-hidden="true" />
      )}
      {sent ? "Sent" : sentBefore ? "Resend" : "Send invoice"}
    </button>
  );
}
