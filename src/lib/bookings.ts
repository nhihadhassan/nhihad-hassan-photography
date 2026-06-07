import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { DepositStatus } from "@/lib/payment-constants";
import { BOOKING_STAGES, type BookingStage } from "@/lib/booking-stages";

export { BOOKING_STAGES, BOOKING_STAGE_LABELS } from "@/lib/booking-stages";
export type { BookingStage } from "@/lib/booking-stages";

export type Booking = {
  id: string;
  token: string;
  gallery_id: string | null;
  agreement_request_id: string | null;
  client_name: string | null;
  client_email: string | null;
  shoot_type: string | null;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  total: string | null;
  deposit: string | null;
  balance: string | null;
  notes: string | null;
  internal_note: string | null;
  stage: BookingStage;
  created_at: string;
  updated_at: string;
};

export type BookingLinks = {
  gallery: {
    title: string | null;
    slug: string | null;
    is_published: boolean;
    deposit_status: DepositStatus | null;
  } | null;
  agreement: {
    token: string;
    signed_at: string | null;
    revoked_at: string | null;
  } | null;
};

export type BookingWithLinks = Booking & BookingLinks;

const SELECT =
  "*,galleries(title,slug,is_published,deposit_status),agreement_requests(token,signed_at,revoked_at)";

function generateToken() {
  return randomBytes(24).toString("hex");
}

function mapBooking(row: Record<string, unknown>): BookingWithLinks {
  const gallery = row.galleries as
    | { title?: string | null; slug?: string | null; is_published?: boolean; deposit_status?: string | null }
    | null;
  const agreement = row.agreement_requests as
    | { token?: string; signed_at?: string | null; revoked_at?: string | null }
    | null;
  return {
    id: String(row.id),
    token: String(row.token),
    gallery_id: (row.gallery_id as string | null) ?? null,
    agreement_request_id: (row.agreement_request_id as string | null) ?? null,
    client_name: (row.client_name as string | null) ?? null,
    client_email: (row.client_email as string | null) ?? null,
    shoot_type: (row.shoot_type as string | null) ?? null,
    start_at: (row.start_at as string | null) ?? null,
    end_at: (row.end_at as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    total: (row.total as string | null) ?? null,
    deposit: (row.deposit as string | null) ?? null,
    balance: (row.balance as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    internal_note: (row.internal_note as string | null) ?? null,
    stage: ((row.stage as BookingStage) ?? "booked"),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    gallery: gallery
      ? {
          title: gallery.title ?? null,
          slug: gallery.slug ?? null,
          is_published: Boolean(gallery.is_published),
          deposit_status: (gallery.deposit_status as DepositStatus | null) ?? null,
        }
      : null,
    agreement: agreement?.token
      ? {
          token: agreement.token,
          signed_at: agreement.signed_at ?? null,
          revoked_at: agreement.revoked_at ?? null,
        }
      : null,
  };
}

export type BookingInput = {
  galleryId?: string | null;
  agreementRequestId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  shootType?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  location?: string | null;
  total?: string | null;
  deposit?: string | null;
  balance?: string | null;
  notes?: string | null;
  internalNote?: string | null;
};

function toRow(input: BookingInput) {
  return {
    gallery_id: input.galleryId ?? null,
    agreement_request_id: input.agreementRequestId ?? null,
    client_name: input.clientName ?? null,
    client_email: input.clientEmail ?? null,
    shoot_type: input.shootType ?? null,
    start_at: input.startAt ?? null,
    end_at: input.endAt ?? null,
    location: input.location ?? null,
    total: input.total ?? null,
    deposit: input.deposit ?? null,
    balance: input.balance ?? null,
    notes: input.notes ?? null,
    internal_note: input.internalNote ?? null,
  };
}

export async function createBooking(input: BookingInput) {
  const admin = getServiceRoleSupabaseClient();
  const token = generateToken();
  const { data, error } = await admin
    .from("bookings")
    .insert({ ...toRow(input), token })
    .select("id,token")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create booking.");
  return { id: data.id as string, token: data.token as string };
}

export async function updateBooking(id: string, input: BookingInput) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("bookings")
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBooking(id: string) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin.from("bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAdminBookings(): Promise<BookingWithLinks[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("bookings")
    .select(SELECT)
    .order("start_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapBooking);
}

export async function getBookingById(id: string): Promise<BookingWithLinks | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin.from("bookings").select(SELECT).eq("id", id).maybeSingle();
  return data ? mapBooking(data as Record<string, unknown>) : null;
}

export async function updateBookingStage(id: string, stage: BookingStage) {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("bookings")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getBookingByToken(token: string): Promise<BookingWithLinks | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin.from("bookings").select(SELECT).eq("token", token).maybeSingle();
  return data ? mapBooking(data as Record<string, unknown>) : null;
}

/**
 * Return the booking's sequential invoice number, assigning one on first call.
 * Formatted as "INV-0001". Falls back to null if assignment fails.
 */
export async function getOrAssignInvoiceNumber(bookingId: string): Promise<string | null> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin.rpc("assign_invoice_no", { b_id: bookingId });
  if (error || data === null || data === undefined) return null;
  return `INV-${String(data).padStart(4, "0")}`;
}
