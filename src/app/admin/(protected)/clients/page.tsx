import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getClientList } from "@/lib/clients";
import { ClientsTable } from "@/components/clients-table";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await requireAdmin();
  const clients = await getClientList();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <Users className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Clients</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Everyone who has inquired, booked, or received a gallery, merged into one profile each.
            Open a client to see their full history.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ClientsTable clients={clients} />
      </div>
    </div>
  );
}
