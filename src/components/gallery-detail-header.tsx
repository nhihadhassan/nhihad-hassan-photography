import Link from "next/link";
import { ArrowLeft, Heart, Images, Settings2, Share2 } from "lucide-react";
import { StatusChip, statusForGallery } from "@/components/ui/status-chip";

type TabKey = "photos" | "settings" | "selects" | "share";

const TABS: { key: TabKey; label: string; icon: typeof Images; hrefSuffix: string }[] = [
  { key: "photos", label: "Photos", icon: Images, hrefSuffix: "/photos" },
  { key: "settings", label: "Settings", icon: Settings2, hrefSuffix: "" },
  { key: "selects", label: "Selects", icon: Heart, hrefSuffix: "/favorites" },
  { key: "share", label: "Share", icon: Share2, hrefSuffix: "/share" },
];

/**
 * Shared back-link + status + title + tab nav for every gallery detail page
 * (Photos, Settings, Selects, Share). Keeping this in one place is the fix
 * for the tabs drifting out of sync with each other, since they render four
 * different routes under /admin/galleries/[id]/*.
 */
export function GalleryDetailHeader({
  galleryId,
  title,
  clientName,
  isPublished,
  isArchived,
  activeTab,
  kicker,
  description,
  actions,
}: {
  galleryId: string;
  title: string;
  clientName?: string | null;
  isPublished: boolean;
  isArchived: boolean;
  activeTab: TabKey;
  /** Small label above the status chip, e.g. "Client selects". Defaults to none. */
  kicker?: string;
  description?: string;
  /** Right-aligned actions (Share button, row-actions menu, etc). Settings tab only, today. */
  actions?: React.ReactNode;
}) {
  return (
    <>
      <Link
        href="/admin/galleries"
        className="inline-flex items-center gap-1.5 text-sm text-admin-ink/65 transition hover:text-admin-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All galleries
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {kicker ? <p className="text-sm font-medium text-admin-accent">{kicker}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={statusForGallery({ is_published: isPublished, is_archived: isArchived })} />
          </div>
          <h1 className="admin-display mt-2 truncate text-3xl">{title}</h1>
          {clientName ? <p className="mt-0.5 text-sm text-admin-muted">{clientName}</p> : null}
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      <div className="mt-6 border-b border-admin-ink/10">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Gallery sections">
          {TABS.map(({ key, label, icon: Icon, hrefSuffix }) => {
            const active = key === activeTab;
            return (
              <Link
                key={key}
                href={`/admin/galleries/${galleryId}${hrefSuffix}`}
                className={
                  "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition " +
                  (active
                    ? "border-admin-ink font-medium text-admin-ink"
                    : "border-transparent text-admin-ink/65 hover:border-admin-ink/25 hover:text-admin-ink")
                }
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
