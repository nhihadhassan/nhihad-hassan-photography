"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, LogOut } from "lucide-react";
import { logoutAdmin } from "@/app/admin/login/actions";
import { brandConfig } from "@/lib/config";
import { adminNavGroups, isActiveNav } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * Admin sidebar + header + mobile nav. Full labels at lg, an icon-only rail
 * between md and lg (the spec's "collapse to icons below 1024px"), and a
 * horizontal scroll row below md.
 */
export function AdminNav({ adminEmail }: { adminEmail: string | null }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-16 flex-col border-r border-admin-line bg-admin-surface p-2 md:flex lg:w-64 lg:p-5">
        <Link href="/admin" className="flex items-center gap-3 px-1 lg:px-0" aria-label={`${brandConfig.shortName} Studio admin`}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-ink text-admin-surface">
            <Camera className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden lg:block">
            <span className="block text-sm font-semibold">{brandConfig.shortName} Studio</span>
            <span className="block text-xs text-admin-muted">Admin workspace</span>
          </span>
        </Link>
        <nav className="mt-8 flex-1 space-y-5 overflow-y-auto">
          {adminNavGroups.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`} className="space-y-1">
              {group.label ? (
                <p className="hidden px-3 pb-1 text-[11px] uppercase tracking-wide text-admin-muted lg:block">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActiveNav(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition lg:justify-start",
                      "justify-center lg:justify-start",
                      active
                        ? "bg-admin-ink text-admin-surface"
                        : "text-admin-muted hover:bg-admin-raise hover:text-admin-ink",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <form action={logoutAdmin} className="pt-2">
          <button className="flex min-h-10 w-full items-center justify-center gap-3 rounded-lg px-3 text-sm text-admin-muted transition hover:bg-admin-raise hover:text-admin-ink lg:justify-start">
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </form>
      </aside>

      <header className="sticky top-0 z-10 border-b border-admin-line bg-admin-surface/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-admin-muted hover:text-admin-ink">
            Public site
          </Link>
          <div className="flex items-center gap-3 text-xs text-admin-muted">
            <kbd className="hidden rounded border border-admin-line px-1.5 py-0.5 font-mono sm:inline">
              {"⌘"}K
            </kbd>
            <span className="hidden sm:inline">{adminEmail}</span>
            <form action={logoutAdmin} className="md:hidden">
              <button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-admin-line px-3 text-xs text-admin-muted">
                <LogOut className="size-3.5" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {adminNavGroups.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const active = isActiveNav(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-xs",
                  active
                    ? "border-admin-ink bg-admin-ink text-admin-surface"
                    : "border-admin-line text-admin-muted",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
