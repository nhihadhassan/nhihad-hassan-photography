import type { NextConfig } from "next";

/**
 * Host of the R2 public base, when one is configured.
 *
 * Public portfolio, cover and journal imagery is currently served as 7-day
 * presigned URLs on the raw S3 endpoint, which cannot be run through the Next
 * image optimizer: the signature changes on every render, so each request
 * would be a fresh cache key and a fresh re-encode of the original. Pointing
 * R2_PUBLIC_BASE_URL at a public bucket URL (an r2.dev address or a custom
 * domain) makes those URLs stable, at which point lib/image-urls.ts starts
 * optimizing them automatically. This keeps the allowed host in step with that
 * env var so the two can never disagree.
 */
function r2PublicHost(): string | null {
  const raw = process.env.R2_PUBLIC_BASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "archiver", "node-ical"],
  async redirects() {
    // /investment was merged into /pricing.
    return [
      {
        source: "/investment",
        destination: "/pricing",
        permanent: true,
      },
    ];
  },
  images: {
    qualities: [75, 92],
    remotePatterns: [
      ...(r2PublicHost()
        ? [{ protocol: "https" as const, hostname: r2PublicHost() as string }]
        : []),
      {
        protocol: "https",
        hostname: "images-pw.pixieset.com",
      },
      {
        protocol: "https",
        hostname: "*.pixieset.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
