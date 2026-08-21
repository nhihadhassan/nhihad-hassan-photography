import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { requireSupabaseBrowserConfig } from "@/lib/env";

/**
 * The Supabase client for the current request.
 *
 * `cache()` is load-bearing, not an optimisation. Every `createServerClient`
 * builds its own GoTrue instance, and GoTrue only de-duplicates a token
 * refresh *within* one instance. Building a fresh client per call site meant a
 * single admin render could fire several concurrent refreshes with the same
 * refresh token, and Supabase rejects the replays with "Invalid Refresh Token:
 * Already Used". One client per request means at most one in-flight refresh.
 */
export const createSupabaseServerClient = cache(async () => {
  const { url, anonKey } = requireSupabaseBrowserConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies, so a rotation that happens
          // mid-render cannot be persisted here. That is safe because the proxy
          // (proxy.ts -> lib/supabase/proxy.ts) runs first on admin routes and
          // owns refreshing, and it *can* write the rotated cookies onto the
          // response. Route handlers and server actions reaching this branch
          // do persist normally.
        }
      },
    },
  });
});
