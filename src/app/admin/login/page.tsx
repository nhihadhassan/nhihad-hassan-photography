import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminUser } from "@/lib/auth";
import { hasSupabaseBrowserConfig } from "@/lib/env";
import { brandConfig } from "@/lib/config";

export default async function AdminLoginPage() {
  const configured = hasSupabaseBrowserConfig();
  const admin = await getAdminUser();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-admin-bg px-4 py-10 text-admin-ink">
      <div className="w-full max-w-md rounded-md border border-admin-ink/10 bg-admin-surface p-8 shadow-[0_24px_80px_-52px_rgba(23,19,15,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-admin-ink text-admin-surface">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <Link href="/" className="text-sm text-admin-ink/55 transition hover:text-admin-ink">
            Public site
          </Link>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Admin login</h1>
        <p className="mt-3 text-sm leading-6 text-admin-ink/62">
          Sign in to manage galleries, inquiries, and settings for {brandConfig.name}.
        </p>
        <div className="mt-6 rounded-md border border-admin-ink/10 bg-admin-bg p-4 text-sm text-admin-ink/64">
          Supabase config: {configured ? "detected" : "waiting for environment variables"}
        </div>
        <AdminLoginForm disabled={!configured} />
      </div>
    </main>
  );
}
