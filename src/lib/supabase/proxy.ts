import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseBrowserConfig, requireSupabaseBrowserConfig } from "@/lib/env";
import { ADMIN_HINT_COOKIE, ADMIN_HINT_MAX_AGE } from "@/lib/auth-hint";

/**
 * Refreshes the Supabase session for admin requests and writes any rotated
 * tokens onto the response.
 *
 * This is the *only* place a refresh is allowed to be persisted. Server
 * Components cannot set cookies, so a rotation that happened during a render
 * silently consumed the refresh token without ever handing the new one back to
 * the browser -- the next request then replayed a spent token and Supabase
 * answered "Invalid Refresh Token: Already Used". Running the refresh here,
 * before the render, fixes that: the proxy can and does write the new cookies.
 *
 * `getUser()` rather than `getClaims()` on purpose. `getClaims()` can verify an
 * asymmetrically-signed JWT locally and return without ever refreshing, which
 * would leave the rotation to happen later during a render -- exactly the case
 * above. `getUser()` always goes through the session path, so if a refresh is
 * due it happens here.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasSupabaseBrowserConfig()) {
    return supabaseResponse;
  }

  const { url, anonKey } = requireSupabaseBrowserConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Re-arm (or clear) the public-site hint cookie. Signed-in here means "has a
  // Supabase session", not "is an admin" -- the role check stays server-side in
  // /api/admin/me. See lib/auth-hint.ts.
  if (user) {
    supabaseResponse.cookies.set({
      name: ADMIN_HINT_COOKIE,
      value: "1",
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_HINT_MAX_AGE,
    });
  } else if (request.cookies.has(ADMIN_HINT_COOKIE)) {
    supabaseResponse.cookies.set({
      name: ADMIN_HINT_COOKIE,
      value: "",
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return supabaseResponse;
}
