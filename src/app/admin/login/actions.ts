"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    return {
      status: "error",
      message: "This user is not marked as an admin in Supabase.",
    };
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

