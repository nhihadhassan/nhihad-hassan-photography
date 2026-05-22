import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { InquiryCallout } from "@/components/inquiry-callout";
import { journalPosts } from "@/data/journal";
import { portfolioItems } from "@/data/photography";
import { brandConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Journal",
  description: `Photography notes, tips, and location guides from ${brandConfig.name}, Toronto-based photographer.`,
  openGraph: {
    title: `Journal | ${brandConfig.name}`,
    description: "Photography notes, location guides, and session tips.",
  },
};

const published = journalPosts.filter((p) => p.published).sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function JournalPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink text-soft-white">
      <SiteHeader />

      <main className="flex-1 pt-40">
        {/* Hero */}
        <section className="border-b border-soft-white/10 px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">Journal</p>
              <h1 className="mt-4 font-serif text-5xl font-medium leading-tight tracking-tight sm:text-6xl">
                Notes on photography.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-soft-white/62">
                Location guides, session tips, and the occasional behind-the-scenes thought.
                Not a content farm. Just useful things worth writing down.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Post list */}
        <section className="px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {published.length === 0 ? (
              <Reveal>
                <p className="text-sm text-soft-white/55">No posts yet. Check back soon.</p>
              </Reveal>
            ) : (
              <div className="divide-y divide-soft-white/10">
                {published.map((post, i) => {
                  const cover = post.coverImageId
                    ? portfolioItems.find((p) => p.id === post.coverImageId)
                    : null;

                  return (
                    <Reveal key={post.slug} delay={i * 0.05}>
                      <article className="group py-8">
                        <Link href={`/journal/${post.slug}`} className="flex gap-6">
                          {cover ? (
                            <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-sm sm:block">
                              <Image
                                src={cover.imageUrl}
                                alt={cover.alt}
                                fill
                                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                                sizes="144px"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0">
                            <p className="text-xs text-soft-white/60">{formatDate(post.date)}</p>
                            <h2 className="mt-1 font-serif text-2xl font-medium leading-snug group-hover:text-copper transition-colors">
                              {post.title}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-soft-white/62 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <p className="mt-3 text-sm font-medium text-copper">
                              Read →
                            </p>
                          </div>
                        </Link>
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <InquiryCallout />
      </main>

      <SiteFooter />
    </div>
  );
}
