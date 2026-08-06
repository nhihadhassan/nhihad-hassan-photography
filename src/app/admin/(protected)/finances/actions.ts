"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createExpense,
  createPayment,
  deleteExpense,
  deletePayment,
  type PaymentKind,
} from "@/lib/finance";
import { advanceBookingStage, getBookingById } from "@/lib/bookings";
import { parseAmount } from "@/lib/utils";

export type FinanceState = { status: "idle" | "success" | "error"; message: string };

const clean = (v: FormDataEntryValue | null) => {
  const t = typeof v === "string" ? v.trim() : "";
  return t || null;
};

function revalidate() {
  revalidatePath("/admin/finances");
  revalidatePath("/admin");
}

const KINDS: PaymentKind[] = ["deposit", "balance", "other"];

export async function addPaymentAction(_prev: FinanceState, formData: FormData): Promise<FinanceState> {
  await requireAdmin();
  const amount = parseAmount(String(formData.get("amount") ?? ""));
  if (amount === null || amount <= 0) return { status: "error", message: "Enter a valid amount." };
  const kindRaw = String(formData.get("kind") ?? "other");
  const kind: PaymentKind = (KINDS as string[]).includes(kindRaw) ? (kindRaw as PaymentKind) : "other";

  const bookingId = clean(formData.get("booking_id"));
  try {
    await createPayment({
      bookingId,
      amount,
      kind,
      paidOn: clean(formData.get("paid_on")),
      paidTime: clean(formData.get("paid_time")),
      method: clean(formData.get("method")) ?? "interac",
      note: clean(formData.get("note")),
    });
    // A recorded deposit moves a signed job to Booked. If the contract is not
    // signed yet, the deposit is simply badged and the stage is left alone.
    if (bookingId) {
      const booking = await getBookingById(bookingId);
      if (booking?.agreement?.signed_at) {
        await advanceBookingStage(bookingId, "booked");
      }
      revalidatePath(`/admin/bookings/${bookingId}`);
    }
    revalidate();
    return { status: "success", message: "Payment recorded." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not record payment." };
  }
}

export async function addExpenseAction(_prev: FinanceState, formData: FormData): Promise<FinanceState> {
  await requireAdmin();
  const amount = parseAmount(String(formData.get("amount") ?? ""));
  if (amount === null || amount <= 0) return { status: "error", message: "Enter a valid amount." };

  try {
    await createExpense({
      expenseDate: clean(formData.get("expense_date")),
      expenseTime: clean(formData.get("expense_time")),
      category: clean(formData.get("category")),
      vendor: clean(formData.get("vendor")),
      amount,
      note: clean(formData.get("note")),
    });
    revalidate();
    return { status: "success", message: "Expense recorded." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not record expense." };
  }
}

export async function deletePaymentAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await deletePayment(id);
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deleteExpenseAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await deleteExpense(id);
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
