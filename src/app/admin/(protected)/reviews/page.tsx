import { MessageSquareText } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminClientReviews, getAdminReviewRequests } from "@/lib/reviews";
import { getSiteSettings } from "@/lib/site-settings";
import { siteUrl } from "@/lib/seo";
import { ReviewAdmin } from "@/components/review-admin";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireAdmin();

  const [galleries, requests, reviews, settings] = await Promise.all([
    getAdminGalleries(),
    getAdminReviewRequests(),
    getAdminClientReviews(),
    getSiteSettings(),
  ]);

  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || siteUrl;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-copper/15">
          <MessageSquareText className="size-5 text-admin-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-admin-accent">Client reviews</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Reviews</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-admin-ink/60">
            Create neutral Google-first review request links, then manually import and approve real
            Google reviews for the public site.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ReviewAdmin
          galleries={galleries}
          requests={requests}
          reviews={reviews}
          siteOrigin={siteOrigin}
          googleReviewUrl={settings.googleReviewUrl}
        />
      </div>
    </div>
  );
}
