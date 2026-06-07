import { requireAdmin } from "@/lib/auth";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { BookingForm } from "@/components/booking-form";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  await requireAdmin();
  const [galleries, agreementRequests] = await Promise.all([
    getAdminGalleries(),
    getAdminAgreementRequests(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-admin-accent">Bookings</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">New booking</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
        Fill in the shoot details. After saving you get a booking link to send the client.
      </p>
      <div className="mt-8">
        <BookingForm mode="create" galleries={galleries} agreementRequests={agreementRequests} />
      </div>
    </div>
  );
}
