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
    <div className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-8">
      <div className="max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#9b744f]">Next step</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#17130f]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[#17130f]/62">{description}</p>
        {action ? (
          <div className="mt-6">{action}</div>
        ) : (
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#9b744f]">
            Ready for Phase 3
            <ArrowRight className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

