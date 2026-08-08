import { MessageSquareText } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminGalleries } from "@/lib/admin-data";
import { getAdminClientReviews, getAdminReviewRequests } from "@/lib/reviews";
import { getSiteSettings } from "@/lib/site-settings";
import { siteUrl } from "@/lib/seo";
import { getGoogleBusinessConnection, isGoogleBusinessConfigured } from "@/lib/google-business";
import { ReviewAdmin } from "@/components/review-admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ google_connected?: string; google_error?: string }>;
};

export default async function AdminReviewsPage({ searchParams }: Props) {
  await requireAdmin();
  const query = await searchParams;

  const [galleries, requests, reviews, settings, connection] = await Promise.all([
    getAdminGalleries(),
    getAdminReviewRequests(),
    getAdminClientReviews(),
    getSiteSettings(),
    getGoogleBusinessConnection(),
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
            Google Business Profile is the source of truth for real reviews. Send request links,
            sync what&apos;s on Google, then choose what shows on the public site.
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
          connection={connection}
          isGoogleConfigured={isGoogleBusinessConfigured()}
          connectedNotice={query.google_connected}
          errorNotice={query.google_error}
        />
      </div>
    </div>
  );
}
