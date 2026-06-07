"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { BOOKING_STAGES, BOOKING_STAGE_LABELS, type BookingStage } from "@/lib/booking-stages";
import { moveBookingStageAction } from "@/app/admin/(protected)/pipeline/actions";

export type PipelineCard = {
  id: string;
  title: string;
  subtitle: string;
  stage: BookingStage;
  checklist: { label: string; done: boolean }[];
};

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-admin-ink/55">
      {done ? (
        <Check className="size-3 text-admin-success" aria-hidden="true" />
      ) : (
        <X className="size-3 text-admin-ink/30" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

function Card({ card, onMove, pending }: { card: PipelineCard; onMove: (id: string, stage: BookingStage) => void; pending: boolean }) {
  const idx = BOOKING_STAGES.indexOf(card.stage);
  const prev = idx > 0 ? BOOKING_STAGES[idx - 1] : null;
  const next = idx < BOOKING_STAGES.length - 1 ? BOOKING_STAGES[idx + 1] : null;

  return (
    <div className="rounded-md border border-admin-ink/10 bg-white/70 p-3">
      <Link href={`/admin/bookings/${card.id}`} className="block">
        <p className="text-sm font-medium leading-snug hover:text-admin-accent">{card.title}</p>
        <p className="mt-0.5 text-xs text-admin-ink/55">{card.subtitle}</p>
      </Link>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {card.checklist.map((c) => (
          <ChecklistRow key={c.label} label={c.label} done={c.done} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          disabled={!prev || pending}
          onClick={() => prev && onMove(card.id, prev)}
          className="inline-flex size-7 items-center justify-center rounded-md border border-admin-ink/12 text-admin-ink/55 transition hover:bg-admin-ink/6 disabled:opacity-30"
          aria-label="Move to previous stage"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={!next || pending}
          onClick={() => next && onMove(card.id, next)}
          className="inline-flex size-7 items-center justify-center rounded-md border border-admin-ink/12 text-admin-ink/55 transition hover:bg-admin-ink/6 disabled:opacity-30"
          aria-label="Move to next stage"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function PipelineBoard({ cards }: { cards: PipelineCard[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onMove = (id: string, stage: BookingStage) => {
    start(async () => {
      const r = await moveBookingStageAction(id, stage);
      if (r.ok) router.refresh();
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      {BOOKING_STAGES.map((stage) => {
        const inStage = cards.filter((c) => c.stage === stage);
        return (
          <div key={stage} className="rounded-lg border border-admin-ink/10 bg-admin-surface p-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold tracking-tight">{BOOKING_STAGE_LABELS[stage]}</h2>
              <span className="text-xs text-admin-ink/45">{inStage.length}</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {inStage.length ? (
                inStage.map((c) => <Card key={c.id} card={c} onMove={onMove} pending={pending} />)
              ) : (
                <p className="px-1 py-4 text-center text-xs text-admin-ink/35">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
