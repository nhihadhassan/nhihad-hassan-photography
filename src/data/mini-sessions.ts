/**
 * Mini-session / seasonal landing page data.
 *
 * Each item defines a campaign page section. To add a new mini-session
 * offering, add an entry here and it will automatically render on /mini-sessions.
 *
 * IMPORTANT — do NOT add dollar figures here. Investment is inquiry-based.
 */

export type MiniSessionOffering = {
  id: string;
  title: string;
  /** Short subtitle shown in the card header. */
  tagline: string;
  /** 2–3 sentence description of the experience. */
  description: string;
  /** Bullet list of what clients get. */
  includes: string[];
  /**
   * Available date ranges (plain text — not machine-parseable yet).
   * e.g. "June – August 2026" or "Ongoing — inquire for availability"
   */
  availability: string;
  /** Relevant portfolio category slug for the "See examples" link. */
  portfolioCategory: string;
};

export const miniSessionOfferings: MiniSessionOffering[] = [
  {
    id: "couples-portrait",
    title: "Couples & Engagements",
    tagline: "Toronto parks · golden hour · intimate sessions",
    description:
      "A focused 60-minute outdoor session built around natural light, honest moments, and locations that feel personal to you — High Park, the Distillery, Trinity Bellwoods, or wherever means something.",
    includes: [
      "Up to 60 minutes on location",
      "Edited gallery delivered within two weeks",
      "Web-optimized photos for sharing",
      "One location",
    ],
    availability: "Spring and autumn — inquire for current availability",
    portfolioCategory: "weddings-couples",
  },
  {
    id: "lifestyle-portrait",
    title: "Portrait Session",
    tagline: "Individuals · content creators · professionals",
    description:
      "A relaxed portrait session in a setting that suits you. Editorial, candid, or somewhere in between — tailored to how you want to show up.",
    includes: [
      "Up to 60 minutes on location",
      "Edited gallery delivered within two weeks",
      "Multiple outfit changes welcome",
      "Direction and posing throughout",
    ],
    availability: "Year-round — inquire for current availability",
    portfolioCategory: "portraits",
  },
  {
    id: "event-coverage",
    title: "Event Coverage",
    tagline: "Birthdays · graduations · celebrations",
    description:
      "Documentary-style event photography that captures the energy of the room — candids, group moments, and the details you arranged.",
    includes: [
      "2–4 hours of coverage",
      "Full edited gallery",
      "Delivered within two weeks",
      "Printed prints available on request",
    ],
    availability: "Year-round — inquire for your date",
    portfolioCategory: "events",
  },
];

export type MiniSessionFaq = {
  q: string;
  a: string;
};

export const miniSessionFaqs: MiniSessionFaq[] = [
  {
    q: "How does booking work?",
    a: "Send an inquiry with your preferred date and session type. Once confirmed, a deposit via Interac e-Transfer holds your date — no checkout on this site.",
  },
  {
    q: "Where do sessions take place?",
    a: "Anywhere that works for you in the Greater Toronto Area. I can suggest locations based on the look you're going for, or we can use a spot that's meaningful to you.",
  },
  {
    q: "When will I receive my photos?",
    a: "Edited galleries are delivered within two weeks of the session via your private client gallery. Rush delivery may be available — ask when you inquire.",
  },
  {
    q: "Can I request a session not listed here?",
    a: "Absolutely. Use the inquiry form to describe what you're after and I'll let you know if I can make it work.",
  },
];
