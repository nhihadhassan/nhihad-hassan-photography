import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runReminders } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily reminder job. Protected by CRON_SECRET: Vercel Cron sends it as a Bearer
 * token automatically when the env var is set. Returns 401 if the secret is
 * missing or wrong, so the endpoint can't be triggered by anyone else.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 401 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summary = await runReminders();
  return NextResponse.json(summary);
}
