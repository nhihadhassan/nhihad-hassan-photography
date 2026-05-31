import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Cookie-less anon Supabase client for PUBLIC reads (RLS still applies). Unlike
 * createSupabaseServerClient it never touches cookies(), so pages that only read
 * public data (settings, content, portfolio) can stay statically rendered / ISR
 * instead of being forced dynamic.
 */
export function getPublicSupabaseClient(): SupabaseClient | null {
  if (cached) return cached;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
