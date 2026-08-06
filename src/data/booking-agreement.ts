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
  "This Photography Services Agreement is between Nhihad Hassan Photography (the \u201cPhotographer\u201d) and the client identified below (the \u201cClient\u201d). It takes effect when signed and governs the photography services, fees, deliverables, and usage rights described below.";

export const agreementDisclaimer =
  "This agreement template is provided for convenience and is not legal advice. Consider having it reviewed by a licensed Ontario lawyer before relying on it.";

export const agreementSections: AgreementSection[] = [
  {
    heading: "1. Engagement of Photographer",
    clauses: [
      "1.1 Services. The Client engages the Photographer to provide the photography services described in the Agreement details. The edited photographs selected and delivered by the Photographer are the \u201cImages.\u201d",
      "1.2 Exclusivity. Unless agreed otherwise in writing, the Photographer will be the sole professional photographer responsible for the booked coverage. The Client will help prevent guests or other vendors from materially interfering with the services.",
    ],
  },
  {
    heading: "2. Fees and Payment",
    clauses: [
      "2.1 Fees. The Client will pay the total fee shown in the Agreement details for the selected services and package.",
      "2.2 Deposit. A 25% deposit paid by Interac e-Transfer reserves the shoot date. The deposit is non-refundable because the Photographer sets aside the time and may decline other work for that date. The booking is not confirmed until the deposit is received.",
      "2.3 Balance. The remaining balance is due on or before the shoot day. The Photographer may pause delivery of the Images until the account is paid in full.",
    ],
  },
  {
    heading: "3. Client Responsibilities",
    clauses: [
      "3.1 Access and consent. The Client is responsible for obtaining access to each location and any permits, permissions, or consents required for the Photographer to provide the services.",
      "3.2 Travel and expenses. Travel within the Greater Toronto Area is included in the quoted fee. Any fee for travel beyond the Greater Toronto Area or other agreed expenses will be confirmed in writing before the booking is finalized.",
      "3.3 Cooperation. The Client will provide timely information and reasonable cooperation. Shot lists and requests are welcomed as guidance, but changing conditions mean that no specific image can be guaranteed.",
    ],
  },
  {
    heading: "4. Photographer Responsibilities",
    clauses: [
      "4.1 Equipment. The Photographer will provide and maintain the equipment reasonably required to perform the services.",
      "4.2 Standard of service. The Photographer will perform the services professionally, safely, and in a manner consistent with the portfolio and working style shown to the Client.",
      "4.3 Assistants and replacements. The Photographer may use an assistant or qualified replacement when reasonably necessary while remaining responsible for the services under this Agreement.",
    ],
  },
  {
    heading: "5. Artistic Release",
    clauses: [
      "5.1 Consistency. The Photographer will make reasonable efforts to produce Images consistent with the Photographer's current portfolio, while the Client acknowledges that lighting, weather, location, and other conditions vary.",
      "5.2 Style and curation. The Client entrusts the Photographer with professional judgment over posing, composition, image selection, colour, and editing. The Photographer delivers a curated set in their signature style; RAW, rejected, or unedited files are not included.",
    ],
  },
  {
    heading: "6. Term, Cancellation and Rescheduling",
    clauses: [
      "6.1 Term. This Agreement begins when signed and ends when the parties have completed their obligations, except for terms that are intended to continue after completion.",
      "6.2 Client cancellation. If the Client cancels, the deposit is forfeited. If cancellation occurs within 48 hours of the shoot, the full remaining balance is payable because the reserved time may not be replaceable.",
      "6.3 Rescheduling. The Client may request one reschedule with at least 7 days' notice, subject to the Photographer's availability. Further changes may require a new deposit or updated fee agreed in writing.",
      "6.4 Photographer cancellation. If the Photographer cannot perform the services, the Client may choose an available rescheduled date or a refund of the deposit and any other payment for services not provided. The Photographer may propose a qualified replacement, subject to the Client's approval.",
    ],
  },
  {
    heading: "7. Ownership and Promotional Use",
    clauses: [
      "7.1 Copyright. The Photographer retains copyright and ownership of the Images, subject to the limited license granted to the Client below.",
      "7.2 Portfolio permission. The Client grants the Photographer permission to use the Images for portfolio, website, social media, studio samples, and self-promotion. The Client may opt out by notifying the Photographer in writing before the shoot or before an Image is published, and reasonable privacy requests will be honoured.",
    ],
  },
  {
    heading: "8. Limited License and Delivery",
    clauses: [
      "8.1 Personal-use license. After full payment, the Client may download, print, share, and display the delivered Images for personal use. Commercial resale, paid licensing, material alteration, or use by a business requires the Photographer's written permission.",
      "8.2 Delivery. Edited, full-resolution Images are delivered through a private online gallery. Typical turnaround is about two weeks for portraits and lifestyle sessions, two to three weeks for events, and up to four weeks for nightlife coverage, unless otherwise agreed in writing.",
      "8.3 Gallery availability. The gallery remains available for the window shown in the Agreement details. The Client is responsible for downloading and backing up the Images before the gallery closes. Restoring an expired gallery may incur a fee disclosed in advance.",
    ],
  },
  {
    heading: "9. Unforeseen Events and Limitation of Liability",
    clauses: [
      "9.1 Events beyond control. Neither party is responsible for delay or failure caused by events beyond reasonable control, including severe weather, venue restrictions, illness, emergency, government action, or widespread service interruption. The parties will make reasonable efforts to reschedule or find another fair solution.",
      "9.2 Loss or failure to deliver. If Images are lost, damaged, or cannot be delivered because of equipment or storage failure, the Photographer will provide any recoverable work and refund the amount paid for the affected services, up to the total amount paid under this Agreement.",
      "9.3 Limits. The Photographer is not responsible for missed moments, guest behaviour, obstructed views, delays, or conditions outside reasonable control. To the fullest extent permitted by law, the Photographer's total liability under this Agreement is limited to the total amount the Client paid.",
    ],
  },
  {
    heading: "10. General",
    clauses: [
      "10.1 Notices. Booking-related notices may be sent using the email addresses shown in the Agreement details. Each party is responsible for keeping their contact information current.",
      "10.2 Privacy. The Client's contact details are used to coordinate the booking, provide the services, deliver the Images, and maintain required business records. They are not sold to third parties.",
      "10.3 Governing law. This Agreement is governed by the laws of the Province of Ontario and the applicable laws of Canada.",
      "10.4 Amendments. Any change to this Agreement must be recorded in writing and accepted by both parties.",
      "10.5 Entire agreement. This Agreement and its details are the entire agreement between the Client and the Photographer about the services and replace earlier discussions about the same booking.",
      "10.6 Severability and survival. If any provision is found unenforceable, the remaining provisions continue in effect. Provisions concerning payment, ownership, licenses, privacy, and liability survive completion or termination where their nature requires it.",
    ],
  },
];
