import "server-only";
import { getAdminBookings } from "@/lib/bookings";
import { getClientList } from "@/lib/clients";

export type CommandIndexEntry = {
  id: string;
  label: string;
  hint: string;
  href: string;
};

/**
 * Compact index of bookings and clients for the command palette, so Cmd+K can
 * jump to any record by name. Kept lean (name + link only) since it loads with
 * every admin page.
 */
export async function getCommandIndex(): Promise<CommandIndexEntry[]> {
  const [bookings, clients] = await Promise.all([getAdminBookings(), getClientList()]);
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
  return entries;
}
