"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_HINT_COOKIE, ADMIN_HINT_MAX_AGE } from "@/lib/auth-hint";

/** Set or clear the non-secret public-site hint cookie. See lib/auth-hint.ts. */
async function setAdminHint(present: boolean) {
  const store = await cookies();
  store.set({
    name: ADMIN_HINT_COOKIE,
    value: present ? "1" : "",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: present ? ADMIN_HINT_MAX_AGE : 0,
  });
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Partial<Record<"email" | "password", string[]>>;
};

export async function loginAdmin(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check your login details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "error",
      message: "Supabase is not configured yet. Add the environment variables first.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return {
      status: "error",
      message: "The email or password was not accepted.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    await setAdminHint(false);
    return {
      status: "error",
      message: "This user is not marked as an admin in Supabase.",
    };
  }

  await setAdminHint(true);

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await setAdminHint(false);
  redirect("/admin/login");
}

