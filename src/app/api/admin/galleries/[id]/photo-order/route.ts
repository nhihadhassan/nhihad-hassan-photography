import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Sign in as an admin." }, { status: 401 });
  }

  const { id: galleryId } = await params;
  const body = (await request.json().catch(() => null)) as { photo_ids?: unknown } | null;
  const requested = Array.isArray(body?.photo_ids) ? body.photo_ids : [];
  const orderedIds = requested.filter((v): v is string => typeof v === "string" && v.length > 0);
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "No photo order supplied." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: photos, error: readError } = await supabase
    .from("photos")
    .select("id")
    .eq("gallery_id", galleryId);
  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const valid = new Set((photos ?? []).map((p) => p.id));
  const ids = orderedIds.filter((id) => valid.has(id));
  if (ids.length === 0) {
    return NextResponse.json({ error: "No matching photos in this gallery." }, { status: 400 });
  }

  // One statement for the whole order. The function skips rows already in
  // place, so a single nudge writes two rows rather than the whole gallery.
  const { error: writeError } = await supabase.rpc("set_photo_order", {
    p_gallery_id: galleryId,
    p_photo_ids: ids,
  });
  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  const { data: gallery } = await supabase
    .from("galleries")
    .select("slug")
    .eq("id", galleryId)
    .maybeSingle();

  // Only the client-facing routes are revalidated. The admin photos page is
  // deliberately left alone so persisting an order never forces the manager to
  // re-render and re-sign every photo URL.
  if (gallery?.slug) {
    revalidatePath(`/galleries/${gallery.slug}`);
    revalidatePath(`/galleries/${gallery.slug}/view`);
  }

  return NextResponse.json({ ok: true, count: ids.length });
}
