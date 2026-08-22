/**
 * Lead lifecycle vocabulary and the inquiry -> booking mapping.
 *
 * Plain module (no `server-only`) so the pipeline board and the inquiries
 * table, which are client components, can import the labels, and so the
 * mapping can be unit tested without a database.
 */
import type { BookingInput } from "@/lib/bookings";

export type InquiryStatus = "new" | "contacted" | "considering" | "converted" | "lost";

export const INQUIRY_STATUSES: InquiryStatus[] = [
  "new",
  "contacted",
  "considering",
  "converted",
  "lost",
];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New inquiry",
  contacted: "Contacted",
  considering: "Considering",
  converted: "Booked",
  lost: "Not booked",
};

/**
 * Statuses that are finished with. A lost lead is kept forever -- it is how you
 * see what did not convert -- but it should stop appearing in work queues.
 */
export const TERMINAL_INQUIRY_STATUSES: InquiryStatus[] = ["converted", "lost"];

export function isTerminalInquiryStatus(status: string | null | undefined): boolean {
  return TERMINAL_INQUIRY_STATUSES.includes(normalizeInquiryStatus(status));
}

/** Coerce a stored value to the current vocabulary; anything unknown is new. */
export function normalizeInquiryStatus(status: string | null | undefined): InquiryStatus {
  if (status && (INQUIRY_STATUSES as string[]).includes(status)) {
    return status as InquiryStatus;
  }
  return "new";
}

/** True when a lead still needs a reply. */
export function needsReply(status: string | null | undefined): boolean {
  return normalizeInquiryStatus(status) === "new";
}

export type ConvertibleInquiry = {
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
};

/**
 * Combine an inquiry's requested date and time into a Toronto-local
 * `datetime-local` string, or null when there is no usable date.
 *
 * The time is optional and frequently absent -- clients often give a date and
 * no hour -- in which case the booking is created with a date at midday, which
 * reads as "that day, time to be confirmed" rather than accidentally implying
 * midnight.
 */
export function inquiryLocalStart(
  eventDate: string | null,
  eventTime: string | null,
): string | null {
  if (!eventDate) return null;
  const date = eventDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const time = (eventTime ?? "").trim();
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return `${date}T12:00`;
  const hour = String(Math.min(23, Number(match[1]))).padStart(2, "0");
  const minute = String(Math.min(59, Number(match[2]))).padStart(2, "0");
  return `${date}T${hour}:${minute}`;
}

/**
 * Everything the client already told us, carried onto the new booking so none
 * of it has to be re-typed.
 *
 * What the client wrote and the softer sales context -- their message, stated
 * budget, and how they found us -- goes to the internal note rather than to
 * client-visible booking fields, because the booking hub is a page the client
 * themselves can open.
 */
export function inquiryToBookingInput(
  inquiry: ConvertibleInquiry,
  startAtIso: string | null,
): BookingInput {
  const context: string[] = [];
  if (inquiry.package_name) context.push(`Package requested: ${inquiry.package_name}`);
  if (inquiry.budget) context.push(`Budget: ${inquiry.budget}`);
  if (inquiry.referral_source) context.push(`Heard about us via: ${inquiry.referral_source}`);
  if (inquiry.phone) context.push(`Phone: ${inquiry.phone}`);
  if (!startAtIso && inquiry.event_date) {
    context.push(`Requested date: ${inquiry.event_date}${inquiry.event_time ? ` at ${inquiry.event_time}` : ""}`);
  }
  if (inquiry.message?.trim()) {
    context.push("", "From their inquiry:", inquiry.message.trim());
  }

  return {
    clientName: inquiry.name?.trim() || null,
    clientEmail: inquiry.email?.trim() || null,
    shootType: inquiry.event_type?.trim() || inquiry.package_name?.trim() || null,
    startAt: startAtIso,
    location: inquiry.location?.trim() || null,
    internalNote: context.length ? context.join("\n") : null,
    stage: "inquiry",
  };
}
