import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { requireGoogleBusinessConfig, hasGoogleBusinessConfig } from "@/lib/env";
import { siteUrl } from "@/lib/seo";

/**
 * Google Business Profile OAuth + Reviews sync.
 *
 * Scope: https://www.googleapis.com/auth/business.manage
 *
 * Reviews live on the legacy "Google My Business API v4"
 * (mybusiness.googleapis.com/v4). The newer split APIs (Account
 * Management, Business Information) replaced everything except reviews,
 * which Google has kept on v4 but gated behind manual approval ("Basic" or
 * higher API access via https://developers.google.com/my-business/content/prereqs).
 * A brand-new Cloud project almost certainly does NOT have this access by
 * default; calls will 403 until Google grants it. Every call here surfaces
 * that error text as-is so the admin UI can show it verbatim.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ACCOUNTS_URL = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
const LOCATIONS_URL = (accountName: string) =>
  `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title`;
const REVIEWS_URL = (locationName: string, pageToken?: string) =>
  `https://mybusiness.googleapis.com/v4/${locationName}/reviews${pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : ""}`;
const REVIEW_REPLY_URL = (reviewName: string) => `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

const SCOPE = "https://www.googleapis.com/auth/business.manage";

export type GoogleBusinessConnection = {
  id: string;
  account_name: string | null;
  location_name: string | null;
  location_title: string | null;
  connected_email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  connected_at: string | null;
  last_synced_at: string | null;
  last_sync_error: string | null;
};

export type GoogleReview = {
  reviewId: string;
  reviewer?: { displayName?: string };
  starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
  name: string; // accounts/*/locations/*/reviews/*
};

const STAR_TO_NUMBER: Record<NonNullable<GoogleReview["starRating"]>, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export function googleReviewRating(review: GoogleReview): number {
  return review.starRating ? STAR_TO_NUMBER[review.starRating] : 5;
}

function redirectUri() {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl).replace(/\/$/, "");
  return `${origin}/api/admin/google-reviews/callback`;
}

export { redirectUri as googleBusinessRedirectUri };

/** Whether the two OAuth client env vars are present (does not mean a connection exists). */
export function isGoogleBusinessConfigured() {
  return hasGoogleBusinessConfig();
}

export function buildGoogleAuthUrl(state: string) {
  const { clientId } = requireGoogleBusinessConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPE,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret } = requireGoogleBusinessConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error_description || body.error || "Token exchange failed.");
  }
  return body as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
  };
}

async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = requireGoogleBusinessConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error_description || body.error || "Token refresh failed.");
  }
  return body as { access_token: string; expires_in: number };
}

function decodeEmailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return typeof json.email === "string" ? json.email : null;
  } catch {
    return null;
  }
}

export async function getGoogleBusinessConnection(): Promise<GoogleBusinessConnection | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin.from("google_business_connection").select("*").limit(1).maybeSingle();
  return (data as GoogleBusinessConnection | null) ?? null;
}

/** Exchanges the OAuth code, picks the first available location, and stores the connection. */
export async function completeGoogleBusinessConnection(code: string) {
  const tokens = await exchangeCodeForTokens(code);
  const email = decodeEmailFromIdToken(tokens.id_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const accounts = await fetchAccounts(tokens.access_token);
  const account = accounts[0];
  let locationName: string | null = null;
  let locationTitle: string | null = null;

  if (account) {
    const locations = await fetchLocations(tokens.access_token, account.name);
    const location = locations[0];
    if (location) {
      locationName = location.name;
      locationTitle = location.title ?? null;
    }
  }

  const admin = getServiceRoleSupabaseClient();
  const payload = {
    account_name: account?.name ?? null,
    location_name: locationName,
    location_title: locationTitle,
    connected_email: email,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expires_at: expiresAt,
    connected_at: new Date().toISOString(),
    last_synced_at: null,
    last_sync_error: null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin.from("google_business_connection").select("id,refresh_token").limit(1).maybeSingle();
  if (existing?.id) {
    // Google only returns a refresh_token on the first consent; keep the
    // existing one on reconnect unless a new one was issued.
    await admin
      .from("google_business_connection")
      .update({ ...payload, refresh_token: payload.refresh_token ?? existing.refresh_token })
      .eq("id", existing.id);
  } else {
    await admin.from("google_business_connection").insert(payload);
  }

  return { locationTitle, locationFound: Boolean(locationName) };
}

export async function disconnectGoogleBusiness() {
  const admin = getServiceRoleSupabaseClient();
  await admin.from("google_business_connection").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

/** Returns a valid access token, refreshing and persisting it first if it's expired or missing. */
async function getValidAccessToken(connection: GoogleBusinessConnection): Promise<string> {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  const stillValid = connection.access_token && expiresAt - Date.now() > 60_000;
  if (stillValid) return connection.access_token!;

  if (!connection.refresh_token) {
    throw new Error("No refresh token on file. Reconnect Google Business Profile.");
  }

  const refreshed = await refreshAccessToken(connection.refresh_token);
  const admin = getServiceRoleSupabaseClient();
  await admin
    .from("google_business_connection")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  return refreshed.access_token;
}

async function googleGet<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await res.json();
  if (!res.ok) {
    const message = body.error?.message || `Google API request failed (${res.status}).`;
    throw new Error(message);
  }
  return body as T;
}

export async function fetchAccounts(accessToken: string) {
  const body = await googleGet<{ accounts?: { name: string; accountName?: string }[] }>(
    ACCOUNTS_URL,
    accessToken,
  );
  return body.accounts ?? [];
}

export async function fetchLocations(accessToken: string, accountName: string) {
  const body = await googleGet<{ locations?: { name: string; title?: string }[] }>(
    LOCATIONS_URL(accountName),
    accessToken,
  );
  return body.locations ?? [];
}

async function fetchReviewsPage(accessToken: string, locationName: string, pageToken?: string) {
  return googleGet<{ reviews?: GoogleReview[]; nextPageToken?: string; averageRating?: number; totalReviewCount?: number }>(
    REVIEWS_URL(locationName, pageToken),
    accessToken,
  );
}

/** Fetches every review for the connected location, paging through all results. */
export async function syncReviewsFromGoogle(connection: GoogleBusinessConnection): Promise<GoogleReview[]> {
  if (!connection.location_name) {
    throw new Error("No location connected yet.");
  }
  const accessToken = await getValidAccessToken(connection);

  const all: GoogleReview[] = [];
  let pageToken: string | undefined;
  do {
    const page = await fetchReviewsPage(accessToken, connection.location_name, pageToken);
    all.push(...(page.reviews ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  return all;
}

export async function replyToGoogleReview(reviewName: string, comment: string) {
  const connection = await getGoogleBusinessConnection();
  if (!connection) throw new Error("Google Business Profile is not connected.");
  const accessToken = await getValidAccessToken(connection);

  const res = await fetch(REVIEW_REPLY_URL(reviewName), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error?.message || "Could not post the reply to Google.");
  }
  return body as { comment: string; updateTime: string };
}
