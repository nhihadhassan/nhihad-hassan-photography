"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, X } from "lucide-react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { AgreementRequest } from "@/lib/agreements";
import {
  createAgreementRequestAction,
  revokeAgreementRequestAction,
  type AgreementActionState,
} from "@/app/admin/(protected)/agreements/actions";
import { formatCompactDate } from "@/lib/utils";

const initialState: AgreementActionState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";

function StatusMessage({ state }: { state: AgreementActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={
        state.status === "success"
          ? "rounded-md bg-admin-success/10 px-3 py-2 text-sm text-admin-success"
          : "rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger"
      }
    >
      {state.message}
    </p>
  );
}

function CopyLink({ value, label = "Copy link" }: { value: string; label?: string }) {
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
          /* clipboard blocked; URL is still visible */
        }
      }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
    >
      {copied ? <Check className="size-3.5 text-admin-success" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function statusFor(request: AgreementRequest): { label: string; className: string } {
  if (request.revoked_at) return { label: "Revoked", className: "bg-admin-danger/10 text-admin-danger" };
  if (request.signed_at) return { label: "Signed", className: "bg-admin-success/10 text-admin-success" };
  if (request.viewed_at) return { label: "Viewed", className: "bg-admin-info/10 text-admin-info" };
  return { label: "Sent", className: "bg-admin-ink/8 text-admin-ink/55" };
}

function CreateForm({ galleries }: { galleries: GalleryRecord[] }) {
  const [state, formAction] = useActionState(createAgreementRequestAction, initialState);
  return (
    <form action={formAction} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">Create signing link</h2>
      <p className="mt-1 text-sm leading-6 text-admin-ink/55">
        Prefill the client and shoot details, then send the link. The client reviews the contract
        and signs online.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Linked gallery
          <select className={inputClass} name="gallery_id">
            <option value="">No gallery</option>
            {galleries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client name
          <input className={inputClass} name="client_name" placeholder="Jane Doe" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client email
          <input className={inputClass} name="client_email" type="email" placeholder="client@example.com" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Shoot type / package
          <input className={inputClass} name="type" placeholder="Full-Day Coverage" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Shoot date(s) and time
          <input className={inputClass} name="date" placeholder="August 15, 2026" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Location(s)
          <input className={inputClass} name="location" placeholder="High Park" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Total fee (CAD)
          <input className={inputClass} name="total" placeholder="1400" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Deposit (25%)
          <input className={inputClass} name="deposit" placeholder="350" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Balance due
          <input className={inputClass} name="balance" placeholder="1050" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Gallery availability window
          <input className={inputClass} name="window" placeholder="60 days from delivery" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Internal note <span className="font-normal text-admin-ink/40">(not shown to client)</span>
          <input className={inputClass} name="message" placeholder="Wedding booking" />
        </label>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-admin-ink/65">
        <input type="checkbox" name="mark_sent" defaultChecked className="size-4 accent-admin-accent" />
        Mark as sent now
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-11 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">
          Create signing link
        </button>
        <StatusMessage state={state} />
      </div>
      {state.signUrl ? (
        <div className="mt-4 rounded-md border border-admin-ink/10 bg-white/60 p-3">
          <p className="font-mono text-xs text-admin-ink/50">{state.signUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyLink value={state.signUrl} />
            <a
              href={state.signUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 transition hover:bg-admin-ink/6"
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

function RequestRow({ request, siteOrigin }: { request: AgreementRequest; siteOrigin: string }) {
  const [pending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(Boolean(request.revoked_at));
  const url = `${siteOrigin}/agreement/${request.token}`;
  const status = revoked ? { label: "Revoked", className: "bg-admin-danger/10 text-admin-danger" } : statusFor(request);

  return (
    <article className="rounded-md border border-admin-ink/10 bg-admin-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{request.client_name ?? request.gallery_title ?? "Signing request"}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-1 text-sm text-admin-ink/55">
            {request.gallery_title ?? "No gallery"} · Created {formatCompactDate(request.created_at)}
          </p>
          <p className="mt-1 font-mono text-xs text-admin-ink/35">{url}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-admin-ink/45">
            <span>Viewed: {request.viewed_at ? formatCompactDate(request.viewed_at) : "No"}</span>
            <span>Signed: {request.signed_at ? formatCompactDate(request.signed_at) : "No"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyLink value={url} />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
          >
            <ExternalLink className="size-3.5" />
            {request.signed_at ? "View signed" : "Open"}
          </a>
          {!revoked && !request.signed_at ? (
            <button
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await revokeAgreementRequestAction(request.id);
                  if (result.ok) setRevoked(true);
                });
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-danger/20 px-3 text-xs font-medium text-admin-danger hover:bg-admin-danger/8 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
              Revoke
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function AgreementAdmin({
  galleries,
  requests,
  siteOrigin,
}: {
  galleries: GalleryRecord[];
  requests: AgreementRequest[];
  siteOrigin: string;
}) {
  return (
    <div className="grid gap-8">
      <CreateForm galleries={galleries} />
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Signing links</h2>
        <div className="mt-4 grid gap-3">
          {requests.length ? (
            requests.map((request) => (
              <RequestRow key={request.id} request={request} siteOrigin={siteOrigin} />
            ))
          ) : (
            <p className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 text-sm text-admin-ink/55">
              No signing links yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
