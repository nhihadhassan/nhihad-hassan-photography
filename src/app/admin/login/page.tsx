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
    <main className="grid min-h-[100dvh] place-items-center bg-[#f3f0ea] px-4 py-10 text-[#17130f]">
      <div className="w-full max-w-md rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-8 shadow-[0_24px_80px_-52px_rgba(23,19,15,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#17130f] text-[#fbf8f1]">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <Link href="/" className="text-sm text-[#17130f]/55 transition hover:text-[#17130f]">
            Public site
          </Link>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Admin login</h1>
        <p className="mt-3 text-sm leading-6 text-[#17130f]/62">
          Sign in to manage galleries, inquiries, and settings for {brandConfig.name}.
        </p>
        <div className="mt-6 rounded-md border border-[#17130f]/10 bg-[#f3f0ea] p-4 text-sm text-[#17130f]/64">
          Supabase config: {configured ? "detected" : "waiting for environment variables"}
        </div>
        <AdminLoginForm disabled={!configured} />
      </div>
    </main>
  );
}
