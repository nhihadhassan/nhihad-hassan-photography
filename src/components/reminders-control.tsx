"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import {
  runRemindersNowAction,
  setRemindersEnabledAction,
} from "@/app/admin/(protected)/reminders/actions";
import type { ReminderSummary } from "@/lib/reminders";

export function RemindersControl({ enabled: initialEnabled }: { enabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [savingToggle, startToggle] = useTransition();
  const [running, startRun] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const toggle = (next: boolean) => {
    setEnabled(next);
    startToggle(async () => {
      await setRemindersEnabledAction(next);
      router.refresh();
    });
  };

  const runNow = () => {
    setResult(null);
    startRun(async () => {
      const summary: ReminderSummary = await runRemindersNowAction();
      if (!summary.enabled) {
        setResult("Reminders are turned off. Turn them on above first.");
      } else if (summary.sent === 0) {
        setResult("No reminders were due right now.");
      } else {
        const parts = Object.entries(summary.byKind)
          .filter(([, n]) => n > 0)
          .map(([k, n]) => `${n} ${k.replace(/_/g, " ")}`);
        setResult(`Sent ${summary.sent} reminder${summary.sent === 1 ? "" : "s"}: ${parts.join(", ")}.`);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-md border border-admin-ink/10 bg-admin-surface p-5">
        <div>
          <p className="font-medium text-admin-ink">Automated reminders</p>
          <p className="mt-0.5 text-sm text-admin-ink/55">
            When on, the daily job sends the reminders below. When off, nothing is sent.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={savingToggle}
          onClick={() => toggle(!enabled)}
          className={
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 " +
            (enabled ? "bg-admin-success" : "bg-admin-ink/20")
          }
        >
          <span className={"inline-block size-5 transform rounded-full bg-white transition " + (enabled ? "translate-x-6" : "translate-x-1")} />
        </button>
      </div>

      <div className="rounded-md border border-admin-ink/10 bg-admin-surface p-5">
        <p className="text-sm font-medium text-admin-ink">Send due reminders now</p>
        <p className="mt-0.5 text-sm text-admin-ink/55">
          Runs the same job manually, so you can test it without waiting for the daily schedule.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runNow}
            disabled={running}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-admin-ink px-4 text-sm font-medium text-admin-surface disabled:opacity-50"
          >
            {running ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            Run now
          </button>
          {result ? <span className="text-sm text-admin-ink/70">{result}</span> : null}
        </div>
      </div>
    </div>
  );
}
