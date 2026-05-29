"use client";

import { useActionState } from "react";
import {
  Download,
  FileText,
  Key,
  Lock,
  Receipt,
  Shield,
} from "lucide-react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { GalleryPresetDefaults } from "@/data/gallery-presets";
import { CoverDesignFields } from "@/components/cover-design-fields";
import { DEPOSIT_STATUS_LABELS } from "@/lib/payment-constants";
import {
  createGallery,
  updateGallery,
  type GalleryFormState,
} from "@/app/admin/(protected)/galleries/actions";
import { Button } from "@/components/ui/button";

const initialState: GalleryFormState = {
  status: "idle",
  message: "",
};

const inputClass =
  "min-h-11 rounded-md border border-[#17130f]/10 bg-white/70 px-3 text-sm text-[#17130f] outline-none transition placeholder:text-[#17130f]/35 focus:border-[#b98257]";

const textareaClass =
  "min-h-28 rounded-md border border-[#17130f]/10 bg-white/70 px-3 py-3 text-sm text-[#17130f] outline-none transition placeholder:text-[#17130f]/35 focus:border-[#b98257]";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-[#8a2f24]">{errors[0]}</p>;
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#17130f]/8">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-[#17130f]/6 text-[#17130f]/60">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[#17130f]">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm leading-5 text-[#17130f]/55">{description}</p>
          )}
        </div>
      </div>
      {badge}
    </div>
  );
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

/**
 * Extends GalleryPresetDefaults with the computed expires_at string that the
 * datetime-local input requires. The preset stores expiry_days (raw); the
 * wrapper component converts it to a datetime-local string before passing it
 * here.
 */
type GalleryFormDefaults = GalleryPresetDefaults & { expires_at?: string };

type GalleryFormProps = {
  gallery?: GalleryRecord;
  defaultValues?: GalleryFormDefaults;
  /** Resolved cover image URL for the focal-point preview (server-side). */
  coverImageUrl?: string | null;
};

export function GalleryForm({ gallery, defaultValues, coverImageUrl }: GalleryFormProps) {
  const action = gallery ? updateGallery : createGallery;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      {gallery ? <input type="hidden" name="id" value={gallery.id} /> : null}

      {/* ── General ───────────────────────────────────────────────────────── */}
      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <SectionHeader
          icon={FileText}
          title="General"
          description="Basic details shown on the gallery cover page."
        />
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Title</span>
            <input
              className={inputClass}
              name="title"
              defaultValue={gallery?.title}
              placeholder="MOOVE @ AH"
            />
            <FieldError errors={state.fieldErrors?.title} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Slug</span>
            <input
              className={inputClass}
              name="slug"
              defaultValue={gallery?.slug}
              placeholder="moove-ah"
            />
            <FieldError errors={state.fieldErrors?.slug} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Client name</span>
            <input
              className={inputClass}
              name="client_name"
              defaultValue={gallery?.client_name ?? ""}
              placeholder="Jane & Mark"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Client email</span>
            <input
              className={inputClass}
              name="client_email"
              type="email"
              defaultValue={gallery?.client_email ?? ""}
              placeholder="jane@example.com"
            />
            <FieldError errors={state.fieldErrors?.client_email} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Event date</span>
            <input
              className={inputClass}
              name="event_date"
              type="date"
              defaultValue={gallery?.event_date ?? ""}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Location</span>
            <input
              className={inputClass}
              name="location"
              defaultValue={gallery?.location ?? ""}
              placeholder="Toronto"
            />
          </label>
        </div>
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className={textareaClass}
            name="description"
            defaultValue={gallery?.description ?? defaultValues?.description ?? ""}
            placeholder="A short note for the cover page."
          />
        </label>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium">Cover image URL</span>
            <input
              className={inputClass}
              name="cover_image_url"
              type="url"
              defaultValue={gallery?.cover_image_url ?? ""}
              placeholder="https://…"
            />
            <span className="text-xs text-[#17130f]/45">
              Optional external cover image. Uploaded photos are used automatically when available.
            </span>
            <FieldError errors={state.fieldErrors?.cover_image_url} />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium">Cover image alt text</span>
            <input
              className={inputClass}
              name="cover_image_alt"
              defaultValue={gallery?.cover_image_alt ?? ""}
              placeholder="Guests celebrating on a Toronto dance floor."
            />
          </label>
          <CoverDesignFields
            coverImageUrl={coverImageUrl}
            initialFocalX={gallery?.cover_focal_x ?? 50}
            initialFocalY={gallery?.cover_focal_y ?? 50}
            initialLayout={gallery?.cover_layout ?? "center"}
          />
        </div>
      </section>

      {/* ── Privacy & Access ──────────────────────────────────────────────── */}
      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <SectionHeader
          icon={Shield}
          title="Privacy & Access"
          description="Control who can find and view this gallery."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[#17130f]/10 bg-white/50 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-[#17130f]">Published</p>
              <p className="mt-0.5 text-xs text-[#17130f]/50">Visible to clients with the link</p>
            </div>
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={gallery?.is_published ?? false}
              className="size-4 accent-[#9b744f]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[#17130f]/10 bg-white/50 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-[#17130f]">Public index eligible</p>
              <p className="mt-0.5 text-xs text-[#17130f]/50">May appear in the gallery listing</p>
            </div>
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={gallery?.is_public ?? defaultValues?.is_public ?? false}
              className="size-4 accent-[#9b744f]"
            />
          </label>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Expiry</span>
            <input
              className={inputClass}
              name="expires_at"
              type="datetime-local"
              defaultValue={
                gallery?.expires_at
                  ? toDateTimeLocal(gallery.expires_at)
                  : (defaultValues?.expires_at ?? "")
              }
            />
            <span className="text-xs text-[#17130f]/45">Leave blank for no expiry.</span>
          </label>
        </div>

        {/* Password sub-section */}
        <div className="mt-6 border-t border-[#17130f]/8 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-[#17130f]/45" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#17130f]">Password protection</p>
              {gallery?.has_password && (
                <span className="inline-flex items-center rounded-full border border-[#9b744f]/40 bg-[#b98257]/15 px-2.5 py-0.5 text-xs font-medium text-[#9b744f]">
                  Protected
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-[#17130f]/50">
            {gallery?.has_password
              ? "Enter a new password to change it, or check Remove to clear it."
              : "Optional. Visitors must enter this before viewing photos."}
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">
                {gallery?.has_password ? "New password" : "Password"}
              </span>
              <input
                className={inputClass}
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={
                  gallery?.has_password ? "Leave blank to keep current" : "Choose a memorable phrase"
                }
                minLength={4}
              />
              <span className="text-xs text-[#17130f]/45">
                Stored and included in client invite emails. Never logged or transmitted otherwise.
              </span>
            </label>
            {gallery?.has_password ? (
              <label className="flex cursor-pointer items-center gap-3 self-end rounded-md border border-[#8a2f24]/20 bg-[#8a2f24]/8 px-4 py-3.5 text-sm">
                <input type="checkbox" name="remove_password" className="size-4 accent-[#8a2f24]" />
                Remove password
              </label>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Download ──────────────────────────────────────────────────────── */}
      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <SectionHeader
          icon={Download}
          title="Download"
          description="Control how clients can download photos from this gallery."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[#17130f]/10 bg-white/50 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-[#17130f]">Downloads enabled</p>
              <p className="mt-0.5 text-xs text-[#17130f]/50">Clients can download the gallery ZIP</p>
            </div>
            <input
              type="checkbox"
              name="download_enabled"
              defaultChecked={gallery?.download_enabled ?? defaultValues?.download_enabled ?? false}
              className="size-4 accent-[#9b744f]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[#17130f]/10 bg-white/50 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-[#17130f]">Watermark previews</p>
              <p className="mt-0.5 text-xs text-[#17130f]/50">Web previews only — originals stay clean</p>
            </div>
            <input
              type="checkbox"
              name="watermark_enabled"
              defaultChecked={gallery?.watermark_enabled ?? false}
              className="size-4 accent-[#9b744f]"
            />
          </label>
        </div>
        {gallery?.watermark_enabled ? (
          <p className="mt-3 text-xs text-[#17130f]/45">
            Use the Variants button in Photos to regenerate existing web previews with the watermark.
          </p>
        ) : null}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Download quality</span>
            <select
              className={inputClass}
              name="download_quality"
              defaultValue={gallery?.download_quality ?? defaultValues?.download_quality ?? "web"}
            >
              <option value="web">Web-size</option>
              <option value="full">Full resolution</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Download limit <span className="font-normal text-[#17130f]/40">(optional)</span>
            </span>
            <input
              className={inputClass}
              name="download_limit"
              type="number"
              min={1}
              defaultValue={gallery?.download_limit ?? ""}
              placeholder="Unlimited"
            />
            <span className="text-xs text-[#17130f]/45">
              Max full-gallery downloads.{" "}
              {gallery?.download_count ? `${gallery.download_count} used so far.` : ""}
            </span>
          </label>
        </div>

        {/* Download PIN sub-section */}
        <div className="mt-6 border-t border-[#17130f]/8 pt-5">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-[#17130f]/45" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#17130f]">Download PIN</p>
            {gallery?.has_download_pin && (
              <span className="inline-flex items-center rounded-full border border-[#9b744f]/40 bg-[#b98257]/15 px-2.5 py-0.5 text-xs font-medium text-[#9b744f]">
                Active
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#17130f]/50">
            {gallery?.has_download_pin
              ? "Enter a new PIN to change it, or check Remove to clear it."
              : "Optional extra gate before downloads start. Separate from the gallery password."}
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">
                {gallery?.has_download_pin ? "New download PIN" : "Download PIN"}
              </span>
              <input
                className={inputClass}
                name="download_pin"
                type="password"
                autoComplete="new-password"
                placeholder={
                  gallery?.has_download_pin ? "Leave blank to keep current" : "Optional PIN code"
                }
                minLength={4}
              />
              <span className="text-xs text-[#17130f]/45">Stored hashed. Never logged or emailed.</span>
            </label>
            {gallery?.has_download_pin ? (
              <label className="flex cursor-pointer items-center gap-3 self-end rounded-md border border-[#8a2f24]/20 bg-[#8a2f24]/8 px-4 py-3.5 text-sm">
                <input
                  type="checkbox"
                  name="remove_download_pin"
                  className="size-4 accent-[#8a2f24]"
                />
                Remove download PIN
              </label>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Payment ───────────────────────────────────────────────────────── */}
      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <SectionHeader
          icon={Receipt}
          title="Payment"
          description={
            "Track deposit and final payment status. Payments are collected manually via Interac e-Transfer — nothing is charged through this site."
          }
        />
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Deposit status</span>
            <select
              className={inputClass}
              name="deposit_status"
              defaultValue={gallery?.deposit_status ?? "not_requested"}
            >
              {(Object.entries(DEPOSIT_STATUS_LABELS) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Payment notes</span>
            <input
              className={inputClass}
              name="payment_notes"
              defaultValue={gallery?.payment_notes ?? ""}
              placeholder="e.g. Deposit request sent May 20 · $300"
            />
            <span className="text-xs text-[#17130f]/45">Admin-only. Never shown publicly.</span>
          </label>
        </div>
      </section>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md bg-[#d8c8b2]/45 px-4 py-3 text-sm text-[#17130f]"
              : "rounded-md bg-[#8a2f24]/10 px-4 py-3 text-sm text-[#7a2e25]"
          }
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="light" disabled={pending} className="justify-self-start rounded-md">
        {pending ? "Saving…" : gallery ? "Save settings" : "Create gallery"}
      </Button>
    </form>
  );
}
