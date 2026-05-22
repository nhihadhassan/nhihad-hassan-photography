/**
 * scripts/upload-portfolio.mjs
 *
 * One-time script: processes curated photos from "Website pics/", writes
 * web WebP variants to public/portfolio/, and rewrites src/data/photography.ts
 * with local /portfolio/ paths.
 *
 * Portfolio photos are served as static Next.js public assets (not from R2)
 * because R2 photo URLs are signed and expire — they can't be hardcoded.
 * next/image handles on-the-fly optimization for public/ files at runtime.
 *
 * Usage:
 *   node scripts/upload-portfolio.mjs
 *
 * Re-run any time to regenerate. Existing files are overwritten.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const PICS_DIR = join(ROOT, "Website pics");

// ── Curated photo list ─────────────────────────────────────────────────────
const PHOTOS = [
  // NIGHTLIFE — MOOVE March 2026
  {
    id: "moove-neon-swirl",
    src: "Moove Edit #4 - March 22, 2026.jpg",
    category: "nightlife",
    title: "MOOVE — Neon Swirl",
    date: "2026-03-22",
    location: "Toronto",
    alt: "Abstract neon light trails spiral over a packed dance floor at MOOVE Toronto.",
    featured: true,
    description: "Long exposure, movement, chaos — colour held in a single frame.",
    orientation: "landscape",
  },
  {
    id: "moove-crowd-energy",
    src: "Moove Edit #7 - March 22, 2026.jpg",
    category: "nightlife",
    title: "MOOVE — Crowd Energy",
    date: "2026-03-22",
    location: "Toronto",
    alt: "A performer reaches into the crowd at a packed Toronto nightclub event.",
    featured: true,
    description: "The moment the room breaks open — caught in the middle of it.",
    orientation: "landscape",
  },
  {
    id: "moove-dj-booth",
    src: "Moove Edit #1 - March 21, 2026.jpg",
    category: "nightlife",
    title: "MOOVE — DJ Booth",
    date: "2026-03-21",
    location: "Toronto",
    alt: "Friends gathered around the DJ booth under nightclub lighting at MOOVE.",
    featured: false,
    description: "Behind the decks — energy, colour, and a tight crew.",
    orientation: "portrait",
  },

  // EVENTS
  {
    id: "choyons-grad-couple",
    src: "Choyons Graduation Party - 06 15 2025 - 15.jpg",
    category: "events",
    title: "Choyons Graduation",
    date: "2025-06-15",
    location: "Toronto",
    alt: "A couple posing at a graduation party with blue and gold balloon decor.",
    featured: false,
    description: "Milestone moments documented with care — family energy and celebration.",
    orientation: "portrait",
  },
  {
    id: "miraz-first-birthday",
    src: "Miraz Birthday #7 - February 07, 2026.jpg",
    category: "events",
    title: "Miraz — First Birthday",
    date: "2026-02-07",
    location: "Toronto",
    alt: "A baby in a safari-themed first birthday setup with animal balloon decorations and a birthday cake.",
    featured: false,
    description: "A first birthday documented in full — the setup, the cake, the pure first-year wonder.",
    orientation: "portrait",
  },

  // PORTRAITS
  {
    id: "nhd-sunset-hike",
    src: "NHD01240-Edit.jpg",
    category: "portraits",
    title: "Autumn Hike",
    date: "2024-10-01",
    location: "Toronto",
    alt: "A person hiking through fall foliage under a dramatic orange and pink sunset sky.",
    featured: true,
    description: "Golden fall light, a dramatic sky, and a solitary figure — cinematic outdoor portraiture.",
    orientation: "portrait",
  },
  {
    id: "forest-walk-portrait",
    src: "Edit 1, 09-07-2024.jpg",
    category: "portraits",
    title: "Forest Walk",
    date: "2024-09-07",
    location: "Toronto",
    alt: "A person walking alone down a sunlit path through tall green trees.",
    featured: false,
    description: "Quiet environmental portraiture — a figure in motion, a forest standing still.",
    orientation: "portrait",
  },

  // LIFESTYLE
  {
    id: "rachel-autumn-leaves",
    src: "Fall Walk with Rachel 00077, 10-20-2024.jpg",
    category: "lifestyle",
    title: "Autumn Portrait — Rachel",
    date: "2024-10-20",
    location: "Toronto",
    alt: "A woman sitting in a bed of autumn leaves in a warm fall forest, looking upward.",
    featured: true,
    description: "Warm tones, an honest expression, and fall light doing exactly what it should.",
    orientation: "landscape",
  },
  {
    id: "rachel-golden-picnic",
    src: "Rachel Post #1 - 09 14 2024.jpg",
    category: "lifestyle",
    title: "Golden Hour Picnic",
    date: "2024-09-14",
    location: "Toronto",
    alt: "A woman arranging a picnic blanket in warm evening golden-hour park light.",
    featured: false,
    description: "Lifestyle imagery with a soft editorial rhythm — caught between doing and being.",
    orientation: "landscape",
  },
  {
    id: "rachel-garden-bench",
    src: "Rachel Post #3 - 09 14 2024.jpg",
    category: "lifestyle",
    title: "Garden Bench",
    date: "2024-09-14",
    location: "Toronto",
    alt: "A woman sitting on a green bench in a blooming garden in a light summer dress at golden hour.",
    featured: false,
    description: "Unposed summer ease — warmth and stillness in equal measure.",
    orientation: "portrait",
  },

  // WEDDINGS / COUPLES
  {
    id: "oishi-cherry-blossoms",
    src: "Oishi and Lucky # (3).jpeg",
    category: "weddings-couples",
    title: "Oishi & Lucky — Cherry Blossoms",
    date: "2025-04-15",
    location: "Toronto",
    alt: "A woman in a pink floral dress with her dog under weeping cherry blossom trees by a pond.",
    featured: true,
    description: "A portrait session in bloom — soft spring light, pink florals, and pure connection.",
    orientation: "portrait",
  },
  {
    id: "oishi-pond-portrait",
    src: "Oishi and Lucky # (7).jpeg",
    category: "weddings-couples",
    title: "Oishi & Lucky — Pond",
    date: "2025-04-15",
    location: "Toronto",
    alt: "A woman in a floral dress holding her dog beside a reflecting pond under cherry blossoms.",
    featured: false,
    description: "Spring portraiture by the water — light, reflection, and a quiet moment.",
    orientation: "portrait",
  },
];

const PUBLIC_DIR = join(ROOT, "public", "portfolio");

// ── Sharp processing ───────────────────────────────────────────────────────
async function processVariant(inputBuffer, maxDimension, quality) {
  const result = await sharp(inputBuffer, { failOn: "truncated" })
    .rotate()
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return result.data;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function run() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log(`Processing ${PHOTOS.length} photos → public/portfolio/\n`);

  const results = [];

  for (const photo of PHOTOS) {
    const srcPath = join(PICS_DIR, photo.src);
    if (!existsSync(srcPath)) {
      console.error(`  ✗ NOT FOUND: ${photo.src}`);
      continue;
    }

    process.stdout.write(`  ${photo.id} … `);
    const raw = readFileSync(srcPath);

    const [webBuf, thumbBuf] = await Promise.all([
      processVariant(raw, 2400, 85),
      processVariant(raw, 600, 80),
    ]);

    writeFileSync(join(PUBLIC_DIR, `${photo.id}.webp`), webBuf);
    writeFileSync(join(PUBLIC_DIR, `${photo.id}-thumb.webp`), thumbBuf);

    const imageUrl = `/portfolio/${photo.id}.webp`;
    console.log(`done  (web: ${Math.round(webBuf.length / 1024)} KB, thumb: ${Math.round(thumbBuf.length / 1024)} KB)`);

    results.push({ ...photo, imageUrl });
  }

  // ── Write photography.ts ─────────────────────────────────────────────────
  const items = results.map((r) => `  {
    id: ${JSON.stringify(r.id)},
    title: ${JSON.stringify(r.title)},
    category: ${JSON.stringify(r.category)},
    date: ${JSON.stringify(r.date)},
    location: ${JSON.stringify(r.location)},
    imageUrl: ${JSON.stringify(r.imageUrl)},
    alt: ${JSON.stringify(r.alt)},
    featured: ${r.featured},
    description: ${JSON.stringify(r.description)},
    orientation: ${JSON.stringify(r.orientation)},
  }`).join(",\n");

  const nightlifeFeatured = results.find((r) => r.id === "moove-neon-swirl");

  const ts = `export type PortfolioCategory =
  | "events"
  | "nightlife"
  | "portraits"
  | "lifestyle"
  | "weddings-couples";

export type PortfolioItem = {
  id: string;
  title: string;
  category: PortfolioCategory;
  date: string;
  location: string;
  imageUrl: string;
  alt: string;
  featured: boolean;
  description: string;
  orientation: "portrait" | "landscape" | "square";
};

export type FeaturedGallery = {
  slug: string;
  title: string;
  category: PortfolioCategory;
  date: string;
  location: string;
  imageUrl: string;
  alt: string;
  featured: boolean;
  description: string;
};

export type MockClientGallery = FeaturedGallery & {
  clientName: string;
  protected: boolean;
  sections: string[];
  photos: PortfolioItem[];
};

export const categoryLabels: Record<PortfolioCategory, string> = {
  events: "Events",
  nightlife: "Nightlife",
  portraits: "Portraits",
  lifestyle: "Lifestyle",
  "weddings-couples": "Weddings / Couples",
};

export const portfolioItems: PortfolioItem[] = [
${items},
];

export const featuredGalleries: FeaturedGallery[] = [
  {
    slug: "moove-ah",
    title: "MOOVE @ AH",
    category: "nightlife",
    date: "2026-03-22",
    location: "Toronto",
    imageUrl: ${JSON.stringify(nightlifeFeatured?.imageUrl ?? "")},
    alt: "A packed nightclub dance floor under vivid neon lighting at MOOVE Toronto.",
    featured: true,
    description: "A high-energy nightlife gallery from MOOVE — Toronto's underground dance scene.",
  },
];

export const mockClientGalleries: MockClientGallery[] = [
  {
    ...featuredGalleries[0],
    clientName: "MOOVE",
    protected: true,
    sections: ["Highlights", "Dance Floor", "DJ Set", "Crowd", "All Photos"],
    photos: portfolioItems.filter((item) =>
      ["events", "nightlife", "portraits", "lifestyle"].includes(item.category),
    ),
  },
];

export function getPortfolioByCategory(category: string) {
  return portfolioItems.filter((item) => item.category === category);
}

export function getMockGallery(slug: string) {
  return mockClientGalleries.find((gallery) => gallery.slug === slug);
}
`;

  const outPath = join(ROOT, "src/data/photography.ts");
  writeFileSync(outPath, ts, "utf8");
  console.log(`\n✓ Wrote ${outPath}`);
  console.log(`✓ ${results.length} / ${PHOTOS.length} photos uploaded.`);
}

run().catch((err) => {
  console.error("\n✗ Script failed:", err);
  process.exit(1);
});
