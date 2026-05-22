/**
 * Journal / blog post data.
 *
 * Add entries here to publish new posts at /journal/[slug].
 * Set published: false to draft a post without it appearing publicly.
 *
 * Do NOT use AI-generated SEO filler. Write in the same voice as the rest
 * of the site — direct, personal, non-cheesy.
 */

export type JournalPost = {
  slug: string;
  title: string;
  /** Short blurb shown in the listing and used as meta description. */
  excerpt: string;
  /** ISO date string — YYYY-MM-DD. Used for display and sitemap. */
  date: string;
  /** Optional ISO date if post was meaningfully revised. */
  updatedAt?: string;
  /** Tag (single) — matches portfolio category slugs where relevant. */
  tag: string;
  /** Cover image from portfolio data (id of a PortfolioItem). Optional. */
  coverImageId?: string;
  published: boolean;
  /** Multi-paragraph body as plain text / MDX-lite strings. */
  body: string[];
};

export const journalPosts: JournalPost[] = [
  {
    slug: "toronto-engagement-locations",
    title: "Five Toronto Spots for Engagement Photos",
    excerpt:
      "High Park, the Distillery, and three others worth considering — with notes on light, crowds, and what time of year actually looks good.",
    date: "2025-05-01",
    tag: "weddings-couples",
    coverImageId: "oishi-cherry-blossoms",
    published: true,
    body: [
      "Toronto has no shortage of photogenic corners. The challenge isn't finding a nice-looking spot — it's finding one that gives you genuine light, room to move, and something to look at that doesn't feel like every other engagement photo from the last five years.",
      "Here are five places worth considering, in rough order of how much I'd recommend them depending on what you're after.",
      "**High Park in spring.** The cherry blossoms run for maybe ten days in late April or very early May. When they hit, the light filters through the canopy in a way that's impossible to replicate anywhere else in the city. The trade-off: it's packed. Go on a weekday morning, ideally overcast, and arrive before 8am if you want anything close to an empty frame.",
      "**The Distillery District.** The brick and cobblestone read well in late-afternoon light. Winter is underrated here — quieter, and the warm tones of the brick hold even when the temperature doesn't. Avoid weekends in December unless you want Santa Claus Market crowds in your background.",
      "**Trinity Bellwoods.** Best in fall. The trees turn late and stay colourful longer than you'd expect. It's a lived-in park rather than a formal garden, which gives photos a different energy — more candid, less posed.",
      "**Tommy Thompson Park.** If you want something that doesn't look like Toronto, the Leslie Street Spit is worth the drive. Minimal crowds, consistent late-afternoon light over the lake, and a lot of visual texture from the gravel and scrub. Not a fit for everyone, but when it works, it really works.",
      "**Don Valley Brickworks.** Underused for engagement shoots. The quarry ponds and meadow area have a scale that doesn't compress down to nothing in a 35mm frame. Best in September and October when the light is lower and the grass goes golden.",
      "If none of these fit what you're after — or if you have a spot that means something to you personally — bring it up when you inquire. I'd rather shoot somewhere that matters to you than default to whatever's closest.",
    ],
  },
  {
    slug: "what-to-wear-couples-session",
    title: "What to Wear for a Couples Session",
    excerpt:
      "Practical notes on colour, coordination, and why 'matching' usually backfires.",
    date: "2025-03-15",
    tag: "weddings-couples",
    published: true,
    body: [
      "The most common question I get before a couples session: what should we wear? Here's what actually matters.",
      "**Coordinate, don't match.** Identical outfits draw attention to themselves. Clothes that work together — similar tones, complementary colours — let the focus stay on you. Think the same palette, not the same outfit.",
      "**Avoid busy patterns.** Fine stripes, small checks, graphic prints — they compress strangely in photos and pull the eye away from faces. Solid colours or subtle textures are more reliable.",
      "**Dress for the location.** If we're shooting in a park, a formal look can feel incongruous. If the Distillery, something a bit more put together usually reads better. Use the location as context.",
      "**Comfort matters more than you think.** If you're uncomfortable in what you're wearing, it shows. Bring a second option if you're not sure — it takes two minutes to change and gives you a completely different set of images.",
      "**Footwear counts.** Especially for full-length shots. If we're in a park, you may be walking on grass and gravel — plan accordingly.",
      "One more thing: don't over-plan. Some of the best outfits I've seen were put together the night before with clothes people already owned. The goal is for you to feel like yourselves, not like you dressed up to take photos.",
    ],
  },
  {
    slug: "how-gallery-delivery-works",
    title: "How Client Gallery Delivery Works",
    excerpt:
      "What happens between the shoot and the moment you open your gallery — and what to expect along the way.",
    date: "2025-02-01",
    tag: "events",
    published: true,
    body: [
      "Here's the honest version of what gallery delivery looks like, without the vague 'timelines vary' language.",
      "**After the shoot.** I cull the take first — removing duplicates, missed focus, and anything where the light or composition doesn't hold up. What you get is a selection, not everything I shot.",
      "**Editing.** Colour grading, exposure adjustments, and any retouching where relevant. I don't apply a one-size-fits-all filter — each image is adjusted based on what it actually needs.",
      "**Delivery timeline.** For portrait and lifestyle sessions: two weeks, usually sooner. Events: two to three weeks depending on size. Nightlife galleries (more photos, more complex): up to four weeks. If you need something faster, ask when you inquire.",
      "**The gallery itself.** You'll receive a private link with a password. Photos are organized and available to view, favourite, and download directly from the gallery. The link stays active for the access window agreed on at booking.",
      "**Downloading.** Full-resolution files are available when downloads are enabled. ZIP download for the whole gallery, or select individual files — your call.",
      "**Questions or requests.** If something isn't right, reach out. I'd rather fix it than have you quietly disappointed. Minor corrections and obvious oversights are sorted at no charge.",
    ],
  },
];
