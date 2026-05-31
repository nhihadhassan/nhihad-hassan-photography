import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { getPublicPageBlocks, blockText, type PageBlock } from "@/lib/page-blocks";
import { getFeaturedPortfolio, type PortfolioCard } from "@/lib/portfolio";

function TextBlock({ block }: { block: PageBlock }) {
  const eyebrow = blockText(block, "eyebrow");
  const heading = blockText(block, "heading");
  const body = blockText(block, "body");
  if (!eyebrow && !heading && !body) return null;
  return (
    <section className="bg-ink px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.2em] text-copper">{eyebrow}</p>
        ) : null}
        {heading ? (
          <h2 className="mt-4 font-serif text-4xl leading-[1.05] text-soft-white sm:text-5xl">
            {heading}
          </h2>
        ) : null}
        {body ? (
          <p className="mt-5 whitespace-pre-line text-base leading-7 text-soft-white/62">{body}</p>
        ) : null}
      </Reveal>
    </section>
  );
}

function CtaBlock({ block }: { block: PageBlock }) {
  const heading = blockText(block, "heading");
  const label = blockText(block, "buttonLabel");
  const href = blockText(block, "buttonHref");
  if (!heading && !label) return null;
  return (
    <section className="bg-charcoal px-4 py-20 text-center sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-3xl">
        {heading ? (
          <h2 className="font-serif text-4xl leading-[1.05] text-soft-white sm:text-5xl">
            {heading}
          </h2>
        ) : null}
        {label && href ? (
          <div className="mt-7 flex justify-center">
            <ButtonLink href={href}>{label}</ButtonLink>
          </div>
        ) : null}
      </Reveal>
    </section>
  );
}

function ImageBlock({ block }: { block: PageBlock }) {
  const imageUrl = blockText(block, "imageUrl");
  const alt = blockText(block, "alt");
  const caption = blockText(block, "caption");
  if (!imageUrl) return null;
  return (
    <section className="bg-ink px-4 py-12 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-5xl">
        {/* Admin-provided URL — use a plain img to avoid remote-pattern limits. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} className="w-full rounded-[2px]" />
        {caption ? (
          <p className="mt-3 text-center text-sm text-soft-white/55">{caption}</p>
        ) : null}
      </Reveal>
    </section>
  );
}

function GalleryStripBlock({ block, featured }: { block: PageBlock; featured: PortfolioCard[] }) {
  const heading = blockText(block, "heading");
  if (featured.length === 0) return null;
  return (
    <section className="bg-ink px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {heading ? (
          <Reveal>
            <h2 className="font-serif text-4xl leading-[1.05] text-soft-white sm:text-5xl">
              {heading}
            </h2>
          </Reveal>
        ) : null}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((item) => (
            <Link
              key={item.id}
              href={`/portfolio/${item.category}`}
              className="group relative aspect-square overflow-hidden rounded-[2px] bg-soft-white/8"
            >
              <Image
                src={item.imageUrl}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.05]"
                unoptimized
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Renders the admin-managed custom sections for a page. Empty by default, so it
 * adds nothing visually until the owner creates blocks in /admin/sections.
 */
export async function PageBlocks({ pageSlug = "home" }: { pageSlug?: string }) {
  const blocks = await getPublicPageBlocks(pageSlug);
  if (blocks.length === 0) return null;

  const needsFeatured = blocks.some((b) => b.block_type === "gallery_strip");
  const featured = needsFeatured ? await getFeaturedPortfolio(6) : [];

  return (
    <>
      {blocks.map((block) => {
        switch (block.block_type) {
          case "text":
            return <TextBlock key={block.id} block={block} />;
          case "cta":
            return <CtaBlock key={block.id} block={block} />;
          case "image":
            return <ImageBlock key={block.id} block={block} />;
          case "gallery_strip":
            return <GalleryStripBlock key={block.id} block={block} featured={featured} />;
          default:
            return null;
        }
      })}
    </>
  );
}
