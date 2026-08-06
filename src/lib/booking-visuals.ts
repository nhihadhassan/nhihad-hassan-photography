import "server-only";
import { portfolioItems } from "@/data/photography";
import { services } from "@/data/services";
import { getPublicPortfolio, type PortfolioCard } from "@/lib/portfolio";

export type BookingVisual = PortfolioCard & {
  focalPosition: string;
};

const BOOKING_VISUALS: Record<string, { imageId: string; focalPosition: string }> = {
  weddings: { imageId: "engagement-the-lift", focalPosition: "50% 42%" },
  engagements: { imageId: "engagement-the-lift", focalPosition: "50% 42%" },
  couples: { imageId: "engagement-the-lift", focalPosition: "50% 42%" },
  portraits: { imageId: "rachel-autumn-leaves", focalPosition: "52% 58%" },
  events: { imageId: "choyons-grad-couple", focalPosition: "50% 42%" },
  nightlife: { imageId: "moove-dj-floor", focalPosition: "50% 48%" },
};

/**
 * Resolve a wide, full-resolution image and a deliberate crop for each booking
 * service. Database-backed portfolio images use their 2400px web variant;
 * static files remain a safe fallback during local development.
 */
export async function getBookingVisual(categoryId: string): Promise<BookingVisual | null> {
  const portfolio = await getPublicPortfolio();
  const configured = BOOKING_VISUALS[categoryId];
  const serviceId = categoryId === "engagements" ? "couples" : categoryId;
  const service = services.find((item) => item.id === serviceId);
  const imageId = configured?.imageId ?? service?.imageId;
  const image = portfolio.find((item) => item.id === imageId);

  if (image) {
    return {
      ...image,
      focalPosition: configured?.focalPosition ?? "50% 50%",
    };
  }

  const fallback = portfolioItems.find((item) => item.id === imageId);
  return fallback
    ? {
        ...fallback,
        focalPosition: configured?.focalPosition ?? "50% 50%",
      }
    : null;
}
