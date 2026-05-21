/**
 * Shared payment constants — no server-only imports so this file is safe to
 * use in both Server Components and Client Components.
 */

export type DepositStatus =
  | "not_requested"
  | "requested"
  | "received"
  | "balance_due"
  | "paid";

export const DEPOSIT_STATUS_VALUES = [
  "not_requested",
  "requested",
  "received",
  "balance_due",
  "paid",
] as const satisfies readonly DepositStatus[];

export const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
  not_requested: "Not requested",
  requested: "Deposit requested",
  received: "Deposit received",
  balance_due: "Balance due",
  paid: "Paid in full",
};
