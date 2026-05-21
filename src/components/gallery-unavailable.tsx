import Link from "next/link";
import { Camera, Mail } from "lucide-react";
import { brandConfig } from "@/lib/config";

export function GalleryUnavailable() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink px-4 py-10 text-soft-white">
      <section className="w-full max-w-xl rounded-[2px] border border-soft-white/12 bg-soft-white/5 p-8 text-center shadow-[0_24px_100px_-60px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-soft-white/16">
          <Camera className="size-5 text-copper" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-copper">Gallery unavailable</p>
        <h1 className="mt-3 font-serif text-5xl leading-none text-soft-white">
          This gallery is not available.
        </h1>
        <p className="mt-5 text-sm leading-6 text-soft-white/62">
          The link may be unpublished, archived, expired, or not ready yet. If you expected access,
          contact {brandConfig.name}.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-soft-white/16 px-5 text-sm text-soft-white/72 transition hover:bg-soft-white hover:text-ink"
          >
            Back to site
          </Link>
          <a
            href={`mailto:${brandConfig.contactEmail}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-copper/70 bg-copper px-5 text-sm font-medium text-ink transition hover:bg-beige"
          >
            <Mail className="size-4" aria-hidden="true" />
            Email
          </a>
        </div>
      </section>
    </main>
  );
}

