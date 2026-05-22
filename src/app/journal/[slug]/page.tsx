import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { InquiryCallout } from "@/components/inquiry-callout";
import { journalPosts } from "@/data/journal";
import { portfolioItems } from "@/data/photography";
import { brandConfig } from "@/lib/config";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return journalPosts
    .filter((p) => p.published)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = journalPosts.find((p) => p.slug === slug && p.published);
  if (!post) return { title: "Not Found" };

  const cover = post.coverImageId
    ? portfolioItems.find((p) => p.id === post.coverImageId)
    : null;

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} | ${brandConfig.name}`,
      description: post.excerpt,
      type: "article",
      ...(cover ? { images: [{ url: cover.imageUrl, alt: cover.alt }] } : {}),
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Very lightweight markdown-lite renderer.
 * Supports: **bold**, paragraph breaks.
 * Not a full MDX pipeline — keep posts simple.
 */
function renderParagraph(text: string, key: number) {
  // **bold** → <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes = parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
  return (
    <p key={key} className="mt-5 leading-[1.85] text-soft-white/75 first:mt-0">
      {nodes}
    </p>
  );
}

export default async function JournalPostPage({ params }: Props) {
  const { slug } = await params;
  const post = journalPosts.find((p) => p.slug === slug && p.published);

  if (!post) notFound();

  const cover = post.coverImageId
    ? portfolioItems.find((p) => p.id === post.coverImageId)
    : null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink text-soft-white">
      <SiteHeader />

      <main className="flex-1 pt-40">
        {/* Cover image */}
        {cover ? (
          <div className="relative h-64 w-full overflow-hidden bg-soft-white/10 sm:h-80 lg:h-96">
            <Image
              src={cover.imageUrl}
              alt={cover.alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
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
              <p className="text-xs text-soft-white/45">{formatDate(post.date)}</p>
              <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-soft-white/60">{post.excerpt}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 border-t border-soft-white/10 pt-10 text-[1.0625rem]">
              {post.body.map((paragraph, i) => renderParagraph(paragraph, i))}
            </div>

            <div className="mt-12 border-t border-soft-white/10 pt-8">
              <p className="text-sm text-soft-white/45">
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
