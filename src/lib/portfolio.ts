import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { hasR2Config, hasServiceRoleKey } from "@/lib/env";
import { getSignedReadUrl } from "@/lib/r2";
import { portfolioItems, type PortfolioCategory } from "@/data/photography";

/** Full portfolio_items row (admin-facing). */
export type PortfolioItemRecord = {
  id: string;
  original_key: string;
  web_key: string | null;
  thumbnail_key: string | null;
  title: string;
  category: PortfolioCategory;
  caption: string | null;
  alt: string | null;
  event_date: string | null;
  location: string | null;
  featured: boolean;
  orientation: "portrait" | "landscape" | "square";
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  mime_type: string | null;
  blur_data_url: string | null;
  sort_order: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

export type PortfolioItemWithUrls = PortfolioItemRecord & {
  display_url: string;
  thumbnail_url: string;
};

/**
 * Public-facing shape consumed by PhotoCard and the portfolio pages. Mirrors
 * the old static `PortfolioItem` fields so rendering needs minimal changes.
 */
export type PortfolioCard = {
  id: string;
  title: string;
  category: PortfolioCategory;
  date: string | null;
  location: string | null;
  imageUrl: string;
  alt: string;
  featured: boolean;
  description: string;
  orientation: "portrait" | "landscape" | "square";
};

const PORTFOLIO_COLUMNS =
  "id,original_key,web_key,thumbnail_key,title,category,caption,alt,event_date,location,featured,orientation,width,height,size_bytes,mime_type,blur_data_url,sort_order,is_hidden,created_at,updated_at";

async function attachSignedUrls(
  rows: PortfolioItemRecord[],
): Promise<PortfolioItemWithUrls[]> {
  if (!rows.length) return [];
  if (!hasR2Config()) {
    return rows.map((row) => ({ ...row, display_url: "", thumbnail_url: "" }));
  }
  return Promise.all(
    rows.map(async (row) => {
      const displayKey = row.web_key ?? row.original_key;
      const thumbKey = row.thumbnail_key ?? row.web_key ?? row.original_key;
      const [display_url, thumbnail_url] = await Promise.all([
        getSignedReadUrl(displayKey),
        thumbKey === displayKey ? Promise.resolve("") : getSignedReadUrl(thumbKey),
      ]);
      return { ...row, display_url, thumbnail_url: thumbnail_url || display_url };
    }),
  );
}

function toCard(item: PortfolioItemWithUrls): PortfolioCard {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    date: item.event_date,
    location: item.location,
    // Portfolio cards use the web variant for crispness (small curated set).
    imageUrl: item.display_url,
    alt: item.alt ?? item.title,
    featured: item.featured,
    description: item.caption ?? "",
    orientation: item.orientation,
  };
}

/**
 * Fallback to the static data file when the DB has not been seeded yet. Keeps
 * the public site working before the one-time import runs (and during the
 * deploy that introduces DB-backed portfolio). Static /public images render
 * fine through next/image with the `unoptimized` prop already on PhotoCard.
 */
function staticCards(): PortfolioCard[] {
  return portfolioItems.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    date: item.date,
    location: item.location,
    imageUrl: item.imageUrl,
    alt: item.alt,
    featured: item.featured,
    description: item.description,
    orientation: item.orientation,
  }));
}

/** All visible portfolio items, ordered. */
export async function getPublicPortfolio(): Promise<PortfolioCard[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select(PORTFOLIO_COLUMNS)
    .eq("is_hidden", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0) return staticCards();
  const withUrls = await attachSignedUrls(data as PortfolioItemRecord[]);
  return withUrls.map(toCard);
}

export async function getPublicPortfolioByCategory(
  category: string,
): Promise<PortfolioCard[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select(PORTFOLIO_COLUMNS)
    .eq("is_hidden", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0) {
    return staticCards().filter((c) => c.category === category);
  }
  const withUrls = await attachSignedUrls(
    (data as PortfolioItemRecord[]).filter((r) => r.category === category),
  );
  return withUrls.map(toCard);
}

export async function getFeaturedPortfolio(limit = 6): Promise<PortfolioCard[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select(PORTFOLIO_COLUMNS)
    .eq("is_hidden", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0) {
    return staticCards()
      .filter((c) => c.featured)
      .slice(0, limit);
  }
  const withUrls = await attachSignedUrls(
    (data as PortfolioItemRecord[]).filter((r) => r.featured),
  );
  return withUrls.map(toCard).slice(0, limit);
}

/** Admin: every item including hidden, with signed URLs, for the manager. */
export async function getAdminPortfolio(): Promise<PortfolioItemWithUrls[]> {
  const supabase = hasServiceRoleKey()
    ? getServiceRoleSupabaseClient()
    : await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select(PORTFOLIO_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return attachSignedUrls((data ?? []) as PortfolioItemRecord[]);
}
