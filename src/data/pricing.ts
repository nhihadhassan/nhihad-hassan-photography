/**
 * Public pricing. Figures are limited introductory rates for 2026 bookings
 * and are expected to rise: keep this file the single source of truth and
 * bump the numbers here as rates change. Every tier is a fixed price, fixed
 * duration, and fixed deposit; avoid ranges so the booking flow's duration
 * and deposit parsing stay reliable.
 */

export type PricingTier = {
  name: string;
  /** Display price, e.g. "$150". */
  price: string;
  /** Short duration line shown under the price. */
  duration: string;
  /** Fixed deposit amount that secures this package, e.g. "$50". */
  deposit: string;
  includes: string[];
  /** Extra context revealed on hover (desktop) / tap (mobile). */
  details?: string;
  /** Marks the recommended/best-value tier within its category. */
  highlight?: boolean;
};

export type PricingCategory = {
  id: string;
  label: string;
  blurb: string;
  /** Optional framing line shown beside the heading (e.g. add-on coverage). */
  note?: string;
  tiers: PricingTier[];
};

const ADDITIONAL_COVERAGE_NOTE = "Additional coverage: $75/hour.";

export const pricingCategories: PricingCategory[] = [
  {
    id: "weddings",
    label: "Weddings",
    blurb:
      "From the slow morning hours to the very last dance, I am there for all of it.",
    note: ADDITIONAL_COVERAGE_NOTE,
    tiers: [
      {
        name: "4 Hours",
        price: "$550",
        duration: "4 hours",
        deposit: "$200",
        includes: [
          "4 hours of continuous coverage",
          "150+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details:
          "Coverage built around the heart of the day, from the ceremony through the early celebration.",
      },
      {
        name: "6 Hours",
        price: "$900",
        duration: "6 hours",
        deposit: "$300",
        highlight: true,
        includes: [
          "6 hours of continuous coverage",
          "250+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details:
          "More of the day covered, from getting ready through the celebration, with room for the quiet moments in between.",
      },
      {
        name: "9 Hours",
        price: "$1,250",
        duration: "9 hours",
        deposit: "$400",
        includes: [
          "9 hours of continuous coverage",
          "400+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details:
          "Full-day coverage from the morning preparations through to the final send-off, with room for every part of the day.",
      },
    ],
  },
  {
    id: "couples",
    label: "Couples",
    blurb: "An easy hour or two to just be yourselves, no stiff poses required.",
    note: ADDITIONAL_COVERAGE_NOTE,
    tiers: [
      {
        name: "1 Hour",
        price: "$150",
        duration: "1 hour",
        deposit: "$50",
        includes: [
          "1 hour, one location",
          "30+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details:
          "A relaxed hour to get comfortable on camera, ideal for save-the-dates and first sessions together.",
      },
      {
        name: "2 Hours",
        price: "$225",
        duration: "2 hours",
        deposit: "$75",
        highlight: true,
        includes: [
          "2 hours, up to two locations",
          "60+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details:
          "More time and a second location for variety in light, backdrop, and wardrobe.",
      },
      {
        name: "Surprise Proposal",
        price: "$200",
        duration: "1 hour",
        deposit: "$75",
        includes: [
          "1 hour of coverage",
          "30+ edited photos",
          "Proposal planning and coordination",
          "Candid photos of the proposal and reactions",
          "Portraits together afterward",
        ],
        details:
          "Planned together ahead of time so I can stay out of sight, captured candidly as it happens, with portraits once the moment sinks in.",
      },
    ],
  },
  {
    id: "events",
    label: "Events",
    blurb: "Birthdays, milestones, and big celebrations.",
    note: ADDITIONAL_COVERAGE_NOTE,
    tiers: [
      {
        name: "2 Hours",
        price: "$200",
        duration: "2 hours",
        deposit: "$75",
        includes: [
          "2 hours of coverage",
          "60+ edited photos",
          "Private online gallery",
        ],
        details:
          "Quiet coverage for shorter gatherings, from arrivals and speeches to the moments in between.",
      },
      {
        name: "4 Hours",
        price: "$350",
        duration: "4 hours",
        deposit: "$125",
        highlight: true,
        includes: [
          "4 hours of coverage",
          "120+ edited photos",
          "Private online gallery",
        ],
        details:
          "Coverage across the heart of the event, from the setup energy to the main moments.",
      },
      {
        name: "6 Hours",
        price: "$550",
        duration: "6 hours",
        deposit: "$200",
        includes: [
          "6 hours of coverage",
          "180+ edited photos",
          "Private online gallery",
        ],
        details: "Full-evening coverage for larger celebrations that run long.",
      },
    ],
  },
  {
    id: "portraits",
    label: "Portraits",
    blurb: "Family, a milestone, or simply you, taken at a calm and easy pace.",
    note: ADDITIONAL_COVERAGE_NOTE,
    tiers: [
      {
        name: "30 Minutes",
        price: "$100",
        duration: "30 minutes",
        deposit: "$40",
        includes: [
          "30 minutes, one location",
          "15+ edited photos",
          "Private online gallery",
        ],
        details: "A quick, focused session for headshots, a milestone, or a single look.",
      },
      {
        name: "1 Hour",
        price: "$175",
        duration: "1 hour",
        deposit: "$60",
        highlight: true,
        includes: [
          "1 hour, one location",
          "30+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details: "Room to relax into it, with a couple of looks and calm direction throughout.",
      },
      {
        name: "2 Hours",
        price: "$275",
        duration: "2 hours",
        deposit: "$85",
        includes: [
          "2 hours of shooting",
          "60+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details: "Unrushed time for multiple looks, locations, or a small group.",
      },
    ],
  },
  {
    id: "graduation",
    label: "Graduation",
    blurb: "Cap, gown, and the people who got you there.",
    note: ADDITIONAL_COVERAGE_NOTE,
    tiers: [
      {
        name: "30 Minutes",
        price: "$100",
        duration: "30 minutes",
        deposit: "$40",
        includes: [
          "30 minutes, one location",
          "20+ edited photos",
          "Private online gallery",
        ],
        details: "A focused session to mark the milestone, cap and gown included.",
      },
      {
        name: "1 Hour",
        price: "$175",
        duration: "1 hour",
        deposit: "$60",
        highlight: true,
        includes: [
          "1 hour, one or two locations",
          "35+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details: "Time for solo portraits and a few frames with the people who got you there.",
      },
      {
        name: "2 Hours",
        price: "$275",
        duration: "2 hours",
        deposit: "$85",
        includes: [
          "2 hours of shooting",
          "60+ edited photos",
          "Private online gallery",
          "Print release",
        ],
        details:
          "Unrushed time for multiple looks, locations, or a bigger group of family and friends.",
      },
    ],
  },
  {
    id: "nightlife",
    label: "Nightlife",
    blurb: "The flash, the crowd, and the energy of the night, back to you fast.",
    note: ADDITIONAL_COVERAGE_NOTE,
    tiers: [
      {
        name: "3 Hours",
        price: "$300",
        duration: "3 hours",
        deposit: "$100",
        includes: [
          "3 hours of coverage",
          "75+ edited photos",
          "72 hour turnaround",
        ],
        details: "Fast-turnaround coverage tuned to flash, movement, and crowd energy.",
      },
      {
        name: "5 Hours",
        price: "$450",
        duration: "5 hours",
        deposit: "$150",
        highlight: true,
        includes: [
          "5 hours of coverage",
          "125+ edited photos",
          "72 hour turnaround",
        ],
        details: "More of the night covered, from the early energy through to last call.",
      },
    ],
  },
];
