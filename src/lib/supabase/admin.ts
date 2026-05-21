import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  env,
  hasServiceRoleKey,
  requireServiceRoleKey,
  requireSupabaseBrowserConfig,
} from "@/lib/env";

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client authenticated with the project's service-role key.
 * This bypasses RLS and should ONLY be used from server code that has already
 * verified the caller's permission via another mechanism (e.g. the signed
 * gallery-access cookie). Never expose this client or its key to the browser.
 */
export function getServiceRoleSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const serviceKey = requireServiceRoleKey();
  const { url } = requireSupabaseBrowserConfig();
  cachedClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

export function hasServiceRoleClient() {
  return hasServiceRoleKey() && Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
}
