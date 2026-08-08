"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Eye, Loader2, Mail, Plus, Settings2, Trash2, X } from "lucide-react";
import { saveInvoiceAction } from "@/app/admin/(protected)/invoices/[id]/actions";
import { formatMoney } from "@/lib/utils";

type EditorRow = {
  key: string;
  description: string;
  /** Kept as strings so a half-typed "12." does not fight the input. */
  quantity: string;
  unitPrice: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";
const AUTOSAVE_DELAY_MS = 1200;

export type InvoiceBuilderProps = {
  bookingId: string;
  invoiceNumber: string;
  initialClientName: string;
  initialClientEmail: string;
  paid: number;
  initialItems: { description: string; quantity: number; unitPrice: number }[];
  initialDiscount: number;
  initialTaxRate: number;
  initialDueDate: string | null;
  initialPoNumber: string | null;
  initialNotes: string | null;
  initialPaymentInstructions: string;
};

const fieldClass =
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

export function InvoiceBuilder(props: InvoiceBuilderProps) {
  const [rows, setRows] = useState<EditorRow[]>(() =>
    props.initialItems.length ? props.initialItems.map((item) => newRow(item)) : [newRow()],
  );
  const [discount, setDiscount] = useState(props.initialDiscount > 0 ? props.initialDiscount.toFixed(2) : "");
  const [taxRate, setTaxRate] = useState(props.initialTaxRate > 0 ? String(props.initialTaxRate) : "");
  const [dueDate, setDueDate] = useState(props.initialDueDate ?? "");
  const [poNumber, setPoNumber] = useState(props.initialPoNumber ?? "");
  const [notes, setNotes] = useState(props.initialNotes ?? "");
  const [paymentInstructions, setPaymentInstructions] = useState(props.initialPaymentInstructions);
  const [clientName, setClientName] = useState(props.initialClientName);
  const [clientEmail, setClientEmail] = useState(props.initialClientEmail);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [, startSaving] = useTransition();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const dirtyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ rows, discount, taxRate, dueDate, poNumber, notes, paymentInstructions, clientName, clientEmail });
  useEffect(() => {
    latestRef.current = { rows, discount, taxRate, dueDate, poNumber, notes, paymentInstructions, clientName, clientEmail };
  }, [rows, discount, taxRate, dueDate, poNumber, notes, paymentInstructions, clientName, clientEmail]);

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
    const taxable = Math.max(0, subtotal - off);
    const taxAmount = Math.round((taxable * (num(taxRate) / 100) + Number.EPSILON) * 100) / 100;
    const total = Math.round((taxable + taxAmount + Number.EPSILON) * 100) / 100;
    const balance = Math.max(0, Math.round((total - props.paid + Number.EPSILON) * 100) / 100);
    return { subtotal, discount: off, taxAmount, total, balance };
  }, [rows, discount, taxRate, props.paid]);

  function draft() {
    return {
      items: rows.map((row) => ({ description: row.description, quantity: num(row.quantity), unitPrice: num(row.unitPrice) })),
      discount: num(discount),
      taxRate: num(taxRate),
      dueDate: dueDate || null,
      poNumber: poNumber || null,
      notes: notes || null,
      paymentInstructions: paymentInstructions || null,
    };
  }

  const save = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    startSaving(async () => {
      const latest = latestRef.current;
      const result = await saveInvoiceAction(props.bookingId, {
        clientName: latest.clientName,
        clientEmail: latest.clientEmail || null,
        draft: {
          items: latest.rows.map((row) => ({ description: row.description, quantity: num(row.quantity), unitPrice: num(row.unitPrice) })),
          discount: num(latest.discount),
          taxRate: num(latest.taxRate),
          dueDate: latest.dueDate || null,
          poNumber: latest.poNumber || null,
          notes: latest.notes || null,
          paymentInstructions: latest.paymentInstructions || null,
        },
      });
      setSaveState(result.ok ? "saved" : "error");
      dirtyRef.current = false;
    });
  }, [props.bookingId]);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setSaveState("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, AUTOSAVE_DELAY_MS);
  }, [save]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      if (dirtyRef.current) save();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [save]);

  const updateRow = (key: string, patch: Partial<EditorRow>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    scheduleSave();
  };

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

  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "error" ? "Couldn't save" : saveState === "saved" ? "Saved" : "";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="sticky top-[57px] z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-admin-line bg-admin-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/invoices" className="inline-flex items-center gap-1.5 text-sm text-admin-ink/60 transition hover:text-admin-ink">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Invoices
          </Link>
          <span className="text-admin-ink/20">/</span>
          <div className="min-w-0">
            <p className="truncate font-medium text-admin-ink">{clientName || "Untitled invoice"}</p>
            <p className="text-xs text-admin-ink/45">{props.invoiceNumber}{saveLabel ? ` · ${saveLabel}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-pressed={sidebarOpen}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition ${
              sidebarOpen ? "border-admin-copper bg-admin-copper/10 text-admin-ink" : "border-admin-ink/15 text-admin-ink/70 hover:bg-admin-ink/6"
            }`}
          >
            <Settings2 className="size-3.5" aria-hidden="true" />
            Client
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/15 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6 disabled:opacity-50"
          >
            {previewing ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
            Preview
          </button>
          <Link
            href={`/admin/invoices/${props.bookingId}/preview`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-admin-ink px-3 text-xs font-medium text-admin-surface"
          >
            <Mail className="size-3.5" aria-hidden="true" />
            Send
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 grid gap-6">
          <section className="rounded-xl border border-admin-line bg-admin-surface p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Payment due
                <input className={fieldClass} type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); scheduleSave(); }} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                PO / SO number <span className="font-normal text-admin-muted">(optional)</span>
                <input className={fieldClass} value={poNumber} onChange={(e) => { setPoNumber(e.target.value); scheduleSave(); }} placeholder="Optional reference" />
              </label>
            </div>
          </section>

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
                          <input className={fieldClass} value={row.description} onChange={(e) => updateRow(row.key, { description: e.target.value })} placeholder="Wedding coverage, 6 hours" aria-label="Item description" />
                        </td>
                        <td className="py-2 pr-3">
                          <input className={`${fieldClass} text-right`} value={row.quantity} onChange={(e) => updateRow(row.key, { quantity: e.target.value })} inputMode="decimal" aria-label="Quantity" />
                        </td>
                        <td className="py-2 pr-3">
                          <input className={`${fieldClass} text-right`} value={row.unitPrice} onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })} inputMode="decimal" placeholder="0.00" aria-label="Unit price" />
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-admin-ink">{formatMoney(amount)}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRows((current) => (current.length === 1 ? [newRow()] : current.filter((r) => r.key !== row.key)));
                              scheduleSave();
                            }}
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

            <div className="mt-6 flex justify-end">
              <dl className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-admin-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-admin-muted">Discount</dt>
                  <dd className="w-28">
                    <input className={`${fieldClass} text-right`} value={discount} onChange={(e) => { setDiscount(e.target.value); scheduleSave(); }} inputMode="decimal" placeholder="0.00" aria-label="Discount amount" />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-admin-muted">Tax %</dt>
                  <dd className="w-28">
                    <input className={`${fieldClass} text-right`} value={taxRate} onChange={(e) => { setTaxRate(e.target.value); scheduleSave(); }} inputMode="decimal" placeholder="0" aria-label="Tax rate percent" />
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

          <section className="rounded-xl border border-admin-line bg-admin-surface p-5 sm:p-6">
            <h2 className="text-base font-semibold tracking-tight">Notes / terms</h2>
            <textarea
              className={`${fieldClass} mt-3 min-h-24 resize-y py-3`}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); scheduleSave(); }}
              placeholder="Payment terms, what is included, anything the client should know."
            />
            <p className="mt-2 text-xs text-admin-muted">Printed at the foot of the invoice.</p>

            <h2 className="mt-6 text-base font-semibold tracking-tight">Payment instructions</h2>
            <textarea
              className={`${fieldClass} mt-3 min-h-20 resize-y py-3`}
              value={paymentInstructions}
              onChange={(e) => { setPaymentInstructions(e.target.value); scheduleSave(); }}
            />
            <p className="mt-2 text-xs text-admin-muted">Shown under &quot;How to pay&quot; on the invoice.</p>
          </section>

          {previewError ? (
            <p className="inline-flex items-center gap-2 rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger-ink">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              {previewError}
            </p>
          ) : null}
        </div>

        {sidebarOpen ? (
          <aside className="h-fit rounded-md border border-admin-ink/10 bg-admin-surface p-4 lg:sticky lg:top-[140px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-admin-ink/50">Client</p>
            <div className="mt-3 space-y-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Name</span>
                <input className={fieldClass} value={clientName} onChange={(e) => { setClientName(e.target.value); scheduleSave(); }} />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-admin-ink/80">Email</span>
                <input className={fieldClass} type="email" value={clientEmail} onChange={(e) => { setClientEmail(e.target.value); scheduleSave(); }} />
              </label>
            </div>
          </aside>
        ) : null}
      </div>

      {previewUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Invoice preview"
          className="fixed inset-0 z-50 flex flex-col bg-admin-ink/70 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-admin-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-admin-line px-4 py-3">
              <div>
                <p className="text-sm font-medium text-admin-ink">Invoice preview</p>
                <p className="text-xs text-admin-muted">Exactly what the client receives. Nothing is sent from here.</p>
              </div>
              <button type="button" onClick={() => setPreviewUrl(null)} aria-label="Close preview" className="inline-flex size-9 items-center justify-center rounded-md text-admin-muted transition hover:bg-admin-raise hover:text-admin-ink">
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
