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
  "This agreement is between Nhihad Hassan Photography (the photographer) and the client named below. It sets out what is included, how booking and payment work, and how images are delivered and used. Please read it before sending your deposit, as sending the deposit confirms your acceptance of these terms.";

export const agreementDisclaimer =
  "This is a standard template provided for convenience and is not legal advice. Consider having it reviewed by a licensed Ontario lawyer before relying on it.";

export const agreementSections: AgreementSection[] = [
  {
    heading: "1. Booking and deposit",
    clauses: [
      "A 25% deposit holds your date and is sent by Interac e-Transfer. It is non-refundable, as it reserves the photographer's time and turns away other bookings for that date.",
      "Your date is only confirmed once the deposit has been received. Until then, the date remains open to other clients.",
      "The remaining balance is due on or before the shoot day. The photographer may pause delivery of final images until the balance is paid in full.",
    ],
  },
  {
    heading: "2. Rescheduling and cancellation",
    clauses: [
      "A booking can be rescheduled once with 7 or more days notice, subject to the photographer's availability for the new date.",
      "If the client cancels, the deposit is forfeited. For cancellations made within 48 hours of the shoot, the full balance remains payable to cover the reserved time.",
      "If the photographer must cancel for any reason, the client receives a full refund of the deposit and any payments made, or the option to reschedule, at the client's choice.",
    ],
  },
  {
    heading: "3. Travel",
    clauses: [
      "Coverage within the Greater Toronto Area is included in the quoted fee.",
      "Travel beyond the Greater Toronto Area may add a small fee, which will be confirmed in writing before the booking is finalized.",
    ],
  },
  {
    heading: "4. Delivery and galleries",
    clauses: [
      "Edited images are delivered through a private online gallery. Typical turnaround is about two weeks for portraits and lifestyle, two to three weeks for events, and up to four weeks for nightlife. If you need images faster, ask when you book.",
      "Final images are provided as full-resolution files, available to download as the whole gallery or as hand-picked singles.",
      "The gallery link stays live for the window agreed at booking. The client is responsible for downloading and backing up their files before that window closes. Re-activating an expired gallery may incur a fee.",
    ],
  },
  {
    heading: "5. Editing and creative control",
    clauses: [
      "The photographer delivers a curated set of edited images in their signature style. The number of images reflects the package booked.",
      "RAW or unedited files are not delivered. Editing and image-selection choices are made at the photographer's professional discretion and are final.",
    ],
  },
  {
    heading: "6. Copyright and usage rights",
    clauses: [
      "The photographer retains the copyright to all images created under this agreement.",
      "The client receives a personal-use release to print, share, and display the delivered images for personal purposes. Commercial resale or paid licensing of the images requires the photographer's written permission.",
    ],
  },
  {
    heading: "7. Model and likeness release",
    clauses: [
      "By default, the client grants the photographer permission to use the images for portfolio, website, and social media promotion.",
      "The client may opt out of this by notifying the photographer in writing before the shoot or before an image is published. The photographer will honor reasonable privacy requests.",
    ],
  },
  {
    heading: "8. Client responsibilities",
    clauses: [
      "The client is responsible for arranging access to the location and any permits or permissions required to photograph there.",
      "Shot lists and requests are welcomed as a guide. They are not a guarantee that every specific image can be captured, as conditions on the day vary.",
    ],
  },
  {
    heading: "9. Limitation of liability and unforeseen events",
    clauses: [
      "The photographer's total liability under this agreement is limited to the total amount the client has paid.",
      "In the event of illness, equipment failure, or circumstances beyond the photographer's control, the photographer will make best efforts to reschedule the shoot or arrange a qualified replacement. If neither is possible, the client receives a refund for any undelivered work.",
      "The photographer is not liable for missed moments, guest behavior, or conditions outside their reasonable control.",
    ],
  },
  {
    heading: "10. Privacy",
    clauses: [
      "The client's contact details are used only to coordinate the booking and deliver the images. They are never sold or shared with third parties.",
    ],
  },
  {
    heading: "11. Governing law",
    clauses: [
      "This agreement is governed by the laws of the Province of Ontario, Canada.",
    ],
  },
  {
    heading: "12. Entire agreement",
    clauses: [
      "This document is the entire agreement between the client and the photographer. Any changes must be made in writing and agreed by both parties.",
    ],
  },
];
