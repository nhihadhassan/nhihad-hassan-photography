import { parseAmount } from "@/lib/utils";

export type InvoicePaymentState = {
  total: number;
  deposit: number;
  paid: number;
  balance: number;
  depositPaid: boolean;
  paidInFull: boolean;
};

export function calculateInvoicePaymentState(input: {
  total: string | null;
  deposit: string | null;
  paid: number;
}): InvoicePaymentState {
  const total = Math.max(0, parseAmount(input.total) ?? 0);
  const deposit = Math.max(0, parseAmount(input.deposit) ?? 0);
  const paid = Math.max(0, input.paid);
  const balance = Math.max(0, total - paid);

  return {
    total,
    deposit,
    paid,
    balance,
    depositPaid: deposit > 0 && paid >= deposit - 0.005,
    paidInFull: total > 0 && balance <= 0.005,
  };
}
