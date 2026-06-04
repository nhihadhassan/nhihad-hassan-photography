import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/**
 * Resolve a public journal slug to its editor. Used by the on-page "Edit post"
 * pencil, which only knows the slug. If the post has not been imported into the
 * database yet, fall back to the journal list (where the import button lives).
 */
export default async function JournalBySlugRedirect({ params }: Props) {
  await requireAdmin();
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("journal_posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (data?.id) redirect(`/admin/journal/${data.id}`);
  redirect("/admin/journal");
}
