import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin-nav";
import { AdminCommandProvider } from "@/components/admin-command-provider";
import { getCommandIndex } from "@/lib/command-index";

export async function AdminShell({
  children,
  adminEmail,
}: {
  children: ReactNode;
  adminEmail: string | null;
}) {
  const records = await getCommandIndex().catch(() => []);
  return (
    <AdminCommandProvider records={records}>
      <div className="min-h-[100dvh] bg-admin-bg text-admin-ink">
        <AdminNav adminEmail={adminEmail} />
        <div className="md:pl-16 lg:pl-64">
          <main className="px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
        </div>
      </div>
    </AdminCommandProvider>
  );
}
