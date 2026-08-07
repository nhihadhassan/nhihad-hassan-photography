import "server-only";
import { siteUrl } from "@/lib/seo";

/**
 * The one place that decides what "the site" means for links inside agreement
 * emails. NEXT_PUBLIC_SITE_URL is optional and, in this project, has never
 * actually been set anywhere (not in .env.example, not in Vercel) — every
 * deployment already falls through to the siteUrl constant below. It's kept
 * as an override for a future staging environment, but validated so a bad
 * value can never leak into a client-facing email: reject anything that
 * isn't an absolute https production origin, or that points at localhost, a
 * *.vercel.app preview, or an /admin path.
 */
function resolveOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!configured) return siteUrl;
  try {
    const parsed = new URL(configured);
    const looksSafe =
      parsed.protocol === "https:" &&
      !/localhost|127\.0\.0\.1|\.vercel\.app$/i.test(parsed.hostname) &&
      !/\/admin(\/|$)/i.test(parsed.pathname);
    return looksSafe ? configured : siteUrl;
  } catch {
    return siteUrl;
  }
}

/** The public, token-gated URL a client uses to view and sign an agreement. Never an /admin path. */
export function agreementSignUrl(token: string): string {
  return `${resolveOrigin()}/agreement/${token}`;
}

/** The admin's own contract list, for internal notifications only — never used as a client-facing link. */
export function adminAgreementsUrl(): string {
  return `${resolveOrigin()}/admin/agreements`;
}
