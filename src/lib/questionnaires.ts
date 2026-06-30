import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { QUESTIONNAIRE_QUESTIONS } from "@/lib/questionnaire-questions";

export type Questionnaire = {
  id: string;
  token: string;
  booking_id: string | null;
  gallery_id: string | null;
  client_name: string | null;
  client_email: string | null;
  responses: Record<string, string>;
  sent_at: string | null;
  viewed_at: string | null;
  submitted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  gallery_title?: string | null;
};

function generateToken() {
  return randomBytes(24).toString("hex");
}

function asResponses(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const q of QUESTIONNAIRE_QUESTIONS) {
    const v = (value as Record<string, unknown>)[q.id];
    if (typeof v === "string") out[q.id] = v;
  }
  return out;
}

function map(row: Record<string, unknown>): Questionnaire {
  const gallery = row.galleries as { title?: string | null } | null;
  return {
    id: String(row.id),
    token: String(row.token),
    booking_id: (row.booking_id as string | null) ?? null,
    gallery_id: (row.gallery_id as string | null) ?? null,
    client_name: (row.client_name as string | null) ?? null,
    client_email: (row.client_email as string | null) ?? null,
    responses: asResponses(row.responses),
    sent_at: (row.sent_at as string | null) ?? null,
    viewed_at: (row.viewed_at as string | null) ?? null,
    submitted_at: (row.submitted_at as string | null) ?? null,
    revoked_at: (row.revoked_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    gallery_title: gallery?.title ?? null,
  };
}

export async function createQuestionnaire(input: {
  bookingId?: string | null;
  galleryId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  markSent?: boolean;
}) {
  const admin = getServiceRoleSupabaseClient();
  const token = generateToken();
  const { data, error } = await admin
    .from("questionnaires")
    .insert({
      token,
      booking_id: input.bookingId ?? null,
      gallery_id: input.galleryId ?? null,
      client_name: input.clientName ?? null,
      client_email: input.clientEmail ?? null,
      sent_at: input.markSent ? new Date().toISOString() : null,
    })
    .select("id,token")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create questionnaire.");
  return { id: data.id as string, token: data.token as string };
}

export async function getAdminQuestionnaires(): Promise<Questionnaire[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("questionnaires")
    .select("*,galleries(title)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(map);
}

export async function getQuestionnaireByToken(token: string): Promise<Questionnaire | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin
    .from("questionnaires")
    .select("*,galleries(title)")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const q = map(data as Record<string, unknown>);
  if (q.revoked_at) return null;
  if (!q.viewed_at) {
    await admin
      .from("questionnaires")
      .update({ viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", q.id);
  }
  return q;
}

export async function submitQuestionnaire(
  token: string,
  responses: Record<string, string>,
): Promise<{ ok: boolean; message: string }> {
  const admin = getServiceRoleSupabaseClient();
  const { data: row } = await admin.from("questionnaires").select("id,revoked_at").eq("token", token).maybeSingle();
  if (!row) return { ok: false, message: "This questionnaire link is no longer available." };
  if (row.revoked_at) return { ok: false, message: "This questionnaire link has been turned off." };

  const clean: Record<string, string> = {};
  for (const q of QUESTIONNAIRE_QUESTIONS) {
    const v = responses[q.id];
    if (typeof v === "string" && v.trim()) clean[q.id] = v.trim();
  }
  const { error } = await admin
    .from("questionnaires")
    .update({ responses: clean, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", row.id as string);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Submitted." };
}

export async function revokeQuestionnaire(id: string) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("questionnaires")
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
