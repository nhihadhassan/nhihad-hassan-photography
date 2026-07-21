import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type ReminderKind = "deposit_due" | "balance_due" | "gallery_expiring" | "review_request";

export type ReminderRule = {
  kind: ReminderKind;
  enabled: boolean;
  offset_days: number;
  cadence_days: number;
  max_sends: number;
};

export const REMINDER_KINDS: ReminderKind[] = [
  "deposit_due",
  "balance_due",
  "gallery_expiring",
  "review_request",
];

/**
 * Defaults that mirror the pre-rules behaviour. Used verbatim when the
 * reminder_rules table has not been created or seeded yet, so the engine keeps
 * working before the migration is applied.
 */
export const DEFAULT_RULES: Record<ReminderKind, ReminderRule> = {
  deposit_due: { kind: "deposit_due", enabled: true, offset_days: 0, cadence_days: 7, max_sends: 3 },
  balance_due: { kind: "balance_due", enabled: true, offset_days: 4, cadence_days: 7, max_sends: 1 },
  gallery_expiring: { kind: "gallery_expiring", enabled: true, offset_days: 7, cadence_days: 7, max_sends: 1 },
  review_request: { kind: "review_request", enabled: true, offset_days: 7, cadence_days: 7, max_sends: 1 },
};

/** Human-readable sentence for each rule, filled with its current numbers. */
export function ruleSentence(rule: ReminderRule): string {
  switch (rule.kind) {
    case "deposit_due":
      return `If a booked shoot has no deposit recorded, send the deposit reminder, then every ${rule.cadence_days} days, up to ${rule.max_sends} times.`;
    case "balance_due":
      return `When a shoot is within ${rule.offset_days} days and a balance is still owed, send the balance reminder.`;
    case "gallery_expiring":
      return `When a published gallery expires within ${rule.offset_days} days, send the download reminder.`;
    case "review_request":
      return `${rule.offset_days} days after a delivered shoot, send the review request.`;
  }
}

/** Load rules, falling back to defaults for any kind missing or if the table is absent. */
export async function getReminderRules(): Promise<Record<ReminderKind, ReminderRule>> {
  const merged = { ...DEFAULT_RULES };
  try {
    const admin = getServiceRoleSupabaseClient();
    const { data, error } = await admin.from("reminder_rules").select("*");
    if (error || !data) return merged;
    for (const row of data as ReminderRule[]) {
      if ((REMINDER_KINDS as string[]).includes(row.kind)) {
        merged[row.kind] = {
          kind: row.kind,
          enabled: Boolean(row.enabled),
          offset_days: Number(row.offset_days),
          cadence_days: Math.max(1, Number(row.cadence_days)),
          max_sends: Math.max(1, Number(row.max_sends)),
        };
      }
    }
  } catch {
    // table not present yet: defaults are correct
  }
  return merged;
}

/** Update one rule's editable fields. */
export async function updateReminderRule(
  kind: ReminderKind,
  patch: { enabled?: boolean; offset_days?: number; cadence_days?: number; max_sends?: number },
): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  await admin
    .from("reminder_rules")
    .upsert(
      {
        kind,
        enabled: patch.enabled ?? DEFAULT_RULES[kind].enabled,
        offset_days: patch.offset_days ?? DEFAULT_RULES[kind].offset_days,
        cadence_days: patch.cadence_days ?? DEFAULT_RULES[kind].cadence_days,
        max_sends: patch.max_sends ?? DEFAULT_RULES[kind].max_sends,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kind" },
    );
}

/** Booking ids muted for a given kind. */
export async function getMutedBookings(): Promise<Set<string>> {
  try {
    const admin = getServiceRoleSupabaseClient();
    const { data } = await admin.from("reminder_mutes").select("booking_id,kind");
    return new Set((data ?? []).map((r) => `${r.kind}:${r.booking_id}`));
  } catch {
    return new Set();
  }
}
