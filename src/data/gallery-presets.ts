/**
 * Static gallery presets — v1.
 *
 * These fill the "Create gallery" form with sensible defaults for common
 * shoot types. No database table is needed for v1; the values live here.
 * If presets need to be admin-editable later, migrate to a Supabase table
 * and keep this file as the seed/fallback.
 *
 * Field guide:
 *  download_enabled   — whether clients see the download button at all
 *  download_quality   — "web" (optimised variant) | "full" (original)
 *  is_public          — eligible to appear in a future public gallery index
 *  description        — template blurb shown on the gallery cover page
 *  expiry_days        — days from today before the gallery link expires;
 *                       null = no expiry set by default
 *
 * Intentionally NOT preset:
 *  title / slug / client_name / client_email / event_date / location —
 *    always shoot-specific; admin fills these manually.
 *  password — must be set deliberately; never defaulted.
 *  deposit_status / payment_notes — workflow-specific, not template material.
 *  is_published — always starts false so the admin publishes intentionally.
 */

export type GalleryPresetDefaults = {
  download_enabled: boolean;
  download_quality: "web" | "full";
  is_public: boolean;
  description: string;
  /** Days from gallery creation until it expires. null = no expiry. */
  expiry_days: number | null;
};

export type GalleryPreset = {
  id: string;
  label: string;
  tagline: string;
  defaults: GalleryPresetDefaults;
};

export const galleryPresets: GalleryPreset[] = [
  {
    id: "wedding",
    label: "Wedding",
    tagline: "Full downloads · 6-month window",
    defaults: {
      download_enabled: true,
      download_quality: "full",
      is_public: false,
      description:
        "Your wedding gallery is ready. Browse and favourite your photos, then download anytime within the delivery window.",
      expiry_days: 180,
    },
  },
  {
    id: "engagement",
    label: "Engagement",
    tagline: "Full downloads · 3-month window",
    defaults: {
      download_enabled: true,
      download_quality: "full",
      is_public: false,
      description:
        "Your engagement session gallery is ready. Browse, favourite, and download your photos below.",
      expiry_days: 90,
    },
  },
  {
    id: "couples",
    label: "Couples",
    tagline: "Web downloads · 3-month window",
    defaults: {
      download_enabled: true,
      download_quality: "web",
      is_public: false,
      description:
        "Your couples session is ready. Browse and download your photos below.",
      expiry_days: 90,
    },
  },
  {
    id: "portrait",
    label: "Portrait",
    tagline: "Web downloads · 3-month window",
    defaults: {
      download_enabled: true,
      download_quality: "web",
      is_public: false,
      description:
        "Your portrait gallery is ready. Browse and download your photos below.",
      expiry_days: 90,
    },
  },
  {
    id: "event",
    label: "Nightlife / Event",
    tagline: "No downloads · 2-month window",
    defaults: {
      download_enabled: false,
      download_quality: "web",
      is_public: false,
      description: "Event coverage. Browse the full gallery below.",
      expiry_days: 60,
    },
  },
  {
    id: "proofing",
    label: "Private Proofing",
    tagline: "No downloads · 30-day window",
    defaults: {
      download_enabled: false,
      download_quality: "web",
      is_public: false,
      description:
        "Please browse these proofs and use the heart icon to select your favourites. A password is recommended for proofing galleries.",
      expiry_days: 30,
    },
  },
  {
    id: "delivery",
    label: "Delivery Gallery",
    tagline: "Full downloads · 3-month window",
    defaults: {
      download_enabled: true,
      download_quality: "full",
      is_public: false,
      description:
        "Your gallery is ready. Browse, favourite, and download your photos below.",
      expiry_days: 90,
    },
  },
];
