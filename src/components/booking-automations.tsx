"use client";

import { useState, useTransition } from "react";
import { BellRing, BellOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { setBookingReminderMuteAction } from "@/app/admin/(protected)/bookings/[id]/actions";

export type BookingAutomation = {
  kind: string;
  label: string;
  /** What will happen, in plain language. */
  detail: string;
  muted: boolean;
};

/**
 * What the system will email this client on its own, and a way to stop any one
 * of them.
 *
 * Automated nudges are only safe if they are visible. Muting is per booking and
 * per kind, so skipping a reminder for one client never turns the rule off for
 * everyone.
 */
export function BookingAutomations({
  bookingId,
  automations,
}: {
  bookingId: string;
  automations: BookingAutomation[];
}) {
  const [items, setItems] = useState(automations);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  if (items.length === 0) return null;

  function toggle(kind: string, nextMuted: boolean) {
    setItems((cur) => cur.map((a) => (a.kind === kind ? { ...a, muted: nextMuted } : a)));
    startTransition(async () => {
      const result = await setBookingReminderMuteAction(bookingId, kind, nextMuted);
      if (!result.ok) {
        setItems((cur) => cur.map((a) => (a.kind === kind ? { ...a, muted: !nextMuted } : a)));
        toast({ message: result.message, tone: "danger" });
      }
    });
  }

  return (
    <div className="rounded-xl border border-admin-line bg-admin-surface p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-admin-muted">Automatic emails</p>
      <ul className="space-y-3">
        {items.map((automation) => (
          <li key={automation.kind} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${
                  automation.muted ? "text-admin-muted line-through" : "text-admin-ink"
                }`}
              >
                {automation.label}
              </p>
              <p className="text-xs leading-snug text-admin-muted">{automation.detail}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(automation.kind, !automation.muted)}
              disabled={pending}
              aria-label={automation.muted ? `Restore ${automation.label}` : `Skip ${automation.label}`}
              title={automation.muted ? "Restore this reminder" : "Skip this reminder for this booking"}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-admin-line text-admin-muted transition hover:bg-admin-raise disabled:opacity-50"
            >
              {automation.muted ? (
                <BellOff className="size-4" aria-hidden="true" />
              ) : (
                <BellRing className="size-4" aria-hidden="true" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
