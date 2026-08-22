import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createBooking } from "@/lib/bookings";
import { torontoLocalToUtc } from "@/lib/ics";
import {
  inquiryLocalStart,
  inquiryToBookingInput,
  normalizeInquiryStatus,
  type InquiryStatus,
} from "@/lib/inquiry-lifecycle";

export type InquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  event_type: string | null;
  package_name: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  budget: string | null;
  referral_source: string | null;
  message: string;
  created_at: string;
  status: InquiryStatus;
  booking_id: string | null;
  converted_at: string | null;
  internal_note: string | null;
};

const BASE_COLUMNS =
  "id,name,email,phone,event_type,package_name,event_date,event_time,location,budget,referral_source,message,created_at";
const LIFECYCLE_COLUMNS = "status,booking_id,converted_at,internal_note";

/**
 * Inquiries, newest first, with lifecycle fields.
 *
 * Falls back to the pre-lifecycle column set if the migration has not been
 * applied yet, so the app is safe to deploy on either side of it. Rows then
 * read as "new" with no booking link, which is exactly what they were.
 */
export async function getAdminInquiries(): Promise<InquiryRecord[]> {
  const supabase = await createSupabaseServerClient();

  const withLifecycle = await supabase
    .from("inquiries")
    .select(`${BASE_COLUMNS},${LIFECYCLE_COLUMNS}`)
    .order("created_at", { ascending: false });

  if (!withLifecycle.error) {
    return (withLifecycle.data ?? []).map((row) => ({
      ...(row as Record<string, unknown>),
      status: normalizeInquiryStatus((row as { status?: string }).status),
    })) as InquiryRecord[];
  }

  const legacy = await supabase
    .from("inquiries")
    .select(BASE_COLUMNS)
    .order("created_at", { ascending: false });

  if (legacy.error) throw new Error(legacy.error.message);

  return (legacy.data ?? []).map((row) => ({
    ...(row as Record<string, unknown>),
    status: "new" as const,
    booking_id: null,
    converted_at: null,
    internal_note: null,
  })) as InquiryRecord[];
}

export async function getInquiryById(id: string): Promise<InquiryRecord | null> {
  const all = await getAdminInquiries();
  return all.find((inquiry) => inquiry.id === id) ?? null;
}

export async function setInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("inquiries")
    .update({ status, status_changed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setInquiryNote(id: string, note: string | null): Promise<void> {
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin.from("inquiries").update({ internal_note: note }).eq("id", id);
  if (error) throw new Error(error.message);
}

export type ConversionResult =
  | { ok: true; bookingId: string; alreadyConverted: boolean }
  | { ok: false; message: string };

/**
 * Turn a lead into a booking, carrying every field the client already gave us.
 *
 * Idempotent on purpose: if this inquiry already points at a booking, it
 * returns that booking rather than creating a second one. Double-submitting
 * the convert button, or two tabs open on the same lead, must not produce
 * duplicate jobs.
 */
export async function convertInquiryToBooking(id: string): Promise<ConversionResult> {
  const inquiry = await getInquiryById(id);
  if (!inquiry) return { ok: false, message: "That inquiry no longer exists." };

  if (inquiry.booking_id) {
    return { ok: true, bookingId: inquiry.booking_id, alreadyConverted: true };
  }

  const local = inquiryLocalStart(inquiry.event_date, inquiry.event_time);
  const startAt = local ? torontoLocalToUtc(local)?.toISOString() ?? null : null;

  const { id: bookingId } = await createBooking(inquiryToBookingInput(inquiry, startAt));

  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("inquiries")
    .update({
      status: "converted",
      booking_id: bookingId,
      converted_at: new Date().toISOString(),
      status_changed_at: new Date().toISOString(),
    })
    .eq("id", id);

  // The booking exists either way. Surface the link failure rather than
  // silently leaving a lead that looks unconverted and can be converted again.
  if (error) {
    return {
      ok: false,
      message: `Booking created, but the inquiry could not be linked to it: ${error.message}`,
    };
  }

  return { ok: true, bookingId, alreadyConverted: false };
}
