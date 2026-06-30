import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminJournalPost } from "@/lib/journal";
import { getAdminPortfolio } from "@/lib/portfolio";
import { JournalEditor, type JournalPortfolioPhoto } from "@/components/journal-editor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminJournalEditorPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const [post, portfolio] = await Promise.all([getAdminJournalPost(id), getAdminPortfolio()]);
  if (!post) notFound();

  const portfolioPhotos: JournalPortfolioPhoto[] = portfolio
    .map((p) => ({
      key: p.web_key ?? p.original_key,
      url: p.thumbnail_url || p.display_url,
      title: p.title,
    }))
    .filter((p) => p.key && p.url);

  return (
    <JournalEditor record={post.record} coverUrl={post.coverUrl} portfolioPhotos={portfolioPhotos} />
  );
}
