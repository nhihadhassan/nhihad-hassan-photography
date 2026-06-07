import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, Check, ExternalLink, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { getBookingByToken } from "@/lib/bookings";
import { DEPOSIT_STATUS_LABELS } from "@/lib/payment-constants";
import { brandConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

const TZ = "America/Toronto";

function money(value: string | null) {
  if (!value) return null;
  return value.trim().startsWith("$") ? value.trim() : `$${value.trim()}`;
}

function formatShoot(startIso: string, endIso: string | null) {
  const start = new Date(startIso);
  const date = start.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  });
  const startTime = start.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
  let time = startTime;
  if (endIso) {
    const end = new Date(endIso);
    time += ` to ${end.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: TZ })}`;
  }
  return { date, time };
}

function Unavailable() {
  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <main className="mx-auto flex min-h-[80dvh] max-w-3xl flex-col justify-center px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to site
        </Link>
        <h1 className="mt-12 font-serif text-5xl leading-[0.95] sm:text-6xl">
          This booking link is unavailable.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink/68">
          The link may have been replaced or removed. Please get in touch if you need a new one.
        </p>
        <div className="mt-8">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition hover:bg-ink/88"
          >
            Contact Nhihad
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm font-medium text-ink/55">{label}</dt>
      <dd className="text-sm text-ink/85">{value}</dd>
    </div>
  );
}

export default async function BookingHubPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) return <Unavailable />;

  const shoot = booking.start_at ? formatShoot(booking.start_at, booking.end_at) : null;
  const total = money(booking.total);
  const deposit = money(booking.deposit);
  const balance = money(booking.balance);

  const depositLabel =
    booking.gallery?.deposit_status && booking.gallery.deposit_status !== "not_requested"
      ? DEPOSIT_STATUS_LABELS[booking.gallery.deposit_status]
      : null;

  const agreement = booking.agreement && !booking.agreement.revoked_at ? booking.agreement : null;
  const galleryReady = booking.gallery?.is_published && booking.gallery.slug;

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to site
        </Link>

        <Reveal>
          <p className="mt-10 text-xs uppercase tracking-[0.22em] text-[#8b6444]">Your booking</p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.95] sm:text-6xl">
            {booking.client_name ? `Hi ${booking.client_name},` : "Your booking is confirmed."}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/68">
            Here is everything for your shoot with {brandConfig.name}. Add it to your calendar, review
            the details, and find your gallery here once it is ready.
          </p>
        </Reveal>

        {/* Shoot summary */}
        <Reveal delay={0.05}>
          <section className="mt-10 rounded-lg border border-ink/12 bg-white/60 p-6">
            <h2 className="font-serif text-2xl">Shoot details</h2>
            <dl className="mt-3 divide-y divide-ink/10">
              {booking.shoot_type ? <Row label="Session" value={booking.shoot_type} /> : null}
              {shoot ? <Row label="Date" value={shoot.date} /> : null}
              {shoot ? <Row label="Time" value={shoot.time} /> : null}
              {booking.location ? <Row label="Location" value={booking.location} /> : null}
              {total ? <Row label="Total" value={total} /> : null}
              {deposit ? <Row label="Deposit (25%)" value={deposit} /> : null}
              {balance ? <Row label="Balance due" value={balance} /> : null}
              {depositLabel ? <Row label="Deposit status" value={depositLabel} /> : null}
            </dl>

            {booking.start_at ? (
              <a
                href={`/booking/${booking.token}/calendar`}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition hover:bg-ink/88"
              >
                <CalendarPlus className="size-4" aria-hidden="true" />
                Add to calendar
              </a>
            ) : null}

            {booking.location ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`}
                target="_blank"
                rel="noreferrer"
                className="ml-3 mt-6 inline-flex items-center gap-2 rounded-full border border-ink/18 px-5 py-3 text-sm font-medium text-ink transition hover:border-ink/35"
              >
                <MapPin className="size-4" aria-hidden="true" />
                Map
              </a>
            ) : null}
          </section>
        </Reveal>

        {/* Contract */}
        {agreement ? (
          <Reveal delay={0.05}>
            <section className="mt-6 rounded-lg border border-ink/12 bg-white/60 p-6">
              <h2 className="font-serif text-2xl">Booking agreement</h2>
              {agreement.signed_at ? (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#5f7a52]">
                  <Check className="size-4" aria-hidden="true" />
                  Signed. Thank you.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-7 text-ink/68">
                    Please review and sign your booking agreement to confirm your date.
                  </p>
                  <Link
                    href={`/agreement/${agreement.token}`}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition hover:bg-ink/88"
                  >
                    Review and sign
                  </Link>
                </>
              )}
            </section>
          </Reveal>
        ) : null}

        {/* Gallery */}
        {galleryReady ? (
          <Reveal delay={0.05}>
            <section className="mt-6 rounded-lg border border-ink/12 bg-white/60 p-6">
              <h2 className="font-serif text-2xl">Your gallery</h2>
              <p className="mt-3 text-sm leading-7 text-ink/68">Your photos are ready to view.</p>
              <Link
                href={`/galleries/${booking.gallery!.slug}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition hover:bg-ink/88"
              >
                View your gallery
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </section>
          </Reveal>
        ) : null}

        {booking.notes ? (
          <Reveal delay={0.05}>
            <section className="mt-6 rounded-lg border border-ink/12 bg-white/60 p-6">
              <h2 className="font-serif text-2xl">A note from Nhihad</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/75">{booking.notes}</p>
            </section>
          </Reveal>
        ) : null}

        <Reveal delay={0.05}>
          <p className="mt-10 text-sm text-ink/55">
            Questions about your shoot?{" "}
            <Link href="/contact" className="font-medium text-ink underline-offset-4 hover:underline">
              Get in touch
            </Link>
            .
          </p>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
