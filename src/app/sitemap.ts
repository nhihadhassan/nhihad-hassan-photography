import type { MetadataRoute } from "next";
import { categoryLabels } from "@/data/photography";
import { journalPosts } from "@/data/journal";

const SITE_URL = "https://nhihadhassan.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/portfolio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/galleries`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/journal`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = Object.keys(categoryLabels).map(
    (category) => ({
      url: `${SITE_URL}/portfolio/${category}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  );

  const journalRoutes: MetadataRoute.Sitemap = journalPosts
    .filter((post) => post.published)
    .map((post) => ({
      url: `${SITE_URL}/journal/${post.slug}`,
      lastModified: post.updatedAt ?? post.date,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    }));

  return [...staticRoutes, ...categoryRoutes, ...journalRoutes];
}
