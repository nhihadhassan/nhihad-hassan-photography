"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONTENT_FIELDS } from "@/lib/site-content";

const clean = (value: FormDataEntryValue | null) => {
  const v = typeof value === "string" ? value.trim() : "";
  return v ? v : null;
};

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const payload = {
    brand_name: clean(formData.get("brand_name")) ?? "Nhihad Hassan Photography",
    tagline: clean(formData.get("tagline")),
    contact_email: clean(formData.get("contact_email")),
    contact_phone: clean(formData.get("contact_phone")),
    instagram_primary: clean(formData.get("instagram_primary")),
    instagram_secondary: clean(formData.get("instagram_secondary")),
    about_text: clean(formData.get("about_text")),
    seo_title: clean(formData.get("seo_title")),
    seo_description: clean(formData.get("seo_description")),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("site_settings").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("site_settings").insert(payload);
  }

  revalidatePath("/", "layout");
}

export async function updateSiteContent(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const now = new Date().toISOString();
  const rows = CONTENT_FIELDS.map((field) => ({
    key: field.key,
    value: clean(formData.get(field.key)),
    updated_at: now,
  }));

  await supabase.from("site_content").upsert(rows, { onConflict: "key" });
  revalidatePath("/", "layout");
}
