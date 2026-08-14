"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/app/admin/(protected)/clients/actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-admin-line-strong bg-admin-surface px-3 text-base text-admin-ink outline-none transition placeholder:text-admin-muted focus:border-admin-accent sm:text-sm";

export function AddClientInline() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-admin-ink px-4 text-sm font-medium text-admin-surface"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add client
      </button>
    );
  }

  return (
    <section className="w-full basis-full border-y border-admin-line bg-admin-subtle px-4 py-4 sm:px-5" aria-label="Add client">
      <div className="grid gap-3 sm:grid-cols-[1.2fr_1.3fr_1fr_auto] sm:items-end">
        <label className="grid gap-1.5 text-xs font-medium text-admin-muted">
          Name
          <input
            autoFocus
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className={inputClass}
            placeholder="Full name"
            autoComplete="name"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-admin-muted">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className={inputClass}
            placeholder="name@example.com"
            autoComplete="email"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-admin-muted">
          Phone
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className={inputClass}
            placeholder="Optional"
            autoComplete="tel"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending || !form.name.trim()}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const result = await createClientAction(form);
                setMessage(result.message);
                if (result.ok) {
                  setForm({ name: "", email: "", phone: "" });
                  setOpen(false);
                  router.refresh();
                }
              });
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-admin-ink px-4 text-sm font-medium text-admin-surface disabled:opacity-40"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            Save
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setMessage(null); }}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-admin-line-strong text-admin-muted hover:bg-admin-raise"
            aria-label="Cancel adding client"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {message ? <p className="mt-2 text-sm text-admin-status-danger">{message}</p> : null}
    </section>
  );
}
