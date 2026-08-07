import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  agreementDisclaimer,
  agreementIntro,
  agreementSections,
} from "../src/data/booking-agreement";
import {
  applyWeddingAgreement,
  isWeddingAgreementType,
} from "../src/data/wedding-agreement";
import { defaultValues, validate, type FieldValues } from "../src/lib/contracts/schema";
import { withDerived } from "../src/lib/contracts/derive";
import { render, extractKeys } from "../src/lib/contracts/render";

const source = readFileSync("./templates/services-agreement-v1.md", "utf8");

const booking: FieldValues = {
  ...defaultValues(),
  clients: [
    { name: "Alex Chen", email: "alex@example.com", phone: "416-555-0101" },
    { name: "Jamie Lee", email: "jamie@example.com", phone: "416-555-0102" },
  ],
  "shoot.type_label": "wedding photography services",
  "shoot.date": "2026-08-09",
  "shoot.start_time": "5:30 PM",
  "shoot.coverage_hours": 5,
  "shoot.primary_location": "Sample Venue, Toronto, Ontario",
  "shoot.contact_name": "Taylor Morgan",
  "shoot.contact_phone": "416-555-0103",
  "shoot.alongside_other_vendors": true,
  "shoot.spans_meal": true,
  "shoot.has_assistant": false,
  "deliverables.min_images": 150,
  "deliverables.expected_images": 200,
  "licence.is_commercial": false,
  "fee.total": 350,
  "fee.retainer": 50,
  "fee.balance_due_date": "2026-08-09",
  "fee.all_inclusive": true,
  "fee.has_overtime_rate": false,
  "deliverables.gallery_days": 365,
  "deliverables.archive_days": 365,
  "policy.revision_images": 10,
};

const keys = extractKeys(source);
const values = withDerived(booking);
const issues = validate(values, keys);

const result = render(source, values, { strict: false });

assert.equal(keys.length, 67);
assert.deepEqual(issues, []);
assert.deepEqual(result.missing, []);
assert.equal(values["fee.balance"], 300);
assert.equal(values["fee.retainer_percent"], 14);
assert.equal(values["shoot.end_time"], "10:30 PM");
assert.equal(values["deliverables.estimated_delivery_date"], "2026-09-04");
assert.match(result.text, /Alex Chen and Jamie Lee/);
assert.match(result.text, /remaining balance of \*\*\$300\.00 CAD\*\*/);

const currentAgreementText = [
  agreementIntro,
  ...agreementSections.flatMap((section) => [section.heading, ...section.clauses]),
].join("\n");

assert.equal(agreementSections.length, 10);
for (const requiredConcept of [
  /Exclusivity/i,
  /non-refundable deposit/i,
  /invoice/i,
  /consent/i,
  /photography staff/i,
  /artistic judgment/i,
  /replacement/i,
  /copyright/i,
  /personal use/i,
  /Force Majeure Event/i,
  /indemnify/i,
  /maximum aggregate liability/i,
  /governed by the laws of the Province of Ontario/i,
  /electronic signature/i,
]) {
  assert.match(currentAgreementText, requiredConcept);
}

const weddingAgreement = applyWeddingAgreement(
  { intro: agreementIntro, disclaimer: agreementDisclaimer, sections: agreementSections },
  { clientName: "Alex Chen", partnerName: "Jamie Lee" },
);
const weddingText = [
  weddingAgreement.intro,
  ...weddingAgreement.sections.flatMap((section) => [section.heading, ...section.clauses]),
].join("\n");

assert.equal(isWeddingAgreementType("Weddings · Essential"), true);
assert.equal(isWeddingAgreementType("Event photography"), false);
assert.equal(weddingAgreement.sections.length, agreementSections.length);
assert.match(weddingText, /wedding of Alex Chen and Jamie Lee/);
assert.match(weddingText, /sole professional photographer responsible for coverage of the Wedding/);
assert.match(weddingText, /scheduled coverage exceeds six consecutive hours/);
assert.match(weddingText, /Wedding materials/);
assert.doesNotMatch(currentAgreementText, /scheduled coverage exceeds six consecutive hours/);

console.log(
  `Contract tests passed (${keys.length} registry fields; ${agreementSections.length} shared sections; wedding variant covered).`,
);
