/**
 * The variable catalog for the template editor's "Insert variable" menu and
 * Preview mode's sample data. These are the same {{token}} names already
 * consumed by RichText/VariableValue in agreement-document.tsx and populated
 * per-agreement in agreement-view.ts's `values` map — this file doesn't
 * introduce a new variable system, it just catalogs the existing one for the
 * editor UI.
 */
export type TemplateVariable = {
  key: string;
  label: string;
  group: "Client" | "Session" | "Payment" | "Delivery" | "Photographer";
  /** Shown in Preview mode only. Never written back to the template. */
  sampleValue: string;
};

export const templateVariables: TemplateVariable[] = [
  { key: "clientName", label: "Client name", group: "Client", sampleValue: "Alex Morgan" },
  { key: "secondSignerName", label: "Second signer name", group: "Client", sampleValue: "Jamie Morgan" },
  { key: "clientEmail", label: "Client email", group: "Client", sampleValue: "alex@example.com" },
  { key: "clientPhone", label: "Client phone", group: "Client", sampleValue: "(416) 555-0142" },
  { key: "clientAddress", label: "Client address", group: "Client", sampleValue: "123 Queen St W, Toronto, ON" },

  { key: "date", label: "Session date", group: "Session", sampleValue: "September 12, 2026" },
  { key: "startTime", label: "Session time", group: "Session", sampleValue: "2:00 PM" },
  { key: "coverageTime", label: "Session duration", group: "Session", sampleValue: "2 hours" },
  { key: "type", label: "Shoot type", group: "Session", sampleValue: "Couples Session" },
  { key: "location", label: "Location", group: "Session", sampleValue: "High Park, Toronto" },

  { key: "total", label: "Total price", group: "Payment", sampleValue: "$450" },
  { key: "deposit", label: "Retainer", group: "Payment", sampleValue: "$150" },
  { key: "balance", label: "Balance due", group: "Payment", sampleValue: "$300" },
  { key: "balanceDueDate", label: "Payment due date", group: "Payment", sampleValue: "September 5, 2026" },

  { key: "turnaroundBusinessDays", label: "Delivery timeline", group: "Delivery", sampleValue: "10 business days" },
  { key: "galleryWindow", label: "Gallery availability", group: "Delivery", sampleValue: "1 year" },

  { key: "photographerName", label: "Photographer name", group: "Photographer", sampleValue: "Nhihad Hassan" },
  { key: "photographerBusinessName", label: "Business name", group: "Photographer", sampleValue: "Nhihad Hassan Photography" },
];

export const templateVariableGroups = Array.from(new Set(templateVariables.map((v) => v.group)));

/** {{key}} → sampleValue, for Preview mode. */
export const sampleVariableValues: Record<string, string> = Object.fromEntries(
  templateVariables.map((v) => [v.key, v.sampleValue]),
);
