import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getBookingAgreement } from "@/lib/booking-agreement";
import { advanceBookingStage } from "@/lib/bookings";
import { sendSignedAgreementEmails } from "@/lib/notify-email";
import { brandConfig } from "@/lib/config";
import { hasR2Config } from "@/lib/env";
import { getSignedReadUrl } from "@/lib/r2";
import { siteUrl } from "@/lib/seo";
import {
  listAgreementDeliveries,
  type AgreementDelivery,
} from "@/lib/agreement-deliveries";
import { isAgreementPastExpiry } from "@/lib/agreement-status";

/** Per-client shoot details captured at request time and shown on the contract. */
export type AgreementDetails = {
  template?: string;
  partner?: string;
  type?: string;
  date?: string;
  location?: string;
  total?: string;
  deposit?: string;
  balance?: string;
  window?: string;
};

export type AgreementRequest = {
  id: string;
  gallery_id: string | null;
  token: string;
  client_name: string | null;
  client_email: string | null;
  details: AgreementDetails;
  message: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  expired_at: string | null;
  reminders_enabled: boolean;
  reminder_interval_days: number;
  reminder_max_sends: number;
  reminder_count: number;
  last_reminder_at: string | null;
  last_reminder_attempt_at: string | null;
  last_reminder_error: string | null;
  last_reminder_message_id: string | null;
  created_at: string;
  updated_at: string;
  gallery_title?: string | null;
  latest_delivery: AgreementDelivery | null;
};

export type AgreementCover = {
  url: string;
  alt: string;
  focalX: number;
  focalY: number;
};

export type SignedAgreement = {
  id: string;
  agreement_request_id: string | null;
  gallery_id: string | null;
  signer_name: string;
  signer_email: string | null;
  signature_data_url: string | null;
  agreement_snapshot: AgreementSnapshot;
  signed_ip: string | null;
  user_agent: string | null;
  signed_at: string;
  created_at: string;
  gallery_title?: string | null;
};

export type AgreementSnapshot = {
  photographerName: string;
  photographerEmail: string;
  intro: string;
  disclaimer: string;
  sections: { heading: string; clauses: string[] }[];
  details: AgreementDetails;
  clientName: string | null;
  clientEmail: string | null;
};

function generateToken() {
  return randomBytes(32).toString("hex");
}

function asDetails(value: unknown): AgreementDetails {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const pick = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : undefined);
  return {
    template: pick("template"),
    partner: pick("partner"),
    type: pick("type"),
    date: pick("date"),
    location: pick("location"),
    total: pick("total"),
    deposit: pick("deposit"),
    balance: pick("balance"),
    window: pick("window"),
  };
}

function mapRequest(row: Record<string, unknown>): AgreementRequest {
  const gallery = row.galleries as { title?: string | null } | null;
  return {
    id: String(row.id),
    gallery_id: (row.gallery_id as string | null) ?? null,
    token: String(row.token),
    client_name: (row.client_name as string | null) ?? null,
    client_email: (row.client_email as string | null) ?? null,
    details: asDetails(row.details),
    message: (row.message as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    viewed_at: (row.viewed_at as string | null) ?? null,
    signed_at: (row.signed_at as string | null) ?? null,
    revoked_at: (row.revoked_at as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
    expired_at: (row.expired_at as string | null) ?? null,
    reminders_enabled: Boolean(row.reminders_enabled),
    reminder_interval_days: Math.max(1, Number(row.reminder_interval_days) || 3),
    reminder_max_sends: Math.max(1, Number(row.reminder_max_sends) || 3),
    reminder_count: Math.max(0, Number(row.reminder_count) || 0),
    last_reminder_at: (row.last_reminder_at as string | null) ?? null,
    last_reminder_attempt_at: (row.last_reminder_attempt_at as string | null) ?? null,
    last_reminder_error: (row.last_reminder_error as string | null) ?? null,
    last_reminder_message_id: (row.last_reminder_message_id as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    gallery_title: gallery?.title ?? null,
    latest_delivery: null,
  };
}

function mapSigned(row: Record<string, unknown>): SignedAgreement {
  const gallery = row.galleries as { title?: string | null } | null;
  return {
    id: String(row.id),
    agreement_request_id: (row.agreement_request_id as string | null) ?? null,
    gallery_id: (row.gallery_id as string | null) ?? null,
    signer_name: String(row.signer_name),
    signer_email: (row.signer_email as string | null) ?? null,
    signature_data_url: (row.signature_data_url as string | null) ?? null,
    agreement_snapshot: (row.agreement_snapshot as AgreementSnapshot) ?? null,
    signed_ip: (row.signed_ip as string | null) ?? null,
    user_agent: (row.user_agent as string | null) ?? null,
    signed_at: String(row.signed_at),
    created_at: String(row.created_at),
    gallery_title: gallery?.title ?? null,
  };
}

export async function createAgreementRequest(input: {
  galleryId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  details?: AgreementDetails;
  message?: string | null;
  expiresAt?: string | null;
  remindersEnabled?: boolean;
  reminderIntervalDays?: number;
  reminderMaxSends?: number;
}) {
  const admin = getServiceRoleSupabaseClient();
  const token = generateToken();
  const { data, error } = await admin
    .from("agreement_requests")
    .insert({
      gallery_id: input.galleryId ?? null,
      token,
      client_name: input.clientName ?? null,
      client_email: input.clientEmail ?? null,
      details: input.details ?? {},
      message: input.message ?? null,
      expires_at: input.expiresAt ?? null,
      reminders_enabled: input.remindersEnabled ?? false,
      reminder_interval_days: input.reminderIntervalDays ?? 3,
      reminder_max_sends: input.reminderMaxSends ?? 3,
      sent_at: null,
    })
    .select("id,token")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create agreement request.");
  return { id: data.id as string, token: data.token as string };
}

export async function getAdminAgreementRequests(): Promise<AgreementRequest[]> {
  const admin = getServiceRoleSupabaseClient();
  const [{ data, error }, deliveries] = await Promise.all([
    admin
      .from("agreement_requests")
      .select("*,galleries(title)")
      .order("created_at", { ascending: false }),
    listAgreementDeliveries(),
  ]);
  if (error) throw new Error(error.message);
  const latestByRequest = new Map<string, AgreementDelivery>();
  for (const delivery of deliveries) {
    if (!latestByRequest.has(delivery.agreement_request_id)) {
      latestByRequest.set(delivery.agreement_request_id, delivery);
    }
  }
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const request = mapRequest(row);
    request.latest_delivery = latestByRequest.get(request.id) ?? null;
    return request;
  });
}

export async function getAgreementRequestById(id: string): Promise<AgreementRequest | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("agreement_requests")
    .select("*,galleries(title)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRequest(data as Record<string, unknown>) : null;
}

export async function getAgreementRequestByToken(token: string): Promise<AgreementRequest | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("agreement_requests")
    .select("*,galleries(title)")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  const request = mapRequest(data as Record<string, unknown>);
  if (request.revoked_at) return null;
  if (isAgreementPastExpiry(request)) {
    if (!request.expired_at) {
      const expiredAt = new Date().toISOString();
      await admin
        .from("agreement_requests")
        .update({ expired_at: expiredAt, updated_at: expiredAt })
        .eq("id", request.id)
        .is("signed_at", null)
        .is("revoked_at", null)
        .is("expired_at", null);
    }
    return null;
  }
  if (!request.viewed_at) {
    await admin
      .from("agreement_requests")
      .update({ viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", request.id);
  }
  return request;
}

/** Resolve only the linked gallery cover needed by the tokenized signing page. */
export async function getAgreementCover(galleryId: string | null): Promise<AgreementCover | null> {
  if (!galleryId) return null;
  const admin = getServiceRoleSupabaseClient();
  const { data: gallery } = await admin
    .from("galleries")
    .select("title,cover_image_url,cover_image_alt,cover_photo_id,cover_focal_x,cover_focal_y")
    .eq("id", galleryId)
    .maybeSingle();

  if (!gallery) return null;

  const base = {
    alt: (gallery.cover_image_alt as string | null) || `${gallery.title as string} gallery cover`,
    focalX: (gallery.cover_focal_x as number | null) ?? 50,
    focalY: (gallery.cover_focal_y as number | null) ?? 50,
  };
  if (gallery.cover_image_url) return { ...base, url: gallery.cover_image_url as string };
  if (!hasR2Config()) return null;

  let key: string | null = null;
  if (gallery.cover_photo_id) {
    const { data: cover } = await admin
      .from("photos")
      .select("web_key,thumbnail_key")
      .eq("id", gallery.cover_photo_id as string)
      .maybeSingle();
    key = (cover?.web_key as string | null) ?? (cover?.thumbnail_key as string | null) ?? null;
  }

  if (!key) {
    const { data: first } = await admin
      .from("photos")
      .select("web_key,thumbnail_key")
      .eq("gallery_id", galleryId)
      .eq("is_hidden", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    key = (first?.web_key as string | null) ?? (first?.thumbnail_key as string | null) ?? null;
  }

  return key ? { ...base, url: await getSignedReadUrl(key) } : null;
}

export async function getSignedAgreementByToken(token: string): Promise<SignedAgreement | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data: req } = await admin
    .from("agreement_requests")
    .select("id")
    .eq("token", token)
    .maybeSingle();
  if (!req) return null;
  const { data } = await admin
    .from("signed_agreements")
    .select("*,galleries(title)")
    .eq("agreement_request_id", req.id as string)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapSigned(data as Record<string, unknown>) : null;
}

export async function revokeAgreementRequest(id: string) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("agreement_requests")
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateAgreementAutomationSettings(
  id: string,
  input: {
    expiresAt: string | null;
    remindersEnabled: boolean;
    reminderIntervalDays: number;
    reminderMaxSends: number;
  },
) {
  const admin = getServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("agreement_requests")
    .update({
      expires_at: input.expiresAt,
      reminders_enabled: input.remindersEnabled,
      reminder_interval_days: input.reminderIntervalDays,
      reminder_max_sends: input.reminderMaxSends,
      updated_at: now,
    })
    .eq("id", id)
    .is("signed_at", null)
    .is("revoked_at", null)
    .is("expired_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Only an active, unsigned contract can be changed.");
}

export async function signAgreement(input: {
  token: string;
  signerName: string;
  signerEmail?: string | null;
  signatureDataUrl?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = getServiceRoleSupabaseClient();
  const { data: row } = await admin
    .from("agreement_requests")
    .select("*,galleries(title)")
    .eq("token", input.token)
    .maybeSingle();
  if (!row) return { ok: false, message: "This signing link is no longer available." };
  const request = mapRequest(row as Record<string, unknown>);
  if (request.revoked_at) return { ok: false, message: "This signing link has been turned off." };
  if (request.signed_at) return { ok: false, message: "This agreement has already been signed." };
  if (isAgreementPastExpiry(request)) {
    const expiredAt = new Date().toISOString();
    await admin
      .from("agreement_requests")
      .update({ expired_at: expiredAt, updated_at: expiredAt })
      .eq("id", request.id)
      .is("signed_at", null)
      .is("revoked_at", null);
    return { ok: false, message: "This agreement has expired and can no longer be signed." };
  }

  const terms = await getBookingAgreement(
    request.details.template,
    request.client_name ?? "",
    request.details.partner,
  );
  const snapshot: AgreementSnapshot = {
    photographerName: brandConfig.name,
    photographerEmail: brandConfig.contactEmail,
    intro: terms.intro,
    disclaimer: terms.disclaimer,
    sections: terms.sections,
    details: request.details,
    clientName: request.client_name,
    clientEmail: request.client_email,
  };

  const { error: insertError } = await admin.from("signed_agreements").insert({
    agreement_request_id: request.id,
    gallery_id: request.gallery_id,
    signer_name: input.signerName,
    signer_email: input.signerEmail ?? request.client_email ?? null,
    signature_data_url: input.signatureDataUrl ?? null,
    agreement_snapshot: snapshot,
    signed_ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
  });
  if (insertError) return { ok: false, message: insertError.message };

  await admin
    .from("agreement_requests")
    .update({ signed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", request.id);

  // Auto-advance the linked booking. A signed contract moves the job to
  // Booked when a deposit is already on file, otherwise to Contract out.
  const { data: linkedBooking } = await admin
    .from("bookings")
    .select("id")
    .eq("agreement_request_id", request.id)
    .maybeSingle();
  if (linkedBooking?.id) {
    const bookingId = linkedBooking.id as string;
    const { count } = await admin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("booking_id", bookingId);
    await advanceBookingStage(bookingId, (count ?? 0) > 0 ? "booked" : "contract_out");
  }

  // Email a copy to the client and a notification to the photographer.
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  await sendSignedAgreementEmails({
    signerName: input.signerName,
    clientEmail: input.signerEmail ?? request.client_email,
    url: `${origin}/agreement/${input.token}`,
  }).catch(() => undefined);

  return { ok: true };
}

export async function getAdminSignedAgreements(): Promise<SignedAgreement[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("signed_agreements")
    .select("*,galleries(title)")
    .order("signed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapSigned);
}

export async function getSignedAgreementById(id: string): Promise<SignedAgreement | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin
    .from("signed_agreements")
    .select("*,galleries(title)")
    .eq("id", id)
    .maybeSingle();
  return data ? mapSigned(data as Record<string, unknown>) : null;
}
