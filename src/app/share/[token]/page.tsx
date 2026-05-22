import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brandConfig } from "@/lib/config";
import { getShareLinkByToken } from "@/lib/share-links";
import { hasServiceRoleKey } from "@/lib/env";
import { SharePhotoViewer } from "@/components/share-photo-viewer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  if (!hasServiceRoleKey()) return {};

  const link = await getShareLinkByToken(token);
  if (!link) return { title: "Not Found" };

  return {
    title: link.title,
    description: `${link.photos.length} curated photos shared by ${brandConfig.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  if (!hasServiceRoleKey()) {
    notFound();
  }

  const link = await getShareLinkByToken(token);

  if (!link) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-ink text-soft-white">
        <p className="font-serif text-3xl">Link unavailable</p>
        <p className="mt-3 text-sm text-white/50">
          This share link may have expired or been revoked.
        </p>
        <Link href="/" className="mt-8 text-sm text-copper hover:underline">
          {brandConfig.name}
        </Link>
      </div>
    );
  }

  const photoCount = link.photos.length;

  return (
    <div className="min-h-[100dvh] bg-[#0f0d0a] text-soft-white">
      {/* Header */}
      <header className="border-b border-white/8 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-copper">
              {brandConfig.name}
            </p>
            <h1 className="mt-1 font-serif text-xl font-medium">{link.title}</h1>
            {link.recipient_label ? (
              <p className="mt-0.5 text-sm text-white/45">For: {link.recipient_label}</p>
            ) : null}
          </div>
          <p className="shrink-0 text-sm text-white/35">
            {photoCount} photo{photoCount === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <SharePhotoViewer photos={link.photos} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 px-5 py-6 text-center text-xs text-white/30">
        <Link href="/" className="hover:text-white/60">
          {brandConfig.name}
        </Link>
        <span className="mx-2">·</span>
        Shared photos — not for redistribution
      </footer>
    </div>
  );
}
