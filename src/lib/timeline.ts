import "server-only";
import { getBookingEvents, type BookingEventType, type BookingEventActor } from "@/lib/events";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminQuestionnaires } from "@/lib/questionnaires";
import { listPayments } from "@/lib/finance";
import type { BookingWithLinks } from "@/lib/bookings";
import { formatMoney } from "@/lib/utils";

export type TimelineEntry = {
  id: string;
  type: BookingEventType;
  summary: string;
  actor: BookingEventActor;
  at: string;
};

/**
 * Assemble a booking's activity feed for the timeline spine. Stored
 * booking_events (notes, stage changes, and anything future mutations log) are
 * merged with events derived from existing timestamp columns, so history from
 * before the events table still shows. Sorted newest first.
 */
export async function getBookingTimeline(booking: BookingWithLinks): Promise<TimelineEntry[]> {
  const [stored, agreements, galleries, questionnaires, payments] = await Promise.all([
    getBookingEvents(booking.id),
    getAdminAgreementRequests(),
    getAdminGalleries(),
    getAdminQuestionnaires(),
    listPayments(),
  ]);

  const entries: TimelineEntry[] = [];

  // Stored events (notes, stage changes, and future mutation writes).
  for (const e of stored) {
    entries.push({ id: e.id, type: e.type, summary: e.summary, actor: e.actor, at: e.created_at });
  }

  // Booking created / inquiry.
  entries.push({
    id: `created-${booking.id}`,
    type: booking.stage === "inquiry" ? "inquiry" : "stage",
    summary: booking.stage === "inquiry" ? "Inquiry received" : "Booking created",
    actor: "system",
    at: booking.created_at,
  });

  // Contract lifecycle from the linked agreement request.
  const agreement = agreements.find((a) => a.id === booking.agreement_request_id);
  if (agreement) {
    if (agreement.sent_at)
      entries.push({ id: `c-sent-${agreement.id}`, type: "contract", summary: "Contract sent", actor: "admin", at: agreement.sent_at });
    if (agreement.viewed_at)
      entries.push({ id: `c-viewed-${agreement.id}`, type: "contract", summary: "Client opened the contract", actor: "client", at: agreement.viewed_at });
    if (agreement.signed_at)
      entries.push({ id: `c-signed-${agreement.id}`, type: "contract", summary: "Contract signed", actor: "client", at: agreement.signed_at });
    if (agreement.revoked_at)
      entries.push({ id: `c-revoked-${agreement.id}`, type: "contract", summary: "Contract revoked", actor: "admin", at: agreement.revoked_at });
  }

  // Payments recorded against this booking.
  for (const p of payments) {
    if (p.booking_id !== booking.id) continue;
    entries.push({
      id: `pay-${p.id}`,
      type: "payment",
      summary: `${p.kind === "deposit" ? "Deposit" : p.kind === "balance" ? "Balance" : "Payment"} recorded, ${formatMoney(p.amount)}`,
      actor: "admin",
      at: p.created_at,
    });
  }

  // Gallery published (no publish timestamp, so use the gallery's updated_at).
  if (booking.gallery_id) {
    const gallery = galleries.find((g) => g.id === booking.gallery_id);
    if (gallery?.is_published) {
      entries.push({
        id: `gallery-${gallery.id}`,
        type: "gallery",
        summary: "Gallery published",
        actor: "admin",
        at: gallery.updated_at,
      });
    }
  }

  // Questionnaire milestones.
  const questionnaire = questionnaires.find((q) => q.booking_id === booking.id);
  if (questionnaire) {
    if (questionnaire.submitted_at)
      entries.push({ id: `q-sub-${questionnaire.id}`, type: "note", summary: "Questionnaire submitted", actor: "client", at: questionnaire.submitted_at });
    else if (questionnaire.viewed_at)
      entries.push({ id: `q-view-${questionnaire.id}`, type: "note", summary: "Client opened the questionnaire", actor: "client", at: questionnaire.viewed_at });
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
