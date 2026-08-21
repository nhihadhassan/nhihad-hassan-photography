export const brandConfig = {
  name: "Nhihad Hassan Photography",
  /** The person, distinct from `name` (the business), for contexts like a signature block. */
  ownerName: "Nhihad Hassan",
  shortName: "NHP",
  tagline: "Wedding, couples, portrait, and event photography based in Toronto.",
  /**
   * TRANSACTIONAL address. The verified inbox that money and paperwork route
   * through: Interac e-Transfer instructions, invoices, receipts, agreements,
   * and the reply-to on client email. Overridable per-install via
   * site_settings.contact_email. Do not use this for general "get in touch"
   * links -- see publicContactEmail.
   */
  contactEmail: "nhihadhassanphotography@gmail.com",
  /**
   * PUBLIC DISPLAY address. What a visitor or client is shown when the intent
   * is simply "contact the business": the Contact page, the footer, structured
   * data, and the help links on client-facing pages. Kept separate from
   * contactEmail so the branded address can front the business without moving
   * payments off the verified inbox.
   */
  publicContactEmail: "hello@nhihadhassan.ca",
  /** Public display phone number. */
  publicContactPhone: "647-745-8899",
  instagram: [
    {
      label: "@nhihad.h",
      href: "https://www.instagram.com/nhihad.h/",
    },
    {
      label: "@nhihad_photography",
      href: "https://www.instagram.com/nhihad_photography/",
    },
  ],
  copyrightYear: 2026,
} as const;

