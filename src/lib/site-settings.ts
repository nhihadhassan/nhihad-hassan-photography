import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { brandConfig } from "@/lib/config";

export type InstagramLink = { label: string; href: string };

export type SiteSettings = {
  brandName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string | null;
  instagram: InstagramLink[];
  aboutText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  themeSerifFont: "cormorant" | "bodoni";
  themeAccentHex: string | null;
};

/** Derive a display handle ("@name") from an Instagram profile URL. */
function instagramLabel(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop();
    return path ? `@${path}` : url;
  } catch {
    return url;
  }
}

/**
 * Site-wide brand/contact settings, read from the single site_settings row and
 * merged with the hardcoded brandConfig fallbacks so the site never renders
 * blank if a field is unset. Cached per request.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  let row: Record<string, unknown> | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("site_settings")
      .select(
        "brand_name,tagline,contact_email,contact_phone,instagram_primary,instagram_secondary,about_text,seo_title,seo_description,theme_serif_font,theme_accent_hex",
      )
      .limit(1)
      .maybeSingle();
    row = data ?? null;
  } catch {
    row = null;
  }

  const str = (v: unknown): string | null => {
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s : null;
  };

  const instagram: InstagramLink[] = [];
  const ig1 = str(row?.instagram_primary);
  const ig2 = str(row?.instagram_secondary);
  if (ig1) instagram.push({ label: instagramLabel(ig1), href: ig1 });
  if (ig2) instagram.push({ label: instagramLabel(ig2), href: ig2 });

  return {
    brandName: str(row?.brand_name) ?? brandConfig.name,
    tagline: str(row?.tagline) ?? brandConfig.tagline,
    contactEmail: str(row?.contact_email) ?? brandConfig.contactEmail,
    contactPhone: str(row?.contact_phone),
    instagram: instagram.length ? instagram : [...brandConfig.instagram],
    aboutText: str(row?.about_text),
    seoTitle: str(row?.seo_title),
    seoDescription: str(row?.seo_description),
    themeSerifFont: row?.theme_serif_font === "bodoni" ? "bodoni" : "cormorant",
    themeAccentHex: (() => {
      const hex = str(row?.theme_accent_hex);
      return hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null;
    })(),
  };
});
