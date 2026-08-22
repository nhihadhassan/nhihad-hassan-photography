import "server-only";
import {
  hasGalleryAccessSecret,
  hasGalleryInviteConfig,
  hasGoogleBusinessConfig,
  hasR2Config,
  hasServiceRoleKey,
  hasSupabaseBrowserConfig,
} from "@/lib/env";

export type IntegrationState = "connected" | "partial" | "missing";

export type IntegrationStatus = {
  id: string;
  name: string;
  /** What this actually does for the business, not what it is technically. */
  purpose: string;
  state: IntegrationState;
  /** What is true right now, in plain language. */
  detail: string;
};

const STATE_LABEL: Record<IntegrationState, string> = {
  connected: "Connected",
  partial: "Partly set up",
  missing: "Not connected",
};

export function integrationStateLabel(state: IntegrationState): string {
  return STATE_LABEL[state];
}

/**
 * Plain-language status for each outside service the admin depends on.
 *
 * Deliberately reports only whether something is configured and what stops
 * working if it is not. No key, token, URL or environment variable name is ever
 * returned from here -- this renders on a page, and a status panel is not a
 * place to leak a credential or to expect the owner to recognise a variable
 * name they set up once a year ago.
 */
export function getIntegrationStatuses(): IntegrationStatus[] {
  const database = hasSupabaseBrowserConfig();
  const serviceRole = hasServiceRoleKey();
  const storage = hasR2Config();
  const email = hasGalleryInviteConfig();
  const galleryPasswords = hasGalleryAccessSecret();
  const googleReviews = hasGoogleBusinessConfig();

  return [
    {
      id: "database",
      name: "Database",
      purpose: "Stores every booking, contract, invoice, client and gallery.",
      state: database && serviceRole ? "connected" : database ? "partial" : "missing",
      detail:
        database && serviceRole
          ? "Everything is saving normally."
          : database
            ? "Reading works, but admin writes that need elevated access will fail."
            : "The admin cannot load or save anything until this is connected.",
    },
    {
      id: "storage",
      name: "Photo storage",
      purpose: "Holds the photo and video files behind every gallery.",
      state: storage ? "connected" : "missing",
      detail: storage
        ? "Uploads and downloads are working."
        : "Photos cannot be uploaded or delivered until this is connected.",
    },
    {
      id: "email",
      name: "Email delivery",
      purpose: "Sends gallery invites, contracts, invoices and automated reminders.",
      state: email ? "connected" : "missing",
      detail: email
        ? "Client emails are sending."
        : "Nothing will be emailed to clients. You can still share links by hand.",
    },
    {
      id: "gallery-passwords",
      name: "Gallery passwords",
      purpose: "Keeps password-protected client galleries locked.",
      state: galleryPasswords ? "connected" : "missing",
      detail: galleryPasswords
        ? "Password-protected galleries are working."
        : "Password protection cannot grant access, so protected galleries stay locked to everyone.",
    },
    {
      id: "google-reviews",
      name: "Google reviews",
      purpose: "Pulls your Google Business reviews onto the website.",
      state: googleReviews ? "connected" : "missing",
      detail: googleReviews
        ? "Reviews can be synced from your Google Business profile."
        : "Reviews have to be added by hand. Optional.",
    },
  ];
}
