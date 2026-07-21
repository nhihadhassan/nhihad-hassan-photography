import {
  FileSignature,
  GitCommitHorizontal,
  Image as ImageIcon,
  Inbox,
  Mail,
  PenLine,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { BookingEventType } from "@/lib/events";
import type { TimelineEntry } from "@/lib/timeline";

const GLYPH: Record<BookingEventType, LucideIcon> = {
  inquiry: Inbox,
  email: Mail,
  contract: FileSignature,
  payment: Wallet,
  invoice: Receipt,
  gallery: ImageIcon,
  stage: GitCommitHorizontal,
  note: PenLine,
};

function when(at: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(at));
}

/**
 * The timeline spine, the admin's signature element. A single continuous
 * vertical rule with typed nodes; dates hang in the editorial display face.
 * Server rendered; nodes reveal on mount where motion is allowed.
 */
export function BookingTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-admin-muted">
        No activity yet. It will appear here as things happen.
      </p>
    );
  }

  return (
    <ol className="relative ml-3 border-l border-admin-line-strong">
      {entries.map((entry) => {
        const Glyph = GLYPH[entry.type] ?? PenLine;
        return (
          <li
            key={entry.id}
            className="relative pb-5 pl-6 last:pb-0 motion-safe:animate-[spine-node-in_240ms_ease-out]"
          >
            <span className="absolute -left-[9px] top-0.5 flex size-[18px] items-center justify-center rounded-full border border-admin-line-strong bg-admin-surface">
              <Glyph className="size-2.5 text-admin-muted" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-admin-ink">{entry.summary}</p>
              <p className="admin-display text-xs text-admin-muted tabular-nums">
                {when(entry.at)}
                {entry.actor === "client" ? " · client" : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
