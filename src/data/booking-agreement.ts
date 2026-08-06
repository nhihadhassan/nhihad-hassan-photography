/**
 * Standard photography booking agreement, rendered at /booking-agreement.
 * Single source of truth for the contract text. Edit clause wording here.
 *
 * This is a convenience template, not legal advice. The page shows a note
 * recommending review by a licensed Ontario lawyer.
 */

export type AgreementSection = {
  heading: string;
  clauses: string[];
};

/** Fields that can be pre-filled via URL query params on the page. */
export type AgreementDetailField = {
  /** Query-param key, e.g. ?client=Jane%20Doe */
  param: string;
  label: string;
};

export const agreementDetailFields: AgreementDetailField[] = [
  { param: "client", label: "Full legal or company name" },
  { param: "signerName", label: "Authorized signer name" },
  { param: "signerTitle", label: "Authorized signer title" },
  { param: "secondSignerName", label: "Second signer name" },
  { param: "secondSignerEmail", label: "Second signer email" },
  { param: "secondSignerPhone", label: "Second signer phone" },
  { param: "partner", label: "Partner name (weddings)" },
  { param: "effectiveDate", label: "Effective date" },
  { param: "clientAddress", label: "Client address" },
  { param: "email", label: "Client email" },
  { param: "phone", label: "Client phone" },
  { param: "type", label: "Shoot type / package" },
  { param: "description", label: "Description of services" },
  { param: "date", label: "Shoot date" },
  { param: "startTime", label: "Start time" },
  { param: "coverageTime", label: "Coverage time" },
  { param: "location", label: "Venue name and full address" },
  { param: "secondLocation", label: "Second location" },
  { param: "onsiteContactName", label: "On-site contact name" },
  { param: "onsiteContactPhone", label: "On-site contact phone" },
  { param: "secondShooter", label: "Second shooter" },
  { param: "minimumEditedImages", label: "Minimum edited images" },
  { param: "turnaroundBusinessDays", label: "Turnaround (business days)" },
  { param: "specialRequests", label: "Restrictions and special requests" },
  { param: "city", label: "Included travel city" },
  { param: "mealHours", label: "Meal threshold (hours)" },
  { param: "window", label: "Gallery availability window" },
  { param: "rehostingFee", label: "Gallery rehosting fee" },
  { param: "revisionPolicy", label: "Revision allowance" },
  { param: "archiveWindow", label: "Image archive period" },
  { param: "cancellationPolicy", label: "Cancellation tiers" },
  { param: "reschedulePolicy", label: "Rescheduling policy" },
  { param: "additionalCharges", label: "Separately billed items" },
  { param: "licenseType", label: "Client licence type" },
  { param: "privacyOptOutFee", label: "Privacy opt-out surcharge" },
];

export const agreementServiceFields: AgreementDetailField[] = [
  { param: "type", label: "Type of shoot" },
  { param: "date", label: "Date of services" },
  { param: "startTime", label: "Start time" },
  { param: "coverageTime", label: "Coverage time" },
  { param: "location", label: "Venue and full address" },
  { param: "secondLocation", label: "Second location" },
  { param: "onsiteContactName", label: "On-site contact" },
  { param: "onsiteContactPhone", label: "On-site contact phone" },
  { param: "secondShooter", label: "Second shooter" },
  { param: "minimumEditedImages", label: "Minimum edited images" },
  { param: "turnaroundBusinessDays", label: "Turnaround in business days" },
  { param: "specialRequests", label: "Restrictions / special requests" },
  { param: "description", label: "Description of services" },
];

/** Booking-specific figures shown directly in Section 2.1. */
export const agreementFeeFields: AgreementDetailField[] = [
  { param: "total", label: "Total fee for services" },
  { param: "hourly", label: "Additional hourly pricing" },
  { param: "deposit", label: "Deposit due upon signing" },
  { param: "balanceDueDate", label: "Final due date" },
  { param: "balance", label: "Remaining amount due" },
  { param: "lateFeePercent", label: "Late fee per month" },
];

/** Original detail layout retained when displaying a previously signed snapshot. */
export const legacyAgreementDetailFields: AgreementDetailField[] = [
  { param: "client", label: "Client name" },
  { param: "partner", label: "Partner name (weddings)" },
  { param: "email", label: "Client email" },
  { param: "phone", label: "Client phone" },
  { param: "type", label: "Shoot type / package" },
  { param: "date", label: "Shoot date(s) and time" },
  { param: "location", label: "Location(s)" },
  { param: "total", label: "Total fee (CAD)" },
  { param: "deposit", label: "Deposit (25%)" },
  { param: "balance", label: "Balance due" },
  { param: "window", label: "Gallery availability window" },
];

/** Detail layout used by the configurable-fee template before reference formatting. */
export const sectionTwoAgreementDetailFields = legacyAgreementDetailFields.filter(
  (field) => !["total", "deposit", "balance"].includes(field.param),
);

export const agreementFields = [...agreementDetailFields, ...agreementFeeFields];

export const agreementIntro =
  "THIS AGREEMENT is made as of {{effectiveDate}} (the “Effective Date”) between {{clientName}}, represented where applicable by {{signerName}}, {{signerTitle}}, with a mailing address of {{clientAddress}}, email {{clientEmail}}, and phone {{clientPhone}} (the “Client”), and Nhihad Hassan Photography (the “Photographer”).";

export const agreementDisclaimer =
  "This agreement template is provided for convenience and is not legal advice. Consider having it reviewed by a licensed Ontario lawyer before relying on it.";

export const agreementSections: AgreementSection[] = [
  {
    heading: "1. Engagement of Photographer",
    clauses: [
      "1.1 Services. The Client engages the Photographer to provide the photography services described below (the “Services”). The edited photographs and related deliverables selected and delivered by the Photographer are the “Work Product.” “Images” means still or moving photographic material created under this Agreement and captured, recorded, stored, or delivered in any analogue or digital medium.",
      "1.2 Exclusivity. Unless agreed otherwise in writing, the Photographer will be the sole professional photographer responsible for the booked coverage. The Client will help prevent guests or other vendors from materially interfering with the services.",
      "1.3 Scope. Services not described above are outside the booking unless both parties add them in writing, with any additional fee confirmed in advance.",
    ],
  },
  {
    heading: "2. Fees and Payment",
    clauses: [
      "2.1 Fees. The Client will pay the Photographer the fees set out in this Section 2.1 (the “Fees”), including any applicable federal or provincial sales taxes due on the Fees.",
      "2.2 Retainer. The retainer shown above is due when this Agreement is signed and is non-refundable because the Photographer commits time to the Services and may turn down other work. The retainer is credited toward the total Fees payable by the Client. The booking is not confirmed until the signed Agreement and retainer are received.",
      "2.3 Invoice. The Photographer will issue an invoice when the Services are agreed. The Client will pay all outstanding Fees on or before the due dates shown above. A payment made after its due date will incur a late fee of {{lateFeePercent}} per month on the outstanding balance, subject to applicable law. The final invoice may include additional services or reasonable expenses authorized under this Agreement and will state the final amount payable.",
      "2.4 Additional charges. Items billed separately from the base package are: {{additionalCharges}}. No other additional charge will be incurred without the Client's approval, except where this Agreement expressly provides otherwise.",
    ],
  },
  {
    heading: "3. Client Responsibilities",
    clauses: [
      "3.1 Access and consent. The Client is responsible for obtaining access to each location and any permits, permissions, or consents required for the Photographer to provide the services and deliver the Work Product. The Client will ensure attendees know photography is taking place and will obtain any consent the Client is responsible for obtaining, including consent from a parent or guardian for a minor individually photographed at the Client's request.",
      "3.2 Travel and expenses. Travel within {{city}} is included in the quoted fee. Travel beyond {{city}}, parking, permits, admission, accommodation, or another necessary expense may be charged only if disclosed and agreed in writing before it is incurred, except for an on-site expense the Client specifically requests and approves.",
      "3.3 Cooperation. The Client will provide timely and accurate locations, timing, instructions, a reachable contact, and reasonable cooperation. Shot lists and requests are welcomed as guidance, but changing conditions mean no specific image can be guaranteed. The Client is responsible for guest conduct and delays caused by the Client, venue, guests, or other vendors.",
      "3.4 Authorized use. To the extent permitted by law, the Client, on the Client's own behalf, releases claims arising solely from display or promotional use of Images authorized under sections 7 and 8. This does not waive claims arising from unauthorized use, negligence, wilful misconduct, or a right that cannot lawfully be waived.",
    ],
  },
  {
    heading: "4. Photographer Responsibilities",
    clauses: [
      "4.1 Equipment. The Photographer will provide and maintain the equipment reasonably required to perform the services. The Client is not required to supply photography equipment.",
      "4.2 Standard of service. The Photographer will perform the services with reasonable skill and care, professionally, safely, and without unreasonable interference with the Client's activities, in a manner consistent with the portfolio and working style shown to the Client.",
      "4.3 Photography staff. The Photographer may use employees, assistants, second shooters, independent contractors, or a qualified replacement when reasonably necessary. The Photographer remains responsible for their work and will require them to follow reasonable safety, security, venue, and Client directions and to provide Work Product that materially meets the agreed specifications.",
    ],
  },
  {
    heading: "5. Artistic Release",
    clauses: [
      "5.1 Consistency. The Client confirms that they have reviewed the Photographer's portfolio and reasonably expect the Work Product to be consistent with that style. The Photographer will make reasonable efforts to consult with the Client and consider reasonable suggestions, while lighting, weather, location, and other conditions may vary.",
      "5.2 Style and curation. The Client entrusts the Photographer with professional and artistic judgment over posing, composition, image selection, colour, and editing. The Photographer delivers a curated set in their signature style; RAW, rejected, or unedited files are not included.",
      "5.3 Aesthetic disagreement. Disagreement with the Photographer's aesthetic judgment or artistic style is not, by itself, grounds to terminate this Agreement or obtain a refund or reshoot.",
    ],
  },
  {
    heading: "6. Term, Cancellation and Rescheduling",
    clauses: [
      "6.1 Term. This Agreement begins when signed and ends when the parties have completed their obligations, except for terms that are intended to continue after completion.",
      "6.2 Client cancellation. The Client may cancel by written notice. The following cancellation terms apply: {{cancellationPolicy}}",
      "6.3 Rescheduling. The following rescheduling terms apply, subject to the Photographer's availability: {{reschedulePolicy}} If the Photographer cannot reasonably accommodate the new date, the request is treated as a Client cancellation.",
      "6.4 No Refund. The Client acknowledges and agrees that cancellation by the Client will not result in a refund of any fees paid on or before the date of cancellation by the Client.",
      "6.5 Photographer cancellation or replacement. If the Photographer cannot perform, the Photographer may propose a qualified replacement, subject to the Client's reasonable approval. If no approved replacement is available, the Client may choose an available rescheduled date or a refund of the deposit and every other payment for services not provided.",
    ],
  },
  {
    heading: "7. Ownership and Promotional Use",
    clauses: [
      "7.1 Copyright. The Photographer retains copyright and ownership of the Work Product, subject to the limited license granted to the Client below. No copyright is transferred unless the Photographer signs a separate written assignment.",
      "7.2 Portfolio permission. The Client grants the Photographer permission to use the Images for portfolio, website, social media, studio samples, competition entries, marketing, advertising, and self-promotion in any format or medium. The Client may opt out by notifying the Photographer in writing before the shoot and paying the privacy opt-out surcharge of {{privacyOptOutFee}}. Reasonable privacy requests will be honoured, and the Photographer will not sell or license the Client's likeness to an unrelated third party for that party's commercial use without written consent.",
      "7.3 Client materials. The Client gives the Photographer a royalty-free license to use Client-supplied materials, such as a logo, written brief, or reference material, only as reasonably necessary to perform the services or make a promotional use authorized by this Agreement. The Client confirms that they have the right to provide those materials.",
    ],
  },
  {
    heading: "8. Limited License and Delivery",
    clauses: [
      "8.1 Client license. After full payment, the Client receives the following licence: {{licenseType}}. The licence is limited, non-exclusive, perpetual, worldwide, royalty-free, non-transferable, and non-sublicensable. Commercial resale, paid licensing, material alteration, or removal of a copyright notice requires the Photographer's written permission.",
      "8.2 Delivery. Edited, full-resolution Images are delivered through a private online gallery within {{turnaroundBusinessDays}} business days after the shoot, unless otherwise agreed in writing.",
      "8.3 Gallery availability. The gallery remains available for {{galleryWindow}}. The Client is responsible for downloading and backing up the Images before the gallery closes. Restoring an expired gallery will incur a rehosting fee of {{rehostingFee}}.",
      "8.4 Revisions. The included revision allowance is: {{revisionPolicy}}",
      "8.5 Archive. The Photographer will archive the delivered Images for {{archiveWindow}}. Continued storage after that period is not guaranteed.",
    ],
  },
  {
    heading: "9. Unforeseen Events, Indemnity and Limitation of Liability",
    clauses: [
      "9.1 Events beyond control. Neither party is responsible for delay or failure caused by illness, emergency, severe weather, fire, flood, earthquake, strike, pandemic, public-health order, government action, venue closure, transit shutdown, widespread service interruption, or another event beyond reasonable control (a “Force Majeure Event”). The affected obligation is suspended while the event continues, and the parties will make reasonable efforts to reschedule or find another fair solution.",
      "9.2 Extended force majeure. If a Force Majeure Event continues for more than 60 days or rescheduling is not reasonably possible, either party may terminate. The Photographer will return prepaid fees for services not performed, other than the non-refundable deposit, within 15 days after termination, unless applicable law requires otherwise.",
      "9.3 Loss or failure to deliver. If Images are lost, damaged, or cannot be delivered because of equipment or storage failure, the Photographer will provide any recoverable work and refund the amount paid for the affected services. The Photographer is not responsible for a delay or undeliverable Image caused by a technological malfunction, service interruption, delayed or inaccurate Client instruction, attendee interference, venue restriction, or another circumstance beyond reasonable control.",
      "9.4 Indemnity. The Client will indemnify and hold harmless the Photographer and Photography staff from a third-party claim, injury, property damage, or liability arising from the Client's material breach, guest conduct, or a permission, permit, or consent the Client was responsible for obtaining. This does not apply to the extent a claim was caused by the Photographer's negligence or wilful misconduct.",
      "9.5 Limits. The Photographer is not responsible for missed moments, guest behaviour, obstructed views, delays, or conditions outside reasonable control. To the fullest extent permitted by law, neither party is liable for indirect, incidental, special, consequential, or punitive damages, and the Photographer's maximum aggregate liability arising from the services or Work Product is limited to the total fees actually paid by the Client.",
    ],
  },
  {
    heading: "10. General",
    clauses: [
      "10.1 Notices. Booking-related notices must be sent to the Photographer at nhihadhassanphotography@gmail.com and to the Client at {{clientEmail}} or {{clientPhone}}. A notice is effective when sent unless the sender receives a delivery-failure notice. Each party is responsible for keeping their contact information current.",
      "10.2 Privacy. The Client's contact details are used to coordinate the booking, provide the services, process payment, deliver the Images, and maintain required business records. They are not sold and are shared only with service providers as reasonably necessary for those purposes or as required by law.",
      "10.3 Governing law. This Agreement is governed by the laws of the Province of Ontario and the applicable federal laws of Canada. The parties submit to the courts of Ontario.",
      "10.4 Amendments. Any change to this Agreement must be recorded in writing and accepted by both parties.",
      "10.5 Entire agreement. This Agreement and its details are the entire agreement between the Client and the Photographer about the services and replace earlier formal or informal discussions, quotes, and understandings about the same booking.",
      "10.6 Severability and survival. If any provision is found illegal, invalid, or unenforceable, it is severed only to the extent necessary and the remaining provisions continue in effect. Provisions concerning payment, ownership, licenses, privacy, indemnity, and liability survive completion or termination where their nature requires it.",
      "10.7 Electronic signature. This Agreement may be signed electronically and in counterparts. An electronic signature has the same effect as an original signature.",
    ],
  },
];
