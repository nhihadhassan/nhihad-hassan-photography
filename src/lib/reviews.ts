import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceRoleSupabaseClient, hasServiceRoleClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/site-settings";

export type ReviewRequest = {
  id: string;
  gallery_id: string | null;
  token: string;
  client_name: string | null;
  client_email: string | null;
  message: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  google_clicked_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  gallery_title?: string | null;
  gallery_slug?: string | null;
};

export type ClientReview = {
  id: string;
  gallery_id: string | null;
  review_request_id: string | null;
  source: "google";
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  source_url: string | null;
  approved: boolean;
  google_review_id: string | null;
  google_create_time: string | null;
  google_update_time: string | null;
  created_at: string;
  updated_at: string;
  gallery_title?: string | null;
};

export type ReviewRequestWithGoogleUrl = ReviewRequest & {
  googleReviewUrl: string | null;
};

function generateReviewToken() {
  return randomBytes(32).toString("hex");
}

function mapRequest(row: Record<string, unknown>): ReviewRequest {
  const gallery = row.galleries as { title?: string | null; slug?: string | null } | null;
  return {
    id: String(row.id),
    gallery_id: (row.gallery_id as string | null) ?? null,
    token: String(row.token),
    client_name: (row.client_name as string | null) ?? null,
    client_email: (row.client_email as string | null) ?? null,
    message: (row.message as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    viewed_at: (row.viewed_at as string | null) ?? null,
    google_clicked_at: (row.google_clicked_at as string | null) ?? null,
    revoked_at: (row.revoked_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    gallery_title: gallery?.title ?? null,
    gallery_slug: gallery?.slug ?? null,
  };
}

function mapReview(row: Record<string, unknown>): ClientReview {
  const gallery = row.galleries as { title?: string | null } | null;
  return {
    id: String(row.id),
    gallery_id: (row.gallery_id as string | null) ?? null,
    review_request_id: (row.review_request_id as string | null) ?? null,
    source: "google",
    reviewer_name: String(row.reviewer_name),
    rating: Number(row.rating),
    review_text: String(row.review_text),
    review_date: String(row.review_date),
    source_url: (row.source_url as string | null) ?? null,
    approved: Boolean(row.approved),
    google_review_id: (row.google_review_id as string | null) ?? null,
    google_create_time: (row.google_create_time as string | null) ?? null,
    google_update_time: (row.google_update_time as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    gallery_title: gallery?.title ?? null,
  };
}

export async function createReviewRequest(input: {
  galleryId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  message?: string | null;
  markSent?: boolean;
}) {
  const admin = getServiceRoleSupabaseClient();
  const token = generateReviewToken();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("review_requests")
    .insert({
      gallery_id: input.galleryId ?? null,
      token,
      client_name: input.clientName ?? null,
      client_email: input.clientEmail ?? null,
      message: input.message ?? null,
      sent_at: input.markSent ? now : null,
    })
    .select("id,token")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create review request.");
  }

  return { id: data.id as string, token: data.token as string };
}

export async function getAdminReviewRequests(): Promise<ReviewRequest[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("review_requests")
    .select("*,galleries(title,slug)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapRequest);
}

export async function getReviewRequestByToken(
  token: string,
): Promise<ReviewRequestWithGoogleUrl | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("review_requests")
    .select("*,galleries(title,slug)")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;
  const request = mapRequest(data as Record<string, unknown>);
  if (request.revoked_at) return null;

  if (!request.viewed_at) {
    await admin
      .from("review_requests")
      .update({ viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", request.id);
  }

  const settings = await getSiteSettings();
  return { ...request, googleReviewUrl: settings.googleReviewUrl };
}

export async function markReviewRequestGoogleClicked(token: string) {
  const admin = getServiceRoleSupabaseClient();
  await admin
    .from("review_requests")
    .update({ google_clicked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("token", token)
    .is("revoked_at", null);
}

export async function revokeReviewRequest(id: string) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("review_requests")
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createClientReview(input: {
  galleryId?: string | null;
  reviewRequestId?: string | null;
  reviewerName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  sourceUrl?: string | null;
  approved: boolean;
  googleReviewId?: string | null;
  googleCreateTime?: string | null;
  googleUpdateTime?: string | null;
}) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin.from("client_reviews").insert({
    gallery_id: input.galleryId ?? null,
    review_request_id: input.reviewRequestId ?? null,
    source: "google",
    reviewer_name: input.reviewerName,
    rating: input.rating,
    review_text: input.reviewText,
    review_date: input.reviewDate,
    source_url: input.sourceUrl ?? null,
    approved: input.approved,
    google_review_id: input.googleReviewId ?? null,
    google_create_time: input.googleCreateTime ?? null,
    google_update_time: input.googleUpdateTime ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function getAdminClientReviews(): Promise<ClientReview[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("client_reviews")
    .select("*,galleries(title)")
    .order("review_date", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapReview);
}

export async function getApprovedClientReviews(limit = 6): Promise<ClientReview[]> {
  if (!hasServiceRoleClient()) return [];
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("client_reviews")
    .select("*,galleries(title)")
    .eq("approved", true)
    .order("review_date", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as Record<string, unknown>[]).map(mapReview);
}

export async function setClientReviewApproved(id: string, approved: boolean) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("client_reviews")
    .update({ approved, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClientReview(id: string) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin.from("client_reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
