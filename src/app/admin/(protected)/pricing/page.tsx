import { Tag } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getPricing } from "@/lib/pricing";
import { PricingEditor } from "@/components/pricing-editor";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await requireAdmin();
  const categories = await getPricing();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <Tag className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Pricing</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Pricing</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Edit the packages, prices, and descriptions shown on your public pricing page. Changes
            appear on the site within a minute.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <PricingEditor content={categories} />
      </div>
    </div>
  );
}
