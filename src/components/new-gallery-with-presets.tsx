"use client";

import { useState } from "react";
import { GalleryForm } from "@/components/gallery-form";
import { galleryPresets, type GalleryPreset, type GalleryPresetDefaults } from "@/data/gallery-presets";

/**
 * Computes a datetime-local string (yyyy-MM-ddTHH:mm) N days from now.
 * Used to pre-fill the gallery expiry field from a preset's expiry_days.
 */
function expiresAtFromDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // datetime-local format: "2026-08-19T14:30"
  return d.toISOString().slice(0, 16);
}

function toFormDefaults(preset: GalleryPreset): GalleryPresetDefaults & { expires_at: string } {
  return {
    ...preset.defaults,
    expires_at: preset.defaults.expiry_days !== null
      ? expiresAtFromDays(preset.defaults.expiry_days)
      : "",
  };
}

type PresetCardProps = {
  preset: GalleryPreset;
  selected: boolean;
  onSelect: () => void;
};

function PresetCard({ preset, selected, onSelect }: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "rounded-md border p-4 text-left transition",
        selected
          ? "border-admin-accent bg-admin-copper/10 ring-1 ring-admin-accent/40"
          : "border-admin-ink/10 bg-admin-surface hover:border-admin-ink/22 hover:bg-[#f6f2ea]",
      ].join(" ")}
    >
      <p className={["text-sm font-medium", selected ? "text-admin-accent" : "text-admin-ink"].join(" ")}>
        {preset.label}
      </p>
      <p className="mt-0.5 text-xs text-admin-ink/50">{preset.tagline}</p>
    </button>
  );
}

export function NewGalleryWithPresets() {
  // null = blank (no preset applied)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // key forces GalleryForm to remount when preset changes, applying new defaultValues
  const [formKey, setFormKey] = useState(0);

  const selectedPreset = galleryPresets.find((p) => p.id === selectedId) ?? null;
  const formDefaults = selectedPreset ? toFormDefaults(selectedPreset) : undefined;

  function handleSelect(id: string | null) {
    setSelectedId(id);
    setFormKey((k) => k + 1);
  }

  return (
    <div>
      {/* Preset picker */}
      <div className="rounded-md border border-admin-ink/10 bg-[#f6f3ed] p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Start from a preset</h2>
            <p className="mt-1 text-sm text-admin-ink/55">
              Choose a template to pre-fill download settings, description, and expiry. You can edit everything after.
            </p>
          </div>
          {selectedPreset ? (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="text-xs text-admin-ink/45 underline-offset-2 hover:text-admin-ink hover:underline"
            >
              Clear preset
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {/* Blank option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={[
              "rounded-md border p-4 text-left transition",
              selectedId === null
                ? "border-admin-ink/30 bg-admin-ink/6 ring-1 ring-admin-ink/20"
                : "border-admin-ink/10 bg-admin-surface hover:border-admin-ink/22 hover:bg-[#f6f2ea]",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-admin-ink">Blank</p>
            <p className="mt-0.5 text-xs text-admin-ink/50">No preset defaults</p>
          </button>

          {galleryPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              selected={selectedId === preset.id}
              onSelect={() => handleSelect(preset.id)}
            />
          ))}
        </div>

        {selectedPreset ? (
          <p className="mt-3 text-xs text-admin-accent">
            <span className="font-medium">{selectedPreset.label} preset applied.</span>{" "}
            All fields below are editable.
          </p>
        ) : null}
      </div>

      {/* Gallery form — remounts on preset change to apply new defaultValues */}
      <div className="mt-6">
        <GalleryForm key={formKey} defaultValues={formDefaults} />
      </div>
    </div>
  );
}
