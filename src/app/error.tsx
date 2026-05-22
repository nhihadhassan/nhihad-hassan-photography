"use client";

import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console in development; wire to a real service in production if needed.
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-ink px-5 text-center text-soft-white">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">Error</p>
      <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight">
        Something went wrong.
      </h1>
      <p className="mt-3 max-w-sm text-sm text-soft-white/55">
        An unexpected error occurred. Try refreshing — if it keeps happening, reach out.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-full border border-soft-white/20 px-5 text-sm text-soft-white/80 transition hover:border-soft-white/40 hover:text-soft-white"
        >
          Try again
        </button>
        <ButtonLink href="/" variant="ghost">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
