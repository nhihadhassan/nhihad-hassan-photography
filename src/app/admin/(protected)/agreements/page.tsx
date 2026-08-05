import { requireAdmin } from "@/lib/auth";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { getClientList } from "@/lib/clients";
import { getPricing } from "@/lib/pricing";
import { siteUrl } from "@/lib/seo";
import { AgreementAdmin } from "@/components/agreement-admin";
import { ContractsTable, type ContractRow } from "@/components/tables/contracts-table";

export const dynamic = "force-dynamic";

export default async function AdminAgreementsPage() {
  await requireAdmin();

  const [galleries, requests, clients, pricing] = await Promise.all([
    getAdminGalleries(),
    getAdminAgreementRequests(),
    getClientList(),
    getPricing(),
  ]);

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;
  const onboardedClients = clients.filter(
    (client) => client.bookingCount > 0 || client.galleryCount > 0 || client.agreementCount > 0,
  );

  const contractRows: ContractRow[] = requests.map((r) => ({
    id: r.id,
    client: r.client_name ?? r.client_email ?? "Client",
    galleryTitle: r.gallery_title ?? "",
    token: r.token,
    sent_at: r.sent_at,
    viewed_at: r.viewed_at,
    signed_at: r.signed_at,
    revoked_at: r.revoked_at,
    created_at: r.created_at,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-medium text-admin-accent">Contracts</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Contracts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Every sign request and its status at a glance. Send a new one below. To change the contract
          wording itself, use Contract template.
        </p>
      </div>

      <div className="mt-8">
        <ContractsTable rows={contractRows} />
      </div>

      <div className="mt-10 border-t border-admin-line pt-8">
        <h2 className="admin-display text-xl text-admin-ink">Send to sign</h2>
        <div className="mt-4">
          <AgreementAdmin
            galleries={galleries}
            requests={requests}
            clients={onboardedClients}
            pricing={pricing}
            siteOrigin={siteOrigin}
          />
        </div>
      </div>
    </div>
  );
}
