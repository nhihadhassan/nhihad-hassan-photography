/** Booking pipeline stages. Plain module (no server-only) so client components
 *  like the pipeline board can import these values. */
export type BookingStage =
  | "inquiry"
  | "proposal_sent"
  | "contract_out"
  | "booked"
  | "shot"
  | "editing"
  | "delivered"
  | "archived";

export const BOOKING_STAGES: BookingStage[] = [
  "inquiry",
  "proposal_sent",
  "contract_out",
  "booked",
  "shot",
  "editing",
  "delivered",
  "archived",
];

export const BOOKING_STAGE_LABELS: Record<BookingStage, string> = {
  inquiry: "Inquiry",
  proposal_sent: "Proposal sent",
  contract_out: "Contract out",
  booked: "Booked",
  shot: "Shot",
  editing: "Editing",
  delivered: "Delivered",
  archived: "Archived",
};

/**
 * Days a card can sit in a stage before it reads as stale. Tuned to the flow:
 * early sales stages go stale fast, post-shoot editing gets more room, and
 * booked/archived do not go stale (they are waiting on a scheduled date).
 */
export const STAGE_STALE_DAYS: Record<BookingStage, number | null> = {
  inquiry: 3,
  proposal_sent: 5,
  contract_out: 4,
  booked: null,
  shot: 7,
  editing: 14,
  delivered: null,
  archived: null,
};

/**
 * Coerce a stored stage to the current vocabulary. The pre-overhaul schema used
 * a 5-stage set whose only divergent value was `reviewed`; map it onto
 * `delivered` so legacy rows render correctly before the enum migration runs.
 */
export function normalizeStage(stage: string | null | undefined): BookingStage {
  if (stage === "reviewed") return "delivered";
  if (stage && (BOOKING_STAGES as string[]).includes(stage)) return stage as BookingStage;
  return "booked";
}
