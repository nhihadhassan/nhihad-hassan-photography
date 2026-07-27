import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type BookingEventType =
  | "inquiry"
  | "email"
  | "contract"
  | "payment"
  | "invoice"
  | "gallery"
  | "stage"
  | "note";

export type BookingEventActor = "admin" | "client" | "system";

export type BookingEvent = {
  id: string;
  booking_id: string;
  type: BookingEventType;
  summary: string;
  actor: BookingEventActor;
  payload: Record<string, unknown>;
  created_at: string;
};

/**
 * Append an event to a booking's activity feed. Best-effort: logging never
 * throws, so a failure here can never break the mutation that triggered it.
 * Existing mutations call this in addition to their own writes.
 */
export async function logBookingEvent(input: {
  bookingId: string;
  type: BookingEventType;
  summary: string;
  actor?: BookingEventActor;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = getServiceRoleSupabaseClient();
    await admin.from("booking_events").insert({
      booking_id: input.bookingId,
      type: input.type,
      summary: input.summary,
      actor: input.actor ?? "admin",
      payload: input.payload ?? {},
    });
  } catch {
    // swallow: the timeline is a convenience, not a system of record
  }
}

/** Read the stored events for a booking, newest first. */
export async function getBookingEvents(bookingId: string): Promise<BookingEvent[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("booking_events")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as BookingEvent[];
}
