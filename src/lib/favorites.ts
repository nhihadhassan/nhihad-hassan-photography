import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSignedReadUrl } from "@/lib/r2";
import { hasR2Config } from "@/lib/env";

export type FavoriteSetSummary = {
  id: string;
  gallery_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  photo_count: number;
};

export type FavoriteSetPhoto = {
  id: string;
  filename: string;
  thumbnail_key: string | null;
  web_key: string | null;
  original_key: string;
  width: number | null;
  height: number | null;
  thumbnail_url: string;
};

export type FavoriteSetDetail = FavoriteSetSummary & {
  photos: FavoriteSetPhoto[];
};

const PHOTO_COLS = "id,filename,thumbnail_key,web_key,original_key,width,height";

export async function getFavoriteSetsForGallery(
  galleryId: string,
): Promise<FavoriteSetSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("favorite_sets")
    .select("id,gallery_id,visitor_name,visitor_email,notes,submitted_at,created_at,favorite_photos(id)")
    .eq("gallery_id", galleryId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  type Row = Omit<FavoriteSetSummary, "photo_count"> & {
    favorite_photos: { id: string }[] | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    gallery_id: row.gallery_id,
    visitor_name: row.visitor_name,
    visitor_email: row.visitor_email,
    notes: row.notes,
    submitted_at: row.submitted_at,
    created_at: row.created_at,
    photo_count: row.favorite_photos?.length ?? 0,
  }));
}

export async function getFavoriteSetDetail(setId: string): Promise<FavoriteSetDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("favorite_sets")
    .select(
      `id,gallery_id,visitor_name,visitor_email,notes,submitted_at,created_at,favorite_photos(photo_id,photos(${PHOTO_COLS}))`,
    )
    .eq("id", setId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  type PhotoRow = {
    id: string;
    filename: string;
    thumbnail_key: string | null;
    web_key: string | null;
    original_key: string;
    width: number | null;
    height: number | null;
  };
  type Joined = {
    id: string;
    gallery_id: string;
    visitor_name: string | null;
    visitor_email: string | null;
    notes: string | null;
    submitted_at: string | null;
    created_at: string;
    favorite_photos: { photo_id: string; photos: PhotoRow | null }[] | null;
  };

  const row = data as unknown as Joined;
  const photos = (row.favorite_photos ?? [])
    .map((fp) => fp.photos)
    .filter((p): p is PhotoRow => Boolean(p));

  const photosWithUrls: FavoriteSetPhoto[] = await Promise.all(
    photos.map(async (p) => {
      const thumbKey = p.thumbnail_key ?? p.web_key ?? p.original_key;
      const thumbnail_url = hasR2Config() ? await getSignedReadUrl(thumbKey) : "";
      return {
        id: p.id,
        filename: p.filename,
        thumbnail_key: p.thumbnail_key,
        web_key: p.web_key,
        original_key: p.original_key,
        width: p.width,
        height: p.height,
        thumbnail_url,
      };
    }),
  );

  return {
    id: row.id,
    gallery_id: row.gallery_id,
    visitor_name: row.visitor_name,
    visitor_email: row.visitor_email,
    notes: row.notes,
    submitted_at: row.submitted_at,
    created_at: row.created_at,
    photo_count: photosWithUrls.length,
    photos: photosWithUrls,
  };
}
