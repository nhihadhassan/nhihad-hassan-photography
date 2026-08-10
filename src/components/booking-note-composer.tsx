"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { addBookingNoteAction } from "@/app/admin/(protected)/bookings/actions";

/** Inline note composer at the top of the timeline spine. */
export function BookingNoteComposer({ bookingId }: { bookingId: string }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function submit() {
    const text = note.trim();
    if (!text) return;
    start(async () => {
      const result = await addBookingNoteAction(bookingId, text);
      if (result.ok) {
        setNote("");
        toast({ message: "Note added.", tone: "positive" });
        router.refresh();
      } else {
        toast({ message: result.message, tone: "danger" });
      }
    });
  }

  return (
    <div className="rounded-xl border border-admin-line bg-admin-surface p-3 transition focus-within:border-admin-copper">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
        rows={2}
        placeholder="Add an internal note..."
        className="w-full resize-none bg-transparent text-sm text-admin-ink outline-none placeholder:text-admin-muted"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-admin-muted">Cmd+Enter to save</span>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !note.trim()}
          className="min-h-9 rounded-lg bg-admin-ink px-3 text-sm font-medium text-admin-surface disabled:opacity-40"
        >
          {pending ? "Saving..." : "Add note"}
        </button>
      </div>
    </div>
  );
}
