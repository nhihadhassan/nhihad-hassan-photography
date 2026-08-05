import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { recordInvoiceDeliveryEvent } from "@/lib/invoice-deliveries";
import { recordAgreementDeliveryEvent } from "@/lib/agreement-deliveries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failureReason(event: unknown): string | null {
  const data = (event as {
    data?: {
    bounce?: { message?: string };
    failed?: { reason?: string };
    suppressed?: { message?: string };
    };
  }).data;
  return (
    data?.bounce?.message ??
    data?.failed?.reason ??
    data?.suppressed?.message ??
    null
  );
}

export async function POST(request: Request) {
  if (!env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Missing signature headers." }, { status: 400 });
  }

  const resend = new Resend(env.RESEND_API_KEY ?? "re_webhook_verification_only");
  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook." }, { status: 400 });
  }

  try {
    if (!event.type.startsWith("email.") || !("email_id" in event.data)) {
      return NextResponse.json({ ok: true, result: "ignored" });
    }

    const deliveryEvent = {
      eventId: id,
      resendMessageId: event.data.email_id,
      eventType: event.type,
      occurredAt: event.created_at,
      failureReason: failureReason(event),
    };
    const invoiceResult = await recordInvoiceDeliveryEvent(deliveryEvent);
    const result = invoiceResult === "ignored"
      ? await recordAgreementDeliveryEvent(deliveryEvent)
      : invoiceResult;
    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
