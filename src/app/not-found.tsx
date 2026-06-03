import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { brandConfig } from "@/lib/config";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink text-soft-white">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">404</p>
        <h1 className="mt-4 font-serif text-5xl font-medium tracking-tight sm:text-6xl">
          Page not found.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-soft-white/55">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Check the URL, or head
          back to the portfolio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/" variant="secondary">
            Go home
          </ButtonLink>
          <ButtonLink href="/portfolio" variant="ghost">
            Portfolio
          </ButtonLink>
        </div>
        <p className="mt-12 text-xs text-soft-white/55">{brandConfig.name}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
