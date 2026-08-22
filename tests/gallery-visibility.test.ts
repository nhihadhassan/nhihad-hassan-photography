import test from "node:test";
import assert from "node:assert/strict";
import { galleryVisibility, type GalleryVisibilityInput } from "../src/lib/gallery-visibility";

const NOW = new Date("2026-08-20T12:00:00.000Z");

const label = (over: Partial<GalleryVisibilityInput>) =>
  galleryVisibility({
    isPublished: true,
    isPublic: false,
    hasPassword: false,
    now: NOW,
    ...over,
  });

test("only a published, listed, unlocked gallery is ever called Public", () => {
  assert.equal(label({ isPublic: true }).visibility, "public");

  // Each of these must not read as Public.
  assert.notEqual(label({ isPublic: true, isPublished: false }).visibility, "public");
  assert.notEqual(label({ isPublic: true, hasPassword: true }).visibility, "public");
  assert.notEqual(label({ isPublic: true, isArchived: true }).visibility, "public");
  assert.notEqual(
    label({ isPublic: true, expiresAt: "2026-08-01T00:00:00.000Z" }).visibility,
    "public",
  );
});

test("a password-protected gallery says so even when it is marked public", () => {
  // This is the dangerous combination: is_public true plus a password. Calling
  // it Public would misrepresent a locked gallery as open.
  const result = label({ isPublic: true, hasPassword: true });
  assert.equal(result.visibility, "password");
  assert.match(result.detail, /password/i);
});

test("an unpublished gallery is a draft whatever else is set", () => {
  assert.equal(label({ isPublished: false }).visibility, "draft");
  assert.equal(label({ isPublished: false, isPublic: true, hasPassword: true }).visibility, "draft");
  assert.match(label({ isPublished: false }).detail, /Only you/);
});

test("an archived gallery is not delivered", () => {
  assert.equal(label({ isArchived: true, isPublic: true }).visibility, "draft");
});

test("expiry is respected, and a future expiry is not expiry", () => {
  assert.equal(label({ expiresAt: "2026-08-01T00:00:00.000Z" }).visibility, "expired");
  assert.equal(label({ expiresAt: "2026-12-01T00:00:00.000Z" }).visibility, "unlisted");
  assert.equal(label({ expiresAt: null }).visibility, "unlisted");
});

test("a published, unlisted, unlocked gallery is link-only", () => {
  const result = label({});
  assert.equal(result.visibility, "unlisted");
  assert.match(result.detail, /anyone with the link/i);
});
