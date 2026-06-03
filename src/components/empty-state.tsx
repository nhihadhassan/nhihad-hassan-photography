import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-8">
      <div className="max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-admin-accent">Next step</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-admin-ink">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-admin-ink/62">{description}</p>
        {action ? (
          <div className="mt-6">{action}</div>
        ) : (
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-admin-accent">
            Ready for Phase 3
            <ArrowRight className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

