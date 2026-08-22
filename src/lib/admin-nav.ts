import {
  BellRing,
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
  PiggyBank,
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
 * The admin information architecture, grouped by what you are actually doing.
 *
 * WORK is the day-to-day: the leads and jobs and the people they belong to.
 * MONEY separates the two money questions that were previously adjacent and
 * easy to confuse -- Invoices is what clients owe, Finances is what the
 * business took in and spent. WEBSITE is everything the public sees.
 *
 * Contracts, questionnaires, contract templates, reminder rules and the raw
 * access and download logs are deliberately not in the rail. Each is now
 * reachable from the record it belongs to -- a contract from its booking, a
 * gallery's access history from that gallery's Share tab -- and from Settings
 * when you want the cross-business archive. Keeping them permanently in the
 * sidebar made five destinations compete with the four you use daily.
 *
 * The command palette and the mobile nav both read this array, so this is the
 * only place the structure is declared.
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Work",
    items: [
      { href: "/admin", label: "Today", icon: LayoutDashboard },
      { href: "/admin/pipeline", label: "Pipeline", icon: Workflow },
      { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/galleries", label: "Galleries", icon: FolderOpen },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
      { href: "/admin/finances", label: "Finances", icon: PiggyBank },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/portfolio", label: "Portfolio", icon: Images },
      { href: "/admin/journal", label: "Journal", icon: Newspaper },
      { href: "/admin/sections", label: "Sections", icon: LayoutTemplate },
      { href: "/admin/pricing", label: "Pricing", icon: Tag },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
    ],
  },
  {
    label: null,
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

/**
 * Destinations that are no longer in the sidebar but must stay reachable and
 * searchable. The command palette folds these in so Cmd+K still finds them by
 * name, and Settings links them as its archive section.
 */
export const adminSecondaryNavItems: AdminNavItem[] = [
  { href: "/admin/agreements", label: "Contracts", icon: FileSignature },
  { href: "/admin/questionnaires", label: "Questionnaires", icon: ClipboardList },
  { href: "/admin/templates", label: "Contract templates", icon: FileText },
  { href: "/admin/reminders", label: "Reminder rules", icon: BellRing },
  { href: "/admin/access-logs", label: "Access logs", icon: Shield },
  { href: "/admin/download-logs", label: "Download logs", icon: Download },
];

export const adminNavItems: AdminNavItem[] = adminNavGroups.flatMap((g) => g.items);

/** True when `href` is the active nav target for the current pathname. */
export function isActiveNav(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
