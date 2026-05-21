"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAdmin, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {
  status: "idle",
  message: "",
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-[#8a2f24]">{errors[0]}</p>;
}

export function AdminLoginForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          disabled={disabled || pending}
          className="min-h-11 rounded-md border border-[#17130f]/10 bg-white/70 px-3 text-sm outline-none transition focus:border-[#b98257] disabled:opacity-55"
          placeholder="admin@example.com"
        />
        <FieldError errors={state.fieldErrors?.email} />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={disabled || pending}
          className="min-h-11 rounded-md border border-[#17130f]/10 bg-white/70 px-3 text-sm outline-none transition focus:border-[#b98257] disabled:opacity-55"
          placeholder="Your Supabase password"
        />
        <FieldError errors={state.fieldErrors?.password} />
      </label>
      {state.message ? (
        <p className="rounded-md bg-[#8a2f24]/10 px-3 py-2 text-sm text-[#7a2e25]">{state.message}</p>
      ) : null}
      <button
        disabled={disabled || pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#17130f] px-4 text-sm font-medium text-[#fbf8f1] transition hover:bg-[#2b241f] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <LogIn className="size-4" aria-hidden="true" />
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}

