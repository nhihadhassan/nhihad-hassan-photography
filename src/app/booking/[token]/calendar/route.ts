import { getBookingByToken } from "@/lib/bookings";
import { buildICS } from "@/lib/ics";
import { brandConfig } from "@/lib/config";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking || !booking.start_at) {
    return new Response("Not found", { status: 404 });
  }

  const start = new Date(booking.start_at);
  const end = booking.end_at ? new Date(booking.end_at) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;

  const summaryType = booking.shoot_type ? booking.shoot_type : "Photo shoot";
  const descriptionLines = [
    `Photo shoot with ${brandConfig.name}.`,
    booking.location ? `Location: ${booking.location}` : "",
    `Booking details: ${origin}/booking/${booking.token}`,
  ].filter(Boolean);

  const ics = buildICS({
    uid: `${booking.id}@nhihadhassan.ca`,
    start,
    end,
    summary: `${summaryType} with ${brandConfig.name}`,
    location: booking.location ?? undefined,
    description: descriptionLines.join("\n"),
    organizerName: brandConfig.name,
    organizerEmail: brandConfig.contactEmail,
    url: `${origin}/booking/${booking.token}`,
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="shoot.ics"',
      "Cache-Control": "no-store",
    },
  });
}
