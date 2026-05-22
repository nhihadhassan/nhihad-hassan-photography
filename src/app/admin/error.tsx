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
      <p className="text-sm font-medium text-[#8a2f24]">Something went wrong</p>
      <p className="mt-2 max-w-sm text-sm text-[#17130f]/58">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md border border-[#17130f]/15 px-4 py-2 text-sm text-[#17130f]/70 transition hover:border-[#17130f]/30 hover:text-[#17130f]"
      >
        Try again
      </button>
    </div>
  );
}
