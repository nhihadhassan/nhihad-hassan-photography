import type { PortfolioCategory } from "@/data/photography";

export type ServiceId = "weddings" | "couples" | "portraits" | "events" | "nightlife";

export type Service = {
  id: ServiceId;
  /** Display label (e.g. "Couples & Engagements"). */
  label: string;
  /** Short copy used on grid cards and the homepage. */
  shortBlurb: string;
  /** Longer copy used on the /investment page blocks. */
  longBlurb: string;
  /** Closest existing portfolio category for a "See portfolio →" link. */
  portfolioHref: `/portfolio/${PortfolioCategory}`;
  /** id of an item in src/data/photography.ts portfolioItems[] — used to source the cover image without duplicating URLs. */
  imageId: string;
};

/**
 * Ordered to lead with weddings + couples per the Phase 4A direction —
 * the homepage and /investment page both render services in this order.
 */
export const services: Service[] = [
  {
    id: "weddings",
    label: "Weddings",
    shortBlurb:
      "Full-day wedding coverage that holds the room's pace: ceremony, reception, dance floor, and the quiet in-between.",
    longBlurb:
      "Wedding coverage built around the rhythm of the day. Ceremony presence, reception energy, family portraits, and the small moments between speeches that you'll want back later. Delivered in a private online gallery with high-resolution downloads, made for sharing with both families.",
    portfolioHref: "/portfolio/weddings-couples",
    imageId: "engagement-couple-porch",
  },
  {
    id: "couples",
    label: "Couples & Engagements",
    shortBlurb:
      "Engagement and couples portraits that feel like you. Light, honest, unforced.",
    longBlurb:
      "Engagement and couples sessions that work around how you actually are together. Comfortable direction, real conversation, golden-hour light where possible. The kind of photos that hold up on a wall, not just a screen.",
    portfolioHref: "/portfolio/weddings-couples",
    imageId: "oishi-cherry-blossoms",
  },
  {
    id: "portraits",
    label: "Portraits",
    shortBlurb:
      "Family portraits, milestone shoots, and editorial portraits with clean light and calm direction.",
    longBlurb:
      "Portraits for families, milestones, and personal projects. Outdoor or indoor, natural or flash, built around clean composition and an unrushed pace so the result feels considered, not over-posed.",
    portfolioHref: "/portfolio/portraits",
    imageId: "rachel-garden-portrait",
  },
  {
    id: "events",
    label: "Events",
    shortBlurb:
      "Cultural celebrations, milestone parties, corporate moments. Coverage that works with the room.",
    longBlurb:
      "Coverage for cultural events, milestone parties, brand activations, and private gatherings. I work fast and quietly, prioritising the moments that make the night feel like itself when you look back.",
    portfolioHref: "/portfolio/events",
    imageId: "choyons-grad-cake",
  },
  {
    id: "nightlife",
    label: "Nightlife",
    shortBlurb:
      "Club, concert, and party photography tuned for movement, flash, and crowd energy.",
    longBlurb:
      "Nightlife coverage for promoters, venues, and artists. Flash work tuned to keep colour and crowd energy intact, with fast turnaround so the gallery hits while the night is still being talked about.",
    portfolioHref: "/portfolio/nightlife",
    imageId: "moove-dj-floor",
  },
];
