"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  Calendar,
  ClipboardList,
  Download,
  FileText,
  FolderOpen,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquareText,
  Newspaper,
  PenLine,
  Settings,
  Shield,
  Tag,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  /** null = ungrouped items at the top (Dashboard). */
  label: string | null;
  items: NavItem[];
};

/**
 * Sidebar structure, grouped by how the work actually flows: client work,
 * paperwork, money, the public site, then system. Icons live here (client
 * component) because component references cannot cross the server boundary.
 */
const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Client work",
    items: [
      { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/pipeline", label: "Pipeline", icon: Workflow },
      { href: "/admin/bookings", label: "Bookings", icon: Calendar },
      { href: "/admin/galleries", label: "Galleries", icon: FolderOpen },
      { href: "/admin/questionnaires", label: "Questionnaires", icon: ClipboardList },
    ],
  },
  {
    label: "Paperwork",
    items: [
      { href: "/admin/agreements", label: "Send to sign", icon: PenLine },
      { href: "/admin/booking-agreement", label: "Contract template", icon: FileText },
      { href: "/admin/reminders", label: "Reminders", icon: BellRing },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/finances", label: "Finances", icon: Wallet },
      { href: "/admin/pricing", label: "Pricing", icon: Tag },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/portfolio", label: "Portfolio", icon: Images },
      { href: "/admin/journal", label: "Journal", icon: Newspaper },
      { href: "/admin/sections", label: "Sections", icon: LayoutTemplate },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/access-logs", label: "Access logs", icon: Shield },
      { href: "/admin/download-logs", label: "Download logs", icon: Download },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Grouped sidebar nav (desktop). */
export function AdminSidebarNav() {
  const isActive = useIsActive();
  return (
    <nav className="mt-8 space-y-5" aria-label="Admin sections">
      {navGroups.map((group) => (
        <div key={group.label ?? "top"}>
          {group.label ? (
            <p className="px-3 pb-1 text-xs font-medium text-admin-ink/65">{group.label}</p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition " +
                    (active
                      ? "bg-admin-ink/8 font-medium text-admin-ink"
                      : "text-admin-ink/68 hover:bg-admin-ink/6 hover:text-admin-ink")
                  }
                >
                  <Icon
                    className={"size-4 " + (active ? "text-admin-ink" : "text-admin-ink/60")}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/** Flat horizontal nav (mobile header), same order as the sidebar. */
export function AdminMobileNav() {
  const isActive = useIsActive();
  const items = navGroups.flatMap((g) => g.items);
  return (
    <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Admin sections">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-xs transition " +
              (active
                ? "border-admin-ink/25 bg-admin-ink/8 font-medium text-admin-ink"
                : "border-admin-ink/10 text-admin-ink/68")
            }
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
