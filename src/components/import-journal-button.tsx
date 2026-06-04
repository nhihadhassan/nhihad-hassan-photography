"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud, Loader2 } from "lucide-react";

export function ImportJournalButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/journal/migrate", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        imported?: number;
        skipped?: number;
        errors?: string[];
      };
      if (!res.ok) {
        setResult(data.error ?? "Import failed.");
      } else {
        setResult(
          `Imported ${data.imported ?? 0}, skipped ${data.skipped ?? 0}.` +
            (data.errors && data.errors.length ? ` Issues: ${data.errors.join("; ")}` : " All done."),
        );
        router.refresh();
      }
    } catch {
      setResult("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border border-admin-accent/30 bg-admin-copper/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-admin-ink">Import starter posts</p>
          <p className="mt-0.5 text-xs text-admin-ink/60">
            One-time setup: copies your three existing journal posts into editable storage. Safe to
            run again.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-admin-ink px-4 py-2 text-sm font-medium text-admin-surface disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <DownloadCloud className="size-4" aria-hidden="true" />
          )}
          {loading ? "Importing…" : "Import"}
        </button>
      </div>
      {result ? <p className="mt-3 text-xs text-admin-ink/70">{result}</p> : null}
    </div>
  );
}
