import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { brandConfig } from "@/lib/config";
import { CONTENT_FIELDS, getAllContent } from "@/lib/site-content";
import { updateSiteContent, updateSiteSettings, updateTheme } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "min-h-11 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";
const textareaClass =
  "min-h-24 w-full rounded-md border border-admin-ink/12 bg-white/70 px-3 py-2 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/35 focus:border-admin-copper";
const labelClass = "grid gap-1.5 text-sm font-medium text-admin-ink";
const saveButton =
  "inline-flex items-center gap-2 rounded-md bg-admin-ink px-4 py-2 text-sm font-medium text-admin-surface";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select(
      "brand_name,tagline,contact_email,contact_phone,instagram_primary,instagram_secondary,about_text,seo_title,seo_description,seo_google_verification,theme_serif_font,theme_accent_hex",
    )
    .limit(1)
    .maybeSingle();

  const serifFont = (settings?.theme_serif_font as string) ?? "cormorant";
  const accentHex = (settings?.theme_accent_hex as string | null) ?? "";

  const content = await getAllContent();
  const v = (key: string) =>
    settings ? ((settings as Record<string, string | null>)[key] ?? "") : "";

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-admin-accent">Site settings</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
        Edit your brand details, contact info, and the main page text. Changes appear on the site
        within a minute.
      </p>

      {/* Brand & contact */}
      <form
        action={updateSiteSettings}
        className="mt-8 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6"
      >
        <h2 className="text-base font-semibold tracking-tight text-admin-ink">Brand &amp; contact</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Brand name
            <input className={inputClass} name="brand_name" defaultValue={v("brand_name")} placeholder={brandConfig.name} />
          </label>
          <label className={labelClass}>
            Contact email
            <input className={inputClass} type="email" name="contact_email" defaultValue={v("contact_email")} placeholder={brandConfig.contactEmail} />
          </label>
          <label className={labelClass}>
            Contact phone <span className="font-normal text-admin-ink/40">(optional)</span>
            <input className={inputClass} name="contact_phone" defaultValue={v("contact_phone")} placeholder="Optional" />
          </label>
          <label className={labelClass}>
            Tagline
            <input className={inputClass} name="tagline" defaultValue={v("tagline")} placeholder={brandConfig.tagline} />
          </label>
          <label className={labelClass}>
            Instagram URL 1
            <input className={inputClass} name="instagram_primary" defaultValue={v("instagram_primary")} placeholder={brandConfig.instagram[0]?.href} />
          </label>
          <label className={labelClass}>
            Instagram URL 2
            <input className={inputClass} name="instagram_secondary" defaultValue={v("instagram_secondary")} placeholder={brandConfig.instagram[1]?.href} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            SEO title <span className="font-normal text-admin-ink/40">(browser tab / search title)</span>
            <input className={inputClass} name="seo_title" defaultValue={v("seo_title")} placeholder={brandConfig.name} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            SEO description <span className="font-normal text-admin-ink/40">(search + link previews)</span>
            <textarea className={textareaClass} name="seo_description" defaultValue={v("seo_description")} placeholder={brandConfig.tagline} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Google verification code{" "}
            <span className="font-normal text-admin-ink/40">
              (from Google Search Console, the content value of the meta tag)
            </span>
            <input
              className={inputClass}
              name="seo_google_verification"
              defaultValue={v("seo_google_verification")}
              placeholder="e.g. AbCdEf123..."
            />
          </label>
        </div>
        <div className="mt-5">
          <button type="submit" className={saveButton}>
            Save brand &amp; contact
          </button>
        </div>
      </form>

      {/* Theme */}
      <form
        action={updateTheme}
        className="mt-6 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6"
      >
        <h2 className="text-base font-semibold tracking-tight text-admin-ink">Theme</h2>
        <p className="mt-1 text-sm text-admin-ink/55">
          A couple of curated controls that re-skin the whole site. Kept intentionally small so the
          design stays coherent.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Heading font
            <select className={inputClass} name="theme_serif_font" defaultValue={serifFont}>
              <option value="cormorant">Cormorant (classic serif)</option>
              <option value="bodoni">Bodoni (high-contrast serif)</option>
            </select>
          </label>
          <div className={labelClass}>
            Accent colour
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="theme_accent_hex"
                defaultValue={accentHex || "#b98257"}
                className="h-10 w-14 cursor-pointer rounded-md border border-admin-ink/12 bg-white/70 p-1"
              />
              <label className="inline-flex items-center gap-2 text-xs font-normal text-admin-ink/70">
                <input type="checkbox" name="use_default_accent" defaultChecked={!accentHex} className="size-4 accent-admin-accent" />
                Use default copper
              </label>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <button type="submit" className={saveButton}>
            Save theme
          </button>
        </div>
      </form>

      {/* Page text */}
      <form
        action={updateSiteContent}
        className="mt-6 rounded-md border border-admin-ink/10 bg-admin-surface p-5 sm:p-6"
      >
        <h2 className="text-base font-semibold tracking-tight text-admin-ink">Page text</h2>
        <p className="mt-1 text-sm text-admin-ink/55">
          The main headings and intro text across the site. Leave a field blank to use the default.
        </p>
        <div className="mt-5 grid gap-5">
          {CONTENT_FIELDS.map((field) => (
            <label key={field.key} className={labelClass}>
              {field.label}
              {field.multiline ? (
                <textarea className={textareaClass} name={field.key} defaultValue={content[field.key] ?? field.fallback} />
              ) : (
                <input className={inputClass} name={field.key} defaultValue={content[field.key] ?? field.fallback} />
              )}
            </label>
          ))}
        </div>
        <div className="mt-5">
          <button type="submit" className={saveButton}>
            Save page text
          </button>
        </div>
      </form>
    </div>
  );
}
