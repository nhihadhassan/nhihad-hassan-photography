import "server-only";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireR2Config } from "@/lib/env";

let cachedClient: S3Client | null = null;

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const { accountId, accessKeyId, secretAccessKey, endpoint } = requireR2Config();

  cachedClient = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  void accountId;
  return cachedClient;
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export type PhotoVariant = "originals" | "web" | "thumbnails";

export function buildObjectKey({
  galleryId,
  variant,
  filename,
}: {
  galleryId: string;
  variant: PhotoVariant;
  filename: string;
}) {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  return `galleries/${galleryId}/${variant}/${randomUUID()}-${safeFilename}`;
}

export async function uploadToR2({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}) {
  const { bucket } = requireR2Config();
  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteFromR2(key: string) {
  const { bucket } = requireR2Config();
  const client = getClient();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function deleteManyFromR2(keys: string[]) {
  if (!keys.length) {
    return;
  }

  await Promise.all(keys.map((key) => deleteFromR2(key)));
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  const { bucket } = requireR2Config();
  const client = getClient();

  const result = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!result.Body) {
    throw new Error(`R2 object has no body: ${key}`);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function getSignedReadUrl(key: string, ttlSeconds = 3600) {
  const { bucket } = requireR2Config();
  const client = getClient();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: ttlSeconds },
  );
}
