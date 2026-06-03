"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Loader2 } from "lucide-react";
import { unlockGallery, type UnlockState } from "@/app/galleries/[slug]/actions";

const initial: UnlockState = { status: "idle", message: "" };

export function GalleryPasswordGate({
  slug,
  galleryTitle,
}: {
  slug: string;
  galleryTitle: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(unlockGallery, initial);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <form
      action={formAction}
      className="rounded-[2px] border border-soft-white/14 bg-ink/45 p-5 backdrop-blur"
      aria-labelledby="gallery-gate-heading"
    >
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center gap-3 text-soft-white">
        <span className="flex size-9 items-center justify-center rounded-full border border-soft-white/16 bg-ink/35">
          <LockKeyhole className="size-4 text-copper" aria-hidden="true" />
        </span>
        <div>
          <h2 id="gallery-gate-heading" className="text-sm font-medium tracking-wide">
            Private gallery
          </h2>
          <p className="text-xs text-soft-white/55">
            Enter the password to view {galleryTitle}.
          </p>
        </div>
      </div>

      <label className="mt-5 grid gap-2 text-soft-white">
        <span className="sr-only">Gallery password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          inputMode="text"
          required
          minLength={1}
          placeholder="Password"
          className="min-h-12 rounded-[2px] border border-soft-white/16 bg-ink/55 px-4 text-sm text-soft-white placeholder:text-soft-white/55 focus:border-copper focus:outline-none"
        />
      </label>

      {state.message && state.status === "error" ? (
        <p
          role="alert"
          className="mt-3 rounded-[2px] border border-[#c66759]/40 bg-[#8a2f24]/25 px-3 py-2 text-sm text-[#fbdcd5]"
        >
          {state.message}
        </p>
      ) : null}
      {state.message && state.status === "success" ? (
        <p
          role="status"
          className="mt-3 rounded-[2px] border border-[#9bb88a]/30 bg-[#3f6e4a]/25 px-3 py-2 text-sm text-[#dfe7da]"
        >
          {state.message} Loading gallery…
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-copper/70 bg-copper px-5 text-sm font-medium text-ink transition hover:bg-beige disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Unlocking
          </>
        ) : (
          "Enter gallery"
        )}
      </button>
    </form>
  );
}
