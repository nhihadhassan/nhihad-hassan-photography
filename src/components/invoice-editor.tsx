"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Eye, Loader2, Plus, Trash2, X } from "lucide-react";
import { saveInvoiceAction } from "@/app/admin/(protected)/bookings/[id]/invoice/actions";
import { formatMoney } from "@/lib/utils";

type EditorRow = {
  key: string;
  description: string;
  /** Kept as strings so a half-typed "12." does not fight the input. */
  quantity: string;
  unitPrice: string;
};

export type InvoiceEditorProps = {
  bookingId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  paid: number;
  initialItems: { description: string; quantity: number; unitPrice: number }[];
  initialDiscount: number;
  initialDueDate: string | null;
  initialPoNumber: string | null;
  initialNotes: string | null;
};

const inputClass =
  "min-h-10 w-full rounded-md border border-admin-line bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-muted focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35";

let rowSeq = 0;
function newRow(item?: { description: string; quantity: number; unitPrice: number }): EditorRow {
  rowSeq += 1;
  return {
    key: `row-${rowSeq}`,
    description: item?.description ?? "",
    quantity: item ? String(item.quantity) : "1",
    unitPrice: item ? item.unitPrice.toFixed(2) : "",
  };
}

function num(value: string): number {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function InvoiceEditor(props: InvoiceEditorProps) {
  const router = useRouter();
  const [rows, setRows] = useState<EditorRow[]>(() =>
    props.initialItems.length ? props.initialItems.map((item) => newRow(item)) : [newRow()],
  );
  const [discount, setDiscount] = useState(
    props.initialDiscount > 0 ? props.initialDiscount.toFixed(2) : "",
  );
  const [dueDate, setDueDate] = useState(props.initialDueDate ?? "");
  const [poNumber, setPoNumber] = useState(props.initialPoNumber ?? "");
  const [notes, setNotes] = useState(props.initialNotes ?? "");

  const [saving, startSaving] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Revoke the last blob URL whenever it is replaced or the editor unmounts,
  // so previews do not leak memory across repeated opens.
  useEffect(() => {
    previewUrlRef.current = previewUrl;
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [previewUrl]);

  const totals = useMemo(() => {
    const lines = rows
      .filter((row) => row.description.trim().length > 0)
      .map((row) => num(row.quantity) * num(row.unitPrice));
    const subtotal = Math.round((lines.reduce((a, b) => a + b, 0) + Number.EPSILON) * 100) / 100;
    const off = Math.min(num(discount), subtotal);
    const total = Math.round((subtotal - off + Number.EPSILON) * 100) / 100;
    const balance = Math.max(0, Math.round((total - props.paid + Number.EPSILON) * 100) / 100);
    return { subtotal, discount: off, total, balance };
  }, [rows, discount, props.paid]);

  function draft() {
    return {
      items: rows.map((row) => ({
        description: row.description,
        quantity: num(row.quantity),
        unitPrice: num(row.unitPrice),
      })),
      discount: num(discount),
      dueDate: dueDate || null,
      poNumber: poNumber || null,
      notes: notes || null,
    };
  }

  function handleSave() {
    setResult(null);
    startSaving(async () => {
      const res = await saveInvoiceAction(props.bookingId, draft());
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  async function handlePreview() {
    setPreviewError(null);
    setPreviewing(true);
    try {
      const res = await fetch("/api/admin/invoice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: props.bookingId, draft: draft() }),
      });
      if (!res.ok) {
        setPreviewError(await res.text().catch(() => "Could not build the preview."));
        return;
      }
      const blob = await res.blob();
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setPreviewError("Could not reach the server to build the preview.");
    } finally {
      setPreviewing(false);
    }
  }

  const updateRow = (key: string, patch: Partial<EditorRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div className="grid gap-6">
      {/* Invoice meta */}
      <section className="rounded-xl border border-admin-line bg-admin-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{props.invoiceNumber}</h2>
            <p className="mt-1 text-sm text-admin-muted">
              Billed to {props.clientName}
              {props.clientEmail ? ` (${props.clientEmail})` : ""}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            Payment due
            <input
              className={inputClass}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            PO / SO number <span className="font-normal text-admin-muted">(optional)</span>
            <input
              className={inputClass}
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="Optional reference"
            />
          </label>
        </div>
      </section>

      {/* Line items */}
      <section className="rounded-xl border border-admin-line bg-admin-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Items</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-line text-left text-xs text-admin-muted">
                <th className="pb-2 font-medium">Description</th>
                <th className="w-24 pb-2 text-right font-medium">Qty</th>
                <th className="w-32 pb-2 text-right font-medium">Price</th>
                <th className="w-32 pb-2 text-right font-medium">Amount</th>
                <th className="w-10 pb-2" aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const amount = num(row.quantity) * num(row.unitPrice);
                return (
                  <tr key={row.key} className="border-b border-admin-line/60">
                    <td className="py-2 pr-3">
                      <input
                        className={inputClass}
                        value={row.description}
                        onChange={(e) => updateRow(row.key, { description: e.target.value })}
                        placeholder="Wedding coverage, 6 hours"
                        aria-label="Item description"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className={`${inputClass} text-right`}
                        value={row.quantity}
                        onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                        inputMode="decimal"
                        aria-label="Quantity"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className={`${inputClass} text-right`}
                        value={row.unitPrice}
                        onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
                        inputMode="decimal"
                        placeholder="0.00"
                        aria-label="Unit price"
                      />
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-admin-ink">
                      {formatMoney(amount)}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setRows((current) =>
                            current.length === 1
                              ? [newRow()]
                              : current.filter((r) => r.key !== row.key),
                          )
                        }
                        aria-label="Remove item"
                        className="inline-flex size-9 items-center justify-center rounded-md text-admin-muted transition hover:bg-admin-raise hover:text-admin-danger"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => setRows((current) => [...current, newRow()])}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-line-strong px-3 text-sm font-medium text-admin-ink transition hover:bg-admin-raise"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add an item
        </button>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-admin-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-admin-muted">Discount</dt>
              <dd className="w-28">
                <input
                  className={`${inputClass} text-right`}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Discount amount"
                />
              </dd>
            </div>
            <div className="flex justify-between border-t border-admin-line pt-2">
              <dt className="font-medium">Total</dt>
              <dd className="font-medium tabular-nums">{formatMoney(totals.total)}</dd>
            </div>
            {props.paid > 0 ? (
              <div className="flex justify-between">
                <dt className="text-admin-muted">Paid</dt>
                <dd className="tabular-nums">-{formatMoney(props.paid)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-admin-line pt-2 text-base">
              <dt className="font-semibold">Amount due</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(totals.balance)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-admin-line bg-admin-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Notes / terms</h2>
        <textarea
          className="mt-3 min-h-28 w-full rounded-md border border-admin-line bg-white/70 px-3 py-3 text-sm leading-6 text-admin-ink outline-none transition placeholder:text-admin-muted focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Payment terms, what is included, anything the client should know."
        />
        <p className="mt-2 text-xs text-admin-muted">Printed at the foot of the invoice.</p>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-admin-copper/40 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
          {saving ? "Saving…" : "Save invoice"}
        </button>
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-line-strong px-4 text-sm font-medium text-admin-ink transition hover:bg-admin-raise focus-visible:ring-2 focus-visible:ring-admin-copper/40 disabled:opacity-60"
        >
          {previewing ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
          {previewing ? "Building…" : "Preview"}
        </button>

        {result ? (
          <span
            className={
              result.ok
                ? "inline-flex items-center gap-2 rounded-md bg-admin-success/12 px-3 py-2 text-sm text-admin-success"
                : "inline-flex items-center gap-2 rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger-ink"
            }
          >
            {result.ok ? (
              <CheckCircle className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            )}
            {result.message}
          </span>
        ) : null}
        {previewError ? (
          <span className="inline-flex items-center gap-2 rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger-ink">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {previewError}
          </span>
        ) : null}
      </div>

      {/* Preview overlay */}
      {previewUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Invoice preview"
          className="fixed inset-0 z-50 flex flex-col bg-admin-ink/70 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-admin-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-admin-line px-4 py-3">
              <div>
                <p className="text-sm font-medium text-admin-ink">Invoice preview</p>
                <p className="text-xs text-admin-muted">
                  Exactly what the client receives. Nothing is sent from here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                aria-label="Close preview"
                className="inline-flex size-9 items-center justify-center rounded-md text-admin-muted transition hover:bg-admin-raise hover:text-admin-ink"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <iframe title="Invoice preview" src={previewUrl} className="h-full w-full flex-1 border-0" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
