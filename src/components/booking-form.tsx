"use client";

import { useActionState, useRef, useState } from "react";
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

const SESSION_OPTIONS = [
  "Wedding Coverage (4 to 5 hours)",
  "Wedding Extended (6 to 8 hours)",
  "Wedding Full-Day (8 to 10 hours)",
  "Couples / Engagement",
  "Portrait Session",
  "Event Coverage",
  "Nightlife / Party",
];

const DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "No end time" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "150", label: "2.5 hours" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
  { value: "300", label: "5 hours" },
  { value: "360", label: "6 hours" },
  { value: "420", label: "7 hours" },
  { value: "480", label: "8 hours" },
  { value: "600", label: "10 hours" },
  { value: "720", label: "12 hours" },
];

const TIME_OPTIONS: { value: string; label: string }[] = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let m = 0; m < 24 * 60; m += 15) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const value = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const ampm = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    opts.push({ value, label: `${h12}:${String(min).padStart(2, "0")} ${ampm}` });
  }
  return opts;
})();

function parseAmount(value: string): number | null {
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Round "HH:MM" to the nearest quarter hour so it matches a time option. */
function snapToQuarter(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const snapped = Math.round(m / 15) * 15;
  const carry = snapped === 60;
  const hour = (h + (carry ? 1 : 0)) % 24;
  const min = carry ? 0 : snapped;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function friendlyDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function friendlyTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

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

  // Session / package
  const initialSession = booking?.shoot_type ?? "";
  const sessionIsPreset = SESSION_OPTIONS.includes(initialSession);
  const [session, setSession] = useState(
    initialSession ? (sessionIsPreset ? initialSession : "__custom__") : "",
  );
  const [customSession, setCustomSession] = useState(sessionIsPreset ? "" : initialSession);

  // Start date + time (Toronto)
  const startLocal = utcToTorontoLocalInput(booking?.start_at ?? null); // "YYYY-MM-DDTHH:MM" or ""
  const [startDate, setStartDate] = useState(startLocal ? startLocal.slice(0, 10) : "");
  const [startTime, setStartTime] = useState(
    startLocal ? snapToQuarter(startLocal.slice(11, 16)) : "",
  );

  // Duration (minutes)
  const initialDuration = (() => {
    if (mode === "create") return "120";
    if (booking?.start_at && booking?.end_at) {
      return String(
        Math.round((new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / 60000),
      );
    }
    return "";
  })();
  const [duration, setDuration] = useState(initialDuration);
  const durationOptions = DURATION_OPTIONS.some((o) => o.value === duration)
    ? DURATION_OPTIONS
    : [...DURATION_OPTIONS, { value: duration, label: `${duration} minutes` }];

  // Money: deposit and balance auto-fill from total but stay editable.
  const [total, setTotal] = useState(booking?.total ?? "");
  const [deposit, setDeposit] = useState(booking?.deposit ?? "");
  const [balance, setBalance] = useState(booking?.balance ?? "");
  const depositTouched = useRef(Boolean(booking?.deposit));
  const balanceTouched = useRef(Boolean(booking?.balance));

  const onTotalChange = (value: string) => {
    setTotal(value);
    const t = parseAmount(value);
    if (t === null) return;
    let d = parseAmount(deposit) ?? 0;
    if (!depositTouched.current) {
      d = Math.round(t * 0.25);
      setDeposit(String(d));
    }
    if (!balanceTouched.current) setBalance(String(Math.max(0, t - d)));
  };

  const onDepositChange = (value: string) => {
    setDeposit(value);
    depositTouched.current = true;
    if (!balanceTouched.current) {
      const t = parseAmount(total);
      const d = parseAmount(value);
      if (t !== null && d !== null) setBalance(String(Math.max(0, t - d)));
    }
  };

  const v = <T,>(value: T | null | undefined, fallback = "") =>
    value === null || value === undefined ? fallback : String(value);

  const shootTypeValue = session === "__custom__" ? customSession : session;
  const startLocalValue = startDate && startTime ? `${startDate}T${startTime}` : "";

  const startPreview =
    startDate && startTime ? `${friendlyDate(startDate)} at ${friendlyTime(startTime)}` : null;
  const endPreview =
    startPreview && duration
      ? friendlyTime(addMinutesToTime(startTime, Number(duration)))
      : null;

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && booking ? <input type="hidden" name="id" value={booking.id} /> : null}
      <input type="hidden" name="shoot_type" value={shootTypeValue} />
      <input type="hidden" name="start_local" value={startLocalValue} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Client name
          <input className={inputClass} name="client_name" defaultValue={v(booking?.client_name)} placeholder="Jane Doe" />
        </label>
        <label className={labelClass}>
          Client email
          <input className={inputClass} type="email" name="client_email" defaultValue={v(booking?.client_email)} placeholder="client@example.com" />
        </label>

        {/* Session / package */}
        <div className={labelClass}>
          <span>Session / package</span>
          <select className={inputClass} value={session} onChange={(e) => setSession(e.target.value)}>
            <option value="">Choose a session</option>
            {SESSION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="__custom__">Add another...</option>
          </select>
          {session === "__custom__" ? (
            <input
              className={`${inputClass} mt-2`}
              value={customSession}
              onChange={(e) => setCustomSession(e.target.value)}
              placeholder="Type the session or package name"
            />
          ) : null}
        </div>

        <label className={labelClass}>
          Location
          <input className={inputClass} name="location" defaultValue={v(booking?.location)} placeholder="High Park, Toronto" />
        </label>

        {/* Start date + time */}
        <div className={labelClass}>
          <span>Start (Toronto time)</span>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              className={inputClass}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <select
              className={inputClass}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              <option value="">Time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration */}
        <label className={labelClass}>
          Duration <span className="font-normal text-admin-ink/40">(sets the end time)</span>
          <select className={inputClass} value={duration} onChange={(e) => setDuration(e.target.value)}>
            {durationOptions.map((d) => (
              <option key={d.value || "none"} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {startPreview ? (
        <p className="-mt-2 text-sm text-admin-ink/60">
          {startPreview}
          {endPreview ? <span className="text-admin-ink/45"> to {endPreview}</span> : null}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Total fee (CAD)
          <input className={inputClass} name="total" inputMode="decimal" value={total} onChange={(e) => onTotalChange(e.target.value)} placeholder="1400" />
        </label>
        <label className={labelClass}>
          Deposit (25%)
          <input className={inputClass} name="deposit" inputMode="decimal" value={deposit} onChange={(e) => onDepositChange(e.target.value)} placeholder="350" />
        </label>
        <label className={labelClass}>
          Balance due
          <input
            className={inputClass}
            name="balance"
            inputMode="decimal"
            value={balance}
            onChange={(e) => {
              setBalance(e.target.value);
              balanceTouched.current = true;
            }}
            placeholder="1050"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
