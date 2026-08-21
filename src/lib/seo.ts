import type { Metadata } from "next";

/**
 * The one canonical production origin.
 *
 * The apex domain 307-redirects to www on Vercel, so www is what search
 * engines and shared links should always see. Everything that emits an
 * absolute URL -- metadata, canonical tags, the sitemap, robots, structured
 * data, generated client links -- reads this rather than repeating a literal,
 * which is how the apex and www forms drifted apart in the first place.
 */
export const siteUrl = "https://www.nhihadhassan.ca";

export const defaultOgImage = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Nhihad Hassan Photography",
};

export const defaultTwitterImage = {
  url: "/twitter-image.png",
  width: 1200,
  height: 630,
  alt: "Nhihad Hassan Photography",
};

/** Absolute URL for a route path, e.g. `/pricing` -> `https://www.…/pricing`. */
export function canonicalUrl(path: string): string {
  if (!path || path === "/") return siteUrl;
  const clean = `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  return `${siteUrl}${clean}`;
}

/**
 * Applies the shared social images and, when given a `path`, that route's own
 * canonical and OpenGraph URL.
 *
 * `path` is not optional by accident: metadata in the App Router is inherited,
 * so a page that sets no canonical silently adopts its parent's. The root
 * layout used to declare `canonical: "/"`, which meant every subpage told
 * search engines it was a duplicate of the homepage. Pages now state their own
 * path, and the root layout declares none, so the worst case for a page that
 * forgets is no canonical at all rather than a wrong one.
 */
export function withDefaultSocialImages(metadata: Metadata, path?: string): Metadata {
  return {
    ...metadata,
    ...(path
      ? { alternates: { ...metadata.alternates, canonical: canonicalUrl(path) } }
      : {}),
    openGraph: {
      ...metadata.openGraph,
      ...(path ? { url: canonicalUrl(path) } : {}),
      images: metadata.openGraph?.images ?? [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      ...metadata.twitter,
      images: metadata.twitter?.images ?? [defaultTwitterImage],
    },
  };
}

/**
 * Metadata for a token-scoped private page -- a client's contract, invoice,
 * questionnaire, review request, quote, curated share link, booking hub or
 * delivered gallery.
 *
 * These must never be indexed, and they must not inherit a canonical either:
 * pointing a private client URL at the homepage is both wrong and a way for
 * such a URL to end up in a search index in the first place.
 */
export function privatePageMetadata(metadata: Metadata = {}): Metadata {
  return {
    ...metadata,
    alternates: { ...metadata.alternates, canonical: undefined },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
  };
}
