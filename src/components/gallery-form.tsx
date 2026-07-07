"use client";

import { useActionState } from "react";
import {
  ChevronDown,
  Download,
  FileText,
  ImageIcon,
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
  "min-h-11 rounded-md border border-admin-ink/10 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35";

const textareaClass =
  "min-h-28 rounded-md border border-admin-ink/10 bg-white/70 px-3 py-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/60 focus-visible:border-admin-copper focus-visible:ring-2 focus-visible:ring-admin-copper/35";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-admin-danger">{errors[0]}</p>;
}

/** Red asterisk marking a required field. */
function Required() {
  return (
    <span className="text-admin-danger" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

/**
 * Collapsible settings section built on native <details>, so only General is
 * expanded by default and the rest stay out of the way until needed.
 */
function Section({
  icon: Icon,
  title,
  description,
  defaultOpen = false,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-md border border-admin-ink/10 bg-admin-surface"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-admin-ink/6 text-admin-ink/60">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-admin-ink">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm leading-5 text-admin-ink/65">{description}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {badge}
          <ChevronDown
            className="size-4 text-admin-ink/65 transition group-open:rotate-180"
            aria-hidden="true"
          />
        </div>
      </summary>
      <div className="border-t border-admin-ink/8 px-5 py-5 sm:px-6">{children}</div>
    </details>
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
 * datetime-local input requires.
 */
type GalleryFormDefaults = GalleryPresetDefaults & { expires_at?: string };

type GalleryFormProps = {
  gallery?: GalleryRecord;
  defaultValues?: GalleryFormDefaults;
  /** Resolved cover image URL for the focal-point preview (server-side). */
  coverImageUrl?: string | null;
};

/** Small "Protected"/"Active" style pill used in section headers. */
function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-admin-accent/40 bg-admin-copper/15 px-2.5 py-0.5 text-xs font-medium text-admin-accent">
      {children}
    </span>
  );
}

export function GalleryForm({ gallery, defaultValues, coverImageUrl }: GalleryFormProps) {
  const action = gallery ? updateGallery : createGallery;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      {gallery ? <input type="hidden" name="id" value={gallery.id} /> : null}

      {/* ── General ───────────────────────────────────────────────────────── */}
      <Section
        icon={FileText}
        title="General"
        description="Basic details shown on the gallery cover page."
        defaultOpen
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Title
              <Required />
            </span>
            <input
              className={inputClass}
              name="title"
              defaultValue={gallery?.title}
              placeholder="MOOVE @ AH"
            />
            <FieldError errors={state.fieldErrors?.title} />
          </label>
          {gallery ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium">Web address (slug)</span>
              <input
                className={inputClass}
                name="slug"
                defaultValue={gallery.slug}
                placeholder="moove-ah"
              />
              <span className="text-xs text-admin-ink/65">
                Changing this changes the gallery&apos;s link. Leave it as is to keep the current URL.
              </span>
              <FieldError errors={state.fieldErrors?.slug} />
            </label>
          ) : (
            <p className="self-end text-xs text-admin-ink/65">
              The web address is created automatically from the title.
            </p>
          )}
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
          <span className="text-sm font-medium">Description / shoot blurb</span>
          <textarea
            className={textareaClass}
            name="description"
            defaultValue={gallery?.description ?? defaultValues?.description ?? ""}
            placeholder="A few lines about the shoot, shown above the photos."
          />
          <span className="text-xs text-admin-ink/65">
            Shown under the cover and above the gallery, and on the homepage gallery card.
          </span>
        </label>
      </Section>

      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <Section
        icon={ImageIcon}
        title="Cover"
        description="The image and layout used on the gallery cover page."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium">Cover image URL</span>
            <input
              className={inputClass}
              name="cover_image_url"
              type="url"
              defaultValue={gallery?.cover_image_url ?? ""}
              placeholder="https://…"
            />
            <span className="text-xs text-admin-ink/65">
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
      </Section>

      {/* ── Privacy & Access ──────────────────────────────────────────────── */}
      <Section
        icon={Shield}
        title="Privacy & Access"
        description="Control who can find and view this gallery."
        badge={gallery?.has_password ? <StatusBadge>Password</StatusBadge> : undefined}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md bg-admin-ink/[0.04] px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-admin-ink">Published</p>
              <p className="mt-0.5 text-xs text-admin-ink/65">Visible to clients with the link</p>
            </div>
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={gallery?.is_published ?? false}
              className="size-4 accent-admin-accent"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md bg-admin-ink/[0.04] px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-admin-ink">Public index eligible</p>
              <p className="mt-0.5 text-xs text-admin-ink/65">May appear in the gallery listing</p>
            </div>
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={gallery?.is_public ?? defaultValues?.is_public ?? false}
              className="size-4 accent-admin-accent"
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
            <span className="text-xs text-admin-ink/65">Leave blank for no expiry.</span>
          </label>
        </div>

        {/* Password sub-section */}
        <div className="mt-6 border-t border-admin-ink/8 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-admin-ink/65" aria-hidden="true" />
              <p className="text-sm font-semibold text-admin-ink">Password protection</p>
              {gallery?.has_password && <StatusBadge>Protected</StatusBadge>}
            </div>
          </div>
          <p className="mt-1 text-xs text-admin-ink/65">
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
              <span className="text-xs text-admin-ink/65">
                Stored and included in client invite emails. Never logged or transmitted otherwise.
              </span>
            </label>
            {gallery?.has_password ? (
              <label className="flex cursor-pointer items-center gap-3 self-end rounded-md bg-admin-danger/10 px-4 py-3.5 text-sm text-admin-danger-ink">
                <input type="checkbox" name="remove_password" className="size-4 accent-admin-danger" />
                Remove password
              </label>
            ) : null}
          </div>
        </div>
      </Section>

      {/* ── Download ──────────────────────────────────────────────────────── */}
      <Section
        icon={Download}
        title="Download"
        description="Control how clients can download photos from this gallery."
        badge={gallery?.has_download_pin ? <StatusBadge>PIN</StatusBadge> : undefined}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md bg-admin-ink/[0.04] px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-admin-ink">Downloads enabled</p>
              <p className="mt-0.5 text-xs text-admin-ink/65">Clients can download the gallery ZIP</p>
            </div>
            <input
              type="checkbox"
              name="download_enabled"
              defaultChecked={gallery?.download_enabled ?? defaultValues?.download_enabled ?? false}
              className="size-4 accent-admin-accent"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md bg-admin-ink/[0.04] px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-admin-ink">Watermark previews</p>
              <p className="mt-0.5 text-xs text-admin-ink/65">Web previews only. Originals stay clean.</p>
            </div>
            <input
              type="checkbox"
              name="watermark_enabled"
              defaultChecked={gallery?.watermark_enabled ?? false}
              className="size-4 accent-admin-accent"
            />
          </label>
        </div>
        {gallery?.watermark_enabled ? (
          <p className="mt-3 text-xs text-admin-ink/65">
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
              Download limit <span className="font-normal text-admin-ink/65">(optional)</span>
            </span>
            <input
              className={inputClass}
              name="download_limit"
              type="number"
              min={1}
              defaultValue={gallery?.download_limit ?? ""}
              placeholder="Unlimited"
            />
            <span className="text-xs text-admin-ink/65">
              Max full-gallery downloads.{" "}
              {gallery?.download_count ? `${gallery.download_count} used so far.` : ""}
            </span>
          </label>
        </div>

        {/* Download PIN sub-section */}
        <div className="mt-6 border-t border-admin-ink/8 pt-5">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-admin-ink/65" aria-hidden="true" />
            <p className="text-sm font-semibold text-admin-ink">Download PIN</p>
            {gallery?.has_download_pin && <StatusBadge>Active</StatusBadge>}
          </div>
          <p className="mt-1 text-xs text-admin-ink/65">
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
              <span className="text-xs text-admin-ink/65">Stored hashed. Never logged or emailed.</span>
            </label>
            {gallery?.has_download_pin ? (
              <label className="flex cursor-pointer items-center gap-3 self-end rounded-md bg-admin-danger/10 px-4 py-3.5 text-sm text-admin-danger-ink">
                <input
                  type="checkbox"
                  name="remove_download_pin"
                  className="size-4 accent-admin-danger"
                />
                Remove download PIN
              </label>
            ) : null}
          </div>
        </div>
      </Section>

      {/* ── Payment ───────────────────────────────────────────────────────── */}
      <Section
        icon={Receipt}
        title="Payment"
        description="Track deposit and final payment status. Payments are collected manually via Interac e-Transfer. Nothing is charged through this site."
      >
        <div className="grid gap-5 md:grid-cols-2">
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
            <span className="text-xs text-admin-ink/65">Admin-only. Never shown publicly.</span>
          </label>
        </div>
      </Section>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md bg-beige/45 px-4 py-3 text-sm text-admin-ink"
              : "rounded-md bg-admin-danger/10 px-4 py-3 text-sm text-admin-danger-ink"
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
