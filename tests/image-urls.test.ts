import test from "node:test";
import assert from "node:assert/strict";
import { isSignedImageUrl, shouldSkipOptimization } from "../src/lib/image-urls";

const signed =
  "https://bucket.abc123.r2.cloudflarestorage.com/portfolio/web/x.webp" +
  "?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=deadbeef&X-Amz-Expires=604800";

test("presigned R2 URLs skip the optimizer", () => {
  // Their signature changes every render, so optimizing them would miss the
  // cache and re-encode the original every single time.
  assert.equal(isSignedImageUrl(signed), true);
  assert.equal(shouldSkipOptimization(signed), true);
});

test("stable URLs are optimized", () => {
  assert.equal(shouldSkipOptimization("/logo-lockup.png"), false);
  assert.equal(shouldSkipOptimization("https://media.nhihadhassan.ca/portfolio/web/x.webp"), false);
  assert.equal(shouldSkipOptimization("https://images-pw.pixieset.com/a/b.jpg"), false);
  // A public R2 base URL has no signature, so it optimizes.
  assert.equal(
    shouldSkipOptimization("https://pub-abc.r2.dev/portfolio/web/x.webp"),
    false,
  );
});

test("absent URLs are treated as nothing to optimize", () => {
  assert.equal(shouldSkipOptimization(null), false);
  assert.equal(shouldSkipOptimization(undefined), false);
  assert.equal(shouldSkipOptimization(""), false);
});
