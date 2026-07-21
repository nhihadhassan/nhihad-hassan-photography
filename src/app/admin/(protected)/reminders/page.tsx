import { Check, X } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasGalleryInviteConfig, env } from "@/lib/env";
import { getReminderRules, REMINDER_KINDS } from "@/lib/reminder-rules";
import { RemindersControl } from "@/components/reminders-control";
import { RemindersRules } from "@/components/reminders-rules";
import { formatCompactDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StatusLine({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <Check className="mt-0.5 size-4 shrink-0 text-admin-status-positive" aria-hidden="true" />
      ) : (
        <X className="mt-0.5 size-4 shrink-0 text-admin-status-danger" aria-hidden="true" />
      )}
      <span>
        <span className="font-medium text-admin-ink">{label}</span>
        <span className="text-admin-muted"> {hint}</span>
      </span>
    </li>
  );
}

export default async function AdminRemindersPage() {
  await requireAdmin();
  const admin = getServiceRoleSupabaseClient();
  const [{ data: settingsRow }, rulesMap, { data: log }] = await Promise.all([
    admin.from("site_settings").select("reminders_enabled").limit(1).maybeSingle(),
    getReminderRules(),
    admin.from("reminder_log").select("kind,sent_to,sent_at").order("sent_at", { ascending: false }).limit(8),
  ]);
  const enabled = Boolean(settingsRow?.reminders_enabled);
  const rules = REMINDER_KINDS.map((k) => rulesMap[k]);

  const emailReady = hasGalleryInviteConfig();
  const cronReady = Boolean(env.CRON_SECRET);

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <p className="text-sm font-medium text-admin-accent">Reminders</p>
        <h1 className="admin-display mt-1 text-3xl text-admin-ink">Automated reminders</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-muted">
          Gentle emails sent on a daily schedule so you do not have to chase clients. Edit the rules
          in plain language. Each client gets any given reminder at most the number of times you set.
        </p>
      </div>

      <div className="mt-8">
        <RemindersControl enabled={enabled} />
      </div>

      <section className="mt-8">
        <h2 className="admin-display text-xl text-admin-ink">Rules</h2>
        <div className="mt-4">
          <RemindersRules rules={rules} />
        </div>
      </section>

      {log && log.length > 0 ? (
        <section className="mt-8 rounded-xl border border-admin-line bg-admin-surface p-5">
          <h2 className="text-base font-semibold text-admin-ink">Recent sends</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {log.map((entry, i) => (
              <li key={i} className="flex justify-between gap-4 text-admin-muted">
                <span>{String(entry.kind).split(":")[0].replace(/_/g, " ")}</span>
                <span className="tabular-nums">{entry.sent_at ? formatCompactDate(String(entry.sent_at)) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 rounded-xl border border-admin-line bg-admin-surface p-5">
        <h2 className="text-base font-semibold text-admin-ink">Setup status</h2>
        <ul className="mt-3 space-y-2.5">
          <StatusLine ok={emailReady} label="Email configured" hint={emailReady ? "Reminders can be delivered." : "Set RESEND_API_KEY and SELECTS_NOTIFICATION_FROM to send email."} />
          <StatusLine ok={cronReady} label="Daily schedule" hint={cronReady ? "The CRON_SECRET is set; the daily job is protected and will run." : "Set CRON_SECRET in Vercel so the daily job can run. You can still use Run now."} />
        </ul>
      </section>
    </div>
  );
}
