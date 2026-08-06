import { cn } from "@/lib/utils";

/**
 * The single admin status vocabulary. Every status chip across the admin
 * routes through this component so the label casing and colour are identical
 * everywhere. Contracts, invoices, bookings, and galleries all map their
 * internal state onto one of these keys (see statusFor* helpers below).
 *
 * Colour rule: chips only use the reserved semantic status tokens, never the
 * brand accent. positive = signed/paid, waiting = sent/viewed/due-soon,
 * danger = overdue/stale, info = in progress, neutral = draft/void.
 */
export type StatusKey =
  | "draft"
  | "sent"
  | "viewed"
  | "in_progress"
  | "signed"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "expired"
  | "void";

type Tone = "positive" | "waiting" | "danger" | "info" | "neutral";

const STATUS: Record<StatusKey, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "waiting" },
  viewed: { label: "Viewed", tone: "waiting" },
  in_progress: { label: "In progress", tone: "info" },
  signed: { label: "Signed", tone: "positive" },
  paid: { label: "Paid", tone: "positive" },
  partially_paid: { label: "Partially paid", tone: "waiting" },
  overdue: { label: "Overdue", tone: "danger" },
  expired: { label: "Expired", tone: "danger" },
  void: { label: "Void", tone: "neutral" },
};

const TONE_CLASSES: Record<Tone, string> = {
  positive: "bg-admin-status-positive-tint text-admin-status-positive",
  waiting: "bg-admin-status-waiting-tint text-admin-status-waiting",
  danger: "bg-admin-status-danger-tint text-admin-status-danger",
  info: "bg-admin-status-info-tint text-admin-status-info",
  neutral: "bg-admin-status-neutral-tint text-admin-status-neutral",
};

export function StatusChip({
  status,
  className,
}: {
  status: StatusKey;
  className?: string;
}) {
  const { label, tone } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current opacity-70"
      />
      {label}
    </span>
  );
}

/** Map a contract (agreement_request) timestamp set to a status key. */
export function statusForContract(a: {
  signed_at: string | null;
  viewed_at: string | null;
  sent_at: string | null;
  revoked_at: string | null;
  expires_at?: string | null;
  expired_at?: string | null;
}): StatusKey {
  if (a.signed_at) return "signed";
  if (a.revoked_at) return "void";
  const pastExpiry = a.expires_at ? new Date(a.expires_at).getTime() <= Date.now() : false;
  if (a.expired_at || pastExpiry) return "expired";
  if (a.viewed_at) return "viewed";
  if (a.sent_at) return "sent";
  return "draft";
}

/**
 * Map an invoice to a status key. Invoices have no status enum today, so state
 * is derived from the payment total against the booking total and the due date.
 */
export function statusForInvoice(i: {
  total: number;
  paid: number;
  dueAt: string | null;
  sent: boolean;
  voided?: boolean;
}): StatusKey {
  if (i.voided) return "void";
  if (i.total > 0 && i.paid >= i.total - 0.5) return "paid";
  const overdue = i.dueAt ? new Date(i.dueAt).getTime() < Date.now() : false;
  if (i.paid > 0.5) return overdue ? "overdue" : "partially_paid";
  if (overdue) return "overdue";
  return i.sent ? "sent" : "draft";
}
