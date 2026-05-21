import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "archiver"],
  images: {
    remotePatterns: [
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
