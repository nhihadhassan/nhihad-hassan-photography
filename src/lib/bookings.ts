import "server-only";
import { randomBytes } from "node:crypto";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { DepositStatus } from "@/lib/payment-constants";
import { BOOKING_STAGES, BOOKING_STAGE_LABELS, normalizeStage, type BookingStage } from "@/lib/booking-stages";
import { deriveOperationalStage } from "@/lib/booking-stage-automation";
import { logBookingEvent } from "@/lib/events";

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
  delivery_due_date: string | null;
  calendar_event_id: string | null;
  stage_override: boolean;
  /** Flat amount off the invoice subtotal. Only applies to itemised invoices. */
  invoice_discount: string | null;
  invoice_due_date: string | null;
  invoice_po_number: string | null;
  /** Notes / terms printed at the foot of the invoice. */
  invoice_notes: string | null;
  invoice_tax_rate: string | null;
  invoice_payment_instructions: string | null;
  /** First time this invoice was emailed. Null while still a draft. */
  invoice_sent_at: string | null;
  /** First time the client opened the invoice link. */
  invoice_viewed_at: string | null;
  invoice_cancelled_at: string | null;
  /** Frozen invoice content as of the first send -- see getInvoiceView(). */
  invoice_snapshot: InvoiceSnapshot | null;
  created_at: string;
  updated_at: string;
};

/** Content frozen into bookings.invoice_snapshot the first time an invoice is sent. */
export type InvoiceSnapshot = {
  items: { id: string; description: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  taxRate: number;
  dueDate: string | null;
  poNumber: string | null;
  notes: string | null;
  paymentInstructions: string;
  clientName: string;
  clientEmail: string | null;
  shootType: string;
  shootDate: string | null;
  location: string | null;
  invoiceNumber: string;
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
    sent_at: string | null;
    signed_at: string | null;
    revoked_at: string | null;
  } | null;
};

export type BookingWithLinks = Booking & BookingLinks;

const SELECT =
  "*,galleries(title,slug,is_published,deposit_status),agreement_requests(token,sent_at,signed_at,revoked_at)";

function generateToken() {
  return randomBytes(24).toString("hex");
}

function mapBooking(row: Record<string, unknown>): BookingWithLinks {
  const gallery = row.galleries as
    | { title?: string | null; slug?: string | null; is_published?: boolean; deposit_status?: string | null }
    | null;
  const agreement = row.agreement_requests as
    | { token?: string; sent_at?: string | null; signed_at?: string | null; revoked_at?: string | null }
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
    stage: normalizeStage(row.stage as string | null),
    delivery_due_date: (row.delivery_due_date as string | null) ?? null,
    calendar_event_id: (row.calendar_event_id as string | null) ?? null,
    stage_override: Boolean(row.stage_override),
    invoice_discount: (row.invoice_discount as string | null) ?? null,
    invoice_due_date: (row.invoice_due_date as string | null) ?? null,
    invoice_po_number: (row.invoice_po_number as string | null) ?? null,
    invoice_notes: (row.invoice_notes as string | null) ?? null,
    invoice_tax_rate: (row.invoice_tax_rate as string | null) ?? null,
    invoice_payment_instructions: (row.invoice_payment_instructions as string | null) ?? null,
    invoice_sent_at: (row.invoice_sent_at as string | null) ?? null,
    invoice_viewed_at: (row.invoice_viewed_at as string | null) ?? null,
    invoice_cancelled_at: (row.invoice_cancelled_at as string | null) ?? null,
    invoice_snapshot: (row.invoice_snapshot as InvoiceSnapshot | null) ?? null,
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
          sent_at: agreement.sent_at ?? null,
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
  deliveryDueDate?: string | null;
  calendarEventId?: string | null;
  stage?: BookingStage;
  stageOverride?: boolean;
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
    ...(input.deliveryDueDate !== undefined ? { delivery_due_date: input.deliveryDueDate } : {}),
    ...(input.calendarEventId !== undefined ? { calendar_event_id: input.calendarEventId } : {}),
    ...(input.stage ? { stage: input.stage } : {}),
    ...(input.stageOverride !== undefined ? { stage_override: input.stageOverride } : {}),
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
    .update({ stage, stage_override: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Operational stage shown across Today/Pipeline. Automatic facts may move a
 * job forward, while an explicit manual move remains authoritative. */
export function getOperationalBookingStage(
  booking: Pick<BookingWithLinks, "stage" | "stage_override" | "start_at" | "end_at" | "gallery">,
  now = new Date(),
): BookingStage {
  return deriveOperationalStage({
    storedStage: booking.stage,
    manualOverride: booking.stage_override,
    shootStart: booking.start_at,
    shootEnd: booking.end_at,
    galleryPublished: Boolean(booking.gallery?.is_published),
    now,
  });
}

/**
 * Auto-advance a booking to `target` only if that is later in the pipeline than
 * where it sits now. Never moves a job backward and is a no-op if already at or
 * past the target, so wiring it into event mutations is safe and idempotent.
 * Best-effort: a failure here never breaks the triggering mutation.
 */
export async function advanceBookingStage(
  bookingId: string,
  target: BookingStage,
): Promise<void> {
  try {
    const admin = getServiceRoleSupabaseClient();
    const { data } = await admin
      .from("bookings")
      .select("stage")
      .eq("id", bookingId)
      .maybeSingle();
    if (!data) return;
    const current = normalizeStage(data.stage as string | null);
    const from = BOOKING_STAGES.indexOf(current);
    const to = BOOKING_STAGES.indexOf(target);
    if (to <= from) return;
    const { error } = await admin
      .from("bookings")
      .update({ stage: target, updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (error) return;
    await logBookingEvent({
      bookingId,
      type: "stage",
      summary: `Moved to ${BOOKING_STAGE_LABELS[target]}`,
      actor: "system",
      payload: { from: current, to: target },
    });
  } catch {
    // swallow: stage automation is a convenience, not a system of record
  }
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
