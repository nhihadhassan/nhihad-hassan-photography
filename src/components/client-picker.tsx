"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import type { ClientSummary } from "@/lib/clients";

const inputClass =
  "min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus:border-admin-copper";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Search an onboarded client or type a new one's name/email. Shared by the
 * new-agreement and new-invoice starters so "pick a client" only exists once.
 */
export function ClientPicker({
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
                  <p className="mt-0.5 text-xs text-admin-ink/50">They will be saved when you create this.</p>
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
