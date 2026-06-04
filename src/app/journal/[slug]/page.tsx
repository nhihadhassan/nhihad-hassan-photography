import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { InquiryCallout } from "@/components/inquiry-callout";
import { JournalBlocks } from "@/components/journal-blocks";
import { getPublicJournalPost, getPublishedJournalSlugs } from "@/lib/journal";
import { brandConfig } from "@/lib/config";

type Props = { params: Promise<{ slug: string }> };

// Cover and inline images can be signed R2 URLs; re-render within the TTL.
export const revalidate = 1800;

export async function generateStaticParams() {
  return (await getPublishedJournalSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicJournalPost(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | ${brandConfig.name}`,
      description: post.excerpt,
      type: "article",
      ...(post.coverUrl ? { images: [{ url: post.coverUrl, alt: post.coverAlt }] } : {}),
    },
  };
}

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function JournalPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublicJournalPost(slug);
  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: brandConfig.name },
    publisher: { "@type": "Organization", name: brandConfig.name },
    ...(post.coverUrl ? { image: post.coverUrl } : {}),
    mainEntityOfPage: `https://nhihadhassan.ca/journal/${post.slug}`,
  };

  // Per-post accent override (Phase C), scoped to this article.
  const accentStyle = post.accentHex ? ({ "--copper": post.accentHex } as React.CSSProperties) : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink text-soft-white" style={accentStyle}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <SiteHeader />

      <main className="flex-1 pt-40">
        {post.coverUrl ? (
          <div className="relative h-64 w-full overflow-hidden bg-soft-white/10 sm:h-80 lg:h-96">
            <Image
              src={post.coverUrl}
              alt={post.coverAlt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized={post.coverUrl.startsWith("http")}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
          </div>
        ) : null}

        <article className="mx-auto max-w-2xl px-5 py-14 lg:px-8">
          <Reveal>
            <Link
              href="/journal"
              className="inline-flex items-center gap-1.5 text-sm text-soft-white/55 hover:text-soft-white"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Journal
            </Link>

            <div className="mt-6">
              <p className="text-xs text-soft-white/60">{formatDate(post.date)}</p>
              <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mt-3 text-base leading-relaxed text-soft-white/60">{post.excerpt}</p>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 border-t border-soft-white/10 pt-10">
              <JournalBlocks blocks={post.blocks} bodyFont={post.bodyFont} />
            </div>

            <div className="mt-12 border-t border-soft-white/10 pt-8">
              <p className="text-sm text-soft-white/60">
                Written by{" "}
                <Link href="/" className="font-medium text-soft-white/70 hover:text-soft-white">
                  {brandConfig.name}
                </Link>
              </p>
            </div>
          </Reveal>
        </article>

        <InquiryCallout />
      </main>

      <SiteFooter />
    </div>
  );
}
