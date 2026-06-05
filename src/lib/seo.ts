import type { Metadata } from "next";

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

export function withDefaultSocialImages(metadata: Metadata): Metadata {
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      images: metadata.openGraph?.images ?? [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      ...metadata.twitter,
      images: metadata.twitter?.images ?? [defaultTwitterImage],
    },
  };
}
