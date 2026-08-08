import { requireAdmin } from "@/lib/auth";
import { getClientList } from "@/lib/clients";
import { InvoiceStarter } from "@/components/invoice-starter";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  await requireAdmin();
  const clients = await getClientList();
  return <InvoiceStarter clients={clients} />;
}
