import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalUrl,
  privatePageMetadata,
  siteUrl,
  withDefaultSocialImages,
} from "../src/lib/seo";

test("canonical URLs are absolute, www-hosted, and free of slash artifacts", () => {
  assert.equal(canonicalUrl("/"), "https://www.nhihadhassan.ca");
  assert.equal(canonicalUrl(""), "https://www.nhihadhassan.ca");
  assert.equal(canonicalUrl("/pricing"), "https://www.nhihadhassan.ca/pricing");
  // Callers should not have to normalise their own input.
  assert.equal(canonicalUrl("pricing"), "https://www.nhihadhassan.ca/pricing");
  assert.equal(canonicalUrl("/pricing/"), "https://www.nhihadhassan.ca/pricing");
  assert.equal(
    canonicalUrl("/portfolio/weddings-couples"),
    "https://www.nhihadhassan.ca/portfolio/weddings-couples",
  );
  assert.ok(!canonicalUrl("/journal").includes("//journal"));
});

test("the canonical host is the one that does not redirect", () => {
  // The apex 307s to www in production; emitting the apex anywhere costs a hop
  // and splits link equity across two hostnames.
  assert.equal(siteUrl, "https://www.nhihadhassan.ca");
});

test("a page given a path canonicalises to that path, not to the homepage", () => {
  const meta = withDefaultSocialImages({ title: "Pricing" }, "/pricing");
  assert.equal(meta.alternates?.canonical, "https://www.nhihadhassan.ca/pricing");
  assert.equal(meta.openGraph?.url, "https://www.nhihadhassan.ca/pricing");
});

test("a page given no path declares no canonical at all", () => {
  // The failure mode to avoid is inheriting someone else's canonical. Absent is
  // correct here; wrong is not.
  const meta = withDefaultSocialImages({ title: "Something" });
  assert.equal(meta.alternates?.canonical, undefined);
  assert.equal(meta.openGraph?.url, undefined);
});

test("social images default in but are never overwritten", () => {
  const withDefaults = withDefaultSocialImages({ title: "A" }, "/a");
  assert.ok(Array.isArray(withDefaults.openGraph?.images));
  assert.equal(withDefaults.twitter?.card, "summary_large_image");

  const custom = withDefaultSocialImages(
    { title: "B", openGraph: { images: [{ url: "/custom.png" }] } },
    "/b",
  );
  assert.deepEqual(custom.openGraph?.images, [{ url: "/custom.png" }]);
});

test("private token pages are noindex and carry no canonical", () => {
  const meta = privatePageMetadata(
    withDefaultSocialImages({ title: "A client gallery" }, "/galleries/some-slug"),
  );
  assert.equal(meta.alternates?.canonical, undefined);
  const robots = meta.robots as { index: boolean; follow: boolean };
  assert.equal(robots.index, false);
  assert.equal(robots.follow, false);
});
