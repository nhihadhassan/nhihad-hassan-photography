import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listContractTemplates } from "@/lib/contract-templates";
import { createTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const templates = await listContractTemplates();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-admin-accent">Contract templates</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Reusable agreements</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            The wording every future agreement starts from. Editing a template here never changes an
            agreement that has already been sent or signed &mdash; those keep the wording they were
            actually sent with.
          </p>
        </div>
        <form action={createTemplateAction} className="flex items-center gap-2">
          <input
            name="name"
            required
            placeholder="New template name"
            className="min-h-11 rounded-md border border-admin-ink/12 bg-white/70 px-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-ink/50 focus:border-admin-copper"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface"
          >
            <Plus className="size-4" aria-hidden="true" />
            New template
          </button>
        </form>
      </div>

      {templates.length ? (
        <div className="mt-8 overflow-hidden rounded-md border border-admin-ink/10 bg-admin-surface">
          <div className="divide-y divide-admin-ink/10">
            {templates.map((template) => (
              <article key={template.id} className="grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
                  <FileText className="size-5 text-admin-accent" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-admin-ink">{template.name}</p>
                  {template.description ? (
                    <p className="mt-0.5 truncate text-sm text-admin-ink/60">{template.description}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-admin-ink/45">
                    Last edited {formatDate(template.updatedAt)}
                  </p>
                </div>
                <Link
                  href={`/admin/templates/${template.id}`}
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-admin-ink/15 px-4 text-sm font-medium text-admin-ink/75 transition hover:border-admin-copper hover:text-admin-ink"
                >
                  Edit
                </Link>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-8 rounded-md border border-admin-ink/10 bg-admin-surface p-6 text-sm text-admin-ink/65">
          No templates yet. Create one above to get started.
        </p>
      )}
    </div>
  );
}
