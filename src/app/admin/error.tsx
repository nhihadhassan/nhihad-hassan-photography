"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-admin-danger">Something went wrong</p>
      <p className="mt-2 max-w-sm text-sm text-admin-ink/58">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md border border-admin-ink/15 px-4 py-2 text-sm text-admin-ink/70 transition hover:border-admin-ink/30 hover:text-admin-ink"
      >
        Try again
      </button>
    </div>
  );
}
