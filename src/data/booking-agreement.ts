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
export const agreementIntro =
  "This Photography Services Agreement is between Nhihad Hassan Photography (the “Photographer”) and the client identified below (the “Client”). It takes effect when signed and governs the photography services, fees, deliverables, and usage rights described below.";

export const agreementDisclaimer =
  "This agreement template is provided for convenience and is not legal advice. Consider having it reviewed by a licensed Ontario lawyer before relying on it.";

export const agreementSections: AgreementSection[] = [
  {
    heading: "1. Engagement of Photographer",
    clauses: [
      "1.1 Services. The Client engages the Photographer to provide the photography services described in the Agreement details. The edited photographs and related deliverables selected and delivered by the Photographer are the “Work Product.” “Images” means still or moving photographic material created under this Agreement and captured, recorded, stored, or delivered in any analogue or digital medium.",
      "1.2 Exclusivity. Unless agreed otherwise in writing, the Photographer will be the sole professional photographer responsible for the booked coverage. The Client will help prevent guests or other vendors from materially interfering with the services.",
      "1.3 Scope. Services not shown in the Agreement details are outside the booking unless both parties add them in writing, with any additional fee confirmed in advance.",
    ],
  },
  {
    heading: "2. Fees and Payment",
    clauses: [
      "2.1 Fees. The Client will pay the total fee shown in the Agreement details for the selected services and package. Applicable taxes are additional only where required by law and identified on the invoice. Any additional hourly, overtime, travel, or other pricing must be agreed in writing before it is charged.",
      "2.2 Deposit. A 25% deposit paid by Interac e-Transfer reserves the shoot date. The deposit is non-refundable because the Photographer sets aside the time and may decline other work for that date. It is credited toward the total fee, and the booking is not confirmed until the signed Agreement and deposit are received.",
      "2.3 Balance. The remaining balance is due on or before the shoot day unless another final due date is shown in the Agreement details or invoice. The Photographer may pause delivery of the Work Product until the account is paid in full.",
      "2.4 Invoice and late payment. The Photographer may issue an invoice when the services are agreed. The Client will pay each amount by its stated due date. Overdue amounts may accrue interest only at the lawful rate stated on the invoice or otherwise agreed in writing; no unstated late fee will be imposed.",
      "2.5 Final amount. A final invoice may include only additional services or reasonable expenses authorized under this Agreement. If the final total differs from an earlier estimate, each authorized item and amount will be shown on the invoice.",
    ],
  },
  {
    heading: "3. Client Responsibilities",
    clauses: [
      "3.1 Access and consent. The Client is responsible for obtaining access to each location and any permits, permissions, or consents required for the Photographer to provide the services and deliver the Work Product. The Client will ensure attendees know photography is taking place and will obtain any consent the Client is responsible for obtaining, including consent from a parent or guardian for a minor individually photographed at the Client's request.",
      "3.2 Travel and expenses. Travel within the Greater Toronto Area is included in the quoted fee. Travel beyond the Greater Toronto Area, parking, permits, admission, accommodation, or another necessary expense may be charged only if disclosed and agreed in writing before it is incurred, except for an on-site expense the Client specifically requests and approves.",
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
      "6.2 Client cancellation. The Client may cancel by written notice. Amounts already paid, including the deposit, are non-refundable. If cancellation occurs within 48 hours of the shoot, the full remaining balance is payable because the reserved time may not be replaceable, unless the parties agree otherwise in writing.",
      "6.3 Rescheduling. The Client may request one reschedule with at least 7 days' written notice, subject to the Photographer's availability. If the Photographer cannot reasonably accommodate the new date, the request is treated as a Client cancellation. Further changes may require a new deposit or updated fee agreed in writing.",
      "6.4 Photographer cancellation or replacement. If the Photographer cannot perform, the Photographer may propose a qualified replacement, subject to the Client's reasonable approval. If no approved replacement is available, the Client may choose an available rescheduled date or a refund of the deposit and every other payment for services not provided.",
    ],
  },
  {
    heading: "7. Ownership and Promotional Use",
    clauses: [
      "7.1 Copyright. The Photographer retains copyright and ownership of the Work Product, subject to the limited license granted to the Client below. No copyright is transferred unless the Photographer signs a separate written assignment.",
      "7.2 Portfolio permission. The Client grants the Photographer permission to use the Images for portfolio, website, social media, studio samples, competition entries, marketing, advertising, and self-promotion in any format or medium. The Client may opt out by notifying the Photographer in writing before the shoot or before an Image is first published. Reasonable privacy requests will be honoured, and the Photographer will not sell or license the Client's likeness to an unrelated third party for that party's commercial use without written consent.",
      "7.3 Client materials. The Client gives the Photographer a royalty-free license to use Client-supplied materials, such as a logo, written brief, or reference material, only as reasonably necessary to perform the services or make a promotional use authorized by this Agreement. The Client confirms that they have the right to provide those materials.",
    ],
  },
  {
    heading: "8. Limited License and Delivery",
    clauses: [
      "8.1 Personal-use license. After full payment, the Client receives a limited, non-exclusive, perpetual, worldwide, royalty-free, non-transferable, and non-sublicensable license to download, print, share, and display the delivered Images for personal use, including personal social media, albums, gifts, non-commercial display, and personal communications. Commercial resale, paid licensing, material alteration, removal of a copyright notice, or use by a business requires the Photographer's written permission, except for ordinary cropping required by a social platform.",
      "8.2 Delivery. Edited, full-resolution Images are delivered through a private online gallery. Typical turnaround is about two weeks for portraits and lifestyle sessions, two to three weeks for events, and up to four weeks for nightlife coverage, unless otherwise agreed in writing.",
      "8.3 Gallery availability. The gallery remains available for the window shown in the Agreement details. The Client is responsible for downloading and backing up the Images before the gallery closes. Restoring an expired gallery may incur a fee disclosed in advance.",
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
      "10.1 Notices. Booking-related notices must be sent using the email addresses shown in the Agreement details and are effective when sent unless the sender receives a delivery-failure notice. Each party is responsible for keeping their contact information current.",
      "10.2 Privacy. The Client's contact details are used to coordinate the booking, provide the services, process payment, deliver the Images, and maintain required business records. They are not sold and are shared only with service providers as reasonably necessary for those purposes or as required by law.",
      "10.3 Governing law. This Agreement is governed by the laws of the Province of Ontario and the applicable federal laws of Canada. The parties submit to the courts of Ontario.",
      "10.4 Amendments. Any change to this Agreement must be recorded in writing and accepted by both parties.",
      "10.5 Entire agreement. This Agreement and its details are the entire agreement between the Client and the Photographer about the services and replace earlier formal or informal discussions, quotes, and understandings about the same booking.",
      "10.6 Severability and survival. If any provision is found illegal, invalid, or unenforceable, it is severed only to the extent necessary and the remaining provisions continue in effect. Provisions concerning payment, ownership, licenses, privacy, indemnity, and liability survive completion or termination where their nature requires it.",
      "10.7 Electronic signature. This Agreement may be signed electronically and in counterparts. An electronic signature has the same effect as an original signature.",
    ],
  },
];
