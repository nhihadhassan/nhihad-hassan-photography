import "server-only";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type InvoiceDeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "delivery_delayed"
  | "bounced"
  | "failed"
  | "suppressed"
  | "complained";

export type InvoiceDelivery = {
  id: string;
  booking_id: string;
  sent_to: string;
  subject: string;
  status: InvoiceDeliveryStatus;
  resend_message_id: string | null;
  failure_reason: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  failed_at: string | null;
  last_event_at: string | null;
  created_at: string;
};

export async function listInvoiceDeliveries(): Promise<InvoiceDelivery[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("invoice_deliveries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InvoiceDelivery[];
}

export async function listInvoiceDeliveriesForBooking(
  bookingId: string,
): Promise<InvoiceDelivery[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("invoice_deliveries")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InvoiceDelivery[];
}

export async function createInvoiceDeliveryAttempt(input: {
  bookingId: string;
  sentTo: string;
  subject: string;
}): Promise<string> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("invoice_deliveries")
    .insert({
      booking_id: input.bookingId,
      sent_to: input.sentTo,
      subject: input.subject,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create invoice delivery.");
  return String(data.id);
}

export async function markInvoiceDeliverySent(
  id: string,
  resendMessageId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("invoice_deliveries")
    .update({
      status: "sent",
      resend_message_id: resendMessageId,
      sent_at: now,
      last_event_at: now,
      failure_reason: null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markInvoiceDeliveryFailed(id: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("invoice_deliveries")
    .update({
      status: "failed",
      failed_at: now,
      last_event_at: now,
      failure_reason: reason,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

const WEBHOOK_STATUSES = new Set<InvoiceDeliveryStatus>([
  "sent",
  "delivered",
  "opened",
  "clicked",
  "delivery_delayed",
  "bounced",
  "failed",
  "suppressed",
  "complained",
]);

export async function recordInvoiceDeliveryEvent(input: {
  eventId: string;
  resendMessageId: string;
  eventType: string;
  occurredAt: string;
  failureReason?: string | null;
}): Promise<"recorded" | "duplicate" | "ignored"> {
  const status = input.eventType.replace(/^email\./, "") as InvoiceDeliveryStatus;
  if (!WEBHOOK_STATUSES.has(status)) return "ignored";

  const admin = getServiceRoleSupabaseClient();
  const { data: delivery } = await admin
    .from("invoice_deliveries")
    .select("id,last_event_at")
    .eq("resend_message_id", input.resendMessageId)
    .maybeSingle();
  if (!delivery) return "ignored";

  const { error: eventError } = await admin.from("invoice_delivery_events").insert({
    id: input.eventId,
    delivery_id: delivery.id,
    resend_message_id: input.resendMessageId,
    event_type: input.eventType,
    occurred_at: input.occurredAt,
  });
  if (eventError?.code === "23505") return "duplicate";
  if (eventError) throw new Error(eventError.message);

  const patch: Record<string, string | null> = {
    status,
    last_event_at: input.occurredAt,
  };
  if (status === "delivered") patch.delivered_at = input.occurredAt;
  if (status === "opened") patch.opened_at = input.occurredAt;
  if (status === "clicked") patch.clicked_at = input.occurredAt;
  if (["bounced", "failed", "suppressed", "complained"].includes(status)) {
    patch.failed_at = input.occurredAt;
    patch.failure_reason = input.failureReason ?? status;
  }

  let query = admin.from("invoice_deliveries").update(patch).eq("id", delivery.id);
  if (delivery.last_event_at) query = query.lte("last_event_at", input.occurredAt);
  const { error: updateError } = await query;
  if (updateError) throw new Error(updateError.message);
  return "recorded";
}

export function successfulInvoiceDelivery(delivery: InvoiceDelivery): boolean {
  return !["pending", "failed", "bounced", "suppressed"].includes(delivery.status);
}
