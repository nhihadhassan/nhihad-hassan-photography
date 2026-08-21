/**
 * Whether a remote image URL can safely go through the Next image optimizer.
 *
 * The distinction that matters is *stability*, not public-vs-private. The
 * optimizer caches by full URL, and a presigned R2 URL carries a fresh
 * signature every time it is generated -- so every render would produce a new
 * cache key, miss, and re-fetch and re-encode the original. That is slower and
 * far more expensive than serving the original directly, which is why signed
 * URLs opt out.
 *
 * A stable URL (a local asset, a configured R2 public base, or a Pixieset CDN
 * URL) has none of that problem and should be optimized.
 *
 * Setting R2_PUBLIC_BASE_URL is what moves public portfolio, cover and journal
 * imagery from the first category into the second -- see getPublicImageUrl in
 * lib/r2.ts. Private client-gallery media stays signed by design and is
 * correctly left unoptimized.
 */
export function isSignedImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // AWS SigV4, which R2's S3-compatible presigner emits.
  return url.includes("X-Amz-Signature=");
}

/** Value for next/image's `unoptimized` prop. */
export function shouldSkipOptimization(url: string | null | undefined): boolean {
  return isSignedImageUrl(url);
}
