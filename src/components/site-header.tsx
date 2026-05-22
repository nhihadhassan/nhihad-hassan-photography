import Link from "next/link";
import { brandConfig } from "@/lib/config";
import { MobileNav, type MobileNavItem } from "@/components/mobile-nav";

const navItems: MobileNavItem[] = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/galleries/moove-ah", label: "Galleries" },
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
  const navClass = isLight
    ? "transition hover:text-ink/60"
    : "transition hover:text-soft-white/70";
  const navGroupClass = `hidden items-center gap-7 text-xs uppercase tracking-[0.18em] md:flex ${
    isLight ? "text-ink" : "text-soft-white"
  }`;
  const brandClass = `col-start-2 justify-self-center whitespace-nowrap text-center font-serif uppercase text-2xl tracking-normal transition sm:text-3xl lg:text-4xl xl:text-[2.8rem] ${
    isLight ? "text-ink hover:text-ink/70" : "text-soft-white hover:text-soft-white/80"
  }`;

  return (
    <header className="absolute inset-x-0 top-0 z-20 px-4 py-6 sm:px-8 sm:py-7">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        <nav className={`col-start-1 ${navGroupClass}`}>
          {navItems.slice(0, 2).map((item) => (
            <Link key={item.href} href={item.href} className={navClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/" aria-label={`${brandConfig.name} home`} className={brandClass}>
          {brandConfig.name}
        </Link>

        <div className="col-start-3 flex items-center justify-end gap-7">
          <nav className={navGroupClass}>
            {navItems.slice(2).map((item) => (
              <Link key={item.href} href={item.href} className={navClass}>
                {item.label}
              </Link>
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
