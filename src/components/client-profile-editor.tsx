"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Mail, MapPin, Pencil, Phone, StickyNote, X } from "lucide-react";
import { updateClientProfileAction } from "@/app/admin/(protected)/clients/actions";

const fieldClass =
  "min-h-10 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/50 focus:border-admin-copper";

/**
 * A "client" is a derived aggregate (src/lib/clients.ts merges galleries,
 * bookings, agreements, inquiries, and reviews into one profile per person)
 * -- there is no single row to edit. Saving here writes to
 * client_profile_overrides only; it never rewrites the historical records
 * those fields were originally pulled from.
 */
export function ClientProfileEditor({
  clientKey,
  name,
  email,
  phone,
  address,
  notes,
}: {
  clientKey: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name,
    email: email ?? "",
    phone: phone ?? "",
    address: address ?? "",
    notes: notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="mt-2">
        <div className="flex flex-wrap items-center gap-4 text-sm text-admin-ink/65">
          {email ? (
            <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 hover:text-admin-accent">
              <Mail className="size-3.5" aria-hidden="true" />
              {email}
            </a>
          ) : null}
          {phone ? (
            <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-admin-accent">
              <Phone className="size-3.5" aria-hidden="true" />
              {phone}
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setForm({ name, email: email ?? "", phone: phone ?? "", address: address ?? "", notes: notes ?? "" });
              setError(null);
              setEditing(true);
            }}
            className="inline-flex items-center gap-1.5 text-admin-ink/50 transition hover:text-admin-ink"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit details
          </button>
        </div>
        {address ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-admin-ink/65">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {address}
          </p>
        ) : null}
        {notes ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-admin-ink/65">
            <StickyNote className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {notes}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Name
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Mailing address
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Notes <span className="font-normal text-admin-ink/50">(internal only)</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className={`${fieldClass} resize-y py-2`}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await updateClientProfileAction(clientKey, form);
              if (result.ok) {
                setEditing(false);
                router.refresh();
              } else {
                setError(result.message);
              }
            });
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-admin-ink px-4 text-xs font-semibold text-admin-surface disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Check className="size-3.5" aria-hidden="true" />}
          Save
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 disabled:opacity-50"
        >
          <X className="size-3.5" aria-hidden="true" />
          Cancel
        </button>
        {error ? <p className="text-xs text-admin-danger">{error}</p> : null}
      </div>
    </div>
  );
}
