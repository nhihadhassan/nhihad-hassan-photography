"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { ChevronDown, Loader2, Search, Trash2 } from "lucide-react";
import type { Expense, Payment } from "@/lib/finance";
import {
  addExpenseAction,
  addPaymentAction,
  deleteExpenseAction,
  deletePaymentAction,
  type FinanceState,
} from "@/app/admin/(protected)/finances/actions";
import { formatCompactDate, formatMoney } from "@/lib/utils";
import { PremiumDateTimePicker } from "@/components/ui/premium-date-time-picker";

const initial: FinanceState = { status: "idle", message: "" };

const inputClass =
  "min-h-10 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";
const labelClass = "grid gap-1 text-xs font-medium text-admin-ink/70";

type BookingOption = { id: string; label: string; total: number; paid: number; balance: number };

const paymentKinds = [
  { value: "deposit", label: "Deposit" },
  { value: "balance", label: "Balance" },
  { value: "other", label: "Other" },
] as const;

const paymentMethods = ["Interac", "Cash", "Card", "Bank transfer", "Other"];
const expenseCategories = ["Equipment", "Software", "Travel", "Marketing", "Studio", "Insurance", "Other"];

function recordedAt(date: string, time: string | null) {
  if (!time) return formatCompactDate(date);
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const label = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" }).format(
    new Date(2026, 0, 1, hours, minutes),
  );
  return `${formatCompactDate(date)} at ${label}`;
}

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
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<(typeof paymentKinds)[number]["value"]>("deposit");
  const [method, setMethod] = useState("Interac");
  const [bookingId, setBookingId] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const selectedBooking = bookings.find((booking) => booking.id === bookingId);
  const bookingMatches = useMemo(() => {
    const term = bookingSearch.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((booking) => booking.label.toLowerCase().includes(term));
  }, [bookingSearch, bookings]);

  return (
    <form action={action} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5">
      <h2 className="text-base font-semibold tracking-tight">Record a payment</h2>
      <p className="mt-1 text-xs leading-5 text-admin-ink/50">Add money received and optionally connect it to an invoice balance.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Amount (CAD)
          <input className={inputClass} name="amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required />
        </label>
        <div className={labelClass}>
          Type
          <input type="hidden" name="kind" value={kind} />
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-admin-ink/5 p-1">
            {paymentKinds.map((option) => (
              <button key={option.value} type="button" onClick={() => setKind(option.value)} className={`min-h-8 rounded-md px-2 text-xs font-semibold transition active:scale-[0.98] ${kind === option.value ? "bg-admin-surface text-admin-ink shadow-[0_1px_4px_rgba(30,24,18,0.12)]" : "text-admin-ink/50 hover:text-admin-ink"}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <PremiumDateTimePicker label="Received on" dateName="paid_on" timeName="paid_time" />
        <div className={`${labelClass} sm:col-span-2`}>
          Method
          <input type="hidden" name="method" value={method} />
          <div className="flex flex-wrap gap-1.5">
            {paymentMethods.map((option) => (
              <button key={option} type="button" onClick={() => setMethod(option)} className={`min-h-8 rounded-full border px-3 text-xs font-medium transition active:scale-[0.98] ${method === option ? "border-admin-accent/30 bg-admin-accent/10 text-admin-accent" : "border-admin-ink/10 text-admin-ink/55 hover:border-admin-ink/20 hover:text-admin-ink"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className={`${labelClass} sm:col-span-2`}>
          Linked booking <span className="font-normal text-admin-ink/55">Optional, used for invoice tracking</span>
          <input type="hidden" name="booking_id" value={bookingId} />
          <button type="button" onClick={() => setBookingOpen((value) => !value)} className={`${inputClass} flex items-center justify-between gap-3 text-left`}>
            <span className={selectedBooking ? "truncate text-admin-ink" : "text-admin-ink/50"}>{selectedBooking?.label ?? "Choose a booking"}</span>
            <ChevronDown className={`size-4 shrink-0 transition-transform ${bookingOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {bookingOpen ? (
            <div className="rounded-lg border border-admin-ink/10 bg-white/85 p-2 shadow-[0_12px_30px_rgba(43,35,28,0.08)]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-admin-ink/35" aria-hidden="true" />
                <span className="sr-only">Search bookings</span>
                <input value={bookingSearch} onChange={(event) => setBookingSearch(event.target.value)} placeholder="Search clients or shoots" className={`${inputClass} pl-9`} />
              </label>
              <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                <button type="button" onClick={() => { setBookingId(""); setBookingOpen(false); }} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-xs text-admin-ink/50 hover:bg-admin-ink/5">No linked booking</button>
                {bookingMatches.map((booking) => (
                  <button key={booking.id} type="button" onClick={() => { setBookingId(booking.id); setBookingOpen(false); setBookingSearch(""); }} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-md px-3 text-left transition hover:bg-admin-ink/5 ${booking.id === bookingId ? "bg-admin-accent/8" : ""}`}>
                    <span className="min-w-0 truncate text-xs font-medium">{booking.label}</span>
                    <span className="shrink-0 text-xs text-admin-ink/45">{booking.balance > 0 ? `${formatMoney(booking.balance)} due` : "Paid"}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {selectedBooking?.balance ? (
            <button type="button" onClick={() => { setAmount(String(selectedBooking.balance)); setKind(selectedBooking.paid > 0 ? "balance" : "deposit"); }} className="justify-self-start text-xs font-semibold text-admin-accent hover:text-admin-ink">
              Use outstanding balance of {formatMoney(selectedBooking.balance)}
            </button>
          ) : null}
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
        <Msg state={state} />
      </div>
    </form>
  );
}

function ExpenseForm() {
  const [state, action] = useActionState(addExpenseAction, initial);
  const [category, setCategory] = useState("");
  return (
    <form action={action} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5">
      <h2 className="text-base font-semibold tracking-tight">Record an expense</h2>
      <p className="mt-1 text-xs leading-5 text-admin-ink/50">Log a business cost for reporting and export.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Amount (CAD)
          <input className={inputClass} name="amount" inputMode="decimal" placeholder="0.00" required />
        </label>
        <PremiumDateTimePicker label="Purchased on" dateName="expense_date" timeName="expense_time" />
        <div className={`${labelClass} sm:col-span-2`}>
          Category
          <input type="hidden" name="category" value={category} />
          <div className="flex flex-wrap gap-1.5">
            {expenseCategories.map((option) => (
              <button key={option} type="button" onClick={() => setCategory(option)} className={`min-h-8 rounded-full border px-3 text-xs font-medium transition active:scale-[0.98] ${category === option ? "border-admin-accent/30 bg-admin-accent/10 text-admin-accent" : "border-admin-ink/10 text-admin-ink/55 hover:border-admin-ink/20 hover:text-admin-ink"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
        <label className={labelClass}>
          Vendor
          <input className={inputClass} name="vendor" placeholder="Business or supplier" />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Note
          <input className={inputClass} name="note" placeholder="Optional context" />
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
                      {formatMoney(p.amount)} <span className="font-normal text-admin-ink/65">· {p.kind}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-admin-ink/65">
                      {recordedAt(p.paid_on, p.paid_time)}
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
            <p className="p-5 text-sm text-admin-ink/65">No payments recorded yet.</p>
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
                      {e.category ? <span className="font-normal text-admin-ink/65"> · {e.category}</span> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-admin-ink/65">
                      {recordedAt(e.expense_date, e.expense_time)}
                      {e.vendor ? ` · ${e.vendor}` : ""}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <DeleteButton onDelete={() => deleteExpenseAction(e.id)} />
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-admin-ink/65">No expenses recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
