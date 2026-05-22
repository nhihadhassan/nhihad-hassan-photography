import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { PhotoCard } from "@/components/photo-card";
import { InquiryCallout } from "@/components/inquiry-callout";
import {
  categoryLabels,
  getPortfolioByCategory,
  type PortfolioCategory,
} from "@/data/photography";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  return Object.keys(categoryLabels).map((category) => ({ category }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const label = categoryLabels[category as PortfolioCategory];
  if (!label) return {};
  return {
    title: `${label} Photography Toronto | Nhihad Hassan`,
    description: categoryMeta[category as PortfolioCategory]?.description ?? `${label} photography by Nhihad Hassan — Toronto-based photographer.`,
  };
}

/** Per-category hero description shown under the H1. */
const categoryIntros: Record<PortfolioCategory, string> = {
  "weddings-couples":
    "Ceremony moments, reception energy, engagement portraits, and the quiet frames between — photographed in Toronto and across Ontario.",
  events:
    "Cultural celebrations, milestone parties, and private gatherings covered at the pace they actually move.",
  nightlife:
    "Club nights, concerts, and after-dark events — energy, colour, and crowd energy kept intact under any light.",
  portraits:
    "Outdoor and studio portraiture across seasons — clean light, comfortable direction, honest expression.",
  lifestyle:
    "Editorial lifestyle sessions — real moments in real light, frames that hold up away from the screen.",
};

/** Per-category SEO description. */
const categoryMeta: Partial<Record<PortfolioCategory, { description: string }>> = {
  "weddings-couples": {
    description:
      "Wedding and engagement photography in Toronto by Nhihad Hassan. Ceremony coverage, couples portraits, and full-day wedding documentation.",
  },
  events: {
    description:
      "Event photography in Toronto by Nhihad Hassan — cultural celebrations, milestone parties, and private gatherings.",
  },
  nightlife: {
    description:
      "Nightlife and concert photography in Toronto by Nhihad Hassan. Club nights, DJ sets, and after-dark event coverage.",
  },
  portraits: {
    description:
      "Portrait photography in Toronto by Nhihad Hassan — family portraits, milestone sessions, and editorial portraiture.",
  },
  lifestyle: {
    description:
      "Lifestyle photography in Toronto by Nhihad Hassan — relaxed editorial sessions in real light.",
  },
};

/** Per-category inquiry callout copy. Passes directly to <InquiryCallout />. */
const categoryCallouts: Record<
  PortfolioCategory,
  { eyebrow: string; headline: string; body: string }
> = {
  "weddings-couples": {
    eyebrow: "Liked what you saw?",
    headline: "Inquire about your wedding or engagement.",
    body: "Toronto weddings, multi-day cultural events, and couples sessions. Tell me the date, venue, and how you want the day to feel — I'll come back with availability.",
  },
  events: {
    eyebrow: "Have an event coming up?",
    headline: "Let's cover it properly.",
    body: "Cultural celebrations, milestone parties, and brand activations. Coverage that reads the room and moves with it.",
  },
  nightlife: {
    eyebrow: "Covering a night?",
    headline: "Get your event photographed.",
    body: "Club nights, concerts, after-parties, and DJ sets. Fast-turnaround gallery — ready while the night is still being talked about.",
  },
  portraits: {
    eyebrow: "Ready for your session?",
    headline: "Book a portrait session.",
    body: "Families, milestones, and personal projects. Outdoor or studio — tell me the date and what you're going for.",
  },
  lifestyle: {
    eyebrow: "Ready for your session?",
    headline: "Book a lifestyle session.",
    body: "Relaxed, editorial, or somewhere in between. Tell me what you're working with and we'll build something worth keeping.",
  },
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const label = categoryLabels[category as PortfolioCategory];
  const items = getPortfolioByCategory(category);

  if (!label) {
    notFound();
  }

  const intro = categoryIntros[category as PortfolioCategory];
  const callout = categoryCallouts[category as PortfolioCategory];

  return (
    <div className="min-h-[100dvh] bg-ink text-soft-white">
      <SiteHeader />
      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-7xl">
          <Reveal>
            <div className="border-b border-soft-white/12 pb-10">
              <Link
                href="/portfolio"
                className="text-sm text-soft-white/55 transition hover:text-soft-white"
              >
                ← All work
              </Link>
              <h1 className="mt-8 font-serif text-6xl leading-[0.9] text-soft-white sm:text-8xl">
                {label}
              </h1>
              {intro && (
                <p className="mt-5 max-w-2xl text-base leading-7 text-soft-white/62">{intro}</p>
              )}
            </div>
          </Reveal>

          {/* Category filter tabs */}
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            <Link
              className="shrink-0 rounded-full border border-soft-white/14 px-4 py-2 text-sm text-soft-white/68 transition hover:border-soft-white/28 hover:text-soft-white"
              href="/portfolio"
            >
              All
            </Link>
            {Object.entries(categoryLabels).map(([slug, itemLabel]) => (
              <Link
                key={slug}
                href={`/portfolio/${slug}`}
                className={
                  slug === category
                    ? "shrink-0 rounded-full border border-copper bg-copper px-4 py-2 text-sm text-ink"
                    : "shrink-0 rounded-full border border-soft-white/14 px-4 py-2 text-sm text-soft-white/68 transition hover:border-soft-white/28 hover:text-soft-white"
                }
              >
                {itemLabel}
              </Link>
            ))}
          </div>

          {items.length === 0 ? (
            <p className="mt-16 text-center text-soft-white/45">
              No photos in this category yet — check back soon.
            </p>
          ) : (
            <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
              {items.map((item, index) => (
                <Reveal key={item.id} delay={(index % 3) * 0.04} className="mb-12 break-inside-avoid">
                  <PhotoCard item={item} priority={index < 2} />
                </Reveal>
              ))}
            </div>
          )}
        </section>

        <InquiryCallout
          tone="dark"
          eyebrow={callout.eyebrow}
          headline={callout.headline}
          body={callout.body}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
