"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MobileNavItem } from "@/components/mobile-nav";

/**
 * A single top-nav link that highlights itself when it points at the page
 * currently being viewed. Shared by the desktop header and the mobile
 * drawer so the active-page treatment stays consistent in one place.
 *
 * "Active" matches the exact path or any nested route under it, so
 * /portfolio/events still highlights Portfolio and /galleries/[slug]
 * still highlights Galleries.
 */
export function NavLink({
  href,
  label,
  tone = "dark",
}: MobileNavItem & { tone?: "dark" | "light" }) {
  const pathname = usePathname();
  const isActive =
    href !== "/" && (pathname === href || pathname.startsWith(`${href}/`));

  const inactive = tone === "light" ? "hover:text-ink/60" : "hover:text-soft-white/70";

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`relative transition ${isActive ? "text-copper" : inactive}`}
    >
      {label}
      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 left-0 h-px w-full bg-copper"
        />
      ) : null}
    </Link>
  );
}
