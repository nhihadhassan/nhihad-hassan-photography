"use client";

import { CommandPalette, type CommandItem } from "@/components/ui/command-palette";
import { ToastProvider } from "@/components/ui/toast";
import { adminNavItems } from "@/lib/admin-nav";

/**
 * Mounts the toast/undo layer and the command palette across the admin. The
 * palette is seeded with navigation targets and create actions; record search
 * (clients, bookings) is layered on in the interaction-polish phase.
 */
export function AdminCommandProvider({ children }: { children: React.ReactNode }) {
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
      href: "/admin/finances",
    },
    {
      id: "create-client",
      label: "New client",
      group: "Create",
      keywords: "add client contact",
      href: "/admin/clients",
    },
    ...adminNavItems.map<CommandItem>((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: "Go to",
      href: item.href,
    })),
  ];

  return (
    <ToastProvider>
      {children}
      <CommandPalette items={items} />
    </ToastProvider>
  );
}
