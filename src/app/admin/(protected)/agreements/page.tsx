import { PenLine } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { siteUrl } from "@/lib/seo";
import { AgreementAdmin } from "@/components/agreement-admin";

export const dynamic = "force-dynamic";

export default async function AdminAgreementsPage() {
  await requireAdmin();

  const [galleries, requests] = await Promise.all([
    getAdminGalleries(),
    getAdminAgreementRequests(),
  ]);

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <PenLine className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Send to sign</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sign requests</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Send a client a link to review and sign your booking agreement online. Signed copies are
            stored against the client and gallery. To change the contract wording itself, use{" "}
            <strong>Contract template</strong>.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AgreementAdmin galleries={galleries} requests={requests} siteOrigin={siteOrigin} />
      </div>
    </div>
  );
}
