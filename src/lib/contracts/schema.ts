/**
 * Merge field registry for contract templates.
 *
 * Every token a template may reference is declared here. The registry drives
 * three things: the admin form, pre issue validation, and the renderer's
 * strict mode. A template referencing a key that is not in this registry is a
 * build error, not a silently blank line in a signed agreement.
 */

export type FieldKind = "text" | "longtext" | "money" | "date" | "time" | "number" | "boolean" | "list";

export type FieldSource =
  /** Comes from business settings. Same on every contract. */
  | "business"
  /** Pulled from the booking or client record, editable before issue. */
  | "booking"
  /** Policy default, editable per contract. */
  | "policy"
  /** Computed. Never entered by hand, never editable. */
  | "derived";

export interface FieldDef {
  readonly key: string;
  readonly label: string;
  readonly kind: FieldKind;
  readonly source: FieldSource;
  /** Blocks issuing the contract when missing. */
  readonly required: boolean;
  readonly help?: string;
  readonly default?: string | number | boolean;
}

export const FIELDS = [
  // Business ---------------------------------------------------------------
  { key: "business.name", label: "Business name", kind: "text", source: "business", required: true, default: "Nhihad Hassan Photography" },
  { key: "business.owner", label: "Owner legal name", kind: "text", source: "business", required: true, default: "Nhihad Hassan" },
  { key: "business.location", label: "Business location", kind: "text", source: "business", required: true, default: "Toronto, Ontario, Canada" },
  { key: "business.email", label: "Business email", kind: "text", source: "business", required: true, default: "nhihadhassanphotography@gmail.com" },
  { key: "business.phone", label: "Business phone", kind: "text", source: "business", required: true, default: "647-745-8899" },
  { key: "business.website", label: "Website", kind: "text", source: "business", required: true, default: "nhihadhassan.ca" },
  { key: "business.instagram", label: "Instagram handle", kind: "text", source: "business", required: true, default: "@nhihad_photography" },
  { key: "business.is_incorporated", label: "Incorporated", kind: "boolean", source: "business", required: true, default: false },
  { key: "business.hst_registered", label: "HST registered", kind: "boolean", source: "business", required: true, default: false },
  { key: "business.hst_number", label: "GST/HST number", kind: "text", source: "business", required: false, help: "Required once HST registered is on." },
  { key: "business.has_insurance", label: "Carries general liability insurance", kind: "boolean", source: "business", required: true, default: false },
  { key: "business.backup_practice", label: "Backup practice", kind: "text", source: "business", required: true, default: "dual card recording in camera and same day offload to separate storage" },

  // Client -----------------------------------------------------------------
  { key: "clients", label: "Signers", kind: "list", source: "booking", required: true, help: "One entry per person or entity signing. Each needs name, email, phone." },
  { key: "client.entity_name", label: "Company name", kind: "text", source: "booking", required: false, help: "Only for corporate clients. Leave blank for individuals." },

  // Shoot ------------------------------------------------------------------
  { key: "shoot.type_label", label: "Shoot type", kind: "text", source: "booking", required: true, help: "Reads inline, for example 'wedding photography services'." },
  { key: "shoot.date", label: "Event date", kind: "date", source: "booking", required: true },
  { key: "shoot.start_time", label: "Start time", kind: "time", source: "booking", required: true },
  { key: "shoot.end_time", label: "End time", kind: "time", source: "derived", required: true },
  { key: "shoot.coverage_hours", label: "Coverage hours", kind: "number", source: "booking", required: true },
  { key: "shoot.primary_location", label: "Primary location", kind: "text", source: "booking", required: true },
  { key: "shoot.additional_locations", label: "Additional locations", kind: "text", source: "booking", required: false },
  { key: "shoot.contact_name", label: "Day of contact name", kind: "text", source: "booking", required: true, help: "Should not be the client at a wedding." },
  { key: "shoot.contact_phone", label: "Day of contact phone", kind: "text", source: "booking", required: true },
  { key: "shoot.shot_list", label: "Shot list and key people", kind: "longtext", source: "booking", required: false },
  { key: "shoot.restrictions", label: "Restrictions", kind: "longtext", source: "booking", required: false, help: "Cultural, religious, venue and flash restrictions." },
  { key: "shoot.alongside_other_vendors", label: "Other photo or video vendors present", kind: "boolean", source: "booking", required: true, default: false },
  { key: "shoot.spans_meal", label: "Coverage spans a meal service", kind: "boolean", source: "booking", required: true, default: false },
  { key: "shoot.has_assistant", label: "Bringing an assistant or second shooter", kind: "boolean", source: "booking", required: true, default: false },

  // Deliverables -----------------------------------------------------------
  { key: "deliverables.min_images", label: "Minimum images", kind: "number", source: "booking", required: true, help: "The contractual floor. Quote this below what you expect to deliver." },
  { key: "deliverables.expected_images", label: "Expected images", kind: "number", source: "booking", required: true },
  { key: "deliverables.has_preview", label: "Include a preview delivery", kind: "boolean", source: "policy", required: true, default: true },
  { key: "deliverables.preview_count", label: "Preview image count", kind: "number", source: "policy", required: false, default: 12 },
  { key: "deliverables.preview_days", label: "Preview turnaround, business days", kind: "number", source: "policy", required: false, default: 5 },
  { key: "deliverables.delivery_days", label: "Full turnaround, business days", kind: "number", source: "policy", required: true, default: 20 },
  { key: "deliverables.gallery_days", label: "Gallery availability, days", kind: "number", source: "policy", required: true, default: 365 },
  { key: "deliverables.archive_days", label: "Archive period, days", kind: "number", source: "policy", required: true, default: 365 },
  { key: "deliverables.estimated_delivery_date", label: "Estimated delivery date", kind: "date", source: "derived", required: false },

  // Licence ----------------------------------------------------------------
  { key: "licence.is_commercial", label: "Commercial licence", kind: "boolean", source: "booking", required: true, default: false },

  // Money ------------------------------------------------------------------
  { key: "fee.total", label: "Total fee", kind: "money", source: "booking", required: true },
  { key: "fee.retainer", label: "Retainer", kind: "money", source: "booking", required: true },
  { key: "fee.balance", label: "Balance", kind: "money", source: "derived", required: true },
  { key: "fee.retainer_percent", label: "Retainer as percent of total", kind: "number", source: "derived", required: false },
  { key: "fee.balance_due_date", label: "Balance due date", kind: "date", source: "booking", required: true, help: "Defaults to the event date. Collecting after delivery leaves you no leverage." },
  { key: "fee.all_inclusive", label: "All inclusive, no separate expenses", kind: "boolean", source: "booking", required: true, default: true },
  { key: "fee.separate_expenses", label: "Expenses billed separately", kind: "text", source: "booking", required: false },
  { key: "fee.has_overtime_rate", label: "Charges an overtime rate", kind: "boolean", source: "booking", required: true, default: true },
  { key: "fee.overtime_rate", label: "Overtime rate per hour", kind: "money", source: "booking", required: false },
  { key: "fee.overtime_increment", label: "Overtime increment, minutes", kind: "number", source: "policy", required: false, default: 30 },
  { key: "fee.late_interest_monthly", label: "Late interest per month, percent", kind: "number", source: "policy", required: true, default: 1.5 },
  { key: "fee.late_interest_annual", label: "Late interest per year, percent", kind: "number", source: "derived", required: true },

  // Policy -----------------------------------------------------------------
  { key: "policy.cancel_full_refund_days", label: "Cancel with no further amount owing, days out", kind: "number", source: "policy", required: true, default: 30 },
  { key: "policy.cancel_mid_days", label: "Mid tier starts at, days out", kind: "number", source: "policy", required: true, default: 15 },
  { key: "policy.cancel_mid_percent", label: "Mid tier amount owing, percent", kind: "number", source: "policy", required: true, default: 50 },
  { key: "policy.cancel_late_days", label: "Late tier, days out or fewer", kind: "number", source: "policy", required: true, default: 14 },
  { key: "policy.cancel_late_percent", label: "Late tier amount owing, percent", kind: "number", source: "policy", required: true, default: 100 },
  { key: "policy.cancel_mid_upper", label: "Mid tier upper bound", kind: "number", source: "derived", required: true },
  { key: "policy.reschedule_notice_days", label: "Reschedule notice, days", kind: "number", source: "policy", required: true, default: 15 },
  { key: "policy.reschedule_window_months", label: "Reschedule window, months", kind: "number", source: "policy", required: true, default: 6 },
  { key: "policy.revision_rounds", label: "Revision rounds", kind: "number", source: "policy", required: true, default: 2 },
  { key: "policy.revision_images", label: "Revision image count", kind: "number", source: "policy", required: true, default: 10 },
  { key: "policy.revision_window_days", label: "Revision window, days", kind: "number", source: "policy", required: true, default: 14 },
  { key: "policy.shot_list_notice_days", label: "Shot list notice, days", kind: "number", source: "policy", required: true, default: 7 },
  { key: "policy.dispute_discussion_days", label: "Good faith discussion, days", kind: "number", source: "policy", required: true, default: 30 },
  { key: "policy.has_privacy_surcharge_amount", label: "Privacy surcharge is a fixed amount", kind: "boolean", source: "policy", required: true, default: false },
  { key: "policy.privacy_surcharge", label: "Privacy surcharge", kind: "money", source: "policy", required: false },

  // Signing ----------------------------------------------------------------
  { key: "signing.date", label: "Agreement date", kind: "date", source: "derived", required: true },
  { key: "is_multi_client", label: "Two or more signers", kind: "boolean", source: "derived", required: true },
] as const satisfies readonly FieldDef[];

export type FieldKey = (typeof FIELDS)[number]["key"];

export const FIELD_BY_KEY: ReadonlyMap<string, FieldDef> = new Map(
  FIELDS.map((f) => [f.key, f as FieldDef]),
);

export interface Signer {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
}

export type FieldValue = string | number | boolean | null | undefined | readonly Signer[];
export type FieldValues = Record<string, FieldValue>;

/** Policy and business defaults, applied under whatever the admin form supplies. */
export function defaultValues(): FieldValues {
  const out: FieldValues = {};
  for (const f of FIELDS) {
    if ("default" in f && f.default !== undefined) out[f.key] = f.default;
  }
  return out;
}

export interface ValidationIssue {
  readonly key: string;
  readonly label: string;
  readonly message: string;
}

function isBlank(v: FieldValue): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/**
 * Validates values against the registry, restricted to the keys a given
 * template actually uses. Call this before allowing a contract to be sent.
 */
export function validate(values: FieldValues, usedKeys: readonly string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const used = new Set(usedKeys);

  for (const f of FIELDS) {
    if (!used.has(f.key)) continue;
    if (f.required && isBlank(values[f.key])) {
      issues.push({ key: f.key, label: f.label, message: "Required before issuing" });
    }
  }

  // Conditional requirements. A boolean switching on a clause makes the
  // clause's own inputs mandatory.
  const requireIf = (cond: boolean, key: string, message: string): void => {
    if (!cond || !used.has(key)) return;
    if (isBlank(values[key])) {
      issues.push({ key, label: FIELD_BY_KEY.get(key)?.label ?? key, message });
    }
  };

  requireIf(values["business.hst_registered"] === true, "business.hst_number", "Required when HST registered");
  requireIf(values["fee.has_overtime_rate"] === true, "fee.overtime_rate", "Required when charging overtime");
  requireIf(values["fee.all_inclusive"] === false, "fee.separate_expenses", "List what is billed separately");
  requireIf(values["deliverables.has_preview"] === true, "deliverables.preview_count", "Required when a preview is promised");
  requireIf(values["deliverables.has_preview"] === true, "deliverables.preview_days", "Required when a preview is promised");
  requireIf(values["policy.has_privacy_surcharge_amount"] === true, "policy.privacy_surcharge", "Set the amount or switch to quoted on request");

  // Arithmetic sanity. These are the mistakes that actually cost money.
  const total = Number(values["fee.total"]);
  const retainer = Number(values["fee.retainer"]);
  if (Number.isFinite(total) && Number.isFinite(retainer) && retainer > total) {
    issues.push({ key: "fee.retainer", label: "Retainer", message: "Retainer exceeds the total fee" });
  }

  const min = Number(values["deliverables.min_images"]);
  const expected = Number(values["deliverables.expected_images"]);
  if (Number.isFinite(min) && Number.isFinite(expected) && min > expected) {
    issues.push({
      key: "deliverables.min_images",
      label: "Minimum images",
      message: "Minimum is above the expected count. The minimum is the promise you have to keep.",
    });
  }

  const signers = values["clients"];
  if (Array.isArray(signers)) {
    signers.forEach((s, i) => {
      if (!s?.name?.trim()) issues.push({ key: `clients[${i}].name`, label: `Signer ${i + 1} name`, message: "Required" });
      if (!s?.email?.trim()) issues.push({ key: `clients[${i}].email`, label: `Signer ${i + 1} email`, message: "Required for the signing link" });
    });
  }

  return issues;
}
