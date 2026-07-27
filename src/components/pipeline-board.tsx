"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, Rows3 } from "lucide-react";
import { BOOKING_STAGES, BOOKING_STAGE_LABELS, type BookingStage } from "@/lib/booking-stages";
import { moveBookingStageAction } from "@/app/admin/(protected)/pipeline/actions";
import { useToast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

type MoneyTone = "positive" | "warning" | "neutral";

export type PipelineCard = {
  id: string;
  title: string;
  packageLabel: string;
  shootLabel: string;
  stage: BookingStage;
  money: { label: string; tone: MoneyTone };
  daysInStage: number;
  stale: boolean;
  totalValue: number;
};

const MONEY_TONE: Record<MoneyTone, string> = {
  positive: "bg-admin-status-positive-tint text-admin-status-positive",
  warning: "bg-admin-status-waiting-tint text-admin-status-waiting",
  neutral: "bg-admin-status-neutral-tint text-admin-status-neutral",
};

type SortKey = "activity" | "shoot";

export function PipelineBoard({ cards, packages }: { cards: PipelineCard[]; packages: string[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [local, setLocal] = useState(cards);
  const [view, setView] = useState<"board" | "list">("board");
  const [pkg, setPkg] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("activity");
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (pkg === "all" ? local : local.filter((c) => c.packageLabel === pkg)),
    [local, pkg],
  );

  function commitMove(id: string, toStage: BookingStage) {
    const card = local.find((c) => c.id === id);
    if (!card || card.stage === toStage) return;
    const fromStage = card.stage;

    const apply = (stage: BookingStage) =>
      setLocal((cur) => cur.map((c) => (c.id === id ? { ...c, stage, daysInStage: 0, stale: false } : c)));

    apply(toStage);
    startTransition(async () => {
      const r = await moveBookingStageAction(id, toStage);
      if (!r.ok) {
        apply(fromStage);
        toast({ message: "That move could not be saved.", tone: "danger" });
        return;
      }
      toast({
        message: `Moved to ${BOOKING_STAGE_LABELS[toStage]}.`,
        onUndo: () => {
          apply(fromStage);
          startTransition(async () => {
            await moveBookingStageAction(id, fromStage);
            router.refresh();
          });
        },
      });
      router.refresh();
    });
  }

  if (view === "list") {
    return (
      <div>
        <ViewControls
          view={view}
          setView={setView}
          pkg={pkg}
          setPkg={setPkg}
          packages={packages}
          sort={sort}
          setSort={setSort}
        />
        <div className="mt-4">
          <PipelineList cards={filtered} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <ViewControls
        view={view}
        setView={setView}
        pkg={pkg}
        setPkg={setPkg}
        packages={packages}
        sort={sort}
        setSort={setSort}
      />
      <div className="mt-4 flex gap-3 overflow-x-auto pb-3">
        {BOOKING_STAGES.map((stage) => {
          const inStage = filtered
            .filter((c) => c.stage === stage)
            .sort((a, b) => (sort === "shoot" ? a.shootLabel.localeCompare(b.shootLabel) : b.daysInStage - a.daysInStage));
          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) commitMove(dragId, stage);
                setDragId(null);
              }}
              className="w-64 shrink-0 rounded-xl border border-admin-line bg-admin-bg p-2.5"
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <h2 className="text-sm font-semibold text-admin-ink">{BOOKING_STAGE_LABELS[stage]}</h2>
                <span className="text-xs text-admin-muted tabular-nums">{inStage.length}</span>
              </div>
              <div className="space-y-2">
                {inStage.map((card) => (
                  <PipelineCardView
                    key={card.id}
                    card={card}
                    onMove={commitMove}
                    onDragStart={() => setDragId(card.id)}
                  />
                ))}
                {inStage.length === 0 ? (
                  <p className="px-1 py-3 text-center text-xs text-admin-muted/70">Empty</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ViewControls({
  view,
  setView,
  pkg,
  setPkg,
  packages,
  sort,
  setSort,
}: {
  view: "board" | "list";
  setView: (v: "board" | "list") => void;
  pkg: string;
  setPkg: (v: string) => void;
  packages: string[];
  sort: SortKey;
  setSort: (v: SortKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-admin-line p-0.5">
        <button
          onClick={() => setView("board")}
          aria-pressed={view === "board"}
          className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium", view === "board" ? "bg-admin-ink text-admin-surface" : "text-admin-muted")}
        >
          <LayoutGrid className="size-3.5" aria-hidden="true" /> Board
        </button>
        <button
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium", view === "list" ? "bg-admin-ink text-admin-surface" : "text-admin-muted")}
        >
          <Rows3 className="size-3.5" aria-hidden="true" /> List
        </button>
      </div>

      {packages.length > 0 ? (
        <select
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
          aria-label="Filter by package"
          className="min-h-9 rounded-lg border border-admin-line bg-admin-surface px-2.5 text-sm text-admin-ink"
        >
          <option value="all">All packages</option>
          {packages.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      ) : null}

      {view === "board" ? (
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort within stage"
          className="min-h-9 rounded-lg border border-admin-line bg-admin-surface px-2.5 text-sm text-admin-ink"
        >
          <option value="activity">Most time in stage</option>
          <option value="shoot">Shoot date</option>
        </select>
      ) : null}
    </div>
  );
}

function PipelineCardView({
  card,
  onMove,
  onDragStart,
}: {
  card: PipelineCard;
  onMove: (id: string, stage: BookingStage) => void;
  onDragStart: () => void;
}) {
  const idx = BOOKING_STAGES.indexOf(card.stage);
  const prev = idx > 0 ? BOOKING_STAGES[idx - 1] : null;
  const next = idx < BOOKING_STAGES.length - 1 ? BOOKING_STAGES[idx + 1] : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        "rounded-lg border bg-admin-surface p-3 shadow-sm",
        card.stale ? "border-admin-status-danger/40" : "border-admin-line",
      )}
    >
      <Link href={`/admin/bookings/${card.id}`} className="block">
        <p className="text-sm font-medium leading-snug text-admin-ink hover:text-admin-accent">{card.title}</p>
        <p className="mt-0.5 text-xs text-admin-muted">
          {[card.packageLabel, card.shootLabel].filter(Boolean).join(" · ")}
        </p>
      </Link>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", MONEY_TONE[card.money.tone])}>
          {card.money.label}
        </span>
        <span className={cn("text-[11px] tabular-nums", card.stale ? "text-admin-status-danger" : "text-admin-muted")}>
          {card.daysInStage}d in stage
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && onMove(card.id, prev)}
          aria-label="Move to previous stage"
          className="inline-flex size-7 items-center justify-center rounded-md border border-admin-line text-admin-muted hover:bg-admin-raise disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && onMove(card.id, next)}
          aria-label="Move to next stage"
          className="inline-flex size-7 items-center justify-center rounded-md border border-admin-line text-admin-muted hover:bg-admin-raise disabled:opacity-30"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PipelineList({ cards }: { cards: PipelineCard[] }) {
  const columns: Column<PipelineCard>[] = [
    { key: "title", header: "Client", render: (c) => <span className="font-medium">{c.title}</span>, sortValue: (c) => c.title },
    { key: "package", header: "Package", render: (c) => c.packageLabel || "-", hideOnMobile: true },
    { key: "shoot", header: "Shoot", render: (c) => c.shootLabel, sortValue: (c) => c.shootLabel, hideOnMobile: true },
    { key: "stage", header: "Stage", render: (c) => BOOKING_STAGE_LABELS[c.stage], sortValue: (c) => BOOKING_STAGES.indexOf(c.stage) },
    {
      key: "money",
      header: "Money",
      numeric: true,
      render: (c) => (
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", MONEY_TONE[c.money.tone])}>{c.money.label}</span>
      ),
    },
  ];
  return (
    <DataTable
      rows={cards}
      columns={columns}
      getRowId={(c) => c.id}
      getRowHref={(c) => `/admin/bookings/${c.id}`}
      searchText={(c) => `${c.title} ${c.packageLabel}`}
      searchPlaceholder="Search bookings"
      emptyState="No bookings match."
    />
  );
}
