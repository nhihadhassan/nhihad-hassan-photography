import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight admin check used by the live-site edit mode. Kept out of the page
 * render path (the client fetches it after load) so public pages stay static.
 */
export async function GET() {
  try {
    const admin = await getAdminUser();
    return NextResponse.json({ isAdmin: Boolean(admin) });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
