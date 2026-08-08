/**
 * Shape of an in-progress invoice, shared by the editor, the save action, and
 * the preview endpoint. Pure (no "server-only") so the client editor can import
 * the parser and post exactly what the server will parse back.
 */

export type InvoiceDraftItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceDraft = {
  items: InvoiceDraftItem[];
  discount: number;
  taxRate: number;
  dueDate: string | null;
  poNumber: string | null;
  notes: string | null;
  paymentInstructions: string | null;
};

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

/**
 * Normalises an untrusted draft payload (from the editor) into safe values.
 * Rows without a description are dropped, and negatives are clamped, so the
 * preview and the saved invoice can never disagree about what was submitted.
 */
export function parseInvoiceDraft(input: unknown): InvoiceDraft {
  const raw = (input ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  const items: InvoiceDraftItem[] = rawItems
    .map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
        description: String(item.description ?? "").trim(),
        quantity: Math.max(0, toNumber(item.quantity)),
        unitPrice: Math.max(0, toNumber(item.unitPrice)),
      };
    })
    .filter((item) => item.description.length > 0)
    .slice(0, 100);

  return {
    items,
    discount: Math.max(0, toNumber(raw.discount)),
    taxRate: Math.max(0, Math.min(100, toNumber(raw.taxRate))),
    dueDate: toNullableString(raw.dueDate),
    poNumber: toNullableString(raw.poNumber),
    notes: toNullableString(raw.notes),
    paymentInstructions: toNullableString(raw.paymentInstructions),
  };
}
