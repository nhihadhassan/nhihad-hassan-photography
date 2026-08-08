import "server-only";
import type { Booking, InvoiceSnapshot } from "@/lib/bookings";
import { getOrAssignInvoiceNumber } from "@/lib/bookings";
import { listPaymentsForBooking } from "@/lib/finance";
import { computeInvoiceTotals, listInvoiceItems, type InvoiceTotals } from "@/lib/invoice-items";
import { computeInvoiceStatus, type InvoiceStatusKey } from "@/lib/invoice-status";
import { hasR2Config } from "@/lib/env";
import { getSignedReadUrl } from "@/lib/r2";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { brandConfig } from "@/lib/config";

export type InvoiceView = InvoiceTotals & {
  invoiceNumber: string;
  issuedAt: string;
  dueDate: string | null;
  poNumber: string | null;
  notes: string | null;
  paymentInstructions: string;
  clientName: string;
  clientEmail: string | null;
  shootType: string;
  shootDate: string | null;
  location: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  heroFocalX: number;
  heroFocalY: number;
  status: InvoiceStatusKey;
  sentAt: string | null;
  viewedAt: string | null;
  cancelledAt: string | null;
  /** True once first sent -- content (items/discount/tax/notes/etc) is frozen and no longer editable. */
  locked: boolean;
};

export function defaultPaymentInstructions(): string {
  return `Send an Interac e-Transfer to ${brandConfig.contactEmail}. Include the invoice number in the message.`;
}

async function getInvoiceHero(booking: Booking): Promise<{
  url: string | null;
  alt: string | null;
  focalX: number;
  focalY: number;
}> {
  const fallback = { url: null, alt: null, focalX: 50, focalY: 50 };
  if (!booking.gallery_id) return fallback;

  try {
    const admin = getServiceRoleSupabaseClient();
    const { data: gallery } = await admin
      .from("galleries")
      .select("title,cover_image_url,cover_image_alt,cover_photo_id,cover_focal_x,cover_focal_y")
      .eq("id", booking.gallery_id)
      .maybeSingle();

    if (!gallery) return fallback;
    const base = {
      alt: (gallery.cover_image_alt as string | null) ?? (gallery.title as string | null),
      focalX: Number(gallery.cover_focal_x) || 50,
      focalY: Number(gallery.cover_focal_y) || 50,
    };
    if (gallery.cover_image_url) return { ...base, url: String(gallery.cover_image_url) };
    if (!hasR2Config()) return { ...base, url: null };

    let key: string | null = null;
    if (gallery.cover_photo_id) {
      const { data: cover } = await admin
        .from("photos")
        .select("web_key,thumbnail_key")
        .eq("id", gallery.cover_photo_id)
        .maybeSingle();
      key = (cover?.web_key as string | null) ?? (cover?.thumbnail_key as string | null) ?? null;
    }
    if (!key) {
      const { data: first } = await admin
        .from("photos")
        .select("web_key,thumbnail_key")
        .eq("gallery_id", booking.gallery_id)
        .eq("is_hidden", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      key = (first?.web_key as string | null) ?? (first?.thumbnail_key as string | null) ?? null;
    }

    return { ...base, url: key ? await getSignedReadUrl(key) : null };
  } catch {
    // The invoice remains usable if a linked gallery or its image is removed.
    return fallback;
  }
}

function moneyRound(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Everything needed to render an invoice, in one place.
 *
 * The send action, the client-facing invoice page, the public PDF route, and
 * the admin preview all call this, so the numbers a client sees can never drift
 * from the numbers the admin previewed. Previously each of those surfaces
 * repeated the same fetch-and-total block.
 *
 * Once first sent, content (items/discount/tax/due date/notes/payment
 * instructions/client and shoot details) is read from the frozen
 * invoice_snapshot instead of the live booking/line-item rows, so a later
 * edit never changes what a client already received. Payments always stay
 * live, since the whole point of Paid/Overdue/Partially paid is that they
 * update as money comes in.
 */
export async function getInvoiceView(booking: Booking): Promise<InvoiceView> {
  const [payments, assignedNumber, hero] = await Promise.all([
    listPaymentsForBooking(booking.id),
    getOrAssignInvoiceNumber(booking.id),
    getInvoiceHero(booking),
  ]);
  const paid = payments.reduce((sum, item) => sum + item.amount, 0);

  const snapshot = booking.invoice_snapshot;
  const content = snapshot
    ? {
        items: snapshot.items.map((item) => ({ ...item, amount: moneyRound(item.quantity * item.unitPrice) })),
        fallbackTotal: snapshot.items.length ? null : String(snapshot.subtotal),
        discount: String(snapshot.discount),
        taxRate: String(snapshot.taxRate),
        dueDate: snapshot.dueDate,
        poNumber: snapshot.poNumber,
        notes: snapshot.notes,
        paymentInstructions: snapshot.paymentInstructions,
        clientName: snapshot.clientName,
        clientEmail: snapshot.clientEmail,
        shootType: snapshot.shootType,
        shootDate: snapshot.shootDate,
        location: snapshot.location,
        invoiceNumber: snapshot.invoiceNumber,
      }
    : {
        items: await listInvoiceItems(booking.id),
        fallbackTotal: booking.total,
        discount: booking.invoice_discount,
        taxRate: booking.invoice_tax_rate,
        dueDate: booking.invoice_due_date,
        poNumber: booking.invoice_po_number,
        notes: booking.invoice_notes,
        paymentInstructions: booking.invoice_payment_instructions?.trim() || defaultPaymentInstructions(),
        clientName: booking.client_name ?? "Client",
        clientEmail: booking.client_email,
        shootType: booking.shoot_type ?? "Photography services",
        shootDate: booking.start_at,
        location: booking.location,
        invoiceNumber: assignedNumber ?? `NHP-${booking.token.slice(0, 8).toUpperCase()}`,
      };

  const totals = computeInvoiceTotals({
    items: content.items,
    fallbackTotal: content.fallbackTotal,
    deposit: booking.deposit,
    discount: content.discount,
    taxRate: content.taxRate,
    paid,
  });

  const status = computeInvoiceStatus({
    total: totals.total,
    paid,
    dueAt: content.dueDate,
    sentAt: booking.invoice_sent_at,
    viewedAt: booking.invoice_viewed_at,
    cancelledAt: booking.invoice_cancelled_at,
  });

  return {
    ...totals,
    invoiceNumber: content.invoiceNumber,
    issuedAt: booking.created_at,
    dueDate: content.dueDate,
    poNumber: content.poNumber,
    notes: content.notes,
    paymentInstructions: content.paymentInstructions,
    clientName: content.clientName,
    clientEmail: content.clientEmail,
    shootType: content.shootType,
    shootDate: content.shootDate,
    location: content.location,
    heroImageUrl: hero.url,
    heroImageAlt: hero.alt,
    heroFocalX: hero.focalX,
    heroFocalY: hero.focalY,
    status,
    sentAt: booking.invoice_sent_at,
    viewedAt: booking.invoice_viewed_at,
    cancelledAt: booking.invoice_cancelled_at,
    locked: Boolean(booking.invoice_sent_at),
  };
}

/** Captures an InvoiceView's editable content into the shape stored in invoice_snapshot. */
export function buildInvoiceSnapshot(view: InvoiceView): InvoiceSnapshot {
  return {
    items: view.items.map((item) => ({ id: item.id, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })),
    subtotal: view.subtotal,
    discount: view.discount,
    taxRate: view.taxRate,
    dueDate: view.dueDate,
    poNumber: view.poNumber,
    notes: view.notes,
    paymentInstructions: view.paymentInstructions,
    clientName: view.clientName,
    clientEmail: view.clientEmail,
    shootType: view.shootType,
    shootDate: view.shootDate,
    location: view.location,
    invoiceNumber: view.invoiceNumber,
  };
}
