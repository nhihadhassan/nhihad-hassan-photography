import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminJournalPost } from "@/lib/journal";
import { JournalEditor } from "@/components/journal-editor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminJournalEditorPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const post = await getAdminJournalPost(id);
  if (!post) notFound();

  return <JournalEditor record={post.record} coverUrl={post.coverUrl} />;
}
