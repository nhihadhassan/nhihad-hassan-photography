import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminJournalList } from "@/lib/journal";
import { ImportJournalButton } from "@/components/import-journal-button";
import { journalPosts as staticPosts } from "@/data/journal";
import { JOURNAL_TAGS } from "@/lib/journal-types";
import {
  createJournalPost,
  deleteJournalPost,
  moveJournalPost,
  togglePublished,
} from "./actions";

export const dynamic = "force-dynamic";

const TAG_LABELS = Object.fromEntries(JOURNAL_TAGS.map((t) => [t.value, t.label]));

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminJournalPage() {
  await requireAdmin();
  const posts = await getAdminJournalList();
  const needsImport = posts.length < staticPosts.length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-admin-accent">Journal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Journal posts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Write and design posts with photos, headings, and quotes. Drafts stay private until you
            publish. Changes appear on the site within a few minutes.
          </p>
        </div>
        <form action={createJournalPost}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface"
          >
            <Plus className="size-4" aria-hidden="true" />
            New post
          </button>
        </form>
      </div>

      {needsImport ? (
        <div className="mt-6">
          <ImportJournalButton />
        </div>
      ) : null}

      {posts.length ? (
        <div className="mt-8 overflow-hidden rounded-md border border-admin-ink/10 bg-admin-surface">
          <div className="divide-y divide-admin-ink/10">
            {posts.map(({ record }, i) => (
              <article key={record.id} className="grid gap-4 p-4 sm:grid-cols-[88px_1fr_auto] sm:items-center">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-admin-ink/8">
                  {posts[i].coverUrl ? (
                    <Image
                      src={posts[i].coverUrl as string}
                      alt={record.cover_alt || `${record.title} cover`}
                      fill
                      sizes="120px"
                      className="object-cover"
                      unoptimized={(posts[i].coverUrl as string).startsWith("http")}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/journal/${record.id}`}
                      className="text-lg font-semibold tracking-tight hover:text-admin-accent"
                    >
                      {record.title}
                    </Link>
                    <span
                      className={
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs " +
                        (record.published
                          ? "border-admin-success/30 bg-admin-success/10 text-admin-success"
                          : "border-admin-ink/15 text-admin-ink/50")
                      }
                    >
                      {record.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-admin-ink/55">
                    {formatDate(record.post_date)}
                    {record.tag && TAG_LABELS[record.tag] ? ` · ${TAG_LABELS[record.tag]}` : ""}
                    {` · /journal/${record.slug}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 justify-self-start sm:justify-self-end">
                  <form action={moveJournalPost}>
                    <input type="hidden" name="id" value={record.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={i === 0}
                      className="rounded p-2 text-admin-ink/55 hover:bg-admin-ink/6 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                  </form>
                  <form action={moveJournalPost}>
                    <input type="hidden" name="id" value={record.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={i === posts.length - 1}
                      className="rounded p-2 text-admin-ink/55 hover:bg-admin-ink/6 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                  </form>
                  <form action={togglePublished}>
                    <input type="hidden" name="id" value={record.id} />
                    <input type="hidden" name="next" value={(!record.published).toString()} />
                    <button
                      type="submit"
                      className="rounded-md border border-admin-ink/15 px-2.5 py-1.5 text-xs font-medium text-admin-ink/70 hover:text-admin-ink"
                    >
                      {record.published ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <Link
                    href={`/admin/journal/${record.id}`}
                    className="rounded p-2 text-admin-accent hover:bg-admin-ink/6"
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <form action={deleteJournalPost}>
                    <input type="hidden" name="id" value={record.id} />
                    <button
                      type="submit"
                      className="rounded p-2 text-admin-danger/80 hover:bg-admin-danger/5"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-8 rounded-md border border-dashed border-admin-ink/15 px-4 py-10 text-center text-sm text-admin-ink/50">
          No posts yet. Click “New post” to write your first one.
        </p>
      )}
    </div>
  );
}
