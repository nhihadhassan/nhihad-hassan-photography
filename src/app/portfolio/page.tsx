import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { PhotoCard } from "@/components/photo-card";
import { InquiryCallout } from "@/components/inquiry-callout";
import { EditPencil } from "@/components/edit-mode";
import { categoryLabels } from "@/data/photography";
import { getPublicPortfolio } from "@/lib/portfolio";
import { withDefaultSocialImages } from "@/lib/seo";

export const metadata: Metadata = withDefaultSocialImages({
  title: "Portfolio",
  description:
    "Weddings, couples, events, nightlife, portraits, and lifestyle photography by Nhihad Hassan, Toronto-based photographer.",
  openGraph: {
    title: "Portfolio | Nhihad Hassan Photography",
    description:
      "Browse work across weddings, couples, portraits, events, and nightlife. Based in Toronto.",
  },
});

// Cover URLs are signed and time-limited; re-render comfortably within the TTL.
export const revalidate = 1800;

export default async function PortfolioPage() {
  // Keep the focus on weddings: nightlife stays in its own tab only.
  const items = (await getPublicPortfolio()).filter((item) => item.category !== "nightlife");
  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <main className="px-4 pb-20 pt-40 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl">
          <Reveal>
            <div className="relative border-b border-soft-white/12 pb-10">
              <h1 className="font-serif text-6xl leading-[0.9] text-soft-white sm:text-8xl">
                Portfolio
              </h1>
              <EditPencil href="/admin/portfolio" label="Manage photos" className="absolute right-0 top-0" />
            </div>
          </Reveal>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            <Link className="rounded-full border border-copper bg-copper px-4 py-2 text-sm text-ink" href="/portfolio">
              All
            </Link>
            {Object.entries(categoryLabels).map(([slug, label]) => (
              <Link
                key={slug}
                href={`/portfolio/${slug}`}
                className="rounded-full border border-soft-white/14 px-4 py-2 text-sm text-soft-white/68 transition hover:border-soft-white/28 hover:text-soft-white"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
            {items.map((item, index) => (
              <Reveal key={item.id} delay={(index % 3) * 0.04} className="mb-12 break-inside-avoid">
                <PhotoCard item={item} priority={index < 2} />
              </Reveal>
            ))}
          </div>
        </section>
        <InquiryCallout tone="dark" />
      </main>
      <SiteFooter />
    </div>
  );
}
