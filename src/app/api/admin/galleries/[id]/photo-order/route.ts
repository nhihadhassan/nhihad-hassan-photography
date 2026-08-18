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
    .select("id,sort_order")
    .eq("gallery_id", galleryId);
  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const current = new Map((photos ?? []).map((p) => [p.id, p.sort_order]));
  const ids = orderedIds.filter((id) => current.has(id));
  if (ids.length === 0) {
    return NextResponse.json({ error: "No matching photos in this gallery." }, { status: 400 });
  }

  // Only rows whose position actually moved are written, so a single nudge
  // costs two updates rather than one per photo in the gallery.
  const changed = ids
    .map((id, index) => ({ id, index }))
    .filter(({ id, index }) => current.get(id) !== index);

  for (const { id, index } of changed) {
    const { error } = await supabase.from("photos").update({ sort_order: index }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
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

  return NextResponse.json({ ok: true, updated: changed.length });
}
