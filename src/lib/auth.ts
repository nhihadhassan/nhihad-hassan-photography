import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string | null;
};

export async function getAdminUser(): Promise<AdminUser | null> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

