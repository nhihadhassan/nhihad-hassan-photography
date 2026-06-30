import { ClipboardList } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminQuestionnaires } from "@/lib/questionnaires";
import { getAdminBookings } from "@/lib/bookings";
import { siteUrl } from "@/lib/seo";
import { QuestionnaireAdmin } from "@/components/questionnaire-admin";
import { formatCompactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminQuestionnairesPage() {
  await requireAdmin();
  const [questionnaires, bookings] = await Promise.all([
    getAdminQuestionnaires(),
    getAdminBookings(),
  ]);
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;

  const bookingOptions = bookings.map((b) => ({
    id: b.id,
    label: [b.client_name ?? b.shoot_type ?? "Booking", b.start_at ? formatCompactDate(b.start_at) : null]
      .filter(Boolean)
      .join(" · "),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <ClipboardList className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Questionnaires</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Shoot questionnaires</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Send clients a pre-shoot questionnaire (timeline, locations, must-have shots) and read
            their answers here.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <QuestionnaireAdmin questionnaires={questionnaires} bookings={bookingOptions} siteOrigin={siteOrigin} />
      </div>
    </div>
  );
}
