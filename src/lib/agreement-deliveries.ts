import "server-only";
import { sendAgreementEmail } from "@/lib/notify-email";
import { defaultAgreementSubject } from "@/lib/emails/agreement-invite";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type AgreementDeliveryStatus =
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

export type AgreementDelivery = {
  id: string;
  agreement_request_id: string;
  sent_to: string;
  subject: string;
  status: AgreementDeliveryStatus;
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

export async function listAgreementDeliveries(): Promise<AgreementDelivery[]> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("agreement_deliveries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AgreementDelivery[];
}

async function createAgreementDeliveryAttempt(input: {
  agreementRequestId: string;
  sentTo: string;
  subject: string;
}): Promise<string> {
  const admin = getServiceRoleSupabaseClient();
  const { data, error } = await admin
    .from("agreement_deliveries")
    .insert({
      agreement_request_id: input.agreementRequestId,
      sent_to: input.sentTo,
      subject: input.subject,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not start agreement delivery.");
  return String(data.id);
}

async function markAgreementDeliverySent(id: string, resendMessageId: string): Promise<void> {
  const now = new Date().toISOString();
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("agreement_deliveries")
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

async function markAgreementDeliveryFailed(id: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  const admin = getServiceRoleSupabaseClient();
  const { error } = await admin
    .from("agreement_deliveries")
    .update({
      status: "failed",
      failed_at: now,
      last_event_at: now,
      failure_reason: reason,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function sendAgreementRequestEmail(input: {
  agreementRequestId: string;
  clientEmail: string;
  clientName: string | null;
  agreementUrl: string;
  expiresAt?: string | null;
  /** Contact fields left blank on the contract (e.g. "phone number", "mailing address"). */
  missingFields?: string[];
  /** Admin-edited subject/message from the Preview & Send composer. Falls back to the auto-generated default when blank. */
  subject?: string | null;
  message?: string | null;
}): Promise<{ ok: boolean; message: string; deliveryId?: string }> {
  const subject = input.subject?.trim() || defaultAgreementSubject();

  let deliveryId: string;
  try {
    deliveryId = await createAgreementDeliveryAttempt({
      agreementRequestId: input.agreementRequestId,
      sentTo: input.clientEmail,
      subject,
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not start agreement delivery.",
    };
  }

  console.info("[agreement-email] send started", {
    agreementRequestId: input.agreementRequestId,
    deliveryId,
  });

  const result = await sendAgreementEmail({
    to: input.clientEmail,
    clientName: input.clientName,
    agreementUrl: input.agreementUrl,
    expiresAt: input.expiresAt,
    missingFields: input.missingFields,
    subject: input.subject,
    message: input.message,
    idempotencyKey: `agreement-${deliveryId}`,
  });

  if (!result.ok || !result.messageId) {
    const message = result.ok ? "Email provider did not return a message id." : result.message;
    await markAgreementDeliveryFailed(deliveryId, message).catch(() => undefined);
    console.error("[agreement-email] send failed", {
      agreementRequestId: input.agreementRequestId,
      deliveryId,
      message,
    });
    return { ok: false, message, deliveryId };
  }

  try {
    await markAgreementDeliverySent(deliveryId, result.messageId);
    const now = new Date().toISOString();
    const admin = getServiceRoleSupabaseClient();
    // Set once, on the first successful send. This date doubles as the
    // photographer's effective signing date on the client-facing contract, so
    // a later resend must not push it forward.
    const { error } = await admin
      .from("agreement_requests")
      .update({ sent_at: now, updated_at: now })
      .eq("id", input.agreementRequestId)
      .is("sent_at", null);
    if (error) throw new Error(error.message);
  } catch (error) {
    return {
      ok: false,
      message: `Agreement email was accepted, but delivery history could not be finalized: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
      deliveryId,
    };
  }

  console.info("[agreement-email] send accepted", {
    agreementRequestId: input.agreementRequestId,
    deliveryId,
    resendMessageId: result.messageId,
  });
  return {
    ok: true,
    message: `Agreement emailed to ${input.clientEmail}.`,
    deliveryId,
  };
}

const WEBHOOK_STATUSES = new Set<AgreementDeliveryStatus>([
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

export async function recordAgreementDeliveryEvent(input: {
  eventId: string;
  resendMessageId: string;
  eventType: string;
  occurredAt: string;
  failureReason?: string | null;
}): Promise<"recorded" | "duplicate" | "ignored"> {
  const status = input.eventType.replace(/^email\./, "") as AgreementDeliveryStatus;
  if (!WEBHOOK_STATUSES.has(status)) return "ignored";

  const admin = getServiceRoleSupabaseClient();
  const { data: delivery } = await admin
    .from("agreement_deliveries")
    .select("id,last_event_at")
    .eq("resend_message_id", input.resendMessageId)
    .maybeSingle();
  if (!delivery) return "ignored";

  const { error: eventError } = await admin.from("agreement_delivery_events").insert({
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

  let query = admin.from("agreement_deliveries").update(patch).eq("id", delivery.id);
  if (delivery.last_event_at) query = query.lte("last_event_at", input.occurredAt);
  const { error: updateError } = await query;
  if (updateError) throw new Error(updateError.message);
  return "recorded";
}
