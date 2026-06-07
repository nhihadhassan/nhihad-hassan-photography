import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  R2_ENDPOINT: z.string().url().optional(),
  GALLERY_ACCESS_SECRET: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  SELECTS_NOTIFICATION_TO: z.string().email().optional(),
  SELECTS_NOTIFICATION_FROM: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  GALLERY_ACCESS_SECRET: process.env.GALLERY_ACCESS_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SELECTS_NOTIFICATION_TO: process.env.SELECTS_NOTIFICATION_TO,
  SELECTS_NOTIFICATION_FROM: process.env.SELECTS_NOTIFICATION_FROM,
  CRON_SECRET: process.env.CRON_SECRET,
});

export function hasSupabaseBrowserConfig() {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      (env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

export function requireSupabaseBrowserConfig() {
  const publicKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !publicKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: publicKey,
  };
}

export function hasR2Config() {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME,
  );
}

export function hasServiceRoleKey() {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}

export function requireServiceRoleKey() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Required for password-protected gallery access.",
    );
  }
  return env.SUPABASE_SERVICE_ROLE_KEY;
}

export function hasGalleryAccessSecret() {
  return Boolean(env.GALLERY_ACCESS_SECRET);
}

export function requireGalleryAccessSecret() {
  if (!env.GALLERY_ACCESS_SECRET) {
    throw new Error(
      "Missing GALLERY_ACCESS_SECRET. Generate one with: openssl rand -hex 32",
    );
  }
  return env.GALLERY_ACCESS_SECRET;
}

export function hasPasswordProtectionConfig() {
  return hasGalleryAccessSecret() && hasServiceRoleKey();
}

export function hasSelectsEmailConfig() {
  return Boolean(
    env.RESEND_API_KEY && env.SELECTS_NOTIFICATION_TO && env.SELECTS_NOTIFICATION_FROM,
  );
}

export function getSelectsEmailConfig() {
  return {
    apiKey: env.RESEND_API_KEY ?? null,
    to: env.SELECTS_NOTIFICATION_TO ?? null,
    from: env.SELECTS_NOTIFICATION_FROM ?? null,
  };
}

/**
 * Gallery invite emails are sent TO the client (dynamic per gallery) FROM the
 * same address used for selects notifications. Only RESEND_API_KEY and
 * SELECTS_NOTIFICATION_FROM are required.
 */
export function hasGalleryInviteConfig() {
  return Boolean(env.RESEND_API_KEY && env.SELECTS_NOTIFICATION_FROM);
}

export function getGalleryInviteConfig() {
  return {
    apiKey: env.RESEND_API_KEY ?? null,
    from: env.SELECTS_NOTIFICATION_FROM ?? null,
  };
}

export function requireR2Config() {
  if (!hasR2Config()) {
    throw new Error(
      "Missing R2 configuration. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env.local.",
    );
  }

  return {
    accountId: env.R2_ACCOUNT_ID!,
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    bucket: env.R2_BUCKET_NAME!,
    publicBaseUrl: env.R2_PUBLIC_BASE_URL,
    endpoint:
      env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  };
}
