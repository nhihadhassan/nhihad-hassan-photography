import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildGoogleAuthUrl, isGoogleBusinessConfigured } from "@/lib/google-business";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "nhp_google_reviews_state";

/** Starts the OAuth flow: redirects to Google's consent screen. */
export async function GET(request: Request) {
  await requireAdmin();

  if (!isGoogleBusinessConfigured()) {
    const url = new URL("/admin/reviews", request.url);
    url.searchParams.set("google_error", "not_configured");
    return NextResponse.redirect(url);
  }

  const state = randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
