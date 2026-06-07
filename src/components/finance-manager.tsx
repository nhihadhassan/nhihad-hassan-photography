"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { Expense, Payment } from "@/lib/finance";
import {
  addExpenseAction,
  addPaymentAction,
  deleteExpenseAction,
  deletePaymentAction,
  type FinanceState,
} from "@/app/admin/(protected)/finances/actions";
import { formatCompactDate, formatMoney } from "@/lib/utils";

const initial: FinanceState = { status: "idle", message: "" };

const inputClass =
  "min-h-10 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";
const labelClass = "grid gap-1 text-xs font-medium text-admin-ink/70";

type BookingOption = { id: string; label: string };

function Msg({ state }: { state: FinanceState }) {
  if (!state.message) return null;
  return (
    <span className={state.status === "error" ? "text-sm text-admin-danger" : "text-sm text-admin-success"}>
      {state.message}
    </span>
  );
}

function PaymentForm({ bookings }: { bookings: BookingOption[] }) {
  const [state, action] = useActionState(addPaymentAction, initial);
  return (
    <form action={action} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5">
      <h2 className="text-base font-semibold tracking-tight">Record a payment</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Amount (CAD)
          <input className={inputClass} name="amount" inputMode="decimal" placeholder="350" required />
        </label>
        <label className={labelClass}>
          Type
          <select className={inputClass} name="kind" defaultValue="deposit">
            <option value="deposit">Deposit</option>
            <option value="balance">Balance</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className={labelClass}>
          Date received
          <input className={inputClass} type="date" name="paid_on" />
        </label>
        <label className={labelClass}>
          Method
          <input className={inputClass} name="method" defaultValue="Interac" />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Linked booking <span className="font-normal text-admin-ink/40">(for outstanding tracking)</span>
          <select className={inputClass} name="booking_id" defaultValue="">
            <option value="">No booking</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Note
          <input className={inputClass} name="note" placeholder="e.g. deposit for August wedding" />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="inline-flex min-h-10 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">
          Record payment
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}

function ExpenseForm() {
  const [state, action] = useActionState(addExpenseAction, initial);
  return (
    <form action={action} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5">
      <h2 className="text-base font-semibold tracking-tight">Record an expense</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Amount (CAD)
          <input className={inputClass} name="amount" inputMode="decimal" placeholder="120" required />
        </label>
        <label className={labelClass}>
          Date
          <input className={inputClass} type="date" name="expense_date" />
        </label>
        <label className={labelClass}>
          Category
          <input className={inputClass} name="category" placeholder="Gear, travel, software" />
        </label>
        <label className={labelClass}>
          Vendor
          <input className={inputClass} name="vendor" placeholder="B&H, Adobe" />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Note
          <input className={inputClass} name="note" placeholder="Optional detail" />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="inline-flex min-h-10 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">
          Record expense
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<{ ok: boolean }> }) {
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this entry?")) return;
        start(async () => {
          const r = await onDelete();
          if (r.ok) setGone(true);
        });
      }}
      className="rounded p-1.5 text-admin-danger/80 hover:bg-admin-danger/5 disabled:opacity-50"
      aria-label="Delete"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}

export function FinanceManager({
  payments,
  expenses,
  bookings,
}: {
  payments: Payment[];
  expenses: Expense[];
  bookings: BookingOption[];
}) {
  const bookingLabel = new Map(bookings.map((b) => [b.id, b.label]));

  return (
    <div className="space-y-8">
      <div className="grid gap-5 lg:grid-cols-2">
        <PaymentForm bookings={bookings} />
        <ExpenseForm />
      </div>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Payments</h2>
          <a href="/api/admin/finance/export?type=payments" className="text-sm font-medium text-admin-accent hover:text-admin-ink">
            Export CSV
          </a>
        </div>
        <div className="mt-3 overflow-hidden rounded-md border border-admin-ink/10 bg-admin-surface">
          {payments.length ? (
            <div className="divide-y divide-admin-ink/10">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatMoney(p.amount)} <span className="font-normal text-admin-ink/50">· {p.kind}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-admin-ink/55">
                      {formatCompactDate(p.paid_on)}
                      {p.method ? ` · ${p.method}` : ""}
                      {p.booking_id && bookingLabel.get(p.booking_id) ? ` · ${bookingLabel.get(p.booking_id)}` : ""}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <DeleteButton onDelete={() => deletePaymentAction(p.id)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-admin-ink/55">No payments recorded yet.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Expenses</h2>
          <a href="/api/admin/finance/export?type=expenses" className="text-sm font-medium text-admin-accent hover:text-admin-ink">
            Export CSV
          </a>
        </div>
        <div className="mt-3 overflow-hidden rounded-md border border-admin-ink/10 bg-admin-surface">
          {expenses.length ? (
            <div className="divide-y divide-admin-ink/10">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatMoney(e.amount)}
                      {e.category ? <span className="font-normal text-admin-ink/50"> · {e.category}</span> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-admin-ink/55">
                      {formatCompactDate(e.expense_date)}
                      {e.vendor ? ` · ${e.vendor}` : ""}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <DeleteButton onDelete={() => deleteExpenseAction(e.id)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-admin-ink/55">No expenses recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
