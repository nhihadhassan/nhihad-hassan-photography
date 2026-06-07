import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ExternalLink,
  MapPin,
  PenLine,
  Wallet,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { getBookingByToken } from "@/lib/bookings";
import { brandConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

const TZ = "America/Toronto";

function money(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
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
      <main className="mx-auto flex min-h-[80dvh] max-w-3xl flex-col justify-center px-5 py-16 sm:px-6">
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

function Card({
  children,
  delay,
  title,
  icon,
}: {
  children: React.ReactNode;
  delay?: number;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <Reveal delay={delay}>
      <section className="rounded-xl border border-ink/12 bg-white/60 p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition duration-300 hover:border-ink/20 hover:shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] sm:p-7">
        <div className="flex items-center gap-2.5">
          {icon ? <span className="text-[#8b6444]">{icon}</span> : null}
          <h2 className="font-serif text-2xl leading-none text-ink">{title}</h2>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </Reveal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/8 py-3 last:border-0">
      <dt className="text-sm text-ink/55">{label}</dt>
      <dd className="text-sm font-medium text-ink/90">{value}</dd>
    </div>
  );
}

function btnPrimary() {
  return "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-soft-white transition duration-200 hover:bg-ink/88 hover:-translate-y-0.5 active:translate-y-0";
}
function btnGhost() {
  return "inline-flex items-center justify-center gap-2 rounded-full border border-ink/18 px-5 py-3 text-sm font-medium text-ink transition duration-200 hover:border-ink/35 hover:-translate-y-0.5 active:translate-y-0";
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
  const hasMoney = Boolean(total || deposit || balance);
  const depositSettled =
    booking.gallery?.deposit_status === "paid" || booking.gallery?.deposit_status === "received";

  const agreement = booking.agreement && !booking.agreement.revoked_at ? booking.agreement : null;
  const galleryReady = booking.gallery?.is_published && booking.gallery.slug;

  return (
    <div className="min-h-[100dvh] bg-[#f3eee5] text-ink">
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-14 sm:px-6">
        <Reveal>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink/55 transition hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to site
          </Link>
        </Reveal>

        <Reveal delay={0.05}>
          <p className="mt-12 text-xs uppercase tracking-[0.22em] text-[#8b6444]">Your booking</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.02] sm:text-5xl">
            {booking.client_name ? `Hi ${booking.client_name},` : "Your booking is confirmed."}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink/65">
            Here is everything for your shoot with {brandConfig.name}. Add it to your calendar,
            review the details, and find your gallery here once it is ready.
          </p>
        </Reveal>

        <div className="mt-10 space-y-5">
          {/* Shoot details */}
          <Card title="Shoot details" delay={0.1}>
            <dl>
              {booking.shoot_type ? <DetailRow label="Session" value={booking.shoot_type} /> : null}
              {shoot ? <DetailRow label="Date" value={shoot.date} /> : null}
              {shoot ? <DetailRow label="Time" value={shoot.time} /> : null}
              {booking.location ? <DetailRow label="Location" value={booking.location} /> : null}
            </dl>

            {booking.start_at || booking.location ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {booking.start_at ? (
                  <a href={`/booking/${booking.token}/calendar`} className={btnPrimary()}>
                    <CalendarPlus className="size-4" aria-hidden="true" />
                    Add to calendar
                  </a>
                ) : null}
                {booking.location ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={btnGhost()}
                  >
                    <MapPin className="size-4" aria-hidden="true" />
                    Map
                  </a>
                ) : null}
              </div>
            ) : null}
          </Card>

          {/* Payment */}
          {hasMoney ? (
            <Card title="Payment" delay={0.15} icon={<Wallet className="size-5" aria-hidden="true" />}>
              <dl className="divide-y divide-ink/8">
                {deposit ? (
                  <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
                    <dt className="text-sm text-ink/65">
                      Owed now <span className="text-ink/40">(deposit, 25%)</span>
                    </dt>
                    <dd className="font-serif text-xl text-ink">{deposit}</dd>
                  </div>
                ) : null}
                {balance ? (
                  <div className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-sm text-ink/65">Owed after the shoot</dt>
                    <dd className="font-serif text-xl text-ink">{balance}</dd>
                  </div>
                ) : null}
                {total ? (
                  <div className="flex items-baseline justify-between gap-4 py-3 last:pb-0">
                    <dt className="text-sm font-medium text-ink/80">Grand total</dt>
                    <dd className="font-serif text-2xl text-ink">{total}</dd>
                  </div>
                ) : null}
              </dl>

              {depositSettled ? (
                <p className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#5f7a52]/10 px-4 py-3 text-sm leading-6 text-[#48603e]">
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  Deposit received, thank you.
                  {balance ? ` The ${balance} balance is due on or before the shoot day.` : ""}
                </p>
              ) : deposit ? (
                <p className="mt-5 rounded-md border border-[#8b6444]/25 bg-[#8b6444]/[0.06] px-4 py-3 text-sm leading-6 text-ink/75">
                  To reserve your date, please e-transfer the deposit of{" "}
                  <strong className="text-ink">{deposit}</strong> to{" "}
                  <a
                    href={`mailto:${brandConfig.contactEmail}`}
                    className="font-medium text-ink underline underline-offset-2 hover:text-[#8b6444]"
                  >
                    {brandConfig.contactEmail}
                  </a>
                  .{balance ? ` The remaining ${balance} is due on or before the shoot day.` : ""}
                </p>
              ) : null}
            </Card>
          ) : null}

          {/* Contract */}
          {agreement ? (
            <Card title="Booking agreement" delay={0.2} icon={<PenLine className="size-5" aria-hidden="true" />}>
              {agreement.signed_at ? (
                <p className="inline-flex items-center gap-2 text-sm text-[#48603e]">
                  <Check className="size-4" aria-hidden="true" />
                  Signed. Thank you.
                </p>
              ) : (
                <>
                  <p className="text-sm leading-7 text-ink/68">
                    Please review and sign your booking agreement to confirm your date.
                  </p>
                  <Link href={`/agreement/${agreement.token}`} className={`mt-5 ${btnPrimary()}`}>
                    Review and sign
                  </Link>
                </>
              )}
            </Card>
          ) : null}

          {/* Gallery */}
          {galleryReady ? (
            <Card title="Your gallery" delay={0.25}>
              <p className="text-sm leading-7 text-ink/68">Your photos are ready to view.</p>
              <Link href={`/galleries/${booking.gallery!.slug}`} className={`mt-5 ${btnPrimary()}`}>
                View your gallery
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </Card>
          ) : null}

          {/* Note */}
          {booking.notes ? (
            <Card title="A note from Nhihad" delay={0.3}>
              <p className="whitespace-pre-line text-sm leading-7 text-ink/75">{booking.notes}</p>
            </Card>
          ) : null}
        </div>

        <Reveal delay={0.1}>
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
