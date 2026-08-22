import test from "node:test";
import assert from "node:assert/strict";
import {
  inquiryLocalStart,
  inquiryToBookingInput,
  isTerminalInquiryStatus,
  needsReply,
  normalizeInquiryStatus,
  type ConvertibleInquiry,
} from "../src/lib/inquiry-lifecycle";

const inquiry: ConvertibleInquiry = {
  name: "  Rachel Okonkwo ",
  email: "rachel@example.com",
  phone: "416-555-0134",
  event_type: "Graduation",
  package_name: "Graduation - Standard",
  event_date: "2026-09-19",
  event_time: "16:30",
  location: "Trinity Bellwoods",
  budget: "$400-600",
  referral_source: "Instagram",
  message: "Looking for about an hour of photos after convocation.",
};

test("carries every field the client already gave us onto the booking", () => {
  const input = inquiryToBookingInput(inquiry, "2026-09-19T20:30:00.000Z");

  assert.equal(input.clientName, "Rachel Okonkwo");
  assert.equal(input.clientEmail, "rachel@example.com");
  assert.equal(input.shootType, "Graduation");
  assert.equal(input.location, "Trinity Bellwoods");
  assert.equal(input.startAt, "2026-09-19T20:30:00.000Z");
  assert.equal(input.stage, "inquiry");

  // The sales context and their own words survive, so nothing has to be
  // re-read off the inquiry later.
  const note = input.internalNote ?? "";
  assert.match(note, /Graduation - Standard/);
  assert.match(note, /\$400-600/);
  assert.match(note, /Instagram/);
  assert.match(note, /416-555-0134/);
  assert.match(note, /an hour of photos after convocation/);
});

test("keeps the client's message off client-visible booking fields", () => {
  // The booking hub is a page the client themselves opens, so their stated
  // budget and our referral tracking must not land in `notes`.
  const input = inquiryToBookingInput(inquiry, null);
  assert.equal(input.notes, undefined);
  assert.match(input.internalNote ?? "", /Budget/);
});

test("falls back to shoot type when no event type was given", () => {
  const input = inquiryToBookingInput(
    { ...inquiry, event_type: null },
    null,
  );
  assert.equal(input.shootType, "Graduation - Standard");
});

test("a date without a time becomes midday, not midnight", () => {
  // Midnight would read as a real booked hour; midday reads as "that day,
  // time to be confirmed".
  assert.equal(inquiryLocalStart("2026-09-19", null), "2026-09-19T12:00");
  assert.equal(inquiryLocalStart("2026-09-19", ""), "2026-09-19T12:00");
  assert.equal(inquiryLocalStart("2026-09-19", "16:30"), "2026-09-19T16:30");
  assert.equal(inquiryLocalStart("2026-09-19", "9:05"), "2026-09-19T09:05");
});

test("no usable date means no start time rather than a wrong one", () => {
  assert.equal(inquiryLocalStart(null, "16:30"), null);
  assert.equal(inquiryLocalStart("sometime in the fall", "16:30"), null);
});

test("a requested date that could not be parsed still reaches the note", () => {
  const input = inquiryToBookingInput(inquiry, null);
  assert.match(input.internalNote ?? "", /Requested date: 2026-09-19 at 16:30/);
});

test("status vocabulary is closed and defaults to new", () => {
  assert.equal(normalizeInquiryStatus("contacted"), "contacted");
  assert.equal(normalizeInquiryStatus("lost"), "lost");
  assert.equal(normalizeInquiryStatus(null), "new");
  assert.equal(normalizeInquiryStatus("something-else"), "new");
});

test("only a brand new lead counts as awaiting a reply", () => {
  assert.equal(needsReply("new"), true);
  assert.equal(needsReply(null), true);
  assert.equal(needsReply("contacted"), false);
  assert.equal(needsReply("considering"), false);
});

test("converted and lost leads drop out of work queues but are never deleted", () => {
  assert.equal(isTerminalInquiryStatus("converted"), true);
  assert.equal(isTerminalInquiryStatus("lost"), true);
  assert.equal(isTerminalInquiryStatus("new"), false);
  assert.equal(isTerminalInquiryStatus("considering"), false);
});
