import type { PortfolioCategory } from "@/data/photography";

export type ServiceId = "weddings" | "couples" | "portraits" | "events" | "nightlife";

export type Service = {
  id: ServiceId;
  /** Display label (e.g. "Couples & Engagements"). */
  label: string;
  /** Short copy used on the homepage services grid cards. */
  shortBlurb: string;
  /** Closest existing portfolio category for a "See portfolio →" link. */
  portfolioHref: `/portfolio/${PortfolioCategory}`;
  /** id of an item in src/data/photography.ts portfolioItems[] — used to source the cover image without duplicating URLs. */
  imageId: string;
};

/**
 * Ordered to lead with weddings + couples — the homepage ServicesGrid
 * renders this array in order.
 */
export const services: Service[] = [
  {
    id: "weddings",
    label: "Weddings",
    shortBlurb:
      "Full-day wedding coverage that holds the room's pace: ceremony, reception, dance floor, and the quiet in-between.",
    portfolioHref: "/portfolio/weddings-couples",
    imageId: "engagement-couple-porch",
  },
  {
    id: "couples",
    label: "Couples & Engagements",
    shortBlurb:
      "Engagement and couples portraits that feel like you. Light, honest, unforced.",
    portfolioHref: "/portfolio/weddings-couples",
    imageId: "oishi-cherry-blossoms",
  },
  {
    id: "portraits",
    label: "Portraits",
    shortBlurb:
      "Family portraits, milestone shoots, and editorial portraits with clean light and calm direction.",
    portfolioHref: "/portfolio/portraits",
    imageId: "rachel-garden-portrait",
  },
  {
    id: "events",
    label: "Events",
    shortBlurb:
      "Cultural celebrations, milestone parties, corporate moments. Coverage that works with the room.",
    portfolioHref: "/portfolio/events",
    imageId: "choyons-grad-cake",
  },
  {
    id: "nightlife",
    label: "Nightlife",
    shortBlurb:
      "Club, concert, and party photography tuned for movement, flash, and crowd energy.",
    portfolioHref: "/portfolio/nightlife",
    imageId: "moove-dj-floor",
  },
];
