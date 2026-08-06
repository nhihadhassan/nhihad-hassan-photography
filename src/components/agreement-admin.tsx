"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Copy, ExternalLink, Loader2, Mail, Plus, Search, Settings2, ShieldCheck, Sparkles, X } from "lucide-react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { AgreementRequest } from "@/lib/agreements";
import { isAgreementPastExpiry } from "@/lib/agreement-status";
import type { ClientSummary } from "@/lib/clients";
import type { PricingCategory } from "@/data/pricing";
import {
  agreementTemplates,
  isWeddingAgreementType,
  type AgreementTemplateId,
} from "@/data/wedding-agreement";
import {
  createAgreementRequestAction,
  revokeAgreementRequestAction,
  sendAgreementRequestEmailAction,
  updateAgreementAutomationAction,
  updateAgreementClientAddressAction,
  type AgreementActionState,
} from "@/app/admin/(protected)/agreements/actions";
import { formatCompactDate } from "@/lib/utils";
import { utcToTorontoLocalInput } from "@/lib/ics";

const initialState: AgreementActionState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";

function exactPrice(price: string): string {
  if (/[–-]/.test(price)) return "";
  const amount = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? String(amount) : "";
}

function todayInToronto(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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

const timeOptions = Array.from({ length: 33 }, (_, index) => {
  const totalMinutes = 7 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
  return { value, label };
});

function dateKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function displayDate(value: string): string {
  if (!value) return "Choose date";
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function displayTime(value: string): string {
  if (!value) return "Choose time";
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
}

function contractDateTime(date: string, time: string): string {
  if (!date) return "";
  const longDate = new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
  return time ? `${longDate} at ${displayTime(time)}` : longDate;
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

function ShootSchedulePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = date ? new Date(`${date}T12:00:00`) : new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const today = new Date();
  const todayKey = dateKey(today);
  const selected = date ? new Date(`${date}T12:00:00`) : null;
  const monthLabel = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(visibleMonth);
  const firstWeekday = visibleMonth.getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();

  return (
    <div className="grid gap-1.5 sm:col-span-2">
      <span className="text-sm font-medium">Shoot date and time</span>
      <input type="hidden" name="date" value={contractDateTime(date, "")} />
      <input type="hidden" name="startTime" value={time ? displayTime(time) : ""} />
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-admin-ink/12 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-14 items-center gap-3 border-r border-admin-ink/10 px-4 text-left transition hover:bg-admin-ink/[0.025] active:bg-admin-ink/[0.045]"
        >
          <CalendarDays className="size-4 shrink-0 text-admin-accent" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-admin-ink/45">Date</span>
            <span className={`block truncate text-sm font-medium ${date ? "text-admin-ink" : "text-admin-ink/55"}`}>{displayDate(date)}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-14 items-center gap-3 px-4 text-left transition hover:bg-admin-ink/[0.025] active:bg-admin-ink/[0.045]"
        >
          <Clock3 className="size-4 shrink-0 text-admin-accent" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-admin-ink/45">Start time</span>
            <span className={`block truncate text-sm font-medium ${time ? "text-admin-ink" : "text-admin-ink/55"}`}>{displayTime(time)}</span>
          </span>
        </button>
      </div>

      {open ? (
        <div className="overflow-hidden rounded-xl border border-admin-ink/12 bg-white/85 shadow-[0_18px_45px_rgba(43,35,28,0.10)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="grid size-9 place-items-center rounded-full text-admin-ink/60 transition hover:bg-admin-ink/6 active:scale-95"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <p className="text-sm font-semibold tracking-tight">{monthLabel}</p>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="grid size-9 place-items-center rounded-full text-admin-ink/60 transition hover:bg-admin-ink/6 active:scale-95"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-admin-ink/35">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => <span key={weekday} className="py-2">{weekday.slice(0, 1)}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-y-1" role="grid" aria-label={monthLabel}>
                {Array.from({ length: 42 }, (_, index) => {
                  const day = index - firstWeekday + 1;
                  if (day < 1 || day > daysInMonth) return <span key={index} className="aspect-square" />;
                  const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
                  const key = dateKey(candidate);
                  const isSelected = key === date;
                  const isToday = key === todayKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      aria-selected={isSelected}
                      aria-label={displayDate(key)}
                      onClick={() => onDateChange(key)}
                      className={`mx-auto grid size-9 place-items-center rounded-full text-sm transition active:scale-95 ${
                        isSelected
                          ? "bg-admin-ink font-semibold text-admin-surface shadow-[0_4px_12px_rgba(24,20,16,0.18)]"
                          : isToday
                            ? "font-semibold text-admin-accent ring-1 ring-inset ring-admin-accent/30 hover:bg-admin-accent/8"
                            : "text-admin-ink/75 hover:bg-admin-ink/6"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  onDateChange(todayKey);
                  setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
                className="mt-3 text-xs font-medium text-admin-accent hover:text-admin-ink"
              >
                Today
              </button>
            </div>

            <div className="border-t border-admin-ink/10 bg-admin-ink/[0.018] p-4 lg:border-l lg:border-t-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-admin-ink/45">Start time</p>
              <div className="mt-3 grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-1 lg:grid-cols-1">
                {timeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onTimeChange(option.value)}
                    className={`min-h-9 rounded-lg px-3 text-sm font-medium transition active:scale-[0.98] ${
                      time === option.value
                        ? "bg-admin-ink text-admin-surface shadow-[0_3px_10px_rgba(24,20,16,0.14)]"
                        : "text-admin-ink/65 hover:bg-admin-ink/6"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-admin-ink/10 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => {
                onDateChange("");
                onTimeChange("");
              }}
              className="text-xs font-medium text-admin-ink/50 hover:text-admin-ink"
            >
              Clear
            </button>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-admin-ink/45 sm:inline">{date ? `${displayDate(date)}${time ? `, ${displayTime(time)}` : ""}` : "Choose a date"}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-9 rounded-lg bg-admin-ink px-4 text-xs font-semibold text-admin-surface transition active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {selected ? <span className="text-xs text-admin-ink/50">The contract will show {contractDateTime(date, time)}.</span> : null}
    </div>
  );
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
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(() => todayInToronto());
  const [templateId, setTemplateId] = useState<AgreementTemplateId>("photography");
  const [partnerName, setPartnerName] = useState("");
  const [shootType, setShootType] = useState("");
  const [description, setDescription] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [shootTime, setShootTime] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("Toronto");
  const [mealHours, setMealHours] = useState("6");
  const [total, setTotal] = useState("");
  const [hourly, setHourly] = useState("");
  const [deposit, setDeposit] = useState("");
  const [balance, setBalance] = useState("");
  const [balanceDueDate, setBalanceDueDate] = useState("");
  const [lateFeePercent, setLateFeePercent] = useState("1.5");
  const [emailNow, setEmailNow] = useState(true);
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryAt, setExpiryAt] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(true);

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

  const chooseGallery = (id: string) => {
    const gallery = galleries.find((candidate) => candidate.id === id);
    if (!gallery) return;
    if (gallery.client_name) setClientName(gallery.client_name);
    if (gallery.client_email) setClientEmail(gallery.client_email);
    if (gallery.event_date) {
      setShootDate(gallery.event_date.slice(0, 10));
      const timePart = gallery.event_date.includes("T") ? gallery.event_date.slice(11, 16) : "";
      if (timePart && timePart !== "00:00") setShootTime(timePart);
    }
    if (gallery.location) setLocation(gallery.location);
  };

  const choosePackage = (value: string) => {
    setShootType(value);
    setDescription(value);
    setTemplateId(isWeddingAgreementType(value) ? "wedding" : "photography");
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
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ClientPicker
          clients={clients}
          selectedKey={selectedClientKey}
          currentName={selectedClientKey ? "" : clientName}
          currentEmail={selectedClientKey ? "" : clientEmail}
          onSelect={chooseClient}
          onCreate={createClient}
        />
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
          Full legal or company name
          <input className={inputClass} name="client_name" value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Start typing a name" autoComplete="name" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client email
          <input className={inputClass} name="client_email" type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client phone
          <input className={inputClass} name="phone" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="(416) 555-0123" autoComplete="tel" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client address
          <input className={inputClass} name="clientAddress" value={clientAddress} onChange={(event) => setClientAddress(event.target.value)} placeholder="Street, city, province" autoComplete="street-address" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Authorized signer name
          <input className={inputClass} name="signerName" placeholder="If different from client name" autoComplete="name" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Authorized signer title
          <input className={inputClass} name="signerTitle" placeholder="Owner, Director, etc." />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Effective date
          <input className={inputClass} name="effectiveDate" type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Contract template
          <select
            className={inputClass}
            name="template"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value as AgreementTemplateId)}
          >
            {agreementTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-admin-ink/55">
            {agreementTemplates.find((template) => template.id === templateId)?.description}
          </span>
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
        {templateId === "wedding" ? (
          <>
            <label className="grid gap-1.5 text-sm font-medium">
              Partner name
              <input
                className={inputClass}
                name="partner"
                value={partnerName}
                onChange={(event) => setPartnerName(event.target.value)}
                placeholder="Partner's full name"
                autoComplete="name"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Second signer name
              <input className={inputClass} name="secondSignerName" placeholder="Full legal name" autoComplete="name" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Second signer email
              <input className={inputClass} name="secondSignerEmail" type="email" placeholder="name@example.com" autoComplete="email" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Second signer phone
              <input className={inputClass} name="secondSignerPhone" placeholder="(416) 555-0123" autoComplete="tel" />
            </label>
          </>
        ) : null}
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Description of services
          <textarea className={`${inputClass} min-h-24 py-3`} name="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the coverage, hours, deliverables, and any included services" />
        </label>
        <ShootSchedulePicker
          date={shootDate}
          time={shootTime}
          onDateChange={setShootDate}
          onTimeChange={setShootTime}
        />
        <label className="grid gap-1.5 text-sm font-medium">
          Coverage time
          <input className={inputClass} name="coverageTime" placeholder="e.g. 5 hours" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Venue name and full address
          <input className={inputClass} name="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Venue, street, city, province" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Second location
          <input className={inputClass} name="secondLocation" placeholder="Name and full address, if applicable" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          On-site contact name
          <input className={inputClass} name="onsiteContactName" placeholder="If different from client" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          On-site contact phone
          <input className={inputClass} name="onsiteContactPhone" placeholder="(416) 555-0123" autoComplete="tel" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Second shooter
          <select className={inputClass} name="secondShooter" defaultValue="No"><option>No</option><option>Yes</option></select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Minimum edited images
          <input className={inputClass} name="minimumEditedImages" placeholder="e.g. 75" inputMode="numeric" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Turnaround (business days)
          <input className={inputClass} name="turnaroundBusinessDays" placeholder="e.g. 15" inputMode="numeric" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Restrictions and special requests
          <textarea className={`${inputClass} min-h-20 py-3`} name="specialRequests" placeholder="No flash, minors present, must-have shots, key people, or other known requirements" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Included travel city
          <input className={inputClass} name="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Toronto" />
        </label>
        {templateId === "wedding" ? (
          <label className="grid gap-1.5 text-sm font-medium">
            Meal threshold (hours)
            <input className={inputClass} name="mealHours" value={mealHours} onChange={(event) => setMealHours(event.target.value)} placeholder="6" inputMode="decimal" />
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm font-medium">
          Total fee (CAD)
          <input className={inputClass} name="total" value={total} onChange={(event) => setTotal(event.target.value)} placeholder="$0" inputMode="decimal" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Additional hourly price (CAD/hour)
          <input className={inputClass} name="hourly" value={hourly} onChange={(event) => setHourly(event.target.value)} placeholder="$0 per hour" inputMode="decimal" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          {templateId === "wedding" ? "Deposit" : "Retainer"} due upon signing
          <input className={inputClass} name="deposit" value={deposit} onChange={(event) => setDeposit(event.target.value)} placeholder="$500 or 25%" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Balance due timing
          <input className={inputClass} name="balanceDueDate" value={balanceDueDate} onChange={(event) => setBalanceDueDate(event.target.value)} placeholder="Before the shoot, on the day, on delivery, or a date" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Remaining amount due (CAD)
          <input className={inputClass} name="balance" value={balance} onChange={(event) => setBalance(event.target.value)} placeholder="$0" inputMode="decimal" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Late fee (% per month)
          <input className={inputClass} name="lateFeePercent" value={lateFeePercent} onChange={(event) => setLateFeePercent(event.target.value)} placeholder="0" inputMode="decimal" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Gallery availability window
          <select className={inputClass} name="window" defaultValue="1 year from delivery">
            <option value="1 year from delivery">1 year from delivery</option>
            <option value="30 days from delivery">30 days from delivery</option>
            <option value="60 days from delivery">60 days from delivery</option>
            <option value="90 days from delivery">90 days from delivery</option>
            <option value="No expiry">No expiry</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Separately billed items
          <input className={inputClass} name="additionalCharges" defaultValue="Travel outside the GTA, parking, permits, and rentals, if applicable" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Client licence type
          <select className={inputClass} name="licenseType" defaultValue="Personal use only"><option>Personal use only</option><option>Commercial use for the Client’s own marketing</option></select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Gallery rehosting fee (CAD)
          <input className={inputClass} name="rehostingFee" defaultValue="50" inputMode="decimal" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Image archive period
          <input className={inputClass} name="archiveWindow" defaultValue="1 year after delivery" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Cancellation tiers
          <textarea className={`${inputClass} min-h-20 py-3`} name="cancellationPolicy" defaultValue="30 or more days before the shoot: retainer only; 15 to 29 days: 50% of total; 14 days or fewer: 100% of total." />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Rescheduling policy
          <textarea className={`${inputClass} min-h-20 py-3`} name="reschedulePolicy" defaultValue="One free reschedule with at least 15 days' notice; the new date must be within 6 months." />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Revision allowance
          <textarea className={`${inputClass} min-h-20 py-3`} name="revisionPolicy" defaultValue="Two rounds of minor revisions on up to 10 images, requested within 14 days of delivery." />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Privacy opt-out surcharge
          <input className={inputClass} name="privacyOptOutFee" defaultValue="Quoted on request" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
          Internal note <span className="font-normal text-admin-ink/65">(not shown to client)</span>
          <input className={inputClass} name="message" placeholder="Add a private reminder or context" />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold text-admin-ink">Signing controls</legend>
          <div className="mt-2 divide-y divide-admin-ink/10 rounded-md border border-admin-ink/10 bg-white/35">
            <div className="grid gap-4 p-4 sm:grid-cols-[1fr_18rem] sm:items-center">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-admin-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-admin-ink">Contract expiry</p>
                  <p className="mt-0.5 text-xs leading-5 text-admin-ink/55">
                    Close the signing link automatically if it is still unsigned at the deadline.
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:justify-items-end">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-admin-ink/65">
                  <input
                    type="checkbox"
                    checked={expiryEnabled}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      setExpiryEnabled(enabled);
                      if (enabled && !expiryAt) setExpiryAt(defaultExpiryValue());
                    }}
                    className="size-4 accent-admin-accent"
                  />
                  Set expiry
                </label>
                {expiryEnabled ? (
                  <label className="grid w-full gap-1 text-xs font-medium text-admin-ink/55 sm:w-72">
                    Deadline (Toronto time)
                    <input
                      type="datetime-local"
                      name="expires_at"
                      value={expiryAt}
                      onChange={(event) => setExpiryAt(event.target.value)}
                      required
                      className={`${inputClass} w-full`}
                    />
                  </label>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-[1fr_18rem] sm:items-center">
              <div className="flex items-start gap-3">
                <BellRing className="mt-0.5 size-4 shrink-0 text-admin-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-admin-ink">Signature reminders</p>
                  <p className="mt-0.5 text-xs leading-5 text-admin-ink/55">
                    Email the client until they sign, the contract expires, or the send limit is reached.
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:justify-items-end">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-admin-ink/65">
                  <input
                    type="checkbox"
                    name="reminders_enabled"
                    checked={remindersEnabled}
                    onChange={(event) => setRemindersEnabled(event.target.checked)}
                    className="size-4 accent-admin-accent"
                  />
                  Send reminders
                </label>
                {remindersEnabled ? (
                  <div className="grid w-full grid-cols-2 gap-2 sm:w-72">
                    <label className="grid gap-1 text-xs font-medium text-admin-ink/55">
                      Every
                      <select name="reminder_interval_days" defaultValue="3" className={inputClass}>
                        <option value="2">2 days</option>
                        <option value="3">3 days</option>
                        <option value="5">5 days</option>
                        <option value="7">7 days</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-admin-ink/55">
                      Stop after
                      <select name="reminder_max_sends" defaultValue="3" className={inputClass}>
                        <option value="1">1 email</option>
                        <option value="2">2 emails</option>
                        <option value="3">3 emails</option>
                        <option value="5">5 emails</option>
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-admin-ink/50">
            Reminders begin after the first contract email is sent and run on the daily reminder schedule.
          </p>
        </fieldset>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-admin-ink/65">
        <input
          type="checkbox"
          name="mark_sent"
          checked={emailNow}
          onChange={(event) => setEmailNow(event.target.checked)}
          className="size-4 accent-admin-accent"
        />
        Email the signing link to the client now
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-11 items-center rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface">
          {emailNow ? "Create and email signing link" : "Create signing link"}
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
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-admin-accent/25 px-3 text-xs font-medium text-admin-accent hover:bg-admin-accent/8 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
              {request.latest_delivery ? "Resend email" : "Send email"}
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
