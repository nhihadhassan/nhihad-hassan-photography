import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasR2Config } from "@/lib/env";
import { getSignedReadUrl } from "@/lib/r2";

export type PhotoRecord = {
  id: string;
  gallery_id: string;
  section_id: string | null;
  original_key: string;
  web_key: string | null;
  thumbnail_key: string | null;
  filename: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  blur_data_url: string | null;
  sort_order: number;
  is_hidden: boolean;
  created_at: string;
};

export type PhotoWithUrls = PhotoRecord & {
  display_url: string;
  thumbnail_url: string;
};

const PHOTO_COLUMNS =
  "id,gallery_id,section_id,original_key,web_key,thumbnail_key,filename,width,height,size_bytes,mime_type,blur_data_url,sort_order,is_hidden,created_at";

async function attachSignedUrls(photos: PhotoRecord[]): Promise<PhotoWithUrls[]> {
  if (!photos.length) {
    return [];
  }

  if (!hasR2Config()) {
    return photos.map((photo) => ({
      ...photo,
      display_url: "",
      thumbnail_url: "",
    }));
  }

  return Promise.all(
    photos.map(async (photo) => {
      const displayKey = photo.web_key ?? photo.original_key;
      const thumbKey = photo.thumbnail_key ?? photo.web_key ?? photo.original_key;
      const [display_url, thumbnail_url] = await Promise.all([
        getSignedReadUrl(displayKey),
        thumbKey === displayKey ? Promise.resolve("") : getSignedReadUrl(thumbKey),
      ]);
      return {
        ...photo,
        display_url,
        thumbnail_url: thumbnail_url || display_url,
      };
    }),
  );
}

export async function getAdminGalleryPhotos(galleryId: string): Promise<PhotoWithUrls[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return attachSignedUrls((data ?? []) as PhotoRecord[]);
}

export async function getPublicGalleryPhotosBySlug(slug: string): Promise<PhotoWithUrls[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_gallery_photos", {
    requested_slug: slug,
  });

  if (error) {
    return [];
  }

  const photos = ((data ?? []) as Omit<PhotoRecord, "is_hidden">[]).map((p) => ({
    ...p,
    is_hidden: false,
  })) as PhotoRecord[];

  return attachSignedUrls(photos);
}

export async function getPhotoById(photoId: string): Promise<PhotoRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("id", photoId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PhotoRecord | null;
}
