"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSignature, FolderPlus, ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  createBookingContractAction,
  createBookingGalleryAction,
  createBookingQuestionnaireAction,
  type BookingContextResult,
} from "@/app/admin/(protected)/bookings/[id]/actions";

type Kind = "contract" | "questionnaire" | "gallery";

const RUN: Record<Kind, (bookingId: string) => Promise<BookingContextResult>> = {
  contract: createBookingContractAction,
  questionnaire: createBookingQuestionnaireAction,
  gallery: createBookingGalleryAction,
};

const ICON = {
  contract: FileSignature,
  questionnaire: ClipboardList,
  gallery: FolderPlus,
} as const;

/**
 * Start a contract, questionnaire or gallery from the job that is already open,
 * prefilled from it, instead of navigating to a global module and re-picking
 * the same client and date.
 */
export function BookingContextActions({
  bookingId,
  available,
}: {
  bookingId: string;
  available: { kind: Kind; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  if (available.length === 0) return null;

  function run(kind: Kind) {
    startTransition(async () => {
      const result = await RUN[kind](bookingId);
      toast({ message: result.message, tone: result.ok ? "positive" : "danger" });
      if (result.ok && result.href) router.push(result.href);
      else if (result.ok) router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-admin-line bg-admin-surface p-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-admin-muted">Start from this job</p>
      <div className="flex flex-col gap-2">
        {available.map(({ kind, label }) => {
          const Icon = ICON[kind];
          return (
            <button
              key={kind}
              type="button"
              onClick={() => run(kind)}
              disabled={pending}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-admin-line-strong px-3 text-left text-sm font-medium text-admin-ink transition hover:bg-admin-raise disabled:opacity-60"
            >
              <Icon className="size-4 shrink-0 text-admin-muted" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
