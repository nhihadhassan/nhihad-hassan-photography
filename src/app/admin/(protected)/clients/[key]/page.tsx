import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getClientByKey, type ClientProfile } from "@/lib/clients";
import { DEPOSIT_STATUS_LABELS } from "@/lib/payment-constants";
import { formatCompactDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TZ = "America/Toronto";

function shootDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

type TimelineItem = { date: string; title: string; detail?: string; href?: string };

function buildTimeline(p: ClientProfile): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const i of p.inquiries) {
    items.push({ date: i.created_at, title: "Inquiry", detail: i.event_type ?? undefined, href: "/admin/inquiries" });
  }
  for (const b of p.bookings) {
    items.push({ date: b.created_at, title: "Booking created", detail: b.shoot_type ?? undefined, href: `/admin/bookings/${b.id}` });
  }
  for (const g of p.galleries) {
    items.push({ date: g.created_at, title: "Gallery created", detail: g.title, href: `/admin/galleries/${g.id}` });
  }
  for (const a of p.agreements) {
    if (a.signed_at) items.push({ date: a.signed_at, title: "Agreement signed", href: `/agreement/${a.token}` });
    else if (a.sent_at) items.push({ date: a.sent_at, title: "Agreement sent", href: `/agreement/${a.token}` });
  }
  for (const r of p.reviews) {
    items.push({ date: r.review_date, title: `Review (${r.rating}/5)`, detail: r.approved ? "Public" : "Hidden" });
  }
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-admin-ink/10 bg-admin-surface px-4 py-3">
      <p className="text-xs text-admin-ink/55">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-admin-ink/10 bg-admin-surface p-5">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 divide-y divide-admin-ink/10">{children}</div>
    </section>
  );
}

export default async function ClientProfilePage({ params }: { params: Promise<{ key: string }> }) {
  await requireAdmin();
  const { key } = await params;
  const profile = await getClientByKey(decodeURIComponent(key));
  if (!profile) notFound();

  const timeline = buildTimeline(profile);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-admin-ink/60 hover:text-admin-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Clients
      </Link>

      <div className="mt-5">
        <h1 className="text-3xl font-semibold tracking-tight">{profile.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-admin-ink/65">
          {profile.email ? (
            <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:text-admin-accent">
              <Mail className="size-3.5" aria-hidden="true" />
              {profile.email}
            </a>
          ) : null}
          {profile.phone ? (
            <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-1.5 hover:text-admin-accent">
              <Phone className="size-3.5" aria-hidden="true" />
              {profile.phone}
            </a>
          ) : null}
        </div>
      </div>

      {/* At a glance */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Next shoot" value={profile.nextShootAt ? shootDateTime(profile.nextShootAt) : "None scheduled"} />
        <Stat label="Outstanding balance" value={profile.outstandingBalance > 0 ? formatMoney(profile.outstandingBalance) : "$0"} />
        <Stat label="Bookings" value={String(profile.bookings.length)} />
        <Stat label="Galleries" value={String(profile.galleries.length)} />
      </div>

      <div className="mt-6 grid gap-5">
        {profile.bookings.length ? (
          <Section title="Bookings">
            {profile.bookings.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition hover:text-admin-accent">
                <span className="font-medium">{b.shoot_type ?? "Booking"}</span>
                <span className="text-admin-ink/55">
                  {b.start_at ? shootDateTime(b.start_at) : "No date"}
                  {b.total ? ` · ${b.total.startsWith("$") ? b.total : `$${b.total}`}` : ""}
                  {b.agreement?.signed_at ? " · Signed" : ""}
                </span>
              </Link>
            ))}
          </Section>
        ) : null}

        {profile.galleries.length ? (
          <Section title="Galleries">
            {profile.galleries.map((g) => (
              <Link key={g.id} href={`/admin/galleries/${g.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition hover:text-admin-accent">
                <span className="font-medium">{g.title}</span>
                <span className="text-admin-ink/55">
                  {formatCompactDate(g.event_date)} · {g.is_published ? "Published" : "Draft"} · {DEPOSIT_STATUS_LABELS[g.deposit_status]}
                </span>
              </Link>
            ))}
          </Section>
        ) : null}

        {profile.agreements.length ? (
          <Section title="Contracts">
            {profile.agreements.map((a) => (
              <Link key={a.id} href={`/agreement/${a.token}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition hover:text-admin-accent">
                <span className="font-medium">Booking agreement</span>
                <span className="text-admin-ink/55">
                  {a.revoked_at ? "Revoked" : a.signed_at ? `Signed ${formatCompactDate(a.signed_at)}` : a.viewed_at ? "Viewed, not signed" : "Sent"}
                </span>
              </Link>
            ))}
          </Section>
        ) : null}

        {profile.inquiries.length ? (
          <Section title="Inquiries">
            {profile.inquiries.map((i) => (
              <div key={i.id} className="py-3 text-sm">
                <p className="font-medium">
                  {i.event_type ?? "Inquiry"} · <span className="font-normal text-admin-ink/55">{formatCompactDate(i.created_at)}</span>
                </p>
                <p className="mt-1 line-clamp-2 text-admin-ink/65">{i.message}</p>
              </div>
            ))}
          </Section>
        ) : null}

        {profile.reviews.length ? (
          <Section title="Reviews">
            {profile.reviews.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium">{r.rating}/5 stars</span>
                <span className="text-admin-ink/55">
                  {formatCompactDate(r.review_date)} · {r.approved ? "Public" : "Hidden"}
                </span>
              </div>
            ))}
          </Section>
        ) : null}

        {timeline.length ? (
          <Section title="Activity">
            {timeline.map((t, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span>
                  {t.href ? (
                    <Link href={t.href} className="font-medium hover:text-admin-accent">
                      {t.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{t.title}</span>
                  )}
                  {t.detail ? <span className="text-admin-ink/55"> · {t.detail}</span> : null}
                </span>
                <span className="text-admin-ink/45">{formatCompactDate(t.date)}</span>
              </div>
            ))}
          </Section>
        ) : null}
      </div>
    </div>
  );
}
