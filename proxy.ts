import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Admin surfaces only. Public pages have no session to refresh, so running
   * the Supabase round-trip there added latency to every visitor's request for
   * no benefit. Server Actions posted from an admin page target that page's own
   * path, so they are covered by `/admin/:path*`.
   */
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
