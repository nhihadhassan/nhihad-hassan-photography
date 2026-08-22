/**
 * The plain-language name for what a gallery's existing flags already mean.
 *
 * This is a read-only reading of `is_published`, `is_public`, whether a
 * password is set, and `expires_at`. It stores nothing, changes nothing, and
 * deliberately introduces no new column: the database already enforces
 * visibility through row-level security on exactly these fields, and adding a
 * second source of truth is how a private gallery eventually becomes a public
 * one by accident.
 *
 * Plain module so the galleries grid, a client component, can use it.
 */

export type GalleryVisibility = "draft" | "public" | "unlisted" | "password" | "expired";

export type GalleryVisibilityInput = {
  isPublished: boolean;
  isPublic: boolean;
  hasPassword: boolean;
  isArchived?: boolean;
  expiresAt?: string | null;
  now?: Date;
};

export type GalleryVisibilityLabel = {
  visibility: GalleryVisibility;
  label: string;
  /** Who can actually open this right now. */
  detail: string;
  tone: "positive" | "waiting" | "neutral" | "danger";
};

export function galleryVisibility(input: GalleryVisibilityInput): GalleryVisibilityLabel {
  const now = input.now ?? new Date();

  // Order matters, and it is the same order the RLS policy applies: anything
  // unpublished or expired is unreachable regardless of the other flags, so
  // those are answered first. A gallery is never labelled Public unless it is
  // genuinely published, genuinely listed, and genuinely unlocked.
  if (!input.isPublished || input.isArchived) {
    return {
      visibility: "draft",
      label: "Draft",
      detail: "Only you can see this. It is not delivered yet.",
      tone: "neutral",
    };
  }

  if (input.expiresAt && new Date(input.expiresAt).getTime() <= now.getTime()) {
    return {
      visibility: "expired",
      label: "Expired",
      detail: "The link has expired, so nobody can open it.",
      tone: "danger",
    };
  }

  if (input.hasPassword) {
    return {
      visibility: "password",
      label: "Password protected",
      detail: "Anyone with the link needs the password to open it.",
      tone: "waiting",
    };
  }

  if (input.isPublic) {
    return {
      visibility: "public",
      label: "Public",
      detail: "Listed on your public galleries page and open to anyone.",
      tone: "positive",
    };
  }

  return {
    visibility: "unlisted",
    label: "Unlisted",
    detail: "Not listed anywhere. Anyone with the link can open it.",
    tone: "neutral",
  };
}
