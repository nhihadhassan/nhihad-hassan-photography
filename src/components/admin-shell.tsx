import Link from "next/link";
import type { ReactNode } from "react";
import { Camera, Download, FolderOpen, Inbox, LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";
import { logoutAdmin } from "@/app/admin/login/actions";
import { brandConfig } from "@/lib/config";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/galleries", label: "Galleries", icon: FolderOpen },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/access-logs", label: "Access logs", icon: Shield },
  { href: "/admin/download-logs", label: "Download logs", icon: Download },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  children,
  adminEmail,
}: {
  children: ReactNode;
  adminEmail: string | null;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#f3f0ea] text-[#17130f]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#17130f]/10 bg-[#fbf8f1] p-5 lg:block">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#17130f] text-[#fbf8f1]">
            <Camera className="size-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold">{brandConfig.shortName} Studio</span>
            <span className="block text-xs text-[#17130f]/55">Admin workspace</span>
          </span>
        </Link>
        <nav className="mt-10 space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-[#17130f]/68 transition hover:bg-[#17130f]/6 hover:text-[#17130f]"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAdmin} className="absolute inset-x-5 bottom-5">
          <button className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-[#17130f]/68 transition hover:bg-[#17130f]/6 hover:text-[#17130f]">
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-[#17130f]/10 bg-[#fbf8f1]/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-medium text-[#17130f]/68 hover:text-[#17130f]">
              Public site
            </Link>
            <div className="flex items-center gap-3 text-xs text-[#17130f]/52">
              <span className="hidden sm:inline">{adminEmail}</span>
              <form action={logoutAdmin} className="lg:hidden">
                <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#17130f]/10 px-3 text-xs text-[#17130f]/68">
                  <LogOut className="size-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-[#17130f]/10 px-3 text-xs text-[#17130f]/68"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
