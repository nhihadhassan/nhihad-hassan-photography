"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Loader2, X } from "lucide-react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { Questionnaire } from "@/lib/questionnaires";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/questionnaire-questions";
import {
  createQuestionnaireAction,
  revokeQuestionnaireAction,
  type QuestionnaireActionState,
} from "@/app/admin/(protected)/questionnaires/actions";
import { formatCompactDate } from "@/lib/utils";

const initial: QuestionnaireActionState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";

type BookingOption = { id: string; label: string };

function CopyLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
    >
      {copied ? <Check className="size-3.5 text-admin-success" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function CreateForm({ bookings }: { bookings: BookingOption[] }) {
  const [state, action] = useActionState(createQuestionnaireAction, initial);
  return (
    <form action={action} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">Create a questionnaire link</h2>
      <p className="mt-1 text-sm leading-6 text-admin-ink/55">Send a client the link before their shoot. They can fill it in over time.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Client name
          <input className={inputClass} name="client_name" placeholder="Jane Doe" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client email <span className="font-normal text-admin-ink/40">(optional)</span>
          <input className={inputClass} type="email" name="client_email" placeholder="client@example.com" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Linked booking <span className="font-normal text-admin-ink/40">(optional)</span>
          <select className={inputClass} name="booking_id" defaultValue="">
            <option value="">No booking</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-admin-ink/65">
        <input type="checkbox" name="mark_sent" defaultChecked className="size-4 accent-admin-accent" />
        Mark as sent now
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-11 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">Create link</button>
        {state.message ? (
          <span className={state.status === "error" ? "text-sm text-admin-danger" : "text-sm text-admin-success"}>{state.message}</span>
        ) : null}
      </div>
      {state.url ? (
        <div className="mt-4 rounded-md border border-admin-ink/10 bg-white/60 p-3">
          <p className="font-mono text-xs text-admin-ink/50">{state.url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyLink value={state.url} />
            <a href={state.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6">
              <ExternalLink className="size-3.5" />
              Open
            </a>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function statusOf(q: Questionnaire): { label: string; cls: string } {
  if (q.revoked_at) return { label: "Revoked", cls: "bg-admin-danger/10 text-admin-danger" };
  if (q.submitted_at) return { label: "Submitted", cls: "bg-admin-success/10 text-admin-success" };
  if (q.viewed_at) return { label: "Viewed", cls: "bg-admin-info/10 text-admin-info" };
  return { label: "Sent", cls: "bg-admin-ink/8 text-admin-ink/55" };
}

function Row({ q, siteOrigin }: { q: Questionnaire; siteOrigin: string }) {
  const [pending, start] = useTransition();
  const [revoked, setRevoked] = useState(Boolean(q.revoked_at));
  const [open, setOpen] = useState(false);
  const url = `${siteOrigin}/questionnaire/${q.token}`;
  const status = revoked ? { label: "Revoked", cls: "bg-admin-danger/10 text-admin-danger" } : statusOf(q);
  const hasAnswers = Object.keys(q.responses).length > 0;

  return (
    <article className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{q.client_name ?? q.gallery_title ?? "Questionnaire"}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs ${status.cls}`}>{status.label}</span>
          </div>
          <p className="mt-1 text-sm text-admin-ink/55">Created {formatCompactDate(q.created_at)}{q.submitted_at ? ` · Submitted ${formatCompactDate(q.submitted_at)}` : ""}</p>
          <p className="mt-1 font-mono text-xs text-admin-ink/35">{url}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasAnswers ? (
            <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6">
              <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
              Responses
            </button>
          ) : null}
          <CopyLink value={url} />
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6">
            <ExternalLink className="size-3.5" />
            Open
          </a>
          {!revoked ? (
            <button
              disabled={pending}
              onClick={() => start(async () => { const r = await revokeQuestionnaireAction(q.id); if (r.ok) setRevoked(true); })}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-danger/20 px-3 text-xs font-medium text-admin-danger hover:bg-admin-danger/8 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              Revoke
            </button>
          ) : null}
        </div>
      </div>

      {open && hasAnswers ? (
        <dl className="mt-4 space-y-3 border-t border-admin-ink/10 pt-4">
          {QUESTIONNAIRE_QUESTIONS.map((question) => (
            <div key={question.id}>
              <dt className="text-xs font-medium uppercase tracking-wide text-admin-ink/45">{question.label}</dt>
              <dd className="mt-0.5 whitespace-pre-line text-sm text-admin-ink/80">{q.responses[question.id] || <span className="text-admin-ink/35">Not answered</span>}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

export function QuestionnaireAdmin({
  questionnaires,
  bookings,
  siteOrigin,
}: {
  questionnaires: Questionnaire[];
  bookings: BookingOption[];
  siteOrigin: string;
}) {
  return (
    <div className="grid gap-8">
      <CreateForm bookings={bookings} />
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Questionnaires</h2>
        <div className="mt-4 grid gap-3">
          {questionnaires.length ? (
            questionnaires.map((q) => <Row key={q.id} q={q} siteOrigin={siteOrigin} />)
          ) : (
            <p className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 text-sm text-admin-ink/55">No questionnaires yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
