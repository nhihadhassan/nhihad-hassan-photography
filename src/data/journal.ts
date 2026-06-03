/**
 * Journal / blog post data.
 *
 * Add entries here to publish new posts at /journal/[slug].
 * Set published: false to draft a post without it appearing publicly.
 *
 * Voice: direct, personal, warm, never cheesy. Keep posts short and worth
 * reading. Inline a photo with a body entry of the form
 *   "[img:portfolio-item-id|caption]"
 * to break up the text (the id is a PortfolioItem from src/data/photography.ts).
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
  /** Body entries: paragraphs (with **bold**) or "[img:id|caption]" photos. */
  body: string[];
};

export const journalPosts: JournalPost[] = [
  {
    slug: "how-gallery-delivery-works",
    title: "How Client Gallery Delivery Works",
    excerpt:
      "What actually happens between the shoot and the moment you open your gallery. No vague timelines.",
    date: "2026-06-02",
    tag: "events",
    coverImageId: "moove-neon-swirl",
    published: true,
    body: [
      "Here is the honest version of what happens between the last frame and the moment your gallery link lands in your inbox. No vague \"timelines vary.\"",
      "**First, the cull.** I cut the duplicates, the missed focus, the frames where the light or the moment just was not there. What you get is a real edit, not the whole memory card.",
      "**Then the grade.** Colour, exposure, and retouching where it is actually needed. No single filter dragged across everything. Each photo gets what that photo asks for.",
      "[img:miraz-first-birthday|An event gallery, culled, graded, and ready to share.]",
      "**Timelines, for real.** Portraits and lifestyle land in about two weeks, often sooner. Events take two to three. Nightlife runs longest, more frames, more work, so up to four. Need it faster? Ask when you book and I will tell you straight.",
      "**The gallery itself.** A private, password-protected link. View it, favourite your picks, and download right from the page. The link stays live for the window we agree on at booking.",
      "**Downloading.** When downloads are on, you get full-resolution files: the whole gallery as a ZIP, or hand-picked singles. Your call.",
      "**If something feels off,** tell me. I would rather fix it than have you quietly disappointed. Small corrections and obvious misses are on me.",
    ],
  },
  {
    slug: "what-to-wear-couples-session",
    title: "What to Wear for a Couples Session",
    excerpt:
      "Colour, coordination, and why trying to \"match\" usually backfires. A few quick rules.",
    date: "2026-05-21",
    tag: "weddings-couples",
    coverImageId: "engagement-couple-porch",
    published: true,
    body: [
      "The question I get most before a couples session: what do we wear? Short version, here is what actually moves the needle.",
      "**Coordinate, do not match.** Identical outfits draw attention to themselves. Clothes that share a palette keep the focus on the two of you. Same tones, not the same shirt.",
      "[img:engagement-the-lift|Coordinated, not matched. Soft neutrals that stay out of the way.]",
      "**Skip busy patterns.** Fine stripes, small checks, and loud prints all do odd things on camera and pull the eye off your faces. Solids and quiet textures are far more forgiving.",
      "**Dress for the place.** A black-tie look in a park feels a little staged; the Distillery can take something sharper. Let the location set the tone.",
      "[img:rachel-garden-portrait|One solid colour in soft light. Nothing fighting for attention.]",
      "**Comfort beats everything.** If you feel awkward in it, the camera catches it. Bring a backup if you are torn. It takes two minutes to change and gives you a whole second look.",
      "And do not over-think it. Some of the best outfits I have shot were thrown together the night before from things people already owned. The goal is not \"dressed up for photos.\" It is you, on a good day.",
    ],
  },
  {
    slug: "toronto-engagement-locations",
    title: "Five Toronto Spots for Engagement Photos",
    excerpt:
      "High Park, the Distillery, and three more worth considering, with notes on light, crowds, and timing.",
    date: "2026-05-06",
    tag: "weddings-couples",
    coverImageId: "oishi-cherry-blossoms",
    published: true,
    body: [
      "Finding a photogenic spot in Toronto is not the problem. The harder part is picking one that gives you real light, room to move, and a backdrop that does not look like every other engagement photo from the last five years. Here are five I actually send people to.",
      "**High Park in spring.** The cherry blossoms last maybe ten days in late April or early May. When they hit, the light through the canopy is impossible to fake anywhere else in the city. The catch: everyone knows it. Go on an overcast weekday, and get there before 8am if you want a frame that is not half strangers.",
      "[img:oishi-blossom-portrait|High Park, the week the blossoms peak. Worth the early alarm.]",
      "**The Distillery District.** Brick and cobblestone that read beautifully in late-afternoon light. Winter is underrated here, quieter crowds, and the warm brick holds even when the temperature does not. Just skip December weekends unless you want the Santa Claus Market in the background.",
      "**Trinity Bellwoods.** Best in fall, when the trees turn late and hold their colour longer than you would expect. It is a lived-in park, not a manicured garden, so the photos come out more candid than posed.",
      "**Tommy Thompson Park.** If you want something that does not read as Toronto at all, the Leslie Street Spit is worth the drive. Barely any crowds, steady light over the lake, and a lot of texture from the gravel and scrub. Not for everyone, but when it lands, it really lands.",
      "**Don Valley Brickworks.** Quietly one of my favourites. The quarry ponds and meadow have a scale that does not flatten to nothing in a wide frame. September and October, when the light drops low and the grass goes gold.",
      "[img:rachel-autumn-leaves|Late-season light in the valley. The grass does most of the work.]",
      "If none of these feel right, or you have a spot that actually means something to you, say so when you reach out. I would much rather shoot somewhere that matters to you than default to whatever is closest.",
    ],
  },
];
