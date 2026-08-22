import test from "node:test";
import assert from "node:assert/strict";
import {
  bookingLifecycle,
  lifecycleProgress,
  upcomingAutomations,
  type LifecycleInput,
  type LifecycleStepId,
} from "../src/lib/booking-lifecycle";

const NOW = new Date("2026-08-20T12:00:00.000Z");

const base: LifecycleInput = {
  contractSentAt: null,
  contractSignedAt: null,
  contractRevokedAt: null,
  total: 0,
  paid: 0,
  questionnaireSentAt: null,
  questionnaireSubmittedAt: null,
  shootStartAt: null,
  shootEndAt: null,
  galleryExists: false,
  galleryPublished: false,
  reviewReceivedAt: null,
  now: NOW,
};

const stepFor = (input: Partial<LifecycleInput>, id: LifecycleStepId) =>
  bookingLifecycle({ ...base, ...input }).find((s) => s.id === id)!;

test("a signed contract with no deposit reads as exactly that", () => {
  const signedNoDeposit = {
    contractSentAt: "2026-08-01T00:00:00.000Z",
    contractSignedAt: "2026-08-02T00:00:00.000Z",
    total: 800,
    paid: 0,
  };
  assert.equal(stepFor(signedNoDeposit, "contract").state, "done");
  assert.equal(stepFor(signedNoDeposit, "deposit").state, "active");
  assert.equal(stepFor(signedNoDeposit, "deposit").detail, "Nothing received");
});

test("a partial payment counts as a deposit, a full one as paid", () => {
  assert.equal(stepFor({ total: 800, paid: 200 }, "deposit").detail, "Deposit received");
  assert.equal(stepFor({ total: 800, paid: 800 }, "deposit").detail, "Paid in full");
  // Floating point must not leave a fully paid job showing a balance.
  assert.equal(stepFor({ total: 800, paid: 799.999 }, "deposit").detail, "Paid in full");
});

test("a job with no amount set has nothing to collect", () => {
  // Reading this as an outstanding balance would put every brand new booking
  // into a false alarm state.
  assert.equal(stepFor({ total: 0, paid: 0 }, "deposit").state, "pending");
  assert.equal(stepFor({ total: 0, paid: 0 }, "deposit").detail, "No amount set");
});

test("a revoked contract needs action again, it is not simply unsent", () => {
  const revoked = {
    contractSentAt: "2026-08-01T00:00:00.000Z",
    contractRevokedAt: "2026-08-03T00:00:00.000Z",
  };
  assert.equal(stepFor(revoked, "contract").state, "active");
  assert.match(stepFor(revoked, "contract").detail, /re-sending/);
});

test("the shoot flips to done once its end time has passed", () => {
  const future = { shootStartAt: "2026-09-01T18:00:00.000Z", shootEndAt: "2026-09-01T22:00:00.000Z" };
  const past = { shootStartAt: "2026-08-01T18:00:00.000Z", shootEndAt: "2026-08-01T22:00:00.000Z" };
  assert.equal(stepFor(future, "shoot").state, "active");
  assert.equal(stepFor(past, "shoot").state, "done");
  // Editing only begins once the camera is down.
  assert.equal(stepFor(future, "editing").state, "pending");
  assert.equal(stepFor(past, "editing").state, "active");
});

test("a shoot with only a start time still completes", () => {
  assert.equal(stepFor({ shootStartAt: "2026-08-01T18:00:00.000Z" }, "shoot").state, "done");
});

test("an unsent questionnaire stops being outstanding after the shoot", () => {
  const beforeShoot = { shootStartAt: "2026-09-01T18:00:00.000Z" };
  const afterShoot = { shootStartAt: "2026-08-01T18:00:00.000Z" };
  assert.equal(stepFor(beforeShoot, "questionnaire").state, "pending");
  assert.equal(stepFor(afterShoot, "questionnaire").state, "skipped");
});

test("a delivered gallery finishes editing and opens the review step", () => {
  const delivered = {
    shootStartAt: "2026-08-01T18:00:00.000Z",
    galleryExists: true,
    galleryPublished: true,
  };
  assert.equal(stepFor(delivered, "editing").state, "done");
  assert.equal(stepFor(delivered, "gallery").state, "done");
  assert.equal(stepFor(delivered, "review").state, "active");
  assert.equal(stepFor({ ...delivered, reviewReceivedAt: "2026-08-10T00:00:00.000Z" }, "review").state, "done");
});

test("an unpublished gallery is a draft, not a delivery", () => {
  const draft = { galleryExists: true, galleryPublished: false };
  assert.equal(stepFor(draft, "gallery").state, "active");
  assert.equal(stepFor(draft, "review").state, "pending");
});

test("progress ignores steps that were skipped", () => {
  const steps = bookingLifecycle({
    ...base,
    shootStartAt: "2026-08-01T18:00:00.000Z",
    contractSignedAt: "2026-07-01T00:00:00.000Z",
    total: 500,
    paid: 500,
  });
  const { done, total } = lifecycleProgress(steps);
  // Questionnaire was skipped, so it is not counted against the job.
  assert.equal(total, 6);
  assert.equal(done, 3);
});

const rules = {
  deposit_due: { enabled: true, offset_days: 0 },
  balance_due: { enabled: true, offset_days: 4 },
  review_request: { enabled: true, offset_days: 7 },
  gallery_expiring: { enabled: true, offset_days: 7 },
};

const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

test("only automations that could still fire are listed", () => {
  const unpaid = upcomingAutomations({
    rules,
    muted: new Set(),
    startAt: future,
    balance: 800,
    paid: 0,
    galleryPublished: false,
    hasClientEmail: true,
  });
  assert.deepEqual(unpaid.map((a) => a.kind), ["deposit_due", "balance_due"]);

  // Once the deposit lands, that nudge is no longer upcoming.
  const partPaid = upcomingAutomations({
    rules,
    muted: new Set(),
    startAt: future,
    balance: 600,
    paid: 200,
    galleryPublished: false,
    hasClientEmail: true,
  });
  assert.deepEqual(partPaid.map((a) => a.kind), ["balance_due"]);
});

test("a settled, delivered job only awaits the review request", () => {
  const done = upcomingAutomations({
    rules,
    muted: new Set(),
    startAt: "2026-08-01T18:00:00.000Z",
    balance: 0,
    paid: 800,
    galleryPublished: true,
    hasClientEmail: true,
  });
  assert.deepEqual(done.map((a) => a.kind), ["review_request"]);
});

test("a booking with no client email promises nothing", () => {
  const none = upcomingAutomations({
    rules,
    muted: new Set(),
    startAt: future,
    balance: 800,
    paid: 0,
    galleryPublished: true,
    hasClientEmail: false,
  });
  assert.deepEqual(none, []);
});

test("a disabled rule never appears, and a muted one appears as muted", () => {
  const off = upcomingAutomations({
    rules: { ...rules, deposit_due: { enabled: false, offset_days: 0 } },
    muted: new Set(["balance_due"]),
    startAt: future,
    balance: 800,
    paid: 0,
    galleryPublished: false,
    hasClientEmail: true,
  });
  assert.deepEqual(off.map((a) => a.kind), ["balance_due"]);
  assert.equal(off[0].muted, true);
});
