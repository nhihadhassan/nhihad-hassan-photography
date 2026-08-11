"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ExternalLink, LogOut, Menu, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentItem = adminNavGroups.flatMap((group) => group.items).find((item) => isActiveNav(item.href, pathname));

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

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

      <header className="sticky top-0 z-10 border-b border-admin-line bg-admin-surface/95 px-4 py-3 backdrop-blur sm:px-6 md:ml-16 lg:ml-64 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin menu"
              aria-expanded={mobileOpen}
              aria-controls="admin-mobile-menu"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-admin-line-strong text-admin-ink transition hover:bg-admin-raise md:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <div className="min-w-0 md:hidden">
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-admin-muted">Studio admin</p>
              <p className="truncate text-sm font-semibold text-admin-ink">{currentItem?.label ?? "Workspace"}</p>
            </div>
            <Link href="/" className="hidden min-h-10 items-center gap-2 text-sm font-medium text-admin-muted hover:text-admin-ink md:inline-flex">
              Public site
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs text-admin-muted">
            <kbd className="hidden rounded border border-admin-line px-1.5 py-0.5 font-mono sm:inline">
              {"⌘"}K
            </kbd>
            <span className="hidden sm:inline">{adminEmail}</span>
            <Link
              href="/"
              aria-label="Open public site"
              className="inline-flex size-11 items-center justify-center rounded-lg border border-admin-line-strong text-admin-muted md:hidden"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div id="admin-mobile-menu" className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-admin-ink/35"
          />
          <aside className="relative flex h-full w-[min(88vw,22rem)] flex-col overflow-hidden border-r border-admin-line-strong bg-admin-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-admin-line px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <Link href="/admin" className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-ink text-admin-surface">
                  <Camera className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{brandConfig.shortName} Studio</span>
                  <span className="block truncate text-xs text-admin-muted">Admin workspace</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close admin menu"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-raise hover:text-admin-ink"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
              {adminNavGroups.map((group, groupIndex) => (
                <div key={group.label ?? `mobile-group-${groupIndex}`}>
                  {group.label ? (
                    <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-admin-muted">{group.label}</p>
                  ) : null}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActiveNav(item.href, pathname);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                            active
                              ? "bg-admin-ink text-admin-surface"
                              : "text-admin-muted hover:bg-admin-raise hover:text-admin-ink",
                          )}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden="true" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <form action={logoutAdmin} className="border-t border-admin-line px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <button className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-admin-muted hover:bg-admin-raise hover:text-admin-ink">
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
