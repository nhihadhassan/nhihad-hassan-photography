/**
 * One-off: processes the light-refresh additions into public/portfolio/.
 * Only writes WebP variants; photography.ts is edited by hand so the copy
 * stays controlled (no em dashes). Safe to re-run; overwrites existing.
 *
 *   node scripts/add-portfolio.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PICS_DIR = join(ROOT, "Website Pics");
const PUBLIC_DIR = join(ROOT, "public", "portfolio");

const PHOTOS = [
  { id: "engagement-garden-embrace", src: "A7R01461.jpeg" },
  { id: "engagement-first-kiss", src: "A7R01366.jpeg" },
  { id: "engagement-the-lift", src: "A7R01286.jpeg" },
  { id: "engagement-red-dress", src: "A7R00349.jpeg" },
  { id: "engagement-ring-detail", src: "A7R00142.jpeg" },
  { id: "oishi-blossom-portrait", src: "Oishi and Lucky # (1).jpeg" },
  { id: "oishi-garden-lawn", src: "Oishi and Lucky # (5).jpeg" },
  { id: "ma-baby-shower-couple", src: "M + A Baby Shower 01013 0111-2025.jpg" },
  { id: "mehndi-bridal-portrait", src: "SNY00063-ShotByNhihadHassan.jpg" },
  { id: "lucky-autumn-walk", src: "Luckys First Birthday 00086, 10-14-2024.jpg" },
  { id: "garden-white-portrait", src: "A7R00134.jpeg" },
];

async function processVariant(inputBuffer, maxDimension, quality) {
  const result = await sharp(inputBuffer, { failOn: "truncated" })
    .rotate()
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return result.data;
}

async function run() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log(`Processing ${PHOTOS.length} additions -> public/portfolio/\n`);
  for (const photo of PHOTOS) {
    const srcPath = join(PICS_DIR, photo.src);
    if (!existsSync(srcPath)) {
      console.error(`  x NOT FOUND: ${photo.src}`);
      continue;
    }
    process.stdout.write(`  ${photo.id} ... `);
    const raw = readFileSync(srcPath);
    const [webBuf, thumbBuf] = await Promise.all([
      processVariant(raw, 2400, 85),
      processVariant(raw, 600, 80),
    ]);
    writeFileSync(join(PUBLIC_DIR, `${photo.id}.webp`), webBuf);
    writeFileSync(join(PUBLIC_DIR, `${photo.id}-thumb.webp`), thumbBuf);
    console.log(`done (web: ${Math.round(webBuf.length / 1024)} KB, thumb: ${Math.round(thumbBuf.length / 1024)} KB)`);
  }
  console.log("\nDone. Now add matching entries to src/data/photography.ts.");
}

run().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
