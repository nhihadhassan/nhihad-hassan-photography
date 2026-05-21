import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin workspace for Nhihad Hassan Photography.",
};

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return <AdminShell adminEmail={admin.email}>{children}</AdminShell>;
}
