import Link from "next/link";
import Image from "next/image";
import { brandConfig } from "@/lib/config";
import { ButtonLink } from "@/components/ui/button";
import { MobileNav, type MobileNavItem } from "@/components/mobile-nav";

const navItems: MobileNavItem[] = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/investment", label: "Investment" },
  { href: "/mini-sessions", label: "Sessions" },
  { href: "/galleries/moove-ah", label: "Client Gallery" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-soft-white transition hover:text-beige"
          aria-label={`${brandConfig.name} home`}
        >
          <span className="flex size-10 items-center justify-center rounded-full border border-soft-white/20 bg-ink/35 backdrop-blur">
            <Image
              src="/logo-mark.png"
              alt=""
              width={760}
              height={510}
              priority
              className="h-4 w-auto"
            />
          </span>
          <span className="hidden text-sm font-medium tracking-wide sm:inline">
            {brandConfig.name}
          </span>
          <span className="text-sm font-medium tracking-wide sm:hidden">{brandConfig.shortName}</span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-soft-white/14 bg-ink/35 p-1 backdrop-blur md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-soft-white/72 transition hover:bg-soft-white/8 hover:text-soft-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/contact" variant="secondary" className="hidden md:inline-flex">
            Inquire
          </ButtonLink>
          <MobileNav items={navItems} />
        </div>
      </div>
    </header>
  );
}
