import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccessLogRow = {
  id: string;
  gallery_id: string;
  gallery_title: string | null;
  gallery_slug: string | null;
  accessed_at: string;
  success: boolean | null;
  reason: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
};

type RawJoinRow = {
  id: string;
  gallery_id: string;
  accessed_at: string;
  success: boolean | null;
  reason: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  galleries: { title: string; slug: string } | null;
};

const SELECT =
  "id,gallery_id,accessed_at,success,reason,ip_hash,user_agent,visitor_name,visitor_email,galleries(title,slug)";

export async function getAdminAccessLogs(options: {
  galleryId?: string | null;
  limit?: number;
}): Promise<AccessLogRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("gallery_access_logs")
    .select(SELECT)
    .order("accessed_at", { ascending: false })
    .limit(options.limit ?? 200);

  if (options.galleryId) {
    query = query.eq("gallery_id", options.galleryId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as RawJoinRow[]).map((row) => ({
    id: row.id,
    gallery_id: row.gallery_id,
    gallery_title: row.galleries?.title ?? null,
    gallery_slug: row.galleries?.slug ?? null,
    accessed_at: row.accessed_at,
    success: row.success,
    reason: row.reason,
    ip_hash: row.ip_hash,
    user_agent: row.user_agent,
    visitor_name: row.visitor_name,
    visitor_email: row.visitor_email,
  }));
}

export async function getAdminAccessLogStats() {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const [total, success, failure] = await Promise.all([
    supabase
      .from("gallery_access_logs")
      .select("id", { count: "exact", head: true })
      .gte("accessed_at", since),
    supabase
      .from("gallery_access_logs")
      .select("id", { count: "exact", head: true })
      .eq("success", true)
      .gte("accessed_at", since),
    supabase
      .from("gallery_access_logs")
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

export async function getAdminGalleriesForFilter() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("galleries")
    .select("id,title,slug")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as { id: string; title: string; slug: string }[];
}
