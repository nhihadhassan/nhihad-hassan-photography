import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { PhotoCard } from "@/components/photo-card";
import { InquiryCallout } from "@/components/inquiry-callout";
import { categoryLabels, getPortfolioByCategory, type PortfolioCategory } from "@/data/photography";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  return Object.keys(categoryLabels).map((category) => ({ category }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const label = categoryLabels[category as PortfolioCategory];

  if (!label) {
    return {};
  }

  return {
    title: label,
    description: `${label} photography by Nhihad Hassan Photography.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const label = categoryLabels[category as PortfolioCategory];
  const items = getPortfolioByCategory(category);

  if (!label) {
    notFound();
  }

  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl">
          <Reveal>
            <div className="border-b border-soft-white/12 pb-10">
              <Link href="/portfolio" className="text-sm text-soft-white/58 transition hover:text-soft-white">
                Back to all work
              </Link>
              <p className="mt-8 text-xs uppercase tracking-[0.22em] text-copper">Portfolio category</p>
              <h1 className="mt-4 font-serif text-6xl leading-[0.9] text-soft-white sm:text-8xl">{label}</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-soft-white/62">
                {items.length} selected {items.length === 1 ? "frame" : "frames"} from this category.
              </p>
            </div>
          </Reveal>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            <Link className="rounded-full border border-soft-white/14 px-4 py-2 text-sm text-soft-white/68 transition hover:border-soft-white/28 hover:text-soft-white" href="/portfolio">
              All
            </Link>
            {Object.entries(categoryLabels).map(([slug, itemLabel]) => (
              <Link
                key={slug}
                href={`/portfolio/${slug}`}
                className={
                  slug === category
                    ? "rounded-full border border-copper bg-copper px-4 py-2 text-sm text-ink"
                    : "rounded-full border border-soft-white/14 px-4 py-2 text-sm text-soft-white/68 transition hover:border-soft-white/28 hover:text-soft-white"
                }
              >
                {itemLabel}
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

