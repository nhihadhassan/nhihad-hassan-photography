"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteManyFromR2 } from "@/lib/r2";

function revalidateGalleryPhotos(galleryId: string, slug?: string) {
  revalidatePath(`/admin/galleries/${galleryId}`);
  revalidatePath(`/admin/galleries/${galleryId}/photos`);
  if (slug) {
    revalidatePath(`/galleries/${slug}`);
    revalidatePath(`/galleries/${slug}/view`);
  }
}

async function getGallerySlug(galleryId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("galleries")
    .select("slug")
    .eq("id", galleryId)
    .maybeSingle();
  return data?.slug as string | undefined;
}

export async function deletePhoto(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const galleryId = String(formData.get("gallery_id") ?? "");
  if (!id || !galleryId) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { data: photo } = await supabase
    .from("photos")
    .select("id,original_key,web_key,thumbnail_key")
    .eq("id", id)
    .maybeSingle();

  if (!photo) {
    return;
  }

  await supabase.from("photos").delete().eq("id", id);

  const keys = [photo.original_key, photo.web_key, photo.thumbnail_key].filter(
    (key): key is string => Boolean(key),
  );

  await deleteManyFromR2(keys).catch(() => undefined);

  const slug = await getGallerySlug(galleryId);
  revalidateGalleryPhotos(galleryId, slug);
}

export async function togglePhotoHidden(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const galleryId = String(formData.get("gallery_id") ?? "");
  const next = formData.get("next") === "true";
  if (!id || !galleryId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("photos").update({ is_hidden: next }).eq("id", id);

  const slug = await getGallerySlug(galleryId);
  revalidateGalleryPhotos(galleryId, slug);
}

export async function setGalleryCover(formData: FormData) {
  await requireAdmin();
  const photoId = String(formData.get("photo_id") ?? "");
  const galleryId = String(formData.get("gallery_id") ?? "");
  if (!photoId || !galleryId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("galleries")
    .update({ cover_photo_id: photoId, updated_at: new Date().toISOString() })
    .eq("id", galleryId);

  const slug = await getGallerySlug(galleryId);
  revalidateGalleryPhotos(galleryId, slug);
}

export async function clearGalleryCover(formData: FormData) {
  await requireAdmin();
  const galleryId = String(formData.get("gallery_id") ?? "");
  if (!galleryId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("galleries")
    .update({ cover_photo_id: null, updated_at: new Date().toISOString() })
    .eq("id", galleryId);

  const slug = await getGallerySlug(galleryId);
  revalidateGalleryPhotos(galleryId, slug);
}

export async function movePhoto(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const galleryId = String(formData.get("gallery_id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || !galleryId || (direction !== "up" && direction !== "down")) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { data: photos } = await supabase
    .from("photos")
    .select("id,sort_order")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!photos?.length) {
    return;
  }

  const index = photos.findIndex((p) => p.id === id);
  if (index === -1) {
    return;
  }

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= photos.length) {
    return;
  }

  const a = photos[index];
  const b = photos[swapIndex];

  await supabase.from("photos").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("photos").update({ sort_order: a.sort_order }).eq("id", b.id);

  const slug = await getGallerySlug(galleryId);
  revalidateGalleryPhotos(galleryId, slug);
}
