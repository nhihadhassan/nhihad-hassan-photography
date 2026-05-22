import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/share/", "/galleries/"],
      },
    ],
    sitemap: "https://nhihadhassan.ca/sitemap.xml",
  };
}
