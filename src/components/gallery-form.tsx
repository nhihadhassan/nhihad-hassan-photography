"use client";

import { useActionState } from "react";
import type { GalleryRecord } from "@/lib/admin-data";
import type { GalleryPresetDefaults } from "@/data/gallery-presets";
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
  "min-h-32 rounded-md border border-[#17130f]/10 bg-white/70 px-3 py-3 text-sm text-[#17130f] outline-none transition placeholder:text-[#17130f]/35 focus:border-[#b98257]";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-[#8a2f24]">{errors[0]}</p>;
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

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
  /**
   * Preset defaults for new-gallery create mode. Ignored when `gallery` is
   * provided (edit mode). Applied as `defaultValue` / `defaultChecked` on
   * each relevant input so the admin can still override any field.
   */
  defaultValues?: GalleryFormDefaults;
};

export function GalleryForm({ gallery, defaultValues }: GalleryFormProps) {
  const action = gallery ? updateGallery : createGallery;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-6">
      {gallery ? <input type="hidden" name="id" value={gallery.id} /> : null}
      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
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
            <input className={inputClass} name="client_name" defaultValue={gallery?.client_name ?? ""} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Client email</span>
            <input
              className={inputClass}
              name="client_email"
              type="email"
              defaultValue={gallery?.client_email ?? ""}
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
      </section>

      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Cover and access</h2>
        <p className="mt-2 text-sm leading-6 text-[#17130f]/58">
          Optionally link to a hosted cover image. Photos uploaded via the admin are used automatically once available.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium">Cover image URL</span>
            <input
              className={inputClass}
              name="cover_image_url"
              type="url"
              defaultValue={gallery?.cover_image_url ?? ""}
              placeholder="https://images-pw.pixieset.com/..."
            />
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
          </label>
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
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-md border border-[#17130f]/10 bg-[#f3f0ea] p-4 text-sm">
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={gallery?.is_public ?? defaultValues?.is_public ?? false}
            />
            Public index eligible
          </label>
          <label className="flex items-center gap-3 rounded-md border border-[#17130f]/10 bg-[#f3f0ea] p-4 text-sm">
            <input type="checkbox" name="is_published" defaultChecked={gallery?.is_published ?? false} />
            Published
          </label>
          <label className="flex items-center gap-3 rounded-md border border-[#17130f]/10 bg-[#f3f0ea] p-4 text-sm">
            <input
              type="checkbox"
              name="download_enabled"
              defaultChecked={gallery?.download_enabled ?? defaultValues?.download_enabled ?? false}
            />
            Downloads enabled
          </label>
        </div>
      </section>

      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Password protection</h2>
            <p className="mt-2 text-sm leading-6 text-[#17130f]/58">
              {gallery?.has_password
                ? "This gallery currently requires a password. Enter a new one to change it, or check Remove to make it accessible without a password."
                : "Optional. Add a password to require visitors to enter it before viewing photos."}
            </p>
          </div>
          {gallery?.has_password ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#9b744f]/40 bg-[#b98257]/15 px-3 py-1 text-xs font-medium text-[#9b744f]">
              Currently protected
            </span>
          ) : null}
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">
              {gallery?.has_password ? "New password" : "Password"}
            </span>
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={gallery?.has_password ? "Leave blank to keep current" : "Choose a memorable phrase"}
              minLength={4}
            />
            <span className="text-xs text-[#17130f]/45">
              Saved so it can be included in client invite emails. Stored only in your Supabase database, never logged or transmitted beyond email delivery.
            </span>
          </label>
          {gallery?.has_password ? (
            <label className="flex items-center gap-3 self-end rounded-md border border-[#8a2f24]/20 bg-[#8a2f24]/8 p-4 text-sm">
              <input type="checkbox" name="remove_password" />
              Remove password (make gallery accessible without it)
            </label>
          ) : null}
        </div>
      </section>

      <section className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Payment</h2>
          <p className="mt-2 text-sm leading-6 text-[#17130f]/58">
            Track deposit and final payment status. Payments are collected manually via{" "}
            <strong className="font-medium text-[#17130f]">Interac e-Transfer</strong> — nothing is
            charged through this site.
          </p>
        </div>
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
        {pending ? "Saving" : gallery ? "Save gallery" : "Create gallery"}
      </Button>
    </form>
  );
}

