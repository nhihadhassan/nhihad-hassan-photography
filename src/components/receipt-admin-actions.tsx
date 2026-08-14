"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { voidAndReplaceReceiptAction } from "@/app/admin/(protected)/invoices/receipt-actions";
import { ReceiptSendButton } from "@/components/receipt-send-button";

export function ReceiptAdminActions({
  receiptId,
  sentBefore,
  canSend,
  isVoid,
}: {
  receiptId: string;
  sentBefore: boolean;
  canSend: boolean;
  isVoid: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (isVoid) return <p className="text-sm text-admin-muted">This receipt is void and cannot be sent.</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ReceiptSendButton receiptId={receiptId} sentBefore={sentBefore} disabled={!canSend} />
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Void this receipt and prepare a newly numbered replacement? The original will remain in the history.")) return;
          startTransition(async () => {
            const result = await voidAndReplaceReceiptAction(receiptId);
            setMessage(result.message);
            if (result.ok && result.replacementId) router.replace(`/admin/receipts/${result.replacementId}`);
          });
        }}
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-admin-line-strong px-3 text-xs font-medium text-admin-danger hover:bg-admin-status-danger-tint disabled:opacity-40"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
        Void and replace
      </button>
      {message ? <p className="w-full text-xs text-admin-muted">{message}</p> : null}
    </div>
  );
}
