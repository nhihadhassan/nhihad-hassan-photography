import { Check, Circle, Dot } from "lucide-react";
import type { LifecycleStep } from "@/lib/booking-lifecycle";
import { lifecycleProgress } from "@/lib/booking-lifecycle";

const STATE_CLASS = {
  done: "border-admin-status-positive/35 bg-admin-status-positive-tint text-admin-status-positive",
  active: "border-admin-status-waiting/35 bg-admin-status-waiting-tint text-admin-status-waiting",
  pending: "border-admin-line bg-admin-surface text-admin-muted",
  skipped: "border-admin-line bg-admin-surface text-admin-muted/60",
} as const;

/**
 * The whole job at a glance. Every value is derived from a record that already
 * exists, so this never disagrees with the rail below it.
 */
export function BookingLifecycleStrip({ steps }: { steps: LifecycleStep[] }) {
  const { done, total } = lifecycleProgress(steps);

  return (
    <section aria-label="Job progress" className="mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs uppercase tracking-wide text-admin-muted">Progress</h2>
        <p className="text-xs text-admin-muted tabular-nums">
          {done} of {total} done
        </p>
      </div>
      <ol className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`flex min-w-32 flex-1 shrink-0 flex-col gap-1 rounded-lg border px-3 py-2 ${STATE_CLASS[step.state]}`}
          >
            <span className="flex items-center gap-1.5 text-xs font-medium">
              {step.state === "done" ? (
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
              ) : step.state === "active" ? (
                <Circle className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Dot className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              {step.label}
            </span>
            <span className="text-[11px] leading-tight opacity-80">{step.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
