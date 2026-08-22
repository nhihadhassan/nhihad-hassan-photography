import test from "node:test";
import assert from "node:assert/strict";
import { resolveAdminUser } from "../src/lib/auth";
import { ADMIN_HINT_COOKIE, hasAdminHint } from "../src/lib/auth-hint";

const user = { id: "u1", email: "owner@example.com" };

test("grants only an authenticated user whose profile role is admin", () => {
  assert.deepEqual(
    resolveAdminUser({ user, userError: null, profile: { role: "admin" }, profileError: null }),
    { id: "u1", email: "owner@example.com" },
  );
});

test("denies every failure mode rather than widening access", () => {
  const deny = (over: Partial<Parameters<typeof resolveAdminUser>[0]>) =>
    resolveAdminUser({
      user,
      userError: null,
      profile: { role: "admin" },
      profileError: null,
      ...over,
    });

  assert.equal(deny({ user: null }), null, "no session");
  assert.equal(deny({ userError: new Error("network") }), null, "session lookup failed");
  assert.equal(deny({ profile: null }), null, "no profile row");
  assert.equal(deny({ profileError: new Error("rls") }), null, "profile lookup failed");
  assert.equal(deny({ profile: { role: "client" } }), null, "non-admin role");
  assert.equal(deny({ profile: { role: null } }), null, "null role");
});

test("admin hint cookie is detected only when actually present", () => {
  assert.equal(hasAdminHint(`${ADMIN_HINT_COOKIE}=1`), true);
  assert.equal(hasAdminHint(`other=x; ${ADMIN_HINT_COOKIE}=1; more=y`), true);
  assert.equal(hasAdminHint(""), false);
  assert.equal(hasAdminHint("other=1"), false);
  // A cleared cookie must not read as present.
  assert.equal(hasAdminHint(`${ADMIN_HINT_COOKIE}=`), false);
  // Must not match a different cookie that merely ends with the same name.
  assert.equal(hasAdminHint(`not_${ADMIN_HINT_COOKIE}=1`), false);
});
