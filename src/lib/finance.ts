import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getAdminBookings } from "@/lib/bookings";
import { parseAmount } from "@/lib/utils";

export type PaymentKind = "deposit" | "balance" | "other";

export type Payment = {
  id: string;
  booking_id: string | null;
  client_name: string | null;
  client_email: string | null;
  amount: number;
  kind: PaymentKind;
  paid_on: string;
  method: string | null;
  note: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  expense_date: string;
  category: string | null;
  vendor: string | null;
  amount: number;
  note: string | null;
  created_at: string;
};

export type OutstandingBooking = {
  bookingId: string;
  clientName: string | null;
  shootType: string | null;
  startAt: string | null;
  total: number;
  paid: number;
  outstanding: number;
};

export type FinanceSummary = {
  incomeThisMonth: number;
  incomeThisYear: number;
  expensesThisYear: number;
  netThisYear: number;
  outstandingTotal: number;
};

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Current year ("2026") and month ("2026-06") in Toronto time. */
function torontoNowParts() {
  const parts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date())) {
    parts[p.type] = p.value;
  }
  return { year: parts.year, month: `${parts.year}-${parts.month}` };
}

export async function listPayments(): Promise<Payment[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .order("paid_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as Payment[];
}

export async function listExpenses(): Promise<Expense[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as Expense[];
}

export async function createPayment(input: {
  bookingId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  amount: number;
  kind: PaymentKind;
  paidOn?: string | null;
  method?: string | null;
  note?: string | null;
}) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin.from("payments").insert({
    booking_id: input.bookingId ?? null,
    client_name: input.clientName ?? null,
    client_email: input.clientEmail ?? null,
    amount: input.amount,
    kind: input.kind,
    paid_on: input.paidOn || new Date().toISOString().slice(0, 10),
    method: input.method ?? "interac",
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function deletePayment(id: string) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createExpense(input: {
  expenseDate?: string | null;
  category?: string | null;
  vendor?: string | null;
  amount: number;
  note?: string | null;
}) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin.from("expenses").insert({
    expense_date: input.expenseDate || new Date().toISOString().slice(0, 10),
    category: input.category ?? null,
    vendor: input.vendor ?? null,
    amount: input.amount,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteExpense(id: string) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Bookings with a total that still have an unpaid remainder (total minus recorded payments). */
export async function getOutstanding(): Promise<OutstandingBooking[]> {
  const [bookings, payments] = await Promise.all([getAdminBookings(), listPayments()]);
  const paidByBooking = new Map<string, number>();
  for (const p of payments) {
    if (p.booking_id) paidByBooking.set(p.booking_id, (paidByBooking.get(p.booking_id) ?? 0) + p.amount);
  }
  const rows: OutstandingBooking[] = [];
  for (const b of bookings) {
    const total = parseAmount(b.total);
    if (total === null || total <= 0) continue;
    const paid = paidByBooking.get(b.id) ?? 0;
    const outstanding = Math.max(0, total - paid);
    if (outstanding > 0.005) {
      rows.push({
        bookingId: b.id,
        clientName: b.client_name,
        shootType: b.shoot_type,
        startAt: b.start_at,
        total,
        paid,
        outstanding,
      });
    }
  }
  return rows.sort((a, b) => b.outstanding - a.outstanding);
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const [payments, expenses, outstanding] = await Promise.all([
    listPayments(),
    listExpenses(),
    getOutstanding(),
  ]);
  const { year, month } = torontoNowParts();

  const incomeThisMonth = payments
    .filter((p) => p.paid_on.startsWith(month))
    .reduce((s, p) => s + p.amount, 0);
  const incomeThisYear = payments
    .filter((p) => p.paid_on.startsWith(year))
    .reduce((s, p) => s + p.amount, 0);
  const expensesThisYear = expenses
    .filter((e) => e.expense_date.startsWith(year))
    .reduce((s, e) => s + e.amount, 0);
  const outstandingTotal = outstanding.reduce((s, o) => s + o.outstanding, 0);

  return {
    incomeThisMonth,
    incomeThisYear,
    expensesThisYear,
    netThisYear: incomeThisYear - expensesThisYear,
    outstandingTotal,
  };
}
