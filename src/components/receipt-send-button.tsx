"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendReceiptAction } from "@/app/admin/(protected)/invoices/receipt-actions";

export function ReceiptSendButton({ receiptId, sentBefore, disabled }: { receiptId: string; sentBefore: boolean; disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  return (
    <button
      type="button"
      disabled={pending || disabled}
      onClick={() => startTransition(async () => {
        const result = await sendReceiptAction(receiptId);
        if (!result.ok) return window.alert(result.message);
        setSent(true);
        router.refresh();
      })}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-admin-line-strong px-2.5 text-xs font-medium text-admin-ink hover:bg-admin-raise disabled:opacity-40"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : sent ? <Check className="size-3.5" aria-hidden="true" /> : <Mail className="size-3.5" aria-hidden="true" />}
      {sent ? "Sent" : sentBefore ? "Resend receipt" : "Send receipt"}
    </button>
  );
}
