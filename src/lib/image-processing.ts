import "server-only";
import sharp from "sharp";

export type GeneratedVariant = {
  buffer: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  size: number;
};

const WEB_MAX_DIMENSION = 2400;
const WEB_QUALITY = 85;

const THUMBNAIL_MAX_DIMENSION = 600;
const THUMBNAIL_QUALITY = 80;

const WATERMARK_TEXT = "Nhihad Hassan Photography";

/**
 * Builds an SVG watermark overlay sized to the given image dimensions.
 * The text is rendered diagonally, semi-transparent, in the lower-right area.
 */
function buildWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(18, Math.round(width * 0.022));
  const padding = Math.round(fontSize * 1.8);
  const x = width - padding;
  const y = height - padding;

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      text {
        font-family: Georgia, serif;
        font-size: ${fontSize}px;
        fill: rgba(255,255,255,0.55);
        letter-spacing: 1px;
      }
    </style>
    <text
      x="${x}"
      y="${y}"
      text-anchor="end"
      dominant-baseline="auto"
    >${WATERMARK_TEXT}</text>
  </svg>`;
  return Buffer.from(svg);
}

async function generateVariant(
  input: Buffer | Uint8Array,
  maxDimension: number,
  quality: number,
): Promise<GeneratedVariant> {
  const result = await sharp(input, { failOn: "truncated" })
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    contentType: "image/webp",
    width: result.info.width,
    height: result.info.height,
    size: result.info.size,
  };
}

async function generateVariantWithWatermark(
  input: Buffer | Uint8Array,
  maxDimension: number,
  quality: number,
): Promise<GeneratedVariant> {
  // First pass: resize to target dimensions
  const resized = await sharp(input, { failOn: "truncated" })
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = resized.info;

  // Second pass: composite watermark SVG, then encode as WebP
  const watermarkSvg = buildWatermarkSvg(width, height);

  const result = await sharp(resized.data)
    .composite([{ input: watermarkSvg, blend: "over" }])
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    contentType: "image/webp",
    width: result.info.width,
    height: result.info.height,
    size: result.info.size,
  };
}

export function generateWebVariant(
  input: Buffer | Uint8Array,
  options?: { watermark?: boolean },
) {
  if (options?.watermark) {
    return generateVariantWithWatermark(input, WEB_MAX_DIMENSION, WEB_QUALITY);
  }
  return generateVariant(input, WEB_MAX_DIMENSION, WEB_QUALITY);
}

export function generateThumbnailVariant(input: Buffer | Uint8Array) {
  return generateVariant(input, THUMBNAIL_MAX_DIMENSION, THUMBNAIL_QUALITY);
}

export async function readImageMetadata(input: Buffer | Uint8Array) {
  const meta = await sharp(input).rotate().metadata();
  return {
    width: meta.width ?? null,
    height: meta.height ?? null,
  };
}

export function deriveWebpFilename(originalFilename: string) {
  const dot = originalFilename.lastIndexOf(".");
  const stem = dot > 0 ? originalFilename.slice(0, dot) : originalFilename;
  return `${stem}.webp`;
}
