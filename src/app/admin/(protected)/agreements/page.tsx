import { requireAdmin } from "@/lib/auth";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { getClientList } from "@/lib/clients";
import { getPricing } from "@/lib/pricing";
import { siteUrl } from "@/lib/seo";
import { listContractTemplates } from "@/lib/contract-templates";
import { AgreementAdmin, type AgreementCalendarPrefill } from "@/components/agreement-admin";
import { ContractsTable, type ContractRow } from "@/components/tables/contracts-table";

export const dynamic = "force-dynamic";

const TZ = "America/Toronto";

function calendarPrefill(params: Record<string, string | string[] | undefined>): AgreementCalendarPrefill | null {
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const id = value("calendar_event_id");
  const startIso = value("start");
  const endIso = value("end");
  if (!id || !startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return null;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, month: "long", day: "numeric", year: "numeric" }).format(start);
  const startTime = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(start);
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  const coverageTime = minutes % 60 === 0 ? `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}` : `${minutes} minutes`;
  return { calendarEventId: id, title: value("title"), date, startTime, coverageTime, location: value("location") };
}

export default async function AdminAgreementsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;

  const [requests, clients, pricing, contractTemplates] = await Promise.all([
    getAdminAgreementRequests(),
    getClientList(),
    getPricing(),
    listContractTemplates(),
  ]);
  const templates = contractTemplates.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    supportsSecondSigner: t.supportsSecondSigner,
  }));

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
    expires_at: r.expires_at,
    expired_at: r.expired_at,
    created_at: r.created_at,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-medium text-admin-accent">Contracts</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Contracts</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Every sign request and its status at a glance. Send a new one below. To change the contract
          wording itself, use Contract templates.
        </p>
      </div>

      <div className="mt-8">
        <ContractsTable rows={contractRows} />
      </div>

      <div className="mt-10 border-t border-admin-line pt-8">
        <h2 className="admin-display text-xl text-admin-ink">New agreement</h2>
        <div className="mt-4">
          <AgreementAdmin
            requests={requests}
            clients={onboardedClients}
            pricing={pricing}
            siteOrigin={siteOrigin}
            templates={templates}
            prefill={calendarPrefill(params)}
          />
        </div>
      </div>
    </div>
  );
}
