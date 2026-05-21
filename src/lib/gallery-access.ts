import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { requireGalleryAccessSecret, hasGalleryAccessSecret } from "@/lib/env";

const COOKIE_PREFIX = "nhp_ga_";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function cookieName(galleryId: string) {
  // gallery IDs are UUIDs; valid cookie name characters.
  return `${COOKIE_PREFIX}${galleryId}`;
}

function base64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function signPayload(galleryId: string, exp: number, secret: string): string {
  return base64url(
    createHmac("sha256", secret).update(`${galleryId}.${exp}`).digest(),
  );
}

export function buildAccessToken(galleryId: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const secret = requireGalleryAccessSecret();
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = signPayload(galleryId, exp, secret);
  return { token: `${exp}.${sig}`, expSeconds: exp };
}

export function verifyAccessToken(galleryId: string, token: string | undefined): boolean {
  if (!token || !hasGalleryAccessSecret()) return false;
  const secret = requireGalleryAccessSecret();

  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;

  const expected = signPayload(galleryId, exp, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function hasGalleryAccess(galleryId: string): Promise<boolean> {
  if (!hasGalleryAccessSecret()) return false;
  const store = await cookies();
  const token = store.get(cookieName(galleryId))?.value;
  return verifyAccessToken(galleryId, token);
}

export async function grantGalleryAccess(
  galleryId: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
) {
  const { token } = buildAccessToken(galleryId, ttlSeconds);
  const store = await cookies();
  store.set({
    name: cookieName(galleryId),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttlSeconds,
  });
}

export async function revokeGalleryAccess(galleryId: string) {
  const store = await cookies();
  store.set({
    name: cookieName(galleryId),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
