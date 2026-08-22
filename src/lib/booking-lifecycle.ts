/**
 * The seven-step view of a photography job, derived entirely from records that
 * already exist -- a signed agreement, a recorded payment, a submitted
 * questionnaire, the shoot date, a published gallery, a review.
 *
 * Nothing here is stored. There is no checklist table to keep in sync and
 * nothing for the photographer to tick off by hand, because every one of these
 * facts is already written down somewhere else. Plain module so the strip can
 * render in a client component and the rules can be unit tested.
 */

export type LifecycleStepId =
  | "contract"
  | "deposit"
  | "questionnaire"
  | "shoot"
  | "editing"
  | "gallery"
  | "review";

export type LifecycleState = "done" | "active" | "pending" | "skipped";

export type LifecycleStep = {
  id: LifecycleStepId;
  label: string;
  state: LifecycleState;
  /** Short plain-language status, e.g. "Signed", "Awaiting signature". */
  detail: string;
};

export type LifecycleInput = {
  contractSentAt: string | null;
  contractSignedAt: string | null;
  contractRevokedAt: string | null;
  /** Total owed on the job. 0 or null means no money has been set yet. */
  total: number;
  paid: number;
  questionnaireSentAt: string | null;
  questionnaireSubmittedAt: string | null;
  shootStartAt: string | null;
  shootEndAt: string | null;
  galleryExists: boolean;
  galleryPublished: boolean;
  reviewReceivedAt: string | null;
  now: Date;
};

const LABELS: Record<LifecycleStepId, string> = {
  contract: "Contract",
  deposit: "Deposit",
  questionnaire: "Questionnaire",
  shoot: "Shoot",
  editing: "Editing",
  gallery: "Gallery",
  review: "Review",
};

function step(id: LifecycleStepId, state: LifecycleState, detail: string): LifecycleStep {
  return { id, label: LABELS[id], state, detail };
}

export function bookingLifecycle(input: LifecycleInput): LifecycleStep[] {
  const nowMs = input.now.getTime();
  const startMs = input.shootStartAt ? new Date(input.shootStartAt).getTime() : null;
  const endMs = input.shootEndAt
    ? new Date(input.shootEndAt).getTime()
    : startMs;
  const shot = endMs !== null && endMs <= nowMs;

  // Contract
  let contract: LifecycleStep;
  if (input.contractSignedAt) contract = step("contract", "done", "Signed");
  else if (input.contractRevokedAt) contract = step("contract", "active", "Revoked, needs re-sending");
  else if (input.contractSentAt) contract = step("contract", "active", "Awaiting signature");
  else contract = step("contract", "pending", "Not created");

  // Deposit. A job with no amount set yet has nothing to collect, so this reads
  // as pending rather than as an outstanding balance.
  let deposit: LifecycleStep;
  if (input.total <= 0) deposit = step("deposit", "pending", "No amount set");
  else if (input.paid >= input.total - 0.005) deposit = step("deposit", "done", "Paid in full");
  else if (input.paid > 0) deposit = step("deposit", "done", "Deposit received");
  else deposit = step("deposit", "active", "Nothing received");

  // Questionnaire is genuinely optional; once the shoot has happened, an
  // unsent one is moot rather than outstanding.
  let questionnaire: LifecycleStep;
  if (input.questionnaireSubmittedAt) questionnaire = step("questionnaire", "done", "Completed");
  else if (input.questionnaireSentAt) questionnaire = step("questionnaire", "active", "Sent, not answered");
  else if (shot) questionnaire = step("questionnaire", "skipped", "Not used");
  else questionnaire = step("questionnaire", "pending", "Not sent");

  // Shoot
  let shoot: LifecycleStep;
  if (shot) shoot = step("shoot", "done", "Shot");
  else if (startMs === null) shoot = step("shoot", "pending", "Date to be set");
  else shoot = step("shoot", "active", "Scheduled");

  // Editing runs from the end of the shoot until the gallery is published.
  let editing: LifecycleStep;
  if (input.galleryPublished) editing = step("editing", "done", "Delivered");
  else if (shot) editing = step("editing", "active", "In progress");
  else editing = step("editing", "pending", "Not started");

  // Gallery
  let gallery: LifecycleStep;
  if (input.galleryPublished) gallery = step("gallery", "done", "Published");
  else if (input.galleryExists) gallery = step("gallery", "active", "Draft, not delivered");
  else gallery = step("gallery", "pending", "Not created");

  // Review
  let review: LifecycleStep;
  if (input.reviewReceivedAt) review = step("review", "done", "Received");
  else if (input.galleryPublished) review = step("review", "active", "Not requested");
  else review = step("review", "pending", "After delivery");

  return [contract, deposit, questionnaire, shoot, editing, gallery, review];
}

/** How far through the job we are, for a progress readout. */
export function lifecycleProgress(steps: LifecycleStep[]): { done: number; total: number } {
  const counted = steps.filter((s) => s.state !== "skipped");
  return {
    done: counted.filter((s) => s.state === "done").length,
    total: counted.length,
  };
}

/** Structural shape of a reminder rule, so this stays a pure module. */
type RuleLike = { enabled: boolean; offset_days: number };

export type UpcomingAutomation = {
  kind: string;
  label: string;
  detail: string;
  muted: boolean;
};

/**
 * The automated emails that are still live for this booking.
 *
 * Only lists nudges that could actually fire given where the job currently is:
 * a deposit reminder is not "upcoming" once money has arrived, and a balance
 * reminder is not upcoming once the invoice is settled. Anything already
 * satisfied is left off rather than shown as a disabled row, so the list stays
 * short enough to be worth reading.
 *
 * A booking with no client email can never be emailed, so it gets an empty
 * list rather than promises the system cannot keep.
 */
export function upcomingAutomations(input: {
  rules: Record<string, RuleLike>;
  muted: Set<string>;
  startAt: string | null;
  balance: number;
  paid: number;
  galleryPublished: boolean;
  hasClientEmail: boolean;
}): UpcomingAutomation[] {
  if (!input.hasClientEmail) return [];

  const out: UpcomingAutomation[] = [];
  const add = (kind: string, label: string, detail: string) => {
    const rule = input.rules[kind];
    if (!rule?.enabled) return;
    out.push({ kind, label, detail, muted: input.muted.has(kind) });
  };

  const shootUpcoming =
    input.startAt !== null && new Date(input.startAt).getTime() > Date.now();

  if (shootUpcoming && input.paid <= 0 && input.balance > 0.5) {
    add("deposit_due", "Deposit reminder", "Asks the client to e-transfer the deposit to hold the date.");
  }

  if (shootUpcoming && input.balance > 0.5) {
    const days = input.rules.balance_due?.offset_days ?? 0;
    add("balance_due", "Balance reminder", `Sends ${days} days before the shoot while a balance is owed.`);
  }

  if (input.galleryPublished) {
    const days = input.rules.review_request?.offset_days ?? 0;
    add("review_request", "Review request", `Sends ${days} days after the gallery was delivered.`);
  }

  return out;
}
