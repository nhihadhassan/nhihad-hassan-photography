"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/password";
import { slugify } from "@/lib/utils";

const gallerySchema = z.object({
  title: z.string().min(2, "Title is required."),
  // Optional: when omitted (new gallery form), it is derived from the title.
  slug: z.string().optional(),
  client_name: z.string().optional(),
  client_email: z.string().email("Enter a valid client email.").optional().or(z.literal("")),
  event_date: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  cover_image_url: z.string().url("Enter a valid hosted image URL.").optional().or(z.literal("")),
  cover_image_alt: z.string().optional(),
  cover_focal_x: z.coerce.number().min(0).max(100).optional(),
  cover_focal_y: z.coerce.number().min(0).max(100).optional(),
  cover_layout: z.enum(["center", "left", "bottom", "split"]).optional(),
  expires_at: z.string().optional(),
  download_quality: z.enum(["web", "full"]),
  deposit_status: z.enum(["not_requested", "requested", "received", "balance_due", "paid"]).default("not_requested"),
  payment_notes: z.string().optional(),
});

export type GalleryFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof gallerySchema>, string[]>>;
};

const emptyToNull = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const dateToNull = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const dateTimeToNull = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? new Date(trimmed).toISOString() : null;
};

function parseGalleryForm(formData: FormData) {
  const parsed = gallerySchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    client_name: formData.get("client_name") || undefined,
    client_email: formData.get("client_email") || undefined,
    event_date: formData.get("event_date") || undefined,
    location: formData.get("location") || undefined,
    description: formData.get("description") || undefined,
    cover_image_url: formData.get("cover_image_url") || undefined,
    cover_image_alt: formData.get("cover_image_alt") || undefined,
    cover_focal_x: formData.get("cover_focal_x") || undefined,
    cover_focal_y: formData.get("cover_focal_y") || undefined,
    cover_layout: formData.get("cover_layout") || undefined,
    expires_at: formData.get("expires_at") || undefined,
    download_quality: formData.get("download_quality"),
    deposit_status: formData.get("deposit_status") || undefined,
    payment_notes: formData.get("payment_notes") || undefined,
  });

  if (!parsed.success) {
    return { data: null, errors: parsed.error.flatten().fieldErrors };
  }

  const slug = slugify(parsed.data.slug || parsed.data.title);

  return {
    data: {
      title: parsed.data.title.trim(),
      slug,
      client_name: emptyToNull(parsed.data.client_name),
      client_email: emptyToNull(parsed.data.client_email),
      event_date: dateToNull(parsed.data.event_date),
      location: emptyToNull(parsed.data.location),
      description: emptyToNull(parsed.data.description),
      cover_image_url: emptyToNull(parsed.data.cover_image_url),
      cover_image_alt: emptyToNull(parsed.data.cover_image_alt),
      cover_focal_x: Math.round(parsed.data.cover_focal_x ?? 50),
      cover_focal_y: Math.round(parsed.data.cover_focal_y ?? 50),
      cover_layout: parsed.data.cover_layout ?? "center",
      expires_at: dateTimeToNull(parsed.data.expires_at),
      is_public: formData.get("is_public") === "on",
      is_published: formData.get("is_published") === "on",
      download_enabled: formData.get("download_enabled") === "on",
      download_quality: parsed.data.download_quality,
      watermark_enabled: formData.get("watermark_enabled") === "on",
      deposit_status: parsed.data.deposit_status,
      payment_notes: emptyToNull(parsed.data.payment_notes),
    },
    errors: null,
  };
}

/**
 * Returns the password mutation for this form submission:
 * - { set: { hash, plain } } — admin entered a new password
 * - { remove: true } — admin checked "Remove password"
 * - null — no change (don't touch password columns)
 *
 * Both the hash and the plain-text value are returned so callers can
 * persist password_plain for gallery invite emails.
 */
async function extractPasswordChange(
  formData: FormData,
): Promise<{ set: { hash: string; plain: string } } | { remove: true } | null> {
  if (formData.get("remove_password") === "on") {
    return { remove: true };
  }
  const raw = formData.get("password");
  if (typeof raw !== "string") return null;
  const plain = raw.trim();
  if (!plain) return null;
  if (plain.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }
  const hash = await hashPassword(plain);
  return { set: { hash, plain } };
}

/**
 * Returns the download PIN mutation for this form submission:
 * - { set: hash } — admin entered a new PIN
 * - { remove: true } — admin checked "Remove download PIN"
 * - null — no change
 */
async function extractDownloadPinChange(
  formData: FormData,
): Promise<{ set: string } | { remove: true } | null> {
  if (formData.get("remove_download_pin") === "on") {
    return { remove: true };
  }
  const raw = formData.get("download_pin");
  if (typeof raw !== "string") return null;
  const pin = raw.trim();
  if (!pin) return null;
  if (pin.length < 4) {
    throw new Error("Download PIN must be at least 4 characters.");
  }
  const hash = await hashPassword(pin);
  return { set: hash };
}

export async function createGallery(
  _previousState: GalleryFormState,
  formData: FormData,
): Promise<GalleryFormState> {
  await requireAdmin();
  const parsed = parseGalleryForm(formData);

  if (!parsed.data) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.errors,
    };
  }

  let passwordChange: Awaited<ReturnType<typeof extractPasswordChange>>;
  try {
    passwordChange = await extractPasswordChange(formData);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not set password.",
    };
  }

  let pinChange: Awaited<ReturnType<typeof extractDownloadPinChange>>;
  try {
    pinChange = await extractDownloadPinChange(formData);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not set download PIN.",
    };
  }

  const limitRaw = String(formData.get("download_limit") ?? "").trim();
  const downloadLimit = limitRaw && Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : null;

  const insertPayload: Record<string, unknown> = { ...parsed.data, download_limit: downloadLimit };
  if (passwordChange && "set" in passwordChange) {
    insertPayload.password_hash = passwordChange.set.hash;
    insertPayload.password_plain = passwordChange.set.plain;
  }
  if (pinChange && "set" in pinChange) {
    insertPayload.download_pin_hash = pinChange.set;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("galleries").insert(insertPayload).select("id").single();

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "That slug is already in use." : error.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/galleries");
  revalidatePath("/");
  revalidatePath("/galleries");
  redirect(`/admin/galleries/${data.id}`);
}

export async function updateGallery(
  _previousState: GalleryFormState,
  formData: FormData,
): Promise<GalleryFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = parseGalleryForm(formData);

  if (!id) {
    return {
      status: "error",
      message: "Missing gallery id.",
    };
  }

  if (!parsed.data) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: parsed.errors,
    };
  }

  let passwordChange: Awaited<ReturnType<typeof extractPasswordChange>>;
  try {
    passwordChange = await extractPasswordChange(formData);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not set password.",
    };
  }

  let pinChange: Awaited<ReturnType<typeof extractDownloadPinChange>>;
  try {
    pinChange = await extractDownloadPinChange(formData);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not set download PIN.",
    };
  }

  const limitRaw = String(formData.get("download_limit") ?? "").trim();
  const downloadLimit = limitRaw && Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : null;

  const updatePayload: Record<string, unknown> = {
    ...parsed.data,
    download_limit: downloadLimit,
    updated_at: new Date().toISOString(),
  };
  if (passwordChange && "set" in passwordChange) {
    updatePayload.password_hash = passwordChange.set.hash;
    updatePayload.password_plain = passwordChange.set.plain;
  } else if (passwordChange && "remove" in passwordChange) {
    updatePayload.password_hash = null;
    updatePayload.password_plain = null;
  }
  if (pinChange && "set" in pinChange) {
    updatePayload.download_pin_hash = pinChange.set;
  } else if (pinChange && "remove" in pinChange) {
    updatePayload.download_pin_hash = null;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("galleries").update(updatePayload).eq("id", id);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "That slug is already in use." : error.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/galleries");
  revalidatePath("/");
  revalidatePath("/galleries");
  revalidatePath(`/admin/galleries/${id}`);
  revalidatePath(`/galleries/${parsed.data.slug}`);

  const passwordNote =
    passwordChange && "set" in passwordChange
      ? " Password updated."
      : passwordChange && "remove" in passwordChange
        ? " Password removed."
        : "";

  return {
    status: "success",
    message: `Gallery saved.${passwordNote}`,
  };
}

export async function toggleGalleryPublished(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nextValue = formData.get("next") === "true";
  const supabase = await createSupabaseServerClient();
  await supabase.from("galleries").update({ is_published: nextValue }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/admin/galleries");
  revalidatePath("/");
  revalidatePath("/galleries");
}

export async function toggleGalleryArchived(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nextValue = formData.get("next") === "true";
  const supabase = await createSupabaseServerClient();
  await supabase.from("galleries").update({ is_archived: nextValue }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/admin/galleries");
  revalidatePath("/");
  revalidatePath("/galleries");
}

export async function deleteGallery(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createSupabaseServerClient();
  await supabase.from("galleries").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/admin/galleries");
  revalidatePath("/");
  revalidatePath("/galleries");
  redirect("/admin/galleries");
}

