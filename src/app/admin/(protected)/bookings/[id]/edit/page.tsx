import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminAgreementRequests } from "@/lib/agreements";
import { getBookingById } from "@/lib/bookings";
import { BookingForm } from "@/components/booking-form";

export const dynamic = "force-dynamic";

export default async function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [booking, galleries, agreementRequests] = await Promise.all([
    getBookingById(id),
    getAdminGalleries(),
    getAdminAgreementRequests(),
  ]);
  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/admin/bookings/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-admin-muted hover:text-admin-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to workspace
      </Link>
      <h1 className="admin-display mt-3 text-3xl text-admin-ink">Edit booking</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
        Update the shoot details, link a gallery or signing request, or adjust the note your client sees.
      </p>
      <div className="mt-8">
        <BookingForm
          mode="edit"
          booking={booking}
          galleries={galleries}
          agreementRequests={agreementRequests}
        />
      </div>
    </div>
  );
}
