import "server-only";
import { getAdminBookings } from "@/lib/bookings";
import { getClientList } from "@/lib/clients";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminAgreementRequests } from "@/lib/agreements";

export type CommandIndexEntry = {
  id: string;
  label: string;
  hint: string;
  href: string;
};

/**
 * Compact jump-to index for the command palette.
 *
 * Covers bookings, clients, galleries and contracts -- the four things you
 * search for by a person's name. Invoices are deliberately absent as separate
 * entries: an invoice lives on its booking, so a booking result already gets
 * you there, and listing both would return the same client twice.
 *
 * Kept to name and link only, because this loads with every admin page.
 */
export async function getCommandIndex(): Promise<CommandIndexEntry[]> {
  const [bookings, clients, galleries, agreements] = await Promise.all([
    getAdminBookings(),
    getClientList(),
    getAdminGalleries(),
    getAdminAgreementRequests(),
  ]);

  const entries: CommandIndexEntry[] = [];

  for (const b of bookings) {
    entries.push({
      id: `booking-${b.id}`,
      label: b.client_name ?? b.shoot_type ?? "Booking",
      hint: "Booking",
      href: `/admin/bookings/${b.id}`,
    });
  }
  for (const c of clients) {
    entries.push({
      id: `client-${c.key}`,
      label: c.name,
      hint: "Client",
      href: `/admin/clients/${encodeURIComponent(c.key)}`,
    });
  }
  for (const g of galleries) {
    entries.push({
      id: `gallery-${g.id}`,
      label: g.title,
      hint: g.client_name ? `Gallery · ${g.client_name}` : "Gallery",
      href: `/admin/galleries/${g.id}`,
    });
  }
  for (const a of agreements) {
    if (a.revoked_at) continue;
    entries.push({
      id: `agreement-${a.id}`,
      label: a.client_name ?? a.client_email ?? "Contract",
      hint: "Contract",
      href: `/admin/agreements/${a.id}/edit`,
    });
  }

  return entries;
}
