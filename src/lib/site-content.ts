import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContentField = {
  key: string;
  label: string;
  fallback: string;
  multiline?: boolean;
};

/**
 * The set of page strings that are editable from /admin/settings. Each falls
 * back to the text currently hardcoded on the page, so an unset key renders
 * exactly as before. Add a field here + reference getContent(key) on the page
 * to make another string editable.
 */
export const CONTENT_FIELDS: ContentField[] = [
  {
    key: "home.hero.tagline",
    label: "Home · tagline strip",
    fallback: "Toronto wedding, engagement and event photographer.",
  },
  {
    key: "home.selected.heading",
    label: "Home · selected work heading",
    fallback: "Built around the photograph first.",
  },
  {
    key: "home.about.heading",
    label: "Home · about heading",
    fallback: "Photographs that keep the atmosphere intact.",
  },
  {
    key: "home.about.body",
    label: "Home · about body",
    fallback:
      "I'm a Toronto photographer working across weddings, cultural events, couples sessions, portraits, and nightlife. The approach holds wherever I point the camera: work with whatever the moment gives, then make pictures that hold.",
    multiline: true,
  },
  {
    key: "contact.hero.heading",
    label: "Contact · heading",
    fallback: "Tell me about the day you want remembered.",
  },
  {
    key: "contact.hero.subtext",
    label: "Contact · subtext",
    fallback:
      "Tell me the date, the location, and what you want the photos to feel like. If email is easier, that works too.",
    multiline: true,
  },
];

const FALLBACKS: Record<string, string> = Object.fromEntries(
  CONTENT_FIELDS.map((f) => [f.key, f.fallback]),
);

/** All site_content rows as a key→value map. Cached per request. */
export const getAllContent = cache(async (): Promise<Record<string, string>> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("site_content").select("key,value");
    const map: Record<string, string> = {};
    for (const r of data ?? []) {
      if (r.key && typeof r.value === "string" && r.value.trim()) {
        map[r.key as string] = r.value as string;
      }
    }
    return map;
  } catch {
    return {};
  }
});

/** Editable string for a key, falling back to the registry default. */
export async function getContent(key: string, fallback?: string): Promise<string> {
  const all = await getAllContent();
  return all[key] ?? fallback ?? FALLBACKS[key] ?? "";
}
