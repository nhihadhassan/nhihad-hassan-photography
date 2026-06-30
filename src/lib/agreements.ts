import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getBookingAgreement } from "@/lib/booking-agreement";
import { sendSignedAgreementEmails } from "@/lib/notify-email";
import { brandConfig } from "@/lib/config";
import { siteUrl } from "@/lib/seo";

/** Per-client shoot details captured at request time and shown on the contract. */
export type AgreementDetails = {
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
  created_at: string;
  updated_at: string;
  gallery_title?: string | null;
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
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    gallery_title: gallery?.title ?? null,
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
  markSent?: boolean;
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
      sent_at: input.markSent ? new Date().toISOString() : null,
    })
    .select("id,token")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create agreement request.");
  return { id: data.id as string, token: data.token as string };
}

export async function getAdminAgreementRequests(): Promise<AgreementRequest[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("agreement_requests")
    .select("*,galleries(title)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapRequest);
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
  if (!request.viewed_at) {
    await admin
      .from("agreement_requests")
      .update({ viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", request.id);
  }
  return request;
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

  const terms = await getBookingAgreement();
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
