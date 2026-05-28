/**
 * Public pricing. Figures are introductory / portfolio-build rates and are
 * expected to rise — keep this file the single source of truth and bump the
 * numbers here as rates change. Ranges use an en dash (e.g. "$400–$600").
 */

export type PricingTier = {
  name: string;
  /** Display price or range, e.g. "$150" or "$400–$600". */
  price: string;
  /** Short duration line shown under the price. */
  duration: string;
  includes: string[];
  /** Extra context revealed on hover (desktop) / tap (mobile). */
  details?: string;
};

export type PricingCategory = {
  id: string;
  label: string;
  blurb: string;
  /** Optional honest framing line (used for weddings). */
  note?: string;
  tiers: PricingTier[];
};

export const pricingCategories: PricingCategory[] = [
  {
    id: "weddings",
    label: "Weddings",
    blurb:
      "Coverage that keeps the pace of the day, from the quiet morning hours through the last song.",
    note: "Wedding coverage is offered at introductory rates while I build this part of my portfolio. Longer collections and full-day coverage are quoted on request.",
    tiers: [
      {
        name: "Wedding Coverage",
        price: "$400–$600",
        duration: "4–5 hours",
        includes: [
          "4–5 hours of continuous coverage",
          "200+ edited images",
          "Private online gallery",
          "Print release",
        ],
        details:
          "Coverage paced to the day itself, from the quiet morning hours to the last song. Longer collections and full-day coverage are quoted on request.",
      },
    ],
  },
  {
    id: "engagements",
    label: "Couples & Engagements",
    blurb: "Relaxed sessions built around how you actually are together.",
    tiers: [
      {
        name: "Starter",
        price: "$150",
        duration: "1 hour",
        includes: [
          "1 hour, one location",
          "30–40 edited images",
          "Private online gallery",
          "Print release",
        ],
        details:
          "A relaxed hour to get comfortable on camera, ideal for save-the-dates and first sessions together.",
      },
      {
        name: "Extended",
        price: "$250",
        duration: "1.5–2 hours",
        includes: [
          "1.5–2 hours, up to two locations",
          "50–70 edited images",
          "Private online gallery",
          "Print release",
        ],
        details:
          "More time and a second location for variety in light, backdrop, and wardrobe.",
      },
    ],
  },
  {
    id: "events",
    label: "Events",
    blurb:
      "Cultural celebrations, milestone parties, and corporate moments, covered quietly.",
    tiers: [
      {
        name: "Mini",
        price: "$200",
        duration: "Up to 2 hours",
        includes: [
          "Up to 2 hours of coverage",
          "60–80 edited images",
          "Private online gallery",
        ],
        details:
          "Quiet coverage for shorter gatherings, from arrivals and speeches to the moments in between.",
      },
      {
        name: "Standard",
        price: "$350",
        duration: "3–4 hours",
        includes: [
          "3–4 hours of coverage",
          "100–150 edited images",
          "Private online gallery",
        ],
        details:
          "Coverage across the heart of the event, from the setup energy to the main moments.",
      },
      {
        name: "Extended",
        price: "$500–$650",
        duration: "5–6 hours",
        includes: [
          "5–6 hours of coverage",
          "200+ edited images",
          "Private online gallery",
        ],
        details:
          "Full-evening coverage for larger celebrations that run long.",
      },
    ],
  },
  {
    id: "portraits",
    label: "Portraits",
    blurb:
      "Family portraits, milestones, and personal projects with calm, unrushed direction.",
    tiers: [
      {
        name: "Mini",
        price: "$100–$125",
        duration: "30 minutes",
        includes: [
          "30 minutes, one location",
          "15–25 edited images",
          "Private online gallery",
        ],
        details:
          "A quick, focused session for headshots, a milestone, or a single look.",
      },
      {
        name: "Standard",
        price: "$200",
        duration: "1 hour",
        includes: [
          "1 hour, one location",
          "40–50 edited images",
          "Private online gallery",
          "Print release",
        ],
        details:
          "Room to relax into it, with a couple of looks and calm direction throughout.",
      },
      {
        name: "Extended",
        price: "$300",
        duration: "1.5–2 hours",
        includes: [
          "1.5–2 hours of shooting",
          "50–70 edited images",
          "Private online gallery",
          "Print release",
        ],
        details:
          "Unrushed time for multiple looks, locations, or a small group.",
      },
    ],
  },
  {
    id: "nightlife",
    label: "Nightlife",
    blurb:
      "Club, concert, and party coverage tuned for movement, flash, and crowd energy.",
    tiers: [
      {
        name: "Per Event",
        price: "$250–$400",
        duration: "3–4 hours",
        includes: [
          "3–4 hours of coverage",
          "60–100 edited images",
          "24–48 hour turnaround",
        ],
        details:
          "Fast-turnaround coverage tuned to flash, movement, and crowd energy.",
      },
    ],
  },
];
