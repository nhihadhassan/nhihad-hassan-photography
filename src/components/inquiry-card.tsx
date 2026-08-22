"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  type InquiryStatus,
} from "@/lib/inquiry-lifecycle";
import { convertInquiryAction, updateInquiryStatusAction } from "@/app/admin/(protected)/inquiries/actions";

export type InquiryCardData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string | null;
  packageName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  location: string | null;
  budget: string | null;
  referralSource: string | null;
  message: string;
  createdLabel: string;
  status: InquiryStatus;
  bookingId: string | null;
};

const TONE: Record<InquiryStatus, string> = {
  new: "bg-admin-status-info-tint text-admin-status-info",
  contacted: "bg-admin-status-waiting-tint text-admin-status-waiting",
  considering: "bg-admin-status-waiting-tint text-admin-status-waiting",
  converted: "bg-admin-status-positive-tint text-admin-status-positive",
  lost: "bg-admin-status-neutral-tint text-admin-status-neutral",
};

export function InquiryCard({ inquiry }: { inquiry: InquiryCardData }) {
  const [status, setStatus] = useState(inquiry.status);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function changeStatus(next: InquiryStatus) {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await updateInquiryStatusAction(inquiry.id, next);
      if (!result.ok) {
        setStatus(previous);
        toast({ message: result.message, tone: "danger" });
      }
    });
  }

  function convert() {
    startTransition(async () => {
      const result = await convertInquiryAction(inquiry.id);
      toast({ message: result.message, tone: result.ok ? "positive" : "danger" });
      if (result.ok && result.bookingId) {
        router.push(`/admin/bookings/${result.bookingId}`);
      }
    });
  }

  return (
    <article className="rounded-xl border border-admin-line bg-admin-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="admin-display text-xl text-admin-ink">{inquiry.name}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[status]}`}>
              {INQUIRY_STATUS_LABELS[status]}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-admin-muted">
            <a href={`mailto:${inquiry.email}`} className="inline-flex items-center gap-1.5 hover:text-admin-accent">
              <Mail className="size-3.5" aria-hidden="true" />
              {inquiry.email}
            </a>
            {inquiry.phone ? (
              <a href={`tel:${inquiry.phone}`} className="inline-flex items-center gap-1.5 hover:text-admin-accent">
                <Phone className="size-3.5" aria-hidden="true" />
                {inquiry.phone}
              </a>
            ) : null}
          </p>
        </div>
        <p className="shrink-0 text-sm text-admin-muted">{inquiry.createdLabel}</p>
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Event type" value={inquiry.eventType} />
        <Field label="Package" value={inquiry.packageName} />
        <Field
          label="Requested date"
          value={
            inquiry.eventDate
              ? `${inquiry.eventDate}${inquiry.eventTime ? ` at ${inquiry.eventTime}` : ""}`
              : null
          }
        />
        <Field label="Location" value={inquiry.location} />
        <Field label="Budget" value={inquiry.budget} />
        <Field label="Referral" value={inquiry.referralSource} />
      </dl>

      {inquiry.message ? (
        <p className="mt-5 whitespace-pre-wrap rounded-lg bg-admin-bg p-4 text-sm leading-6 text-admin-ink/75">
          {inquiry.message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-admin-line pt-4">
        <label className="text-xs uppercase tracking-wide text-admin-muted" htmlFor={`status-${inquiry.id}`}>
          Status
        </label>
        <select
          id={`status-${inquiry.id}`}
          value={status}
          disabled={pending}
          onChange={(event) => changeStatus(event.target.value as InquiryStatus)}
          className="min-h-9 rounded-lg border border-admin-line-strong bg-admin-surface px-2.5 text-sm text-admin-ink disabled:opacity-60"
        >
          {INQUIRY_STATUSES.map((value) => (
            <option key={value} value={value}>
              {INQUIRY_STATUS_LABELS[value]}
            </option>
          ))}
        </select>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <a
            href={`mailto:${inquiry.email}`}
            className="inline-flex min-h-9 items-center rounded-lg border border-admin-line-strong px-3 text-sm font-medium text-admin-ink hover:bg-admin-raise"
          >
            Reply
          </a>
          {inquiry.bookingId ? (
            <Link
              href={`/admin/bookings/${inquiry.bookingId}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-admin-ink px-3 text-sm font-medium text-admin-surface hover:bg-admin-ink/88"
            >
              Open booking
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={convert}
              disabled={pending}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-admin-ink px-3 text-sm font-medium text-admin-surface hover:bg-admin-ink/88 disabled:opacity-60"
            >
              {pending ? "Working…" : "Convert to booking"}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-admin-muted">{label}</dt>
      <dd className={value ? "mt-1 text-admin-ink" : "mt-1 text-admin-muted"}>
        {value ?? "Not provided"}
      </dd>
    </div>
  );
}
