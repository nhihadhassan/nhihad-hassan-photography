/**
 * Derived merge values.
 *
 * Anything computable is computed. A balance typed by hand is a balance that
 * eventually disagrees with the fee it came from, and the contract is the one
 * place that cannot happen.
 */

import type { FieldValues, Signer } from "./schema";

/** Ontario statutory holidays. Extend yearly, or swap in a holiday package. */
const HOLIDAYS_2026 = new Set([
  "2026-01-01", // New Year's Day
  "2026-02-16", // Family Day
  "2026-04-03", // Good Friday
  "2026-05-18", // Victoria Day
  "2026-07-01", // Canada Day
  "2026-08-03", // Civic Holiday
  "2026-09-07", // Labour Day
  "2026-09-30", // Truth and Reconciliation
  "2026-10-12", // Thanksgiving
  "2026-12-25", // Christmas
  "2026-12-28", // Boxing Day observed
]);

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addBusinessDays(startIso: string, days: number): string {
  const d = new Date(`${startIso}T12:00:00`);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    if (HOLIDAYS_2026.has(iso(d))) continue;
    remaining -= 1;
  }
  return iso(d);
}

/** "5:30 PM" plus 5 hours becomes "10:30 PM". */
export function addHoursToTime(time: string, hours: number): string {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!m) throw new Error(`Cannot parse time: ${time}`);
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  const total = (h * 60 + Number(m[2]) + Math.round(hours * 60)) % (24 * 60);
  const outH = Math.floor(total / 60);
  const suffix = outH >= 12 ? "PM" : "AM";
  const display = outH % 12 === 0 ? 12 : outH % 12;
  return `${display}:${String(total % 60).padStart(2, "0")} ${suffix}`;
}

export function withDerived(values: FieldValues): FieldValues {
  const out: FieldValues = { ...values };

  const total = Number(values["fee.total"] ?? 0);
  const retainer = Number(values["fee.retainer"] ?? 0);
  out["fee.balance"] = Math.max(0, Math.round((total - retainer) * 100) / 100);
  out["fee.retainer_percent"] = total > 0 ? Math.round((retainer / total) * 100) : 0;

  const monthly = Number(values["fee.late_interest_monthly"] ?? 0);
  out["fee.late_interest_annual"] = Math.round(monthly * 12 * 100) / 100;

  const midStart = Number(values["policy.cancel_mid_days"] ?? 15);
  const fullRefund = Number(values["policy.cancel_full_refund_days"] ?? 30);
  out["policy.cancel_mid_upper"] = Math.max(midStart, fullRefund - 1);

  const start = values["shoot.start_time"];
  const hours = Number(values["shoot.coverage_hours"] ?? 0);
  if (typeof start === "string" && hours > 0) {
    out["shoot.end_time"] = addHoursToTime(start, hours);
  }

  const date = values["shoot.date"];
  const deliveryDays = Number(values["deliverables.delivery_days"] ?? 0);
  if (typeof date === "string" && deliveryDays > 0) {
    out["deliverables.estimated_delivery_date"] = addBusinessDays(date, deliveryDays);
  }

  const signers = values["clients"];
  out["is_multi_client"] = Array.isArray(signers) && (signers as readonly Signer[]).length > 1;

  out["signing.date"] = values["signing.date"] ?? iso(new Date());

  return out;
}
