"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import {
  createGalleryQuick,
  type GalleryFormState,
} from "@/app/admin/(protected)/galleries/actions";
import { galleryPresets } from "@/data/gallery-presets";
import { Button } from "@/components/ui/button";
import { ClientPicker } from "@/components/client-picker";
import { LocationCombobox } from "@/components/location-combobox";
import { PremiumDatePicker } from "@/components/ui/premium-date-picker";
import { GALLERY_COVER_FONTS } from "@/lib/gallery-cover-fonts";
import type { ClientSummary } from "@/lib/clients";

const initialState: GalleryFormState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-admin-danger">{errors[0]}</p>;
}

export function NewCollectionForm({
  locations,
  clients,
}: {
  locations: string[];
  clients: ClientSummary[];
}) {
  const [state, formAction, pending] = useActionState(createGalleryQuick, initialState);
  // null = blank (no preset)
  const [presetId, setPresetId] = useState<string | null>(null);
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

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

  return (
    <form
      action={formAction}
      className="grid gap-6 rounded-xl border border-admin-ink/10 bg-admin-surface p-5 sm:p-7"
    >
      <input type="hidden" name="preset_id" value={presetId ?? ""} />

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-admin-ink">
          Title <span className="text-admin-danger">*</span>
        </span>
        <input className={inputClass} name="title" placeholder="MOOVE @ AH" autoFocus />
        <FieldError errors={state.fieldErrors?.title} />
        <span className="text-xs text-admin-ink/65">The web link is created from the title.</span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <ClientPicker
          clients={clients}
          selectedKey={selectedClientKey}
          currentName={selectedClientKey ? "" : clientName}
          currentEmail={selectedClientKey ? "" : clientEmail}
          onSelect={chooseClient}
          onCreate={createClient}
        />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Client name</span>
          <input
            className={inputClass}
            name="client_name"
            value={clientName}
            onChange={(e) => {
              setSelectedClientKey("");
              setClientName(e.target.value);
            }}
            placeholder="Jane & Mark"
            autoComplete="name"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Client email</span>
          <input
            className={inputClass}
            name="client_email"
            type="email"
            value={clientEmail}
            onChange={(e) => {
              setSelectedClientKey("");
              setClientEmail(e.target.value);
            }}
            placeholder="jane@example.com"
            autoComplete="email"
          />
          <FieldError errors={state.fieldErrors?.client_email} />
        </label>
        <PremiumDatePicker label="Event date" name="event_date" placeholder="Choose a date" />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Location</span>
          <LocationCombobox name="location" suggestions={locations} />
        </label>
      </div>

      <label className="grid gap-1.5 sm:max-w-[50%]">
        <span className="text-sm font-medium text-admin-ink">Cover title font</span>
        <select className={inputClass} name="cover_font" defaultValue="montserrat">
          {GALLERY_COVER_FONTS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-admin-ink/65">
          You can preview more title-case samples in the Cover section after creating the gallery.
        </span>
      </label>

      <div className="grid gap-2.5">
        <div>
          <span className="text-sm font-medium text-admin-ink">Shoot type</span>
          <p className="mt-0.5 text-xs text-admin-ink/65">
            Pre-fills download settings and an expiry window. You can change everything later.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PresetChip label="Blank" tagline="No defaults" selected={presetId === null} onSelect={() => setPresetId(null)} />
          {galleryPresets.map((preset) => (
            <PresetChip
              key={preset.id}
              label={preset.label}
              tagline={preset.tagline}
              selected={presetId === preset.id}
              onSelect={() => setPresetId(preset.id)}
            />
          ))}
        </div>
        <PresetSummary presetId={presetId} />
      </div>

      {state.message && state.status === "error" ? (
        <p className="rounded-md bg-admin-danger/10 px-4 py-3 text-sm text-admin-danger-ink">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-ink/8 pt-5">
        <p className="text-xs text-admin-ink/65">
          Next you will land on the Photos tab to upload. Privacy, downloads, and password live on
          the Settings tab.
        </p>
        <Button type="submit" variant="light" disabled={pending} className="shrink-0 rounded-md">
          {pending ? "Creating…" : "Create collection"}
        </Button>
      </div>
    </form>
  );
}

/** Small readout of what the selected preset actually changes, so it's never a mystery. */
function PresetSummary({ presetId }: { presetId: string | null }) {
  const preset = galleryPresets.find((p) => p.id === presetId);
  if (!preset) {
    return (
      <p className="text-xs text-admin-ink/50">
        No preset selected — downloads stay off and there is no expiry until you set one.
      </p>
    );
  }
  const { defaults } = preset;
  return (
    <p className="text-xs text-admin-ink/55">
      {defaults.download_enabled
        ? `${defaults.download_quality === "full" ? "Full-resolution" : "Web-size"} downloads enabled`
        : "Downloads off"}
      {defaults.expiry_days ? ` · expires in ${defaults.expiry_days} days` : " · no expiry"}
    </p>
  );
}

function PresetChip({
  label,
  tagline,
  selected,
  onSelect,
}: {
  label: string;
  tagline: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={tagline}
      className={[
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition focus-visible:ring-2 focus-visible:ring-admin-copper/40 [@media(pointer:coarse)]:min-h-11",
        selected
          ? "border-admin-accent bg-admin-copper/12 text-admin-accent"
          : "border-admin-ink/15 bg-white/60 text-admin-ink/70 hover:border-admin-ink/30",
      ].join(" ")}
    >
      {selected ? <Check className="size-3.5" aria-hidden="true" /> : null}
      {label}
    </button>
  );
}
