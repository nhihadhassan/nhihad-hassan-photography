import { requireAdmin } from "@/lib/auth";
import { getAdminPageBlocks } from "@/lib/page-blocks";
import { SectionsManager } from "@/components/sections-manager";

export const dynamic = "force-dynamic";

export default async function AdminSectionsPage() {
  await requireAdmin();
  const blocks = await getAdminPageBlocks("home");

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-admin-accent">Homepage</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Custom sections</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
        Add your own sections to the homepage and arrange their order. They appear near the bottom,
        above the closing call to action. Your main sections stay as designed.
      </p>
      <div className="mt-8">
        <SectionsManager initialBlocks={blocks} pageSlug="home" />
      </div>
    </div>
  );
}
