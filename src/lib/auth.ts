import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string | null;
};

/**
 * The admin decision itself, as a pure function of what Supabase returned, so
 * the rule is testable without standing up cookies or a network client.
 *
 * Every failure mode collapses to null: no session, a session lookup error, a
 * missing or errored profile row, or a profile whose role is anything other
 * than "admin". There is deliberately no branch that grants access on error.
 */
export function resolveAdminUser(input: {
  user: { id: string; email?: string | null } | null;
  userError: unknown;
  profile: { role?: string | null } | null;
  profileError: unknown;
}): AdminUser | null {
  if (input.userError || !input.user) return null;
  if (input.profileError || input.profile?.role !== "admin") return null;
  return { id: input.user.id, email: input.user.email ?? null };
}

/**
 * The signed-in admin for this request, or null.
 *
 * Cached per request: `requireAdmin`/`getAdminUser` is called from over two
 * hundred places (layout, page, nested server components, server actions), and
 * without memoisation a single admin page issued that many `auth.getUser()`
 * round-trips plus that many `profiles` lookups. Now it is one of each.
 *
 * Deliberately unchanged: any error, a missing user, or a non-admin profile all
 * return null. This helper never widens access.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return resolveAdminUser({ user, userError, profile, profileError });
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
