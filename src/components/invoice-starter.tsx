"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Receipt } from "lucide-react";
import type { ClientSummary } from "@/lib/clients";
import { ClientPicker } from "@/components/client-picker";
import { createInvoiceDraftAction } from "@/app/admin/(protected)/invoices/actions";

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";

/**
 * Step one of creating an invoice: just a client. Everything else -- line
 * items, tax, due date, notes -- is filled in directly on the rendered
 * invoice in the document-first editor this routes into.
 */
export function InvoiceStarter({ clients }: { clients: ClientSummary[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chooseClient = (key: string) => {
    const client = clients.find((candidate) => candidate.key === key);
    if (!client) return;
    setSelectedClientKey(key);
    setClientName(client.name);
    setClientEmail(client.email ?? "");
  };

  const createClient = (name: string, email: string) => {
    setSelectedClientKey("");
    setClientName(name);
    setClientEmail(email);
  };

  const create = () => {
    if (!clientName.trim()) {
      setError("Enter a client name.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createInvoiceDraftAction({ clientName, clientEmail: clientEmail || null });
      if (result.ok && result.id) {
        router.push(`/admin/invoices/${result.id}/edit`);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-admin-accent/10 text-admin-accent">
            <Receipt className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-tight">New invoice</h1>
            <p className="mt-1 text-sm leading-6 text-admin-ink/65">
              Choose a client, then fill in line items, tax, and payment terms directly on the invoice.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ClientPicker
            clients={clients}
            selectedKey={selectedClientKey}
            currentName={selectedClientKey ? "" : clientName}
            currentEmail={selectedClientKey ? "" : clientEmail}
            onSelect={chooseClient}
            onCreate={createClient}
          />
          <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
            Client name
            <input
              className={inputClass}
              value={clientName}
              onChange={(event) => {
                setSelectedClientKey("");
                setClientName(event.target.value);
              }}
              placeholder="Full name"
              autoComplete="name"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Client email
            <input
              className={inputClass}
              type="email"
              value={clientEmail}
              onChange={(event) => {
                setSelectedClientKey("");
                setClientEmail(event.target.value);
              }}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={create}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Create invoice
          </button>
          {error ? <p className="rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
