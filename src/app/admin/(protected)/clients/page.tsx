import { requireAdmin } from "@/lib/auth";
import { getClientList } from "@/lib/clients";
import { ClientsDataTable } from "@/components/tables/clients-data-table";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await requireAdmin();
  const clients = await getClientList();

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-sm font-medium text-admin-accent">Clients</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Clients</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Everyone who has inquired, booked, or received a gallery, merged into one profile each.
          Open a client to see their full history.
        </p>
      </div>

      <div className="mt-8">
        <ClientsDataTable rows={clients} />
      </div>
    </div>
  );
}
