"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { AgreementRequest } from "@/lib/agreements";
import type { ClientSummary } from "@/lib/clients";
import type { PricingCategory } from "@/data/pricing";
import {
  createAgreementRequestAction,
  revokeAgreementRequestAction,
  type AgreementActionState,
} from "@/app/admin/(protected)/agreements/actions";
import { formatCompactDate, formatDisplayDate } from "@/lib/utils";

const initialState: AgreementActionState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";

function exactPrice(price: string): string {
  if (/[–-]/.test(price)) return "";
  const amount = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? String(amount) : "";
}

function moneyPart(value: string, multiplier: number): string {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return String(Math.round(amount * multiplier * 100) / 100);
}

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
  return { label: "Sent", className: "bg-admin-ink/8 text-admin-ink/65" };
}

function CreateForm({
  galleries,
  clients,
  pricing,
}: {
  galleries: GalleryRecord[];
  clients: ClientSummary[];
  pricing: PricingCategory[];
}) {
  const [state, formAction] = useActionState(createAgreementRequestAction, initialState);
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [shootType, setShootType] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [location, setLocation] = useState("");
  const [total, setTotal] = useState("");

  const recentClients = useMemo(
    () => clients.filter((client) => client.email).slice(0, 4),
    [clients],
  );
  const deposit = moneyPart(total, 0.25);
  const balance = moneyPart(total, 0.75);

  const chooseClient = (key: string) => {
    const client = clients.find((candidate) => candidate.key === key);
    if (!client) return;
    setSelectedClientKey(key);
    setClientName(client.name);
    setClientEmail(client.email ?? "");
  };

  const chooseGallery = (id: string) => {
    const gallery = galleries.find((candidate) => candidate.id === id);
    if (!gallery) return;
    if (gallery.client_name) setClientName(gallery.client_name);
    if (gallery.client_email) setClientEmail(gallery.client_email);
    if (gallery.event_date) setShootDate(formatDisplayDate(gallery.event_date));
    if (gallery.location) setLocation(gallery.location);
  };

  const choosePackage = (value: string) => {
    setShootType(value);
    const match = pricing.flatMap((category) =>
      category.tiers.map((tier) => ({ value: `${category.label} · ${tier.name}`, tier })),
    ).find((candidate) => candidate.value === value);
    setTotal(match ? exactPrice(match.tier.price) : "");
  };

  return (
    <form action={formAction} className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-admin-accent/10 text-admin-accent">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">Create signing link</h2>
          <p className="mt-1 text-sm leading-6 text-admin-ink/65">
            Start with a client or package. Known details and totals fill themselves in.
          </p>
        </div>
      </div>
      {recentClients.length ? (
        <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Recent clients">
          <span className="mr-1 text-xs font-medium text-admin-ink/55">Recent</span>
          {recentClients.map((client) => (
            <button
              key={client.key}
              type="button"
              onClick={() => chooseClient(client.key)}
              className="min-h-9 rounded-full border border-admin-ink/12 bg-white/55 px-3 text-xs font-medium text-admin-ink/75 transition hover:border-admin-accent/35 hover:bg-admin-accent/8 active:translate-y-px"
            >
              {client.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Saved client
          <select
            className={inputClass}
            value={selectedClientKey}
            onChange={(event) => chooseClient(event.target.value)}
          >
            <option value="">Search or choose a client</option>
            {clients.map((client) => (
              <option key={client.key} value={client.key}>
                {client.name}{client.email ? ` · ${client.email}` : ""}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-admin-ink/55">Choosing a client fills their saved email. You can still edit either field.</span>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Linked gallery
          <select className={inputClass} name="gallery_id" onChange={(event) => chooseGallery(event.target.value)}>
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
          <input className={inputClass} name="client_name" value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Start typing a name" autoComplete="name" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client email
          <input className={inputClass} name="client_email" type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Shoot type / package
          <select className={inputClass} name="type" value={shootType} onChange={(event) => choosePackage(event.target.value)}>
            <option value="">Choose a package</option>
            {pricing.map((category) => (
              <optgroup key={category.id} label={category.label}>
                {category.tiers.map((tier) => (
                  <option key={`${category.id}-${tier.name}`} value={`${category.label} · ${tier.name}`}>
                    {tier.name} · {tier.price} · {tier.duration}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value="Custom photography coverage">Custom photography coverage</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Shoot date(s) and time
          <input className={inputClass} name="date" value={shootDate} onChange={(event) => setShootDate(event.target.value)} placeholder="Month DD, YYYY at 0:00 PM" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Location(s)
          <input className={inputClass} name="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Venue, city" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Total fee (CAD)
          <input className={inputClass} name="total" value={total} onChange={(event) => setTotal(event.target.value)} placeholder="$0" inputMode="decimal" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Deposit (25%)
          <input className={`${inputClass} bg-admin-ink/[0.035]`} name="deposit" value={deposit} placeholder="Calculated automatically" readOnly />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Balance due
          <input className={`${inputClass} bg-admin-ink/[0.035]`} name="balance" value={balance} placeholder="Calculated automatically" readOnly />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Gallery availability window
          <select className={inputClass} name="window" defaultValue="">
            <option value="">Choose a window</option>
            <option value="30 days from delivery">30 days from delivery</option>
            <option value="60 days from delivery">60 days from delivery</option>
            <option value="90 days from delivery">90 days from delivery</option>
            <option value="No expiry">No expiry</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Internal note <span className="font-normal text-admin-ink/65">(not shown to client)</span>
          <input className={inputClass} name="message" placeholder="Add a private reminder or context" />
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
          <p className="font-mono text-xs text-admin-ink/65">{state.signUrl}</p>
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
          <p className="mt-1 text-sm text-admin-ink/65">
            {request.gallery_title ?? "No gallery"} · Created {formatCompactDate(request.created_at)}
          </p>
          <p className="mt-1 font-mono text-xs text-admin-ink/35">{url}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-admin-ink/65">
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
  clients,
  pricing,
  siteOrigin,
}: {
  galleries: GalleryRecord[];
  requests: AgreementRequest[];
  clients: ClientSummary[];
  pricing: PricingCategory[];
  siteOrigin: string;
}) {
  return (
    <div className="grid gap-8">
      <CreateForm galleries={galleries} clients={clients} pricing={pricing} />
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Signing links</h2>
        <div className="mt-4 grid gap-3">
          {requests.length ? (
            requests.map((request) => (
              <RequestRow key={request.id} request={request} siteOrigin={siteOrigin} />
            ))
          ) : (
            <p className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 text-sm text-admin-ink/65">
              No signing links yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
