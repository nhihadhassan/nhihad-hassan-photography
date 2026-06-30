"use client";

import { useActionState, useState } from "react";
import {
  createGalleryQuick,
  type GalleryFormState,
} from "@/app/admin/(protected)/galleries/actions";
import { galleryPresets } from "@/data/gallery-presets";
import { Button } from "@/components/ui/button";

const initialState: GalleryFormState = { status: "idle", message: "" };

const inputClass =
  "min-h-11 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-admin-danger">{errors[0]}</p>;
}

export function NewCollectionForm() {
  const [state, formAction, pending] = useActionState(createGalleryQuick, initialState);
  // null = blank (no preset)
  const [presetId, setPresetId] = useState<string | null>(null);

  return (
    <form action={formAction} className="grid gap-6 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6">
      <input type="hidden" name="preset_id" value={presetId ?? ""} />

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-admin-ink">
          Title <span className="text-admin-danger">*</span>
        </span>
        <input className={inputClass} name="title" placeholder="MOOVE @ AH" autoFocus />
        <FieldError errors={state.fieldErrors?.title} />
        <span className="text-xs text-admin-ink/45">The web link is created from the title.</span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Client name</span>
          <input className={inputClass} name="client_name" placeholder="Jane & Mark" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-admin-ink">Client email</span>
          <input className={inputClass} name="client_email" type="email" placeholder="jane@example.com" />
          <FieldError errors={state.fieldErrors?.client_email} />
        </label>
        <label className="grid gap-1.5 sm:col-span-2 sm:max-w-[50%]">
          <span className="text-sm font-medium text-admin-ink">Event date</span>
          <input className={inputClass} name="event_date" type="date" />
        </label>
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-admin-ink">Preset</span>
        <p className="text-xs text-admin-ink/50">
          Pre-fills download settings and an expiry window. You can change everything later.
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
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
      </div>

      {state.message && state.status === "error" ? (
        <p className="rounded-md bg-admin-danger/10 px-4 py-3 text-sm text-admin-danger-ink">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="light" disabled={pending} className="justify-self-start rounded-md">
        {pending ? "Creating…" : "Create collection"}
      </Button>
      <p className="text-xs text-admin-ink/45">
        Next you will land on the Photos tab to upload. Privacy, downloads, and password live on
        the Settings tab.
      </p>
    </form>
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
        "rounded-full border px-3.5 py-1.5 text-sm transition",
        selected
          ? "border-admin-accent bg-admin-copper/12 text-admin-accent"
          : "border-admin-ink/15 bg-white/60 text-admin-ink/70 hover:border-admin-ink/30",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
