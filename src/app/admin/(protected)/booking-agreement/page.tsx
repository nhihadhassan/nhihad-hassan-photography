import { FileText } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getBookingAgreement } from "@/lib/booking-agreement";
import { AgreementContentEditor } from "@/components/agreement-content-editor";

export const dynamic = "force-dynamic";

export default async function AdminBookingAgreementPage() {
  await requireAdmin();
  const content = await getBookingAgreement();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <FileText className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Contract template</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Contract wording</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            This is the master wording of your booking agreement, the same for every client. Edit it
            once here. To send it to a specific client to sign, use <strong>Send to sign</strong>.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AgreementContentEditor content={content} />
      </div>
    </div>
  );
}
