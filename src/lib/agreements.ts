import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getBookingAgreement } from "@/lib/booking-agreement";
import { advanceBookingStage } from "@/lib/bookings";
import {
  sendSignedAgreementEmails,
  sendAgreementAwaitingCountersignatureEmail,
} from "@/lib/notify-email";
import { brandConfig } from "@/lib/config";
import { hasR2Config } from "@/lib/env";
import { getSignedReadUrl } from "@/lib/r2";
import { siteUrl } from "@/lib/seo";
import {
  listAgreementDeliveries,
  type AgreementDelivery,
} from "@/lib/agreement-deliveries";
import { isAgreementPastExpiry } from "@/lib/agreement-status";
import { requiredAgreementSigners } from "@/lib/agreement-signers";
import {
  asClientDetails,
  type AgreementClientDetails,
} from "@/lib/agreement-client-details";

/** Per-client shoot details captured at request time and shown on the contract. */
export type AgreementDetails = {
  feeStructureVersion?: string;
  presentationVersion?: string;
  template?: string;
  partner?: string;
  signerName?: string;
  signerTitle?: string;
  secondSignerName?: string;
  secondSignerEmail?: string;
  secondSignerPhone?: string;
  effectiveDate?: string;
  clientAddress?: string;
  phone?: string;
  type?: string;
  description?: string;
  date?: string;
  startTime?: string;
  coverageTime?: string;
  location?: string;
  secondLocation?: string;
  onsiteContactName?: string;
  onsiteContactPhone?: string;
  secondShooter?: string;
  minimumEditedImages?: string;
  turnaroundBusinessDays?: string;
  specialRequests?: string;
  city?: string;
  cancellationNoticeDays?: string;
  mealHours?: string;
  total?: string;
  hourly?: string;
  deposit?: string;
  balance?: string;
  balanceDueDate?: string;
  lateFeePercent?: string;
  window?: string;
  rehostingFee?: string;
  revisionPolicy?: string;
  archiveWindow?: string;
  cancellationPolicy?: string;
  reschedulePolicy?: string;
  additionalCharges?: string;
  licenseType?: string;
  privacyOptOutFee?: string;
};

export type AgreementRequest = {
  id: string;
  gallery_id: string | null;
  token: string;
  client_name: string | null;
  client_email: string | null;
  details: AgreementDetails;
  client_details: AgreementClientDetails;
  message: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  client_submitted_at: string | null;
  photographer_signed_at: string | null;
  finalized_at: string | null;
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
  client_details: AgreementClientDetails;
  photographer_signer_name: string | null;
  photographer_signature_data_url: string | null;
  photographer_signed_at: string | null;
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
    feeStructureVersion: pick("feeStructureVersion"),
    presentationVersion: pick("presentationVersion"),
    template: pick("template"),
    partner: pick("partner"),
    signerName: pick("signerName"),
    signerTitle: pick("signerTitle"),
    secondSignerName: pick("secondSignerName"),
    secondSignerEmail: pick("secondSignerEmail"),
    secondSignerPhone: pick("secondSignerPhone"),
    effectiveDate: pick("effectiveDate"),
    clientAddress: pick("clientAddress"),
    phone: pick("phone"),
    type: pick("type"),
    description: pick("description"),
    date: pick("date"),
    startTime: pick("startTime"),
    coverageTime: pick("coverageTime"),
    location: pick("location"),
    secondLocation: pick("secondLocation"),
    onsiteContactName: pick("onsiteContactName"),
    onsiteContactPhone: pick("onsiteContactPhone"),
    secondShooter: pick("secondShooter"),
    minimumEditedImages: pick("minimumEditedImages"),
    turnaroundBusinessDays: pick("turnaroundBusinessDays"),
    specialRequests: pick("specialRequests"),
    city: pick("city"),
    cancellationNoticeDays: pick("cancellationNoticeDays"),
    mealHours: pick("mealHours"),
    total: pick("total"),
    hourly: pick("hourly"),
    deposit: pick("deposit"),
    balance: pick("balance"),
    balanceDueDate: pick("balanceDueDate"),
    lateFeePercent: pick("lateFeePercent"),
    window: pick("window"),
    rehostingFee: pick("rehostingFee"),
    revisionPolicy: pick("revisionPolicy"),
    archiveWindow: pick("archiveWindow"),
    cancellationPolicy: pick("cancellationPolicy"),
    reschedulePolicy: pick("reschedulePolicy"),
    additionalCharges: pick("additionalCharges"),
    licenseType: pick("licenseType"),
    privacyOptOutFee: pick("privacyOptOutFee"),
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
    client_details: asClientDetails(row.client_details),
    message: (row.message as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    viewed_at: (row.viewed_at as string | null) ?? null,
    client_submitted_at: (row.client_submitted_at as string | null) ?? null,
    photographer_signed_at: (row.photographer_signed_at as string | null) ?? null,
    finalized_at: (row.finalized_at as string | null) ?? null,
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
    client_details: asClientDetails(row.client_details),
    photographer_signer_name: (row.photographer_signer_name as string | null) ?? null,
    photographer_signature_data_url: (row.photographer_signature_data_url as string | null) ?? null,
    photographer_signed_at: (row.photographer_signed_at as string | null) ?? null,
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
        .is("expired_at", null)
        .is("client_submitted_at", null);
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

export async function getSignedAgreementsByToken(token: string): Promise<SignedAgreement[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data: req } = await admin
    .from("agreement_requests")
    .select("id")
    .eq("token", token)
    .maybeSingle();
  if (!req) return [];
  const { data, error } = await admin
    .from("signed_agreements")
    .select("*,galleries(title)")
    .eq("agreement_request_id", req.id as string)
    .order("signed_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapSigned);
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
    .is("client_submitted_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Only an active, unsigned contract can be changed.");
}

export async function updateAgreementDetails(id: string, details: AgreementDetails) {
  const admin = getServiceRoleSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("agreement_requests")
    .update({ details, updated_at: now })
    .eq("id", id)
    .is("signed_at", null)
    .is("revoked_at", null)
    .is("expired_at", null)
    .is("client_submitted_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Only an active, unsigned contract can be edited.");
}

export async function signAgreement(input: {
  token: string;
  signerName: string;
  signerEmail?: string | null;
  signatureDataUrl?: string | null;
  clientDetails?: AgreementClientDetails;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ ok: true; complete: boolean } | { ok: false; message: string }> {
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
  if (request.client_submitted_at) {
    return { ok: false, message: "This agreement is already with the photographer for countersignature." };
  }
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

  const { data: existingRows, error: existingError } = await admin
    .from("signed_agreements")
    .select("signer_email,agreement_snapshot")
    .eq("agreement_request_id", request.id)
    .order("signed_at", { ascending: true });
  if (existingError) return { ok: false, message: existingError.message };

  const requiredSigners = requiredAgreementSigners(request);
  const isDualSignature = requiredSigners.length > 1;
  const submittedEmail = (input.signerEmail ?? "").trim().toLowerCase();
  const assignedSigner = isDualSignature
    ? requiredSigners.find((signer) => signer.email === submittedEmail)
    : null;
  if (isDualSignature && !assignedSigner) {
    return { ok: false, message: "Please choose one of the people named as a signer." };
  }
  if (isDualSignature && assignedSigner && assignedSigner.name.toLowerCase() !== input.signerName.trim().toLowerCase()) {
    return { ok: false, message: `This signature must be completed as ${assignedSigner.name}.` };
  }
  if ((existingRows ?? []).some((row) => (row.signer_email as string | null)?.toLowerCase() === submittedEmail)) {
    return { ok: false, message: "This person has already signed the agreement." };
  }

  const firstSnapshot = (existingRows?.[0]?.agreement_snapshot as AgreementSnapshot | undefined);
  const snapshot: AgreementSnapshot = firstSnapshot ?? await (async () => {
    const terms = await getBookingAgreement(
      request.details.template,
      request.client_name ?? "",
      request.details.partner,
      request.details.secondSignerName,
      request.details.rehostingFee === "0",
    );
    return {
      photographerName: brandConfig.name,
      photographerEmail: brandConfig.contactEmail,
      intro: terms.intro,
      disclaimer: terms.disclaimer,
      sections: terms.sections,
      details: request.details,
      clientName: request.client_name,
      clientEmail: request.client_email,
    };
  })();

  const clientDetails = input.clientDetails ?? request.client_details;

  const { error: insertError } = await admin.from("signed_agreements").insert({
    agreement_request_id: request.id,
    gallery_id: request.gallery_id,
    signer_name: assignedSigner?.name ?? input.signerName,
    signer_email: assignedSigner?.email ?? input.signerEmail ?? request.client_email ?? null,
    signature_data_url: input.signatureDataUrl ?? null,
    agreement_snapshot: snapshot,
    client_details: clientDetails,
    signed_ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
  });
  if (insertError) return { ok: false, message: insertError.message };

  // Every required client signature is in. The contract now returns to the
  // photographer for review; only the countersignature finalizes it, so
  // signed_at stays null and the booking does not advance yet.
  const complete = (existingRows?.length ?? 0) + 1 >= Math.max(1, requiredSigners.length);
  const now = new Date().toISOString();
  await admin
    .from("agreement_requests")
    .update({
      client_details: clientDetails,
      ...(complete ? { client_submitted_at: now } : {}),
      updated_at: now,
    })
    .eq("id", request.id);

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  if (complete) {
    await sendAgreementAwaitingCountersignatureEmail({
      signerName: input.signerName,
      clientEmail: input.signerEmail ?? request.client_email,
      adminUrl: `${origin}/admin/agreements`,
    }).catch(() => undefined);
  }

  return { ok: true, complete };
}

/**
 * Photographer countersignature. This is the only path that finalizes an
 * agreement: it stamps the staged timestamps, advances the linked booking and
 * releases the completed copy to the client.
 */
export async function countersignAgreement(input: {
  id: string;
  signerName: string;
  signatureDataUrl?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = getServiceRoleSupabaseClient();
  const { data: row } = await admin
    .from("agreement_requests")
    .select("*,galleries(title)")
    .eq("id", input.id)
    .maybeSingle();
  if (!row) return { ok: false, message: "This agreement no longer exists." };
  const request = mapRequest(row as Record<string, unknown>);
  if (request.revoked_at) return { ok: false, message: "This agreement has been revoked." };
  if (request.finalized_at) return { ok: false, message: "This agreement is already final." };
  if (!request.client_submitted_at) {
    return { ok: false, message: "The client has not signed and returned this agreement yet." };
  }

  const now = new Date().toISOString();
  const { error: signedError } = await admin
    .from("signed_agreements")
    .update({
      photographer_signer_name: input.signerName,
      photographer_signature_data_url: input.signatureDataUrl ?? null,
      photographer_signed_at: now,
    })
    .eq("agreement_request_id", request.id);
  if (signedError) return { ok: false, message: signedError.message };

  const { data: updated, error: updateError } = await admin
    .from("agreement_requests")
    .update({
      photographer_signed_at: now,
      finalized_at: now,
      signed_at: now,
      updated_at: now,
    })
    .eq("id", request.id)
    .is("finalized_at", null)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (updateError) return { ok: false, message: updateError.message };
  if (!updated) return { ok: false, message: "This agreement could not be finalized." };

  // Auto-advance the linked booking. A finalized contract moves the job to
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

  // Release the completed copy to the client now that both parties have signed.
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  await sendSignedAgreementEmails({
    signerName: request.client_name ?? input.signerName,
    clientEmail: request.client_email,
    url: `${origin}/agreement/${request.token}`,
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
