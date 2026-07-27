import Link from "next/link";
import type { ReactNode } from "react";
import { Camera, LogOut } from "lucide-react";
import { AdminMobileNav, AdminSidebarNav } from "@/components/admin-nav";
import { logoutAdmin } from "@/app/admin/login/actions";
import { brandConfig } from "@/lib/config";

export function AdminShell({
  children,
  adminEmail,
}: {
  children: ReactNode;
  adminEmail: string | null;
}) {
  return (
    <div className="min-h-[100dvh] bg-admin-bg text-admin-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-admin-ink/10 bg-admin-surface lg:flex">
        <div className="px-5 pt-5">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-admin-ink text-admin-surface">
              <Camera className="size-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{brandConfig.shortName} Studio</span>
              <span className="block text-xs text-admin-ink/65">Admin workspace</span>
            </span>
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          <AdminSidebarNav />
        </div>
        <form action={logoutAdmin} className="border-t border-admin-ink/8 px-5 py-3">
          <button className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-admin-ink/68 transition hover:bg-admin-ink/6 hover:text-admin-ink">
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-admin-ink/10 bg-admin-surface/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-sm font-medium text-admin-ink/68 hover:text-admin-ink">
              Public site
            </Link>
            <div className="flex items-center gap-3 text-xs text-admin-ink/65">
              <span className="hidden sm:inline">{adminEmail}</span>
              <form action={logoutAdmin} className="lg:hidden">
                <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-admin-ink/10 px-3 text-xs text-admin-ink/68">
                  <LogOut className="size-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <AdminMobileNav />
        </header>
        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
