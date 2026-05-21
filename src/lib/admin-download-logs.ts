import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DownloadLogRow = {
  id: string;
  gallery_id: string;
  gallery_title: string | null;
  gallery_slug: string | null;
  accessed_at: string;
  success: boolean | null;
  reason: string | null;
  scope: string;
  photo_count: number;
  ip_hash: string | null;
  user_agent: string | null;
};

type RawJoinRow = {
  id: string;
  gallery_id: string;
  accessed_at: string;
  success: boolean | null;
  reason: string | null;
  scope: string;
  photo_count: number;
  ip_hash: string | null;
  user_agent: string | null;
  galleries: { title: string; slug: string } | null;
};

const SELECT =
  "id,gallery_id,accessed_at,success,reason,scope,photo_count,ip_hash,user_agent,galleries(title,slug)";

export async function getAdminDownloadLogs(options: {
  galleryId?: string | null;
  limit?: number;
}): Promise<DownloadLogRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("gallery_download_logs")
    .select(SELECT)
    .order("accessed_at", { ascending: false })
    .limit(options.limit ?? 200);
  if (options.galleryId) query = query.eq("gallery_id", options.galleryId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawJoinRow[]).map((row) => ({
    id: row.id,
    gallery_id: row.gallery_id,
    gallery_title: row.galleries?.title ?? null,
    gallery_slug: row.galleries?.slug ?? null,
    accessed_at: row.accessed_at,
    success: row.success,
    reason: row.reason,
    scope: row.scope,
    photo_count: row.photo_count,
    ip_hash: row.ip_hash,
    user_agent: row.user_agent,
  }));
}

export async function getAdminDownloadLogStats() {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const [total, success, failure] = await Promise.all([
    supabase
      .from("gallery_download_logs")
      .select("id", { count: "exact", head: true })
      .gte("accessed_at", since),
    supabase
      .from("gallery_download_logs")
      .select("id", { count: "exact", head: true })
      .eq("success", true)
      .gte("accessed_at", since),
    supabase
      .from("gallery_download_logs")
      .select("id", { count: "exact", head: true })
      .eq("success", false)
      .gte("accessed_at", since),
  ]);
  return {
    total: total.count ?? 0,
    success: success.count ?? 0,
    failure: failure.count ?? 0,
  };
}
