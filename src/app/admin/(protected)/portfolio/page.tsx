import { requireAdmin } from "@/lib/auth";
import { getAdminPortfolio } from "@/lib/portfolio";
import { PortfolioManager } from "@/components/portfolio-manager";
import { ImportLegacyPortfolioButton } from "@/components/import-legacy-portfolio-button";
import { portfolioItems } from "@/data/photography";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
  await requireAdmin();
  const items = await getAdminPortfolio();
  // Offer the one-time import until at least the original set is in the DB.
  const needsImport = items.length < portfolioItems.length;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-medium text-admin-accent">Portfolio</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Portfolio photos</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
        Upload, organize, and edit the photos shown on your public portfolio. Mark photos as
        featured to surface them on the homepage. Changes appear on the site within a few minutes.
      </p>
      {needsImport ? (
        <div className="mt-6">
          <ImportLegacyPortfolioButton />
        </div>
      ) : null}
      <div className="mt-8">
        <PortfolioManager initialItems={items} />
      </div>
    </div>
  );
}
