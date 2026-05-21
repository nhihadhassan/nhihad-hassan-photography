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

export function generateWebVariant(input: Buffer | Uint8Array) {
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
