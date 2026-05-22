import Link from "next/link";
import Image from "next/image";
import { AtSign, Mail } from "lucide-react";
import { brandConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-t border-soft-white/10 bg-ink px-4 py-10 text-soft-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Image
            src="/logo-lockup.png"
            alt={brandConfig.name}
            width={1097}
            height={802}
            className="h-28 w-auto"
          />
          <p className="mt-5 max-w-xl text-sm leading-6 text-soft-white/60">{brandConfig.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-soft-white/70">
          <a
            href={`mailto:${brandConfig.contactEmail}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-soft-white/14 px-4 transition hover:border-soft-white/30 hover:text-soft-white"
          >
            <Mail className="size-4" aria-hidden="true" />
            Email
          </a>
          {brandConfig.instagram.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-soft-white/14 px-4 transition hover:border-soft-white/30 hover:text-soft-white"
              target="_blank"
              rel="noreferrer"
            >
              <AtSign className="size-4" aria-hidden="true" />
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 text-xs text-soft-white/45 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright {brandConfig.copyrightYear} {brandConfig.name}.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/portfolio" className="hover:text-soft-white">Portfolio</Link>
          <Link href="/pricing" className="hover:text-soft-white">Pricing</Link>
          <Link href="/investment" className="hover:text-soft-white">Investment</Link>
          <Link href="/galleries/moove-ah" className="hover:text-soft-white">Galleries</Link>
          <Link href="/contact" className="hover:text-soft-white">Contact</Link>
          <Link href="/journal" className="hover:text-soft-white">Journal</Link>
          <Link href="/admin/login" className="hover:text-soft-white">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
