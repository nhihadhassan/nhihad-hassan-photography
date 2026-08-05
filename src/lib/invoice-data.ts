import "server-only";
import type { Booking } from "@/lib/bookings";
import { getOrAssignInvoiceNumber } from "@/lib/bookings";
import { listPaymentsForBooking } from "@/lib/finance";
import { computeInvoiceTotals, listInvoiceItems, type InvoiceTotals } from "@/lib/invoice-items";
import { hasR2Config } from "@/lib/env";
import { getSignedReadUrl } from "@/lib/r2";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type InvoiceView = InvoiceTotals & {
  invoiceNumber: string;
  issuedAt: string;
  dueDate: string | null;
  poNumber: string | null;
  notes: string | null;
  clientName: string;
  clientEmail: string | null;
  shootType: string;
  shootDate: string | null;
  location: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  heroFocalX: number;
  heroFocalY: number;
};

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

/**
 * Everything needed to render an invoice, in one place.
 *
 * The send action, the client-facing invoice page, the public PDF route, and
 * the admin preview all call this, so the numbers a client sees can never drift
 * from the numbers the admin previewed. Previously each of those surfaces
 * repeated the same fetch-and-total block.
 */
export async function getInvoiceView(booking: Booking): Promise<InvoiceView> {
  const [payments, assignedNumber, items, hero] = await Promise.all([
    listPaymentsForBooking(booking.id),
    getOrAssignInvoiceNumber(booking.id),
    listInvoiceItems(booking.id),
    getInvoiceHero(booking),
  ]);

  const totals = computeInvoiceTotals({
    items,
    fallbackTotal: booking.total,
    deposit: booking.deposit,
    discount: booking.invoice_discount,
    paid: payments.reduce((sum, item) => sum + item.amount, 0),
  });

  return {
    ...totals,
    invoiceNumber: assignedNumber ?? `NHP-${booking.token.slice(0, 8).toUpperCase()}`,
    issuedAt: booking.created_at,
    dueDate: booking.invoice_due_date,
    poNumber: booking.invoice_po_number,
    notes: booking.invoice_notes,
    clientName: booking.client_name ?? "Client",
    clientEmail: booking.client_email,
    shootType: booking.shoot_type ?? "Photography services",
    shootDate: booking.start_at,
    location: booking.location,
    heroImageUrl: hero.url,
    heroImageAlt: hero.alt,
    heroFocalX: hero.focalX,
    heroFocalY: hero.focalY,
  };
}
