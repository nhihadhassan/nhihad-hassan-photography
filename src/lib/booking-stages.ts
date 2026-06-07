/** Booking pipeline stages. Plain module (no server-only) so client components
 *  like the pipeline board can import these values. */
export type BookingStage = "inquiry" | "booked" | "shot" | "delivered" | "reviewed";

export const BOOKING_STAGES: BookingStage[] = ["inquiry", "booked", "shot", "delivered", "reviewed"];

export const BOOKING_STAGE_LABELS: Record<BookingStage, string> = {
  inquiry: "Inquiry",
  booked: "Booked",
  shot: "Shot",
  delivered: "Delivered",
  reviewed: "Reviewed",
};
