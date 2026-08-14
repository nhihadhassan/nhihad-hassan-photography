import { requireAdmin } from "@/lib/auth";
import { getClientList } from "@/lib/clients";
import { ClientsDataTable } from "@/components/tables/clients-data-table";
import { AddClientInline } from "@/components/add-client-inline";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await requireAdmin();
  const clients = await getClientList();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-admin-ink">Clients</h1>
        <AddClientInline />
      </div>

      <div className="mt-6">
        <ClientsDataTable rows={clients} />
      </div>
    </div>
  );
}
