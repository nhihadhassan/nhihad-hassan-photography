import Link from "next/link";
import { Shield } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminAccessLogs,
  getAdminAccessLogStats,
  getAdminGalleriesForFilter,
} from "@/lib/admin-access-logs";
import { EmptyState } from "@/components/empty-state";

const REASON_LABEL: Record<string, string> = {
  success: "Unlocked",
  wrong_password: "Wrong password",
  rate_limited: "Rate limited",
  unavailable_gallery: "Gallery unavailable",
  not_configured: "Not configured",
};

function reasonClass(reason: string | null, success: boolean | null) {
  if (success) return "bg-[#3f6e4a]/15 text-[#3f6e4a]";
  if (reason === "rate_limited") return "bg-[#b98257]/20 text-[#9b744f]";
  return "bg-[#8a2f24]/10 text-[#8a2f24]";
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
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

type PageProps = {
  searchParams: Promise<{ gallery?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AccessLogsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const galleryFilter = params.gallery && params.gallery !== "all" ? params.gallery : null;

  const [logs, stats, galleries] = await Promise.all([
    getAdminAccessLogs({ galleryId: galleryFilter, limit: 200 }),
    getAdminAccessLogStats(),
    getAdminGalleriesForFilter(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#9b744f]">Security</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Access logs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#17130f]/60">
            Every password unlock attempt is recorded — successes, wrong passwords, and rate-limited
            requests. IPs are stored as one-way hashes only; passwords are never logged.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-3">
            <span className="block text-xl font-semibold">{stats.total}</span>
            <span className="text-xs text-[#17130f]/55">Attempts · 24h</span>
          </div>
          <div className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-3">
            <span className="block text-xl font-semibold text-[#3f6e4a]">{stats.success}</span>
            <span className="text-xs text-[#17130f]/55">Unlocked</span>
          </div>
          <div className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-3">
            <span className="block text-xl font-semibold text-[#8a2f24]">{stats.failure}</span>
            <span className="text-xs text-[#17130f]/55">Failed</span>
          </div>
        </div>
      </div>

      <form
        method="get"
        className="mt-8 flex flex-wrap items-end gap-3 rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-4"
      >
        <label className="grid gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[#17130f]/60">
            Gallery
          </span>
          <select
            name="gallery"
            defaultValue={galleryFilter ?? "all"}
            className="min-h-10 rounded-md border border-[#17130f]/10 bg-white px-3 text-sm"
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
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#17130f] px-4 text-sm font-medium text-[#fbf8f1]"
        >
          Apply filter
        </button>
        {galleryFilter ? (
          <Link
            href="/admin/access-logs"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#17130f]/12 px-4 text-sm text-[#17130f]/68"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {logs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No access attempts yet."
            description="When a visitor enters a gallery password — successfully or not — it shows up here."
            action={
              <Link
                href="/admin/galleries"
                className="inline-flex min-h-10 items-center rounded-md border border-[#17130f]/12 px-4 text-sm text-[#17130f]/68"
              >
                Manage galleries
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-md border border-[#17130f]/10 bg-[#fbf8f1]">
          <table className="w-full text-sm">
            <thead className="bg-[#f3f0ea] text-xs uppercase tracking-wide text-[#17130f]/55">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Gallery</th>
                <th className="px-4 py-3 text-left font-medium">Outcome</th>
                <th className="px-4 py-3 text-left font-medium">IP (hash)</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17130f]/10">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-[#17130f]/72">
                    {formatTimestamp(log.accessed_at)}
                  </td>
                  <td className="px-4 py-3">
                    {log.gallery_slug ? (
                      <Link
                        href={`/admin/galleries/${log.gallery_id}`}
                        className="text-[#17130f] hover:text-[#9b744f]"
                      >
                        {log.gallery_title ?? log.gallery_slug}
                      </Link>
                    ) : (
                      <span className="text-[#17130f]/45">(deleted gallery)</span>
                    )}
                    <span className="ml-2 text-xs text-[#17130f]/45">
                      {log.gallery_slug ? `/galleries/${log.gallery_slug}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium " +
                        reasonClass(log.reason, log.success)
                      }
                    >
                      {log.success ? <Shield className="size-3" aria-hidden="true" /> : null}
                      {REASON_LABEL[log.reason ?? ""] ?? log.reason ?? "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#17130f]/55">
                    {log.ip_hash ?? "—"}
                  </td>
                  <td
                    className="max-w-xs px-4 py-3 text-xs text-[#17130f]/55"
                    title={log.user_agent ?? undefined}
                  >
                    {summariseUserAgent(log.user_agent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 200 ? (
            <div className="border-t border-[#17130f]/10 px-4 py-3 text-xs text-[#17130f]/55">
              Showing the most recent 200 attempts.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
