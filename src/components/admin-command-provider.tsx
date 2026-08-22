"use client";

import { CommandPalette, type CommandItem } from "@/components/ui/command-palette";
import { ToastProvider } from "@/components/ui/toast";
import { AdminKeyboardLayer } from "@/components/admin-keyboard-layer";
import { adminNavItems, adminSecondaryNavItems } from "@/lib/admin-nav";

export type CommandRecord = { id: string; label: string; hint: string; href: string };

/**
 * Mounts the toast/undo layer, the command palette, and the keyboard layer
 * across the admin. The palette is seeded with navigation targets, create
 * actions, and a jump-to index of bookings and clients.
 */
export function AdminCommandProvider({
  children,
  records = [],
}: {
  children: React.ReactNode;
  records?: CommandRecord[];
}) {
  const items: CommandItem[] = [
    {
      id: "create-booking",
      label: "New booking",
      group: "Create",
      keywords: "add booking shoot",
      href: "/admin/bookings/new",
    },
    {
      id: "create-gallery",
      label: "New gallery",
      group: "Create",
      keywords: "add gallery delivery",
      href: "/admin/galleries/new",
    },
    {
      id: "create-invoice",
      label: "New invoice",
      group: "Create",
      keywords: "add invoice money",
      href: "/admin/invoices/new",
    },
    {
      id: "create-client",
      label: "New client",
      group: "Create",
      keywords: "add client contact",
      href: "/admin/clients",
    },
    {
      id: "create-contract",
      label: "New contract",
      group: "Create",
      keywords: "add contract agreement sign",
      href: "/admin/agreements",
    },
    {
      id: "create-expense",
      label: "Record a payment or expense",
      group: "Create",
      keywords: "money payment expense finance ledger",
      href: "/admin/finances",
    },
    // Secondary destinations left the sidebar but must stay findable by name.
    ...[...adminNavItems, ...adminSecondaryNavItems].map<CommandItem>((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: "Go to",
      href: item.href,
    })),
    ...records.map<CommandItem>((r) => ({
      id: r.id,
      label: r.label,
      hint: r.hint,
      group: "Jump to",
      href: r.href,
    })),
  ];

  return (
    <ToastProvider>
      {children}
      <CommandPalette items={items} />
      <AdminKeyboardLayer />
    </ToastProvider>
  );
}
