"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { updateReminderRuleAction } from "@/app/admin/(protected)/reminders/actions";
import type { ReminderKind, ReminderRule } from "@/lib/reminder-rules";
import { cn } from "@/lib/utils";

const TITLES: Record<ReminderKind, string> = {
  deposit_due: "Deposit reminder",
  balance_due: "Balance reminder",
  gallery_expiring: "Gallery expiring",
  review_request: "Review request",
};

/** Editable plain-language rule rows. Each rule is a sentence with inline
 *  number inputs and an on/off toggle, saved on change. */
export function RemindersRules({ rules }: { rules: ReminderRule[] }) {
  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <RuleRow key={rule.kind} rule={rule} />
      ))}
    </div>
  );
}

function RuleRow({ rule }: { rule: ReminderRule }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, start] = useTransition();
  const [enabled, setEnabled] = useState(rule.enabled);
  const [offset, setOffset] = useState(rule.offset_days);
  const [cadence, setCadence] = useState(rule.cadence_days);
  const [max, setMax] = useState(rule.max_sends);

  function save(patch: Partial<Pick<ReminderRule, "enabled" | "offset_days" | "cadence_days" | "max_sends">>) {
    start(async () => {
      const r = await updateReminderRuleAction(rule.kind, patch);
      if (r.ok) {
        toast({ message: "Rule saved.", tone: "positive" });
        router.refresh();
      } else {
        toast({ message: "Could not save the rule.", tone: "danger" });
      }
    });
  }

  const num = (value: number, onChange: (n: number) => void, onCommit: (n: number) => void, min = 0) => (
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      onBlur={() => onCommit(value)}
      className="mx-1 inline-block w-14 rounded-md border border-admin-line bg-admin-bg px-2 py-0.5 text-center text-sm tabular-nums text-admin-ink"
    />
  );

  return (
    <div className={cn("rounded-xl border border-admin-line bg-admin-surface p-4", !enabled && "opacity-60")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-admin-ink">{TITLES[rule.kind]}</p>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            save({ enabled: next });
          }}
          className={cn("relative h-6 w-11 rounded-full transition", enabled ? "bg-admin-status-positive" : "bg-admin-line-strong")}
        >
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition", enabled ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>
      <p className="mt-2 text-sm leading-7 text-admin-muted">
        {rule.kind === "deposit_due" ? (
          <>
            If a booked shoot has no deposit, wait {num(offset, setOffset, (v) => save({ offset_days: v }))} days, then
            remind every {num(cadence, setCadence, (v) => save({ cadence_days: v }), 1)} days, up to{" "}
            {num(max, setMax, (v) => save({ max_sends: v }), 1)} times.
          </>
        ) : rule.kind === "balance_due" ? (
          <>When a shoot is within {num(offset, setOffset, (v) => save({ offset_days: v }))} days and a balance is owed, send the balance reminder.</>
        ) : rule.kind === "gallery_expiring" ? (
          <>When a published gallery expires within {num(offset, setOffset, (v) => save({ offset_days: v }))} days, send the download reminder.</>
        ) : (
          <>Send the review request {num(offset, setOffset, (v) => save({ offset_days: v }))} days after a delivered shoot.</>
        )}
      </p>
    </div>
  );
}
