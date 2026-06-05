import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { InquiryCallout } from "@/components/inquiry-callout";
import { EditPencil } from "@/components/edit-mode";
import { getPublicJournalPosts } from "@/lib/journal";
import { brandConfig } from "@/lib/config";
import { withDefaultSocialImages } from "@/lib/seo";

// Covers can be signed R2 URLs; re-render within the TTL.
export const revalidate = 1800;

export const metadata: Metadata = withDefaultSocialImages({
  title: "Journal",
  description: `Photography notes, tips, and location guides from ${brandConfig.name}, Toronto-based photographer.`,
  openGraph: {
    title: `Journal | ${brandConfig.name}`,
    description: "Photography notes, location guides, and session tips.",
  },
});

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function JournalPage() {
  const published = await getPublicJournalPosts();
  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink text-soft-white">
      <SiteHeader />

      <main className="flex-1 pt-40">
        {/* Hero */}
        <section className="border-b border-soft-white/10 px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="flex items-center justify-between gap-4">
                <h1 className="font-serif text-5xl font-medium leading-tight tracking-tight sm:text-6xl">
                  Journal
                </h1>
                <EditPencil href="/admin/journal" label="Manage journal" />
              </div>
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
                  return (
                    <Reveal key={post.slug} delay={i * 0.05}>
                      <article className="group py-8">
                        <Link href={`/journal/${post.slug}`} className="flex gap-6">
                          {post.coverUrl ? (
                            <div className="relative hidden h-24 w-36 shrink-0 overflow-hidden rounded-sm sm:block">
                              <Image
                                src={post.coverUrl}
                                alt={post.coverAlt}
                                fill
                                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                                sizes="144px"
                                unoptimized={post.coverUrl.startsWith("http")}
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
