import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseBrowserConfig } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseBrowserConfig();
  return createBrowserClient(url, anonKey);
}

