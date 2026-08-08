import {
  BellRing,
  CalendarDays,
  ClipboardList,
  Download,
  FileSignature,
  FileText,
  FolderOpen,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquareText,
  Newspaper,
  Receipt,
  Settings,
  Shield,
  Tag,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string | null;
  items: AdminNavItem[];
};

/**
 * The admin information architecture. The primary group is the spec's sidebar
 * order (Today, Pipeline, Schedule, Clients, Invoices, Contracts, Settings).
 * Schedule merges the old Calendar and Bookings pages: a live view of the
 * NHP Bookings Google Calendar alongside the bookings used for invoicing and
 * stage tracking. Everything else that used to live in the flat nav is
 * folded into Content and Automations groups so the primary rail stays about
 * running the business. This same structure feeds the command palette.
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    label: null,
    items: [
      { href: "/admin", label: "Today", icon: LayoutDashboard },
      { href: "/admin/pipeline", label: "Pipeline", icon: Workflow },
      { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/finances", label: "Invoices", icon: Receipt },
      { href: "/admin/agreements", label: "Contracts", icon: FileSignature },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/galleries", label: "Galleries", icon: FolderOpen },
      { href: "/admin/portfolio", label: "Portfolio", icon: Images },
      { href: "/admin/journal", label: "Journal", icon: Newspaper },
      { href: "/admin/sections", label: "Sections", icon: LayoutTemplate },
      { href: "/admin/pricing", label: "Pricing", icon: Tag },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
      { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
    ],
  },
  {
    label: "Automations",
    items: [
      { href: "/admin/reminders", label: "Reminders", icon: BellRing },
      { href: "/admin/templates", label: "Contract templates", icon: FileText },
      { href: "/admin/questionnaires", label: "Questionnaires", icon: ClipboardList },
      { href: "/admin/access-logs", label: "Access logs", icon: Shield },
      { href: "/admin/download-logs", label: "Download logs", icon: Download },
    ],
  },
];

export const adminNavItems: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);

/** True when `href` is the active nav target for the current pathname. */
export function isActiveNav(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
