import Link from "next/link";
import { brandConfig } from "@/lib/config";
import { MobileNav, type MobileNavItem } from "@/components/mobile-nav";
import { NavLink } from "@/components/nav-link";

const navItems: MobileNavItem[] = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/galleries", label: "Galleries" },
  { href: "/contact", label: "Contact" },
];

type SiteHeaderProps = {
  /** "dark" for ink pages (default), "light" for cream pages. */
  tone?: "dark" | "light";
};

/**
 * Minimal centered header used across every page except the homepage
 * (which bakes the same layout into its hero). Nav links flank a
 * centered brand wordmark that links home.
 */
export function SiteHeader({ tone = "dark" }: SiteHeaderProps) {
  const isLight = tone === "light";
  const navGroupClass = `hidden items-center gap-7 text-xs uppercase tracking-[0.18em] md:flex ${
    isLight ? "text-ink" : "text-soft-white"
  }`;
  const brandClass = `col-start-2 min-w-0 max-w-[62vw] justify-self-center text-center font-serif uppercase leading-tight tracking-normal transition text-[clamp(0.72rem,4vw,2.8rem)] sm:max-w-none sm:whitespace-nowrap sm:text-[clamp(1.05rem,5.5vw,2.8rem)] ${
    isLight ? "text-ink hover:text-ink/70" : "text-soft-white hover:text-soft-white/80"
  }`;

  return (
    <header className="absolute inset-x-0 top-0 z-20 px-4 py-6 sm:px-8 sm:py-7">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        <nav className={`col-start-1 ${navGroupClass}`}>
          {navItems.slice(0, 2).map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} tone={tone} />
          ))}
        </nav>

        <Link href="/" aria-label={`${brandConfig.name} home`} className={brandClass}>
          {brandConfig.name}
        </Link>

        <div className="col-start-3 flex items-center justify-end gap-7">
          <nav className={navGroupClass}>
            {navItems.slice(2).map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} tone={tone} />
            ))}
          </nav>
          <div className="md:hidden">
            <MobileNav items={navItems} tone={tone} />
          </div>
        </div>
      </div>
    </header>
  );
}
