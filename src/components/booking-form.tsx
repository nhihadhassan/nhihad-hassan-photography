"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { AgreementRequest } from "@/lib/agreements";
import type { BookingWithLinks } from "@/lib/bookings";
import {
  createBookingAction,
  updateBookingAction,
  type BookingActionState,
} from "@/app/admin/(protected)/bookings/actions";
import { utcToTorontoLocalInput } from "@/lib/ics";
import { formatCompactDate } from "@/lib/utils";

const initialState: BookingActionState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";
const labelClass = "grid gap-1.5 text-sm font-medium";

export function BookingForm({
  mode,
  booking,
  galleries,
  agreementRequests,
}: {
  mode: "create" | "edit";
  booking?: BookingWithLinks;
  galleries: GalleryRecord[];
  agreementRequests: AgreementRequest[];
}) {
  const action = mode === "create" ? createBookingAction : updateBookingAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [copied, setCopied] = useState(false);

  const v = <T,>(value: T | null | undefined, fallback = "") =>
    value === null || value === undefined ? fallback : String(value);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && booking ? <input type="hidden" name="id" value={booking.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Client name
          <input className={inputClass} name="client_name" defaultValue={v(booking?.client_name)} placeholder="Jane Doe" />
        </label>
        <label className={labelClass}>
          Client email
          <input className={inputClass} type="email" name="client_email" defaultValue={v(booking?.client_email)} placeholder="client@example.com" />
        </label>
        <label className={labelClass}>
          Session / package
          <input className={inputClass} name="shoot_type" defaultValue={v(booking?.shoot_type)} placeholder="Full-Day Wedding Coverage" />
        </label>
        <label className={labelClass}>
          Location
          <input className={inputClass} name="location" defaultValue={v(booking?.location)} placeholder="High Park, Toronto" />
        </label>
        <label className={labelClass}>
          Start (Toronto time)
          <input className={inputClass} type="datetime-local" name="start_local" defaultValue={utcToTorontoLocalInput(booking?.start_at ?? null)} />
        </label>
        <label className={labelClass}>
          End (Toronto time) <span className="font-normal text-admin-ink/40">(optional)</span>
          <input className={inputClass} type="datetime-local" name="end_local" defaultValue={utcToTorontoLocalInput(booking?.end_at ?? null)} />
        </label>
        <label className={labelClass}>
          Total fee (CAD)
          <input className={inputClass} name="total" defaultValue={v(booking?.total)} placeholder="1400" />
        </label>
        <label className={labelClass}>
          Deposit (25%)
          <input className={inputClass} name="deposit" defaultValue={v(booking?.deposit)} placeholder="350" />
        </label>
        <label className={labelClass}>
          Balance due
          <input className={inputClass} name="balance" defaultValue={v(booking?.balance)} placeholder="1050" />
        </label>
        <label className={labelClass}>
          Linked gallery <span className="font-normal text-admin-ink/40">(for deposit + gallery link)</span>
          <select className={inputClass} name="gallery_id" defaultValue={v(booking?.gallery_id)}>
            <option value="">No gallery</option>
            {galleries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Linked signing request <span className="font-normal text-admin-ink/40">(contract status)</span>
          <select className={inputClass} name="agreement_request_id" defaultValue={v(booking?.agreement_request_id)}>
            <option value="">None</option>
            {agreementRequests.map((r) => (
              <option key={r.id} value={r.id}>
                {(r.client_name ?? r.gallery_title ?? "Request")} · {formatCompactDate(r.created_at)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Note to client <span className="font-normal text-admin-ink/40">(shown on their booking page)</span>
        <textarea className={`${inputClass} min-h-24 py-2`} name="notes" defaultValue={v(booking?.notes)} placeholder="Looking forward to your shoot!" />
      </label>

      <label className={labelClass}>
        Internal note <span className="font-normal text-admin-ink/40">(admin only)</span>
        <input className={inputClass} name="internal_note" defaultValue={v(booking?.internal_note)} placeholder="Paid deposit May 20" />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface disabled:opacity-50"
        >
          {mode === "create" ? "Create booking" : "Save booking"}
        </button>
        <Link href="/admin/bookings" className="text-sm text-admin-ink/55 hover:text-admin-ink">
          Back to bookings
        </Link>
        {state.message ? (
          <span className={state.status === "error" ? "text-sm text-admin-danger" : "text-sm text-admin-success"}>
            {state.message}
          </span>
        ) : null}
      </div>

      {state.hubUrl ? (
        <div className="rounded-md border border-admin-ink/10 bg-white/60 p-3">
          <p className="font-mono text-xs text-admin-ink/50">{state.hubUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(state.hubUrl!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                } catch {
                  /* clipboard blocked */
                }
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
            >
              {copied ? <Check className="size-3.5 text-admin-success" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy booking link"}
            </button>
            <a
              href={state.hubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
            >
              <ExternalLink className="size-3.5" />
              Open
            </a>
          </div>
        </div>
      ) : null}
    </form>
  );
}
