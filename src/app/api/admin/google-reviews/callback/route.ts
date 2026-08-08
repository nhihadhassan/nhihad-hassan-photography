import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { completeGoogleBusinessConnection } from "@/lib/google-business";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "nhp_google_reviews_state";

/** Finishes the OAuth flow: exchanges the code, stores the connection, redirects back. */
export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const redirectTo = new URL("/admin/reviews", url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const store = await cookies();
  const expectedState = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);

  if (errorParam) {
    redirectTo.searchParams.set("google_error", errorParam);
    return NextResponse.redirect(redirectTo);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    redirectTo.searchParams.set("google_error", "invalid_state");
    return NextResponse.redirect(redirectTo);
  }

  try {
    const result = await completeGoogleBusinessConnection(code);
    redirectTo.searchParams.set(
      "google_connected",
      result.locationFound ? "1" : "no_location",
    );
  } catch (error) {
    redirectTo.searchParams.set(
      "google_error",
      error instanceof Error ? error.message : "connection_failed",
    );
  }

  return NextResponse.redirect(redirectTo);
}
