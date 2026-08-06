import assert from "node:assert/strict";
import {
  agreementDisclaimer,
  agreementFeeFields,
  agreementIntro,
  agreementSections,
} from "../src/data/booking-agreement";
import {
  agreementTemplates,
  applyWeddingAgreement,
  resolveAgreementTemplateId,
} from "../src/data/wedding-agreement";

const shared = {
  intro: agreementIntro,
  disclaimer: agreementDisclaimer,
  sections: agreementSections,
};
const generalText = [
  shared.intro,
  ...shared.sections.flatMap((section) => [section.heading, ...section.clauses]),
].join("\n");
const wedding = applyWeddingAgreement(shared, {
  clientName: "Alex Chen",
  partnerName: "Jamie Lee",
});
const weddingText = [
  wedding.intro,
  ...wedding.sections.flatMap((section) => [section.heading, ...section.clauses]),
].join("\n");

assert.deepEqual(
  agreementTemplates.map((template) => template.id),
  ["photography", "wedding"],
);
assert.equal(resolveAgreementTemplateId("photography"), "photography");
assert.equal(resolveAgreementTemplateId("wedding"), "wedding");
assert.equal(resolveAgreementTemplateId("unknown"), "photography");
assert.equal(wedding.sections.length, shared.sections.length);
assert.match(weddingText, /wedding of \{\{clientName\}\} and \{\{partnerName\}\}/);
assert.match(weddingText, /coverage of the Wedding/);
assert.match(weddingText, /scheduled coverage exceeds \{\{mealHours\}\} consecutive hours/);
assert.match(weddingText, /Wedding materials/);
assert.doesNotMatch(generalText, /scheduled coverage exceeds six consecutive hours/);
assert.match(agreementIntro, /^THIS AGREEMENT/);
for (const variable of [
  "effectiveDate",
  "clientName",
  "clientAddress",
  "city",
  "cancellationNoticeDays",
  "galleryWindow",
]) {
  assert.match(generalText, new RegExp(`\\{\\{${variable}\\}\\}`));
}
assert.deepEqual(
  agreementFeeFields.map((field) => field.param),
  ["total", "hourly", "deposit", "balanceDueDate", "balance", "lateFeePercent"],
);
assert.doesNotMatch(generalText, /25% deposit/i);
assert.match(generalText, /2\. Fees and Payment/);
assert.match(generalText, /2\.2 Retainer/);
assert.match(generalText, /\{\{lateFeePercent\}\} per month/);
assert.match(weddingText, /2\. Fees and Deposit/);
assert.match(weddingText, /2\.2 Deposit/);
assert.doesNotMatch(weddingText, /2\.2 Retainer/);

for (const requiredConcept of [
  /2\.3 Invoice/i,
  /access and consent/i,
  /Photography staff/i,
  /artistic judgment/i,
  /Force Majeure Event/i,
  /Indemnity/i,
  /maximum aggregate liability/i,
  /electronic signature/i,
]) {
  assert.match(generalText, requiredConcept);
  assert.match(weddingText, requiredConcept);
}

console.log("Agreement template tests passed (photography and wedding).");
