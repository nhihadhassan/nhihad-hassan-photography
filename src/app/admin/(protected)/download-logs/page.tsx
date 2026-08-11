import Link from "next/link";
import { Download, Heart } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminDownloadLogs,
  getAdminDownloadLogStats,
} from "@/lib/admin-download-logs";
import { getAdminGalleriesForFilter } from "@/lib/admin-access-logs";
import { EmptyState } from "@/components/empty-state";

const REASON_LABEL: Record<string, string> = {
  success: "Download started",
  not_enabled: "Downloads disabled",
  locked: "Locked (no password)",
  unavailable_gallery: "Gallery unavailable",
  empty: "No photos",
  error: "Error",
  rate_limited: "Rate limited",
  not_configured: "Not configured",
};

function reasonClass(reason: string | null, success: boolean | null) {
  if (success) return "bg-admin-success/15 text-admin-success";
  if (reason === "locked" || reason === "not_enabled") return "bg-admin-copper/20 text-admin-accent";
  return "bg-admin-danger/10 text-admin-danger";
}

function summariseUserAgent(ua: string | null) {
  if (!ua) return "—";
  const m =
    ua.match(/(Chrome|Firefox|Safari|Edge|Opera|CriOS|FxiOS)\/\S+/) ||
    ua.match(/^([^/\s]+\/\S+)/);
  const browser = m ? m[0] : ua.slice(0, 40);
  const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(";")[0]?.trim() ?? "";
  return os ? `${browser} · ${os}` : browser;
}

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

type PageProps = {
  searchParams: Promise<{ gallery?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DownloadLogsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const galleryFilter = params.gallery && params.gallery !== "all" ? params.gallery : null;

  const [logs, stats, galleries] = await Promise.all([
    getAdminDownloadLogs({ galleryId: galleryFilter, limit: 200 }),
    getAdminDownloadLogStats(),
    getAdminGalleriesForFilter(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-admin-accent">Security</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Download logs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Every download attempt, including individual photos and ZIPs. IPs
            are stored as one-way hashes only.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm sm:gap-3">
          <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-3">
            <span className="block text-xl font-semibold">{stats.total}</span>
            <span className="text-xs text-admin-ink/65">Attempts · 24h</span>
          </div>
          <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-3">
            <span className="block text-xl font-semibold text-admin-success">{stats.success}</span>
            <span className="text-xs text-admin-ink/65">Started</span>
          </div>
          <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-3">
            <span className="block text-xl font-semibold text-admin-danger">{stats.failure}</span>
            <span className="text-xs text-admin-ink/65">Rejected</span>
          </div>
        </div>
      </div>

      <form
        method="get"
        className="mt-8 flex flex-wrap items-end gap-3 rounded-md border border-admin-ink/10 bg-admin-surface p-4"
      >
        <label className="grid w-full gap-1.5 sm:w-auto">
          <span className="text-xs font-medium uppercase tracking-wide text-admin-ink/60">
            Gallery
          </span>
          <select
            name="gallery"
            defaultValue={galleryFilter ?? "all"}
            className="min-h-11 w-full rounded-md border border-admin-ink/10 bg-white px-3 text-base sm:min-h-10 sm:text-sm"
          >
            <option value="all">All galleries</option>
            {galleries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface sm:min-h-10"
        >
          Apply filter
        </button>
        {galleryFilter ? (
          <Link
            href="/admin/download-logs"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-admin-ink/12 px-4 text-sm text-admin-ink/68 sm:min-h-10"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {logs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No download attempts yet."
            description="When a visitor downloads a gallery ZIP, or tries to, it shows up here."
            action={
              <Link
                href="/admin/galleries"
                className="inline-flex min-h-10 items-center rounded-md border border-admin-ink/12 px-4 text-sm text-admin-ink/68"
              >
                Manage galleries
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-md border border-admin-ink/10 bg-admin-surface">
          <div className="divide-y divide-admin-line md:hidden">
            {logs.map((log) => (
              <article key={log.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {log.gallery_slug ? (
                      <Link href={`/admin/galleries/${log.gallery_id}`} className="block truncate text-sm font-medium text-admin-ink">
                        {log.gallery_title ?? log.gallery_slug}
                      </Link>
                    ) : (
                      <span className="text-sm text-admin-muted">Deleted gallery</span>
                    )}
                    <p className="mt-1 text-xs text-admin-muted">{formatTimestamp(log.accessed_at)}</p>
                  </div>
                  <span className={"inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium " + reasonClass(log.reason, log.success)}>
                    {REASON_LABEL[log.reason ?? ""] ?? log.reason ?? "Unknown"}
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-admin-muted">Download</dt>
                    <dd className="mt-1 text-admin-ink/70">{log.scope === "single" ? "Single photo" : log.scope} · {log.photo_count} photo{log.photo_count === 1 ? "" : "s"}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="font-medium uppercase tracking-wide text-admin-muted">Client</dt>
                    <dd className="mt-1 truncate text-admin-ink/70">{summariseUserAgent(log.user_agent)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-admin-bg text-xs uppercase tracking-wide text-admin-ink/65">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Gallery</th>
                <th className="px-4 py-3 text-left font-medium">Scope</th>
                <th className="px-4 py-3 text-left font-medium">Photos</th>
                <th className="px-4 py-3 text-left font-medium">Outcome</th>
                <th className="px-4 py-3 text-left font-medium">IP (hash)</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-ink/10">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-admin-ink/72">
                    {formatTimestamp(log.accessed_at)}
                  </td>
                  <td className="px-4 py-3">
                    {log.gallery_slug ? (
                      <Link
                        href={`/admin/galleries/${log.gallery_id}`}
                        className="text-admin-ink hover:text-admin-accent"
                      >
                        {log.gallery_title ?? log.gallery_slug}
                      </Link>
                    ) : (
                      <span className="text-admin-ink/65">(deleted gallery)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-ink/8 px-2.5 py-1 text-xs font-medium text-admin-ink/68">
                      {log.scope === "selects" ? (
                        <Heart className="size-3" aria-hidden="true" />
                      ) : (
                        <Download className="size-3" aria-hidden="true" />
                      )}
                      {log.scope === "single" ? "Single photo" : log.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-admin-ink/72">{log.photo_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium " +
                        reasonClass(log.reason, log.success)
                      }
                    >
                      {REASON_LABEL[log.reason ?? ""] ?? log.reason ?? "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-admin-ink/65">
                    {log.ip_hash ?? "—"}
                  </td>
                  <td
                    className="max-w-xs px-4 py-3 text-xs text-admin-ink/65"
                    title={log.user_agent ?? undefined}
                  >
                    {summariseUserAgent(log.user_agent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {logs.length === 200 ? (
            <div className="border-t border-admin-ink/10 px-4 py-3 text-xs text-admin-ink/65">
              Showing the most recent 200 attempts.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
