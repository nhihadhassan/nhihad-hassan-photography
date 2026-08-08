"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, ExternalLink, Eye, Loader2, Mail, Plus, Search, Settings2, Sparkles, X } from "lucide-react";
import type { AgreementRequest } from "@/lib/agreements";
import { isAgreementPastExpiry } from "@/lib/agreement-status";
import type { ClientSummary } from "@/lib/clients";
import type { PricingCategory } from "@/data/pricing";
import { isWeddingAgreementType } from "@/data/wedding-agreement";
import {
  createDraftAgreementAction,
  revokeAgreementRequestAction,
  sendAgreementRequestEmailAction,
  updateAgreementAutomationAction,
  updateAgreementClientAddressAction,
} from "@/app/admin/(protected)/agreements/actions";
import { formatCompactDate } from "@/lib/utils";
import { utcToTorontoLocalInput } from "@/lib/ics";

/** The subset of a contract_templates row the create-agreement flow needs. */
export type TemplateOption = {
  id: string;
  slug: string;
  name: string;
  description: string;
  supportsSecondSigner: boolean;
};

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";

function exactPrice(price: string): string {
  if (/[–-]/.test(price)) return "";
  const amount = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? String(amount) : "";
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
  if (request.signed_at) return { label: "Signed", className: "bg-admin-success/10 text-admin-success" };
  if (request.revoked_at) return { label: "Revoked", className: "bg-admin-danger/10 text-admin-danger" };
  if (isAgreementPastExpiry(request)) return { label: "Expired", className: "bg-admin-danger/10 text-admin-danger" };
  if (request.viewed_at) return { label: "Viewed", className: "bg-admin-info/10 text-admin-info" };
  if (request.sent_at) return { label: "Sent", className: "bg-admin-ink/8 text-admin-ink/65" };
  return { label: "Draft", className: "bg-admin-ink/8 text-admin-ink/65" };
}

function deliveryLabel(request: AgreementRequest): string {
  const delivery = request.latest_delivery;
  if (!delivery) return "Email not sent";
  if (delivery.status === "delivered") return "Email delivered";
  if (delivery.status === "opened") return "Email opened";
  if (delivery.status === "clicked") return "Email link opened";
  if (["failed", "bounced", "suppressed", "complained"].includes(delivery.status)) {
    return "Email failed";
  }
  if (delivery.status === "delivery_delayed") return "Email delayed";
  return "Email sent";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ClientPicker({
  clients,
  selectedKey,
  currentName,
  currentEmail,
  onSelect,
  onCreate,
}: {
  clients: ClientSummary[];
  selectedKey: string;
  currentName: string;
  currentEmail: string;
  onSelect: (key: string) => void;
  onCreate: (name: string, email: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = clients.find((client) => client.key === selectedKey);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) =>
      `${client.name} ${client.email ?? ""}`.toLowerCase().includes(term),
    );
  }, [clients, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="grid gap-1.5 sm:col-span-2">
      <span className="text-sm font-medium">Saved client</span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="saved-client-picker"
        onClick={() => setOpen((value) => !value)}
        className={`${inputClass} flex w-full items-center justify-between gap-3 text-left hover:border-admin-ink/25`}
      >
        <span className={selected || currentName ? "min-w-0" : "text-admin-ink/60"}>
          {selected || currentName ? (
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-admin-accent/12 text-[10px] font-semibold text-admin-accent">
                {initials(selected?.name ?? currentName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{selected?.name ?? currentName}</span>
                <span className="block truncate text-xs text-admin-ink/55">
                  {(selected?.email ?? currentEmail) || "New client"}
                </span>
              </span>
            </span>
          ) : (
            "Choose an onboarded client"
          )}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-admin-ink/45 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open ? (
        <div id="saved-client-picker" className="rounded-md border border-admin-ink/12 bg-white/80 p-3 shadow-[0_12px_30px_rgba(43,35,28,0.08)]">
          {creating ? (
            <div className="rounded-md bg-admin-ink/[0.025] p-3 sm:p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">New client</p>
                  <p className="mt-0.5 text-xs text-admin-ink/50">They will be saved when you create this contract.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-admin-ink/45 transition hover:bg-admin-ink/6 hover:text-admin-ink"
                  aria-label="Cancel new client"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-admin-ink/65">
                  Client name
                  <input
                    autoFocus
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    className={`${inputClass} w-full`}
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-admin-ink/65">
                  Email address
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className={`${inputClass} w-full`}
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!newName.trim()}
                  onClick={() => {
                    onCreate(newName.trim(), newEmail.trim());
                    setCreating(false);
                    setOpen(false);
                    setNewName("");
                    setNewEmail("");
                  }}
                  className="min-h-9 rounded-md bg-admin-ink px-4 text-xs font-semibold text-admin-surface transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Use this client
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-admin-ink/40" aria-hidden="true" />
                  <span className="sr-only">Search onboarded clients</span>
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name or email"
                    className={`${inputClass} w-full pl-9`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-admin-accent/25 bg-admin-accent/8 px-3 text-xs font-semibold text-admin-accent transition hover:bg-admin-accent/12 active:translate-y-px"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Create new client
                </button>
              </div>
              <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2" role="listbox" aria-label="Onboarded clients">
            {matches.map((client) => {
              const isSelected = client.key === selectedKey;
              return (
                <button
                  key={client.key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(client.key);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex min-h-16 items-center gap-3 rounded-md border px-3 py-2.5 text-left transition active:translate-y-px ${
                    isSelected
                      ? "border-admin-accent/35 bg-admin-accent/8"
                      : "border-admin-ink/10 bg-admin-surface hover:border-admin-ink/20 hover:bg-admin-ink/[0.025]"
                  }`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-admin-ink/7 text-xs font-semibold text-admin-ink/65">
                    {initials(client.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-admin-ink">{client.name}</span>
                    <span className="block truncate text-xs text-admin-ink/50">{client.email ?? "No email saved"}</span>
                  </span>
                  {isSelected ? <Check className="size-4 shrink-0 text-admin-accent" aria-hidden="true" /> : null}
                </button>
              );
            })}
              </div>
              {!matches.length ? (
                <p className="px-2 py-6 text-center text-sm text-admin-ink/55">No onboarded clients match that search.</p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      <span className="text-xs font-normal text-admin-ink/55">Only clients with a booking, gallery, or contract appear here.</span>
    </div>
  );
}

function localDateTimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultExpiryValue(): string {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  date.setHours(23, 59, 0, 0);
  return localDateTimeValue(date);
}

/**
 * The small first step of creating an agreement: pick or enter a client,
 * pick a contract template, and optionally a starting package. Everything
 * else -- dates, pricing detail, policy text -- is filled in directly on the
 * rendered contract in the document-first builder this routes into.
 */
function NewAgreementStarter({
  clients,
  templates,
  pricing,
}: {
  clients: ClientSummary[];
  templates: TemplateOption[];
  pricing: PricingCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [templateId, setTemplateId] = useState<string>(templates[0]?.slug ?? "photography");
  const [packageValue, setPackageValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const selectedTemplate = templates.find((t) => t.slug === templateId);

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

  const choosePackage = (value: string) => {
    setPackageValue(value);
    if (isWeddingAgreementType(value)) {
      const wedding = templates.find((t) => t.slug === "wedding" || isWeddingAgreementType(t.name));
      if (wedding) setTemplateId(wedding.slug);
    }
  };

  const packageMatch = pricing
    .flatMap((category) => category.tiers.map((tier) => ({ value: `${category.label} · ${tier.name}`, tier })))
    .find((candidate) => candidate.value === packageValue);

  const create = () => {
    if (!clientName.trim()) {
      setError("Enter a client name.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createDraftAgreementAction({
        clientName,
        clientEmail: clientEmail || null,
        template: templateId,
        type: packageValue || null,
        total: packageMatch ? exactPrice(packageMatch.tier.price) : null,
      });
      if (result.ok && result.id) {
        router.push(`/admin/agreements/${result.id}/edit`);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-admin-accent/10 text-admin-accent">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">New agreement</h2>
          <p className="mt-1 text-sm leading-6 text-admin-ink/65">
            Choose a client and a contract template, then fill in the rest directly on the contract.
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
        <label className="grid gap-1.5 text-sm font-medium">
          Contract template
          <select className={inputClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            {templates.map((template) => (
              <option key={template.id} value={template.slug}>
                {template.name}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-admin-ink/55">
            {selectedTemplate?.description}{" "}
            <Link href="/admin/templates" className="text-admin-accent hover:underline">
              Edit templates
            </Link>
          </span>
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Starting package <span className="font-normal text-admin-ink/55">(optional)</span>
          <select className={inputClass} value={packageValue} onChange={(event) => choosePackage(event.target.value)}>
            <option value="">Choose later, in the contract</option>
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
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={create}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Create agreement
        </button>
        {error ? <p className="rounded-md bg-admin-danger/10 px-3 py-2 text-sm text-admin-danger">{error}</p> : null}
      </div>
    </div>
  );
}


function RequestRow({ request, siteOrigin }: { request: AgreementRequest; siteOrigin: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(Boolean(request.revoked_at));
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rowExpiryEnabled, setRowExpiryEnabled] = useState(Boolean(request.expires_at));
  const [rowExpiryAt, setRowExpiryAt] = useState(utcToTorontoLocalInput(request.expires_at));
  const [rowRemindersEnabled, setRowRemindersEnabled] = useState(request.reminders_enabled);
  const [rowInterval, setRowInterval] = useState(request.reminder_interval_days);
  const [rowMaxSends, setRowMaxSends] = useState(request.reminder_max_sends);
  const [rowClientAddress, setRowClientAddress] = useState(request.details.clientAddress ?? "");
  const url = `${siteOrigin}/agreement/${request.token}`;
  const expired = isAgreementPastExpiry(request);
  const active = !revoked && !expired && !request.signed_at;
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
            <span>{deliveryLabel(request)}</span>
            <span>Viewed: {request.viewed_at ? formatCompactDate(request.viewed_at) : "No"}</span>
            <span>Signed: {request.signed_at ? formatCompactDate(request.signed_at) : "No"}</span>
            {request.client_submitted_at ? (
              <span>Client signed: {formatCompactDate(request.client_submitted_at)}</span>
            ) : null}
            {request.expires_at ? (
              <span>Expires: {formatCompactDate(request.expires_at)}</span>
            ) : null}
            {request.reminders_enabled ? (
              <span>Reminders: {request.reminder_count}/{request.reminder_max_sends}</span>
            ) : null}
          </div>
          {request.latest_delivery?.failure_reason ? (
            <p className="mt-2 text-xs text-admin-danger">{request.latest_delivery.failure_reason}</p>
          ) : null}
          {request.last_reminder_error ? (
            <p className="mt-2 text-xs text-admin-danger">
              Last reminder failed: {request.last_reminder_error}
            </p>
          ) : null}
          {feedback ? (
            <p className={`mt-2 text-xs ${feedback.ok ? "text-admin-success" : "text-admin-danger"}`}>
              {feedback.message}
            </p>
          ) : null}
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
          {active ? (
            <button
              type="button"
              onClick={() => setSettingsOpen((value) => !value)}
              aria-expanded={settingsOpen}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6"
            >
              <Settings2 className="size-3.5" aria-hidden="true" />
              Edit & automation
            </button>
          ) : null}
          {active ? (
            <Link
              href={`/admin/agreements/${request.id}/preview`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-accent/25 px-3 text-xs font-medium text-admin-accent hover:bg-admin-accent/8"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              {request.latest_delivery ? "Preview & resend" : "Preview & send"}
            </Link>
          ) : null}
          {active ? (
            <button
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  setFeedback(null);
                  const result = await sendAgreementRequestEmailAction(request.id);
                  setFeedback(result);
                  if (result.ok) router.refresh();
                });
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-ink/12 px-3 text-xs font-medium text-admin-ink/70 hover:bg-admin-ink/6 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
              {request.latest_delivery ? "Resend now" : "Send now"}
            </button>
          ) : null}
          {active ? (
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
      {settingsOpen && active ? (
        <div className="mt-4 border-t border-admin-ink/10 pt-4">
          <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-admin-ink">
              Client mailing address
              <input
                value={rowClientAddress}
                onChange={(event) => setRowClientAddress(event.target.value)}
                placeholder="Street, city, province, postal code"
                className={`${inputClass} w-full`}
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  setFeedback(null);
                  const result = await updateAgreementClientAddressAction(request.id, rowClientAddress);
                  setFeedback(result);
                  if (result.ok) router.refresh();
                });
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-ink px-4 text-xs font-semibold text-admin-surface disabled:opacity-40"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
              Save address
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-admin-ink">
                <input
                  type="checkbox"
                  checked={rowExpiryEnabled}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setRowExpiryEnabled(enabled);
                    if (enabled && !rowExpiryAt) setRowExpiryAt(defaultExpiryValue());
                  }}
                  className="size-4 accent-admin-accent"
                />
                Auto-expire unsigned contract
              </label>
              {rowExpiryEnabled ? (
                <input
                  type="datetime-local"
                  value={rowExpiryAt}
                  onChange={(event) => setRowExpiryAt(event.target.value)}
                  className={`${inputClass} mt-2 w-full`}
                />
              ) : null}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-admin-ink">
                <input
                  type="checkbox"
                  checked={rowRemindersEnabled}
                  onChange={(event) => setRowRemindersEnabled(event.target.checked)}
                  className="size-4 accent-admin-accent"
                />
                Send signature reminders
              </label>
              {rowRemindersEnabled ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select
                    value={rowInterval}
                    onChange={(event) => setRowInterval(Number(event.target.value))}
                    aria-label="Reminder interval"
                    className={`${inputClass} w-full`}
                  >
                    {[2, 3, 5, 7].map((days) => (
                      <option key={days} value={days}>Every {days} days</option>
                    ))}
                  </select>
                  <select
                    value={rowMaxSends}
                    onChange={(event) => setRowMaxSends(Number(event.target.value))}
                    aria-label="Maximum reminder emails"
                    className={`${inputClass} w-full`}
                  >
                    {[1, 2, 3, 5].map((count) => (
                      <option key={count} value={count}>Up to {count}</option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending || (rowExpiryEnabled && !rowExpiryAt)}
              onClick={() => {
                startTransition(async () => {
                  setFeedback(null);
                  const result = await updateAgreementAutomationAction(request.id, {
                    expiresAt: rowExpiryEnabled ? rowExpiryAt : null,
                    remindersEnabled: rowRemindersEnabled,
                    reminderIntervalDays: rowInterval,
                    reminderMaxSends: rowMaxSends,
                  });
                  setFeedback(result);
                  if (result.ok) {
                    setSettingsOpen(false);
                    router.refresh();
                  }
                });
              }}
              className="inline-flex min-h-9 items-center gap-2 rounded-md bg-admin-ink px-3 text-xs font-semibold text-admin-surface disabled:opacity-40"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
              Save automation
            </button>
            {request.last_reminder_at ? (
              <span className="text-xs text-admin-ink/50">
                Last reminder {formatCompactDate(request.last_reminder_at)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function AgreementAdmin({
  requests,
  clients,
  pricing,
  siteOrigin,
  templates,
}: {
  requests: AgreementRequest[];
  clients: ClientSummary[];
  pricing: PricingCategory[];
  siteOrigin: string;
  templates: TemplateOption[];
}) {
  return (
    <div className="grid gap-8">
      <NewAgreementStarter clients={clients} templates={templates} pricing={pricing} />
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
