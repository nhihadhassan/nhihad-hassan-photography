"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addPaymentAction, type FinanceState } from "@/app/admin/(protected)/finances/actions";

const initial: FinanceState = { status: "idle", message: "" };

const inputClass =
  "min-h-10 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";
const labelClass = "grid gap-1 text-xs font-medium text-admin-ink/70";

const paymentKinds = [
  { value: "deposit", label: "Deposit" },
  { value: "balance", label: "Balance" },
  { value: "other", label: "Other" },
] as const;

const paymentMethods = ["Interac", "Cash", "Card", "Bank transfer", "Other"];

/**
 * A compact "record a payment" form scoped to one invoice/booking, so
 * marking money received doesn't require a trip to the Finances ledger. The
 * full picker version of this form still lives there for payments not tied
 * to a specific invoice.
 */
export function RecordPaymentForm({ bookingId, suggestedAmount }: { bookingId: string; suggestedAmount: number }) {
  const router = useRouter();
  const [state, action] = useActionState(addPaymentAction, initial);
  const [amount, setAmount] = useState(suggestedAmount > 0 ? suggestedAmount.toFixed(2) : "");
  const [kind, setKind] = useState<(typeof paymentKinds)[number]["value"]>("balance");
  const [method, setMethod] = useState("Interac");
  const lastStatus = useRef(state.status);

  useEffect(() => {
    if (state.status === "success" && lastStatus.current !== "success") router.refresh();
    lastStatus.current = state.status;
  }, [state.status, router]);

  return (
    <form action={action} className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="paid_on" value={new Date().toISOString().slice(0, 10)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Amount (CAD)
          <input className={inputClass} name="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
        </label>
        <div className={labelClass}>
          Type
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-admin-ink/5 p-1">
            {paymentKinds.map((option) => (
              <button key={option.value} type="button" onClick={() => setKind(option.value)} className={`min-h-8 rounded-md px-2 text-xs font-semibold transition active:scale-[0.98] ${kind === option.value ? "bg-admin-surface text-admin-ink shadow-[0_1px_4px_rgba(30,24,18,0.12)]" : "text-admin-ink/50 hover:text-admin-ink"}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className={`${labelClass} sm:col-span-2`}>
          Method
          <div className="flex flex-wrap gap-1.5">
            {paymentMethods.map((option) => (
              <button key={option} type="button" onClick={() => setMethod(option)} className={`min-h-8 rounded-full border px-3 text-xs font-medium transition active:scale-[0.98] ${method === option ? "border-admin-accent/30 bg-admin-accent/10 text-admin-accent" : "border-admin-ink/10 text-admin-ink/55 hover:border-admin-ink/20 hover:text-admin-ink"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
        <label className={`${labelClass} sm:col-span-2`}>
          Note
          <input className={inputClass} name="note" placeholder="Optional context" />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="inline-flex min-h-10 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">
          Record payment
        </button>
        {state.message ? (
          <span className={state.status === "error" ? "text-sm text-admin-danger" : "text-sm text-admin-success"}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
