"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { confirmBookingPaymentAction } from "@/app/admin/(protected)/finances/actions";

export function ConfirmPaymentInline({ bookingId, balance }: { bookingId: string; balance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div id="payment" className="scroll-mt-24 rounded-lg bg-admin-subtle p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Confirm e-transfer</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-1 text-xs text-admin-muted">
          Amount
          <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="min-h-10 rounded-md border border-admin-line-strong bg-admin-surface px-3 text-base text-admin-ink sm:text-sm" />
        </label>
        <label className="grid gap-1 text-xs text-admin-muted">
          Received
          <input type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} className="min-h-10 rounded-md border border-admin-line-strong bg-admin-surface px-3 text-base text-admin-ink sm:text-sm" />
        </label>
        <button
          type="button"
          disabled={pending || Number(amount) <= 0 || !paidOn}
          onClick={() => startTransition(async () => {
            const result = await confirmBookingPaymentAction({ bookingId, amount: Number(amount), paidOn });
            setMessage(result.message);
            if (result.ok) router.refresh();
          })}
          className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-admin-ink px-3 text-sm font-medium text-admin-surface disabled:opacity-40"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
          Confirm
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-admin-muted">{message}</p> : null}
    </div>
  );
}
