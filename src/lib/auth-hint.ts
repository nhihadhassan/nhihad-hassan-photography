/**
 * Name of a deliberately non-secret, non-httpOnly cookie that means "this
 * browser signed in to the admin at some point".
 *
 * It is a hint only. It carries no identity, grants nothing, and is never
 * trusted by any protected route -- every real check still runs
 * `getAdminUser()` on the server. Its whole job is to let the public site skip
 * the `/api/admin/me` probe for ordinary visitors, who are the overwhelming
 * majority and can never be admins. A forged value costs an attacker one
 * request that answers `{ isAdmin: false }`.
 */
export const ADMIN_HINT_COOKIE = "nhp_admin";

/** ~1 year. Re-armed on every admin page load by the proxy. */
export const ADMIN_HINT_MAX_AGE = 60 * 60 * 24 * 365;

/** True when the hint cookie is present in a `document.cookie` string. */
export function hasAdminHint(cookieString: string): boolean {
  return cookieString
    .split(";")
    .some((part) => part.trim().startsWith(`${ADMIN_HINT_COOKIE}=1`));
}
