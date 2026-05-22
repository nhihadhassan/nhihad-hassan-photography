import Link from "next/link";
import { brandConfig } from "@/lib/config";
import { MobileNav, type MobileNavItem } from "@/components/mobile-nav";

const navItems: MobileNavItem[] = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/galleries/moove-ah", label: "Galleries" },
  { href: "/contact", label: "Contact" },
];

/**
 * Minimal centered header used across every page except the homepage
 * (which bakes the same layout into its hero). Nav links flank a
 * centered brand wordmark that links home.
 */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 px-4 py-6 sm:px-8 sm:py-7">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        <nav className="col-start-1 hidden items-center gap-7 text-xs uppercase tracking-[0.18em] text-soft-white md:flex">
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-soft-white/70"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          aria-label={`${brandConfig.name} home`}
          className="col-start-2 justify-self-center whitespace-nowrap text-center font-serif uppercase text-soft-white text-2xl tracking-normal transition hover:text-soft-white/80 sm:text-3xl lg:text-4xl xl:text-[2.8rem]"
        >
          {brandConfig.name}
        </Link>

        <div className="col-start-3 flex items-center justify-end gap-7">
          <nav className="hidden items-center gap-7 text-xs uppercase tracking-[0.18em] text-soft-white md:flex">
            {navItems.slice(2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-soft-white/70"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="md:hidden">
            <MobileNav items={navItems} />
          </div>
        </div>
      </div>
    </header>
  );
}
