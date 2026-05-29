/**
 * One-off: builds the default Open Graph / social share image (1200x630)
 * by centering the brand lockup on the brand ink background. Writes the
 * Next.js file-convention assets so every route gets a share image.
 *
 *   node scripts/make-og.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const W = 1200;
const H = 630;
const INK = { r: 8, g: 8, b: 8 };
const COPPER = "#b98257";

async function run() {
  const logoRaw = readFileSync(join(ROOT, "public", "logo-lockup.png"));
  const logo = await sharp(logoRaw)
    .resize({ height: 360, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  // A thin copper baseline rule for a touch of brand colour.
  const rule = Buffer.from(
    `<svg width="${W}" height="${H}"><rect x="${W / 2 - 80}" y="${H - 150}" width="160" height="2" fill="${COPPER}"/></svg>`,
  );

  const out = await sharp({
    create: { width: W, height: H, channels: 3, background: INK },
  })
    .composite([
      {
        input: logo.data,
        left: Math.round((W - logo.info.width) / 2),
        top: Math.round((H - logo.info.height) / 2) - 20,
      },
      { input: rule, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  for (const name of ["opengraph-image.png", "twitter-image.png"]) {
    writeFileSync(join(ROOT, "src", "app", name), out);
    console.log(`wrote src/app/${name} (${Math.round(out.length / 1024)} KB, ${W}x${H})`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
