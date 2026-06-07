import { BellRing, Check, X } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasGalleryInviteConfig } from "@/lib/env";
import { env } from "@/lib/env";
import { RemindersControl } from "@/components/reminders-control";

export const dynamic = "force-dynamic";

const REMINDERS = [
  { name: "Deposit reminder", detail: "A booked client with no recorded payment yet, while the shoot is still upcoming." },
  { name: "Balance reminder", detail: "When a shoot is within four days and money is still outstanding." },
  { name: "Gallery expiring", detail: "A published gallery whose link expires within seven days, so the client downloads in time." },
  { name: "Review request", detail: "A delivered booking whose shoot was over a week ago (needs your Google review link set)." },
];

function StatusLine({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <Check className="mt-0.5 size-4 shrink-0 text-admin-success" aria-hidden="true" />
      ) : (
        <X className="mt-0.5 size-4 shrink-0 text-admin-danger" aria-hidden="true" />
      )}
      <span>
        <span className="font-medium text-admin-ink">{label}</span>
        <span className="text-admin-ink/55"> {hint}</span>
      </span>
    </li>
  );
}

export default async function AdminRemindersPage() {
  await requireAdmin();
  const admin = getServiceRoleSupabaseClient();
  const { data } = await admin.from("site_settings").select("reminders_enabled").limit(1).maybeSingle();
  const enabled = Boolean(data?.reminders_enabled);

  const emailReady = hasGalleryInviteConfig();
  const cronReady = Boolean(env.CRON_SECRET);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <BellRing className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Reminders</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Automated reminders</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Gentle emails sent on a daily schedule so you do not have to chase clients. Each client
            gets any given reminder at most once.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <RemindersControl enabled={enabled} />
      </div>

      <section className="mt-8 rounded-md border border-admin-ink/10 bg-admin-surface p-5">
        <h2 className="text-base font-semibold tracking-tight">What gets sent</h2>
        <ul className="mt-3 space-y-3">
          {REMINDERS.map((r) => (
            <li key={r.name} className="text-sm">
              <p className="font-medium text-admin-ink">{r.name}</p>
              <p className="mt-0.5 text-admin-ink/55">{r.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-md border border-admin-ink/10 bg-admin-surface p-5">
        <h2 className="text-base font-semibold tracking-tight">Setup status</h2>
        <ul className="mt-3 space-y-2.5">
          <StatusLine ok={emailReady} label="Email configured" hint={emailReady ? "Reminders can be delivered." : "Set RESEND_API_KEY and SELECTS_NOTIFICATION_FROM to send email."} />
          <StatusLine ok={cronReady} label="Daily schedule" hint={cronReady ? "The CRON_SECRET is set; the daily job is protected and will run." : "Set CRON_SECRET in Vercel so the daily job can run. You can still use Run now."} />
        </ul>
      </section>
    </div>
  );
}
