import test from "node:test";
import assert from "node:assert/strict";
import { titleCaseClientName } from "../src/lib/client-names";
import {
  addBusinessDays,
  contractAutomationValues,
  parseContractDate,
  parseContractTime,
  parseCoverageMinutes,
} from "../src/lib/contract-automation-values";
import { deriveOperationalStage } from "../src/lib/booking-stage-automation";
import { computeInvoiceStatus } from "../src/lib/invoice-status";

test("title cases ordinary, hyphenated, and apostrophe names", () => {
  assert.equal(titleCaseClientName("  kawish lakhani "), "Kawish Lakhani");
  assert.equal(titleCaseClientName("mary-jane o'connor"), "Mary-Jane O'Connor");
  assert.equal(titleCaseClientName("ÉLODIE D'ARCY"), "Élodie D'Arcy");
});

test("parses contract dates, explicit Toronto times, and durations", () => {
  assert.equal(parseContractDate("August 11, 2026"), "2026-08-11");
  assert.equal(parseContractTime("7:30 PM"), "19:30");
  assert.equal(parseContractTime("7:30"), null);
  assert.equal(parseCoverageMinutes("1.5 hours"), 90);
  assert.equal(parseCoverageMinutes("45 minutes"), 45);
});

test("counts weekdays beginning after the shoot date", () => {
  assert.equal(addBusinessDays("2026-08-09", 20), "2026-09-04");
  assert.equal(addBusinessDays("2026-08-11", 15), "2026-09-01");
  assert.equal(addBusinessDays("2026-08-14", 1), "2026-08-17");
});

test("reports field-specific contract automation warnings", () => {
  const result = contractAutomationValues({ type: "Portrait" });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.missing, [
      "shoot date",
      "start time with AM or PM",
      "coverage duration",
      "location",
      "total fee",
      "balance due date",
      "turnaround business days",
    ]);
  }
});

test("derives editing and delivered while respecting a manual override", () => {
  const base = {
    storedStage: "booked" as const,
    manualOverride: false,
    shootStart: "2026-08-11T23:30:00.000Z",
    shootEnd: "2026-08-12T00:30:00.000Z",
    galleryPublished: false,
    now: new Date("2026-08-12T01:00:00.000Z"),
  };
  assert.equal(deriveOperationalStage(base), "editing");
  assert.equal(deriveOperationalStage({ ...base, galleryPublished: true }), "delivered");
  assert.equal(deriveOperationalStage({ ...base, manualOverride: true }), "booked");
});

test("invoice status reflects partial and full payments", () => {
  const base = { total: 350, dueAt: "2099-08-09", sentAt: "2026-08-01", viewedAt: null, cancelledAt: null };
  assert.equal(computeInvoiceStatus({ ...base, paid: 50 }), "partially_paid");
  assert.equal(computeInvoiceStatus({ ...base, paid: 350 }), "paid");
});
